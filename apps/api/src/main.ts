import express from 'express';
import cors from 'cors';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { readDb, writeDb, syncProjectMembers, getNextProjectCode, getNextWorkItemCode, type User, type Project, type WorkItem, type ProjectMember, type GlobalMember, type GlobalMemberRole, type DateExtension, type SessionRecord } from './data/store';

const app = express();

// Aislamiento CORS estricto
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : [
      'http://localhost:5173',
      'http://localhost:4173',
      'http://localhost:80',
      'http://localhost',
      'https://nexus.mexicocentral.cloudapp.azure.com'
    ];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Bloqueado por política CORS'));
  },
  credentials: true
}));

app.use(express.json({ limit: '1mb' }));

const sessionStore = new Map<string, { userId: string; createdAt: number; expiresAt: number }>();
const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 horas de validez

// Inicializar sesiones legítimas persistidas en DB al arrancar
function initSessionsFromDb() {
  try {
    const db = readDb();
    if (Array.isArray(db.sessions)) {
      const now = Date.now();
      db.sessions.forEach((s) => {
        if (s && s.token && s.expiresAt > now) {
          sessionStore.set(s.token, { userId: s.userId, createdAt: s.createdAt, expiresAt: s.expiresAt });
        }
      });
    }
  } catch (err) {
    console.error('Error al inicializar almacén de sesiones:', err);
  }
}
initSessionsFromDb();

// Rate Limiter para Login (5 intentos cada 15 minutos)
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

// Purgado periódico de memoria para prevenir fugas en loginAttempts
setInterval(() => {
  const now = Date.now();
  for (const [ip, attempt] of loginAttempts.entries()) {
    if (attempt.resetAt <= now) {
      loginAttempts.delete(ip);
    }
  }
}, 10 * 60 * 1000).unref();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

const registerSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Formato de correo electrónico inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  role: z.enum(['owner', 'admin', 'member']).default('member'),
  organization: z.string().optional()
});

const memberRoleSchema = z.enum(['admin', 'collaborator', 'vendor', 'viewer']);

const dateExtensionSchema = z.object({
  newTargetDate: z.string().min(1, 'La nueva fecha es obligatoria'),
  reason: z.string().min(3, 'El motivo o justificación es obligatorio'),
  requestedBy: z.string().optional(),
  approvedBy: z.string().optional()
});

const createGlobalMemberSchema = z.object({
  name: z.string().min(1, 'El nombre o entidad es obligatorio'),
  role: memberRoleSchema.default('collaborator'),
  email: z.string().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  organization: z.string().optional().or(z.literal('')),
  createAccount: z.boolean().optional(),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres').optional().or(z.literal('')),
  userRole: z.enum(['admin', 'member']).optional()
});

const updateGlobalMemberSchema = z.object({
  name: z.string().min(1, 'El nombre o entidad no puede estar vacío').optional(),
  role: memberRoleSchema.optional(),
  email: z.string().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  organization: z.string().optional().or(z.literal(''))
});

const projectMemberSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'El nombre es obligatorio'),
  role: memberRoleSchema.default('collaborator'),
  email: z.string().optional()
});

const createMemberSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  role: memberRoleSchema.default('collaborator'),
  email: z.string().optional()
});

const updateMemberSchema = z.object({
  name: z.string().min(1).optional(),
  role: memberRoleSchema.optional(),
  email: z.string().optional()
});

const projectPhaseSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  targetDate: z.string().min(1),
  startDate: z.string().optional(),
  status: z.enum(['pending', 'in_progress', 'completed']).default('pending'),
  order: z.number().optional()
});

const projectSchema = z.object({
  code: z.string().optional(),
  name: z.string().min(2),
  description: z.string().optional(),
  template: z.enum(['kanban', 'scrum', 'pmi', 'custom']),
  status: z.enum(['preproject', 'review', 'execution', 'completed', 'discarded']).default('preproject'),
  role: z.enum(['lead', 'collaborator']).default('lead'),
  space: z.enum(['work', 'personal']).default('work'),
  organization: z.string().optional(),
  admins: z.array(z.string()).optional(),
  members: z.array(z.string()).optional(),
  teamMembers: z.array(projectMemberSchema).optional(),
  startDate: z.string().optional(),
  targetDate: z.string().optional(),
  originalTargetDate: z.string().optional(),
  hasPhases: z.boolean().optional(),
  phases: z.array(projectPhaseSchema).optional()
});

const projectStatusSchema = z.object({
  status: z.enum(['preproject', 'review', 'execution', 'completed', 'discarded'])
});

const taskProgressEntrySchema = z.object({
  id: z.string(),
  text: z.string().min(1),
  author: z.string().min(1),
  createdAt: z.string()
});

const workItemSchema = z.object({
  code: z.string().optional(),
  projectId: z.string().min(1),
  title: z.string().min(2),
  description: z.string().optional(),
  type: z.enum(['epic', 'story', 'task', 'bug', 'risk', 'milestone']),
  status: z.enum(['backlog', 'in_progress', 'review', 'done']).default('backlog'),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  assignee: z.string().optional(),
  assignees: z.array(z.string()).optional(),
  assigneeType: z.enum(['me', 'team', 'vendor']).default('me'),
  startDate: z.string().optional(),
  dueDate: z.string().optional(),
  completionType: z.enum(['full', 'partial']).optional(),
  completionReport: z.string().optional(),
  closeType: z.enum(['completed', 'canceled', 'discarded', 'superseded']).optional(),
  replacedBy: z.string().optional(),
  continuationTaskId: z.string().optional(),
  completedAt: z.string().optional(),
  closedAt: z.string().optional(),
  closedBy: z.string().optional(),
  progressLogs: z.array(taskProgressEntrySchema).optional(),
  phaseIds: z.array(z.string()).optional()
});

