import React, { useEffect, useState, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import './styles/tokens.css';
import './styles/shell.css';
import './styles/ui.css';
import './styles/dashboard.css';
import './styles/gantt.css';
import './styles/kanban.css';
import './styles/portfolio.css';
import './styles/agenda.css';
import './styles/roadmap.css';

import { AppShell } from './components/layout/AppShell';
import { HomeView } from './views/HomeView';
import { TasksView } from './views/TasksView';
import { ProjectsView } from './views/ProjectsView';
import { KanbanView } from './views/KanbanView';
import { TimelineView } from './views/TimelineView';
import { AgendaView } from './views/AgendaView';
import { DirectoryView } from './views/DirectoryView';
import { DailyCheckView } from './views/DailyCheckView';
import { ProjectDrawer } from './components/forms/ProjectDrawer';
import { TaskDrawer } from './components/forms/TaskDrawer';
import { AssigneeDropdownPicker } from './components/forms/AssigneeDropdownPicker';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4001/api';

/* --- ICONOS TÉCNICOS VECTORIALES (Sin emojis clichés) --- */
const Icons = {
  Portfolio: () => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3v18M3 12h18" opacity="0.4" />
      <circle cx="12" cy="12" r="3" fill="currentColor" fillOpacity="0.2" />
    </svg>
  ),
  Agenda: () => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
      <circle cx="8" cy="15" r="1" fill="currentColor" />
      <circle cx="12" cy="15" r="1" fill="currentColor" />
      <circle cx="16" cy="15" r="1" fill="currentColor" />
    </svg>
  ),
  Kanban: () => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="7" height="16" rx="1.5" />
      <rect x="14" y="4" width="7" height="11" rx="1.5" />
    </svg>
  ),
  Lead: () => (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="5" r="2.5" />
      <path d="M12 7.5V20M7 13h10M5 18c2 2 12 2 14 0" />
    </svg>
  ),
  Collaborator: () => (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="12" r="4.5" />
      <circle cx="16" cy="12" r="4.5" />
    </svg>
  ),
  Day: () => (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="8" />
      <path d="M12 7v5l3 2" />
    </svg>
  ),
  Week: () => (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M7 4v16M11 4v16M15 4v16M19 4v16" opacity="0.5" />
    </svg>
  ),
  Month: () => (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 9h18M3 14h18M9 4v16M15 4v16" opacity="0.4" />
    </svg>
  ),
  User: () => (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="7" r="4" />
      <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
    </svg>
  ),
  Team: () => (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="7" r="3" />
      <path d="M4 20v-1a3 3 0 0 1 3-3h4a3 3 0 0 1 3 3v1" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M15 17c1.5-.5 3 .5 3 2v1" />
    </svg>
  ),
  Alert: () => (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <circle cx="12" cy="17" r="1" fill="currentColor" />
    </svg>
  ),
  Check: () => (
    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  Calendar: () => (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  Sun: () => (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  ),
  Moon: () => (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  ),
  Plus: () => (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  ArrowRight: () => (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  ),
  ArrowLeft: () => (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  ),
  TargetPulse: () => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  ),
  Trash: () => (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  ),
  Vendor: () => (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  ),
  ShieldAdmin: () => (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  Edit: () => (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  Close: () => (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  UsersGear: () => (
    <svg viewBox="0 0 640 512" width="16" height="16" fill="currentColor">
      <path d="M144 160A80 80 0 1 0 144 0a80 80 0 1 0 0 160zm368 0A80 80 0 1 0 512 0a80 80 0 1 0 0 160zM0 298.7C0 310.4 9.6 320 21.3 320l213.3 0c.2 0 .4 0 .7 0c-26.6-23.5-43.3-57.8-43.3-96c0-7.6 .7-15 1.9-22.3c-13.6-6.3-28.7-9.7-44.6-9.7l-42.7 0C47.8 192 0 239.8 0 298.7zM320 320c24 0 45.9-8.8 62.7-23.3c2.5-3.7 5.2-7.3 8-10.7c2.7-3.3 5.7-6.1 9-8.3C410 262.3 416 243.9 416 224c0-53-43-96-96-96s-96 43-96 96s43 96 96 96zm65.4 60.2c-10.3-5.9-18.1-16.2-20.8-28.2l-103.2 0C187.7 352 128 411.7 128 485.3c0 14.7 11.9 26.7 26.7 26.7l300.6 0c-2.1-5.2-3.2-10.9-3.2-16.4l0-3c-1.3-.7-2.7-1.5-4-2.3l-2.6 1.5c-16.8 9.7-40.5 8-54.7-9.7c-4.5-5.6-8.6-11.5-12.4-17.6l-.1-.2-.1-.2-2.4-4.1-.1-.2-.1-.2c-3.4-6.2-6.4-12.6-9-19.3c-8.2-21.2 2.2-42.6 19-52.3l2.7-1.5c0-.8 0-1.5 0-2.3s0-1.5 0-2.3l-2.7-1.5zM533.3 192l-42.7 0c-15.9 0-31 3.5-44.6 9.7c1.3 7.2 1.9 14.7 1.9 22.3c0 17.4-3.5 33.9-9.7 49c2.5 .9 4.9 2 7.1 3.3l2.6 1.5c1.3-.8 2.6-1.6 4-2.3l0-3c0-19.4 13.3-39.1 35.8-42.6c7.9-1.2 16-1.9 24.2-1.9s16.3 .6 24.2 1.9c22.5 3.5 35.8 23.2 35.8 42.6l0 3c1.3 .7 2.7 1.5 4 2.3l2.6-1.5c16.8-9.7 40.5-8 54.7 9.7c2.3 2.8 4.5 5.8 6.6 8.7c-2.1-57.1-49-102.7-106.6-102.7zm91.3 163.9c6.3-3.6 9.5-11.1 6.8-18c-2.1-5.5-4.6-10.8-7.4-15.9l-2.3-4c-3.1-5.1-6.5-9.9-10.2-14.5c-4.6-5.7-12.7-6.7-19-3l-2.9 1.7c-9.2 5.3-20.4 4-29.6-1.3s-16.1-14.5-16.1-25.1l0-3.4c0-7.3-4.9-13.8-12.1-14.9c-6.5-1-13.1-1.5-19.9-1.5s-13.4 .5-19.9 1.5c-7.2 1.1-12.1 7.6-12.1 14.9l0 3.4c0 10.6-6.9 19.8-16.1 25.1s-20.4 6.6-29.6 1.3l-2.9-1.7c-6.3-3.6-14.4-2.6-19 3c-3.7 4.6-7.1 9.5-10.2 14.6l-2.3 3.9c-2.8 5.1-5.3 10.4-7.4 15.9c-2.6 6.8 .5 14.3 6.8 17.9l2.9 1.7c9.2 5.3 13.7 15.8 13.7 26.4s-4.5 21.1-13.7 26.4l-3 1.7c-6.3 3.6-9.5 11.1-6.8 17.9c2.1 5.5 4.6 10.7 7.4 15.8l2.4 4.1c3 5.1 6.4 9.9 10.1 14.5c4.6 5.7 12.7 6.7 19 3l2.9-1.7c9.2-5.3 20.4-4 29.6 1.3s16.1 14.5 16.1 25.1l0 3.4c0 7.3 4.9 13.8 12.1 14.9c6.5 1 13.1 1.5 19.9 1.5s13.4-.5 19.9-1.5c7.2-1.1 12.1-7.6 12.1-14.9l0-3.4c0-10.6 6.9-19.8 16.1-25.1s20.4-6.6 29.6-1.3l2.9 1.7c6.3 3.6 14.4 2.6 19-3c3.7-4.6 7.1-9.4 10.1-14.5l2.4-4.2c2.8-5.1 5.3-10.3 7.4-15.8c2.6-6.8-.5-14.3-6.8-17.9l-3-1.7c-9.2-5.3-13.7-15.8-13.7-26.4s4.5-21.1 13.7-26.4l3-1.7zM472 384a40 40 0 1 1 80 0 40 40 0 1 1 -80 0z" />
    </svg>
  ),
  StagePreproject: () => (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  ),
  StageReview: () => (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
      <circle cx="11" cy="11" r="3" />
    </svg>
  ),
  StageExecution: () => (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  StageCompleted: () => (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  StageDiscarded: () => (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
    </svg>
  ),
  Search: () => (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  FileText: () => (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  ),
  Tasks: () => (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  ),
  MessageSquare: () => (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  History: () => (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M12 7v5l4 2" />
    </svg>
  ),
  Clock: () => (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  Zap: () => (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  DailyCheck: () => (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      <path d="M9 14l2 2 4-4" />
    </svg>
  )
};

const projectStages = [
  { key: 'preproject', label: 'Preproyecto', tone: 'neutral' },
  { key: 'review', label: 'En revisión', tone: 'warning' },
  { key: 'execution', label: 'En ejecución', tone: 'info' },
  { key: 'completed', label: 'Finalizados', tone: 'success' },
  { key: 'discarded', label: 'Descartados', tone: 'danger' }
];

const stageLabelMap = {
  preproject: 'Preproyecto',
  review: 'En revisión',
  execution: 'En ejecución',
  completed: 'Finalizados',
  discarded: 'Descartados'
};

const renderStageIcon = (status) => {
  switch (status) {
    case 'preproject': return <Icons.StagePreproject />;
    case 'review': return <Icons.StageReview />;
    case 'execution': return <Icons.StageExecution />;
    case 'completed': return <Icons.StageCompleted />;
    case 'discarded': return <Icons.StageDiscarded />;
    default: return <Icons.StageExecution />;
  }
};

const laneOrder = [
  { key: 'backlog', label: 'Backlog' },
  { key: 'in_progress', label: 'En curso' },
  { key: 'review', label: 'Validación' },
  { key: 'done', label: 'Hecho' }
];

const INITIAL_MEETINGS = [
  {
    id: 'meet-1',
    projectId: 'p-1',
    projectCode: 'P1',
    title: 'Alineación de Objetivos y Priorización del Ciclo',
    date: '2026-10-18',
    time: '09:00 - 10:15 AM',
    attendees: ['Jorge Calderón', 'Marta', 'DevOps'],
    notes: 'Se evaluaron los requerimientos clave para el cierre del sprint actual.\n\n• Se acordó priorizar la seguridad en endpoints y la validación de backups automáticos.\n• Se identificó una posible demora con la respuesta de soporte externo, por lo que se asignó un punto de contacto directo.',
    actionItems: [
      {
        id: 'act-1',
        text: 'Configurar variables de entorno y certificados en staging',
        assignee: 'Jorge Calderón',
        dueDate: '2026-10-24',
        createdTaskId: null
      },
      {
        id: 'act-2',
        text: 'Verificar logs de auditoría en el módulo de acceso',
        assignee: 'Marta',
        dueDate: '2026-10-23',
        createdTaskId: null
      }
    ],
    createdAt: '2026-10-18T10:15:00.000Z'
  },
  {
    id: 'meet-2',
    projectId: 'p7',
    projectCode: 'P7',
    title: 'Alineación de Hallazgos y Priorización TrueSec',
    date: '2026-10-19',
    time: '14:00 - 15:30 PM',
    attendees: ['Jorge Calderón', 'Auditor TrueSec', 'Jean Paul TI', 'CISO'],
    notes: 'Revisión exhaustiva de las observaciones de seguridad emitidas por TrueSec.\n\n• Hallazgos críticos: 2 asociados con hardening en APIs y secretos en Key Vault.\n• Hallazgos medios: 8 relacionados con retención de logs y roles IAM de privilegio mínimo.\n• Compromiso: Remediaciones quincenales con reporte ejecutivo los viernes.',
    actionItems: [
      {
        id: 'act-3',
        text: 'Depurar cuentas con privilegios administrativos huérfanas en Azure AD',
        assignee: 'Jean Paul TI',
        dueDate: '2026-10-25',
        createdTaskId: null
      },
      {
        id: 'act-4',
        text: 'Habilitar MFA condicional estricto para accesos externos y VPN',
        assignee: 'Jorge Calderón',
        dueDate: '2026-10-22',
        createdTaskId: null
      }
    ],
    createdAt: '2026-10-19T15:30:00.000Z'
  }
];

function formatDateYMD(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDateShort(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T12:00:00');
  if (isNaN(d.getTime())) return String(dateStr);
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return `${d.getDate()} ${months[d.getMonth()]}`;
}

function formatDateFull(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T12:00:00');
  if (isNaN(d.getTime())) return String(dateStr);
  const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  return `${d.getDate()} de ${months[d.getMonth()]}, ${d.getFullYear()}`;
}

function formatDateTime(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return String(isoStr);
  const day = d.getDate();
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12 || 12;
  return `${day} ${month} ${year}, ${hours}:${minutes} ${ampm}`;
}

function getTaskFreshness(task, todayStr) {
  if (!task) return { status: 'none', days: 0, label: '', isStale: false };
  if (task.status === 'done') {
    return { status: 'done', days: 0, label: 'Completada', isStale: false };
  }

  let latestDate = null;
  let latestLogText = null;
  let latestAuthor = null;

  if (Array.isArray(task.progressLogs) && task.progressLogs.length > 0) {
    const validLogs = task.progressLogs.filter((l) => l && l.createdAt);
    if (validLogs.length > 0) {
      const sorted = [...validLogs].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      const d = new Date(sorted[0].createdAt);
      if (!isNaN(d.getTime())) {
        latestDate = d;
        latestLogText = sorted[0].text;
        latestAuthor = sorted[0].author;
      }
    }
  }

  if (!latestDate && task.createdAt) {
    const d = new Date(task.createdAt);
    if (!isNaN(d.getTime())) {
      latestDate = d;
    }
  }

  if (!latestDate) {
    return {
      status: 'stale',
      days: 3,
      label: '> 2 días sin update',
      isStale: true,
      latestLogText: null,
      latestAuthor: null
    };
  }

  const now = new Date();
  const diffMs = now.getTime() - latestDate.getTime();
  const diffDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

  if (diffDays === 0) {
    return {
      status: 'fresh',
      days: 0,
      label: 'Al día (hoy)',
      isStale: false,
      latestLogText,
      latestAuthor
    };
  } else if (diffDays === 1) {
    return {
      status: 'attention',
      days: 1,
      label: '1 día sin update',
      isStale: false,
      latestLogText,
      latestAuthor
    };
  } else {
    return {
      status: 'stale',
      days: diffDays,
      label: `${diffDays} días sin update`,
      isStale: true,
      latestLogText,
      latestAuthor
    };
  }
}

function getTaskAssignees(item) {
  if (!item) return [];
  if (Array.isArray(item.assignees) && item.assignees.length > 0) {
    return item.assignees.map((s) => String(s).trim()).filter(Boolean);
  }
  if (item.assignee && typeof item.assignee === 'string') {
    return item.assignee.split(',').map((s) => s.trim()).filter(Boolean);
  }
  return ['Jorge'];
}

function isAssigneeMine(name) {
  const n = String(name || '').toLowerCase().trim();
  return n === 'jorge' || n === 'jorge (yo)' || n === 'yo' || n === 'me';
}

function isAssigneeVendor(name, item) {
  const n = String(name || '').toLowerCase().trim();
  return (
    (item && item.assigneeType === 'vendor') ||
    n.includes('proveedor') ||
    n.includes('consultor') ||
    n.includes('soporte') ||
    n.includes('tercero') ||
    n.includes('claro') ||
    n.includes('aws')
  );
}

function AssigneeBadge({ item }) {
  if (!item) return null;
  const assignees = getTaskAssignees(item);
  if (assignees.length === 0) return null;

  if (assignees.length === 1) {
    const a = assignees[0];
    const isMine = isAssigneeMine(a);
    const isVendor = isAssigneeVendor(a, item);

    if (isVendor) {
      return (
        <span className="assignee-chip is-vendor" title={`Proveedor / Tercero: ${a}`}>
          <Icons.Vendor />
          <span>{a}</span>
        </span>
      );
    }

    if (isMine) {
      return (
        <span className="assignee-chip is-mine" title="Asignado a mí (Jorge)">
          <Icons.User />
          <span>Jorge (Yo)</span>
        </span>
      );
    }

    return (
      <span className="assignee-chip is-team" title={`Colaborador de equipo: ${a}`}>
        <Icons.Team />
        <span>{a}</span>
      </span>
    );
  }

  // Múltiples asignados
  return (
    <div className="multi-assignees-wrap" title={`Asignados (${assignees.length}): ${assignees.join(', ')}`}>
      {assignees.slice(0, 2).map((a, idx) => {
        const isMine = isAssigneeMine(a);
        const isVendor = isAssigneeVendor(a, item);
        const chipClass = isMine ? 'is-mine' : isVendor ? 'is-vendor' : 'is-team';
        const IconComponent = isMine ? Icons.User : isVendor ? Icons.Vendor : Icons.Team;
        const displayName = isMine ? 'Jorge (Yo)' : a;

        return (
          <span key={idx} className={`assignee-chip ${chipClass} multi-assignee-chip`}>
            <IconComponent />
            <span>{displayName}</span>
          </span>
        );
      })}
      {assignees.length > 2 && (
        <span className="assignee-chip multi-assignee-more" title={assignees.slice(2).join(', ')}>
          +{assignees.length - 2}
        </span>
      )}
    </div>
  );
}

function TaskAssigneesSelector({
  projectId,
  projects,
  teamDirectory = [],
  selectedAssignees,
  onChangeAssignees,
  onOpenNewDirectoryModal,
  currentUser = null
}) {
  return (
    <div className="assignees-selector-block" style={{ padding: '10px 12px' }}>
      <AssigneeDropdownPicker
        id="task-edit-assignees"
        label="Personas Asignadas / Ejecutores"
        required={true}
        allowMultiple={true}
        selectedAssignees={selectedAssignees}
        onChangeAssignees={onChangeAssignees}
        teamDirectory={teamDirectory}
        currentUser={currentUser}
        placeholder="-- Seleccionar de la lista de usuarios --"
        hint="Selecciona de la lista desplegable los usuarios registrados en el sistema."
      />
      {onOpenNewDirectoryModal && (
        <div className="custom-assignee-row" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px', paddingTop: '6px', borderTop: '1px dashed var(--line-200)' }}>
          <button
            type="button"
            className="ui-btn ui-btn--secondary ui-btn--small"
            onClick={onOpenNewDirectoryModal}
            title="Abrir formulario para registrar nuevo participante en el Directorio Global"
          >
            <Icons.Plus /> <span>Registrar nuevo en Directorio</span>
          </button>
          <span className="muted" style={{ fontSize: '0.78rem' }}>
            Si la persona aún no está registrada en el sistema
          </span>
        </div>
      )}
    </div>
  );
}

function App() {
  const [session, setSession] = useState(() => {
    const raw = localStorage.getItem('nexus-session');
    return raw ? JSON.parse(raw) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('nexus-token') || '');
  const user = session;

  // TEMA: CLARO POR DEFECTO (OPCIÓN A OSCURO)
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('nexus-theme') === 'dark');

  useEffect(() => {
    const theme = darkMode ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    document.body.setAttribute('data-theme', theme);
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
  }, [darkMode]);

  // Navigation & Espacio (Todos / Trabajo / Personal)
  const [activeView, setActiveView] = useState('home');
  const [space, setSpace] = useState(() => localStorage.getItem('nexus-space') || 'all');
  const handleSpaceChange = (newSpace) => {
    setSpace(newSpace);
    localStorage.setItem('nexus-space', newSpace);
  };
  const [portfolioSubView, setPortfolioSubView] = useState('cards'); // 'cards' | 'timeline'
  const [timelineFilter, setTimelineFilter] = useState('all'); // 'all' | 'extended' | 'ontrack'
  const [justificationModalProject, setJustificationModalProject] = useState(null);
  const [newExtensionModalProject, setNewExtensionModalProject] = useState(null);
  const [extensionForm, setExtensionForm] = useState({
    newTargetDate: '',
    reason: '',
    requestedBy: '',
    approvedBy: 'Jorge'
  });
  const [agendaSubView, setAgendaSubView] = useState('day');
  const [agendaFilter, setAgendaFilter] = useState('all');
  const [highlightedProjectId, setHighlightedProjectId] = useState(null);

  // Data
  const [projects, setProjects] = useState([]);
  const [workItems, setWorkItems] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [meetings, setMeetings] = useState(() => {
    try {
      const saved = localStorage.getItem('nexus-project-meetings');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Error reading nexus-project-meetings', e);
    }
    return INITIAL_MEETINGS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('nexus-project-meetings', JSON.stringify(meetings));
    } catch (e) {
      console.warn('Error saving nexus-project-meetings', e);
    }
  }, [meetings]);

  // Filters
  const [roleFilter, setRoleFilter] = useState('all');
  const [stageFilter, setStageFilter] = useState('all');

  // Calendar
  const [calDate, setCalDate] = useState(() => new Date());
  const [selectedCalDay, setSelectedCalDay] = useState(() => formatDateYMD(new Date()));
  const [weekDate, setWeekDate] = useState(() => new Date());
  const [weekIncludeWeekend, setWeekIncludeWeekend] = useState(true);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modals
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [isEditTaskModalOpen, setIsEditTaskModalOpen] = useState(false);
  const [isDoneReportModalOpen, setIsDoneReportModalOpen] = useState(false);
  const [doneReportFilter, setDoneReportFilter] = useState('all'); // 'all' | 'full' | 'partial'
  const [doneReportSearch, setDoneReportSearch] = useState('');
  const [isProjectStatusModalOpen, setIsProjectStatusModalOpen] = useState(false);
  const [statusModalProject, setStatusModalProject] = useState(null);
  const [copiedStatusReport, setCopiedStatusReport] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [newProgressText, setNewProgressText] = useState('');
  const [newProgressAuthor, setNewProgressAuthor] = useState('');
  const [isAddingProgress, setIsAddingProgress] = useState(false);

  // Cadencia y Daily Check-in de Tareas
  const [isDailyCheckinModalOpen, setIsDailyCheckinModalOpen] = useState(false);
  const [dailyCheckinTasks, setDailyCheckinTasks] = useState([]);
  const [dailyCheckinIndex, setDailyCheckinIndex] = useState(0);
  const [dailyCheckinInputText, setDailyCheckinInputText] = useState('');
  const [isSubmittingDailyCheckin, setIsSubmittingDailyCheckin] = useState(false);
  const [kanbanRadarOnly, setKanbanRadarOnly] = useState(false);
  const [inlineUpdateTaskId, setInlineUpdateTaskId] = useState(null);
  const [inlineUpdateText, setInlineUpdateText] = useState('');
  const [isSubmittingInlineUpdate, setIsSubmittingInlineUpdate] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [editingProject, setEditingProject] = useState(null);
  const [editProjectForm, setEditProjectForm] = useState({
    id: '',
    name: '',
    description: '',
    template: 'kanban',
    status: 'execution',
    role: 'lead',
    startDate: '',
    targetDate: ''
  });
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [managingProject, setManagingProject] = useState(null);
  const [teamRoleFilter, setTeamRoleFilter] = useState('all');
  const [editingMemberId, setEditingMemberId] = useState(null);
  const [editMemberForm, setEditMemberForm] = useState({ name: '', role: 'collaborator', email: '' });
  const [newMemberForm, setNewMemberForm] = useState({
    name: '',
    role: 'collaborator',
    email: ''
  });

  // Directorio Global de Equipo & Terceros
  const [teamDirectory, setTeamDirectory] = useState([]);
  const [directoryRoleFilter, setDirectoryRoleFilter] = useState('all');
  const [directorySearch, setDirectorySearch] = useState('');
  const [isNewDirectoryModalOpen, setIsNewDirectoryModalOpen] = useState(false);
  const [directoryModalError, setDirectoryModalError] = useState(null);
  const [editDirectoryModalError, setEditDirectoryModalError] = useState(null);
  const [accountModalError, setAccountModalError] = useState(null);
  const [newDirectoryForm, setNewDirectoryForm] = useState({
    name: '',
    role: 'collaborator',
    organization: '',
    email: '',
    phone: '',
    createAccount: false,
    password: '',
    userRole: 'member'
  });
  const [accountModalMember, setAccountModalMember] = useState(null);
  const [accountPasswordForm, setAccountPasswordForm] = useState({
    email: '',
    password: '',
    role: 'member'
  });
  const [editingDirectoryMember, setEditingDirectoryMember] = useState(null);
  const [editDirectoryForm, setEditDirectoryForm] = useState({
    name: '',
    role: 'collaborator',
    organization: '',
    email: '',
    phone: ''
  });
  const [directoryMemberToDelete, setDirectoryMemberToDelete] = useState(null);
  const [deletionBlockModal, setDeletionBlockModal] = useState(null);

  // Forms
  const [loginForm, setLoginForm] = useState({
    email: 'jorge@nexus.local',
    password: '123456'
  });

  const [projectForm, setProjectForm] = useState({
    name: '',
    description: '',
    template: 'kanban',
    status: 'execution',
    role: 'lead',
    admins: 'Jorge',
    members: '',
    startDate: '',
    targetDate: ''
  });

  const [taskForm, setTaskForm] = useState({
    projectId: '',
    title: '',
    description: '',
    type: 'task',
    status: 'backlog',
    priority: 'medium',
    assignees: ['Jorge'],
    assignee: 'Jorge',
    assigneeType: 'me',
    dueDate: formatDateYMD(new Date())
  });

  const [editTaskForm, setEditTaskForm] = useState({
    projectId: '',
    title: '',
    description: '',
    type: 'task',
    status: 'backlog',
    priority: 'medium',
    assignees: ['Jorge'],
    assignee: 'Jorge',
    assigneeType: 'me',
    dueDate: '',
    code: '',
    completionType: 'full',
    completionReport: '',
    continuationTaskId: '',
    completedAt: '',
    progressLogs: []
  });

  const todayStr = useMemo(() => formatDateYMD(new Date()), []);

  const toggleTheme = () => {
    setDarkMode((prev) => {
      const next = !prev;
      localStorage.setItem('nexus-theme', next ? 'dark' : 'light');
      return next;
    });
  };

  const fetchProjects = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/projects`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.status === 401) {
        logout();
        return;
      }
      const data = await res.json();
      const list = data.items || [];
      setProjects(list);
      if (list.length && !selectedProjectId) {
        setSelectedProjectId(list[0].id);
      }
    } catch (err) {
      console.error('Error al conectar con la API de proyectos:', err);
      setProjects([]);
    }
  };

  const fetchWorkItems = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/work-items`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.status === 401) {
        logout();
        return;
      }
      const data = await res.json();
      setWorkItems(data.items || []);
    } catch (err) {
      console.error('Error al conectar con la API de tareas:', err);
      setWorkItems([]);
    }
  };

  const fetchDirectory = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/directory`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.status === 401) {
        logout();
        return;
      }
      const data = await res.json();
      setTeamDirectory(data.items || []);
    } catch (err) {
      console.error('Error al conectar con la API del directorio:', err);
      setTeamDirectory([]);
    }
  };

  useEffect(() => {
    if (token) {
      fetchProjects();
      fetchWorkItems();
      fetchDirectory();
    }
  }, [token]);

  // Auto-cierre de notificaciones a los 10 segundos
  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => {
      setSuccess('');
    }, 10000);
    return () => clearTimeout(timer);
  }, [success]);

  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => {
      setError('');
    }, 10000);
    return () => clearTimeout(timer);
  }, [error]);

  const saveSession = (user, authToken) => {
    setSession(user);
    setToken(authToken);
    localStorage.setItem('nexus-session', JSON.stringify(user));
    localStorage.setItem('nexus-token', authToken);
  };

  const logout = () => {
    setSession(null);
    setToken('');
    setProjects([]);
    setWorkItems([]);
    setTeamDirectory([]);
    localStorage.removeItem('nexus-session');
    localStorage.removeItem('nexus-token');
  };

  // HANDLERS DEL DIRECTORIO GLOBAL
  const handleCreateDirectoryMember = async (e) => {
    e.preventDefault();
    setDirectoryModalError(null);
    if (!newDirectoryForm.name.trim()) {
      setDirectoryModalError('El Nombre Completo o Razón Social es obligatorio.');
      return;
    }

    if (newDirectoryForm.createAccount) {
      if (!newDirectoryForm.email || !newDirectoryForm.email.trim()) {
        setDirectoryModalError('Debes ingresar un correo electrónico para generar la cuenta de acceso.');
        return;
      }
      if (!newDirectoryForm.password || newDirectoryForm.password.length < 8) {
        setDirectoryModalError('La contraseña de acceso debe tener al menos 8 caracteres.');
        return;
      }
    }

    const payload = {
      name: newDirectoryForm.name.trim(),
      role: newDirectoryForm.role || 'collaborator',
      organization: newDirectoryForm.organization?.trim() || undefined,
      email: newDirectoryForm.email?.trim() || undefined,
      phone: newDirectoryForm.phone?.trim() || undefined,
      createAccount: Boolean(newDirectoryForm.createAccount),
      password: newDirectoryForm.createAccount ? newDirectoryForm.password : undefined,
      userRole: newDirectoryForm.createAccount ? newDirectoryForm.userRole : undefined
    };

    try {
      const res = await fetch(`${API_BASE}/directory`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        setDirectoryModalError(data.message || 'Error al registrar integrante en el directorio');
        return;
      }
      setSuccess(`"${data.name}" se registró exitosamente ${newDirectoryForm.createAccount ? 'con credenciales de acceso creadas' : 'en el directorio'}.`);
      setIsNewDirectoryModalOpen(false);
      setDirectoryModalError(null);
      setNewDirectoryForm({
        name: '',
        role: 'collaborator',
        organization: '',
        email: '',
        phone: '',
        createAccount: false,
        password: '',
        userRole: 'member'
      });
      fetchDirectory();

      // Si el modal de nueva tarea o editar tarea está abierto, auto-asignar de inmediato al nuevo integrante
      if (isNewTaskModalOpen) {
        setTaskForm((prev) => {
          const current = Array.isArray(prev.assignees) && prev.assignees.length > 0 ? prev.assignees : ['Jorge'];
          const updated = current.includes(data.name) ? current : [...current, data.name];
          return {
            ...prev,
            assignees: updated,
            assignee: updated.join(', '),
            assigneeType: updated.some(isAssigneeMine) ? 'me' : (data.role === 'vendor' ? 'vendor' : 'team')
          };
        });
      }
      if (isEditTaskModalOpen) {
        setEditTaskForm((prev) => {
          const current = Array.isArray(prev.assignees) && prev.assignees.length > 0 ? prev.assignees : ['Jorge'];
          const updated = current.includes(data.name) ? current : [...current, data.name];
          return {
            ...prev,
            assignees: updated,
            assignee: updated.join(', '),
            assigneeType: updated.some(isAssigneeMine) ? 'me' : (data.role === 'vendor' ? 'vendor' : 'team')
          };
        });
      }
    } catch {
      setError('Error de comunicación con el servidor');
    }
  };

  const handleUpdateDirectoryMember = async (e) => {
    e.preventDefault();
    setEditDirectoryModalError(null);
    if (!editingDirectoryMember || !editDirectoryForm.name.trim()) {
      setEditDirectoryModalError('El Nombre Completo o Razón Social no puede estar vacío.');
      return;
    }
    try {
      const payload = {
        name: editDirectoryForm.name.trim(),
        role: editDirectoryForm.role,
        organization: editDirectoryForm.organization?.trim() || undefined,
        email: editDirectoryForm.email?.trim() || undefined,
        phone: editDirectoryForm.phone?.trim() || undefined
      };
      const res = await fetch(`${API_BASE}/directory/${editingDirectoryMember.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        setEditDirectoryModalError(data.message || 'Error al actualizar integrante');
        return;
      }
      setSuccess(`Datos de "${data.name}" actualizados correctamente.`);
      setEditingDirectoryMember(null);
      setEditDirectoryModalError(null);
      fetchDirectory();
      fetchProjects();
      fetchWorkItems();
    } catch {
      setError('Error de comunicación con el servidor');
    }
  };

  const requestDeleteDirectoryMember = (member) => {
    // 1. Verificación preventiva en frontend: ¿está asociado a tareas?
    const targetName = member.name.trim().toLowerCase();
    const assignedTask = workItems.find((w) => {
      if (Array.isArray(w.assignees) && w.assignees.length > 0) {
        return w.assignees.some((a) => a && a.trim().toLowerCase() === targetName);
      }
      if (typeof w.assignee === 'string' && w.assignee.trim()) {
        return w.assignee.split(',').map((s) => s.trim().toLowerCase()).includes(targetName);
      }
      return false;
    });

    if (assignedTask) {
      const project = projects.find((p) => p.id === assignedTask.projectId);
      setDeletionBlockModal({
        member,
        taskTitle: assignedTask.title,
        projectName: project ? project.name : 'Proyecto General',
        projectId: assignedTask.projectId
      });
      return;
    }

    // 2. Si no tiene tareas asignadas, pedir confirmación
    setDirectoryMemberToDelete(member);
  };

  const handleConfirmDeleteDirectoryMember = async () => {
    if (!directoryMemberToDelete) return;
    try {
      const res = await fetch(`${API_BASE}/directory/${directoryMemberToDelete.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.code === 'MEMBER_ASSIGNED_TO_TASK' && data.associatedTask) {
          setDirectoryMemberToDelete(null);
          setDeletionBlockModal({
            member: directoryMemberToDelete,
            taskTitle: data.associatedTask.title,
            projectName: data.associatedTask.projectName,
            projectId: data.associatedTask.projectId
          });
          return;
        }
        setError(data.message || 'Error al eliminar del directorio');
        return;
      }
      setSuccess(`"${directoryMemberToDelete.name}" fue eliminado del directorio.`);
      setDirectoryMemberToDelete(null);
      fetchDirectory();
      fetchProjects();
    } catch {
      setError('Error de comunicación con el servidor');
    }
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error en login');
      saveSession(data.user, data.token);
      setSuccess('Sesión iniciada correctamente');
    } catch (err) {
      setError(err.message || 'No se pudo iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const generateSecurePassword = () => {
    const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lower = 'abcdefghijkmnopqrstuvwxyz';
    const numbers = '23456789';
    const symbols = '!@#$%&*';
    let pass = 'Nx-';
    for (let i = 0; i < 2; i++) pass += upper[Math.floor(Math.random() * upper.length)];
    for (let i = 0; i < 3; i++) pass += lower[Math.floor(Math.random() * lower.length)];
    pass += symbols[Math.floor(Math.random() * symbols.length)];
    for (let i = 0; i < 3; i++) pass += numbers[Math.floor(Math.random() * numbers.length)];
    return pass;
  };

  const handleOpenGenerateAccount = (member) => {
    const pass = generateSecurePassword();
    setAccountModalError(null);
    setAccountModalMember({ ...member, isReset: false });
    setAccountPasswordForm({
      email: member.email || member.userEmail || '',
      password: pass,
      role: member.role === 'admin' ? 'admin' : 'member',
      showPassword: true,
      copied: false
    });
  };

  const handleOpenResetPassword = (member) => {
    const pass = generateSecurePassword();
    setAccountModalError(null);
    setAccountModalMember({ ...member, isReset: true });
    setAccountPasswordForm({
      email: member.email || member.userEmail || '',
      password: pass,
      role: member.userRole || (member.role === 'admin' ? 'admin' : 'member'),
      showPassword: true,
      copied: false
    });
  };

  const handleRevokeAccess = async (member) => {
    if (!member) return;
    const confirmed = window.confirm(
      `¿Deseas revocar el acceso al sistema para "${member.name}"?\n\nLa persona seguirá registrada en el directorio de contactos, pero su usuario y contraseña serán eliminados inmediatamente.`
    );
    if (!confirmed) return;

    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/directory/${member.id}/revoke-access`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al revocar acceso');

      setSuccess(data.message || `Acceso al sistema revocado para "${member.name}".`);
      fetchDirectory();
    } catch (err) {
      setError(err.message || 'No se pudo revocar el acceso.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAccountForMember = async (e) => {
    e.preventDefault();
    if (!accountModalMember) return;
    setAccountModalError(null);

    const pass = (accountPasswordForm.password || '').trim();
    if (!pass || pass.length < 8) {
      setAccountModalError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    const targetEmail = (accountPasswordForm.email || accountModalMember.email || '').trim().toLowerCase();
    if (!targetEmail) {
      setAccountModalError('Debes ingresar un correo electrónico para el usuario de acceso.');
      return;
    }

    const isReset = Boolean(accountModalMember.hasUserAccount || accountModalMember.isReset);
    const endpoint = isReset
      ? `${API_BASE}/directory/${accountModalMember.id}/reset-password`
      : `${API_BASE}/directory/${accountModalMember.id}/create-account`;

    setLoading(true);
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          email: targetEmail,
          password: pass,
          role: accountPasswordForm.role || (accountModalMember.role === 'admin' ? 'admin' : 'member')
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setAccountModalError(data.message || 'Error al procesar credenciales');
        return;
      }

      setSuccess(
        isReset
          ? `Contraseña de "${accountModalMember.name}" restablecida correctamente. Recuerda entregársela al usuario.`
          : `Credenciales de acceso generadas exitosamente para "${accountModalMember.name}".`
      );
      setAccountModalMember(null);
      setAccountModalError(null);
      fetchDirectory();
    } catch (err) {
      setAccountModalError(err.message || 'No se pudo generar el acceso.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (payloadOrEvent) => {
    if (payloadOrEvent?.preventDefault) {
      payloadOrEvent.preventDefault();
    }
    setError('');
    try {
      const dataToSave = (payloadOrEvent && !payloadOrEvent.preventDefault)
        ? payloadOrEvent
        : {
            ...projectForm,
            admins: projectForm.admins ? projectForm.admins.split(',').map((s) => s.trim()).filter(Boolean) : ['Jorge'],
            members: projectForm.members ? projectForm.members.split(',').map((s) => s.trim()).filter(Boolean) : []
          };

      const adminsArray = Array.isArray(dataToSave.admins)
        ? dataToSave.admins
        : (dataToSave.admins ? String(dataToSave.admins).split(',').map((s) => s.trim()).filter(Boolean) : ['Jorge']);
      const membersArray = Array.isArray(dataToSave.members)
        ? dataToSave.members
        : (dataToSave.members ? String(dataToSave.members).split(',').map((s) => s.trim()).filter(Boolean) : []);

      const res = await fetch(`${API_BASE}/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: dataToSave.name,
          description: dataToSave.description || '',
          template: dataToSave.template || 'kanban',
          status: dataToSave.status || 'execution',
          role: dataToSave.role || 'lead',
          space: dataToSave.space || 'work',
          admins: adminsArray,
          members: membersArray,
          startDate: dataToSave.startDate || todayStr,
          targetDate: dataToSave.targetDate,
          hasPhases: Boolean(dataToSave.hasPhases),
          phases: dataToSave.phases
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al crear proyecto');
      setSuccess(`Proyecto "${data.name}" creado`);
      setIsNewProjectModalOpen(false);
      setProjectForm({
        name: '',
        description: '',
        template: 'kanban',
        status: 'execution',
        role: 'lead',
        admins: 'Jorge',
        members: '',
        startDate: '',
        targetDate: '',
        hasPhases: false,
        phases: []
      });
      await fetchProjects();
      setSelectedProjectId(data.id);
    } catch (err) {
      setError(err.message);
    }
  };

  const updateProjectStage = async (projectId, nextStatus) => {
    try {
      const res = await fetch(`${API_BASE}/projects/${projectId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: nextStatus })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al actualizar etapa');
      setProjects((prev) => prev.map((p) => (p.id === projectId ? data : p)));
      setSuccess(`Etapa actualizada para ${data.name}`);
    } catch (err) {
      setError(err.message);
    }
  };

  const confirmDeleteProject = async () => {
    if (!projectToDelete) return;
    try {
      const res = await fetch(`${API_BASE}/projects/${projectToDelete.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al eliminar proyecto');
      setSuccess(`Proyecto "${projectToDelete.name}" eliminado`);
      setProjects((prev) => prev.filter((p) => p.id !== projectToDelete.id));
      setWorkItems((prev) => prev.filter((w) => w.projectId !== projectToDelete.id));
      if (selectedProjectId === projectToDelete.id) {
        const remaining = projects.filter((p) => p.id !== projectToDelete.id);
        setSelectedProjectId(remaining[0]?.id || '');
      }
      setProjectToDelete(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const openEditProjectModal = (project) => {
    setEditingProject(project);
    setEditProjectForm({
      id: project.id,
      name: project.name || '',
      description: project.description || '',
      template: project.template || 'kanban',
      status: project.status || 'execution',
      role: project.role || 'lead',
      startDate: project.startDate || project.effectiveStartDate || '',
      targetDate: project.targetDate || ''
    });
  };

  const handleSaveEditProject = async (projectIdOrEvent, maybePayload) => {
    if (projectIdOrEvent?.preventDefault) projectIdOrEvent.preventDefault();

    let targetProjectId = editingProject?.id;
    let dataToSave = editProjectForm;

    if (typeof projectIdOrEvent === 'string' && maybePayload) {
      targetProjectId = projectIdOrEvent;
      dataToSave = maybePayload;
    } else if (projectIdOrEvent && !projectIdOrEvent.preventDefault && typeof projectIdOrEvent === 'object') {
      dataToSave = projectIdOrEvent;
      targetProjectId = projectIdOrEvent.id || editingProject?.id;
    }

    if (!targetProjectId) return;
    if (!dataToSave.name || !dataToSave.name.trim()) return;

    try {
      const adminsArray = Array.isArray(dataToSave.admins)
        ? dataToSave.admins
        : (dataToSave.admins ? String(dataToSave.admins).split(',').map((s) => s.trim()).filter(Boolean) : undefined);
      const membersArray = Array.isArray(dataToSave.members)
        ? dataToSave.members
        : (dataToSave.members ? String(dataToSave.members).split(',').map((s) => s.trim()).filter(Boolean) : undefined);

      const res = await fetch(`${API_BASE}/projects/${targetProjectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...dataToSave,
          name: dataToSave.name.trim(),
          admins: adminsArray,
          members: membersArray,
          startDate: dataToSave.startDate,
          targetDate: dataToSave.targetDate,
          hasPhases: dataToSave.phases && dataToSave.phases.length > 0 ? true : (dataToSave.hasPhases !== undefined ? Boolean(dataToSave.hasPhases) : undefined),
          phases: dataToSave.phases
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al actualizar proyecto');

      setProjects((prev) => prev.map((p) => (p.id === data.id ? { ...p, ...data } : p)));
      setSuccess(`Proyecto "${data.name}" actualizado con éxito`);
      if (editingProject && editingProject.id === targetProjectId) {
        setEditingProject(null);
      }
    } catch (err) {
      setError(err.message || 'Error de conexión al actualizar proyecto');
    }
  };

  const handleQuickUpdateProjectStatus = async (projectId, newStatus) => {
    try {
      const res = await fetch(`${API_BASE}/projects/${projectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al actualizar estado');
      setProjects((prev) => prev.map((p) => (p.id === data.id ? { ...p, ...data } : p)));
      setSuccess(`Estado del proyecto actualizado a "${newStatus}"`);
    } catch (err) {
      setError(err.message || 'Error al actualizar estado del proyecto');
    }
  };

  /* --- GESTIÓN DE BITÁCORA DE REUNIONES & ACUERDOS --- */
  const handleCreateMeeting = (newMeetingData) => {
    const newMeeting = {
      ...newMeetingData,
      id: newMeetingData.id || `meet-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    setMeetings((prev) => [newMeeting, ...prev]);
    setSuccess('Minuta de reunión registrada en la bitácora.');
  };

  const handleUpdateMeeting = (updatedMeeting) => {
    setMeetings((prev) =>
      prev.map((m) => (m.id === updatedMeeting.id ? updatedMeeting : m))
    );
    setSuccess('Minuta de reunión actualizada.');
  };

  const handleDeleteMeeting = (meetingId) => {
    setMeetings((prev) => prev.filter((m) => m.id !== meetingId));
    setSuccess('Minuta eliminada de la bitácora.');
  };

  const handleCreateTaskFromMeetingAction = async (arg1, arg2, arg3) => {
    let project = null;
    let actionItem = null;
    let meeting = null;

    if (arg3 !== undefined) {
      project = arg1;
      actionItem = arg2;
      meeting = arg3;
    } else {
      actionItem = arg1;
      meeting = arg2;
      project = projects.find((p) => p.id === meeting?.projectId || p.code === meeting?.projectCode) || { id: meeting?.projectId || selectedProjectId };
    }

    if (!actionItem || !actionItem.text) return;

    // Resolver ID de proyecto válido
    const matchedProject = projects.find(
      (p) =>
        (project?.id && p.id === project.id) ||
        (project?.code && p.code === project.code) ||
        (meeting?.projectId && p.id === meeting.projectId) ||
        (meeting?.projectCode && p.code === meeting.projectCode)
    ) || project || projects[0] || { id: selectedProjectId };

    const resolvedProjId = matchedProject?.id || selectedProjectId || (projects[0] && projects[0].id) || 'p-1';
    const meetingTitle = meeting?.title || 'Reunión de Proyecto';
    const meetingDate = meeting?.date || todayStr;
    const newTaskId = `wi-${Date.now()}`;
    const nextCode = `T-${(workItems.length + 1).toString().padStart(3, '0')}`;
    const assigneesToSave = [actionItem.assignee || 'Jorge'];
    const finalAssigneeStr = assigneesToSave.join(', ');
    const finalAssigneeType = assigneesToSave.some(isAssigneeMine) ? 'me' : 'team';

    const newTask = {
      id: newTaskId,
      code: nextCode,
      projectId: resolvedProjId,
      title: actionItem.text,
      description: `Tarea originada en reunión: "${meetingTitle}" (${meetingDate}).`,
      type: 'task',
      status: 'backlog',
      priority: 'high',
      assignees: assigneesToSave,
      assignee: finalAssigneeStr,
      assigneeType: finalAssigneeType,
      dueDate: actionItem.dueDate || todayStr,
      progressPct: 0,
      createdAt: new Date().toISOString()
    };

    // 1. Agregar inmediatamente a workItems local
    setWorkItems((prev) => [newTask, ...prev]);

    // 2. Vincular createdTaskId inmediatamente en meetings
    setMeetings((prevMeetings) =>
      prevMeetings.map((m) => {
        if (meeting?.id && m.id !== meeting.id) return m;
        return {
          ...m,
          actionItems: (m.actionItems || []).map((act) => {
            if (act.id === actionItem.id || (act.text === actionItem.text && !act.createdTaskId)) {
              return { ...act, createdTaskId: newTaskId };
            }
            return act;
          })
        };
      })
    );

    setSuccess(`Compromiso convertido en tarea [${nextCode}]: "${actionItem.text}"`);

    // 3. Persistir en el servidor si token está activo
    if (token && resolvedProjId) {
      try {
        const res = await fetch(`${API_BASE}/work-items`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            projectId: resolvedProjId,
            title: actionItem.text,
            description: `Tarea originada en reunión: "${meetingTitle}" (${meetingDate}).`,
            type: 'task',
            status: 'backlog',
            priority: 'high',
            assignees: assigneesToSave,
            assignee: finalAssigneeStr,
            assigneeType: finalAssigneeType,
            dueDate: actionItem.dueDate || todayStr
          })
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.id) {
            setMeetings((prevMeetings) =>
              prevMeetings.map((m) => {
                if (meeting?.id && m.id !== meeting.id) return m;
                return {
                  ...m,
                  actionItems: (m.actionItems || []).map((act) => {
                    if (act.id === actionItem.id || act.createdTaskId === newTaskId) {
                      return { ...act, createdTaskId: data.id };
                    }
                    return act;
                  })
                };
              })
            );
          }
          await fetchWorkItems();
        }
      } catch (err) {
        console.warn('Persistencia en background:', err);
      }
    }
    return newTaskId;
  };

  const handleReturnToProjects = (targetProjId) => {
    const projIdToFocus = targetProjId || selectedProjectId;

    // Asegurarse de que si el proyecto está oculto por filtros actuales de etapa o rol, se reajusten para que sea visible
    const targetProj = projects.find((p) => p.id === projIdToFocus);
    if (targetProj) {
      if (roleFilter !== 'all' && targetProj.role !== roleFilter) {
        setRoleFilter('all');
      }
      if (stageFilter !== 'all' && (targetProj.status || 'execution') !== stageFilter) {
        setStageFilter('all');
      }
    }

    setActiveView('portfolio');
    setHighlightedProjectId(projIdToFocus);

    // Scroll suave hacia la tarjeta del proyecto tras renderizado
    setTimeout(() => {
      const cardEl = document.getElementById(`project-card-${projIdToFocus}`);
      if (cardEl) {
        cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);

    // Remover el efecto de realce después de 2.8s
    setTimeout(() => {
      setHighlightedProjectId(null);
    }, 2800);
  };

  const openTeamModal = (project) => {
    setManagingProject(project);
    setIsTeamModalOpen(true);
    setTeamRoleFilter('all');
    setEditingMemberId(null);
    setNewMemberForm({ name: '', role: 'collaborator', email: '' });
  };

  const startEditMember = (member) => {
    setEditingMemberId(member.id);
    setEditMemberForm({
      name: member.name,
      role: member.role || 'collaborator',
      email: member.email || ''
    });
  };

  const cancelEditMember = () => {
    setEditingMemberId(null);
    setEditMemberForm({ name: '', role: 'collaborator', email: '' });
  };

  const handleSaveMemberEdit = async (memberId) => {
    if (!managingProject || !editMemberForm.name.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/projects/${managingProject.id}/members/${memberId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(editMemberForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al actualizar miembro');
      setManagingProject(data.project);
      setProjects((prev) => prev.map((p) => (p.id === data.project.id ? data.project : p)));
      setSuccess(`Miembro "${data.member.name}" actualizado`);
      setEditingMemberId(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!managingProject || !newMemberForm.name.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/projects/${managingProject.id}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newMemberForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al agregar miembro');
      setManagingProject(data.project);
      setProjects((prev) => prev.map((p) => (p.id === data.project.id ? data.project : p)));
      const roleName = data.member.role === 'admin' ? 'Administrador' : data.member.role === 'vendor' ? 'Proveedor / Tercero' : 'Colaborador';
      setSuccess(`"${data.member.name}" agregado como ${roleName}`);
      setNewMemberForm({ name: '', role: 'collaborator', email: '' });
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdateMemberRole = async (memberId, newRole) => {
    if (!managingProject) return;
    try {
      const res = await fetch(`${API_BASE}/projects/${managingProject.id}/members/${memberId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al actualizar rol');
      setManagingProject(data.project);
      setProjects((prev) => prev.map((p) => (p.id === data.project.id ? data.project : p)));
      setSuccess(`Rol actualizado para "${data.member.name}"`);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteMember = async (memberId, memberName) => {
    if (!managingProject) return;
    try {
      const res = await fetch(`${API_BASE}/projects/${managingProject.id}/members/${memberId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al eliminar miembro');
      setManagingProject(data.project);
      setProjects((prev) => prev.map((p) => (p.id === data.project.id ? data.project : p)));
      setSuccess(`"${memberName}" eliminado del proyecto`);
    } catch (err) {
      setError(err.message);
    }
  };

  const openNewTaskModal = (initialData = {}) => {
    setTaskForm({
      projectId: initialData.projectId || selectedProjectId || (projects[0] && projects[0].id) || '',
      title: initialData.title || '',
      description: initialData.description || '',
      type: initialData.type || 'task',
      status: initialData.status || 'backlog',
      priority: initialData.priority || 'medium',
      assignees: ['Jorge'],
      assignee: 'Jorge',
      assigneeType: 'me',
      dueDate: initialData.dueDate || todayStr,
      phaseIds: Array.isArray(initialData.phaseIds) ? initialData.phaseIds : []
    });
    setIsNewTaskModalOpen(true);
  };

  const handleCreateTask = async (payloadOrEvent) => {
    if (payloadOrEvent?.preventDefault) payloadOrEvent.preventDefault();
    setError('');

    const sourceData = (payloadOrEvent && !payloadOrEvent.preventDefault)
      ? payloadOrEvent
      : taskForm;

    const targetProject = sourceData.projectId || selectedProjectId || (projects[0] && projects[0].id);
    if (!targetProject) {
      setError('Debes asociar la tarea a un proyecto');
      return;
    }
    try {
      const assigneesToSave = Array.isArray(sourceData.assignees) && sourceData.assignees.length > 0
        ? sourceData.assignees
        : (sourceData.assignee ? String(sourceData.assignee).split(',').map((s) => s.trim()).filter(Boolean) : ['Jorge']);
      const finalAssigneeStr = assigneesToSave.join(', ');
      const finalAssigneeType = assigneesToSave.some(isAssigneeMine)
        ? 'me'
        : (assigneesToSave.some(a => {
            const dirM = teamDirectory.find(m => m.name && m.name.trim().toLowerCase() === a.trim().toLowerCase());
            return dirM ? dirM.role === 'vendor' : isAssigneeVendor(a);
          }) ? 'vendor' : 'team');

      const res = await fetch(`${API_BASE}/work-items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...sourceData,
          projectId: targetProject,
          assignees: assigneesToSave,
          assignee: finalAssigneeStr,
          assigneeType: finalAssigneeType,
          phaseIds: Array.isArray(sourceData.phaseIds) ? sourceData.phaseIds : []
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al crear tarea');
      setSuccess(`Tarea agregada: ${data.title}`);
      setIsNewTaskModalOpen(false);
      setTaskForm({
        projectId: '',
        title: '',
        description: '',
        type: 'task',
        status: 'backlog',
        priority: 'medium',
        assignees: ['Jorge'],
        assignee: 'Jorge',
        assigneeType: 'me',
        dueDate: todayStr,
        phaseIds: []
      });
      await fetchWorkItems();
    } catch (err) {
      setError(err.message);
    }
  };

  const openEditTaskModal = (task) => {
    if (!task) return;
    const list = getTaskAssignees(task);
    setEditingTask(task);
    setNewProgressText('');
    setNewProgressAuthor(session?.name || 'Jorge');
    setEditTaskForm({
      projectId: task.projectId || selectedProjectId || (projects[0] && projects[0].id) || '',
      title: task.title || '',
      description: task.description || '',
      type: task.type || 'task',
      status: task.status || 'backlog',
      priority: task.priority || 'medium',
      assignees: list,
      assignee: list.join(', '),
      assigneeType: task.assigneeType || (list.some(isAssigneeMine) ? 'me' : 'team'),
      startDate: task.startDate || (task.createdAt && typeof task.createdAt === 'string' ? task.createdAt.split('T')[0] : ''),
      dueDate: task.dueDate || task.targetDate || '',
      code: task.code || '',
      completionType: task.completionType || 'full',
      completionReport: task.completionReport || '',
      continuationTaskId: task.continuationTaskId || '',
      completedAt: task.completedAt && typeof task.completedAt === 'string' ? task.completedAt.split('T')[0] : (task.completedAt || ''),
      progressLogs: Array.isArray(task.progressLogs) ? task.progressLogs : [],
      phaseIds: Array.isArray(task.phaseIds) ? task.phaseIds : []
    });
    setIsEditTaskModalOpen(true);
  };

  const handleAddProgressLog = async (e) => {
    if (e) e.preventDefault();
    if (!editingTask || !newProgressText.trim()) return;
    setIsAddingProgress(true);
    setError('');
    try {
      const authorToUse = newProgressAuthor.trim() || session?.name || 'Jorge';
      const res = await fetch(`${API_BASE}/work-items/${editingTask.id}/progress-logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          text: newProgressText.trim(),
          author: authorToUse
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al registrar avance');
      const updated = data.workItem || data;
      setEditingTask(updated);
      setEditTaskForm((prev) => ({
        ...prev,
        progressLogs: updated.progressLogs || []
      }));
      setWorkItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setNewProgressText('');
      setSuccess('Avance registrado exitosamente');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsAddingProgress(false);
    }
  };

  const handleDeleteProgressLog = async (logId) => {
    if (!editingTask || !logId) return;
    try {
      const res = await fetch(`${API_BASE}/work-items/${editingTask.id}/progress-logs/${logId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al eliminar avance');
      const updated = data.workItem || data;
      setEditingTask(updated);
      setEditTaskForm((prev) => ({
        ...prev,
        progressLogs: updated.progressLogs || []
      }));
      setWorkItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setSuccess('Avance eliminado');
    } catch (err) {
      setError(err.message);
    }
  };

  const submitTaskProgress = async (taskId, text, author) => {
    if (!token || !taskId || !text.trim()) return null;
    const authorToUse = author || session?.name || 'Jorge';
    const res = await fetch(`${API_BASE}/work-items/${taskId}/progress-logs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        text: text.trim(),
        author: authorToUse
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Error al registrar avance');
    const updated = data.workItem || data;
    setWorkItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    if (editingTask && editingTask.id === updated.id) {
      setEditingTask(updated);
      setEditTaskForm((prev) => ({
        ...prev,
        progressLogs: updated.progressLogs || []
      }));
    }
    return updated;
  };

  const openDailyCheckinWizard = (customTasks = null) => {
    const list = Array.isArray(customTasks) && customTasks.length > 0
      ? customTasks
      : workItems.filter((w) => w.status !== 'done' && getTaskFreshness(w, todayStr).isStale);

    if (list.length === 0) {
      setSuccess('🎉 ¡Excelente! Todas las tareas activas tienen avances registrados en las últimas 48 horas.');
      return;
    }

    setDailyCheckinTasks(list);
    setDailyCheckinIndex(0);
    setDailyCheckinInputText('');
    setIsDailyCheckinModalOpen(true);
  };

  const handleDailyCheckinAdvance = async (isTouch = false) => {
    const currentTask = dailyCheckinTasks[dailyCheckinIndex];
    if (!currentTask) return;

    setIsSubmittingDailyCheckin(true);
    setError('');
    try {
      const text = isTouch
        ? 'Continúa en curso según lo planificado.'
        : (dailyCheckinInputText.trim() || 'Avance verificado en curso.');

      await submitTaskProgress(currentTask.id, text);
      setSuccess(`✓ Avance registrado para ${currentTask.code || currentTask.title}`);
      setDailyCheckinInputText('');

      const nextIndex = dailyCheckinIndex + 1;
      if (nextIndex < dailyCheckinTasks.length) {
        setDailyCheckinIndex(nextIndex);
      } else {
        setIsDailyCheckinModalOpen(false);
        setSuccess('🎉 ¡Daily Check-in completado! Todas las tareas quedaron con su seguimiento al día.');
      }
    } catch (err) {
      setError(err.message || 'Error al registrar avance en el Daily Check-in');
    } finally {
      setIsSubmittingDailyCheckin(false);
    }
  };

  const handleProjectDailyCheckin = (project) => {
    if (!project) return;
    const projectActiveTasks = workItems.filter((w) => w.projectId === project.id && w.status !== 'done');
    const projectStaleTasks = projectActiveTasks.filter((w) => getTaskFreshness(w, todayStr).isStale);

    if (projectStaleTasks.length > 0) {
      openDailyCheckinWizard(projectStaleTasks);
    } else if (projectActiveTasks.length > 0) {
      openDailyCheckinWizard(projectActiveTasks);
    } else {
      setSuccess(`El proyecto "${project.name}" no tiene tareas activas pendientes.`);
    }
  };

  const handleInlineSave = async (taskId) => {
    if (!inlineUpdateText.trim()) return;
    setIsSubmittingInlineUpdate(true);
    setError('');
    try {
      await submitTaskProgress(taskId, inlineUpdateText.trim());
      setSuccess('✓ Avance registrado exitosamente');
      setInlineUpdateTaskId(null);
      setInlineUpdateText('');
    } catch (err) {
      setError(err.message || 'Error al guardar avance');
    } finally {
      setIsSubmittingInlineUpdate(false);
    }
  };

  const handleInlineQuickTouch = async (taskId) => {
    setIsSubmittingInlineUpdate(true);
    setError('');
    try {
      await submitTaskProgress(taskId, 'Continúa en curso según lo planificado.');
      setSuccess('✓ Avance rápido registrado');
      setInlineUpdateTaskId(null);
      setInlineUpdateText('');
    } catch (err) {
      setError(err.message || 'Error al guardar avance');
    } finally {
      setIsSubmittingInlineUpdate(false);
    }
  };

  const handleUpdateTask = async (e) => {
    e.preventDefault();
    if (!editingTask) return;
    setError('');
    try {
      const assigneesToSave = Array.isArray(editTaskForm.assignees) && editTaskForm.assignees.length > 0 ? editTaskForm.assignees : ['Jorge'];
      const finalAssigneeStr = assigneesToSave.join(', ');
      const finalAssigneeType = assigneesToSave.some(isAssigneeMine)
        ? 'me'
        : (assigneesToSave.some(a => {
            const dirM = teamDirectory.find(m => m.name && m.name.trim().toLowerCase() === a.trim().toLowerCase());
            return dirM ? dirM.role === 'vendor' : isAssigneeVendor(a);
          }) ? 'vendor' : 'team');

      const completedAtToSave = editTaskForm.status === 'done'
        ? (editTaskForm.completedAt || editingTask.completedAt || new Date().toISOString())
        : (editTaskForm.completedAt || undefined);

      const res = await fetch(`${API_BASE}/work-items/${editingTask.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...editTaskForm,
          assignees: assigneesToSave,
          assignee: finalAssigneeStr,
          assigneeType: finalAssigneeType,
          completedAt: completedAtToSave,
          progressLogs: editTaskForm.progressLogs || []
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al actualizar tarea');
      setSuccess(`Tarea actualizada: ${data.title}`);
      setWorkItems((prev) => prev.map((item) => (item.id === data.id ? data : item)));
      setIsEditTaskModalOpen(false);
      setEditingTask(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      const res = await fetch(`${API_BASE}/work-items/${taskId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al eliminar tarea');
      setSuccess('Tarea eliminada exitosamente');
      setWorkItems((prev) => prev.filter((item) => item.id !== taskId));
      setIsEditTaskModalOpen(false);
      setEditingTask(null);
      setTaskToDelete(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdateTaskData = async (taskIdOrTask, patchData) => {
    try {
      const isObj = typeof taskIdOrTask === 'object' && taskIdOrTask !== null;
      const realId = isObj ? taskIdOrTask.id : taskIdOrTask;
      const realPatch = isObj && !patchData ? taskIdOrTask : patchData;

      const existing = workItems.find((w) => w.id === realId);
      if (!existing) return;
      const res = await fetch(`${API_BASE}/work-items/${realId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...existing,
          ...realPatch
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al actualizar tarea');
      setWorkItems((prev) => prev.map((item) => (item.id === data.id ? data : item)));
      setSuccess(`✓ Tarea actualizada: ${data.title}`);
      return data;
    } catch (err) {
      setError(err.message || 'Error al actualizar tarea');
      throw err;
    }
  };

  const toggleTaskStatus = async (task) => {
    const nextStatus = task.status === 'done' ? 'in_progress' : 'done';
    try {
      const res = await fetch(`${API_BASE}/work-items/${task.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: nextStatus })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al cambiar estado');
      setWorkItems((prev) => prev.map((item) => (item.id === task.id ? data : item)));
    } catch (err) {
      setError(err.message);
    }
  };

  const changeTaskStatus = async (taskId, newStatus) => {
    try {
      const res = await fetch(`${API_BASE}/work-items/${taskId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al cambiar estado');
      setWorkItems((prev) => prev.map((item) => (item.id === taskId ? data : item)));
    } catch (err) {
      setError(err.message);
    }
  };

  const handlePrevWeek = () => {
    setWeekDate((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() - 7);
      return next;
    });
  };

  const handleNextWeek = () => {
    setWeekDate((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() + 7);
      return next;
    });
  };

  const handleCurrentWeek = () => {
    setWeekDate(new Date());
  };

  const openProjectStatusModal = (project) => {
    setStatusModalProject(project);
    setIsProjectStatusModalOpen(true);
    setCopiedStatusReport(false);
  };

  const copyProjectStatusReport = (project, doneTasks, activeTasks, pendingTasks) => {
    const code = project.code || `P-${(project.id || '').slice(0, 4)}`;
    const stage = stageLabelMap[project.status] || 'En ejecución';
    const health = project.isOverdue ? 'Vencido' : project.hasExtension ? 'Con prórroga' : 'En tiempo';
    const targetDateStr = project.targetDate ? formatDateShort(project.targetDate) : 'Sin fecha límite';
    const allTeam = [
      ...(project.admins && project.admins.length > 0 ? project.admins : ['Jorge']),
      ...(project.members || [])
    ].filter((v, i, a) => a.indexOf(v) === i);

    let text = `📌 REPORTE DE ESTATUS: [${code}] ${project.name}\n`;
    text += `--------------------------------------------------\n`;
    text += `Etapa: ${stage} | Avance: ${project.progressPct}% (${project.doneTasks}/${project.totalTasks} tareas)\n`;
    text += `Fecha Objetivo: ${targetDateStr} (${health})\n`;
    if (allTeam.length > 0) {
      text += `Equipo Asignado: ${allTeam.join(', ')}\n`;
    }

    text += `\n✅ 1. ¿QUÉ SE HA HECHO? (${doneTasks.length} tareas)\n`;
    if (doneTasks.length === 0) {
      text += `• Sin tareas finalizadas aún en este ciclo.\n`;
    } else {
      doneTasks.forEach((t) => {
        const tCode = t.code ? `[${t.code}] ` : '';
        const closingDate = t.completedAt ? formatDateShort(t.completedAt.split('T')[0]) : t.dueDate ? formatDateShort(t.dueDate) : '';
        const dateSuffix = closingDate ? ` (${closingDate})` : '';
        const isPartial = t.completionType === 'partial';
        text += `• ${tCode}${t.title}${dateSuffix}${isPartial ? ' [⚠️ Continuada]' : ' [✓ Hecho]'}\n`;
        if (t.completionReport) {
          text += `  ↳ Cierre: "${t.completionReport}"\n`;
        }
      });
    }

    text += `\n⚡ 2. ¿EN QUÉ ESTAMOS HOY? (${activeTasks.length} activas)\n`;
    if (activeTasks.length === 0) {
      text += `• No hay tareas en progreso activo en este momento.\n`;
    } else {
      activeTasks.forEach((t) => {
        const tCode = t.code ? `[${t.code}] ` : '';
        const assignee = t.assignee || 'Sin asignar';
        text += `• ${tCode}${t.title} (Resp: ${assignee})\n`;
        if (Array.isArray(t.progressLogs) && t.progressLogs.length > 0) {
          const lastLog = t.progressLogs[t.progressLogs.length - 1];
          const logDate = lastLog.createdAt ? formatDateTime(lastLog.createdAt) : lastLog.date || '';
          text += `  ↳ Último avance (${lastLog.author || 'Equipo'}${logDate ? ` - ${logDate}` : ''}): "${lastLog.text}"\n`;
        } else if (t.description) {
          text += `  ↳ Detalle: "${t.description}"\n`;
        }
      });
    }

    text += `\n⏳ 3. ¿QUÉ ESTÁ PENDIENTE? (${pendingTasks.length} pendientes)\n`;
    if (pendingTasks.length === 0) {
      text += `• Sin tareas pendientes en el backlog.\n`;
    } else {
      pendingTasks.forEach((t) => {
        const tCode = t.code ? `[${t.code}] ` : '';
        const assignee = t.assignee || 'Sin asignar';
        const priorityLabel = t.priority === 'high' ? 'ALTA' : t.priority === 'low' ? 'BAJA' : 'MEDIA';
        const due = t.dueDate ? formatDateShort(t.dueDate) : 'S/F';
        text += `• ${tCode}${t.title} (Resp: ${assignee} | Prioridad ${priorityLabel} | Límite: ${due})\n`;
      });
    }

    const copyFallback = (str) => {
      try {
        const el = document.createElement('textarea');
        el.value = str;
        el.setAttribute('readonly', '');
        el.style.position = 'absolute';
        el.style.left = '-9999px';
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
        setCopiedStatusReport(true);
        setTimeout(() => setCopiedStatusReport(false), 2500);
      } catch (err) {
        console.warn('Fallback copy failed', err);
      }
    };

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        setCopiedStatusReport(true);
        setTimeout(() => setCopiedStatusReport(false), 2500);
      }).catch(() => {
        copyFallback(text);
      });
    } else {
      copyFallback(text);
    }
  };

  const enrichedProjects = useMemo(() => {
    return projects.map((p) => {
      const items = workItems.filter((w) => w.projectId === p.id);
      const total = items.length;
      const done = items.filter((w) => w.status === 'done').length;
      const progress = total > 0 ? Math.round((done / total) * 100) : 0;
      const myPending = items.filter((w) => {
        if (w.status === 'done') return false;
        const list = getTaskAssignees(w);
        return list.some(isAssigneeMine);
      }).length;
      const teamPending = items.filter((w) => {
        if (w.status === 'done') return false;
        const list = getTaskAssignees(w);
        return list.some((a) => !isAssigneeMine(a) && !isAssigneeVendor(a, w));
      }).length;
      const vendorPending = items.filter((w) => {
        if (w.status === 'done') return false;
        const list = getTaskAssignees(w);
        return list.some((a) => isAssigneeVendor(a, w));
      }).length;
      const projectActiveTasks = items.filter((w) => w.status !== 'done');
      const projectStaleTasks = projectActiveTasks.filter((w) => getTaskFreshness(w, todayStr).isStale);
      const staleTasksCount = projectStaleTasks.length;
      const isOverdue = p.targetDate && p.targetDate < todayStr && p.status !== 'completed';

      // Cálculo de extensión / prórroga
      const hasExtension = Boolean(
        (Array.isArray(p.dateExtensions) && p.dateExtensions.length > 0) ||
        (p.originalTargetDate && p.targetDate && p.originalTargetDate < p.targetDate)
      );

      let extensionDurationText = '';
      if (hasExtension) {
        if (Array.isArray(p.dateExtensions) && p.dateExtensions.length > 0) {
          extensionDurationText = p.dateExtensions[p.dateExtensions.length - 1].durationText;
        } else if (p.originalTargetDate && p.targetDate) {
          const d1 = new Date(p.originalTargetDate + 'T12:00:00').getTime();
          const d2 = new Date(p.targetDate + 'T12:00:00').getTime();
          const diffDays = Math.max(1, Math.round((d2 - d1) / (1000 * 60 * 60 * 24)));
          const weeks = Math.round(diffDays / 7);
          extensionDurationText = weeks >= 1 ? `${weeks} semana${weeks > 1 ? 's' : ''}` : `${diffDays} día${diffDays > 1 ? 's' : ''}`;
        }
      }

      const effectiveStartDate = p.startDate || (p.createdAt ? p.createdAt.split('T')[0] : '2026-08-15');
      const effectiveOriginalTargetDate = p.originalTargetDate || p.targetDate || '2026-10-15';
      const effectiveTargetDate = p.targetDate || '2026-10-15';

      return {
        ...p,
        totalTasks: total,
        doneTasks: done,
        progressPct: progress,
        myPending,
        teamPending,
        vendorPending,
        staleTasksCount,
        isOverdue,
        hasExtension,
        extensionDurationText,
        effectiveStartDate,
        effectiveOriginalTargetDate,
        effectiveTargetDate
      };
    });
  }, [projects, workItems, todayStr]);

  const filteredProjects = useMemo(() => {
    return enrichedProjects.filter((p) => {
      if (space === 'work' && p.space === 'personal') return false;
      if (space === 'personal' && p.space !== 'personal') return false;
      if (portfolioSubView === 'cards') {
        if (roleFilter !== 'all' && p.role !== roleFilter) return false;
      }
      if (stageFilter !== 'all' && (p.status || 'execution') !== stageFilter) return false;
      if (portfolioSubView === 'timeline' || activeView === 'timeline') {
        if (timelineFilter === 'extended' && !p.hasExtension) return false;
        if (timelineFilter === 'ontrack' && p.hasExtension) return false;
      }
      return true;
    });
  }, [enrichedProjects, roleFilter, stageFilter, portfolioSubView, timelineFilter, space, activeView]);

  const timelineScale = useMemo(() => {
    const now = new Date(todayStr + 'T12:00:00');
    let startMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    let endMonth = new Date(now.getFullYear(), now.getMonth() + 2, 28);

    enrichedProjects.forEach((p) => {
      if (p.effectiveStartDate) {
        const d = new Date(p.effectiveStartDate + 'T12:00:00');
        if (!isNaN(d.getTime()) && d < startMonth) {
          startMonth = new Date(d.getFullYear(), d.getMonth(), 1);
        }
      }
      if (p.effectiveTargetDate) {
        const d = new Date(p.effectiveTargetDate + 'T12:00:00');
        if (!isNaN(d.getTime()) && d > endMonth) {
          endMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0);
        }
      }
    });

    const monthCols = [];
    const cur = new Date(startMonth.getFullYear(), startMonth.getMonth(), 1);
    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

    while (cur <= endMonth && monthCols.length < 12) {
      const yr = cur.getFullYear();
      const mo = cur.getMonth();
      const isCur = yr === now.getFullYear() && mo === now.getMonth();
      const daysInMonth = new Date(yr, mo + 1, 0).getDate();
      monthCols.push({
        year: yr,
        month: mo,
        daysInMonth,
        label: `${monthNames[mo]} ${yr}`,
        isCurrent: isCur
      });
      cur.setMonth(cur.getMonth() + 1);
    }

    const numCols = Math.max(1, monthCols.length);
    const colWidthPct = 100 / numCols;

    const dateToPercent = (dateStr) => {
      if (!dateStr || monthCols.length === 0) return 0;
      const d = new Date(dateStr + 'T12:00:00');
      if (isNaN(d.getTime())) return 0;

      const yr = d.getFullYear();
      const mo = d.getMonth();
      const day = d.getDate();

      const colIdx = monthCols.findIndex((c) => c.year === yr && c.month === mo);
      if (colIdx === -1) {
        const first = monthCols[0];
        if (yr < first.year || (yr === first.year && mo < first.month)) return 0;
        return 100;
      }

      const daysInMo = monthCols[colIdx].daysInMonth;
      const dayFraction = Math.max(0, Math.min(1, (day - 0.5) / daysInMo));
      const pct = (colIdx + dayFraction) * colWidthPct;
      return Math.max(0, Math.min(100, pct));
    };

    const todayPct = dateToPercent(todayStr);

    return { monthCols, dateToPercent, todayPct };
  }, [enrichedProjects, todayStr]);

  const handleCreateExtension = async (e) => {
    e.preventDefault();
    if (!newExtensionModalProject || !token) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/projects/${newExtensionModalProject.id}/extensions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          newTargetDate: extensionForm.newTargetDate,
          reason: extensionForm.reason,
          requestedBy: extensionForm.requestedBy,
          approvedBy: extensionForm.approvedBy
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Error al registrar prórroga');
      }

      setProjects((prev) =>
        prev.map((p) => (p.id === newExtensionModalProject.id ? data.project : p))
      );
      setSuccess('Prórroga y cambio de fecha registrados exitosamente');
      setNewExtensionModalProject(null);
      setJustificationModalProject(data.project);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const globalKpis = useMemo(() => {
    const total = enrichedProjects.length;
    const leadCount = enrichedProjects.filter((p) => p.role === 'lead').length;
    const collabCount = enrichedProjects.filter((p) => p.role === 'collaborator').length;
    const avgProg =
      total > 0
        ? Math.round(
            enrichedProjects.reduce((acc, curr) => acc + curr.progressPct, 0) / total
          )
        : 0;
    const totalMyPending = enrichedProjects.reduce((acc, curr) => acc + curr.myPending, 0);
    const totalTeamPending = enrichedProjects.reduce((acc, curr) => acc + curr.teamPending, 0);
    const totalVendorPending = enrichedProjects.reduce((acc, curr) => acc + curr.vendorPending, 0);

    return { total, leadCount, collabCount, avgProg, totalMyPending, totalTeamPending, totalVendorPending };
  }, [enrichedProjects]);

  const totalStaleCount = useMemo(() => {
    return workItems.filter((w) => w.status !== 'done' && getTaskFreshness(w, todayStr).isStale).length;
  }, [workItems, todayStr]);

  const agendaTasks = useMemo(() => {
    return workItems
      .filter((w) => {
        const list = getTaskAssignees(w);
        const isMine = list.some(isAssigneeMine);
        const isTeam = list.some((a) => !isAssigneeMine(a) && !isAssigneeVendor(a, w));
        const isVendor = list.some((a) => isAssigneeVendor(a, w));

        if (agendaFilter === 'mine') return isMine;
        if (agendaFilter === 'team') return isTeam;
        if (agendaFilter === 'vendor') return isVendor;
        if (agendaFilter === 'overdue')
          return w.dueDate && w.dueDate < todayStr && w.status !== 'done';
        if (agendaFilter === 'stale')
          return w.status !== 'done' && getTaskFreshness(w, todayStr).isStale;
        return true;
      })
      .map((w) => {
        const p = projects.find((proj) => proj.id === w.projectId);
        return {
          ...w,
          projectName: p ? p.name : 'General',
          projectRole: p ? p.role : 'lead'
        };
      });
  }, [workItems, agendaFilter, todayStr, projects]);

  const dayViewGroups = useMemo(() => {
    const overdue = agendaTasks.filter(
      (t) => t.dueDate && t.dueDate < todayStr && t.status !== 'done'
    );
    const stale = agendaTasks.filter(
      (t) => t.status !== 'done' && (!t.dueDate || t.dueDate >= todayStr) && getTaskFreshness(t, todayStr).isStale
    );
    const today = agendaTasks.filter((t) => t.dueDate === todayStr);
    const upcoming = agendaTasks.filter(
      (t) => (!t.dueDate || t.dueDate > todayStr) && t.status !== 'done' && !getTaskFreshness(t, todayStr).isStale
    );
    const doneToday = agendaTasks.filter((t) => t.status === 'done');

    return { overdue, stale, today, upcoming, doneToday };
  }, [agendaTasks, todayStr]);

  const weekData = useMemo(() => {
    const dRef = new Date(weekDate);
    const day = dRef.getDay();
    const diffToMon = dRef.getDate() - (day === 0 ? 6 : day - 1);
    const monday = new Date(dRef.getFullYear(), dRef.getMonth(), diffToMon);

    const count = weekIncludeWeekend ? 7 : 5;
    const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

    const days = [];
    for (let i = 0; i < count; i++) {
      const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
      const ymd = formatDateYMD(d);
      days.push({
        name: dayNames[i],
        dateStr: ymd,
        dayNum: d.getDate(),
        monthStr: d.toLocaleString('es-ES', { month: 'short' }),
        isToday: ymd === todayStr,
        tasks: agendaTasks.filter((t) => t.dueDate === ymd)
      });
    }

    const endDay = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + (count - 1));
    const monStr = monday.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    const endStr = endDay.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });

    const mondayYMD = formatDateYMD(monday);
    const endYMD = formatDateYMD(endDay);
    const isCurrentWeek = todayStr >= mondayYMD && todayStr <= endYMD;

    return {
      days,
      rangeLabel: `${monStr} - ${endStr}`,
      isCurrentWeek
    };
  }, [weekDate, weekIncludeWeekend, agendaTasks, todayStr]);

  const calendarData = useMemo(() => {
    const year = calDate.getFullYear();
    const month = calDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    let startDayOfWeek = firstDay.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const totalDays = lastDay.getDate();
    const cells = [];

    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const pDay = prevMonthLastDay - i;
      const d = new Date(year, month - 1, pDay);
      const ymd = formatDateYMD(d);
      cells.push({
        dayNum: pDay,
        dateStr: ymd,
        isCurrentMonth: false,
        isToday: ymd === todayStr,
        tasks: agendaTasks.filter((t) => t.dueDate === ymd)
      });
    }

    for (let i = 1; i <= totalDays; i++) {
      const d = new Date(year, month, i);
      const ymd = formatDateYMD(d);
      cells.push({
        dayNum: i,
        dateStr: ymd,
        isCurrentMonth: true,
        isToday: ymd === todayStr,
        tasks: agendaTasks.filter((t) => t.dueDate === ymd)
      });
    }

    let nextDay = 1;
    while (cells.length % 7 !== 0) {
      const d = new Date(year, month + 1, nextDay);
      const ymd = formatDateYMD(d);
      cells.push({
        dayNum: nextDay,
        dateStr: ymd,
        isCurrentMonth: false,
        isToday: ymd === todayStr,
        tasks: agendaTasks.filter((t) => t.dueDate === ymd)
      });
      nextDay++;
    }

    return {
      monthName: calDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' }),
      cells
    };
  }, [calDate, agendaTasks, todayStr]);

  const selectedDayTasks = useMemo(() => {
    return agendaTasks.filter((t) => t.dueDate === selectedCalDay);
  }, [agendaTasks, selectedCalDay]);

  // Pantalla de Login (Acceso Interno Exclusivo)
  if (!session) {
    return (
      <div className="app-shell app-shell--auth" data-theme={darkMode ? 'dark' : 'light'}>
        <div className="auth-box">
          <div className="brand-hero-logo">
            <img src="/logobase01.png" alt="Nexus Logo" />
          </div>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <h1 style={{ fontSize: '1.65rem', color: 'var(--ink-900)', margin: '0 0 6px', letterSpacing: '-0.02em', fontWeight: 800 }}>Nexus</h1>
            <p className="muted" style={{ margin: 0, color: 'var(--ink-500)', fontSize: '0.88rem' }}>
              Track your goals, drive your moves.
            </p>
          </div>

          <form onSubmit={handleLogin}>
            <div className="form-field" style={{ marginBottom: '14px' }}>
              <label>Correo electrónico</label>
              <input
                type="email"
                value={loginForm.email}
                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                placeholder="jorge@nexus.local"
                required
              />
            </div>
            <div className="form-field" style={{ marginBottom: '18px' }}>
              <label>Contraseña</label>
              <input
                type="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                placeholder="123456"
                required
              />
            </div>
            {error && <div className="notice notice-error" style={{ marginBottom: '14px' }}>{error}</div>}
            {success && <div className="notice notice-success" style={{ marginBottom: '14px' }}>{success}</div>}
            <button className="ui-btn ui-btn--primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
              {loading ? 'Validando...' : 'Iniciar Sesión'}
            </button>
            <div style={{ textAlign: 'center', marginTop: '18px' }}>
              <p className="muted" style={{ fontSize: '0.78rem', color: 'var(--ink-500)', margin: 0 }}>
                🔒 Acceso restringido. Las cuentas y contraseñas son generadas internamente por el Administrador.
              </p>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <AppShell
      view={activeView}
      onNavigate={(newView) => {
        setActiveView(newView);
        window.scrollTo({ top: 0, behavior: 'instant' });
        const el = document.getElementById('main-content');
        if (el) el.scrollTop = 0;
      }}
      space={space}
      onSpaceChange={handleSpaceChange}
      projects={enrichedProjects}
      selectedProjectId={selectedProjectId}
      onSelectProject={(projId) => {
        setSelectedProjectId(projId);
      }}
      totalStaleCount={totalStaleCount}
      onOpenDailyCheckin={() => openDailyCheckinWizard()}
      darkMode={darkMode}
      onToggleTheme={toggleTheme}
      user={session}
      onLogout={logout}
      onFabClick={() => {
        if (activeView === 'portfolio') {
          setIsNewProjectModalOpen(true);
        } else {
          openNewTaskModal();
        }
      }}
      onCreatePersonalProject={() => {
        setNewProjectForm({
          name: '',
          description: '',
          template: 'kanban',
          status: 'execution',
          role: 'lead',
          startDate: todayStr,
          targetDate: '',
          space: 'personal'
        });
        setIsNewProjectModalOpen(true);
      }}
    >
      <div className="main-panel">
          {error && (
            <div className="notice-banner notice-banner--error" role="alert">
              <div className="notice-banner__content">
                <span className="notice-banner__icon"><Icons.Alert /></span>
                <span className="notice-banner__message">{error}</span>
              </div>
              <button
                type="button"
                className="notice-banner__close"
                onClick={() => setError('')}
                title="Cerrar notificación"
                aria-label="Cerrar notificación"
              >
                <Icons.Close />
              </button>
              <div className="notice-banner__progress" />
            </div>
          )}
          {success && (
            <div className="notice-banner notice-banner--success" role="status">
              <div className="notice-banner__content">
                <span className="notice-banner__icon"><Icons.Check /></span>
                <span className="notice-banner__message">{success}</span>
              </div>
              <button
                type="button"
                className="notice-banner__close"
                onClick={() => setSuccess('')}
                title="Cerrar notificación"
                aria-label="Cerrar notificación"
              >
                <Icons.Close />
              </button>
              <div className="notice-banner__progress" />
            </div>
          )}

          {/* ======================================================== */}
          {/* 0. VISTA: INICIO / CENTRO DE MANDO EJECUTIVO              */}
          {/* ======================================================== */}
          {activeView === 'home' && (
            <HomeView
              projects={enrichedProjects}
              workItems={workItems}
              currentUser={session}
              todayStr={todayStr}
              space={space}
              onSpaceChange={handleSpaceChange}
              onSelectProject={(id) => {
                setSelectedProjectId(id);
                setActiveView('portfolio');
              }}
              onNavigate={setActiveView}
              onOpenNewProject={() => setIsNewProjectModalOpen(true)}
              onOpenNewTask={(initialData) => {
                openNewTaskModal(typeof initialData === 'string' ? { projectId: initialData } : (initialData || {}));
              }}
              onOpenDailyCheckin={() => openDailyCheckinWizard()}
              onSubmitProgress={submitTaskProgress}
              onUpdateWorkItem={handleUpdateTaskData}
              onEditTask={openEditTaskModal}
            />
          )}

          {/* ======================================================== */}
          {/* VISTA: MIS TAREAS (§7.4)                                  */}
          {/* ======================================================== */}
          {activeView === 'tasks' && (
            <TasksView
              workItems={workItems}
              projects={enrichedProjects}
              currentUser={session}
              todayStr={todayStr}
              onSubmitProgress={submitTaskProgress}
              onUpdateWorkItem={handleUpdateTaskData}
              onEditTask={openEditTaskModal}
              onOpenNewTask={openNewTaskModal}
            />
          )}

          {/* ======================================================== */}
          {/* VISTA: DAILY CHECK-IN & BITÁCORA                          */}
          {/* ======================================================== */}
          {activeView === 'daily-check' && (
            <DailyCheckView
              workItems={workItems}
              projects={enrichedProjects}
              currentUser={session}
              todayStr={todayStr}
              onSubmitProgress={submitTaskProgress}
              onUpdateWorkItem={handleUpdateTaskData}
              onEditTask={openEditTaskModal}
              onOpenNewTask={openNewTaskModal}
              onOpenDailyWizard={(tasks) => openDailyCheckinWizard(tasks)}
              onNavigate={setActiveView}
            />
          )}

          {/* ======================================================== */}
          {/* 1. VISTA: MIS PROYECTOS (§7.1 TABLA MODERNA)              */}
          {/* ======================================================== */}
          {activeView === 'portfolio' && (
            <ProjectsView
              projects={filteredProjects}
              allProjects={enrichedProjects}
              currentUser={session}
              teamDirectory={teamDirectory}
              todayStr={todayStr}
              space={space}
              onSpaceChange={handleSpaceChange}
              selectedProjectId={selectedProjectId}
              onSelectProject={(id) => {
                setSelectedProjectId(id);
              }}
              workItems={workItems}
              onSubmitProgress={submitTaskProgress}
              onUpdateWorkItem={handleUpdateTaskData}
              onEditTask={openEditTaskModal}
              onOpenNewTask={(initialData) => {
                openNewTaskModal(typeof initialData === 'string' ? { projectId: initialData } : (initialData || {}));
              }}
              onOpenNewProject={() => setIsNewProjectModalOpen(true)}
              onEditProject={(proj) => openEditProjectModal(proj)}
              onOpenTeamModal={(proj) => openTeamModal(proj)}
              onOpenStatusModal={(proj) => openProjectStatusModal(proj)}
              onDeleteProject={(proj) => setProjectToDelete({ id: proj.id, name: proj.name })}
              onDailyCheckProject={(proj) => handleProjectDailyCheckin(proj)}
              onQuickUpdateProjectStatus={handleQuickUpdateProjectStatus}
              onNavigate={setActiveView}
              onCreatePersonalProject={() => {
                setProjectForm({
                  name: '',
                  description: '',
                  template: 'kanban',
                  status: 'execution',
                  role: 'lead',
                  startDate: todayStr,
                  targetDate: '',
                  space: 'personal'
                });
                setIsNewProjectModalOpen(true);
              }}
              meetings={meetings}
              onCreateMeeting={handleCreateMeeting}
              onUpdateMeeting={handleUpdateMeeting}
              onDeleteMeeting={handleDeleteMeeting}
              onCreateTaskFromAction={handleCreateTaskFromMeetingAction}
            />
          )}

          {/* ======================================================== */}
          {/* 2. VISTA: CRONOGRAMA & AVANCE (§7.3)                      */}
          {/* ======================================================== */}
          {activeView === 'timeline' && (
            <TimelineView
              projects={enrichedProjects}
              workItems={workItems}
              todayStr={todayStr}
              onSelectProject={(id) => {
                setSelectedProjectId(id);
                setActiveView('kanban');
              }}
              onOpenNewProject={() => setIsNewProjectModalOpen(true)}
              onOpenJustification={(proj) => setJustificationModalProject(proj)}
              onOpenNewExtension={(proj) => {
                setNewExtensionModalProject(proj);
                setExtensionForm({
                  newTargetDate: proj.targetDate || todayStr,
                  reason: '',
                  requestedBy: '',
                  approvedBy: 'Jorge'
                });
              }}
              onOpenStatusModal={(proj) => {
                setStatusModalProject(proj);
                setIsProjectStatusModalOpen(true);
              }}
            />
          )}

          {/* ======================================================== */}
          {/* 3. VISTA: AGENDA (§7.5)                                   */}
          {/* ======================================================== */}
          {activeView === 'agenda' && (
            <AgendaView
              workItems={workItems}
              projects={enrichedProjects}
              todayStr={todayStr}
              onSelectProject={(id) => {
                setSelectedProjectId(id);
                setActiveView('kanban');
              }}
              onNavigateToTasks={() => setActiveView('tasks')}
              onEditTask={openEditTaskModal}
            />
          )}

          {/* ======================================================== */}
          {/* 4. VISTA: TABLERO KANBAN (§7.2)                           */}
          {/* ======================================================== */}
          {activeView === 'kanban' && (
            <KanbanView
              workItems={workItems}
              projects={enrichedProjects}
              selectedProjectId={selectedProjectId}
              onSelectProject={(id) => setSelectedProjectId(id)}
              currentUser={session}
              todayStr={todayStr}
              onUpdateWorkItem={handleUpdateTaskData}
              onEditTask={openEditTaskModal}
              onOpenNewTask={openNewTaskModal}
              onOpenStatusModal={(proj) => openProjectStatusModal(proj)}
              onDeleteTask={(task) => handleDeleteTask(task.id)}
              onUpdateProject={handleSaveEditProject}
            />
          )}

          {/* ======================================================== */}
          {/* 5. VISTA: DIRECTORIO (§7.6)                               */}
          {/* ======================================================== */}
          {activeView === 'directory' && (
            <DirectoryView
              teamDirectory={teamDirectory}
              workItems={workItems}
              isAdmin={session?.role === 'owner' || session?.role === 'admin'}
              onOpenNewDirectoryMember={() => setIsNewDirectoryModalOpen(true)}
              onEditDirectoryMember={(m) => {
                setEditingDirectoryMember(m);
                setEditDirectoryForm({
                  name: m.name,
                  role: m.role || 'collaborator',
                  organization: m.organization || '',
                  email: m.email || '',
                  phone: m.phone || ''
                });
              }}
              onDeleteDirectoryMember={(m) => requestDeleteDirectoryMember(m)}
              onGenerateAccount={handleOpenGenerateAccount}
              onResetPassword={handleOpenResetPassword}
              onRevokeAccess={handleRevokeAccess}
            />
          )}
        </div>

      {/* 520px DRAWER: NUEVO PROYECTO (§7.7) */}
      <ProjectDrawer
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        onSubmit={handleCreateProject}
        currentUser={session}
        teamDirectory={teamDirectory}
      />

      {/* 520px DRAWER: NUEVA TAREA (§7.7) */}
      <TaskDrawer
        isOpen={isNewTaskModalOpen}
        onClose={() => setIsNewTaskModalOpen(false)}
        onSubmit={handleCreateTask}
        projects={projects}
        selectedProjectId={taskForm.projectId || selectedProjectId}
        currentUser={session}
        teamDirectory={teamDirectory}
      />

      {/* MODAL: EDITAR TAREA */}
      {isEditTaskModalOpen && editingTask && (
        <div className="modal-overlay">
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <img src="/logobase01.png" alt="" style={{ width: '22px', height: '22px', borderRadius: '5px', objectFit: 'contain' }} />
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>Editar Tarea o Compromiso</span>
                  {editingTask.code && <span className="task-code-badge">{editingTask.code}</span>}
                </h3>
              </div>
              <button className="close-btn modal-close-btn" onClick={() => setIsEditTaskModalOpen(false)} aria-label="Cerrar ventana" title="Cerrar">
                <Icons.Close />
              </button>
            </div>

            <form onSubmit={handleUpdateTask} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {error && (
                <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: 'var(--radius-md)', padding: '8px 12px', color: '#fca5a5', fontSize: '0.84rem' }}>
                  ⚠️ {error}
                </div>
              )}
              <div className="form-field">
                <label>Proyecto asociado *</label>
                <select
                  value={editTaskForm.projectId}
                  onChange={(e) => setEditTaskForm({ ...editTaskForm, projectId: e.target.value })}
                  required
                >
                  {projects.map((proj) => (
                    <option key={proj.id} value={proj.id}>
                      {proj.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label>Título de la tarea o entrega *</label>
                <input
                  type="text"
                  value={editTaskForm.title}
                  onChange={(e) => setEditTaskForm({ ...editTaskForm, title: e.target.value })}
                  placeholder="Ej. Revisar contrato de hosting"
                  required
                />
              </div>

              <div className="form-field">
                <label>Descripción / Detalles</label>
                <textarea
                  rows="2"
                  value={editTaskForm.description}
                  onChange={(e) => setEditTaskForm({ ...editTaskForm, description: e.target.value })}
                  placeholder="Detalles, criterios de aceptación o notas..."
                  style={{
                    width: '100%',
                    background: 'var(--surface-elevated)',
                    border: '1px solid var(--line-200)',
                    color: 'var(--ink-900)',
                    borderRadius: 'var(--radius-md)',
                    padding: '6px 12px',
                    fontFamily: 'inherit',
                    fontSize: '0.86rem',
                    resize: 'vertical',
                    minHeight: '44px',
                    maxHeight: '120px'
                  }}
                />
              </div>

              <TaskAssigneesSelector
                projectId={editTaskForm.projectId || selectedProjectId}
                projects={projects}
                teamDirectory={teamDirectory}
                selectedAssignees={editTaskForm.assignees || ['Jorge']}
                onChangeAssignees={(newAssignees) => {
                  setEditTaskForm((prev) => ({
                    ...prev,
                    assignees: newAssignees,
                    assignee: newAssignees.join(', '),
                    assigneeType: newAssignees.some(isAssigneeMine) ? 'me' : (newAssignees.some(a => isAssigneeVendor(a)) ? 'vendor' : 'team')
                  }));
                }}
                onOpenNewDirectoryModal={() => setIsNewDirectoryModalOpen(true)}
                currentUser={session}
              />

              {/* ASIGNACIÓN A FASES (Si el proyecto tiene fases) */}
              {(() => {
                const currentProjObj = projects.find((p) => p.id === (editTaskForm.projectId || selectedProjectId));
                if (currentProjObj?.hasPhases && Array.isArray(currentProjObj.phases) && currentProjObj.phases.length > 0) {
                  return (
                    <div className="form-field" style={{ background: '#F8FAFB', padding: '10px 12px', borderRadius: '6px', border: '1px solid #DDE2E4' }}>
                      <label style={{ color: '#2A6F62', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span>Fases asignadas a esta tarea</span>
                        <span style={{ fontSize: '11px', fontWeight: 'normal', color: '#5F6B76' }}>(Selecciona 1 o más)</span>
                      </label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {currentProjObj.phases.map((ph) => {
                          if (!ph || !ph.id) return null;
                          const isChecked = (editTaskForm.phaseIds || []).includes(ph.id);
                          return (
                            <label key={ph.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', cursor: 'pointer', color: '#1D2A33' }}>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  const current = editTaskForm.phaseIds || [];
                                  const updated = e.target.checked
                                    ? [...current, ph.id]
                                    : current.filter((id) => id !== ph.id);
                                  setEditTaskForm({ ...editTaskForm, phaseIds: updated });
                                }}
                                style={{ width: '15px', height: '15px', cursor: 'pointer' }}
                              />
                              <span>{ph.name || `Fase ${ph.id}`} <small style={{ color: '#5F6B76' }}>(Meta: {ph.targetDate || 'S/F'})</small></span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              <div className="form-grid-2">
                <div className="form-field">
                  <label>Fecha de inicio</label>
                  <input
                    type="date"
                    value={editTaskForm.startDate || ''}
                    onChange={(e) => setEditTaskForm({ ...editTaskForm, startDate: e.target.value })}
                  />
                </div>

                <div className="form-field">
                  <label>Fecha de entrega / límite</label>
                  <input
                    type="date"
                    value={editTaskForm.dueDate || ''}
                    onChange={(e) => setEditTaskForm({ ...editTaskForm, dueDate: e.target.value })}
                  />
                </div>
              </div>

              {editTaskForm.startDate && editTaskForm.dueDate && (
                <div style={{ fontSize: '11.5px', color: '#2A6F62', fontWeight: 600, marginTop: '-6px', marginBottom: '8px', background: '#F0F9F6', padding: '6px 10px', borderRadius: '4px', border: '1px solid #D5EBE3' }}>
                  ⏱️ Duración estimada: {(() => {
                    const d1 = new Date(editTaskForm.startDate + 'T12:00:00').getTime();
                    const d2 = new Date(editTaskForm.dueDate + 'T12:00:00').getTime();
                    const diff = Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
                    if (diff < 0) return '⚠️ La fecha de entrega es anterior a la fecha de inicio';
                    if (diff === 0) return 'Mismo día';
                    if (diff === 1) return '1 día';
                    if (diff < 7) return `${diff} días`;
                    const w = Math.round(diff / 7);
                    return `${diff} días (~${w} sem)`;
                  })()}
                </div>
              )}

              <div className="form-field">
                <label>Estado</label>
                <select
                  value={editTaskForm.status}
                  onChange={(e) => setEditTaskForm({ ...editTaskForm, status: e.target.value })}
                >
                  <option value="backlog">Por Iniciar (Backlog)</option>
                  <option value="in_progress">En Progreso</option>
                  <option value="review">En Revisión</option>
                  <option value="done">Completado</option>
                </select>
              </div>

              <div className="form-grid-2">
                <div className="form-field">
                  <label>Tipo</label>
                  <select
                    value={editTaskForm.type}
                    onChange={(e) => setEditTaskForm({ ...editTaskForm, type: e.target.value })}
                  >
                    <option value="task">Tarea</option>
                    <option value="story">Historia</option>
                    <option value="bug">Bug</option>
                    <option value="milestone">Hito</option>
                    <option value="risk">Riesgo</option>
                  </select>
                </div>

                <div className="form-field">
                  <label>Prioridad</label>
                  <select
                    value={editTaskForm.priority}
                    onChange={(e) => setEditTaskForm({ ...editTaskForm, priority: e.target.value })}
                  >
                    <option value="low">Baja</option>
                    <option value="medium">Media</option>
                    <option value="high">Alta / Urgente</option>
                  </select>
                </div>
              </div>

              {/* SECCIÓN: REPORTE DE CUMPLIMIENTO / CONTINUACIÓN */}
              {editTaskForm.status === 'done' && (
                <div className="task-completion-section">
                  <div className="completion-section-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="completion-icon-badge"><Icons.Check /></span>
                      <strong style={{ fontSize: '0.88rem' }}>Reporte de Cumplimiento y Cierre</strong>
                    </div>
                    <span className="completion-header-hint">Documenta lo realizado o la justificación si continuó</span>
                  </div>

                  <div className="completion-type-selector">
                    <label className={`completion-radio-card ${editTaskForm.completionType !== 'partial' ? 'active' : ''}`}>
                      <input
                        type="radio"
                        name="completionType"
                        value="full"
                        checked={editTaskForm.completionType !== 'partial'}
                        onChange={() => setEditTaskForm({ ...editTaskForm, completionType: 'full', continuationTaskId: '' })}
                      />
                      <div className="radio-text">
                        <strong>Completada Totalmente</strong>
                        <small>El entregable o alcance se finalizó satisfactoriamente</small>
                      </div>
                    </label>

                    <label className={`completion-radio-card ${editTaskForm.completionType === 'partial' ? 'active' : ''}`}>
                      <input
                        type="radio"
                        name="completionType"
                        value="partial"
                        checked={editTaskForm.completionType === 'partial'}
                        onChange={() => setEditTaskForm({ ...editTaskForm, completionType: 'partial' })}
                      />
                      <div className="radio-text">
                        <strong>Completada Parcialmente / Continuada</strong>
                        <small>Cambió requerimiento o continúa en otra tarea</small>
                      </div>
                    </label>
                  </div>

                  {editTaskForm.completionType === 'partial' && (
                    <div className="form-field" style={{ marginTop: '4px' }}>
                      <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>Tarea sucesora / continuación vinculada</label>
                      <select
                        value={editTaskForm.continuationTaskId || ''}
                        onChange={(e) => setEditTaskForm({ ...editTaskForm, continuationTaskId: e.target.value })}
                        style={{ fontSize: '0.82rem' }}
                      >
                        <option value="">-- Seleccionar tarea que continúa el requerimiento --</option>
                        {workItems
                          .filter((w) => w.projectId === editTaskForm.projectId && w.id !== editingTask.id)
                          .map((w) => (
                            <option key={w.id} value={w.id}>
                              {w.code ? `[${w.code}] ` : ''}{w.title} ({w.status === 'done' ? 'Hecha' : 'Pendiente'})
                            </option>
                          ))}
                      </select>
                      <small style={{ color: 'var(--ink-500)', fontSize: '0.74rem' }}>
                        Permite enlazar qué tarea asume el nuevo alcance para mantener la trazabilidad.
                      </small>
                    </div>
                  )}

                  <div className="form-field" style={{ marginTop: '4px' }}>
                    <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                      {editTaskForm.completionType === 'partial'
                        ? 'Detalle de lo realizado y motivo de continuación *'
                        : 'Reporte de lo realizado / entregables entregados'}
                    </label>
                    <textarea
                      rows="3"
                      value={editTaskForm.completionReport || ''}
                      onChange={(e) => setEditTaskForm({ ...editTaskForm, completionReport: e.target.value })}
                      placeholder={
                        editTaskForm.completionType === 'partial'
                          ? 'Ej. Tarea se continúa con la tarea X ya que cambió el requerimiento...'
                          : 'Ej. Se implementó la vista, se integró el API y se validó en ambiente de pruebas sin incidencias...'
                      }
                      style={{
                        width: '100%',
                        background: 'var(--surface-elevated)',
                        border: '1px solid var(--line-200)',
                        color: 'var(--ink-900)',
                        borderRadius: 'var(--radius-md)',
                        padding: '8px 12px',
                        fontFamily: 'inherit',
                        fontSize: '0.84rem',
                        resize: 'vertical',
                        minHeight: '56px'
                      }}
                    />
                  </div>

                  <div className="form-field" style={{ marginTop: '2px' }}>
                    <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>Fecha de finalización</label>
                    <input
                      type="date"
                      value={editTaskForm.completedAt ? editTaskForm.completedAt.split('T')[0] : formatDateYMD(new Date())}
                      onChange={(e) => setEditTaskForm({ ...editTaskForm, completedAt: e.target.value })}
                      style={{ maxWidth: '200px' }}
                    />
                  </div>
                </div>
              )}

              {/* Bitácora de Avances y Cambios en la Tarea */}
              <div className="task-progress-logs-section">
                <div className="progress-logs-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Icons.History />
                    <span>Bitácora de Avances y Cambios</span>
                  </div>
                  <span className="progress-logs-count-badge">
                    {editTaskForm.progressLogs?.length || 0} {editTaskForm.progressLogs?.length === 1 ? 'registro' : 'registros'}
                  </span>
                </div>

                {/* Formulario para registrar un nuevo avance */}
                <div className="progress-log-form">
                  <textarea
                    className="progress-log-textarea"
                    placeholder="Registrar nuevo avance, actualización o cambio en el alcance..."
                    value={newProgressText}
                    onChange={(e) => setNewProgressText(e.target.value)}
                    rows={2}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                        e.preventDefault();
                        handleAddProgressLog();
                      }
                    }}
                  />
                  <div className="progress-log-form-footer">
                    <div className="progress-log-author-input-wrap">
                      <Icons.User />
                      <span>Registrado por:</span>
                      <input
                        type="text"
                        className="progress-log-author-input"
                        value={newProgressAuthor}
                        onChange={(e) => setNewProgressAuthor(e.target.value)}
                        placeholder="Nombre..."
                      />
                    </div>
                    <button
                      type="button"
                      className="progress-log-add-btn"
                      onClick={handleAddProgressLog}
                      disabled={!newProgressText.trim() || isAddingProgress}
                    >
                      <Icons.Plus /> {isAddingProgress ? 'Registrando...' : 'Registrar Avance'}
                    </button>
                  </div>
                </div>

                {/* Historial de avances registrados */}
                <div className="progress-logs-list">
                  {(!editTaskForm.progressLogs || editTaskForm.progressLogs.length === 0) ? (
                    <div className="progress-logs-empty">
                      Aún no hay avances o cambios registrados en esta tarea. Agrega el primero arriba.
                    </div>
                  ) : (
                    [...editTaskForm.progressLogs]
                      .reverse()
                      .map((log) => (
                        <div key={log.id} className="progress-log-item">
                          <div className="progress-log-item-top">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <span className="progress-log-author-badge">
                                <Icons.User /> {log.author || 'Jorge'}
                              </span>
                              <span className="progress-log-date">
                                {formatDateTime(log.createdAt)}
                              </span>
                            </div>
                            <button
                              type="button"
                              className="progress-log-delete-btn"
                              title="Eliminar este avance"
                              onClick={() => handleDeleteProgressLog(log.id)}
                            >
                              <Icons.Trash />
                            </button>
                          </div>
                          <div className="progress-log-text">{log.text}</div>
                        </div>
                      ))
                  )}
                </div>
              </div>

              <div className="modal-actions" style={{ justifyContent: 'space-between', width: '100%' }}>
                <button
                  type="button"
                  className="ui-btn ui-btn--danger ui-btn--small"
                  onClick={() => setTaskToDelete(editingTask)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Icons.Trash /> <span>Eliminar Tarea</span>
                </button>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    className="ui-btn ui-btn--secondary"
                    onClick={() => setIsEditTaskModalOpen(false)}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="ui-btn ui-btn--primary">
                    Guardar Cambios
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DAILY CHECK-IN DE TAREAS (SEGUIMIENTO Y CADENCIA) */}
      {isDailyCheckinModalOpen && dailyCheckinTasks.length > 0 && (
        <div className="modal-overlay">
          <div
            className="modal-card modal-card--daily-checkin"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Icons.Zap />
                <h3 style={{ margin: 0, fontSize: '1.05rem' }}>Daily Check-in de Tareas</h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="daily-checkin-step-tag">
                  Tarea {dailyCheckinIndex + 1} de {dailyCheckinTasks.length}
                </span>
                <button
                  type="button"
                  className="close-btn modal-close-btn"
                  onClick={() => setIsDailyCheckinModalOpen(false)}
                  aria-label="Cerrar ventana"
                  title="Cerrar"
                >
                  <Icons.Close />
                </button>
              </div>
            </div>

            <div className="daily-checkin-progress-track">
              <div
                className="daily-checkin-progress-fill"
                style={{ width: `${((dailyCheckinIndex + 1) / dailyCheckinTasks.length) * 100}%` }}
              />
            </div>

            {(() => {
              const currentTask = dailyCheckinTasks[dailyCheckinIndex];
              if (!currentTask) return null;
              const freshness = getTaskFreshness(currentTask, todayStr);
              const proj = projects.find((p) => p.id === currentTask.projectId);

              return (
                <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="daily-checkin-task-preview">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        {currentTask.code && <span className="task-code-badge">{currentTask.code}</span>}
                        <span className="project-tag">{proj?.name || 'Proyecto'}</span>
                      </div>
                      <span className="task-freshness-pill warning">
                        <Icons.Clock /> {freshness.label}
                      </span>
                    </div>

                    <h4 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--ink-900)' }}>
                      {currentTask.title}
                    </h4>

                    <div style={{ display: 'flex', gap: '12px', fontSize: '0.8rem', color: 'var(--ink-500)', alignItems: 'center' }}>
                      <span>Resp: <strong>{currentTask.assignee || 'Equipo'}</strong></span>
                      {currentTask.dueDate && <span>Límite: <strong>{currentTask.dueDate}</strong></span>}
                    </div>

                    {freshness.latestLogText && (
                      <div className="task-latest-log-quote" style={{ margin: 0 }}>
                        <Icons.History />
                        <span>
                          Último reporte ({freshness.latestAuthor || 'Equipo'}): "{freshness.latestLogText}"
                        </span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, marginBottom: '6px', color: 'var(--ink-700)' }}>
                      ¿Qué avance hubo hoy o cuál es el siguiente paso para [{currentTask.code || currentTask.title}]?
                    </label>
                    <input
                      type="text"
                      className="ui-input"
                      style={{ width: '100%' }}
                      placeholder="Escribe el avance... (ej: Se coordinó con proveedor, confirman entrega el jueves)"
                      value={dailyCheckinInputText}
                      onChange={(e) => setDailyCheckinInputText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleDailyCheckinAdvance(false);
                      }}
                      autoFocus
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', flexWrap: 'wrap', gap: '10px' }}>
                    <button
                      type="button"
                      className="ui-btn ui-btn--secondary"
                      onClick={() => handleDailyCheckinAdvance(true)}
                      disabled={isSubmittingDailyCheckin}
                      title="Registrar que la tarea continúa en curso sin cambios relevantes"
                    >
                      <Icons.Check /> <span>Continúa en curso (Sin cambios)</span>
                    </button>

                    <button
                      type="button"
                      className="ui-btn ui-btn--primary"
                      onClick={() => handleDailyCheckinAdvance(false)}
                      disabled={isSubmittingDailyCheckin}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <span>Guardar y siguiente</span>
                      <Icons.ArrowRight />
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* MODAL: REPORTE DE TAREAS HECHAS Y CUMPLIMIENTO */}
      {isDoneReportModalOpen && (
        <div className="modal-overlay">
          <div
            className="modal-card modal-card--report"
            style={{ maxWidth: '980px', width: '95vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del Modal */}
            <div className="modal-header" style={{ paddingBottom: '12px', borderBottom: '1px solid var(--line-200)' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <img src="/logobase01.png" alt="" style={{ width: '24px', height: '24px', borderRadius: '6px', objectFit: 'contain' }} />
                  <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Reporte de Tareas Realizadas y Cierres</h3>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  <small style={{ color: 'var(--ink-500)', fontSize: '0.82rem' }}>
                    Proyecto: <strong>{projects.find((p) => p.id === selectedProjectId)?.name || 'Todos los proyectos'}</strong>
                  </small>
                  {projects.find((p) => p.id === selectedProjectId)?.code && (
                    <span className="project-code-badge">
                      {projects.find((p) => p.id === selectedProjectId)?.code}
                    </span>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  type="button"
                  className="close-btn modal-close-btn"
                  onClick={() => setIsDoneReportModalOpen(false)}
                  aria-label="Cerrar ventana"
                  title="Cerrar"
                >
                  <Icons.Close />
                </button>
              </div>
            </div>

            {/* Contenido Dinámico */}
            {(() => {
              const allDoneTasks = workItems.filter(
                (w) => (!selectedProjectId || w.projectId === selectedProjectId) && w.status === 'done'
              );

              const fullCount = allDoneTasks.filter((t) => t.completionType !== 'partial').length;
              const partialCount = allDoneTasks.filter((t) => t.completionType === 'partial').length;

              const filteredTasks = allDoneTasks.filter((task) => {
                if (doneReportFilter === 'full' && task.completionType === 'partial') return false;
                if (doneReportFilter === 'partial' && task.completionType !== 'partial') return false;
                if (doneReportSearch.trim()) {
                  const q = doneReportSearch.toLowerCase();
                  const matchCode = (task.code || '').toLowerCase().includes(q);
                  const matchTitle = (task.title || '').toLowerCase().includes(q);
                  const matchReport = (task.completionReport || '').toLowerCase().includes(q);
                  const matchAssignee = (task.assignee || '').toLowerCase().includes(q);
                  return matchCode || matchTitle || matchReport || matchAssignee;
                }
                return true;
              });

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, overflow: 'hidden', paddingTop: '10px' }}>
                  {/* Fila de Filtros y Búsqueda */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        type="button"
                        className={`pill-btn ${doneReportFilter === 'all' ? 'active' : ''}`}
                        onClick={() => setDoneReportFilter('all')}
                      >
                        Todas ({allDoneTasks.length})
                      </button>
                      <button
                        type="button"
                        className={`pill-btn ${doneReportFilter === 'full' ? 'active-success' : ''}`}
                        onClick={() => setDoneReportFilter('full')}
                      >
                        ✓ Totalmente completas ({fullCount})
                      </button>
                      <button
                        type="button"
                        className={`pill-btn ${doneReportFilter === 'partial' ? 'active-warning' : ''}`}
                        onClick={() => setDoneReportFilter('partial')}
                      >
                        ⚠️ Continuadas / Parciales ({partialCount})
                      </button>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="text"
                        value={doneReportSearch}
                        onChange={(e) => setDoneReportSearch(e.target.value)}
                        placeholder="Buscar por código, título, detalle..."
                        style={{
                          padding: '6px 12px',
                          fontSize: '0.82rem',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--line-200)',
                          background: 'var(--surface-elevated)',
                          color: 'var(--ink-900)',
                          minWidth: '220px'
                        }}
                      />
                    </div>
                  </div>

                  {/* Tabla de tareas hechas */}
                  <div style={{ flex: 1, overflowY: 'auto', border: '1px solid var(--line-200)', borderRadius: 'var(--radius-md)', background: 'var(--surface-elevated)' }}>
                    {filteredTasks.length === 0 ? (
                      <div style={{ padding: '36px 20px', textAlign: 'center', color: 'var(--ink-500)' }}>
                        <p style={{ margin: '8px 0 0 0', fontSize: '0.9rem', fontWeight: 600 }}>
                          {allDoneTasks.length === 0
                            ? 'Aún no hay tareas marcadas como completadas en este proyecto.'
                            : 'No se encontraron tareas con los filtros aplicados.'}
                        </p>
                        <small style={{ fontSize: '0.78rem', color: 'var(--ink-500)' }}>
                          Al mover tareas a la columna "Hecho" en el Kanban o marcarlas en la agenda, aparecerán aquí.
                        </small>
                      </div>
                    ) : (
                      <table className="done-report-table">
                        <thead>
                          <tr>
                            <th style={{ width: '90px' }}>Código</th>
                            <th style={{ minWidth: '220px' }}>Tarea y Entregable</th>
                            <th style={{ width: '130px' }}>Responsable</th>
                            <th style={{ width: '110px' }}>Fecha</th>
                            <th style={{ width: '140px' }}>Tipo de Cierre</th>
                            <th style={{ minWidth: '240px' }}>Reporte de lo Realizado / Causa de Continuación</th>
                            <th style={{ width: '60px', textAlign: 'center' }}>Acción</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredTasks.map((task) => {
                            const continuationTask = task.continuationTaskId
                              ? workItems.find((w) => w.id === task.continuationTaskId)
                              : null;
                            const isPartial = task.completionType === 'partial';

                            return (
                              <tr key={task.id} className={isPartial ? 'row-partial' : 'row-full'}>
                                <td>
                                  <span className="task-code-badge">
                                    {task.code || 'S/C'}
                                  </span>
                                </td>
                                <td>
                                  <strong style={{ display: 'block', fontSize: '0.86rem', color: 'var(--ink-900)' }}>
                                    {task.title}
                                  </strong>
                                  {task.description && (
                                    <small style={{ color: 'var(--ink-500)', fontSize: '0.75rem', display: 'block', marginTop: '2px', lineHeight: 1.3 }}>
                                      {task.description.length > 70 ? `${task.description.slice(0, 70)}...` : task.description}
                                    </small>
                                  )}
                                </td>
                                <td>
                                  <AssigneeBadge item={task} />
                                </td>
                                <td style={{ fontSize: '0.78rem', color: 'var(--ink-600)', whiteSpace: 'nowrap' }}>
                                  {task.completedAt ? task.completedAt.split('T')[0] : (task.dueDate || '-')}
                                </td>
                                <td>
                                  {isPartial ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                      <span className="completion-tag partial" style={{ width: 'fit-content' }}>
                                        ⚠️ Continuada
                                      </span>
                                      {continuationTask && (
                                        <small style={{ fontSize: '0.72rem', color: 'var(--warning-600)', lineHeight: 1.2 }}>
                                          ↳ {continuationTask.code ? `[${continuationTask.code}] ` : ''}{continuationTask.title}
                                        </small>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="completion-tag full" style={{ width: 'fit-content' }}>
                                      ✓ Total
                                    </span>
                                  )}
                                </td>
                                <td>
                                  {task.completionReport ? (
                                    <div className="report-quote-box">
                                      "{task.completionReport}"
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      className="add-report-quick-btn"
                                      onClick={() => {
                                        setIsDoneReportModalOpen(false);
                                        openEditTaskModal(task);
                                      }}
                                    >
                                      + Reportar lo realizado
                                    </button>
                                  )}
                                  {Array.isArray(task.progressLogs) && task.progressLogs.length > 0 && (
                                    <div
                                      style={{ marginTop: '5px', fontSize: '0.72rem', color: '#38bdf8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                      onClick={() => {
                                        setIsDoneReportModalOpen(false);
                                        openEditTaskModal(task);
                                      }}
                                      title="Ver historial de avances de la tarea"
                                    >
                                      <Icons.History />
                                      <span>{task.progressLogs.length} {task.progressLogs.length === 1 ? 'avance' : 'avances'} en bitácora</span>
                                    </div>
                                  )}
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                  <button
                                    type="button"
                                    className="card-edit-btn"
                                    onClick={() => {
                                      setIsDoneReportModalOpen(false);
                                      openEditTaskModal(task);
                                    }}
                                    title="Editar detalle o reporte de la tarea"
                                  >
                                    <Icons.Edit />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>

                  {/* Footer del Modal */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid var(--line-200)' }}>
                    <small style={{ color: 'var(--ink-500)', fontSize: '0.78rem' }}>
                      Mostrando {filteredTasks.length} de {allDoneTasks.length} tareas completadas
                    </small>
                    <button
                      type="button"
                      className="ui-btn ui-btn--secondary"
                      onClick={() => setIsDoneReportModalOpen(false)}
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* MODAL: CONFIRMAR ELIMINACIÓN DE TAREA */}
      {taskToDelete && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ color: 'var(--danger-600)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Icons.Alert /> <span>Confirmar Eliminación</span>
              </h3>
              <button className="close-btn modal-close-btn" onClick={() => setTaskToDelete(null)} aria-label="Cerrar ventana" title="Cerrar">
                <Icons.Close />
              </button>
            </div>

            <p style={{ color: 'var(--ink-900)', fontSize: '0.95rem', margin: '6px 0 10px', lineHeight: '1.4' }}>
              ¿Estás seguro de que deseas eliminar la tarea <strong>"{taskToDelete.title}"</strong>?
            </p>

            <div style={{ background: 'var(--danger-100)', border: '1px solid rgba(248, 113, 113, 0.35)', padding: '10px 12px', borderRadius: 'var(--radius-md)', color: 'var(--danger-600)', fontSize: '0.82rem', lineHeight: '1.45' }}>
              <strong>Advertencia:</strong> Esta acción no se puede deshacer. La tarea será eliminada permanentemente.
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
              <button
                type="button"
                className="ui-btn ui-btn--secondary"
                onClick={() => setTaskToDelete(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="ui-btn ui-btn--danger"
                onClick={() => handleDeleteTask(taskToDelete.id)}
              >
                Eliminar Tarea
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRMACIÓN DE ELIMINACIÓN DE PROYECTO */}
      {projectToDelete && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ color: 'var(--danger-600)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Icons.Alert /> <span>Confirmar Eliminación</span>
              </h3>
              <button className="close-btn modal-close-btn" onClick={() => setProjectToDelete(null)} aria-label="Cerrar ventana" title="Cerrar">
                <Icons.Close />
              </button>
            </div>

            <p style={{ color: 'var(--ink-900)', fontSize: '0.95rem', margin: '6px 0 10px', lineHeight: '1.4' }}>
              ¿Estás seguro de que deseas eliminar el proyecto <strong>"{projectToDelete.name}"</strong>?
            </p>

            <div style={{ background: 'var(--danger-100)', border: '1px solid rgba(248, 113, 113, 0.35)', padding: '10px 12px', borderRadius: 'var(--radius-md)', color: 'var(--danger-600)', fontSize: '0.82rem', lineHeight: '1.45' }}>
              <strong>Advertencia:</strong> Esta acción no se puede deshacer. Se eliminarán permanentemente todas las tareas y compromisos asociados a este proyecto.
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
              <button
                type="button"
                className="ui-btn ui-btn--secondary"
                onClick={() => setProjectToDelete(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="ui-btn ui-btn--danger"
                onClick={confirmDeleteProject}
              >
                Eliminar Proyecto
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 520px DRAWER: EDITAR PROYECTO (§7.7) */}
      <ProjectDrawer
        isOpen={Boolean(editingProject)}
        onClose={() => setEditingProject(null)}
        onSubmit={handleSaveEditProject}
        initialData={editingProject}
        isEdit={true}
        currentUser={session}
        teamDirectory={teamDirectory}
      />

      {/* MODAL: GESTIÓN DE EQUIPO, ADMINISTRADORES, COLABORADORES Y TERCEROS */}
      {isTeamModalOpen && managingProject && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '640px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <img src="/logobase01.png" alt="" style={{ width: '22px', height: '22px', borderRadius: '5px', objectFit: 'contain' }} />
                  <span>Equipo y Roles del Proyecto</span>
                </h3>
                <small style={{ color: 'var(--ink-500)', fontSize: '0.8rem' }}>
                  Proyecto: <strong>{managingProject.name}</strong>
                </small>
              </div>
              <button className="close-btn modal-close-btn" onClick={() => setIsTeamModalOpen(false)} aria-label="Cerrar ventana" title="Cerrar">
                <Icons.Close />
              </button>
            </div>

            {/* FILTROS POR ROL DENTRO DEL MODAL */}
            {(() => {
              const members = managingProject.teamMembers || [];
              const admins = members.filter((m) => m.role === 'admin');
              const collabs = members.filter((m) => m.role === 'collaborator');
              const vendors = members.filter((m) => m.role === 'vendor');

              const filtered = members.filter((m) => {
                if (teamRoleFilter === 'admin') return m.role === 'admin';
                if (teamRoleFilter === 'collaborator') return m.role === 'collaborator';
                if (teamRoleFilter === 'vendor') return m.role === 'vendor';
                return true;
              });

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', overflowY: 'auto', paddingRight: '4px' }}>
                  <div className="team-filter-tabs">
                    <button
                      type="button"
                      className={`team-filter-btn ${teamRoleFilter === 'all' ? 'active' : ''}`}
                      onClick={() => setTeamRoleFilter('all')}
                    >
                      Todos ({members.length})
                    </button>
                    <button
                      type="button"
                      className={`team-filter-btn ${teamRoleFilter === 'admin' ? 'active' : ''}`}
                      onClick={() => setTeamRoleFilter('admin')}
                    >
                      <Icons.ShieldAdmin /> <span>Administradores ({admins.length})</span>
                    </button>
                    <button
                      type="button"
                      className={`team-filter-btn ${teamRoleFilter === 'collaborator' ? 'active' : ''}`}
                      onClick={() => setTeamRoleFilter('collaborator')}
                    >
                      <Icons.Collaborator /> <span>Colaboradores ({collabs.length})</span>
                    </button>
                    <button
                      type="button"
                      className={`team-filter-btn ${teamRoleFilter === 'vendor' ? 'active' : ''}`}
                      onClick={() => setTeamRoleFilter('vendor')}
                    >
                      <Icons.Vendor /> <span>Terceros / Proveedores ({vendors.length})</span>
                    </button>
                  </div>

                  {/* LISTA DE MIEMBROS */}
                  <div className="team-members-list">
                    {filtered.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '24px 10px', color: 'var(--ink-500)', fontSize: '0.86rem' }}>
                        No hay integrantes registrados en esta categoría.
                      </div>
                    ) : (
                      filtered.map((member) => {
                        const isEditing = editingMemberId === member.id;
                        const roleClass =
                          member.role === 'admin'
                            ? 'team-member-avatar--admin'
                            : member.role === 'vendor'
                            ? 'team-member-avatar--vendor'
                            : 'team-member-avatar--collaborator';
                        const roleBadgeClass =
                          member.role === 'admin'
                            ? 'team-role-badge--admin'
                            : member.role === 'vendor'
                            ? 'team-role-badge--vendor'
                            : 'team-role-badge--collaborator';
                        const roleLabel =
                          member.role === 'admin'
                            ? 'Administrador'
                            : member.role === 'vendor'
                            ? 'Proveedor / Tercero'
                            : 'Colaborador';

                        if (isEditing) {
                          return (
                            <div key={member.id} className="team-edit-card">
                              <strong style={{ fontSize: '0.82rem', color: 'var(--brand-300)' }}>
                                Editando Integrante / Tercero
                              </strong>
                              <div className="team-edit-grid">
                                <div>
                                  <label style={{ fontSize: '0.74rem', color: 'var(--ink-500)', display: 'block', marginBottom: '2px' }}>Nombre / Entidad *</label>
                                  <input
                                    type="text"
                                    value={editMemberForm.name}
                                    onChange={(e) => setEditMemberForm({ ...editMemberForm, name: e.target.value })}
                                    required
                                    style={{ fontSize: '0.85rem', padding: '6px 8px' }}
                                  />
                                </div>
                                <div>
                                  <label style={{ fontSize: '0.74rem', color: 'var(--ink-500)', display: 'block', marginBottom: '2px' }}>Rol en el Proyecto</label>
                                  <select
                                    value={editMemberForm.role}
                                    onChange={(e) => setEditMemberForm({ ...editMemberForm, role: e.target.value })}
                                    style={{ fontSize: '0.85rem', padding: '6px 8px' }}
                                  >
                                    <option value="admin">Administrador</option>
                                    <option value="collaborator">Colaborador</option>
                                    <option value="vendor">Tercero / Proveedor</option>
                                  </select>
                                </div>
                                <div>
                                  <label style={{ fontSize: '0.74rem', color: 'var(--ink-500)', display: 'block', marginBottom: '2px' }}>Correo / Contacto</label>
                                  <input
                                    type="text"
                                    value={editMemberForm.email}
                                    onChange={(e) => setEditMemberForm({ ...editMemberForm, email: e.target.value })}
                                    placeholder="Opcional"
                                    style={{ fontSize: '0.85rem', padding: '6px 8px' }}
                                  />
                                </div>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
                                <button
                                  type="button"
                                  className="ui-btn ui-btn--secondary ui-btn--small"
                                  onClick={cancelEditMember}
                                >
                                  Cancelar
                                </button>
                                <button
                                  type="button"
                                  className="ui-btn ui-btn--primary ui-btn--small"
                                  onClick={() => handleSaveMemberEdit(member.id)}
                                >
                                  Guardar Cambios
                                </button>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div key={member.id} className="team-member-item">
                            <div className="team-member-info">
                              <div className={`team-member-avatar ${roleClass}`}>
                                {member.role === 'admin' ? (
                                  <Icons.ShieldAdmin />
                                ) : member.role === 'vendor' ? (
                                  <Icons.Vendor />
                                ) : (
                                  member.name.charAt(0).toUpperCase()
                                )}
                              </div>
                              <div className="team-member-details">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <strong>{member.name}</strong>
                                  <span className={`team-role-badge ${roleBadgeClass}`}>
                                    {roleLabel}
                                  </span>
                                </div>
                                {member.email && (
                                  <small style={{ color: 'var(--ink-500)' }}>{member.email}</small>
                                )}
                              </div>
                            </div>

                            <div className="team-member-controls">
                              <button
                                type="button"
                                className="ui-btn ui-btn--secondary ui-btn--small"
                                onClick={() => startEditMember(member)}
                                title="Editar nombre, rol o contacto"
                              >
                                <Icons.Edit /> <span>Editar</span>
                              </button>
                              <button
                                type="button"
                                className="ui-btn ui-btn--secondary ui-btn--small btn-danger-hover"
                                onClick={() => handleDeleteMember(member.id, member.name)}
                                title="Eliminar del proyecto"
                              >
                                <Icons.Trash />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* FORMULARIO AGREGAR NUEVO */}
                  <div className="add-member-section">
                    <h4>
                      <Icons.Plus /> <span>Agregar Administrador, Colaborador o Tercero</span>
                    </h4>

                    {teamDirectory.length > 0 && (
                      <div style={{ marginBottom: '14px', background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.25)', padding: '10px 12px', borderRadius: 'var(--radius-md)' }}>
                        <label style={{ fontSize: '0.78rem', color: 'var(--brand-300)', fontWeight: '600', display: 'block', marginBottom: '6px' }}>
                          Vincular rápidamente desde el Directorio Global:
                        </label>
                        <select
                          id="quick-add-from-directory"
                          style={{ width: '100%', fontSize: '0.84rem' }}
                          defaultValue=""
                          onChange={(e) => {
                            const selectedMember = teamDirectory.find((m) => m.id === e.target.value);
                            if (selectedMember) {
                              setNewMemberForm({
                                name: selectedMember.name,
                                role: selectedMember.role || 'collaborator',
                                email: selectedMember.email || selectedMember.phone || ''
                              });
                            }
                          }}
                        >
                          <option value="" disabled>Selecciona un integrante o proveedor registrado...</option>
                          {teamDirectory.map((dm) => (
                            <option key={dm.id} value={dm.id}>
                              {dm.name} ({dm.role === 'admin' ? 'Administrador' : dm.role === 'vendor' ? 'Proveedor' : 'Colaborador'}) {dm.organization ? `— ${dm.organization}` : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <form onSubmit={handleAddMember} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div className="form-grid-2">
                        <div className="form-field">
                          <label>Nombre o Razón Social *</label>
                          <input
                            type="text"
                            value={newMemberForm.name}
                            onChange={(e) => setNewMemberForm({ ...newMemberForm, name: e.target.value })}
                            placeholder="Ej. Carlos Gómez, Proveedor AWS, Soporte Softland"
                            required
                          />
                        </div>
                        <div className="form-field">
                          <label>Rol dentro del Proyecto *</label>
                          <select
                            value={newMemberForm.role}
                            onChange={(e) => setNewMemberForm({ ...newMemberForm, role: e.target.value })}
                          >
                            <option value="collaborator">Colaborador (Ejecuta tareas internas)</option>
                            <option value="admin">Administrador (Liderazgo / Gestión de metas)</option>
                            <option value="vendor">Tercero / Proveedor (Dependencia externa)</option>
                          </select>
                        </div>
                      </div>

                      <div className="form-field">
                        <label>Correo o Teléfono de contacto (Opcional)</label>
                        <input
                          type="text"
                          value={newMemberForm.email}
                          onChange={(e) => setNewMemberForm({ ...newMemberForm, email: e.target.value })}
                          placeholder="Ej. carlos@empresa.com o +506 8888-8888"
                        />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                        <button type="submit" className="ui-btn ui-btn--primary">
                          <Icons.Plus /> <span>Agregar al Proyecto</span>
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              );
            })()}

            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--line-200)', paddingTop: '12px', marginTop: '12px' }}>
              <button
                type="button"
                className="ui-btn ui-btn--secondary"
                onClick={() => setIsTeamModalOpen(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: REGISTRAR NUEVO INTEGRANTE / PROVEEDOR EN DIRECTORIO */}
      {isNewDirectoryModalOpen && (
        <div className="modal-overlay" style={{ zIndex: 1200 }}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px' }}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Icons.UsersGear />
                <span>Registrar en Directorio Global</span>
              </h3>
              <button className="close-btn modal-close-btn" onClick={() => setIsNewDirectoryModalOpen(false)} title="Cerrar">
                <Icons.Close />
              </button>
            </div>

            <form onSubmit={handleCreateDirectoryMember} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {directoryModalError && (
                <div style={{
                  background: 'var(--danger-100, #F8EDEC)',
                  border: '1px solid rgba(248, 113, 113, 0.45)',
                  borderRadius: 'var(--radius-md, 8px)',
                  padding: '10px 14px',
                  color: 'var(--danger-600, #9B3B32)',
                  fontSize: '0.86rem',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <Icons.Alert />
                  <span>{directoryModalError}</span>
                </div>
              )}
              <div className="form-field">
                <label>Nombre Completo / Razón Social *</label>
                <input
                  type="text"
                  value={newDirectoryForm.name}
                  onChange={(e) => setNewDirectoryForm({ ...newDirectoryForm, name: e.target.value })}
                  placeholder="Ej. Roberto Soto, Soporte Azure, Consultor DBA"
                  required
                />
              </div>

              <div className="form-grid-2">
                <div className="form-field">
                  <label>Tipo / Rol Global *</label>
                  <select
                    value={newDirectoryForm.role}
                    onChange={(e) => setNewDirectoryForm({ ...newDirectoryForm, role: e.target.value })}
                  >
                    <option value="collaborator">Colaborador (Equipo Interno)</option>
                    <option value="admin">Administrador (Gestión & Metas)</option>
                    <option value="vendor">Tercero / Proveedor Externo</option>
                  </select>
                </div>

                <div className="form-field">
                  <label>Organización / Departamento <small style={{ color: 'var(--ink-500)', fontWeight: 400 }}>(Opcional)</small></label>
                  <input
                    type="text"
                    value={newDirectoryForm.organization}
                    onChange={(e) => setNewDirectoryForm({ ...newDirectoryForm, organization: e.target.value })}
                    placeholder="Ej. TI Infraestructura, Softland Corp"
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-field">
                  <label>
                    Correo Electrónico {newDirectoryForm.createAccount ? (
                      <span style={{ color: 'var(--danger-600, #9B3B32)' }}>*</span>
                    ) : (
                      <small style={{ color: 'var(--ink-500)', fontWeight: 400 }}>(Opcional)</small>
                    )}
                  </label>
                  <input
                    type="email"
                    value={newDirectoryForm.email}
                    onChange={(e) => setNewDirectoryForm({ ...newDirectoryForm, email: e.target.value })}
                    placeholder={newDirectoryForm.createAccount ? "ejemplo@empresa.com (Requerido para login)" : "ejemplo@empresa.com (Opcional)"}
                    required={newDirectoryForm.createAccount}
                  />
                </div>

                <div className="form-field">
                  <label>Teléfono / Contacto <small style={{ color: 'var(--ink-500)', fontWeight: 400 }}>(Opcional)</small></label>
                  <input
                    type="text"
                    value={newDirectoryForm.phone}
                    onChange={(e) => setNewDirectoryForm({ ...newDirectoryForm, phone: e.target.value })}
                    placeholder="Ej. +506 8888-0000"
                  />
                </div>
              </div>

              {(session?.role === 'owner' || session?.role === 'admin') && (
                <div style={{
                  background: newDirectoryForm.createAccount ? 'var(--nexus-teal-50, #E6F0EE)' : 'var(--surface-bg, #F6F7F7)',
                  border: newDirectoryForm.createAccount ? '1px solid var(--nexus-teal, #2A6F62)' : '1px solid var(--line-200, #DDE2E4)',
                  borderRadius: 'var(--radius-md, 8px)',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  transition: 'background 0.2s, border-color 0.2s'
                }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem', margin: 0, color: 'var(--ink-900)' }}>
                    <input
                      type="checkbox"
                      checked={newDirectoryForm.createAccount}
                      onChange={(e) => {
                        setDirectoryModalError(null);
                        setNewDirectoryForm({ ...newDirectoryForm, createAccount: e.target.checked });
                      }}
                    />
                    <span>🔑 Generar credenciales de acceso para este usuario</span>
                  </label>
                  {!newDirectoryForm.createAccount && (
                    <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--ink-500)', lineHeight: 1.4 }}>
                      ℹ️ Se guardará como <strong>integrante de referencia</strong> en el catálogo general. Podrás asignarlo a cualquier tarea o proyecto sin necesidad de que inicie sesión.
                    </p>
                  )}

                  {newDirectoryForm.createAccount && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '4px' }}>
                      <p className="muted" style={{ fontSize: '0.78rem', margin: 0, color: 'var(--ink-500)' }}>
                        El usuario podrá ingresar a Nexus con el <strong>correo electrónico</strong> indicado arriba y esta contraseña:
                      </p>
                      <div className="form-field">
                        <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Contraseña de acceso *</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <input
                            type="text"
                            value={newDirectoryForm.password}
                            onChange={(e) => setNewDirectoryForm({ ...newDirectoryForm, password: e.target.value })}
                            placeholder="Mínimo 8 caracteres"
                            required={newDirectoryForm.createAccount}
                            style={{ flex: 1, fontFamily: 'var(--font-mono, monospace)', fontWeight: 600 }}
                          />
                          <button
                            type="button"
                            className="ui-btn ui-btn--secondary ui-btn--small"
                            onClick={() => {
                              const randomPass = generateSecurePassword();
                              setNewDirectoryForm({ ...newDirectoryForm, password: randomPass });
                            }}
                            title="Generar contraseña sugerida"
                          >
                            ⚡ Generar
                          </button>
                          <button
                            type="button"
                            className="ui-btn ui-btn--secondary ui-btn--small"
                            onClick={async () => {
                              if (!newDirectoryForm.password) return;
                              try {
                                await navigator.clipboard.writeText(newDirectoryForm.password);
                                setSuccess('Contraseña copiada al portapapeles');
                              } catch {
                                // fallback
                              }
                            }}
                            title="Copiar contraseña"
                          >
                            📋 Copiar
                          </button>
                        </div>
                        <small className="muted" style={{ fontSize: '0.75rem', marginTop: '4px', color: 'var(--ink-500, #64748B)' }}>
                          Se guardará cifrada con bcrypt (12 rondas). Entrega esta contraseña de forma segura al usuario.
                        </small>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="modal-actions" style={{ justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  className="ui-btn ui-btn--secondary"
                  onClick={() => setIsNewDirectoryModalOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="ui-btn ui-btn--primary">
                  <Icons.Plus /> <span>Guardar en Directorio</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR INTEGRANTE DEL DIRECTORIO */}
      {editingDirectoryMember && (
        <div className="modal-overlay">
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px' }}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Icons.Edit />
                <span>Editar Datos de Integrante</span>
              </h3>
              <button className="close-btn modal-close-btn" onClick={() => setEditingDirectoryMember(null)} title="Cerrar">
                <Icons.Close />
              </button>
            </div>

            <form onSubmit={handleUpdateDirectoryMember} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {editDirectoryModalError && (
                <div style={{
                  background: 'var(--danger-100, #F8EDEC)',
                  border: '1px solid rgba(248, 113, 113, 0.45)',
                  borderRadius: 'var(--radius-md, 8px)',
                  padding: '10px 14px',
                  color: 'var(--danger-600, #9B3B32)',
                  fontSize: '0.86rem',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <Icons.Alert />
                  <span>{editDirectoryModalError}</span>
                </div>
              )}
              <div className="form-field">
                <label>Nombre Completo / Razón Social *</label>
                <input
                  type="text"
                  value={editDirectoryForm.name}
                  onChange={(e) => setEditDirectoryForm({ ...editDirectoryForm, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-grid-2">
                <div className="form-field">
                  <label>Tipo / Rol Global *</label>
                  <select
                    value={editDirectoryForm.role}
                    onChange={(e) => setEditDirectoryForm({ ...editDirectoryForm, role: e.target.value })}
                  >
                    <option value="collaborator">Colaborador (Equipo Interno)</option>
                    <option value="admin">Administrador (Gestión & Metas)</option>
                    <option value="vendor">Tercero / Proveedor Externo</option>
                  </select>
                </div>

                <div className="form-field">
                  <label>Organización / Departamento</label>
                  <input
                    type="text"
                    value={editDirectoryForm.organization}
                    onChange={(e) => setEditDirectoryForm({ ...editDirectoryForm, organization: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-field">
                  <label>Correo Electrónico</label>
                  <input
                    type="email"
                    value={editDirectoryForm.email}
                    onChange={(e) => setEditDirectoryForm({ ...editDirectoryForm, email: e.target.value })}
                  />
                </div>

                <div className="form-field">
                  <label>Teléfono / Contacto</label>
                  <input
                    type="text"
                    value={editDirectoryForm.phone}
                    onChange={(e) => setEditDirectoryForm({ ...editDirectoryForm, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-actions" style={{ justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  className="ui-btn ui-btn--secondary"
                  onClick={() => setEditingDirectoryMember(null)}
                >
                  Cancelar
                </button>
                <button type="submit" className="ui-btn ui-btn--primary">
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRMAR ELIMINACIÓN (SIN TAREAS) */}
      {directoryMemberToDelete && (
        <div className="modal-overlay">
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Icons.Trash />
                <span>Confirmar Eliminación</span>
              </h3>
              <button className="close-btn modal-close-btn" onClick={() => setDirectoryMemberToDelete(null)} title="Cerrar">
                <Icons.Close />
              </button>
            </div>

            <p style={{ color: 'var(--ink-200)', margin: '14px 0 20px', fontSize: '0.92rem', lineHeight: '1.5' }}>
              ¿Estás seguro de que deseas eliminar a <strong>"{directoryMemberToDelete.name}"</strong> del directorio general?
              <br />
              <small style={{ color: 'var(--ink-400)', display: 'block', marginTop: '6px' }}>
                Este integrante no tiene tareas asignadas y será removido del catálogo global.
              </small>
            </p>

            <div className="modal-actions" style={{ justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                className="ui-btn ui-btn--secondary"
                onClick={() => setDirectoryMemberToDelete(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="ui-btn ui-btn--danger"
                onClick={handleConfirmDeleteDirectoryMember}
              >
                Sí, Eliminar del Directorio
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: BLOQUEO DE ELIMINACIÓN POR ASOCIACIÓN A TAREA */}
      {deletionBlockModal && (
        <div className="modal-overlay">
          <div className="modal-card modal-card--warning" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f87171' }}>
                <Icons.Alert />
                <span>No es posible eliminar el integrante</span>
              </h3>
              <button className="close-btn modal-close-btn" onClick={() => setDeletionBlockModal(null)} title="Cerrar">
                <Icons.Close />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', margin: '10px 0 16px' }}>
              <p style={{ color: 'var(--ink-200)', fontSize: '0.92rem', lineHeight: '1.5', margin: 0 }}>
                No se puede eliminar a <strong>"{deletionBlockModal.member.name}"</strong> porque el usuario está actualmente asociado a una tarea en un proyecto:
              </p>

              <div className="deletion-block-detail-box">
                <div className="deletion-block-row">
                  <span className="block-label">Proyecto:</span>
                  <strong className="block-val">{deletionBlockModal.projectName}</strong>
                </div>
                <div className="deletion-block-row">
                  <span className="block-label">Tarea Asignada:</span>
                  <strong className="block-val" style={{ color: 'var(--brand-300)' }}>"{deletionBlockModal.taskTitle}"</strong>
                </div>
              </div>

              <p style={{ color: 'var(--ink-400)', fontSize: '0.84rem', margin: 0 }}>
                Para proteger la integridad del proyecto, debes reasignar o desvincular la tarea antes de eliminar este integrante del directorio.
              </p>
            </div>

            <div className="modal-actions" style={{ justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                className="ui-btn ui-btn--secondary"
                onClick={() => setDeletionBlockModal(null)}
              >
                Entendido
              </button>
              {deletionBlockModal.projectId && (
                <button
                  type="button"
                  className="ui-btn ui-btn--primary"
                  onClick={() => {
                    setSelectedProjectId(deletionBlockModal.projectId);
                    setActiveView('kanban');
                    setDeletionBlockModal(null);
                  }}
                >
                  Ir al Tablero del Proyecto
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: GENERAR O CAMBIAR CREDENCIALES DE ACCESO */}
      {accountModalMember && (
        <div className="modal-overlay" style={{ zIndex: 1250 }}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Icons.ShieldAdmin />
                <span>
                  {accountModalMember.hasUserAccount || accountModalMember.isReset
                    ? 'Restablecer Contraseña (Manual)'
                    : 'Generar Credenciales de Acceso'}
                </span>
              </h3>
              <button className="close-btn modal-close-btn" onClick={() => setAccountModalMember(null)} title="Cerrar">
                <Icons.Close />
              </button>
            </div>

            <form onSubmit={handleGenerateAccountForMember} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {accountModalError && (
                <div style={{
                  background: 'var(--danger-100, #F8EDEC)',
                  border: '1px solid rgba(248, 113, 113, 0.45)',
                  borderRadius: 'var(--radius-md, 8px)',
                  padding: '10px 14px',
                  color: 'var(--danger-600, #9B3B32)',
                  fontSize: '0.86rem',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <Icons.Alert />
                  <span>{accountModalError}</span>
                </div>
              )}
              <div style={{ background: 'var(--surface-elevated, #F8FAFC)', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--line-200, #E2E8F0)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--ink-900, #0F172A)', fontSize: '0.98rem' }}>{accountModalMember.name}</div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--ink-500, #64748B)', marginTop: '2px' }}>
                      {accountModalMember.organization || 'Equipo Nexus'}
                    </div>
                  </div>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 600,
                      background: accountModalMember.hasUserAccount ? 'rgba(42, 111, 98, 0.12)' : '#EDF0F0',
                      color: accountModalMember.hasUserAccount ? '#2A6F62' : '#5F6B76'
                    }}
                  >
                    {accountModalMember.hasUserAccount ? '🔑 Cuenta activa' : 'Sin credenciales'}
                  </span>
                </div>
              </div>

              <div className="form-field">
                <label style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--ink-900, #0F172A)' }}>
                  Correo Electrónico (Usuario de acceso) *
                </label>
                <input
                  type="email"
                  value={accountPasswordForm.email !== undefined ? accountPasswordForm.email : (accountModalMember.email || '')}
                  onChange={(e) => setAccountPasswordForm({ ...accountPasswordForm, email: e.target.value })}
                  placeholder="usuario@nexus.local"
                  required
                />
              </div>

              <div className="form-field">
                <label style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--ink-900, #0F172A)' }}>
                  Rol de Acceso en Nexus *
                </label>
                <select
                  value={accountPasswordForm.role}
                  onChange={(e) => setAccountPasswordForm({ ...accountPasswordForm, role: e.target.value })}
                  style={{ width: '100%' }}
                >
                  <option value="admin">Administrador (Control total de usuarios, proyectos y tareas)</option>
                  <option value="member">Colaborador (Acceso a proyectos asignados y reporte de tareas)</option>
                </select>
              </div>

              <div className="form-field">
                <label style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--ink-900, #0F172A)' }}>
                  {accountModalMember.hasUserAccount || accountModalMember.isReset
                    ? 'Nueva Contraseña *'
                    : 'Contraseña Asignada *'}
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type={accountPasswordForm.showPassword ? 'text' : 'password'}
                    value={accountPasswordForm.password}
                    onChange={(e) => setAccountPasswordForm({ ...accountPasswordForm, password: e.target.value, copied: false })}
                    placeholder="Mínimo 8 caracteres"
                    required
                    style={{ flex: 1, fontFamily: accountPasswordForm.showPassword ? 'var(--font-mono, monospace)' : 'inherit', fontWeight: 600 }}
                  />
                  <button
                    type="button"
                    className="ui-btn ui-btn--secondary ui-btn--small"
                    onClick={() => setAccountPasswordForm({ ...accountPasswordForm, showPassword: !accountPasswordForm.showPassword })}
                    title={accountPasswordForm.showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                    style={{ minWidth: '40px', padding: '0 8px' }}
                  >
                    {accountPasswordForm.showPassword ? '🙈' : '👁️'}
                  </button>
                  <button
                    type="button"
                    className="ui-btn ui-btn--secondary ui-btn--small"
                    onClick={() => {
                      const newPass = generateSecurePassword();
                      setAccountPasswordForm({ ...accountPasswordForm, password: newPass, copied: false });
                    }}
                    title="Generar nueva clave aleatoria segura"
                  >
                    <span>⚡ Generar</span>
                  </button>
                  <button
                    type="button"
                    className="ui-btn ui-btn--secondary ui-btn--small"
                    onClick={async () => {
                      if (!accountPasswordForm.password) return;
                      try {
                        await navigator.clipboard.writeText(accountPasswordForm.password);
                        setAccountPasswordForm((prev) => ({ ...prev, copied: true }));
                        setTimeout(() => {
                          setAccountPasswordForm((prev) => ({ ...prev, copied: false }));
                        }, 2500);
                      } catch {
                        // clipboard fallback
                      }
                    }}
                    title="Copiar contraseña al portapapeles"
                    style={{ minWidth: '70px', color: accountPasswordForm.copied ? '#2A6F62' : 'inherit', fontWeight: 600 }}
                  >
                    {accountPasswordForm.copied ? '✓ ¡Copiada!' : '📋 Copiar'}
                  </button>
                </div>
                <small className="muted" style={{ fontSize: '0.78rem', marginTop: '6px', display: 'block', color: 'var(--ink-500, #64748B)' }}>
                  Mínimo 8 caracteres. Como principio de seguridad, la contraseña se almacena cifrada mediante bcrypt (12 rondas) en el servidor.
                </small>
              </div>

              <div
                style={{
                  background: 'rgba(15, 52, 70, 0.05)',
                  border: '1px solid rgba(15, 52, 70, 0.15)',
                  borderRadius: '6px',
                  padding: '10px 12px',
                  fontSize: '0.80rem',
                  color: '#0F3446',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px'
                }}
              >
                <span style={{ fontSize: '1rem', lineHeight: 1 }}>🛡️</span>
                <span>
                  <strong>Aviso de seguridad:</strong> Solo los administradores pueden generar o regenerar credenciales en el sistema. Asegúrate de entregar esta contraseña directamente al colaborador por un canal seguro.
                </span>
              </div>

              <div className="modal-actions" style={{ justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  className="ui-btn ui-btn--secondary"
                  onClick={() => setAccountModalMember(null)}
                >
                  Cancelar
                </button>
                <button type="submit" className="ui-btn ui-btn--primary" disabled={loading}>
                  <Icons.Check />{' '}
                  <span>
                    {accountModalMember.hasUserAccount || accountModalMember.isReset
                      ? 'Restablecer Contraseña'
                      : 'Guardar Credenciales'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 1: JUSTIFICACIÓN DE CAMBIO DE FECHA / PRÓRROGA */}
      {justificationModalProject && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
            <div
              className="modal-header"
              style={{
                background: '#1D2A33',
                borderBottom: '1px solid #DDE2E4'
              }}
            >
              <div>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff' }}>
                  <span>📋</span>
                  <span>{justificationModalProject.name}</span>
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--ink-500)' }}>
                  Registro Oficial de Prórroga & Justificación de Cambio de Fecha
                </p>
              </div>
              <button
                className="close-btn modal-close-btn"
                onClick={() => setJustificationModalProject(null)}
                aria-label="Cerrar ventana"
                title="Cerrar"
              >
                <Icons.Close />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '18px', padding: '22px' }}>
              {/* COMPARADOR VISUAL DE FECHAS */}
              <div
                style={{
                  background: 'var(--surface-muted, #141e30)',
                  border: '1px solid var(--line-200, rgba(255, 255, 255, 0.08))',
                  borderRadius: '12px',
                  padding: '16px 20px',
                  display: 'grid',
                  gridTemplateColumns: '1fr auto 1fr',
                  alignItems: 'center',
                  gap: '16px',
                  textAlign: 'center'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700, color: 'var(--ink-500)' }}>
                    Fecha Inicial Pactada
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, fontFamily: 'monospace', color: 'var(--ink-900)' }}>
                    {formatDateShort(justificationModalProject.originalTargetDate || justificationModalProject.targetDate)}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <span
                    style={{
                      background: 'rgba(245, 158, 11, 0.2)',
                      color: '#fbbf24',
                      border: '1px solid rgba(245, 158, 11, 0.45)',
                      padding: '3px 10px',
                      borderRadius: '999px',
                      fontSize: '0.74rem',
                      fontWeight: 800
                    }}
                  >
                    +{justificationModalProject.extensionDurationText || 'Prórroga'}
                  </span>
                  <span style={{ fontSize: '1.1rem', color: 'var(--accent-amber, #fbbf24)' }}>➔</span>
                </div>

                <div>
                  <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700, color: '#fbbf24' }}>
                    Nueva Fecha Objetivo
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, fontFamily: 'monospace', color: '#fde68a' }}>
                    {formatDateShort(justificationModalProject.targetDate)}
                  </div>
                </div>
              </div>

              {/* MOTIVO / JUSTIFICACIÓN DOCUMENTADA */}
              <div
                style={{
                  background: 'rgba(11, 17, 27, 0.6)',
                  border: '1px solid var(--line-200, rgba(255, 255, 255, 0.08))',
                  borderRadius: '12px',
                  padding: '18px'
                }}
              >
                <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--brand-300, #38bdf8)', marginBottom: '10px' }}>
                  Motivo / Justificación Documentada
                </div>

                {Array.isArray(justificationModalProject.dateExtensions) && justificationModalProject.dateExtensions.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {justificationModalProject.dateExtensions.map((ext, idx) => (
                      <div
                        key={ext.id || idx}
                        style={{
                          background: 'rgba(0, 0, 0, 0.25)',
                          padding: '14px',
                          borderRadius: '8px',
                          borderLeft: '3px solid #f59e0b'
                        }}
                      >
                        <p style={{ fontSize: '0.9rem', color: '#e2e8f0', lineHeight: 1.6, margin: 0 }}>
                          "{ext.reason}"
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginTop: '12px', fontSize: '0.78rem', color: 'var(--ink-500)' }}>
                          <div>
                            <span style={{ display: 'block', fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--ink-300)' }}>Solicitado por:</span>
                            <strong style={{ color: 'var(--ink-900)' }}>{ext.requestedBy || 'Equipo TI'}</strong>
                          </div>
                          <div>
                            <span style={{ display: 'block', fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--ink-300)' }}>Autorizado por:</span>
                            <strong style={{ color: 'var(--ink-900)' }}>{ext.approvedBy || 'Jorge'}</strong>
                          </div>
                          {ext.createdAt && (
                            <div style={{ gridColumn: 'span 2' }}>
                              <span style={{ display: 'block', fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--ink-300)' }}>Fecha de registro:</span>
                              <span>{ext.createdAt.split('T')[0]} ({new Date(ext.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: '0.88rem', color: 'var(--ink-500)', margin: 0, fontStyle: 'italic' }}>
                    La fecha meta fue postergada respecto a la fecha original pactada. No se encontró un motivo textual registrado.
                  </p>
                )}
              </div>

              {/* TAREAS DEL PROYECTO */}
              <div style={{ background: 'var(--surface-muted, #0d1420)', border: '1px solid var(--line-200, rgba(255, 255, 255, 0.08))', borderRadius: '10px', padding: '14px' }}>
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700, color: 'var(--ink-500)', marginBottom: '8px' }}>
                  Estado de Tareas del Proyecto ({workItems.filter((w) => w.projectId === justificationModalProject.id).length} totales)
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '160px', overflowY: 'auto' }}>
                  {workItems.filter((w) => w.projectId === justificationModalProject.id).length === 0 ? (
                    <span style={{ fontSize: '0.8rem', color: 'var(--ink-300)' }}>Sin tareas registradas aún.</span>
                  ) : (
                    workItems.filter((w) => w.projectId === justificationModalProject.id).map((w) => (
                      <div key={w.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255, 255, 255, 0.02)', padding: '6px 10px', borderRadius: '6px', fontSize: '0.8rem' }}>
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '380px' }}>{w.title}</span>
                        <span
                          style={{
                            fontSize: '0.7rem',
                            padding: '2px 7px',
                            borderRadius: '4px',
                            fontWeight: 700,
                            background: w.status === 'done' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(56, 189, 248, 0.2)',
                            color: w.status === 'done' ? '#34d399' : '#38bdf8'
                          }}
                        >
                          {w.status === 'done' ? 'Completada' : w.status === 'in_progress' ? 'En curso' : 'Pendiente'}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="modal-actions" style={{ justifyContent: 'flex-end', gap: '10px', padding: '14px 22px', borderTop: '1px solid var(--line-200)' }}>
              <button
                type="button"
                className="ui-btn ui-btn--secondary"
                onClick={() => setJustificationModalProject(null)}
              >
                Cerrar
              </button>
              <button
                type="button"
                className="ui-btn ui-btn--secondary"
                style={{ border: '1px solid rgba(245, 158, 11, 0.45)', color: '#fbbf24' }}
                onClick={() => {
                  const proj = justificationModalProject;
                  setJustificationModalProject(null);
                  setNewExtensionModalProject(proj);
                  setExtensionForm({
                    newTargetDate: proj.targetDate || todayStr,
                    reason: '',
                    requestedBy: '',
                    approvedBy: 'Jorge'
                  });
                }}
              >
                + Registrar Nueva Prórroga
              </button>
              <button
                type="button"
                className="ui-btn ui-btn--primary"
                onClick={() => {
                  setSelectedProjectId(justificationModalProject.id);
                  setActiveView('kanban');
                  setJustificationModalProject(null);
                }}
              >
                Ir al Tablero del Proyecto
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: REGISTRAR PRÓRROGA / CAMBIO DE FECHA */}
      {newExtensionModalProject && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '540px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>⚡</span>
                  <span>Registrar Prórroga / Cambio de Fecha</span>
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--ink-500)' }}>
                  Proyecto: <strong>{newExtensionModalProject.name}</strong>
                </p>
              </div>
              <button
                className="close-btn modal-close-btn"
                onClick={() => setNewExtensionModalProject(null)}
                aria-label="Cerrar ventana"
                title="Cerrar"
              >
                <Icons.Close />
              </button>
            </div>

            <form onSubmit={handleCreateExtension} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-field">
                  <label>Fecha Meta Actual</label>
                  <input
                    type="date"
                    value={newExtensionModalProject.targetDate || ''}
                    disabled
                    style={{ opacity: 0.65 }}
                  />
                </div>

                <div className="form-field">
                  <label>Nueva Fecha Objetivo *</label>
                  <input
                    type="date"
                    value={extensionForm.newTargetDate}
                    onChange={(e) => setExtensionForm({ ...extensionForm, newTargetDate: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-field">
                <label>Motivo o Justificación del cambio de fecha *</label>
                <textarea
                  rows="3"
                  value={extensionForm.reason}
                  onChange={(e) => setExtensionForm({ ...extensionForm, reason: e.target.value })}
                  placeholder="Describe el motivo técnico, dependencia externa, solicitud de gerencia o cliente..."
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-field">
                  <label>Solicitado por</label>
                  <input
                    type="text"
                    value={extensionForm.requestedBy}
                    onChange={(e) => setExtensionForm({ ...extensionForm, requestedBy: e.target.value })}
                    placeholder="Ej. Contabilidad, Proveedor, Cliente"
                  />
                </div>

                <div className="form-field">
                  <label>Autorizado por</label>
                  <input
                    type="text"
                    value={extensionForm.approvedBy}
                    onChange={(e) => setExtensionForm({ ...extensionForm, approvedBy: e.target.value })}
                    placeholder="Ej. Jorge (Lead TI)"
                  />
                </div>
              </div>

              <div className="modal-actions" style={{ justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  className="ui-btn ui-btn--secondary"
                  onClick={() => setNewExtensionModalProject(null)}
                >
                  Cancelar
                </button>
                <button type="submit" className="ui-btn ui-btn--primary">
                  Guardar Prórroga
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EJECUTIVO: FICHA DE ESTATUS 360° */}
      {isProjectStatusModalOpen && statusModalProject && (() => {
        const proj = enrichedProjects.find((p) => p.id === statusModalProject.id) || statusModalProject;
        const projectTasks = workItems.filter((w) => w.projectId === proj.id);
        const doneTasks = projectTasks.filter((w) => w.status === 'done');
        const activeTasks = projectTasks.filter((w) => w.status === 'in_progress' || w.status === 'review');
        const pendingTasks = projectTasks
          .filter((w) => w.status === 'backlog')
          .sort((a, b) => {
            const pOrder = { high: 1, medium: 2, low: 3 };
            return (pOrder[a.priority] || 2) - (pOrder[b.priority] || 2);
          });

        const code = proj.code || `P-${(proj.id || '').slice(0, 4)}`;
        const stage = stageLabelMap[proj.status] || 'En ejecución';
        const isOverdue = proj.isOverdue;
        const hasExtension = proj.hasExtension;
        const healthStatusText = isOverdue ? 'Vencido' : hasExtension ? 'Con prórroga' : 'En tiempo';
        const healthStatusClass = isOverdue ? 'warning' : hasExtension ? 'warning' : 'good';
        const targetDateDisplay = proj.targetDate ? formatDateShort(proj.targetDate) : 'Sin fecha límite';

        const allTeam = [
          ...(proj.admins && proj.admins.length > 0 ? proj.admins : ['Jorge']),
          ...(proj.members || [])
        ].filter((v, i, a) => a.indexOf(v) === i);

        return (
          <div className="modal-overlay">
            <div className="modal-sheet modal-sheet--status" onClick={(e) => e.stopPropagation()}>
              
              {/* CABECERA */}
              <div className="status-sheet-header">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div className="status-sheet-kicker">
                    <span style={{
                      padding: '2px 7px',
                      background: 'rgba(56, 189, 248, 0.15)',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      color: '#38bdf8',
                      borderRadius: '4px',
                      fontFamily: 'monospace',
                      fontWeight: 700
                    }}>
                      {code}
                    </span>
                    <span className={`stage-tag stage-tag--${proj.status || 'execution'}`}>
                      {stage}
                    </span>
                    <span>· Ficha Ejecutiva 360°</span>
                  </div>
                  <h2 className="status-sheet-title">
                    {proj.name}
                  </h2>
                  {proj.description && (
                    <p style={{ margin: '2px 0 0 0', fontSize: '0.84rem', color: 'var(--ink-500)', lineHeight: 1.4 }}>
                      {proj.description}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  className="close-icon-btn"
                  onClick={() => setIsProjectStatusModalOpen(false)}
                  title="Cerrar ficha de estatus"
                  style={{
                    background: 'transparent',
                    border: '1px solid transparent',
                    color: 'var(--ink-500)',
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <Icons.Close />
                </button>
              </div>

              {/* SEMÁFORO / KPI STRIP */}
              <div className="status-kpi-strip">
                <div className="status-kpi-cell">
                  <span className="status-kpi-label">Avance Global</span>
                  <span className={`status-kpi-value ${proj.progressPct >= 75 ? 'good' : 'info'}`}>
                    {proj.progressPct}%
                  </span>
                </div>

                <div className="status-kpi-cell">
                  <span className="status-kpi-label">Tareas Realizadas</span>
                  <span className="status-kpi-value good">
                    {proj.doneTasks} de {proj.totalTasks}
                  </span>
                </div>

                <div className="status-kpi-cell">
                  <span className="status-kpi-label">Plazo Estimado</span>
                  <span className={`status-kpi-value ${healthStatusClass}`} style={{ fontSize: '1rem' }}>
                    {targetDateDisplay} ({healthStatusText})
                  </span>
                </div>

                <div className="status-kpi-cell">
                  <span className="status-kpi-label">Equipo Asignado</span>
                  <span className="status-kpi-value" style={{ fontSize: '0.95rem' }} title={allTeam.join(', ')}>
                    {allTeam.length} {allTeam.length === 1 ? 'persona' : 'personas'}
                  </span>
                </div>
              </div>

              {/* CUERPO: LOS 3 PILARES CLAVE */}
              <div className="status-sheet-body">
                
                {/* PILAR 1: ¿QUÉ SE HA HECHO? */}
                <div className="status-pillar">
                  <div className="status-pillar-header done">
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Icons.Check />
                      <span>1. ¿Qué se ha hecho? (Logros y Cierres)</span>
                    </span>
                    <span style={{ fontSize: '0.78rem', opacity: 0.9 }}>
                      {doneTasks.length} {doneTasks.length === 1 ? 'tarea cerrada' : 'tareas cerradas'}
                    </span>
                  </div>
                  <div className="status-pillar-content">
                    {doneTasks.length === 0 ? (
                      <div style={{ fontSize: '0.84rem', color: 'var(--ink-500)', fontStyle: 'italic', padding: '6px 0' }}>
                        No hay tareas finalizadas aún en este ciclo.
                      </div>
                    ) : (
                      doneTasks.map((t) => {
                        const isPartial = t.completionType === 'partial';
                        const continuationTask = t.continuedInTaskId
                          ? workItems.find((w) => w.id === t.continuedInTaskId)
                          : null;
                        const closingDate = t.completedAt ? formatDateShort(t.completedAt.split('T')[0]) : t.dueDate ? formatDateShort(t.dueDate) : '';

                        return (
                          <div key={t.id} className="status-task-item">
                            <div className="status-task-head">
                              <span className="status-task-title">
                                <span className="status-task-tag" style={{ background: 'rgba(76, 138, 69, 0.12)', color: 'var(--nexus-green, #4C8A45)', border: '1px solid rgba(76, 138, 69, 0.25)' }}>
                                  {t.code || `T-${t.id}`}
                                </span>
                                <span>{t.title}</span>
                              </span>
                              {isPartial ? (
                                <span style={{ fontSize: '0.74rem', color: '#fbbf24', fontWeight: 600 }}>
                                  ⚠️ Continuada
                                </span>
                              ) : (
                                <span style={{ fontSize: '0.74rem', color: 'var(--nexus-green, #4C8A45)', fontWeight: 600 }}>
                                  ✓ Hecho
                                </span>
                              )}
                            </div>

                            {t.completionReport ? (
                              <div className="status-quote-box done">
                                "{t.completionReport}"
                              </div>
                            ) : null}

                            {isPartial && continuationTask && (
                              <div style={{ fontSize: '0.74rem', color: 'var(--warning-600)', paddingLeft: '4px' }}>
                                ↳ Continuada en: {continuationTask.code ? `[${continuationTask.code}] ` : ''}{continuationTask.title}
                              </div>
                            )}

                            <div className="status-task-footer">
                              <span>Resp: <strong>{t.assignee || 'Sin asignar'}</strong></span>
                              {closingDate && <span>Cierre: {closingDate}</span>}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* PILAR 2: ¿EN QUÉ ESTAMOS HOY? */}
                <div className="status-pillar">
                  <div className="status-pillar-header active">
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Icons.StageExecution />
                      <span>2. ¿En qué estamos hoy? (En Ejecución & Avances)</span>
                    </span>
                    <span style={{ fontSize: '0.78rem', opacity: 0.9 }}>
                      {activeTasks.length} {activeTasks.length === 1 ? 'activa' : 'activas'}
                    </span>
                  </div>
                  <div className="status-pillar-content">
                    {activeTasks.length === 0 ? (
                      <div style={{ fontSize: '0.84rem', color: 'var(--ink-500)', fontStyle: 'italic', padding: '6px 0' }}>
                        Sin tareas en progreso activo en este momento.
                      </div>
                    ) : (
                      activeTasks.map((t) => {
                        const hasLogs = Array.isArray(t.progressLogs) && t.progressLogs.length > 0;
                        const latestLog = hasLogs ? t.progressLogs[t.progressLogs.length - 1] : null;

                        return (
                          <div key={t.id} className="status-task-item">
                            <div className="status-task-head">
                              <span className="status-task-title">
                                <span className="status-task-tag" style={{ background: 'rgba(42, 111, 98, 0.12)', color: 'var(--nexus-teal, #2A6F62)', border: '1px solid rgba(42, 111, 98, 0.25)' }}>
                                  {t.code || `T-${t.id}`}
                                </span>
                                <span>{t.title}</span>
                              </span>
                              <span style={{
                                fontSize: '0.72rem',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                background: t.status === 'review' ? 'rgba(185, 138, 30, 0.12)' : 'rgba(42, 111, 98, 0.12)',
                                color: t.status === 'review' ? 'var(--warning-600, #B98A1E)' : 'var(--nexus-teal, #2A6F62)',
                                fontWeight: 600
                              }}>
                                {t.status === 'review' ? '🔍 Validación' : '⚡ En Progreso'}
                              </span>
                            </div>

                            {latestLog ? (
                              <div className="status-quote-box advance">
                                <span className="status-advance-meta">
                                  <Icons.History />
                                  <span>
                                    ↳ Último avance registrado por {latestLog.author || 'Equipo'} ({latestLog.createdAt ? formatDateTime(latestLog.createdAt) : latestLog.date || 'reciente'}):
                                  </span>
                                </span>
                                <span style={{ marginTop: '2px', color: 'var(--ink-900)' }}>
                                  "{latestLog.text}"
                                </span>
                              </div>
                            ) : t.description ? (
                              <div className="status-quote-box" style={{ borderLeftColor: 'var(--line-200)', color: 'var(--ink-700)' }}>
                                {t.description}
                              </div>
                            ) : null}

                            <div className="status-task-footer">
                              <span>Responsable: <strong>{t.assignee || 'Sin asignar'}</strong></span>
                              <span style={{
                                color: t.priority === 'high' ? 'var(--danger-500)' : t.priority === 'medium' ? 'var(--warning-500)' : 'var(--ink-500)',
                                fontWeight: 600
                              }}>
                                Prioridad: {t.priority ? t.priority.toUpperCase() : 'MEDIA'}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* PILAR 3: ¿QUÉ ESTÁ PENDIENTE? */}
                <div className="status-pillar">
                  <div className="status-pillar-header pending">
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Icons.Clock />
                      <span>3. ¿Qué está pendiente? (Próximos Pasos & Riesgos)</span>
                    </span>
                    <span style={{ fontSize: '0.78rem', opacity: 0.9 }}>
                      {pendingTasks.length} {pendingTasks.length === 1 ? 'pendiente' : 'pendientes'}
                    </span>
                  </div>
                  <div className="status-pillar-content">
                    {pendingTasks.length === 0 ? (
                      <div style={{ fontSize: '0.84rem', color: 'var(--ink-500)', fontStyle: 'italic', padding: '6px 0' }}>
                        No hay tareas pendientes en el backlog.
                      </div>
                    ) : (
                      pendingTasks.map((t) => {
                        const isTaskOverdue = t.dueDate && t.dueDate < todayStr;

                        return (
                          <div key={t.id} className="status-task-item">
                            <div className="status-task-head">
                              <span className="status-task-title">
                                <span className="status-task-tag" style={{ background: 'rgba(185, 138, 30, 0.12)', color: 'var(--warning-600, #B98A1E)', border: '1px solid rgba(185, 138, 30, 0.25)' }}>
                                  {t.code || `T-${t.id}`}
                                </span>
                                <span>{t.title}</span>
                              </span>
                              <span style={{ fontSize: '0.72rem', color: isTaskOverdue ? 'var(--danger-500)' : 'var(--ink-500)', fontWeight: isTaskOverdue ? 700 : 500, whiteSpace: 'nowrap', flexShrink: 0 }}>
                                {isTaskOverdue ? '⚠️ Vencida: ' : 'Límite: '}{t.dueDate ? formatDateShort(t.dueDate) : 'Sin definir'}
                              </span>
                            </div>
                            {t.description && (
                              <div style={{ fontSize: '0.82rem', color: 'var(--ink-700)', lineHeight: 1.45, paddingLeft: '2px' }}>
                                {t.description}
                              </div>
                            )}
                            <div className="status-task-footer">
                              <span>Asignado a: <strong>{t.assignee || 'Sin asignar'}</strong></span>
                              <span style={{
                                color: t.priority === 'high' ? 'var(--danger-500)' : 'var(--ink-500)',
                                fontWeight: 600,
                                whiteSpace: 'nowrap',
                                flexShrink: 0
                              }}>
                                {t.priority === 'high' ? '⚠️ Alta Prioridad' : t.priority === 'low' ? 'Prioridad Baja' : 'Prioridad Media'}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

              </div>

              {/* PIE DE ACCIONES */}
              <div className="status-sheet-footer">
                <div style={{ fontSize: '0.78rem', color: 'var(--ink-500)' }}>
                  Generado automáticamente con base en el avance de tareas y bitácoras en tiempo real.
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    className="ui-btn ui-btn--secondary"
                    onClick={() => {
                      setIsProjectStatusModalOpen(false);
                      handleProjectDailyCheckin(proj);
                    }}
                    title="Realizar Daily Check-in de tareas de este proyecto"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Icons.DailyCheck />
                    <span>Daily Check-in</span>
                  </button>
                  <button
                    type="button"
                    className="ui-btn ui-btn--secondary"
                    onClick={() => setIsProjectStatusModalOpen(false)}
                  >
                    Cerrar
                  </button>
                  <button
                    type="button"
                    className="ui-btn ui-btn--primary"
                    onClick={() => copyProjectStatusReport(proj, doneTasks, activeTasks, pendingTasks)}
                    style={{
                      background: copiedStatusReport ? '#2A6F62' : undefined,
                      borderColor: copiedStatusReport ? '#19463c' : undefined
                    }}
                  >
                    {copiedStatusReport ? '✓ ¡Reporte Copiado!' : '📋 Copiar para WhatsApp / Correo'}
                  </button>
                </div>
              </div>

            </div>
          </div>
        );
      })()}
    </AppShell>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
