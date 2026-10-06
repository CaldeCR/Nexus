import React, { useEffect, useState, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import './styles/tokens.css';
import './styles/dashboard.css';
import './styles/gantt.css';
import './styles/kanban.css';
import './styles/portfolio.css';
import './styles/agenda.css';
import './styles/roadmap.css';

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
  onOpenNewDirectoryModal
}) {
  const currentList = Array.isArray(selectedAssignees) && selectedAssignees.length > 0 ? selectedAssignees : ['Jorge'];

  // 1. Jorge (Yo) siempre disponible
  const candidateMap = new Map();
  candidateMap.set('Jorge', { name: 'Jorge', type: 'me', label: 'Jorge (Yo)' });

  // 2. EXCLUSIVAMENTE integrantes activos del Directorio Global Centralizado
  // (Las personas eliminadas del Directorio jamás aparecerán aquí)
  if (Array.isArray(teamDirectory) && teamDirectory.length > 0) {
    teamDirectory.forEach((m) => {
      if (m.name && m.name.trim().toLowerCase() !== 'jorge') {
        const trimmedName = m.name.trim();
        const type = m.role === 'vendor' ? 'vendor' : m.role === 'admin' ? 'admin' : 'team';
        const roleLabel = m.role === 'vendor' ? ' (Proveedor)' : m.role === 'admin' ? ' (Admin)' : ' (Colaborador)';
        candidateMap.set(trimmedName, { name: trimmedName, type, label: `${trimmedName}${roleLabel}` });
      }
    });
  }

  const candidates = Array.from(candidateMap.values());

  const toggleAssignee = (name) => {
    if (currentList.includes(name)) {
      if (currentList.length === 1) return; // Mantener al menos un responsable
      onChangeAssignees(currentList.filter((a) => a !== name));
    } else {
      onChangeAssignees([...currentList, name]);
    }
  };

  const removeAssignee = (name) => {
    if (currentList.length > 1) {
      onChangeAssignees(currentList.filter((a) => a !== name));
    }
  };

  return (
    <div className="assignees-selector-block">
      <div className="assignees-selector-header">
        <label>
          Personas Asignadas / Ejecutores *
          <span className="assignees-count-badge">({currentList.length} seleccionado{currentList.length !== 1 ? 's' : ''})</span>
        </label>
        <small className="muted">Puedes seleccionar uno o varios responsables para esta tarea</small>
      </div>

      <div className="selected-assignees-pills">
        {currentList.map((name) => {
          const isMine = isAssigneeMine(name);
          const dirMember = teamDirectory.find(
            (m) => m.name && m.name.trim().toLowerCase() === String(name).trim().toLowerCase()
          );
          const isVendor = dirMember ? dirMember.role === 'vendor' : isAssigneeVendor(name);
          const isAdmin = dirMember ? dirMember.role === 'admin' : false;
          const chipClass = isMine ? 'is-mine' : isVendor ? 'is-vendor' : isAdmin ? 'is-admin' : 'is-team';
          const IconComp = isMine ? Icons.User : isVendor ? Icons.Vendor : isAdmin ? Icons.ShieldAdmin : Icons.Team;

          return (
            <span key={name} className={`selected-assignee-tag ${chipClass}`}>
              <IconComp />
              <span>{isMine ? 'Jorge (Yo)' : name}</span>
              {currentList.length > 1 && (
                <button
                  type="button"
                  className="remove-assignee-btn"
                  onClick={() => removeAssignee(name)}
                  title={`Quitar a ${name}`}
                >
                  ×
                </button>
              )}
            </span>
          );
        })}
      </div>

      <div className="candidate-members-grid">
        <span className="candidate-label">Selección rápida de participantes (máximo 4 visibles, desplaza para ver más):</span>
        <div className="candidate-pills-row">
          {candidates.map((c) => {
            const isSelected = currentList.includes(c.name);
            const IconComp = c.type === 'me' ? Icons.User : c.type === 'vendor' ? Icons.Vendor : c.type === 'admin' ? Icons.ShieldAdmin : Icons.Team;
            return (
              <button
                key={c.name}
                type="button"
                className={`candidate-toggle-btn ${isSelected ? 'is-selected' : ''} is-${c.type}`}
                onClick={() => toggleAssignee(c.name)}
                title={isSelected ? `Quitar a ${c.name}` : `Asignar a ${c.name}`}
              >
                <IconComp />
                <span className="candidate-btn-label">{c.label}</span>
                <span className="candidate-check-mark">{isSelected ? '✓' : '+'}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="custom-assignee-row" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
        <button
          type="button"
          className="ui-btn ui-btn--secondary ui-btn--small"
          onClick={() => onOpenNewDirectoryModal && onOpenNewDirectoryModal()}
          title="Abrir formulario para registrar nuevo participante en el Directorio Global"
        >
          <Icons.Plus /> <span>Añadir</span>
        </button>
        <span className="muted" style={{ fontSize: '0.8rem' }}>
          Registrar nuevo colaborador, administrador o proveedor en el Directorio Global
        </span>
      </div>
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

  // MODO OSCURO COMO DEFAULT
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('nexus-theme');
    return saved !== null ? saved === 'dark' : true; // DEFAULT: Modo Oscuro
  });

  // Navigation
  const [activeView, setActiveView] = useState('portfolio');
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
  const [editingTask, setEditingTask] = useState(null);
  const [newProgressText, setNewProgressText] = useState('');
  const [newProgressAuthor, setNewProgressAuthor] = useState('');
  const [isAddingProgress, setIsAddingProgress] = useState(false);
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
  const [newDirectoryForm, setNewDirectoryForm] = useState({
    name: '',
    role: 'collaborator',
    organization: '',
    email: '',
    phone: ''
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
    } catch {
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
    } catch {
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
    } catch {
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
    if (!newDirectoryForm.name.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/directory`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newDirectoryForm)
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Error al registrar integrante en el directorio');
        return;
      }
      setSuccess(`"${data.name}" se registró exitosamente en el directorio.`);
      setIsNewDirectoryModalOpen(false);
      setNewDirectoryForm({
        name: '',
        role: 'collaborator',
        organization: '',
        email: '',
        phone: ''
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
    if (!editingDirectoryMember || !editDirectoryForm.name.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/directory/${editingDirectoryMember.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(editDirectoryForm)
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Error al actualizar integrante');
        return;
      }
      setSuccess(`Datos de "${data.name}" actualizados correctamente.`);
      setEditingDirectoryMember(null);
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

  const handleCreateProject = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const adminsArray = projectForm.admins
        ? projectForm.admins.split(',').map((s) => s.trim()).filter(Boolean)
        : ['Jorge'];
      const membersArray = projectForm.members
        ? projectForm.members.split(',').map((s) => s.trim()).filter(Boolean)
        : [];

      const res = await fetch(`${API_BASE}/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: projectForm.name,
          description: projectForm.description,
          template: projectForm.template,
          status: projectForm.status,
          role: projectForm.role,
          admins: adminsArray,
          members: membersArray,
          startDate: projectForm.startDate || todayStr,
          targetDate: projectForm.targetDate
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
        targetDate: ''
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

  const handleSaveEditProject = async (e) => {
    e.preventDefault();
    if (!editingProject || !editProjectForm.name.trim()) return;

    try {
      const res = await fetch(`${API_BASE}/projects/${editingProject.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editProjectForm.name.trim(),
          description: editProjectForm.description,
          template: editProjectForm.template,
          status: editProjectForm.status,
          role: editProjectForm.role,
          startDate: editProjectForm.startDate,
          targetDate: editProjectForm.targetDate
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al actualizar proyecto');

      setProjects((prev) => prev.map((p) => (p.id === data.id ? { ...p, ...data } : p)));
      setSuccess(`Proyecto "${data.name}" actualizado con éxito`);
      setEditingProject(null);
    } catch (err) {
      setError(err.message || 'Error de conexión al actualizar proyecto');
    }
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
      dueDate: initialData.dueDate || todayStr
    });
    setIsNewTaskModalOpen(true);
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setError('');
    const targetProject = taskForm.projectId || selectedProjectId || (projects[0] && projects[0].id);
    if (!targetProject) {
      setError('Debes asociar la tarea a un proyecto');
      return;
    }
    try {
      const assigneesToSave = Array.isArray(taskForm.assignees) && taskForm.assignees.length > 0 ? taskForm.assignees : ['Jorge'];
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
          ...taskForm,
          projectId: targetProject,
          assignees: assigneesToSave,
          assignee: finalAssigneeStr,
          assigneeType: finalAssigneeType
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
        dueDate: todayStr
      });
      await fetchWorkItems();
    } catch (err) {
      setError(err.message);
    }
  };

  const openEditTaskModal = (task) => {
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
      dueDate: task.dueDate || '',
      code: task.code || '',
      completionType: task.completionType || 'full',
      completionReport: task.completionReport || '',
      continuationTaskId: task.continuationTaskId || '',
      completedAt: task.completedAt || '',
      progressLogs: Array.isArray(task.progressLogs) ? task.progressLogs : []
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
      if (portfolioSubView === 'cards') {
        if (roleFilter !== 'all' && p.role !== roleFilter) return false;
      }
      if (stageFilter !== 'all' && (p.status || 'execution') !== stageFilter) return false;
      if (portfolioSubView === 'timeline') {
        if (timelineFilter === 'extended' && !p.hasExtension) return false;
        if (timelineFilter === 'ontrack' && p.hasExtension) return false;
      }
      return true;
    });
  }, [enrichedProjects, roleFilter, stageFilter, portfolioSubView, timelineFilter]);

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
    const today = agendaTasks.filter((t) => t.dueDate === todayStr);
    const upcoming = agendaTasks.filter(
      (t) => (!t.dueDate || t.dueDate > todayStr) && t.status !== 'done'
    );
    const doneToday = agendaTasks.filter((t) => t.status === 'done');

    return { overdue, today, upcoming, doneToday };
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

  // Pantalla de Login
  if (!session) {
    return (
      <div className="app-shell app-shell--auth" data-theme={darkMode ? 'dark' : 'light'}>
        <div className="auth-box">
          <div className="brand-hero-logo">
            <img src="/logobase01.png" alt="Nexus Logo" />
          </div>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <h1 style={{ fontSize: '1.6rem', color: 'var(--ink-900)', margin: '0 0 6px', letterSpacing: '-0.02em' }}>Nexus</h1>
            <p className="muted" style={{ margin: 0, color: 'var(--ink-500)', fontSize: '0.88rem' }}>
              Track your goals, drive your moves.
            </p>
          </div>
          <form onSubmit={handleLogin}>
            <div className="form-field" style={{ marginBottom: '12px' }}>
              <label>Correo electrónico</label>
              <input
                type="email"
                value={loginForm.email}
                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                placeholder="jorge@nexus.local"
                required
              />
            </div>
            <div className="form-field" style={{ marginBottom: '16px' }}>
              <label>Contraseña</label>
              <input
                type="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                placeholder="123456"
                required
              />
            </div>
            {error && <div className="notice notice-error" style={{ marginBottom: '12px' }}>{error}</div>}
            {success && <div className="notice notice-success" style={{ marginBottom: '12px' }}>{success}</div>}
            <button className="ui-btn ui-btn--primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
              {loading ? 'Validando...' : 'Iniciar Sesión'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell" data-theme={darkMode ? 'dark' : 'light'}>
      {/* BARRA DE NAVEGACIÓN SUPERIOR (TOP NAVBAR) */}
      <header className="top-navbar">
        <div className="top-navbar__inner">
          {/* LOGO & IDENTIDAD */}
          <div className="top-navbar__brand">
            <div className="brand-mark brand-mark--img">
              <img src="/logobase01.png" alt="Nexus Logo" />
            </div>
            <div className="top-navbar__brand-text">
              <strong>Nexus</strong>
              <small>Track your goals, drive your moves</small>
            </div>
          </div>

          {/* MENÚ DE VISTAS PRINCIPALES */}
          <nav className="top-navbar__nav" aria-label="Navegación principal">
            <a
              className={`top-nav-item ${activeView === 'portfolio' ? 'active' : ''}`}
              href="#portfolio"
              onClick={(e) => {
                e.preventDefault();
                setActiveView('portfolio');
              }}
            >
              <Icons.Portfolio />
              <span>Mis Proyectos</span>
            </a>

            <a
              className={`top-nav-item ${activeView === 'agenda' ? 'active' : ''}`}
              href="#agenda"
              onClick={(e) => {
                e.preventDefault();
                setActiveView('agenda');
              }}
            >
              <Icons.Agenda />
              <span>Agenda & Calendario</span>
              {globalKpis.totalMyPending > 0 && (
                <span className="stage-count stage-count--danger" style={{ fontSize: '0.72rem', padding: '1px 7px', minWidth: '18px', height: '18px' }}>
                  {globalKpis.totalMyPending}
                </span>
              )}
            </a>

            <a
              className={`top-nav-item ${activeView === 'kanban' ? 'active' : ''}`}
              href="#kanban"
              onClick={(e) => {
                e.preventDefault();
                setActiveView('kanban');
              }}
            >
              <Icons.Kanban />
              <span>Tablero Kanban</span>
            </a>

            <a
              className={`top-nav-item ${activeView === 'directory' ? 'active' : ''}`}
              href="#directory"
              onClick={(e) => {
                e.preventDefault();
                setActiveView('directory');
              }}
            >
              <Icons.UsersGear />
              <span>Directorio & Equipo</span>
              {teamDirectory.length > 0 && (
                <span className="stage-count" style={{ fontSize: '0.72rem', padding: '1px 7px', minWidth: '18px', height: '18px' }}>
                  {teamDirectory.length}
                </span>
              )}
            </a>
          </nav>

          {/* ACCIONES DE PERFIL, TEMA Y CIERRE */}
          <div className="top-navbar__actions">
            <button
              className="top-theme-btn"
              type="button"
              onClick={toggleTheme}
              title={darkMode ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
              aria-label="Cambiar tema de interfaz"
            >
              {darkMode ? <Icons.Sun /> : <Icons.Moon />}
              <span className="top-theme-text">{darkMode ? 'Día' : 'Noche'}</span>
            </button>

            <div className="top-user-pill">
              <div className="user-avatar" style={{ background: 'var(--brand-100)', color: 'var(--brand-300)' }}>
                {session.name ? session.name.charAt(0) : 'J'}
              </div>
              <div className="top-user-info">
                <strong>{session.name}</strong>
                <small>Líder de TI / PM</small>
              </div>
            </div>

            <button
              className="ui-btn ui-btn--secondary ui-btn--small"
              type="button"
              onClick={logout}
              title="Cerrar sesión"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      {/* ÁREA DE CONTENIDO FLUIDO COMPLETO */}
      <div className="dashboard-content-wrap">
        {/* PANEL PRINCIPAL */}
        <main className="main-panel">
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
          {/* 1. VISTA: MIS PROYECTOS                                  */}
          {/* ======================================================== */}
          {activeView === 'portfolio' && (
            <>
              <div className="page-header">
                <div>
                  <p className="eyebrow">Control de Portafolio</p>
                  <h2>Mis Proyectos</h2>
                </div>
                <div className="header-actions" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div className="portfolio-subview-toggle">
                    <button
                      type="button"
                      className={`subview-toggle-btn ${portfolioSubView === 'cards' ? 'active' : ''}`}
                      onClick={() => setPortfolioSubView('cards')}
                      title="Vista tradicional de tarjetas"
                    >
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>
                      <span>Tarjetas</span>
                    </button>
                    <button
                      type="button"
                      className={`subview-toggle-btn ${portfolioSubView === 'timeline' ? 'active' : ''}`}
                      onClick={() => setPortfolioSubView('timeline')}
                      title="Vista abstracta de cronograma con avance y prórrogas"
                    >
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
                      <span>Cronograma & Avance</span>
                      <span className="subview-pill-badge">NUEVO</span>
                    </button>
                  </div>

                  <button
                    className="ui-btn ui-btn--primary"
                    type="button"
                    onClick={() => setIsNewProjectModalOpen(true)}
                  >
                    <Icons.Plus /> <span>Nuevo Proyecto</span>
                  </button>
                </div>
              </div>

              {/* TOOLBAR Y FILTROS HORIZONTALES COMPACTOS */}
              <div className="portfolio-toolbar">
                {portfolioSubView === 'cards' && (
                  <div className="filter-group-inline">
                    <span className="compact-filter-label">Mi Rol:</span>
                    <div className="compact-btn-group">
                      <button
                        type="button"
                        className={`compact-pill-btn ${roleFilter === 'all' ? 'active' : ''}`}
                        onClick={() => setRoleFilter('all')}
                      >
                        Todos ({enrichedProjects.length})
                      </button>
                      <button
                        type="button"
                        className={`compact-pill-btn ${roleFilter === 'lead' ? 'active' : ''}`}
                        onClick={() => setRoleFilter('lead')}
                      >
                        <Icons.Lead /> <span>Encargado ({globalKpis.leadCount})</span>
                      </button>
                      <button
                        type="button"
                        className={`compact-pill-btn ${roleFilter === 'collaborator' ? 'active' : ''}`}
                        onClick={() => setRoleFilter('collaborator')}
                      >
                        <Icons.Collaborator /> <span>Colaborador ({globalKpis.collabCount})</span>
                      </button>
                    </div>
                  </div>
                )}

                <div className="filter-group-inline">
                  <span className="compact-filter-label">Etapa:</span>
                  <select
                    className="compact-filter-select"
                    value={stageFilter}
                    onChange={(e) => setStageFilter(e.target.value)}
                  >
                    <option value="all">Todas las etapas</option>
                    {projectStages.map((st) => (
                      <option key={st.key} value={st.key}>{st.label}</option>
                    ))}
                  </select>
                </div>

                {portfolioSubView === 'timeline' && (
                  <div className="filter-group-inline">
                    <span className="compact-filter-label">Plazos:</span>
                    <div className="compact-btn-group">
                      <button
                        type="button"
                        className={`compact-pill-btn ${timelineFilter === 'all' ? 'active' : ''}`}
                        onClick={() => setTimelineFilter('all')}
                      >
                        Todos ({enrichedProjects.length})
                      </button>
                      <button
                        type="button"
                        className={`compact-pill-btn ${timelineFilter === 'extended' ? 'active-warning' : ''}`}
                        onClick={() => setTimelineFilter('extended')}
                      >
                        ⚠️ Con Prórroga ({enrichedProjects.filter((p) => p.hasExtension).length})
                      </button>
                      <button
                        type="button"
                        className={`compact-pill-btn ${timelineFilter === 'ontrack' ? 'active' : ''}`}
                        onClick={() => setTimelineFilter('ontrack')}
                      >
                        En Plazo ({enrichedProjects.filter((p) => !p.hasExtension).length})
                      </button>
                    </div>
                  </div>
                )}

                {portfolioSubView === 'cards' && (
                  <div className="portfolio-toolbar-counter" style={{ marginLeft: 'auto' }}>
                    Mostrando <strong>{filteredProjects.length}</strong> de {enrichedProjects.length} proyectos
                  </div>
                )}

                {portfolioSubView === 'timeline' && (
                  <div className="roadmap-legend-row" style={{ marginLeft: 'auto' }}>
                    <div className="roadmap-legend-item">
                      <span className="roadmap-legend-color roadmap-legend-color--fill" />
                      <span>% Tareas</span>
                    </div>
                    <div className="roadmap-legend-item">
                      <span className="roadmap-legend-color roadmap-legend-color--time" />
                      <span>Plazo pactado</span>
                    </div>
                    <div className="roadmap-legend-item">
                      <span className="roadmap-legend-color roadmap-legend-color--ext" />
                      <span style={{ color: '#fbbf24', fontWeight: 600 }}>Prórroga</span>
                    </div>
                    <div className="roadmap-legend-item">
                      <span className="roadmap-legend-color roadmap-legend-color--today" />
                      <span style={{ color: '#f43f5e', fontWeight: 700 }}>Hoy ({formatDateShort(todayStr)})</span>
                    </div>
                  </div>
                )}
              </div>

              {/* VISTA 1: TARJETAS TRADICIONALES */}
              {portfolioSubView === 'cards' && (
                <div className="projects-portfolio-grid">
                {filteredProjects.length === 0 ? (
                  <div className="panel-card" style={{ textAlign: 'center', padding: '40px' }}>
                    <p className="muted">No hay proyectos que coincidan con los filtros seleccionados.</p>
                  </div>
                ) : (
                  filteredProjects.map((project) => (
                    <article
                      key={project.id}
                      id={`project-card-${project.id}`}
                      className={`project-portfolio-card ${highlightedProjectId === project.id ? 'project-card--highlight' : ''}`}
                    >
                      {/* HEADER: SUPERIOR IZQUIERDA (ESTADO + EQUIPO), CENTRO (TÍTULO), DERECHA (TABLERO) */}
                      <div className="project-card-header">
                        {/* PARTE SUPERIOR IZQUIERDA: ESTADO LLAMATIVO Y DEBAJO EL BOTÓN DE EQUIPO */}
                        <div className="project-card-left-section">
                          <div className={`project-stage-pill project-stage-pill--${project.status || 'execution'}`} title="Cambiar etapa del proyecto">
                            <span className="project-stage-pill__icon">{renderStageIcon(project.status || 'execution')}</span>
                            <span className="project-stage-pill__text">{stageLabelMap[project.status || 'execution'] || 'En ejecución'}</span>
                            <span className="project-stage-pill__arrow">▾</span>
                            <select
                              value={project.status || 'execution'}
                              onChange={(e) => updateProjectStage(project.id, e.target.value)}
                              aria-label="Etapa del proyecto"
                              className="project-stage-pill__native-select"
                            >
                              {projectStages.map((st) => (
                                <option key={st.key} value={st.key}>{st.label}</option>
                              ))}
                            </select>
                          </div>

                          <button
                            type="button"
                            className="project-team-gear-btn"
                            onClick={() => openTeamModal(project)}
                            title="Gestionar Administradores, Colaboradores y Terceros"
                          >
                            <Icons.UsersGear />
                            <span>Equipo ({project.teamMembers ? project.teamMembers.length : (project.admins?.length || 1) + (project.members?.length || 0)})</span>
                          </button>
                        </div>

                        {/* SECCIÓN PRINCIPAL: TÍTULO, BADGES, DESCRIPCIÓN Y MIEMBROS */}
                        <div className="project-card-main-info">
                          <div className="project-card-title-row">
                            {project.code && <span className="project-code-badge">{project.code}</span>}
                            <h3>{project.name}</h3>

                            <span className={`role-badge ${project.role === 'lead' ? 'role-badge--lead' : 'role-badge--collaborator'}`}>
                              {project.role === 'lead' ? (
                                <>
                                  <Icons.Lead /> <span>Encargado</span>
                                </>
                              ) : (
                                <>
                                  <Icons.Collaborator /> <span>Colaborador</span>
                                </>
                              )}
                            </span>

                            <span className="template-badge">
                              {project.template}
                            </span>
                          </div>

                          <p className="project-card-desc">
                            {project.description || 'Sin descripción'}
                          </p>

                          {/* ADMINS Y EQUIPO */}
                          <div className="project-members-row">
                            <span className="project-member-tag project-member-tag--admin" title="Administrador(es) del proyecto">
                              <Icons.ShieldAdmin />
                              <span>Admin(s): {project.admins && project.admins.length > 0 ? project.admins.join(', ') : 'Jorge'}</span>
                            </span>
                            {project.members && project.members.length > 0 && (
                              <span className="project-member-tag project-member-tag--member" title="Colaboradores y proveedores participantes">
                                <Icons.Team />
                                <span>Equipo / Terceros: {project.members.join(', ')}</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* PARTE SUPERIOR DERECHA: BOTÓN TABLERO */}
                        <div className="project-card-top-right">
                          <button
                            className="ui-btn ui-btn--primary ui-btn--small project-btn-board"
                            type="button"
                            onClick={() => {
                              setSelectedProjectId(project.id);
                              setActiveView('kanban');
                            }}
                            title="Abrir Tablero Kanban del proyecto"
                          >
                            <span>Tablero</span> <Icons.ArrowRight />
                          </button>
                        </div>
                      </div>

                      {/* META BAR / PROGRESO */}
                      <div className="project-card-meta-bar">
                        <div className="project-progress-section">
                          <div className="progress-label-row">
                            <span>Avance: <strong>{project.progressPct}%</strong></span>
                            <span>{project.doneTasks} de {project.totalTasks} tareas hechas</span>
                          </div>
                          <div className="progress-track">
                            <div className="progress-fill" style={{ width: `${project.progressPct}%` }} />
                          </div>
                        </div>

                        <div className="pending-indicator-group">
                          {project.myPending > 0 ? (
                            <span className="pending-chip pending-chip--mine">
                              <Icons.User /> {project.myPending} míos pendientes
                            </span>
                          ) : (
                            <span className="pending-chip pending-chip--clean">
                              <Icons.Check /> Al día conmigo
                            </span>
                          )}

                          {project.teamPending > 0 && (
                            <span className="pending-chip pending-chip--team">
                              <Icons.Team /> {project.teamPending} del equipo
                            </span>
                          )}

                          {project.vendorPending > 0 && (
                            <span className="pending-chip pending-chip--vendor" title="Tareas pendientes de un tercero o proveedor">
                              <Icons.Vendor /> {project.vendorPending} en proveedor
                            </span>
                          )}
                        </div>
                      </div>

                      {/* FOOTER: INFERIOR IZQUIERDA (ELIMINAR + EDITAR), INFERIOR DERECHA (FECHA META) */}
                      <div className="project-card-footer">
                        <div className="project-card-footer-left">
                          <button
                            className="project-compact-icon-btn btn-danger-hover"
                            type="button"
                            onClick={() => setProjectToDelete({ id: project.id, name: project.name })}
                            title="Eliminar proyecto"
                          >
                            <Icons.Trash />
                          </button>

                          <button
                            className="ui-btn ui-btn--secondary ui-btn--small project-btn-edit"
                            type="button"
                            onClick={() => openEditProjectModal(project)}
                            title="Editar información del proyecto"
                          >
                            <Icons.Edit /> <span>Editar Proyecto</span>
                          </button>
                        </div>

                        <div className="project-card-footer-right">
                          <span className="project-target-date">
                            <Icons.Calendar />
                            <span>Meta:</span>
                            <strong style={{ color: project.isOverdue ? 'var(--danger-600)' : 'inherit' }}>
                              {project.targetDate || 'Sin fecha límite'}
                            </strong>
                            {project.isOverdue && <Icons.Alert />}
                          </span>
                        </div>
                      </div>
                    </article>
                  ))
                )}
                </div>
              )}

              {/* VISTA 2: CRONOGRAMA ABSTRACTO & AVANCE DE METAS */}
              {portfolioSubView === 'timeline' && (
                <div className="roadmap-board-card">
                  <div className="roadmap-layout">
                    {/* SIDEBAR DE PROYECTOS */}
                    <div className="roadmap-sidebar">
                      <div className="roadmap-sidebar-header">
                        <span>Proyecto & Metas</span>
                        <span>Cumplimiento</span>
                      </div>

                      <div className="roadmap-sidebar-list">
                        {filteredProjects.length === 0 ? (
                          <div style={{ padding: '36px 20px', textAlign: 'center', color: 'var(--ink-500)', fontSize: '0.84rem' }}>
                            No hay proyectos que coincidan con los filtros seleccionados.
                          </div>
                        ) : (
                          filteredProjects.map((project) => (
                            <div
                              key={`sidebar-${project.id}`}
                              className="roadmap-project-item"
                              onClick={() => {
                                if (project.hasExtension) {
                                  setJustificationModalProject(project);
                                } else {
                                  setSelectedProjectId(project.id);
                                  setActiveView('kanban');
                                }
                              }}
                            >
                              <div className="roadmap-item-title-row">
                                <span className="roadmap-project-name" title={project.name} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  {project.code && <span className="project-code-badge">{project.code}</span>}
                                  <span>{project.name}</span>
                                </span>
                                <span className={`stage-tag stage-tag--${project.status || 'execution'}`}>
                                  {stageLabelMap[project.status || 'execution'] || 'En ejecución'}
                                </span>
                              </div>

                              <div className="roadmap-item-meta-row">
                                <span className="roadmap-task-ratio">
                                  <Icons.Check />
                                  <span>
                                    {project.doneTasks}/{project.totalTasks} tareas ({project.progressPct}%)
                                  </span>
                                </span>

                                {project.hasExtension ? (
                                  <button
                                    type="button"
                                    className="roadmap-extension-badge"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setJustificationModalProject(project);
                                    }}
                                    title="Ver justificación técnica de la prórroga"
                                  >
                                    <span>⚠️ +{project.extensionDurationText}</span>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    className="ui-btn ui-btn--ghost ui-btn--small"
                                    style={{ fontSize: '0.72rem', padding: '2px 8px', color: 'var(--ink-500)', border: '1px solid var(--line-200)' }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setNewExtensionModalProject(project);
                                      setExtensionForm({
                                        newTargetDate: project.targetDate || todayStr,
                                        reason: '',
                                        requestedBy: '',
                                        approvedBy: 'Jorge'
                                      });
                                    }}
                                    title="Registrar una prórroga para este proyecto"
                                  >
                                    + Prórroga
                                  </button>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* TIMELINE INTERACTIVO */}
                    <div className="roadmap-timeline-view">
                      {/* ENCABEZADOS DE MESES */}
                      <div
                        className="roadmap-header-track"
                        style={{ gridTemplateColumns: `repeat(${timelineScale.monthCols.length}, 1fr)` }}
                      >
                        {timelineScale.monthCols.map((m, idx) => (
                          <div
                            key={`m-${idx}`}
                            className={`roadmap-month-col ${m.isCurrent ? 'is-current-month' : ''}`}
                          >
                            <span className="roadmap-month-title" style={{ color: m.isCurrent ? 'var(--brand-300)' : 'inherit' }}>
                              {m.label}
                            </span>
                            <span className="roadmap-month-sub">{m.isCurrent ? 'Mes Actual' : ''}</span>
                          </div>
                        ))}
                      </div>

                      {/* CUERPO DEL CRONOGRAMA */}
                      <div className="roadmap-body-track">
                        {/* LÍNEAS DE CUADRÍCULA */}
                        <div
                          className="roadmap-grid-overlay"
                          style={{ gridTemplateColumns: `repeat(${timelineScale.monthCols.length}, 1fr)` }}
                        >
                          {timelineScale.monthCols.map((_, idx) => (
                            <div key={`grid-${idx}`} className="roadmap-grid-line" />
                          ))}
                        </div>

                        {/* LÍNEA DE HOY */}
                        {timelineScale.todayPct >= 0 && timelineScale.todayPct <= 100 && (
                          <div
                            className="roadmap-today-marker"
                            style={{ left: `${timelineScale.todayPct}%` }}
                            title={`Línea temporal de hoy (${todayStr})`}
                          >
                            <div className="roadmap-today-flag">Hoy: {formatDateShort(todayStr)}</div>
                          </div>
                        )}

                        {/* FILAS DE BARRAS DE PROYECTOS */}
                        {filteredProjects.map((project, index) => {
                          const startPct = timelineScale.dateToPercent(project.effectiveStartDate);
                          const origEndPct = timelineScale.dateToPercent(project.effectiveOriginalTargetDate);
                          const baseWidth = Math.max(3, origEndPct - startPct);
                          const isNearTop = index < 2;
                          const maxEndPct = project.hasExtension ? timelineScale.dateToPercent(project.effectiveTargetDate) : origEndPct;
                          const alignH = startPct < 15 ? 'align-left' : (maxEndPct > 85 ? 'align-right' : 'align-center');
                          const tooltipClass = `${isNearTop ? 'tooltip-down' : 'tooltip-up'} ${alignH}`;

                          if (!project.hasExtension) {
                            return (
                              <div key={`row-${project.id}`} className="roadmap-timeline-row">
                                <div
                                  className="roadmap-bar-composite"
                                  style={{ left: `${startPct}%`, width: `${baseWidth}%` }}
                                  onClick={() => {
                                    setSelectedProjectId(project.id);
                                    setActiveView('kanban');
                                  }}
                                >
                                  {/* PIN DE FECHA DE INICIO */}
                                  <div
                                    className="roadmap-start-pin"
                                    data-date={`Inicio: ${formatDateShort(project.effectiveStartDate)}`}
                                    title={`Iniciado: ${formatDateFull(project.effectiveStartDate)}`}
                                  />

                                  <div className="roadmap-bar-base is-single-pill" style={{ width: '100%' }}>
                                    <div
                                      className="roadmap-progress-fill"
                                      style={{ width: `${project.progressPct}%` }}
                                    />
                                    <div className="roadmap-bar-labels">
                                      <span className="roadmap-bar-start-label">▶ {formatDateShort(project.effectiveStartDate)}</span>
                                      <span className="roadmap-bar-prog-label">{project.progressPct}%</span>
                                      <span className="roadmap-bar-end-label">🏁 {formatDateShort(project.effectiveOriginalTargetDate)}</span>
                                    </div>

                                    {/* PIN DE FECHA PACTADA */}
                                    <div
                                      className="roadmap-original-pin"
                                      data-date={`Meta: ${formatDateShort(project.effectiveOriginalTargetDate)}`}
                                      title={`Límite pactado: ${formatDateFull(project.effectiveOriginalTargetDate)}`}
                                    />

                                    {/* TOOLTIP ON HOVER CON FECHAS DE INICIO Y FINALIZACIÓN */}
                                    <div className={`roadmap-bar-hover-tooltip ${tooltipClass}`}>
                                      <div className="roadmap-tooltip-header">
                                        {project.code && <span className="project-code-badge" style={{ fontSize: '0.68rem', padding: '0 5px' }}>{project.code}</span>}
                                        <span>{project.name}</span>
                                      </div>
                                      <div className="roadmap-tooltip-dates-grid">
                                        <div className="tooltip-date-row">
                                          <span className="tooltip-date-label">📅 Fecha de Inicio:</span>
                                          <span className="tooltip-date-val is-start">{formatDateFull(project.effectiveStartDate)}</span>
                                        </div>
                                        <div className="tooltip-date-row">
                                          <span className="tooltip-date-label">🏁 Fecha de Finalización:</span>
                                          <span className="tooltip-date-val is-end">{formatDateFull(project.effectiveOriginalTargetDate)}</span>
                                        </div>
                                      </div>
                                      <div className="roadmap-tooltip-progress-row">
                                        <span>Avance: <strong>{project.progressPct}%</strong> ({project.doneTasks}/{project.totalTasks} tareas)</span>
                                      </div>
                                      <div className="roadmap-tooltip-cta">
                                        🖱️ Clic para ver tareas en Kanban
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          }

                          // Barra con tramo extendido (prórroga)
                          const extEndPct = timelineScale.dateToPercent(project.effectiveTargetDate);
                          const extWidth = Math.max(2, extEndPct - origEndPct);
                          const totalWidth = baseWidth + extWidth;
                          const baseRatio = (baseWidth / totalWidth) * 100;
                          const extRatio = (extWidth / totalWidth) * 100;

                          return (
                            <div key={`row-${project.id}`} className="roadmap-timeline-row">
                              <div
                                className="roadmap-bar-composite"
                                style={{ left: `${startPct}%`, width: `${totalWidth}%` }}
                              >
                                {/* PIN DE FECHA DE INICIO */}
                                <div
                                  className="roadmap-start-pin"
                                  data-date={`Inicio: ${formatDateShort(project.effectiveStartDate)}`}
                                  title={`Iniciado: ${formatDateFull(project.effectiveStartDate)}`}
                                />

                                {/* TRAMO BASE (TIEMPO PACTADO ORIGINAL) */}
                                <div
                                  className="roadmap-bar-base"
                                  style={{ width: `${baseRatio}%` }}
                                  onClick={() => {
                                    setSelectedProjectId(project.id);
                                    setActiveView('kanban');
                                  }}
                                >
                                  <div
                                    className="roadmap-progress-fill"
                                    style={{ width: `${project.progressPct}%` }}
                                  />
                                  <div className="roadmap-bar-labels">
                                    <span className="roadmap-bar-start-label">▶ {formatDateShort(project.effectiveStartDate)}</span>
                                    <span className="roadmap-bar-prog-label">{project.progressPct}%</span>
                                    <span className="roadmap-bar-end-label">{formatDateShort(project.effectiveOriginalTargetDate)}</span>
                                  </div>

                                  {/* PIN DE FECHA PACTADA */}
                                  <div
                                    className="roadmap-original-pin"
                                    data-date={`Pactado: ${formatDateShort(project.effectiveOriginalTargetDate)}`}
                                    title={`Límite pactado original: ${formatDateFull(project.effectiveOriginalTargetDate)}`}
                                  />

                                  {/* TOOLTIP ON HOVER CON FECHAS DE INICIO Y FINALIZACIÓN */}
                                  <div className={`roadmap-bar-hover-tooltip ${tooltipClass}`}>
                                    <div className="roadmap-tooltip-header">
                                      {project.code && <span className="project-code-badge" style={{ fontSize: '0.68rem', padding: '0 5px' }}>{project.code}</span>}
                                      <span>{project.name}</span>
                                    </div>
                                    <div className="roadmap-tooltip-dates-grid">
                                      <div className="tooltip-date-row">
                                        <span className="tooltip-date-label">📅 Fecha de Inicio:</span>
                                        <span className="tooltip-date-val is-start">{formatDateFull(project.effectiveStartDate)}</span>
                                      </div>
                                      <div className="tooltip-date-row">
                                        <span className="tooltip-date-label">🏁 Pactado Original:</span>
                                        <span className="tooltip-date-val is-end">{formatDateFull(project.effectiveOriginalTargetDate)}</span>
                                      </div>
                                      <div className="tooltip-date-row">
                                        <span className="tooltip-date-label">⚠️ Nueva Meta (Prórroga):</span>
                                        <span className="tooltip-date-val is-ext">{formatDateFull(project.effectiveTargetDate)} (+{project.extensionDurationText})</span>
                                      </div>
                                    </div>
                                    <div className="roadmap-tooltip-progress-row">
                                      <span>Avance: <strong>{project.progressPct}%</strong> ({project.doneTasks}/{project.totalTasks} tareas)</span>
                                    </div>
                                    <div className="roadmap-tooltip-cta">
                                      🖱️ Clic en barra para Kanban / Clic en prórroga para justificación
                                    </div>
                                  </div>
                                </div>

                                {/* TRAMO EXTENDIDO (PRÓRROGA) */}
                                <div
                                  className="roadmap-bar-extension"
                                  style={{ width: `${extRatio}%` }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setJustificationModalProject(project);
                                  }}
                                >
                                  <span className="roadmap-extension-pill">
                                    <span>⚠️ +{project.extensionDurationText}</span>
                                  </span>

                                  {/* TOOLTIP INTERACTIVO AL PASAR EL CURSOR */}
                                  <div className={`roadmap-extension-tooltip ${tooltipClass}`}>
                                    <div className="roadmap-tooltip-header">
                                      <span>&gt; Tiempo extendido, {project.extensionDurationText}</span>
                                    </div>
                                    <div className="roadmap-tooltip-body">
                                      {project.dateExtensions && project.dateExtensions.length > 0
                                        ? project.dateExtensions[project.dateExtensions.length - 1].reason
                                        : 'El plazo original fue extendido. Clic para ver detalles.'}
                                    </div>
                                    <div className="roadmap-tooltip-dates">
                                      <div>
                                        <strong>Pactado original:</strong> {formatDateShort(project.effectiveOriginalTargetDate)}
                                      </div>
                                      <div style={{ color: '#fbbf24' }}>
                                        <strong>Nueva meta:</strong> {formatDateShort(project.effectiveTargetDate)}
                                      </div>
                                    </div>
                                    <div className="roadmap-tooltip-cta">
                                      🖱️ Clic para ver la justificación técnica
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SECCIÓN INFERIOR: RESUMEN */}
              <section className="portfolio-summary-section">
                <div className="portfolio-summary-header">
                  <div>
                    <p className="eyebrow" style={{ marginBottom: '2px' }}>Métricas & Indicadores</p>
                    <h3 className="portfolio-summary-title">Resumen</h3>
                  </div>
                  <span className="portfolio-summary-badge">
                    Consolidado de {globalKpis.total} proyectos
                  </span>
                </div>

                <div className="portfolio-metrics-grid">
                  <div className="kpi-card">
                    <div className="kpi-card__icon kpi-card__icon--brand">
                      <Icons.Portfolio />
                    </div>
                    <div className="kpi-card__value">{globalKpis.total}</div>
                    <div className="kpi-card__details">
                      <span className="kpi-card__label">Total Proyectos</span>
                      <span className="kpi-card__sub">Activos en el espacio</span>
                    </div>
                  </div>

                  <div className="kpi-card">
                    <div className="kpi-card__icon kpi-card__icon--brand">
                      <Icons.Lead />
                    </div>
                    <div className="kpi-card__value">{globalKpis.leadCount}</div>
                    <div className="kpi-card__details">
                      <span className="kpi-card__label">Soy Encargado</span>
                      <span className="kpi-card__sub">Liderazgo directo</span>
                    </div>
                  </div>

                  <div className="kpi-card">
                    <div className="kpi-card__icon kpi-card__icon--success">
                      <Icons.Collaborator />
                    </div>
                    <div className="kpi-card__value">{globalKpis.collabCount}</div>
                    <div className="kpi-card__details">
                      <span className="kpi-card__label">En Colaboración</span>
                      <span className="kpi-card__sub">Equipo conjunto</span>
                    </div>
                  </div>

                  <div className="kpi-card">
                    <div className="kpi-card__icon kpi-card__icon--danger">
                      <Icons.Alert />
                    </div>
                    <div className="kpi-card__value" style={{ color: globalKpis.totalMyPending > 0 ? 'var(--danger-600)' : 'var(--success-600)' }}>
                      {globalKpis.totalMyPending}
                    </div>
                    <div className="kpi-card__details">
                      <span className="kpi-card__label">Mis Pendientes</span>
                      <span className="kpi-card__sub">Asignados a mí</span>
                    </div>
                  </div>

                  <div className="kpi-card">
                    <div className="kpi-card__icon" style={{ background: 'rgba(168, 85, 247, 0.12)', color: '#c084fc', borderColor: 'rgba(168, 85, 247, 0.35)' }}>
                      <Icons.Vendor />
                    </div>
                    <div className="kpi-card__value" style={{ color: globalKpis.totalVendorPending > 0 ? '#c084fc' : 'var(--ink-500)' }}>
                      {globalKpis.totalVendorPending}
                    </div>
                    <div className="kpi-card__details">
                      <span className="kpi-card__label">En Proveedores</span>
                      <span className="kpi-card__sub">Esperando terceros</span>
                    </div>
                  </div>

                  <div className="kpi-card">
                    <div className="kpi-card__icon kpi-card__icon--warning">
                      <Icons.TargetPulse />
                    </div>
                    <div className="kpi-card__value">{globalKpis.avgProg}%</div>
                    <div className="kpi-card__details">
                      <span className="kpi-card__label">Avance Promedio</span>
                      <span className="kpi-card__sub">Consolidado general</span>
                    </div>
                  </div>
                </div>
              </section>
            </>
          )}

          {/* ======================================================== */}
          {/* 2. VISTA: AGENDA & CALENDARIO                            */}
          {/* ======================================================== */}
          {activeView === 'agenda' && (
            <div className="agenda-shell">
              <div className="page-header">
                <div>
                  <p className="eyebrow">Seguimiento Temporal</p>
                  <h2>Agenda & Calendario</h2>
                </div>
                <div className="header-actions">
                  <button
                    className="ui-btn ui-btn--primary"
                    type="button"
                    onClick={() => openNewTaskModal({ dueDate: todayStr })}
                  >
                    <Icons.Plus /> <span>Agregar Compromiso</span>
                  </button>
                </div>
              </div>

              {/* BARRA DE NAVEGACIÓN TEMPORAL */}
              <div className="agenda-header-bar">
                <div className="segmented-control">
                  <button
                    type="button"
                    className={`segment-btn ${agendaSubView === 'day' ? 'active' : ''}`}
                    onClick={() => setAgendaSubView('day')}
                  >
                    <Icons.Day /> <span>Vista Día (Hoy)</span>
                  </button>
                  <button
                    type="button"
                    className={`segment-btn ${agendaSubView === 'week' ? 'active' : ''}`}
                    onClick={() => setAgendaSubView('week')}
                  >
                    <Icons.Week /> <span>Vista Semana</span>
                  </button>
                  <button
                    type="button"
                    className={`segment-btn ${agendaSubView === 'month' ? 'active' : ''}`}
                    onClick={() => setAgendaSubView('month')}
                  >
                    <Icons.Month /> <span>Calendario Mensual</span>
                  </button>
                </div>

                <div className="filter-group">
                  <span className="filter-label">Mostrar:</span>
                  <button
                    type="button"
                    className={`pill-btn ${agendaFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setAgendaFilter('all')}
                  >
                    Todo el equipo
                  </button>
                  <button
                    type="button"
                    className={`pill-btn ${agendaFilter === 'mine' ? 'active' : ''}`}
                    onClick={() => setAgendaFilter('mine')}
                  >
                    <Icons.User /> <span>Mis pendientes ({globalKpis.totalMyPending})</span>
                  </button>
                  <button
                    type="button"
                    className={`pill-btn ${agendaFilter === 'team' ? 'active' : ''}`}
                    onClick={() => setAgendaFilter('team')}
                  >
                    <Icons.Team /> <span>Colaboradores ({globalKpis.totalTeamPending})</span>
                  </button>
                  <button
                    type="button"
                    className={`pill-btn ${agendaFilter === 'vendor' ? 'active-warning' : ''}`}
                    onClick={() => setAgendaFilter('vendor')}
                  >
                    <Icons.Vendor /> <span>Proveedores / Terceros ({globalKpis.totalVendorPending})</span>
                  </button>
                  <button
                    type="button"
                    className={`pill-btn ${agendaFilter === 'overdue' ? 'active-danger' : ''}`}
                    onClick={() => setAgendaFilter('overdue')}
                  >
                    <Icons.Alert /> <span>Atrasados ({dayViewGroups.overdue.length})</span>
                  </button>
                </div>
              </div>

              {/* SUBVIEW 1: VISTA DÍA */}
              {agendaSubView === 'day' && (
                <div className="day-view-container">
                  {/* ATRASADAS / URGENTES */}
                  {dayViewGroups.overdue.length > 0 && (
                    <section className="day-section">
                      <div className="day-section__title" style={{ color: 'var(--danger-600)' }}>
                        <Icons.Alert />
                        <span>Compromisos Atrasados</span>
                        <span className="day-section__badge day-section__badge--danger">
                          {dayViewGroups.overdue.length}
                        </span>
                      </div>
                      {dayViewGroups.overdue.map((task) => (
                        <div key={task.id} className="task-item-card" style={{ borderColor: 'rgba(248, 113, 113, 0.4)' }}>
                          <div className="task-item-left">
                            <button
                              type="button"
                              className={`quick-check-btn ${task.status === 'done' ? 'checked' : ''}`}
                              onClick={() => toggleTaskStatus(task)}
                              title="Marcar como completada"
                            >
                              {task.status === 'done' ? <Icons.Check /> : null}
                            </button>
                            <div className="task-info-block">
                              <div className="task-meta-top">
                                {task.code && <span className="task-code-badge">{task.code}</span>}
                                <span className="project-tag">{task.projectName}</span>
                                <span className="task-badge">{task.type}</span>
                                <span className="task-priority priority-high">Urgente</span>
                              </div>
                              <span className="task-title">{task.title}</span>
                            </div>
                          </div>

                          <div className="task-item-right">
                            <AssigneeBadge item={task} />
                            <span className="due-date-pill is-overdue">
                              <Icons.Calendar /> {task.dueDate}
                            </span>
                            <button
                              type="button"
                              className="task-action-btn"
                              onClick={() => openEditTaskModal(task)}
                              title="Editar compromiso"
                            >
                              <Icons.Edit />
                            </button>
                          </div>
                        </div>
                      ))}
                    </section>
                  )}

                  {/* PARA HOY */}
                  <section className="day-section">
                    <div className="day-section__title">
                      <Icons.Day />
                      <span>Para Hoy ({todayStr})</span>
                      <span className="day-section__badge day-section__badge--brand">
                        {dayViewGroups.today.length}
                      </span>
                    </div>

                    {dayViewGroups.today.length === 0 ? (
                      <div className="panel-card" style={{ textAlign: 'center', padding: '24px' }}>
                        <p className="muted">No hay entregas programadas específicamente para hoy.</p>
                      </div>
                    ) : (
                      dayViewGroups.today.map((task) => (
                        <div
                          key={task.id}
                          className={`task-item-card ${task.status === 'done' ? 'is-done' : ''}`}
                        >
                          <div className="task-item-left">
                            <button
                              type="button"
                              className={`quick-check-btn ${task.status === 'done' ? 'checked' : ''}`}
                              onClick={() => toggleTaskStatus(task)}
                              title="Marcar como completada"
                            >
                              {task.status === 'done' ? <Icons.Check /> : null}
                            </button>
                            <div className="task-info-block">
                              <div className="task-meta-top">
                                {task.code && <span className="task-code-badge">{task.code}</span>}
                                <span className="project-tag">{task.projectName}</span>
                                <span className="task-badge">{task.type}</span>
                                <span className={`task-priority priority-${task.priority || 'medium'}`}>
                                  {task.priority || 'medium'}
                                </span>
                              </div>
                              <span className="task-title">{task.title}</span>
                            </div>
                          </div>

                          <div className="task-item-right">
                            <AssigneeBadge item={task} />
                            <span className="due-date-pill is-today">Hoy</span>
                            <button
                              type="button"
                              className="task-action-btn"
                              onClick={() => openEditTaskModal(task)}
                              title="Editar compromiso"
                            >
                              <Icons.Edit />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </section>

                  {/* PRÓXIMAS / ACTIVAS */}
                  <section className="day-section">
                    <div className="day-section__title">
                      <Icons.Calendar />
                      <span>Próximas Entregas & Tareas Activas</span>
                      <span className="day-section__badge day-section__badge--neutral">
                        {dayViewGroups.upcoming.length}
                      </span>
                    </div>

                    {dayViewGroups.upcoming.slice(0, 10).map((task) => (
                      <div key={task.id} className="task-item-card">
                        <div className="task-item-left">
                          <button
                            type="button"
                            className="quick-check-btn"
                            onClick={() => toggleTaskStatus(task)}
                            title="Marcar como completada"
                          />
                          <div className="task-info-block">
                            <div className="task-meta-top">
                              {task.code && <span className="task-code-badge">{task.code}</span>}
                              <span className="project-tag">{task.projectName}</span>
                              <span className="task-badge">{task.type}</span>
                            </div>
                            <span className="task-title">{task.title}</span>
                          </div>
                        </div>

                        <div className="task-item-right">
                          <AssigneeBadge item={task} />
                          <span className="due-date-pill">
                            {task.dueDate ? task.dueDate : 'Sin fecha'}
                          </span>
                          <button
                            type="button"
                            className="task-action-btn"
                            onClick={() => openEditTaskModal(task)}
                            title="Editar compromiso"
                          >
                            <Icons.Edit />
                          </button>
                        </div>
                      </div>
                    ))}
                  </section>
                </div>
              )}

              {/* SUBVIEW 2: VISTA SEMANA */}
              {agendaSubView === 'week' && (
                <div className="calendar-card" style={{ padding: 'var(--space-4)' }}>
                  <div className="calendar-nav-bar" style={{ marginBottom: 'var(--space-4)' }}>
                    <div className="cal-nav-actions">
                      <button
                        type="button"
                        className="cal-nav-btn"
                        onClick={handlePrevWeek}
                        title="Ir a la semana anterior"
                      >
                        ‹ Semana Anterior
                      </button>
                      <button
                        type="button"
                        className={`cal-nav-btn ${weekData.isCurrentWeek ? 'active' : ''}`}
                        onClick={handleCurrentWeek}
                        title="Ir a la semana en curso"
                      >
                        Esta Semana
                      </button>
                      <button
                        type="button"
                        className="cal-nav-btn"
                        onClick={handleNextWeek}
                        title="Ir a la semana siguiente"
                      >
                        Semana Siguiente ›
                      </button>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                      <h3 style={{ textTransform: 'capitalize', margin: 0, fontSize: '1.15rem', color: 'var(--ink-900)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>Semana: {weekData.rangeLabel}</span>
                        {weekData.isCurrentWeek && (
                          <span className="stage-count stage-count--info" style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: 'var(--radius-full)', height: 'auto', minWidth: 'auto', fontWeight: 600 }}>
                            Semana en curso
                          </span>
                        )}
                      </h3>

                      <div className="segmented-control" style={{ padding: '2px' }}>
                        <button
                          type="button"
                          className={`segment-btn ${!weekIncludeWeekend ? 'active' : ''}`}
                          onClick={() => setWeekIncludeWeekend(false)}
                          style={{ padding: '3px 10px', fontSize: '0.75rem' }}
                          title="Lunes a Viernes"
                        >
                          5 Días (Laboral)
                        </button>
                        <button
                          type="button"
                          className={`segment-btn ${weekIncludeWeekend ? 'active' : ''}`}
                          onClick={() => setWeekIncludeWeekend(true)}
                          style={{ padding: '3px 10px', fontSize: '0.75rem' }}
                          title="Lunes a Domingo"
                        >
                          7 Días (Completa)
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className={`week-board ${weekIncludeWeekend ? 'cols-7' : 'cols-5'}`}>
                    {weekData.days.map((col) => (
                      <div
                        key={col.dateStr}
                        className={`week-column ${col.isToday ? 'is-today-col' : ''}`}
                      >
                        <div className="week-col-header">
                          <div className="week-day-title">
                            <strong>{col.name}</strong>
                            <small>{col.dayNum} {col.monthStr} {col.isToday ? '· (Hoy)' : ''}</small>
                          </div>
                          <span className={`stage-count ${col.isToday ? 'stage-count--info' : 'stage-count--neutral'}`}>
                            {col.tasks.length}
                          </span>
                        </div>

                        <div className="week-column-cards">
                          {col.tasks.length === 0 ? (
                            <div className="empty-day-placeholder">Sin pendientes</div>
                          ) : (
                            col.tasks.map((task) => (
                              <div
                                key={task.id}
                                className="week-card"
                                onClick={() => toggleTaskStatus(task)}
                                title="Clic para alternar estado completado"
                              >
                                <div className="week-card-top">
                                  {task.code && <span className="task-code-badge" style={{ fontSize: '0.66rem', padding: '0 4px' }}>{task.code}</span>}
                                  <span className="project-tag" style={{ fontSize: '0.68rem' }}>
                                    {task.projectName}
                                  </span>
                                  {task.status === 'done' ? (
                                    <span style={{ color: 'var(--success-600)', fontSize: '0.78rem', fontWeight: 600 }}>✓ Hecho</span>
                                  ) : (
                                    <span className={`task-priority priority-${task.priority || 'medium'}`} style={{ fontSize: '0.65rem' }}>
                                      {task.priority || 'medium'}
                                    </span>
                                  )}
                                </div>

                                <div className="week-card-title">
                                  {task.title}
                                </div>

                                <div className="week-card-footer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                  <AssigneeBadge item={task} />
                                  <button
                                    type="button"
                                    className="task-action-btn"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openEditTaskModal(task);
                                    }}
                                    title="Editar compromiso"
                                  >
                                    <Icons.Edit />
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SUBVIEW 3: VISTA CALENDARIO */}
              {agendaSubView === 'month' && (
                <div className="calendar-view-container">
                  <div className="calendar-card">
                    <div className="calendar-nav-bar">
                      <div className="cal-nav-actions">
                        <button
                          type="button"
                          className="cal-nav-btn"
                          onClick={() => {
                            const prev = new Date(calDate);
                            prev.setMonth(prev.getMonth() - 1);
                            setCalDate(prev);
                          }}
                        >
                          ‹ Mes Anterior
                        </button>
                        <button
                          type="button"
                          className="cal-nav-btn"
                          onClick={() => setCalDate(new Date())}
                        >
                          Hoy
                        </button>
                        <button
                          type="button"
                          className="cal-nav-btn"
                          onClick={() => {
                            const next = new Date(calDate);
                            next.setMonth(next.getMonth() + 1);
                            setCalDate(next);
                          }}
                        >
                          Mes Siguiente ›
                        </button>
                      </div>

                      <h3 style={{ textTransform: 'capitalize' }}>
                        {calendarData.monthName}
                      </h3>
                    </div>

                    <div className="calendar-weekdays-grid">
                      <div>Lun</div>
                      <div>Mar</div>
                      <div>Mié</div>
                      <div>Jue</div>
                      <div>Vie</div>
                      <div>Sáb</div>
                      <div>Dom</div>
                    </div>

                    <div className="calendar-days-grid">
                      {calendarData.cells.map((cell, idx) => (
                        <div
                          key={idx}
                          className={`cal-day-cell ${cell.isCurrentMonth ? '' : 'is-other-month'} ${cell.isToday ? 'is-today' : ''} ${selectedCalDay === cell.dateStr ? 'is-selected' : ''}`}
                          onClick={() => setSelectedCalDay(cell.dateStr)}
                        >
                          <div className="cal-day-top">
                            <span className="cal-day-num">{cell.dayNum}</span>
                            {cell.tasks.length > 0 && (
                              <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--brand-300)' }}>
                                {cell.tasks.length}
                              </span>
                            )}
                          </div>

                          <div className="cal-events-list">
                            {cell.tasks.slice(0, 2).map((t) => (
                              <div
                                key={t.id}
                                className={`cal-event-pill ${t.assignee === 'Jorge' ? 'is-mine' : ''}`}
                                title={`${t.projectName}: ${t.title} (${t.assignee})`}
                              >
                                {t.title}
                              </div>
                            ))}
                            {cell.tasks.length > 2 && (
                              <div className="cal-more-pill">
                                +{cell.tasks.length - 2} más
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* INSPECTOR LATERAL DEL DÍA SELECCIONADO */}
                  <div className="selected-day-panel">
                    <div className="selected-day-header">
                      <div>
                        <p className="eyebrow small">Día Seleccionado</p>
                        <h4>{selectedCalDay}</h4>
                      </div>
                      <button
                        className="ui-btn ui-btn--primary ui-btn--small"
                        type="button"
                        onClick={() => openNewTaskModal({ dueDate: selectedCalDay })}
                      >
                        <Icons.Plus /> <span>Tarea</span>
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {selectedDayTasks.length === 0 ? (
                        <p className="muted" style={{ fontSize: '0.85rem', padding: '12px 0' }}>
                          Sin entregas programadas para esta fecha.
                        </p>
                      ) : (
                        selectedDayTasks.map((task) => (
                          <div key={task.id} className="task-item-card" style={{ padding: '8px 12px' }}>
                            <div className="task-item-left">
                              <button
                                type="button"
                                className={`quick-check-btn ${task.status === 'done' ? 'checked' : ''}`}
                                onClick={() => toggleTaskStatus(task)}
                              >
                                {task.status === 'done' ? <Icons.Check /> : null}
                              </button>
                              <div className="task-info-block">
                                <span className="project-tag" style={{ fontSize: '0.65rem' }}>{task.projectName}</span>
                                <span className="task-title" style={{ fontSize: '0.88rem' }}>{task.title}</span>
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <AssigneeBadge item={task} />
                              <button
                                type="button"
                                className="task-action-btn"
                                onClick={() => openEditTaskModal(task)}
                                title="Editar compromiso"
                              >
                                <Icons.Edit />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* 3. VISTA: TABLERO KANBAN                                 */}
          {/* ======================================================== */}
          {activeView === 'kanban' && (
            <>
              <div className="page-header">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <button
                      type="button"
                      className="kanban-back-link"
                      onClick={() => handleReturnToProjects(selectedProjectId)}
                      title="Regresar a Mis Proyectos y enfocar este proyecto"
                    >
                      <Icons.ArrowLeft />
                      <span>Volver a Mis Proyectos</span>
                    </button>
                  </div>
                  <p className="eyebrow">
                    Tablero Operativo {(() => {
                      const activeProj = projects.find((p) => p.id === selectedProjectId);
                      return activeProj ? `• ${activeProj.name}` : '';
                    })()}
                  </p>
                  <h2>Kanban de Trabajo</h2>
                </div>
                <div className="header-actions">
                  <button
                    type="button"
                    className="ui-btn ui-btn--secondary back-to-projects-btn"
                    onClick={() => handleReturnToProjects(selectedProjectId)}
                    title="Regresar a Mis Proyectos y enfocar este proyecto"
                  >
                    <Icons.ArrowLeft />
                    <span>Volver a Mis Proyectos</span>
                  </button>
                  <button
                    className="ui-btn ui-btn--primary"
                    type="button"
                    onClick={() => openNewTaskModal({ projectId: selectedProjectId })}
                  >
                    <Icons.Plus /> <span>Nueva Tarea</span>
                  </button>
                </div>
              </div>

              <div className="portfolio-toolbar">
                <div className="filter-group">
                  <span className="filter-label">Proyecto activo:</span>
                  <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    style={{ minWidth: '240px', fontWeight: 600 }}
                  >
                    {projects.map((proj) => (
                      <option key={proj.id} value={proj.id}>
                        {proj.code ? `[${proj.code}] ` : ''}{proj.name} ({proj.role === 'lead' ? 'Encargado' : 'Colaborador'})
                      </option>
                    ))}
                  </select>

                  {(() => {
                    const activeProj = projects.find((p) => p.id === selectedProjectId) || projects[0];
                    if (!activeProj) return null;
                    const membersCount = activeProj.teamMembers?.length || (activeProj.admins?.length || 1) + (activeProj.members?.length || 0);
                    return (
                      <button
                        type="button"
                        className="ui-btn ui-btn--secondary ui-btn--small"
                        onClick={() => openTeamModal(activeProj)}
                        title="Gestionar Administradores, Colaboradores y Terceros de este proyecto"
                      >
                        <Icons.Team />
                        <span>Equipo & Roles ({membersCount})</span>
                      </button>
                    );
                  })()}

                  {(() => {
                    const activeProj = projects.find((p) => p.id === selectedProjectId) || projects[0];
                    const doneCount = workItems.filter((w) => w.projectId === (activeProj ? activeProj.id : '') && w.status === 'done').length;
                    return (
                      <button
                        type="button"
                        className="ui-btn ui-btn--secondary ui-btn--small"
                        onClick={() => setIsDoneReportModalOpen(true)}
                        title="Ver reporte ejecutivo de tareas realizadas, entregables y continuaciones"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      >
                        <Icons.Tasks />
                        <span>Reporte de Hechos ({doneCount})</span>
                      </button>
                    );
                  })()}
                </div>

                <div className="filter-group">
                  <span className="filter-label">Filtrar tareas:</span>
                  <button
                    type="button"
                    className={`pill-btn ${agendaFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setAgendaFilter('all')}
                  >
                    Todas
                  </button>
                  <button
                    type="button"
                    className={`pill-btn ${agendaFilter === 'mine' ? 'active' : ''}`}
                    onClick={() => setAgendaFilter('mine')}
                  >
                    <Icons.User /> <span>Solo mías</span>
                  </button>
                  <button
                    type="button"
                    className={`pill-btn ${agendaFilter === 'team' ? 'active' : ''}`}
                    onClick={() => setAgendaFilter('team')}
                  >
                    <Icons.Team /> <span>Equipo</span>
                  </button>
                  <button
                    type="button"
                    className={`pill-btn ${agendaFilter === 'vendor' ? 'active-warning' : ''}`}
                    onClick={() => setAgendaFilter('vendor')}
                  >
                    <Icons.Vendor /> <span>Proveedores / Terceros</span>
                  </button>
                </div>
              </div>

              <div className="kanban-board">
                {laneOrder.map((lane) => {
                  const laneTasks = workItems.filter(
                    (item) => {
                      if (item.projectId !== selectedProjectId || item.status !== lane.key) return false;
                      const list = getTaskAssignees(item);
                      const isMine = list.some(isAssigneeMine);
                      const isTeam = list.some((a) => !isAssigneeMine(a) && !isAssigneeVendor(a, item));
                      const isVendor = list.some((a) => isAssigneeVendor(a, item));

                      if (agendaFilter === 'mine') return isMine;
                      if (agendaFilter === 'team') return isTeam;
                      if (agendaFilter === 'vendor') return isVendor;
                      return true;
                    }
                  );

                  return (
                    <div key={lane.key} className="kanban-lane">
                      <div className="lane-header">
                        <h4>{lane.label}</h4>
                        <span>{laneTasks.length}</span>
                      </div>

                      <div className="lane-cards">
                        {laneTasks.length === 0 ? (
                          <div className="kanban-empty">Sin tareas</div>
                        ) : (
                          laneTasks.map((item) => (
                            <div key={item.id} className="kanban-card">
                              <div className="task-topline">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  {item.code && <span className="task-code-badge">{item.code}</span>}
                                  <span className="task-badge">{item.type}</span>
                                  <span className={`task-priority priority-${item.priority || 'medium'}`}>
                                    {item.priority || 'medium'}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  className="card-edit-btn"
                                  onClick={() => openEditTaskModal(item)}
                                  title="Editar tarea"
                                >
                                  <Icons.Edit />
                                </button>
                              </div>

                              <strong
                                onClick={() => openEditTaskModal(item)}
                                style={{ cursor: 'pointer' }}
                                title="Clic para editar tarea"
                              >
                                {item.title}
                              </strong>
                              <p>{item.description || 'Sin descripción'}</p>

                              {item.status === 'done' && (
                                <div
                                  className={`kanban-completion-badge ${item.completionType === 'partial' ? 'is-partial' : 'is-full'}`}
                                  onClick={() => openEditTaskModal(item)}
                                  title="Clic para ver o editar el reporte de lo realizado"
                                >
                                  {item.completionType === 'partial' ? (
                                    <>
                                      <span className="completion-tag partial">⚠️ Continuada</span>
                                      <span className="completion-snippet">
                                        {item.completionReport || 'Clic para detallar por qué se continuó'}
                                      </span>
                                    </>
                                  ) : (
                                    <>
                                      <span className="completion-tag full">✓ Hecho</span>
                                      <span className="completion-snippet">
                                        {item.completionReport || 'Clic para reportar qué se hizo'}
                                      </span>
                                    </>
                                  )}
                                </div>
                              )}

                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                                <AssigneeBadge item={item} />

                                {item.dueDate && (
                                  <span className={`due-date-pill ${item.dueDate < todayStr && item.status !== 'done' ? 'is-overdue' : ''}`}>
                                    <Icons.Calendar /> {item.dueDate}
                                  </span>
                                )}
                              </div>

                              {Array.isArray(item.progressLogs) && item.progressLogs.length > 0 && (
                                <div
                                  className="task-progress-count-badge"
                                  onClick={() => openEditTaskModal(item)}
                                  title={`Ver bitácora de avances (${item.progressLogs.length} registros)`}
                                >
                                  <Icons.History />
                                  <span>{item.progressLogs.length} {item.progressLogs.length === 1 ? 'avance' : 'avances'}</span>
                                  {item.progressLogs[item.progressLogs.length - 1]?.text && (
                                    <span className="task-progress-latest-snippet">
                                      · {item.progressLogs[item.progressLogs.length - 1].text}
                                    </span>
                                  )}
                                </div>
                              )}

                              <div className="task-meta">
                                <small style={{ color: 'var(--ink-500)', fontSize: '0.75rem' }}>Mover a:</small>
                                <select
                                  value={item.status}
                                  onChange={(e) => changeTaskStatus(item.id, e.target.value)}
                                  aria-label="Cambiar estado de tarea"
                                >
                                  {laneOrder.map((option) => (
                                    <option key={option.key} value={option.key}>
                                      {option.label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {activeView === 'directory' && (
            <>
              {/* HEADER DEL DIRECTORIO */}
              <div className="directory-header-section">
                <div>
                  <h1 className="portfolio-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Icons.UsersGear />
                    <span>Directorio de Equipo & Terceros</span>
                  </h1>
                  <p className="portfolio-subtitle">
                    Gestión centralizada de Administradores, Colaboradores y Proveedores reutilizables en todos los proyectos de TI.
                  </p>
                </div>
                <div>
                  <button
                    type="button"
                    className="ui-btn ui-btn--primary"
                    onClick={() => setIsNewDirectoryModalOpen(true)}
                  >
                    + Registrar Integrante / Tercero
                  </button>
                </div>
              </div>

              {/* BARRA DE HERRAMIENTAS: FILTROS POR ROL Y BUSCADOR */}
              <div className="directory-toolbar-stack">
                {/* FILA 1: BOTONES CON ÍCONO MÁS GRANDE Y TEXTO EN UNA SOLA LÍNEA */}
                <div className="directory-filter-row" role="group" aria-label="Filtrar por rol">
                  <button
                    type="button"
                    className={`dir-filter-tab ${directoryRoleFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setDirectoryRoleFilter('all')}
                  >
                    <Icons.UsersGear />
                    <span>Todos</span>
                  </button>

                  <button
                    type="button"
                    className={`dir-filter-tab ${directoryRoleFilter === 'admin' ? 'active' : ''}`}
                    onClick={() => setDirectoryRoleFilter('admin')}
                  >
                    <Icons.ShieldAdmin />
                    <span>Administradores</span>
                  </button>

                  <button
                    type="button"
                    className={`dir-filter-tab ${directoryRoleFilter === 'collaborator' ? 'active' : ''}`}
                    onClick={() => setDirectoryRoleFilter('collaborator')}
                  >
                    <Icons.Collaborator />
                    <span>Colaboradores</span>
                  </button>

                  <button
                    type="button"
                    className={`dir-filter-tab ${directoryRoleFilter === 'vendor' ? 'active' : ''}`}
                    onClick={() => setDirectoryRoleFilter('vendor')}
                  >
                    <Icons.Vendor />
                    <span>Proveedores / Terceros</span>
                  </button>
                </div>

                {/* FILA 2: BARRA DE BÚSQUEDA CON LUPA */}
                <div className="directory-search-row">
                  <div className="directory-search-box">
                    <span className="directory-search-icon" aria-hidden="true">
                      <Icons.Search />
                    </span>
                    <input
                      type="text"
                      placeholder="Buscar por nombre, entidad u organización..."
                      value={directorySearch}
                      onChange={(e) => setDirectorySearch(e.target.value)}
                      className="directory-search-input"
                    />
                    {directorySearch && (
                      <button
                        type="button"
                        className="directory-search-clear"
                        onClick={() => setDirectorySearch('')}
                        title="Limpiar búsqueda"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* GRID DE INTEGRANTES */}
              {(() => {
                const searchLower = directorySearch.toLowerCase().trim();
                const filteredMembers = teamDirectory.filter((member) => {
                  if (directoryRoleFilter !== 'all' && member.role !== directoryRoleFilter) {
                    return false;
                  }
                  if (searchLower) {
                    const matchName = member.name.toLowerCase().includes(searchLower);
                    const matchEmail = (member.email || '').toLowerCase().includes(searchLower);
                    const matchOrg = (member.organization || '').toLowerCase().includes(searchLower);
                    const matchPhone = (member.phone || '').toLowerCase().includes(searchLower);
                    return matchName || matchEmail || matchOrg || matchPhone;
                  }
                  return true;
                });

                if (filteredMembers.length === 0) {
                  return (
                    <div className="directory-empty-state">
                      <Icons.UsersGear />
                      <h3>No se encontraron integrantes</h3>
                      <p>Intenta ajustar el filtro de búsqueda o registra un nuevo integrante o tercero.</p>
                      <button
                        type="button"
                        className="ui-btn ui-btn--primary"
                        onClick={() => setIsNewDirectoryModalOpen(true)}
                        style={{ marginTop: '12px' }}
                      >
                        + Registrar Integrante
                      </button>
                    </div>
                  );
                }

                return (
                  <div className="directory-grid">
                    {filteredMembers.map((member) => {
                      const targetName = member.name.trim().toLowerCase();
                      const assignedTasks = workItems.filter((w) => {
                        if (Array.isArray(w.assignees) && w.assignees.length > 0) {
                          return w.assignees.some((a) => a && a.trim().toLowerCase() === targetName);
                        }
                        if (typeof w.assignee === 'string' && w.assignee.trim()) {
                          return w.assignee.split(',').map((s) => s.trim().toLowerCase()).includes(targetName);
                        }
                        return false;
                      });

                      const roleLabel =
                        member.role === 'admin'
                          ? 'Administrador'
                          : member.role === 'vendor'
                          ? 'Proveedor / Tercero'
                          : 'Colaborador';

                      const roleClass =
                        member.role === 'admin'
                          ? 'dir-role--admin'
                          : member.role === 'vendor'
                          ? 'dir-role--vendor'
                          : 'dir-role--collab';

                      return (
                        <div key={member.id} className="directory-card">
                          <div className="directory-card__header">
                            <div className="directory-card__avatar-wrap">
                              <div className={`directory-card__avatar ${roleClass}`}>
                                {member.role === 'admin' ? (
                                  <Icons.ShieldAdmin />
                                ) : member.role === 'vendor' ? (
                                  <Icons.Vendor />
                                ) : (
                                  member.name.charAt(0).toUpperCase()
                                )}
                              </div>
                              <div className="directory-card__main-info">
                                <h3 className="directory-card__name">{member.name}</h3>
                                {member.organization && (
                                  <span className="directory-card__org">{member.organization}</span>
                                )}
                              </div>
                            </div>

                            <span className={`directory-role-badge ${roleClass}`}>
                              {roleLabel}
                            </span>
                          </div>

                          <div className="directory-card__body">
                            {member.email && (
                              <div className="directory-contact-row">
                                <span className="contact-label">Email:</span>
                                <span className="contact-val" title={member.email}>{member.email}</span>
                              </div>
                            )}
                            {member.phone && (
                              <div className="directory-contact-row">
                                <span className="contact-label">Contacto:</span>
                                <span className="contact-val">{member.phone}</span>
                              </div>
                            )}

                            <div className="directory-status-row">
                              {assignedTasks.length > 0 ? (
                                <span className="directory-status-pill directory-status-pill--assigned" title={`Asignado a ${assignedTasks.length} tarea(s)`}>
                                  <Icons.Check /> {assignedTasks.length} tarea{assignedTasks.length !== 1 ? 's' : ''} asignada{assignedTasks.length !== 1 ? 's' : ''}
                                </span>
                              ) : (
                                <span className="directory-status-pill directory-status-pill--free">
                                  Sin tareas asignadas
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="directory-card__footer">
                            <button
                              type="button"
                              className="ui-btn ui-btn--secondary ui-btn--small"
                              onClick={() => {
                                setEditingDirectoryMember(member);
                                setEditDirectoryForm({
                                  name: member.name,
                                  role: member.role || 'collaborator',
                                  organization: member.organization || '',
                                  email: member.email || '',
                                  phone: member.phone || ''
                                });
                              }}
                              title="Editar datos del integrante"
                            >
                              <Icons.Edit /> <span>Editar</span>
                            </button>

                            <button
                              type="button"
                              className="ui-btn ui-btn--danger ui-btn--small"
                              onClick={() => requestDeleteDirectoryMember(member)}
                              title="Eliminar del directorio"
                            >
                              <Icons.Trash /> <span>Eliminar</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </>
          )}
        </main>
      </div>

      {/* MODAL: NUEVO PROYECTO */}
      {isNewProjectModalOpen && (
        <div className="modal-overlay" onClick={() => setIsNewProjectModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <img src="/logobase01.png" alt="" style={{ width: '22px', height: '22px', borderRadius: '5px', objectFit: 'contain' }} />
                <span>Crear Nuevo Proyecto</span>
              </h3>
              <button className="close-btn modal-close-btn" onClick={() => setIsNewProjectModalOpen(false)} aria-label="Cerrar ventana" title="Cerrar">
                <Icons.Close />
              </button>
            </div>

            <form onSubmit={handleCreateProject} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-field">
                <label>Nombre del proyecto *</label>
                <input
                  type="text"
                  value={projectForm.name}
                  onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                  placeholder="Ej. Migración CRM o Arquitectura Core"
                  required
                />
              </div>

              <div className="form-field">
                <label>Descripción</label>
                <textarea
                  rows="2"
                  value={projectForm.description}
                  onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                  placeholder="Objetivo principal del proyecto"
                />
              </div>

              <div className="form-grid-2">
                <div className="form-field">
                  <label>Mi Rol en el proyecto</label>
                  <select
                    value={projectForm.role}
                    onChange={(e) => setProjectForm({ ...projectForm, role: e.target.value })}
                  >
                    <option value="lead">Soy el Encargado (Líder)</option>
                    <option value="collaborator">Soy Colaborador</option>
                  </select>
                </div>

                <div className="form-field">
                  <label>Metodología</label>
                  <select
                    value={projectForm.template}
                    onChange={(e) => setProjectForm({ ...projectForm, template: e.target.value })}
                  >
                    <option value="kanban">Kanban</option>
                    <option value="scrum">Scrum</option>
                    <option value="pmi">PMI (Tradicional)</option>
                    <option value="custom">Personalizada</option>
                  </select>
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-field">
                  <label>Administradores (separados por coma) *</label>
                  <input
                    type="text"
                    value={projectForm.admins}
                    onChange={(e) => setProjectForm({ ...projectForm, admins: e.target.value })}
                    placeholder="Ej. Jorge, Carlos Gómez"
                    required
                  />
                  <small className="muted" style={{ fontSize: '0.72rem' }}>Tienen control de metas y alcance</small>
                </div>

                <div className="form-field">
                  <label>Equipo / Proveedores / Terceros</label>
                  <input
                    type="text"
                    value={projectForm.members}
                    onChange={(e) => setProjectForm({ ...projectForm, members: e.target.value })}
                    placeholder="Ej. Lucía, Proveedor AWS, Soporte Dell"
                  />
                  <small className="muted" style={{ fontSize: '0.72rem' }}>Colaboradores o terceros involucrados</small>
                </div>
              </div>

              <div className="form-field">
                <label>Etapa inicial</label>
                <select
                  value={projectForm.status}
                  onChange={(e) => setProjectForm({ ...projectForm, status: e.target.value })}
                >
                  {projectStages.map((st) => (
                    <option key={st.key} value={st.key}>{st.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-grid-2">
                <div className="form-field">
                  <label>Fecha de inicio</label>
                  <input
                    type="date"
                    value={projectForm.startDate}
                    onChange={(e) => setProjectForm({ ...projectForm, startDate: e.target.value })}
                  />
                  <small className="muted" style={{ fontSize: '0.72rem' }}>Día de arranque del proyecto</small>
                </div>

                <div className="form-field">
                  <label>Fecha meta / finalización</label>
                  <input
                    type="date"
                    value={projectForm.targetDate}
                    onChange={(e) => setProjectForm({ ...projectForm, targetDate: e.target.value })}
                  />
                  <small className="muted" style={{ fontSize: '0.72rem' }}>Compromiso pactado de entrega</small>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  className="ui-btn ui-btn--secondary"
                  onClick={() => setIsNewProjectModalOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="ui-btn ui-btn--primary">
                  Guardar Proyecto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NUEVA TAREA */}
      {isNewTaskModalOpen && (
        <div className="modal-overlay" onClick={() => setIsNewTaskModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <img src="/logobase01.png" alt="" style={{ width: '22px', height: '22px', borderRadius: '5px', objectFit: 'contain' }} />
                <span>Agregar Tarea o Compromiso</span>
              </h3>
              <button className="close-btn modal-close-btn" onClick={() => setIsNewTaskModalOpen(false)} aria-label="Cerrar ventana" title="Cerrar">
                <Icons.Close />
              </button>
            </div>

            <form onSubmit={handleCreateTask} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-field">
                <label>Proyecto asociado *</label>
                <select
                  value={taskForm.projectId || selectedProjectId}
                  onChange={(e) => setTaskForm({ ...taskForm, projectId: e.target.value })}
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
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  placeholder="Ej. Revisar contrato de hosting"
                  required
                />
              </div>

              <TaskAssigneesSelector
                projectId={taskForm.projectId || selectedProjectId}
                projects={projects}
                teamDirectory={teamDirectory}
                selectedAssignees={taskForm.assignees || ['Jorge']}
                onChangeAssignees={(newAssignees) => {
                  setTaskForm((prev) => ({
                    ...prev,
                    assignees: newAssignees,
                    assignee: newAssignees.join(', '),
                    assigneeType: newAssignees.some(isAssigneeMine) ? 'me' : (newAssignees.some(a => isAssigneeVendor(a)) ? 'vendor' : 'team')
                  }));
                }}
                onOpenNewDirectoryModal={() => setIsNewDirectoryModalOpen(true)}
              />

              <div className="form-grid-3">
                <div className="form-field">
                  <label>Fecha de entrega / límite</label>
                  <input
                    type="date"
                    value={taskForm.dueDate}
                    onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                  />
                </div>

                <div className="form-field">
                  <label>Tipo</label>
                  <select
                    value={taskForm.type}
                    onChange={(e) => setTaskForm({ ...taskForm, type: e.target.value })}
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
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                  >
                    <option value="low">Baja</option>
                    <option value="medium">Media</option>
                    <option value="high">Alta / Urgente</option>
                  </select>
                </div>
              </div>

              <div className="modal-actions" style={{ justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  className="ui-btn ui-btn--secondary"
                  onClick={() => setIsNewTaskModalOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="ui-btn ui-btn--primary">
                  Guardar Tarea
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR TAREA */}
      {isEditTaskModalOpen && editingTask && (
        <div className="modal-overlay" onClick={() => setIsEditTaskModalOpen(false)}>
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
              />

              <div className="form-grid-2">
                <div className="form-field">
                  <label>Fecha de entrega / límite</label>
                  <input
                    type="date"
                    value={editTaskForm.dueDate}
                    onChange={(e) => setEditTaskForm({ ...editTaskForm, dueDate: e.target.value })}
                  />
                </div>

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

      {/* MODAL: REPORTE DE TAREAS HECHAS Y CUMPLIMIENTO */}
      {isDoneReportModalOpen && (
        <div className="modal-overlay" onClick={() => setIsDoneReportModalOpen(false)}>
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
        <div className="modal-overlay" onClick={() => setTaskToDelete(null)}>
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
        <div className="modal-overlay" onClick={() => setProjectToDelete(null)}>
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

      {/* MODAL EDITAR PROYECTO */}
      {editingProject && (
        <div className="modal-overlay" onClick={() => setEditingProject(null)}>
          <div className="modal-card" style={{ maxWidth: '580px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Icons.Edit />
                <span>Editar Proyecto</span>
              </h3>
              <button
                className="close-btn modal-close-btn"
                onClick={() => setEditingProject(null)}
                aria-label="Cerrar ventana"
                title="Cerrar"
              >
                <Icons.Close />
              </button>
            </div>

            <form onSubmit={handleSaveEditProject} style={{ display: 'grid', gap: '14px', marginTop: '4px' }}>
              <div className="form-field">
                <label>Nombre del proyecto *</label>
                <input
                  type="text"
                  required
                  value={editProjectForm.name}
                  onChange={(e) => setEditProjectForm({ ...editProjectForm, name: e.target.value })}
                  placeholder="Nombre identificador del proyecto"
                />
              </div>

              <div className="form-field">
                <label>Descripción</label>
                <textarea
                  rows={3}
                  value={editProjectForm.description}
                  onChange={(e) => setEditProjectForm({ ...editProjectForm, description: e.target.value })}
                  placeholder="Objetivos o alcance del proyecto..."
                />
              </div>

              <div className="form-grid-3">
                <div className="form-field">
                  <label>Mi Rol</label>
                  <select
                    value={editProjectForm.role}
                    onChange={(e) => setEditProjectForm({ ...editProjectForm, role: e.target.value })}
                  >
                    <option value="lead">Encargado (Líder)</option>
                    <option value="collaborator">Colaborador</option>
                  </select>
                </div>

                <div className="form-field">
                  <label>Etapa / Estado</label>
                  <select
                    value={editProjectForm.status}
                    onChange={(e) => setEditProjectForm({ ...editProjectForm, status: e.target.value })}
                  >
                    {projectStages.map((st) => (
                      <option key={st.key} value={st.key}>{st.label}</option>
                    ))}
                  </select>
                </div>

                <div className="form-field">
                  <label>Metodología</label>
                  <select
                    value={editProjectForm.template}
                    onChange={(e) => setEditProjectForm({ ...editProjectForm, template: e.target.value })}
                  >
                    <option value="kanban">Kanban</option>
                    <option value="scrum">Scrum</option>
                    <option value="pmi">PMI Tradicional</option>
                    <option value="custom">Personalizada</option>
                  </select>
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-field">
                  <label>Fecha de inicio</label>
                  <input
                    type="date"
                    value={editProjectForm.startDate}
                    onChange={(e) => setEditProjectForm({ ...editProjectForm, startDate: e.target.value })}
                  />
                  <small className="muted" style={{ fontSize: '0.72rem' }}>Día de arranque del proyecto</small>
                </div>

                <div className="form-field">
                  <label>Fecha meta / finalización</label>
                  <input
                    type="date"
                    value={editProjectForm.targetDate}
                    onChange={(e) => setEditProjectForm({ ...editProjectForm, targetDate: e.target.value })}
                  />
                  <small className="muted" style={{ fontSize: '0.72rem' }}>Compromiso pactado de entrega</small>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  className="ui-btn ui-btn--secondary"
                  onClick={() => setEditingProject(null)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="ui-btn ui-btn--primary"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: GESTIÓN DE EQUIPO, ADMINISTRADORES, COLABORADORES Y TERCEROS */}
      {isTeamModalOpen && managingProject && (
        <div className="modal-overlay" onClick={() => setIsTeamModalOpen(false)}>
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
        <div className="modal-overlay" style={{ zIndex: 1200 }} onClick={() => setIsNewDirectoryModalOpen(false)}>
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
                  <label>Organización / Departamento</label>
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
                  <label>Correo Electrónico</label>
                  <input
                    type="email"
                    value={newDirectoryForm.email}
                    onChange={(e) => setNewDirectoryForm({ ...newDirectoryForm, email: e.target.value })}
                    placeholder="ejemplo@empresa.com"
                  />
                </div>

                <div className="form-field">
                  <label>Teléfono / Contacto</label>
                  <input
                    type="text"
                    value={newDirectoryForm.phone}
                    onChange={(e) => setNewDirectoryForm({ ...newDirectoryForm, phone: e.target.value })}
                    placeholder="Ej. +506 8888-0000"
                  />
                </div>
              </div>

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
        <div className="modal-overlay" onClick={() => setEditingDirectoryMember(null)}>
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
        <div className="modal-overlay" onClick={() => setDirectoryMemberToDelete(null)}>
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
        <div className="modal-overlay" onClick={() => setDeletionBlockModal(null)}>
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

      {/* MODAL 1: JUSTIFICACIÓN DE CAMBIO DE FECHA / PRÓRROGA */}
      {justificationModalProject && (
        <div className="modal-overlay" onClick={() => setJustificationModalProject(null)}>
          <div className="modal-card" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
            <div
              className="modal-header"
              style={{
                background: 'linear-gradient(90deg, rgba(245, 158, 11, 0.15), rgba(15, 23, 42, 0.6))',
                borderBottom: '1px solid rgba(245, 158, 11, 0.35)'
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
        <div className="modal-overlay" onClick={() => setNewExtensionModalProject(null)}>
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
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