const workItemUpdateSchema = z.object({
  code: z.string().optional(),
  projectId: z.string().min(1).optional(),
  title: z.string().min(2).optional(),
  description: z.string().optional(),
  type: z.enum(['epic', 'story', 'task', 'bug', 'risk', 'milestone']).optional(),
  status: z.enum(['backlog', 'in_progress', 'review', 'done']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  assignee: z.string().optional(),
  assignees: z.array(z.string()).optional(),
  assigneeType: z.enum(['me', 'team', 'vendor']).optional(),
  startDate: z.string().optional(),
  dueDate: z.string().optional(),
  completionType: z.enum(['full', 'partial']).optional(),
  completionReport: z.string().optional(),
  closeType: z.enum(['completed', 'canceled', 'discarded', 'superseded']).optional(),
  replacedBy: z.string().optional(),
  continuationTaskId: z.string().optional(),
  completedAt: z.string().optional(),
  closedAt: z.string().optional(),
  closedBy: z.string().optional(),
  progressLogs: z.array(taskProgressEntrySchema).optional(),
  phaseIds: z.array(z.string()).optional()
});

const workItemStatusSchema = z.object({
  status: z.enum(['backlog', 'in_progress', 'review', 'done']),
  closeType: z.enum(['completed', 'canceled', 'discarded', 'superseded']).optional(),
  completionReport: z.string().optional(),
  completionType: z.enum(['full', 'partial']).optional(),
  replacedBy: z.string().optional(),
  closedBy: z.string().optional()
});

function getToken(req: express.Request): string | undefined {
  const header = req.headers.authorization;
  if (!header) return undefined;
  return header.startsWith('Bearer ') ? header.slice(7) : undefined;
}

function getCurrentUser(req: express.Request): User | null {
  const token = getToken(req);
  if (!token) return null;

  const now = Date.now();
  let session = sessionStore.get(token);

  if (!session) {
    // Buscar en persistencia de DB
    const db = readDb();
    const persisted = Array.isArray(db.sessions) ? db.sessions.find((s) => s.token === token) : undefined;
    if (persisted && persisted.expiresAt > now) {
      session = { userId: persisted.userId, createdAt: persisted.createdAt, expiresAt: persisted.expiresAt };
      sessionStore.set(token, session);
    }
  }

  if (session) {
    if (session.expiresAt <= now) {
      sessionStore.delete(token);
      const db = readDb();
      if (Array.isArray(db.sessions)) {
        db.sessions = db.sessions.filter((s) => s.token !== token);
        writeDb(db);
      }
      return null;
    }

    const db = readDb();
    return db.users.find((user) => user.id === session.userId) ?? null;
  }

  return null;
}

function requireAdmin(req: express.Request, res: express.Response): User | null {
  const user = getCurrentUser(req);
  if (!user) {
    res.status(401).json({ message: 'No autorizado. Inicie sesión.' });
    return null;
  }
  if (user.role !== 'owner' && user.role !== 'admin') {
    res.status(403).json({ message: 'Acceso restringido: Solo un Administrador puede crear o gestionar cuentas de usuario.' });
    return null;
  }
  return user;
}

// BOLA Prevention: Comprueba si un usuario tiene facultades de gestión/administración sobre un proyecto
function canManageProject(user: User, project: Project): boolean {
  if (user.role === 'owner' || user.role === 'admin') return true;
  const userName = user.name?.trim().toLowerCase();
  if (!userName) return false;
  if (Array.isArray(project.admins) && project.admins.some((a) => a && a.trim().toLowerCase() === userName)) {
    return true;
  }
  return false;
}

// Data Isolation: Comprueba si un usuario tiene autorización para ver o acceder a un proyecto
function canAccessProject(user: User, project: Project): boolean {
  if (project.space === 'personal') {
    return canManageProject(user, project);
  }
  return true;
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, status: 'healthy' });
});

app.post('/api/auth/login', async (req, res) => {
  const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || 'unknown';
  const now = Date.now();
  const attempt = loginAttempts.get(clientIp);

  if (attempt && attempt.resetAt > now && attempt.count >= MAX_LOGIN_ATTEMPTS) {
    const remainingSec = Math.ceil((attempt.resetAt - now) / 1000);
    return res.status(429).json({
      message: `Demasiados intentos fallidos. Bloqueado temporalmente. Reintente en ${remainingSec} segundos.`
    });
  }
  const parsed = loginSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ message: 'Credenciales inválidas', errors: parsed.error.flatten() });
  }

  const db = readDb();
  const emailInput = parsed.data.email.trim().toLowerCase();
  const user = db.users.find((item) => item.email.toLowerCase() === emailInput);

  if (!user) {
    return res.status(401).json({ message: 'Email o contraseña incorrectos' });
  }

  let passwordValid = false;
  if (user.passwordHash) {
    passwordValid = await bcrypt.compare(parsed.data.password, user.passwordHash);
  } else if (user.password) {
    passwordValid = (user.password === parsed.data.password);
    if (passwordValid) {
      user.passwordHash = await bcrypt.hash(parsed.data.password, 12);
      delete user.password;
      writeDb(db);
    }
  }

  if (!passwordValid) {
    const current = loginAttempts.get(clientIp);
    if (!current || current.resetAt <= now) {
      loginAttempts.set(clientIp, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
    } else {
      current.count += 1;
    }
    return res.status(401).json({ message: 'Email o contraseña incorrectos' });
  }

  // Login exitoso: limpiar contador de intentos
  loginAttempts.delete(clientIp);

  const token = `ses_${randomBytes(32).toString('hex')}`;
  const sessionData = {
    userId: user.id,
    createdAt: now,
    expiresAt: now + SESSION_TTL_MS
  };
  sessionStore.set(token, sessionData);

  // Persistir sesión legítima en DB para resiliencia
  if (!Array.isArray(db.sessions)) {
    db.sessions = [];
  }
  db.sessions = db.sessions.filter((s) => s.expiresAt > now);
  db.sessions.push({ token, ...sessionData });
  writeDb(db);

  return res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role }
  });
});

app.post('/api/auth/logout', (req, res) => {
  const token = getToken(req);
  if (token) {
    sessionStore.delete(token);
    const db = readDb();
    if (Array.isArray(db.sessions)) {
      db.sessions = db.sessions.filter((s) => s.token !== token);
      writeDb(db);
    }
  }
  return res.json({ ok: true, message: 'Sesión finalizada correctamente.' });
});

// Endpoint seguro para generación de contraseñas de alta entropía (Solo administradores)
app.get('/api/auth/generate-password', (req, res) => {
  const admin = requireAdmin(req, res);
  if (!admin) return;

  const charset = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%^&*()_+';
  const bytes = randomBytes(16);
  let password = '';
  for (let i = 0; i < 16; i++) {
    password += charset[bytes[i] % charset.length];
  }
  return res.json({ password });
});

// ==========================================
// GESTIÓN INTERNA DE USUARIOS (Solo Administradores)
// ==========================================
app.get('/api/users', (req, res) => {
  const admin = requireAdmin(req, res);
  if (!admin) return;

  const db = readDb();
  const safeUsers = db.users.map(({ password, passwordHash, ...u }) => u);
  res.json({ items: safeUsers });
});

app.post('/api/users', async (req, res) => {
  const admin = requireAdmin(req, res);
  if (!admin) return;

  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    const errorMsg = parsed.error.issues?.[0]?.message || 'Datos de usuario inválidos';
    return res.status(400).json({ message: errorMsg, errors: parsed.error.flatten() });
  }

  const db = readDb();
  const normalizedEmail = parsed.data.email.trim().toLowerCase();
  const existingUser = db.users.find((item) => item.email.toLowerCase() === normalizedEmail);

  if (existingUser) {
    return res.status(409).json({ message: 'Ya existe un usuario con este correo electrónico' });
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  const newUser: User = {
    id: `u-${Date.now()}`,
    name: parsed.data.name.trim(),
    email: normalizedEmail,
    passwordHash,
    role: parsed.data.role || 'member'
  };

  db.users.push(newUser);

  // Sincronizar automáticamente en el Directorio si no existe
  const existingDirMember = db.teamDirectory.find(
    (m) => m.email && m.email.toLowerCase() === normalizedEmail
  );
  if (!existingDirMember) {
    db.teamDirectory.push({
      id: `dir-${Date.now()}`,
      name: newUser.name,
      role: newUser.role === 'admin' ? 'admin' : 'collaborator',
      email: newUser.email,
      organization: parsed.data.organization || 'Equipo Interno',
      createdAt: new Date().toISOString()
    });
  } else {
    if (newUser.role === 'admin') {
      existingDirMember.role = 'admin';
    }
  }

  writeDb(db);

  return res.status(201).json({
    message: `Usuario "${newUser.name}" creado exitosamente con credenciales de acceso.`,
    user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role }
  });
});

