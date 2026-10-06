import fs from 'fs';
import path from 'path';

export type User = {
  id: string;
  email: string;
  name: string;
  password: string;
  role: 'owner' | 'admin' | 'member';
};

export type ProjectMemberRole = 'admin' | 'collaborator' | 'vendor' | 'viewer';

export type ProjectMember = {
  id: string;
  name: string;
  role: ProjectMemberRole;
  email?: string;
};

export type DateExtension = {
  id: string;
  originalTargetDate: string;
  newTargetDate: string;
  durationText: string;
  reason: string;
  requestedBy?: string;
  approvedBy?: string;
  createdAt: string;
};

export type Project = {
  id: string;
  code?: string;
  name: string;
  description?: string;
  template: 'kanban' | 'scrum' | 'pmi' | 'custom';
  status: 'preproject' | 'review' | 'execution' | 'completed' | 'discarded';
  role: 'lead' | 'collaborator';
  admins?: string[];
  members?: string[];
  teamMembers?: ProjectMember[];
  startDate?: string;
  targetDate?: string;
  originalTargetDate?: string;
  dateExtensions?: DateExtension[];
};

export type TaskProgressEntry = {
  id: string;
  text: string;
  author: string;
  createdAt: string;
};

export type WorkItem = {
  id: string;
  code?: string;
  projectId: string;
  title: string;
  description?: string;
  type: 'epic' | 'story' | 'task' | 'bug' | 'risk' | 'milestone';
  status: 'backlog' | 'in_progress' | 'review' | 'done';
  priority?: 'low' | 'medium' | 'high';
  assignee?: string;
  assignees?: string[];
  assigneeType?: 'me' | 'team' | 'vendor';
  dueDate?: string;
  createdAt: string;
  completionType?: 'full' | 'partial';
  completionReport?: string;
  continuationTaskId?: string;
  completedAt?: string;
  progressLogs?: TaskProgressEntry[];
};

export type GlobalMemberRole = 'admin' | 'collaborator' | 'vendor' | 'viewer';

export type GlobalMember = {
  id: string;
  name: string;
  role: GlobalMemberRole;
  email?: string;
  phone?: string;
  organization?: string;
  createdAt: string;
};

export type DbState = {
  users: User[];
  projects: Project[];
  workItems: WorkItem[];
  teamDirectory: GlobalMember[];
};

