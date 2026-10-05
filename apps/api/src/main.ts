import express from 'express';
import cors from 'cors';
import { z } from 'zod';
import { readDb, writeDb, syncProjectMembers, getNextProjectCode, getNextWorkItemCode, type Project, type WorkItem, type ProjectMember, type GlobalMember, type GlobalMemberRole, type DateExtension } from './data/store';

const app = express();
app.use(cors());
app.use(express.json());

const sessionStore = new Map<string, { userId: string; createdAt: number }>();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
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
  email: z.string().optional(),
  phone: z.string().optional(),
  organization: z.string().optional()
});

const updateGlobalMemberSchema = z.object({
  name: z.string().min(1, 'El nombre o entidad no puede estar vacío').optional(),
  role: memberRoleSchema.optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  organization: z.string().optional()
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

const projectSchema = z.object({
  code: z.string().optional(),
  name: z.string().min(2),
  description: z.string().optional(),
  template: z.enum(['kanban', 'scrum', 'pmi', 'custom']),
  status: z.enum(['preproject', 'review', 'execution', 'completed', 'discarded']).default('preproject'),
  role: z.enum(['lead', 'collaborator']).default('lead'),
  admins: z.array(z.string()).optional(),
  members: z.array(z.string()).optional(),
  teamMembers: z.array(projectMemberSchema).optional(),
  startDate: z.string().optional(),
  targetDate: z.string().optional(),
  originalTargetDate: z.string().optional()
});

const projectStatusSchema = z.object({
  status: z.enum(['preproject', 'review', 'execution', 'completed', 'discarded'])
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
  dueDate: z.string().optional(),
  completionType: z.enum(['full', 'partial']).optional(),
  completionReport: z.string().optional(),
  continuationTaskId: z.string().optional(),
  completedAt: z.string().optional()
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
  dueDate: z.string().optional(),
  completionType: z.enum(['full', 'partial']).optional(),
  completionReport: z.string().optional(),
  continuationTaskId: z.string().optional(),
  completedAt: z.string().optional()
});

const workItemStatusSchema = z.object({
  status: z.enum(['backlog', 'in_progress', 'review', 'done'])
});

function getToken(req: express.Request): string | undefined {
  const header = req.headers.authorization;
  if (!header) return undefined;
  return header.startsWith('Bearer ') ? header.slice(7) : undefined;
}

function getCurrentUser(req: express.Request) {
  const token = getToken(req);
  if (!token) return null;

  const session = sessionStore.get(token);
  if (!session) return null;

  const db = readDb();
  return db.users.find((user) => user.id === session.userId) ?? null;
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, status: 'healthy' });
});

app.post('/api/auth/login', (req, res) => {
  const parsed = loginSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ message: 'Credenciales inválidas', errors: parsed.error.flatten() });
  }

  const db = readDb();
  const user = db.users.find((item) => item.email === parsed.data.email);

  if (!user || user.password !== parsed.data.password) {
    return res.status(401).json({ message: 'Email o contraseña incorrectos' });
  }

  const token = `nexus-${Date.now()}-${user.id}`;
  sessionStore.set(token, { userId: user.id, createdAt: Date.now() });

  return res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role }
  });
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
  res.json({ items: db.projects });
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
    dateExtensions: []
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

  let updated = {
    ...db.projects[projectIndex],
    ...(req.body.code !== undefined && { code: req.body.code }),
    ...(req.body.name && { name: req.body.name }),
    ...(req.body.description !== undefined && { description: req.body.description }),
    ...(req.body.status && { status: req.body.status }),
    ...(req.body.role && { role: req.body.role }),
    ...(req.body.template && { template: req.body.template }),
    ...(req.body.admins !== undefined && { admins: req.body.admins }),
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
    ...(Array.isArray(req.body.dateExtensions) && { dateExtensions: req.body.dateExtensions })
  };

  updated = syncProjectMembers(updated);
  db.projects[projectIndex] = updated;
  writeDb(db);
  return res.json(db.projects[projectIndex]);
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

  db.projects[projectIndex] = {
    ...db.projects[projectIndex],
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
  return res.json({ items: db.teamDirectory || [] });
});

app.post('/api/directory', (req, res) => {
  const user = getCurrentUser(req);
  if (!user) return res.status(401).json({ message: 'No autorizado' });

  const parsed = createGlobalMemberSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Datos de integrante inválidos', errors: parsed.error.flatten() });
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

app.put('/api/directory/:id', (req, res) => {
  const user = getCurrentUser(req);
  if (!user) return res.status(401).json({ message: 'No autorizado' });

  const parsed = updateGlobalMemberSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Datos inválidos', errors: parsed.error.flatten() });
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
  const user = getCurrentUser(req);
  if (!user) return res.status(401).json({ message: 'No autorizado' });

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

  const projectId = String(req.query.projectId || '');
  const db = readDb();
  const items = projectId
    ? db.workItems.filter((item) => item.projectId === projectId)
    : db.workItems;

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
    dueDate: parsed.data.dueDate || '',
    createdAt: new Date().toISOString(),
    completionType: parsed.data.completionType || (parsed.data.status === 'done' ? 'full' : undefined),
    completionReport: parsed.data.completionReport || '',
    continuationTaskId: parsed.data.continuationTaskId,
    completedAt: parsed.data.completedAt || (parsed.data.status === 'done' ? new Date().toISOString() : undefined)
  };

  workItems.unshift(newItem);
  db.workItems = workItems;
  writeDb(db);
  return res.status(201).json(newItem);
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
    if (!updateData.completedAt && !db.workItems[itemIndex].completedAt) {
      updateData.completedAt = new Date().toISOString();
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

  db.workItems[itemIndex] = {
    ...db.workItems[itemIndex],
    status: parsed.data.status,
    ...(isNowDone && !db.workItems[itemIndex].completedAt ? { completedAt: new Date().toISOString() } : {}),
    ...(isNowDone && !db.workItems[itemIndex].completionType ? { completionType: 'full' } : {})
  };

  writeDb(db);
  return res.json(db.workItems[itemIndex]);
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

  const [deleted] = db.workItems.splice(itemIndex, 1);
  writeDb(db);
  return res.json({ ok: true, deleted });
});

const port = Number(process.env.PORT || 4001);
app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