app.put('/api/users/:id/password', async (req, res) => {
  const admin = requireAdmin(req, res);
  if (!admin) return;

  const { password } = req.body;
  if (!password || typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ message: 'La contraseña debe tener al menos 8 caracteres.' });
  }

  const db = readDb();
  const targetUser = db.users.find((u) => u.id === req.params.id);
  if (!targetUser) {
    return res.status(404).json({ message: 'Usuario no encontrado.' });
  }

  targetUser.passwordHash = await bcrypt.hash(password, 12);
  delete targetUser.password;
  writeDb(db);

  return res.json({ message: `Contraseña de "${targetUser.name}" restablecida correctamente.` });
});

app.delete('/api/users/:id', (req, res) => {
  const admin = requireAdmin(req, res);
  if (!admin) return;

  const db = readDb();
  const targetUser = db.users.find((u) => u.id === req.params.id);
  if (!targetUser) {
    return res.status(404).json({ message: 'Usuario no encontrado' });
  }

  if (targetUser.id === admin.id || targetUser.role === 'owner') {
    return res.status(400).json({ message: 'No se puede revocar el acceso del usuario propietario principal.' });
  }

  db.users = db.users.filter((u) => u.id !== req.params.id);
  writeDb(db);

  return res.json({ message: `Acceso revocado para "${targetUser.name}".` });
});

app.get('/api/auth/me', (req, res) => {
  const user = getCurrentUser(req);
  if (!user) {
    return res.status(401).json({ message: 'No autorizado' });
  }

  return res.json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role }
  });
});

app.get('/api/projects', (req, res) => {
  const user = getCurrentUser(req);
  if (!user) {
    return res.status(401).json({ message: 'No autorizado' });
  }

  const db = readDb();
  const space = req.query.space as string | undefined;
  
  // Aislamiento de privacidad: los proyectos personales solo son visibles para su creador/admin o administradores globales
  const accessibleProjects = db.projects.filter((p) => canAccessProject(user, p));
  const filtered = space && space !== 'all'
    ? accessibleProjects.filter((p) => (p.space || 'work') === space)
    : accessibleProjects;
  res.json({ items: filtered });
});

app.post('/api/projects', (req, res) => {
  const user = getCurrentUser(req);
  if (!user) {
    return res.status(401).json({ message: 'No autorizado' });
  }

  const parsed = projectSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ message: 'Datos del proyecto inválidos', errors: parsed.error.flatten() });
  }

  const db = readDb();
  let newProject: Project = {
    id: `p-${Date.now()}`,
    code: parsed.data.code || getNextProjectCode(db.projects),
    name: parsed.data.name,
    description: parsed.data.description,
    template: parsed.data.template,
    status: parsed.data.status,
    role: parsed.data.role,
    space: parsed.data.space || 'work',
    organization: parsed.data.organization,
    admins: parsed.data.admins && parsed.data.admins.length > 0 ? parsed.data.admins : [user.name || 'Jorge'],
    members: parsed.data.members || [],
    teamMembers: parsed.data.teamMembers
      ? parsed.data.teamMembers.map((m, idx) => ({
          id: m.id || `mem-${idx}-${Date.now()}`,
          name: m.name,
          role: m.role,
          ...(m.email ? { email: m.email } : {})
        }))
      : undefined,
    startDate: parsed.data.startDate || new Date().toISOString().split('T')[0],
    targetDate: parsed.data.targetDate,
    originalTargetDate: parsed.data.originalTargetDate || parsed.data.targetDate,
    dateExtensions: [],
    hasPhases: Boolean(parsed.data.hasPhases),
    phases: Array.isArray(parsed.data.phases) ? parsed.data.phases : undefined
  };

  newProject = syncProjectMembers(newProject);
  db.projects.unshift(newProject);
  writeDb(db);
  return res.status(201).json(newProject);
});

app.put('/api/projects/:id', (req, res) => {
  const user = getCurrentUser(req);
  if (!user) {
    return res.status(401).json({ message: 'No autorizado' });
  }

  const db = readDb();
  const projectIndex = db.projects.findIndex((project) => project.id === req.params.id);
  if (projectIndex === -1) {
    return res.status(404).json({ message: 'Proyecto no encontrado' });
  }

  const existingProject = db.projects[projectIndex];
  if (!canManageProject(user, existingProject)) {
    return res.status(403).json({ message: 'Acceso denegado: No tienes permisos para modificar este proyecto.' });
  }

  // Solo administradores globales u owner pueden modificar la lista de administradores del proyecto
  const canEditAdmins = user.role === 'owner' || user.role === 'admin';

  let updated = {
    ...existingProject,
    ...(req.body.code !== undefined && { code: req.body.code }),
    ...(req.body.name && { name: req.body.name }),
    ...(req.body.description !== undefined && { description: req.body.description }),
    ...(req.body.status && { status: req.body.status }),
    ...(req.body.role && { role: req.body.role }),
    ...(req.body.space !== undefined && { space: req.body.space }),
    ...(req.body.organization !== undefined && { organization: req.body.organization }),
    ...(req.body.template && { template: req.body.template }),
    ...(canEditAdmins && req.body.admins !== undefined && { admins: req.body.admins }),
    ...(req.body.members !== undefined && { members: req.body.members }),
    ...(Array.isArray(req.body.teamMembers) && {
      teamMembers: req.body.teamMembers.map((m: any, idx: number) => ({
        id: m.id || `mem-${idx}-${Date.now()}`,
        name: m.name,
        role: m.role || 'collaborator',
        ...(m.email ? { email: m.email } : {})
      }))
    }),
    ...(req.body.startDate !== undefined && { startDate: req.body.startDate }),
    ...(req.body.targetDate !== undefined && { targetDate: req.body.targetDate }),
    ...(req.body.originalTargetDate !== undefined && { originalTargetDate: req.body.originalTargetDate }),
    ...(Array.isArray(req.body.dateExtensions) && { dateExtensions: req.body.dateExtensions }),
    ...(req.body.hasPhases !== undefined && { hasPhases: Boolean(req.body.hasPhases) }),
    ...(Array.isArray(req.body.phases) && { phases: req.body.phases })
  };

  updated = syncProjectMembers(updated);
  db.projects[projectIndex] = updated;
  writeDb(db);
  return res.json(db.projects[projectIndex]);
});

app.put('/api/projects/:id/phases', (req, res) => {
  const user = getCurrentUser(req);
  if (!user) {
    return res.status(401).json({ message: 'No autorizado' });
  }

  const db = readDb();
  const project = db.projects.find((p) => p.id === req.params.id);
  if (!project) {
    return res.status(404).json({ message: 'Proyecto no encontrado' });
  }

  if (!canManageProject(user, project)) {
    return res.status(403).json({ message: 'Acceso denegado: No tienes permisos para modificar las fases de este proyecto.' });
  }

  if (!Array.isArray(req.body.phases)) {
    return res.status(400).json({ message: 'Se esperaba un arreglo de fases.' });
  }

  project.phases = req.body.phases;
  project.hasPhases = true;
  writeDb(db);
  return res.json({ phases: project.phases, project });
});