function createDefaultDb(): DbState {
  return {
    users: [
      {
        id: 'u-1',
        email: 'jorge@nexus.local',
        name: 'Jorge',
        password: '123456',
        role: 'owner'
      }
    ],
    projects: [
      {
        id: 'p-1',
        name: 'Proyecto TI Personal',
        description: 'Gestión de entregables y tareas técnicas.',
        template: 'kanban',
        status: 'execution',
        role: 'lead',
        admins: ['Jorge'],
        members: ['Marta'],
        targetDate: '2026-10-15'
      },
      {
        id: 'p-2',
        name: 'Infraestructura Cloud',
        description: 'Mantenimiento y despliegues del entorno en conjunto.',
        template: 'scrum',
        status: 'execution',
        role: 'collaborator',
        admins: ['Luis', 'Jorge'],
        members: ['Proveedor AWS', 'DevOps'],
        targetDate: '2026-10-09'
      },
      {
        id: 'p-3',
        name: 'Migración Base de Datos Softland',
        description: 'Actualización y pase a producción.',
        template: 'pmi',
        status: 'review',
        role: 'lead',
        admins: ['Jorge'],
        members: ['Ana', 'Consultor Softland'],
        targetDate: '2026-10-02'
      }
    ],
    workItems: [
      {
        id: 'wi-1',
        projectId: 'p-1',
        title: 'Diseñar arquitectura y endpoints',
        description: 'Definir endpoints y validación.',
        type: 'task',
        status: 'done',
        priority: 'high',
        assignee: 'Jorge',
        assigneeType: 'me',
        dueDate: '2026-09-30',
        createdAt: new Date().toISOString()
      },
      {
        id: 'wi-2',
        projectId: 'p-1',
        title: 'Implementar vista de Agenda y Calendario',
        description: 'Crear vistas de Día, Semana y Calendario.',
        type: 'task',
        status: 'in_progress',
        priority: 'high',
        assignee: 'Jorge',
        assigneeType: 'me',
        dueDate: '2026-10-01',
        createdAt: new Date().toISOString()
      },
      {
        id: 'wi-3',
        projectId: 'p-1',
        title: 'Revisión de seguridad y variables de entorno',
        description: 'Auditoría inicial de secretos.',
        type: 'task',
        status: 'backlog',
        priority: 'medium',
        assignee: 'Marta',
        assigneeType: 'team',
        dueDate: '2026-10-05',
        createdAt: new Date().toISOString()
      },
      {
        id: 'wi-4',
        projectId: 'p-2',
        title: 'Configuración de Caddy y certificados SSL',
        description: 'Asegurar proxy inverso.',
        type: 'task',
        status: 'review',
        priority: 'high',
        assignee: 'Luis',
        assigneeType: 'team',
        dueDate: '2026-10-01',
        createdAt: new Date().toISOString()
      },
      {
        id: 'wi-5',
        projectId: 'p-2',
        title: 'Validar backup automatizado en S3',
        description: 'Script de respaldo nocturno.',
        type: 'task',
        status: 'in_progress',
        priority: 'medium',
        assignee: 'Jorge',
        assigneeType: 'me',
        dueDate: '2026-10-03',
        createdAt: new Date().toISOString()
      },
      {
        id: 'wi-6',
        projectId: 'p-3',
        title: 'Script de migración de esquemas',
        description: 'Transformación de tablas de usuarios.',
        type: 'task',
        status: 'done',
        priority: 'high',
        assignee: 'Jorge',
        dueDate: '2026-09-28',
        createdAt: new Date().toISOString()
      },
      {
        id: 'wi-7',
        projectId: 'p-3',
        title: 'Pruebas de carga y estrés',
        description: 'Comprobar tiempos de respuesta en Softland.',
        type: 'task',
        status: 'in_progress',
        priority: 'high',
        assignee: 'Ana',
        dueDate: '2026-10-02',
        createdAt: new Date().toISOString()
      }
    ],
    teamDirectory: [
      {
        id: 'dir-jorge',
        name: 'Jorge',
        role: 'admin',
        email: 'jorge@nexus.local',
        organization: 'Líder TI / Dirección',
        createdAt: '2026-09-01T00:00:00.000Z'
      },
      {
        id: 'dir-marta',
        name: 'Marta',
        role: 'collaborator',
        email: 'marta@nexus.local',
        organization: 'Equipo TI / Calidad',
        createdAt: '2026-09-01T00:00:00.000Z'
      },
      {
        id: 'dir-luis',
        name: 'Luis',
        role: 'collaborator',
        email: 'luis@nexus.local',
        organization: 'Cloud & DevOps',
        createdAt: '2026-09-01T00:00:00.000Z'
      },
      {
        id: 'dir-ana',
        name: 'Ana',
        role: 'collaborator',
        email: 'ana@nexus.local',
        organization: 'Base de Datos / DBA',
        createdAt: '2026-09-01T00:00:00.000Z'
      },
      {
        id: 'dir-aws',
        name: 'Proveedor AWS',
        role: 'vendor',
        email: 'support@aws.com',
        organization: 'Amazon Web Services',
        createdAt: '2026-09-01T00:00:00.000Z'
      },
      {
        id: 'dir-softland',
        name: 'Consultor Softland',
        role: 'vendor',
        email: 'consultoria@softland.cr',
        organization: 'Softland ERP Corp',
        createdAt: '2026-09-01T00:00:00.000Z'
      }
    ]
  };
}

export function syncProjectMembers(project: Project): Project {
  if (Array.isArray(project.teamMembers) && project.teamMembers.length > 0) {
    project.admins = project.teamMembers
      .filter((m) => m.role === 'admin')
      .map((m) => m.name);
    project.members = project.teamMembers
      .filter((m) => m.role !== 'admin')
      .map((m) => m.name);
  } else {
    const admins = Array.isArray(project.admins) && project.admins.length > 0 ? project.admins : ['Jorge'];
    const members = Array.isArray(project.members) ? project.members : [];
    const synthesized: ProjectMember[] = [];
    admins.forEach((name, idx) => {
      synthesized.push({
        id: `mem-adm-${idx}-${project.id || 'p'}`,
        name,
        role: 'admin'
      });
    });
    members.forEach((name, idx) => {
      const isVendor = /proveedor|soporte|pasarela|gps|aws|dell|claro|bac|consultor/i.test(name);
      synthesized.push({
        id: `mem-usr-${idx}-${project.id || 'p'}`,
        name,
        role: isVendor ? 'vendor' : 'collaborator'
      });
    });
    project.teamMembers = synthesized;
    project.admins = admins;
    project.members = members;
  }
  return project;
}