app.post('/api/projects/:id/extensions', (req, res) => {
  const user = getCurrentUser(req);
  if (!user) {
    return res.status(401).json({ message: 'No autorizado' });
  }

  const parsed = dateExtensionSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Datos de prórroga inválidos', errors: parsed.error.flatten() });
  }

  const db = readDb();
  const projectIndex = db.projects.findIndex((p) => p.id === req.params.id);
  if (projectIndex === -1) {
    return res.status(404).json({ message: 'Proyecto no encontrado' });
  }

  const project = db.projects[projectIndex];
  if (!canManageProject(user, project)) {
    return res.status(403).json({ message: 'Acceso denegado: Solo administradores del proyecto o administradores globales pueden autorizar prórrogas.' });
  }
  const currentTarget = project.targetDate || new Date().toISOString().split('T')[0];
  const newTarget = parsed.data.newTargetDate;

  const d1 = new Date(currentTarget + 'T12:00:00').getTime();
  const d2 = new Date(newTarget + 'T12:00:00').getTime();
  const diffDays = Math.max(1, Math.round((d2 - d1) / (1000 * 60 * 60 * 24)));
  const weeks = Math.round(diffDays / 7);
  const durationText = weeks >= 1 ? `${weeks} semana${weeks > 1 ? 's' : ''}` : `${diffDays} día${diffDays > 1 ? 's' : ''}`;

  const extension: DateExtension = {
    id: `ext-${Date.now()}`,
    originalTargetDate: currentTarget,
    newTargetDate: newTarget,
    durationText,
    reason: parsed.data.reason.trim(),
    requestedBy: parsed.data.requestedBy?.trim() || user.name || 'Jorge',
    approvedBy: parsed.data.approvedBy?.trim() || user.name || 'Jorge',
    createdAt: new Date().toISOString()
  };

  if (!project.originalTargetDate) {
    project.originalTargetDate = currentTarget;
  }
  if (!Array.isArray(project.dateExtensions)) {
    project.dateExtensions = [];
  }
  project.dateExtensions.push(extension);
  project.targetDate = newTarget;

  writeDb(db);
  return res.status(201).json({ extension, project });
});

app.put('/api/projects/:id/status', (req, res) => {
  const user = getCurrentUser(req);
  if (!user) {
    return res.status(401).json({ message: 'No autorizado' });
  }

  const parsed = projectStatusSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Etapa inválida', errors: parsed.error.flatten() });
  }

  const db = readDb();
  const projectIndex = db.projects.findIndex((project) => project.id === req.params.id);
  if (projectIndex === -1) {
    return res.status(404).json({ message: 'Proyecto no encontrado' });
  }

  const project = db.projects[projectIndex];
  if (!canManageProject(user, project)) {
    return res.status(403).json({ message: 'Acceso denegado: No tienes permisos para cambiar la etapa de este proyecto.' });
  }

  db.projects[projectIndex] = {
    ...project,
    status: parsed.data.status
  };
  writeDb(db);
  return res.json(db.projects[projectIndex]);
});

app.delete('/api/projects/:id', (req, res) => {
  const user = getCurrentUser(req);
  if (!user) {
    return res.status(401).json({ message: 'No autorizado' });
  }

  const db = readDb();
  const projectIndex = db.projects.findIndex((project) => project.id === req.params.id);
  if (projectIndex === -1) {
    return res.status(404).json({ message: 'Proyecto no encontrado' });
  }

  const projectToDelete = db.projects[projectIndex];
  if (!canManageProject(user, projectToDelete)) {
    return res.status(403).json({ message: 'Acceso denegado: Solo administradores de este proyecto o administradores globales pueden eliminarlo.' });
  }

  const [deletedProject] = db.projects.splice(projectIndex, 1);
  db.workItems = db.workItems.filter((item) => item.projectId !== req.params.id);

  writeDb(db);
  return res.json({ ok: true, deleted: deletedProject });
});

// GESTIÓN DE ROLES Y MIEMBROS POR PROYECTO
app.get('/api/projects/:id/members', (req, res) => {
  const user = getCurrentUser(req);
  if (!user) return res.status(401).json({ message: 'No autorizado' });

  const db = readDb();
  const project = db.projects.find((p) => p.id === req.params.id);
  if (!project) return res.status(404).json({ message: 'Proyecto no encontrado' });

  return res.json({ members: project.teamMembers || [] });
});

app.post('/api/projects/:id/members', (req, res) => {
  const user = getCurrentUser(req);
  if (!user) return res.status(401).json({ message: 'No autorizado' });

  const parsed = createMemberSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Datos de miembro inválidos', errors: parsed.error.flatten() });
  }

  const db = readDb();
  const projectIndex = db.projects.findIndex((p) => p.id === req.params.id);
  if (projectIndex === -1) return res.status(404).json({ message: 'Proyecto no encontrado' });

  const project = db.projects[projectIndex];
  if (!canManageProject(user, project)) {
    return res.status(403).json({ message: 'Acceso denegado: Solo administradores del proyecto pueden gestionar sus integrantes.' });
  }
  const newMember: ProjectMember = {
    id: `mem-${Date.now()}`,
    name: parsed.data.name.trim(),
    role: parsed.data.role,
    ...(parsed.data.email ? { email: parsed.data.email.trim() } : {})
  };

  project.teamMembers = [...(project.teamMembers || []), newMember];
  syncProjectMembers(project);
  writeDb(db);

  return res.status(201).json({ member: newMember, project });
});

app.put('/api/projects/:id/members/:memberId', (req, res) => {
  const user = getCurrentUser(req);
  if (!user) return res.status(401).json({ message: 'No autorizado' });

  const parsed = updateMemberSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Datos inválidos', errors: parsed.error.flatten() });
  }

  const db = readDb();
  const projectIndex = db.projects.findIndex((p) => p.id === req.params.id);
  if (projectIndex === -1) return res.status(404).json({ message: 'Proyecto no encontrado' });

  const project = db.projects[projectIndex];
  if (!canManageProject(user, project)) {
    return res.status(403).json({ message: 'Acceso denegado: Solo administradores del proyecto pueden gestionar sus integrantes.' });
  }
  const memberIndex = (project.teamMembers || []).findIndex((m) => m.id === req.params.memberId);
  if (memberIndex === -1) return res.status(404).json({ message: 'Miembro no encontrado' });

  project.teamMembers![memberIndex] = {
    ...project.teamMembers![memberIndex],
    ...(parsed.data.name && { name: parsed.data.name.trim() }),
    ...(parsed.data.role && { role: parsed.data.role }),
    ...(parsed.data.email !== undefined && { email: parsed.data.email.trim() })
  };

  syncProjectMembers(project);
  writeDb(db);

  return res.json({ member: project.teamMembers![memberIndex], project });
});

app.delete('/api/projects/:id/members/:memberId', (req, res) => {
  const user = getCurrentUser(req);
  if (!user) return res.status(401).json({ message: 'No autorizado' });

  const db = readDb();
  const projectIndex = db.projects.findIndex((p) => p.id === req.params.id);
  if (projectIndex === -1) return res.status(404).json({ message: 'Proyecto no encontrado' });

  const project = db.projects[projectIndex];
  if (!canManageProject(user, project)) {
    return res.status(403).json({ message: 'Acceso denegado: Solo administradores del proyecto pueden gestionar sus integrantes.' });
  }
  project.teamMembers = (project.teamMembers || []).filter((m) => m.id !== req.params.memberId);
  syncProjectMembers(project);
  writeDb(db);

  return res.json({ ok: true, deletedMemberId: req.params.memberId, project });
});

// ==========================================
// DIRECTORIO & EQUIPO GLOBAL (Mantenimiento Centralizado)
// ==========================================
app.get('/api/directory', (req, res) => {
  const user = getCurrentUser(req);
  if (!user) return res.status(401).json({ message: 'No autorizado' });

  const db = readDb();
  const items = (db.teamDirectory || []).map((m) => {
    const userAcc = db.users.find(
      (u) => (m.email && u.email.toLowerCase() === m.email.toLowerCase()) || u.name.toLowerCase() === m.name.toLowerCase()
    );
    return {
      ...m,
      hasUserAccount: Boolean(userAcc),
      userAccountId: userAcc?.id,
      userRole: userAcc?.role
    };
  });
  return res.json({ items });
});

app.post('/api/directory', async (req, res) => {
  const user = requireAdmin(req, res);
  if (!user) return;

  const parsed = createGlobalMemberSchema.safeParse(req.body);
  if (!parsed.success) {
    const errorDetails = parsed.error.issues.map((i) => i.message).join('. ');
    return res.status(400).json({ message: errorDetails || 'Datos de integrante inválidos', errors: parsed.error.flatten() });
  }

  const db = readDb();
  if (!Array.isArray(db.teamDirectory)) {
    db.teamDirectory = [];
  }

  const trimmedName = parsed.data.name.trim();
  const exists = db.teamDirectory.some((m) => m.name.trim().toLowerCase() === trimmedName.toLowerCase());
  if (exists) {
    return res.status(400).json({ message: `Ya existe un integrante o tercero con el nombre "${trimmedName}" en el directorio.` });
  }

  // Si se solicitó crear cuenta de acceso al sistema, validar permisos de administrador
  if (parsed.data.createAccount) {
    if (user.role !== 'owner' && user.role !== 'admin') {
      return res.status(403).json({ message: 'Solo un Administrador puede generar credenciales de usuario.' });
    }
    if (!parsed.data.email || !parsed.data.password) {
      return res.status(400).json({ message: 'Correo y contraseña son requeridos para crear la cuenta de acceso.' });
    }
    if (parsed.data.password.length < 8) {
      return res.status(400).json({ message: 'La contraseña debe tener al menos 8 caracteres.' });
    }
    const userEmail = parsed.data.email.trim().toLowerCase();
    const existingUser = db.users.find((u) => u.email.toLowerCase() === userEmail);
    if (existingUser) {
      return res.status(409).json({ message: 'Ya existe una cuenta con este correo electrónico.' });
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 12);
    db.users.push({
      id: `u-${Date.now()}`,
      name: trimmedName,
      email: userEmail,
      passwordHash,
      role: parsed.data.userRole || (parsed.data.role === 'admin' ? 'admin' : 'member')
    });
  }

  const newMember: GlobalMember = {
    id: `dir-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name: trimmedName,
    role: parsed.data.role,
    ...(parsed.data.email ? { email: parsed.data.email.trim() } : {}),
    ...(parsed.data.phone ? { phone: parsed.data.phone.trim() } : {}),
    organization: parsed.data.organization ? parsed.data.organization.trim() : (parsed.data.role === 'vendor' ? 'Proveedor / Tercero' : 'Equipo Interno'),
    createdAt: new Date().toISOString()
  };

  db.teamDirectory.unshift(newMember);
  writeDb(db);
  return res.status(201).json(newMember);
});

// Endpoint para que un Administrador genere credenciales a un integrante existente
app.post('/api/directory/:id/create-account', async (req, res) => {
  const admin = requireAdmin(req, res);
  if (!admin) return;

  const { email, password, role } = req.body;
  if (!password || typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ message: 'La contraseña debe tener al menos 8 caracteres.' });
  }

  const db = readDb();
  const member = db.teamDirectory.find((m) => m.id === req.params.id);
  if (!member) {
    return res.status(404).json({ message: 'Integrante del directorio no encontrado.' });
  }

  const targetEmail = (email || member.email || '').trim().toLowerCase();
  if (!targetEmail) {
    return res.status(400).json({ message: 'Se requiere un correo electrónico para crear la cuenta.' });
  }

  const existingUser = db.users.find((u) => u.email.toLowerCase() === targetEmail);
  if (existingUser) {
    return res.status(409).json({ message: 'Ya existe una cuenta con este correo electrónico.' });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const newUser: User = {
    id: `u-${Date.now()}`,
    name: member.name,
    email: targetEmail,
    passwordHash,
    role: role || (member.role === 'admin' ? 'admin' : 'member')
  };

  db.users.push(newUser);
  if (!member.email) {
    member.email = targetEmail;
  }
  writeDb(db);

  return res.status(201).json({
    message: `Cuenta de acceso generada exitosamente para "${member.name}".`,
    user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role }
  });
});

// Endpoint para que un Administrador restablezca/regenere manualmente la contraseña de un integrante
app.post('/api/directory/:id/reset-password', async (req, res) => {
  const admin = requireAdmin(req, res);
  if (!admin) return;

  const { password, role } = req.body;
  if (!password || typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ message: 'La contraseña debe tener al menos 8 caracteres.' });
  }

  const db = readDb();
  const member = db.teamDirectory.find((m) => m.id === req.params.id);
  if (!member) {
    return res.status(404).json({ message: 'Integrante del directorio no encontrado.' });
  }

  const targetUser = db.users.find(
    (u) => (member.email && u.email.toLowerCase() === member.email.toLowerCase()) ||
           u.name.toLowerCase() === member.name.toLowerCase()
  );

  if (!targetUser) {
    return res.status(404).json({ message: 'Este integrante no cuenta con un usuario de acceso registrado.' });
  }

  targetUser.passwordHash = await bcrypt.hash(password, 12);
  delete targetUser.password;
  if (role && (role === 'admin' || role === 'member')) {
    targetUser.role = role;
  }
  writeDb(db);

  return res.json({
    message: `Contraseña de "${targetUser.name}" restablecida correctamente.`,
    user: { id: targetUser.id, name: targetUser.name, email: targetUser.email, role: targetUser.role }
  });
});

// Endpoint para que un Administrador revoque el acceso al sistema sin eliminar al integrante del directorio
app.delete('/api/directory/:id/revoke-access', (req, res) => {
  const admin = requireAdmin(req, res);
  if (!admin) return;

  const db = readDb();
  const member = db.teamDirectory.find((m) => m.id === req.params.id);
  if (!member) {
    return res.status(404).json({ message: 'Integrante del directorio no encontrado.' });
  }

  const targetUser = db.users.find(
    (u) => (member.email && u.email.toLowerCase() === member.email.toLowerCase()) ||
           u.name.toLowerCase() === member.name.toLowerCase()
  );

  if (!targetUser) {
    return res.status(404).json({ message: 'Este integrante no tiene una cuenta de usuario activa.' });
  }

  if (targetUser.id === admin.id || targetUser.role === 'owner') {
    return res.status(400).json({ message: 'No se puede revocar el acceso del usuario propietario principal o tu propia cuenta.' });
  }

  db.users = db.users.filter((u) => u.id !== targetUser.id);
  writeDb(db);

  return res.json({ message: `Acceso al sistema revocado para "${member.name}". El integrante permanece en el directorio.` });
});

app.put('/api/directory/:id', (req, res) => {
  const user = requireAdmin(req, res);
  if (!user) return;

  const parsed = updateGlobalMemberSchema.safeParse(req.body);
  if (!parsed.success) {
    const errorDetails = parsed.error.issues.map((i) => i.message).join('. ');
    return res.status(400).json({ message: errorDetails || 'Datos inválidos', errors: parsed.error.flatten() });
  }

  const db = readDb();
  if (!Array.isArray(db.teamDirectory)) db.teamDirectory = [];
  const memberIndex = db.teamDirectory.findIndex((m) => m.id === req.params.id);
  if (memberIndex === -1) {
    return res.status(404).json({ message: 'Integrante no encontrado en el directorio' });
  }

  const oldMember = db.teamDirectory[memberIndex];
  const oldName = oldMember.name;
  const newName = parsed.data.name !== undefined ? parsed.data.name.trim() : oldName;

  // Si cambia el nombre, verificar que no colisione con otro
  if (newName.toLowerCase() !== oldName.toLowerCase()) {
    const existsOther = db.teamDirectory.some((m) => m.id !== oldMember.id && m.name.trim().toLowerCase() === newName.toLowerCase());
    if (existsOther) {
      return res.status(400).json({ message: `Ya existe otro integrante o tercero con el nombre "${newName}"` });
    }
  }

  db.teamDirectory[memberIndex] = {
    ...oldMember,
    name: newName,
    ...(parsed.data.role !== undefined && { role: parsed.data.role }),
    ...(parsed.data.email !== undefined && { email: parsed.data.email.trim() }),
    ...(parsed.data.phone !== undefined && { phone: parsed.data.phone.trim() }),
    ...(parsed.data.organization !== undefined && { organization: parsed.data.organization.trim() })
  };

  // Sincronizar en cascada si cambió el nombre
  if (oldName !== newName) {
    const oldKey = oldName.trim().toLowerCase();
    db.projects.forEach((proj) => {
      let changed = false;
      if (proj.teamMembers) {
        proj.teamMembers.forEach((m) => {
          if (m.name.trim().toLowerCase() === oldKey) {
            m.name = newName;
            changed = true;
          }
        });
      }
      if (proj.admins) {
        proj.admins = proj.admins.map((adm) => (adm.trim().toLowerCase() === oldKey ? newName : adm));
        changed = true;
      }
      if (proj.members) {
        proj.members = proj.members.map((mem) => (mem.trim().toLowerCase() === oldKey ? newName : mem));
        changed = true;
      }
      if (changed) {
        syncProjectMembers(proj);
      }
    });

    db.workItems.forEach((wi) => {
      if (Array.isArray(wi.assignees) && wi.assignees.length > 0) {
        let changed = false;
        const updated = wi.assignees.map((a) => {
          if (a && a.trim().toLowerCase() === oldKey) {
            changed = true;
            return newName;
          }
          return a;
        });
        if (changed) {
          wi.assignees = updated;
          wi.assignee = updated.join(', ');
        }
      } else if (typeof wi.assignee === 'string' && wi.assignee.toLowerCase().includes(oldKey)) {
        const parts = wi.assignee.split(',').map((s) => s.trim());
        let changed = false;
        const updated = parts.map((p) => {
          if (p.toLowerCase() === oldKey) {
            changed = true;
            return newName;
          }
          return p;
        });
        if (changed) {
          wi.assignee = updated.join(', ');
          wi.assignees = updated;
        }
      }
    });
  }

  writeDb(db);
  return res.json(db.teamDirectory[memberIndex]);
});

app.delete('/api/directory/:id', (req, res) => {
  const user = requireAdmin(req, res);
  if (!user) return;

  const db = readDb();
  if (!Array.isArray(db.teamDirectory)) db.teamDirectory = [];
  const memberIndex = db.teamDirectory.findIndex((m) => m.id === req.params.id);
  if (memberIndex === -1) {
    return res.status(404).json({ message: 'Integrante no encontrado en el directorio' });
  }

  const member = db.teamDirectory[memberIndex];
  const targetName = member.name.trim().toLowerCase();

  // VALIDACIÓN ESTRICTA: No permitir eliminar si está asignado a tareas
  const assignedTask = db.workItems.find((w) => {
    if (Array.isArray(w.assignees) && w.assignees.length > 0) {
      return w.assignees.some((a) => a && a.trim().toLowerCase() === targetName);
    }
    if (typeof w.assignee === 'string' && w.assignee.trim()) {
      return w.assignee.split(',').map((s) => s.trim().toLowerCase()).includes(targetName);
    }
    return false;
  });

  if (assignedTask) {
    const project = db.projects.find((p) => p.id === assignedTask.projectId);
    const projectName = project ? project.name : 'Proyecto General';
    return res.status(400).json({
      code: 'MEMBER_ASSIGNED_TO_TASK',
      message: `No se puede eliminar a "${member.name}" porque el usuario está asociado a una tarea en un proyecto ("${assignedTask.title}" en "${projectName}"). Debe reasignar o desvincular la tarea antes de eliminarlo.`,
      associatedTask: {
        id: assignedTask.id,
        title: assignedTask.title,
        projectId: assignedTask.projectId,
        projectName
      }
    });
  }

  // Eliminar del directorio
  const [deletedMember] = db.teamDirectory.splice(memberIndex, 1);

  // Sincronizar y limpiar de equipos de proyectos si estuviera registrado
  db.projects.forEach((proj) => {
    let changed = false;
    if (proj.teamMembers) {
      const prevLen = proj.teamMembers.length;
      proj.teamMembers = proj.teamMembers.filter((m) => m.name.trim().toLowerCase() !== targetName);
      if (proj.teamMembers.length !== prevLen) changed = true;
    }
    if (proj.members) {
      const prevLen = proj.members.length;
      proj.members = proj.members.filter((name) => name.trim().toLowerCase() !== targetName);
      if (proj.members.length !== prevLen) changed = true;
    }
    if (proj.admins) {
      const prevLen = proj.admins.length;
      proj.admins = proj.admins.filter((name) => name.trim().toLowerCase() !== targetName);
      if (proj.admins.length !== prevLen) changed = true;
    }
    if (changed) {
      syncProjectMembers(proj);
    }
  });

  writeDb(db);
  return res.json({ ok: true, deleted: deletedMember });
});

app.get('/api/work-items', (req, res) => {
  const user = getCurrentUser(req);
  if (!user) {
    return res.status(401).json({ message: 'No autorizado' });
  }

  const db = readDb();
  // Filtrar tareas pertenecientes a proyectos accesibles para el usuario
  const accessibleProjectIds = new Set(
    db.projects.filter((p) => canAccessProject(user, p)).map((p) => p.id)
  );

  const projectId = String(req.query.projectId || '');
  let items = db.workItems.filter((item) => accessibleProjectIds.has(item.projectId));
  if (projectId) {
    items = items.filter((item) => item.projectId === projectId);
  }

  return res.json({ items });
});

app.post('/api/work-items', (req, res) => {
  const user = getCurrentUser(req);
  if (!user) {
    return res.status(401).json({ message: 'No autorizado' });
  }

  const parsed = workItemSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Datos del item inválidos', errors: parsed.error.flatten() });
  }

  const db = readDb();
  const projectExists = db.projects.some((project) => project.id === parsed.data.projectId);
  if (!projectExists) {
    return res.status(404).json({ message: 'Proyecto no encontrado' });
  }

  const workItems = Array.isArray(db.workItems) ? db.workItems : [];

  let assigneesList: string[] = [];
  if (Array.isArray(parsed.data.assignees) && parsed.data.assignees.length > 0) {
    assigneesList = parsed.data.assignees.map((s) => String(s).trim()).filter(Boolean);
  } else if (parsed.data.assignee) {
    assigneesList = parsed.data.assignee.split(',').map((s) => s.trim()).filter(Boolean);
  } else {
    assigneesList = ['Jorge'];
  }
  const assigneeStr = assigneesList.join(', ');

  const targetProject = db.projects.find((p) => p.id === parsed.data.projectId);
  const projCode = targetProject?.code || 'P1';
  const code = parsed.data.code || getNextWorkItemCode(db.workItems, projCode);

  const newItem: WorkItem = {
    id: `wi-${Date.now()}`,
    code,
    projectId: parsed.data.projectId,
    title: parsed.data.title,
    description: parsed.data.description,
    type: parsed.data.type,
    status: parsed.data.status,
    priority: parsed.data.priority,
    assignee: assigneeStr,
    assignees: assigneesList,
    assigneeType: parsed.data.assigneeType || 'me',
    startDate: parsed.data.startDate || '',
    dueDate: parsed.data.dueDate || '',
    createdAt: new Date().toISOString(),
    completionType: parsed.data.completionType || (parsed.data.status === 'done' ? 'full' : undefined),
    completionReport: parsed.data.completionReport || '',
    continuationTaskId: parsed.data.continuationTaskId,
    completedAt: parsed.data.completedAt || (parsed.data.status === 'done' ? new Date().toISOString() : undefined),
    progressLogs: parsed.data.progressLogs || [],
    phaseIds: Array.isArray(parsed.data.phaseIds) ? parsed.data.phaseIds : []
  };

  workItems.unshift(newItem);
  db.workItems = workItems;
  writeDb(db);
  return res.status(201).json(newItem);
});

app.post('/api/work-items/batch', (req, res) => {
  const user = getCurrentUser(req);
  if (!user) {
    return res.status(401).json({ message: 'No autorizado' });
  }

  const { projectId, items, newPhases } = req.body;
  if (!projectId || !Array.isArray(items)) {
    return res.status(400).json({ message: 'Faltan parámetros requeridos (projectId, items)' });
  }

  const db = readDb();
  const project = db.projects.find((p) => p.id === projectId);
  if (!project) {
    return res.status(404).json({ message: 'Proyecto no encontrado' });
  }

  // Actualizar fases si vienen especificadas
  if (Array.isArray(newPhases) && newPhases.length > 0) {
    project.hasPhases = true;
    const existingPhases = Array.isArray(project.phases) ? [...project.phases] : [];
    newPhases.forEach((np: any) => {
      const found = existingPhases.find((p) => p.id === np.id || p.name.toLowerCase().trim() === (np.name || '').toLowerCase().trim());
      if (!found && np.name) {
        existingPhases.push({
          id: np.id || `phase-${existingPhases.length}`,
          name: np.name,
          startDate: np.startDate || '',
          targetDate: np.targetDate || '',
          status: np.status || 'pending',
          order: existingPhases.length
        });
      }
    });
    project.phases = existingPhases;
  }

  const projCode = project.code || 'P1';
  const createdItems: WorkItem[] = [];
  const nowIso = new Date().toISOString();

  if (!Array.isArray(db.teamDirectory)) db.teamDirectory = [];
  const knownNames = new Set(db.teamDirectory.map((m: any) => (m.name || '').toLowerCase().trim()));

  for (let i = 0; i < items.length; i++) {
    const raw = items[i];
    if (!raw.title || typeof raw.title !== 'string') continue;

    let assigneesList: string[] = [];
    if (Array.isArray(raw.assignees) && raw.assignees.length > 0) {
      assigneesList = raw.assignees.map((s: any) => String(s).trim()).filter(Boolean);
    } else if (raw.assignee) {
      assigneesList = String(raw.assignee).split(/[\/,]/).map((s) => s.trim()).filter(Boolean);
    } else {
      assigneesList = [user.name || 'Jorge'];
    }
    const assigneeStr = assigneesList.join(', ');

    assigneesList.forEach((name) => {
      if (name && !knownNames.has(name.toLowerCase())) {
        knownNames.add(name.toLowerCase());
        db.teamDirectory.push({
          id: `dir-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          name,
          role: 'collaborator',
          organization: 'Equipo de Proyecto',
          createdAt: nowIso
        });
      }
    });

    const code = raw.code || getNextWorkItemCode([...db.workItems, ...createdItems], projCode);
    const status = raw.status || 'backlog';
    const isDone = status === 'done';

    const newItem: WorkItem = {
      id: raw.id && !raw.id.startsWith('wi-') ? `wi-${projectId}-${raw.id.toLowerCase()}` : (raw.id || `wi-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`),
      code,
      projectId,
      title: raw.title.trim(),
      description: (raw.description || '').trim(),
      type: raw.type || (raw.title.toLowerCase().startsWith('hito') ? 'milestone' : 'task'),
      status: status,
      priority: raw.priority || 'medium',
      assignee: assigneeStr,
      assignees: assigneesList,
      assigneeType: assigneesList.some((a) => a.toLowerCase() === (user.name || 'jorge').toLowerCase()) ? 'me' : 'team',
      startDate: raw.startDate || '',
      dueDate: raw.dueDate || '',
      createdAt: raw.createdAt || nowIso,
      completionType: isDone ? 'full' : undefined,
      completionReport: isDone ? (raw.completionReport || raw.description || 'Completado según registro de importación.') : '',
      completedAt: isDone ? (raw.completedAt || raw.dueDate || nowIso) : undefined,
      progressLogs: Array.isArray(raw.progressLogs) ? raw.progressLogs : (
        isDone ? [{
          id: `log-${Date.now()}-${i}`,
          text: raw.description || 'Completado según importación inicial.',
          author: assigneeStr || user.name || 'Sistema',
          createdAt: raw.dueDate ? `${raw.dueDate}T12:00:00.000Z` : nowIso
        }] : []
      ),
      phaseIds: Array.isArray(raw.phaseIds) ? raw.phaseIds : []
    };

    createdItems.push(newItem);
  }

  db.workItems = [...(db.workItems || []), ...createdItems];
  writeDb(db);

  return res.status(201).json({
    ok: true,
    count: createdItems.length,
    items: createdItems,
    project
  });
});