export function harvestTeamDirectory(projects: Project[] = [], workItems: WorkItem[] = []): GlobalMember[] {
  const memberMap = new Map<string, GlobalMember>();

  const defaults: GlobalMember[] = [
    {
      id: 'dir-jorge',
      name: 'Jorge',
      role: 'admin',
      email: 'jorge@nexus.local',
      organization: 'Líder TI / Dirección',
      createdAt: '2026-09-01T00:00:00.000Z'
    },
    {
      id: 'dir-marta',
      name: 'Marta',
      role: 'collaborator',
      email: 'marta@nexus.local',
      organization: 'Equipo TI / Calidad',
      createdAt: '2026-09-01T00:00:00.000Z'
    },
    {
      id: 'dir-luis',
      name: 'Luis',
      role: 'collaborator',
      email: 'luis@nexus.local',
      organization: 'Cloud & DevOps',
      createdAt: '2026-09-01T00:00:00.000Z'
    },
    {
      id: 'dir-ana',
      name: 'Ana',
      role: 'collaborator',
      email: 'ana@nexus.local',
      organization: 'Base de Datos / DBA',
      createdAt: '2026-09-01T00:00:00.000Z'
    },
    {
      id: 'dir-aws',
      name: 'Proveedor AWS',
      role: 'vendor',
      email: 'support@aws.com',
      organization: 'Amazon Web Services',
      createdAt: '2026-09-01T00:00:00.000Z'
    },
    {
      id: 'dir-softland',
      name: 'Consultor Softland',
      role: 'vendor',
      email: 'consultoria@softland.cr',
      organization: 'Softland ERP Corp',
      createdAt: '2026-09-01T00:00:00.000Z'
    }
  ];

  defaults.forEach((d) => memberMap.set(d.name.toLowerCase().trim(), d));

  projects.forEach((proj) => {
    (proj.teamMembers || []).forEach((m) => {
      const key = m.name?.trim().toLowerCase();
      if (key && !memberMap.has(key)) {
        memberMap.set(key, {
          id: `dir-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name: m.name.trim(),
          role: m.role || 'collaborator',
          email: m.email || '',
          organization: m.role === 'vendor' ? 'Proveedor / Tercero' : 'Equipo Interno',
          createdAt: new Date().toISOString()
        });
      }
    });

    (proj.admins || []).forEach((adm) => {
      const key = adm?.trim().toLowerCase();
      if (key && !memberMap.has(key)) {
        memberMap.set(key, {
          id: `dir-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name: adm.trim(),
          role: 'admin',
          organization: 'Administración TI',
          createdAt: new Date().toISOString()
        });
      }
    });

    (proj.members || []).forEach((mem) => {
      const key = mem?.trim().toLowerCase();
      if (key && !memberMap.has(key)) {
        const isVendor = /proveedor|soporte|consultor|aws|dell|claro|bac|softland/i.test(mem);
        memberMap.set(key, {
          id: `dir-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name: mem.trim(),
          role: isVendor ? 'vendor' : 'collaborator',
          organization: isVendor ? 'Proveedor / Tercero' : 'Equipo Interno',
          createdAt: new Date().toISOString()
        });
      }
    });
  });

  workItems.forEach((wi) => {
    const list = Array.isArray(wi.assignees) && wi.assignees.length > 0
      ? wi.assignees
      : (typeof wi.assignee === 'string' ? wi.assignee.split(',') : []);
    list.forEach((raw) => {
      const name = raw?.trim();
      const key = name?.toLowerCase();
      if (key && !memberMap.has(key)) {
        const isVendor = /proveedor|soporte|consultor/i.test(name);
        memberMap.set(key, {
          id: `dir-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name,
          role: isVendor ? 'vendor' : 'collaborator',
          organization: isVendor ? 'Proveedor / Tercero' : 'Equipo Interno',
          createdAt: new Date().toISOString()
        });
      }
    });
  });

  return Array.from(memberMap.values());
}

export function getNextProjectCode(projects: Project[]): string {
  let maxNum = 0;
  for (const p of projects) {
    if (p.code) {
      const match = p.code.match(/^P(\d+)$/i);
      if (match) {
        const n = parseInt(match[1], 10);
        if (n > maxNum) maxNum = n;
      }
    }
  }
  return `P${maxNum + 1}`;
}

export function getNextWorkItemCode(workItems: WorkItem[], projectCode: string): string {
  const cleanCode = projectCode ? projectCode.toUpperCase() : 'P1';
  const prefix = `${cleanCode}-T`;
  let maxNum = 0;
  for (const w of workItems) {
    if (w.code && w.code.toUpperCase().startsWith(prefix)) {
      const numPart = w.code.substring(prefix.length);
      const n = parseInt(numPart, 10);
      if (!isNaN(n) && n > maxNum) maxNum = n;
    }
  }
  return `${prefix}${maxNum + 1}`;
}