app.put('/api/work-items/:id', (req, res) => {
  const user = getCurrentUser(req);
  if (!user) {
    return res.status(401).json({ message: 'No autorizado' });
  }

  const parsed = workItemUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Datos inválidos', errors: parsed.error.flatten() });
  }

  const db = readDb();
  const itemIndex = db.workItems.findIndex((item) => item.id === req.params.id);
  if (itemIndex === -1) {
    return res.status(404).json({ message: 'Tarea no encontrada' });
  }

  let updateData: any = { ...parsed.data };
  if (parsed.data.assignees !== undefined) {
    const list = Array.isArray(parsed.data.assignees)
      ? parsed.data.assignees.map((s) => String(s).trim()).filter(Boolean)
      : [];
    updateData.assignees = list;
    if (parsed.data.assignee === undefined) {
      updateData.assignee = list.join(', ');
    }
  } else if (parsed.data.assignee !== undefined) {
    updateData.assignees = parsed.data.assignee.split(',').map((s) => s.trim()).filter(Boolean);
  }

  if (updateData.status === 'done') {
    const report = (updateData.completionReport ?? db.workItems[itemIndex].completionReport ?? '').trim();
    if (report.length < 20) {
      return res.status(422).json({
        message: 'El informe de cierre / resultado debe tener al menos 20 caracteres.',
        errors: { completionReport: ['Debe contener al menos 20 caracteres explicando el resultado o motivo.'] }
      });
    }
    if (!updateData.completedAt && !db.workItems[itemIndex].completedAt) {
      updateData.completedAt = new Date().toISOString();
    }
    if (!updateData.closedAt && !db.workItems[itemIndex].closedAt) {
      updateData.closedAt = new Date().toISOString();
    }
    if (!updateData.closedBy && !db.workItems[itemIndex].closedBy) {
      updateData.closedBy = user.name || user.email;
    }
    if (!updateData.closeType && !db.workItems[itemIndex].closeType) {
      updateData.closeType = 'completed';
    }
    if (!updateData.completionType && !db.workItems[itemIndex].completionType) {
      updateData.completionType = 'full';
    }
  }

  db.workItems[itemIndex] = {
    ...db.workItems[itemIndex],
    ...updateData
  };

  writeDb(db);
  return res.json(db.workItems[itemIndex]);
});