function normalizeDb(raw: Partial<DbState> | null | undefined): DbState {
  const defaults = createDefaultDb();
  
  // 1. Normalizar proyectos y asignarles código P# secuencial si no lo tienen
  const rawProjects = Array.isArray(raw?.projects) && raw.projects.length
    ? raw.projects
    : defaults.projects;

  let projectCounter = 1;
  const projectCodeMap = new Map<string, string>();

  const projects = rawProjects.map((project) => {
    let code = project.code;
    if (!code) {
      code = `P${projectCounter++}`;
    } else {
      const m = code.match(/^P(\d+)$/i);
      if (m) {
        const num = parseInt(m[1], 10);
        if (num >= projectCounter) projectCounter = num + 1;
      }
    }
    projectCodeMap.set(project.id, code);

    return syncProjectMembers({
      ...project,
      code,
      status: project.status || 'execution',
      role: project.role || 'lead',
      targetDate: project.targetDate || '',
      admins: project.admins || ['Jorge'],
      members: project.members || []
    });
  });

  // 2. Normalizar tareas y asignarles código P#-T# correlativo por proyecto
  const rawWorkItems = Array.isArray(raw?.workItems) && raw.workItems.length
    ? raw.workItems
    : defaults.workItems;

  const projectTaskCounters = new Map<string, number>();

  const workItems = rawWorkItems.map((item) => {
    const projCode = projectCodeMap.get(item.projectId) || 'P1';
    let code = item.code;

    if (!code) {
      const currentCounter = (projectTaskCounters.get(projCode) || 0) + 1;
      projectTaskCounters.set(projCode, currentCounter);
      code = `${projCode}-T${currentCounter}`;
    } else {
      const prefix = `${projCode}-T`;
      if (code.toUpperCase().startsWith(prefix.toUpperCase())) {
        const num = parseInt(code.substring(prefix.length), 10);
        const cur = projectTaskCounters.get(projCode) || 0;
        if (!isNaN(num) && num > cur) {
          projectTaskCounters.set(projCode, num);
        }
      }
    }

    return {
      ...item,
      code,
      assignee: item.assignee || 'Jorge',
      dueDate: item.dueDate || '',
      completionType: item.completionType || (item.status === 'done' ? 'full' : undefined),
      completionReport: item.completionReport || '',
      continuationTaskId: item.continuationTaskId || undefined,
      completedAt: item.completedAt || (item.status === 'done' ? (item.createdAt || new Date().toISOString()) : undefined),
      progressLogs: Array.isArray(item.progressLogs) ? item.progressLogs : []
    };
  });

  const teamDirectory = Array.isArray(raw?.teamDirectory) && raw.teamDirectory.length > 0
    ? raw.teamDirectory.map((m) => ({
        ...m,
        role: m.role || 'collaborator',
        organization: m.organization || (m.role === 'vendor' ? 'Proveedor / Tercero' : 'Equipo Interno'),
        createdAt: m.createdAt || new Date().toISOString()
      }))
    : harvestTeamDirectory(projects, workItems);

  return {
    users: Array.isArray(raw?.users) && raw.users.length ? raw.users : defaults.users,
    projects,
    workItems,
    teamDirectory
  };
}

export function getDbPath(): string {
  const candidates = [
    path.resolve(process.cwd(), 'data', 'db.json'),
    path.resolve(process.cwd(), 'apps', 'api', 'data', 'db.json'),
    path.resolve(process.cwd(), '..', 'apps', 'api', 'data', 'db.json'),
    path.resolve(__dirname, '..', 'data', 'db.json'),
    path.resolve(__dirname, '..', '..', 'data', 'db.json')
  ];

  for (const candidate of candidates) {
    if (candidate.includes('apps\\api\\data') || candidate.includes('apps/api/data')) {
      return candidate;
    }
  }

  return candidates[0];
}

export function readDb(): DbState {
  const dbPath = getDbPath();

  if (!fs.existsSync(dbPath)) {
    const defaultDb = createDefaultDb();
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    fs.writeFileSync(dbPath, JSON.stringify(defaultDb, null, 2));
    return defaultDb;
  }

  try {
    const raw = fs.readFileSync(dbPath, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<DbState>;
    const normalized = normalizeDb(parsed);
    if (JSON.stringify(normalized) !== raw.trim()) {
      fs.writeFileSync(dbPath, JSON.stringify(normalized, null, 2));
    }
    return normalized;
  } catch (error) {
    const defaultDb = createDefaultDb();
    fs.writeFileSync(dbPath, JSON.stringify(defaultDb, null, 2));
    return defaultDb;
  }
}

export function writeDb(state: DbState): void {
  const dbPath = getDbPath();
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  fs.writeFileSync(dbPath, JSON.stringify(state, null, 2));
}