app.put('/api/work-items/:id/status', (req, res) => {
  const user = getCurrentUser(req);
  if (!user) {
    return res.status(401).json({ message: 'No autorizado' });
  }

  const parsed = workItemStatusSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Estado inválido', errors: parsed.error.flatten() });
  }

  const db = readDb();
  const itemIndex = db.workItems.findIndex((item) => item.id === req.params.id);
  if (itemIndex === -1) {
    return res.status(404).json({ message: 'Tarea no encontrada' });
  }

  const isNowDone = parsed.data.status === 'done';
  if (isNowDone) {
    const report = (parsed.data.completionReport ?? db.workItems[itemIndex].completionReport ?? '').trim();
    if (report.length < 20) {
      return res.status(422).json({
        message: 'El informe de cierre / resultado debe tener al menos 20 caracteres.',
        errors: { completionReport: ['Debe contener al menos 20 caracteres explicando el resultado o motivo.'] }
      });
    }
  }

  db.workItems[itemIndex] = {
    ...db.workItems[itemIndex],
    status: parsed.data.status,
    ...(parsed.data.closeType ? { closeType: parsed.data.closeType } : {}),
    ...(parsed.data.completionReport !== undefined ? { completionReport: parsed.data.completionReport } : {}),
    ...(parsed.data.completionType ? { completionType: parsed.data.completionType } : {}),
    ...(parsed.data.replacedBy !== undefined ? { replacedBy: parsed.data.replacedBy } : {}),
    ...(isNowDone && !db.workItems[itemIndex].completedAt ? { completedAt: new Date().toISOString() } : {}),
    ...(isNowDone && !db.workItems[itemIndex].closedAt ? { closedAt: new Date().toISOString() } : {}),
    ...(isNowDone && !db.workItems[itemIndex].closedBy ? { closedBy: parsed.data.closedBy || user.name || user.email } : {}),
    ...(isNowDone && !db.workItems[itemIndex].closeType && !parsed.data.closeType ? { closeType: 'completed' } : {}),
    ...(isNowDone && !db.workItems[itemIndex].completionType && !parsed.data.completionType ? { completionType: 'full' } : {})
  };

  writeDb(db);
  return res.json(db.workItems[itemIndex]);
});

const addProgressLogSchema = z.object({
  text: z.string().min(1),
  author: z.string().optional()
});

app.post('/api/work-items/:id/progress-logs', (req, res) => {
  const user = getCurrentUser(req);
  if (!user) return res.status(401).json({ message: 'No autorizado' });

  const parsed = addProgressLogSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Detalle del avance es requerido', errors: parsed.error.flatten() });
  }

  const db = readDb();
  const itemIndex = db.workItems.findIndex((item) => item.id === req.params.id);
  if (itemIndex === -1) {
    return res.status(404).json({ message: 'Tarea no encontrada' });
  }

  const item = db.workItems[itemIndex];
  if (!Array.isArray(item.progressLogs)) {
    item.progressLogs = [];
  }

  const newLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    text: parsed.data.text.trim(),
    author: parsed.data.author?.trim() || user.name || 'Jorge',
    createdAt: new Date().toISOString()
  };

  item.progressLogs.unshift(newLog);
  writeDb(db);
  return res.status(201).json(item);
});

app.delete('/api/work-items/:id/progress-logs/:logId', (req, res) => {
  const user = getCurrentUser(req);
  if (!user) return res.status(401).json({ message: 'No autorizado' });

  const db = readDb();
  const itemIndex = db.workItems.findIndex((item) => item.id === req.params.id);
  if (itemIndex === -1) {
    return res.status(404).json({ message: 'Tarea no encontrada' });
  }

  const item = db.workItems[itemIndex];
  if (Array.isArray(item.progressLogs)) {
    item.progressLogs = item.progressLogs.filter((l) => l.id !== req.params.logId);
  }
  writeDb(db);
  return res.json(item);
});

app.delete('/api/work-items/:id', (req, res) => {
  const user = getCurrentUser(req);
  if (!user) {
    return res.status(401).json({ message: 'No autorizado' });
  }

  const db = readDb();
  const itemIndex = db.workItems.findIndex((item) => item.id === req.params.id);
  if (itemIndex === -1) {
    return res.status(404).json({ message: 'Tarea no encontrada' });
  }

  const itemToDelete = db.workItems[itemIndex];
  const targetProject = db.projects.find((p) => p.id === itemToDelete.projectId);
  const canDelete = user.role === 'owner' || user.role === 'admin' || (targetProject && canManageProject(user, targetProject));
  if (!canDelete) {
    return res.status(403).json({ message: 'Acceso denegado: Solo administradores o líderes del proyecto pueden eliminar esta tarea.' });
  }

  const [deleted] = db.workItems.splice(itemIndex, 1);
  writeDb(db);
  return res.json({ ok: true, deleted });
});

// Manejador global de errores para Express (evita stack traces y caídas)
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error no controlado en API:', err?.message || err);
  if (err?.message === 'Bloqueado por política CORS') {
    return res.status(403).json({ message: 'Acceso bloqueado por política CORS.' });
  }
  return res.status(500).json({ message: 'Error interno del servidor.' });
});

const port = Number(process.env.PORT || 4001);
app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
