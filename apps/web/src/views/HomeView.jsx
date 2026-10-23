import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useBreakpoint } from '../hooks/useBreakpoint';
import { Icons } from '../components/layout/NavIcons';

export function HomeView({
  projects = [],
  workItems = [],
  currentUser = null,
  todayStr = '',
  space = 'all',
  onSpaceChange,
  onSelectProject,
  onNavigate,
  onOpenNewProject,
  onOpenNewTask,
  onOpenDailyCheckin,
  onSubmitProgress,
  onUpdateWorkItem,
  onEditTask
}) {
  const bp = useBreakpoint();
  const isMobile = bp === 'mobile';
  const isTablet = bp === 'tablet';

  // Estados interactivos
  const [projectRadarFilter, setProjectRadarFilter] = useState('all'); // 'all' | 'overdue' | 'ontrack' | 'completed'
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [exportTheme, setExportTheme] = useState('dark'); // 'dark' | 'light'
  const [toastMessage, setToastMessage] = useState(null);

  const activeUserName = currentUser?.name || 'Jorge';
  const activeUserRole = currentUser?.role === 'owner' || currentUser?.role === 'admin' ? 'Administrador / Lead' : 'Colaborador';

  // 1. Filtrado de proyectos por espacio seleccionado
  const filteredProjects = useMemo(() => {
    if (space === 'all') return projects;
    return projects.filter((p) => (p.space || 'work') === space);
  }, [projects, space]);

  const projectMap = useMemo(() => {
    const map = new Map();
    filteredProjects.forEach((p) => map.set(p.id, p));
    return map;
  }, [filteredProjects]);

  // 2. Tareas pertenecientes a los proyectos en el espacio activo
  const filteredTasks = useMemo(() => {
    return workItems.filter((w) => projectMap.has(w.projectId));
  }, [workItems, projectMap]);

  // 3. Salud y métricas globales del Portafolio («Así vamos»)
  const portfolioHealth = useMemo(() => {
    const totalProjects = filteredProjects.length;
    const active = filteredProjects.filter((p) => p.status !== 'completed' && p.status !== 'discarded');
    
    // Distribución por Etapas
    const execution = filteredProjects.filter((p) => p.status === 'execution' || p.status === 'in_progress').length;
    const review = filteredProjects.filter((p) => p.status === 'review').length;
    const completed = filteredProjects.filter((p) => p.status === 'completed').length;
    const backlog = filteredProjects.filter((p) => p.status === 'draft' || p.status === 'backlog' || p.status === 'planning').length;

    const executionPct = totalProjects > 0 ? Math.round((execution / totalProjects) * 100) : 0;
    const reviewPct = totalProjects > 0 ? Math.round((review / totalProjects) * 100) : 0;
    const completedPct = totalProjects > 0 ? Math.round((completed / totalProjects) * 100) : 0;
    const backlogPct = totalProjects > 0 ? Math.round((backlog / totalProjects) * 100) : 0;

    // Avance global ponderado de tareas
    const totalTasks = filteredTasks.length;
    const doneTasks = filteredTasks.filter((t) => t.status === 'done').length;
    const inProgressTasks = filteredTasks.filter((t) => t.status !== 'done').length;

    const globalProgress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

    let healthStatus = 'healthy';
    let healthLabel = 'En Ritmo Óptimo';
    if (globalProgress < 40) {
      healthStatus = 'critical';
      healthLabel = 'En Riesgo Crítico';
    } else if (globalProgress < 75) {
      healthStatus = 'attention';
      healthLabel = 'En Observación';
    }

    return {
      totalProjects,
      totalActive: active.length,
      globalProgress,
      healthStatus,
      healthLabel,
      totalTasks,
      doneTasks,
      inProgressTasks,
      stages: {
        execution,
        executionPct,
        review,
        reviewPct,
        completed,
        completedPct,
        backlog,
        backlogPct
      }
    };
  }, [filteredProjects, filteredTasks]);

  // 4. Radar de tareas en riesgo
  const taskRisks = useMemo(() => {
    const nowMs = new Date(todayStr || new Date().toISOString().split('T')[0]).getTime();
    const activeTasks = filteredTasks.filter((t) => t.status !== 'done');

    const overdue = activeTasks.filter((t) => {
      const due = t.dueDate || t.targetDate;
      if (!due) return false;
      return new Date(due).getTime() < nowMs;
    });

    return {
      overdue,
      overdueCount: overdue.length
    };
  }, [filteredTasks, todayStr]);

  // 5. Radiografía de Proyectos con semáforos individuales
  const projectsListWithHealth = useMemo(() => {
    const nowMs = new Date(todayStr || new Date().toISOString().split('T')[0]).getTime();

    return filteredProjects.map((p) => {
      const isCompleted = p.status === 'completed';
      const hasExtension = Boolean(
        (Array.isArray(p.dateExtensions) && p.dateExtensions.length > 0) ||
        (p.originalTargetDate && p.targetDate && p.originalTargetDate < p.targetDate)
      );

      let isOverdue = false;
      let daysOverdue = 0;
      let daysLeft = null;

      if (!isCompleted && p.targetDate) {
        const targetMs = new Date(p.targetDate + 'T12:00:00').getTime();
        const diffDays = Math.round((targetMs - nowMs) / (1000 * 60 * 60 * 24));
        if (diffDays < 0) {
          isOverdue = true;
          daysOverdue = Math.abs(diffDays);
        } else {
          daysLeft = diffDays;
        }
      }

      let statusType = 'ontrack';
      let statusLabel = '✓ En fecha';

      if (isCompleted) {
        statusType = 'completed';
        statusLabel = '✓ Finalizado';
      } else if (isOverdue) {
        statusType = 'overdue';
        statusLabel = `⚠️ ${daysOverdue}d atraso`;
      } else if (hasExtension) {
        statusType = 'extension';
        statusLabel = '📅 Prórroga';
      } else if (daysLeft !== null) {
        statusType = 'ontrack';
        statusLabel = daysLeft <= 7 ? `✓ Quedan ${daysLeft}d` : `✓ En fecha (${daysLeft}d)`;
      }

      // Nombre de etapa
      const stageName =
        p.status === 'completed'
          ? 'Finalizado'
          : p.status === 'review'
          ? 'En Revisión'
          : p.status === 'execution' || p.status === 'in_progress'
          ? 'En Ejecución'
          : 'Preproyecto';

      const stageColor =
        p.status === 'completed'
          ? '#4C8A45'
          : p.status === 'review'
          ? '#B98A1E'
          : p.status === 'execution' || p.status === 'in_progress'
          ? '#2A6F62'
          : '#7A8791';

      return {
        ...p,
        statusType,
        statusLabel,
        stageName,
        stageColor,
        isOverdue,
        tone: p.tone || 'var(--nexus-petrol)'
      };
    });
  }, [filteredProjects, todayStr]);

  // Conteo de proyectos para las pestañas de filtro
  const projectFilterCounts = useMemo(() => {
    return {
      all: projectsListWithHealth.length,
      overdue: projectsListWithHealth.filter((p) => p.statusType === 'overdue').length,
      ontrack: projectsListWithHealth.filter((p) => p.statusType === 'ontrack' || p.statusType === 'extension').length,
      completed: projectsListWithHealth.filter((p) => p.statusType === 'completed').length
    };
  }, [projectsListWithHealth]);

  // Lista de proyectos filtrada para la Radiografía
  const displayedProjects = useMemo(() => {
    if (projectRadarFilter === 'overdue') return projectsListWithHealth.filter((p) => p.statusType === 'overdue');
    if (projectRadarFilter === 'ontrack') return projectsListWithHealth.filter((p) => p.statusType === 'ontrack' || p.statusType === 'extension');
    if (projectRadarFilter === 'completed') return projectsListWithHealth.filter((p) => p.statusType === 'completed');
    return projectsListWithHealth;
  }, [projectsListWithHealth, projectRadarFilter]);

  // 6. SECCIÓN 1: «EN QUÉ ESTOY HOY!!!» (ACTIVIDAD AISLADA POR USUARIO)
  const userTodayActivity = useMemo(() => {
    const isToday = (isoDate) => {
      if (!isoDate) return false;
      return String(isoDate).startsWith(todayStr);
    };

    const isUserAssignedOrAuthor = (w, author) => {
      if (author && author.trim().toLowerCase() === activeUserName.trim().toLowerCase()) return true;
      if (w.createdBy && w.createdBy.trim().toLowerCase() === activeUserName.trim().toLowerCase()) return true;
      if (Array.isArray(w.assignees) && w.assignees.some((a) => a && a.trim().toLowerCase() === activeUserName.trim().toLowerCase())) return true;
      if (w.assignee && w.assignee.toLowerCase().includes(activeUserName.trim().toLowerCase())) return true;
      return false;
    };

    const added = [];
    const edited = [];
    const done = [];
    const feed = [];

    filteredTasks.forEach((task) => {
      const proj = projectMap.get(task.projectId);
      const projName = proj ? proj.name : 'Proyecto General';
      const projTone = proj ? proj.tone || 'var(--nexus-petrol)' : 'var(--nexus-petrol)';

      // 1. Tarea creada hoy por el usuario
      if (isToday(task.createdAt) && isUserAssignedOrAuthor(task)) {
        added.push(task);
        feed.push({
          id: `created-${task.id}`,
          type: 'created',
          task,
          time: new Date(task.createdAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
          timestamp: new Date(task.createdAt).getTime(),
          project: projName,
          projTone,
          title: task.title,
          code: task.code || 'TASK',
          actionText: 'Tarea creada hoy'
        });
      }

      // 2. Reportes de avance o ediciones hoy por este usuario
      if (Array.isArray(task.progressLogs) && task.progressLogs.length > 0) {
        task.progressLogs.forEach((log) => {
          if (isToday(log.createdAt) && (log.author?.trim().toLowerCase() === activeUserName.trim().toLowerCase() || (!log.author && isUserAssignedOrAuthor(task)))) {
            edited.push({ task, log });
            feed.push({
              id: `log-${log.id || log.createdAt}-${task.id}`,
              type: 'updated',
              task,
              time: new Date(log.createdAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
              timestamp: new Date(log.createdAt).getTime(),
              project: projName,
              projTone,
              title: task.title,
              code: task.code || 'TASK',
              actionText: log.text ? `Avance: "${log.text}"` : 'Avance registrado hoy'
            });
          }
        });
      } else if (isToday(task.updatedAt) && !isToday(task.createdAt) && isUserAssignedOrAuthor(task)) {
        edited.push({ task });
        feed.push({
          id: `updated-${task.id}`,
          type: 'updated',
          task,
          time: new Date(task.updatedAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
          timestamp: new Date(task.updatedAt).getTime(),
          project: projName,
          projTone,
          title: task.title,
          code: task.code || 'TASK',
          actionText: 'Detalle de tarea actualizado hoy'
        });
      }

      // 3. Tarea cerrada hoy por el usuario
      if (task.status === 'done') {
        const completionDate = task.completedAt || (task.progressLogs?.length ? task.progressLogs[task.progressLogs.length - 1].createdAt : null) || task.updatedAt;
        if (isToday(completionDate) && isUserAssignedOrAuthor(task, task.closedBy)) {
          done.push(task);
          feed.push({
            id: `done-${task.id}`,
            type: 'completed',
            task,
            time: new Date(completionDate).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
            timestamp: new Date(completionDate).getTime(),
            project: projName,
            projTone,
            title: task.title,
            code: task.code || 'TASK',
            actionText: task.completionReport ? `Cerrada: "${task.completionReport}"` : 'Tarea concluida y verificada hoy'
          });
        }
      }
    });

    // Ordenar cronológicamente descendente
    feed.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    // Deduplicar actividades repetidas
    const uniqueFeed = [];
    const seen = new Set();
    feed.forEach((item) => {
      const key = `${item.task.id}-${item.type}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueFeed.push(item);
      }
    });

    // Donut de dedicación por proyecto hoy
    const projectCountMap = new Map();
    uniqueFeed.forEach((item) => {
      const pName = item.project;
      projectCountMap.set(pName, (projectCountMap.get(pName) || 0) + 1);
    });

    const totalActions = uniqueFeed.length;
    const projectDedications = [];
    const colors = ['#38bdf8', '#22c55e', '#f59e0b', '#a855f7', '#ec4899', '#14b8a6'];
    let cIdx = 0;
    projectCountMap.forEach((count, name) => {
      const pct = totalActions > 0 ? Math.round((count / totalActions) * 100) : 0;
      projectDedications.push({
        name,
        count,
        pct,
        color: colors[cIdx % colors.length]
      });
      cIdx++;
    });

    return {
      addedCount: added.length,
      editedCount: edited.length,
      doneCount: done.length,
      feed: uniqueFeed,
      projectDedications
    };
  }, [filteredTasks, projectMap, todayStr, activeUserName]);

  // Disparo de toast
  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3800);
  };

  // GENERADOR DE FOTO EN ALTA DEFINICIÓN (CANVAS 1200 x 675)
  const generateCanvasSnapshot = (theme, callback) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 675;
    const ctx = canvas.getContext('2d');

    const isDark = theme === 'dark';
    const bg = isDark ? '#0F172A' : '#FFFFFF';
    const textColor = isDark ? '#F8FAFC' : '#0F172A';
    const subColor = isDark ? '#94A3B8' : '#64748B';
    const panelBg = isDark ? 'rgba(255, 255, 255, 0.03)' : '#F8FAFC';
    const panelBorder = isDark ? '#1E293B' : '#E2E8F0';

    // 1. Fondo principal
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 1200, 675);

    // Borde exterior
    ctx.strokeStyle = panelBorder;
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, 1198, 673);

    // 2. Encabezado
    ctx.fillStyle = '#0F3446';
    ctx.beginPath();
    ctx.roundRect(40, 28, 44, 44, 8);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 22px Inter, sans-serif';
    ctx.fillText('N', 53, 58);

    ctx.fillStyle = textColor;
    ctx.font = 'bold 18px Inter, sans-serif';
    ctx.fillText('NEXUS PORTFOLIO MANAGEMENT', 98, 48);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.fillText('REPORTE EJECUTIVO DE ESTATUS (FOTO DEL DÍA)', 98, 66);

    ctx.textAlign = 'right';
    ctx.fillStyle = textColor;
    ctx.font = 'bold 13px "JetBrains Mono", monospace';
    ctx.fillText(
      new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
      1160,
      46
    );

    ctx.fillStyle = subColor;
    ctx.font = '11px Inter, sans-serif';
    ctx.fillText(`Corte oficial · ${projectsListWithHealth.length} proyectos registrados`, 1160, 64);
    ctx.textAlign = 'left';

    ctx.strokeStyle = panelBorder;
    ctx.beginPath();
    ctx.moveTo(40, 88);
    ctx.lineTo(1160, 88);
    ctx.stroke();

    // 3. Columna Izquierda: Panel Macro (360px de ancho)
    ctx.fillStyle = panelBg;
    ctx.strokeStyle = panelBorder;
    ctx.beginPath();
    ctx.roundRect(40, 106, 360, 508, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = subColor;
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.fillText('TACÓMETRO DE RENDIMIENTO GLOBAL', 60, 132);

    // Tacómetro Arco
    const centerX = 220;
    const centerY = 215;
    const radius = 65;

    ctx.lineWidth = 13;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, Math.PI, Math.PI * 1.38);
    ctx.stroke();

    ctx.strokeStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, Math.PI * 1.42, Math.PI * 1.73);
    ctx.stroke();

    ctx.strokeStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, Math.PI * 1.77, Math.PI * 2.0);
    ctx.stroke();

    // Aguja
    const progressVal = portfolioHealth.globalProgress;
    const needleAngle = Math.PI + Math.max(0, Math.min(1, progressVal / 100)) * Math.PI;
    const needleLen = 54;
    ctx.strokeStyle = isDark ? '#FFFFFF' : '#0F172A';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(centerX + Math.cos(needleAngle) * needleLen, centerY + Math.sin(needleAngle) * needleLen);
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 5, 0, Math.PI * 2);
    ctx.fill();

    // Cifra separada debajo del pivote
    ctx.textAlign = 'center';
    ctx.fillStyle = textColor;
    ctx.font = 'bold 30px "JetBrains Mono", monospace';
    ctx.fillText(`${progressVal}%`, centerX, centerY + 34);

    ctx.fillStyle = subColor;
    ctx.font = 'bold 9px Inter, sans-serif';
    ctx.fillText('CUMPLIMIENTO GLOBAL', centerX, centerY + 48);
    ctx.textAlign = 'left';

    // Etapas
    ctx.fillStyle = subColor;
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.fillText('DISTRIBUCIÓN POR ETAPAS', 60, 290);

    const stg = portfolioHealth.stages;
    const drawStageBar = (name, count, pct, color, y) => {
      ctx.fillStyle = textColor;
      ctx.font = '12px Inter, sans-serif';
      ctx.fillText(`${name} (${count})`, 60, y);
      ctx.font = 'bold 12px "JetBrains Mono", monospace';
      ctx.fillText(`${pct}%`, 360, y);

      ctx.fillStyle = isDark ? '#1E293B' : '#E2E8F0';
      ctx.beginPath();
      ctx.roundRect(60, y + 8, 320, 6, 3);
      ctx.fill();

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(60, y + 8, Math.max(4, (pct / 100) * 320), 6, 3);
      ctx.fill();
    };

    drawStageBar('En Ejecución', stg.execution, stg.executionPct, '#2A6F62', 314);
    drawStageBar('En Revisión', stg.review, stg.reviewPct, '#B98A1E', 352);
    drawStageBar('Finalizados', stg.completed, stg.completedPct, '#4C8A45', 390);

    // 4 Mini KPIs
    const kpis = [
      { num: `${portfolioHealth.totalTasks}`, lbl: 'TOTAL', color: '#38bdf8' },
      { num: `${portfolioHealth.inProgressTasks}`, lbl: 'EN CURSO', color: '#2A6F62' },
      { num: `${portfolioHealth.doneTasks}`, lbl: 'CERRADAS', color: '#22c55e' },
      { num: `${taskRisks.overdueCount}`, lbl: 'VENCIDAS', color: '#ef4444' }
    ];

    kpis.forEach((k, idx) => {
      const kX = 60 + idx * 83;
      const kY = 440;
      ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.05)' : '#F1F5F9';
      ctx.beginPath();
      ctx.roundRect(kX, kY, 74, 55, 6);
      ctx.fill();

      ctx.textAlign = 'center';
      ctx.fillStyle = k.color;
      ctx.font = 'bold 18px "JetBrains Mono", monospace';
      ctx.fillText(k.num, kX + 37, kY + 28);

      ctx.fillStyle = subColor;
      ctx.font = 'bold 9px Inter, sans-serif';
      ctx.fillText(k.lbl, kX + 37, kY + 44);
      ctx.textAlign = 'left';
    });

    // 4. Columna Derecha: Radiografía de Proyectos (740px)
    ctx.fillStyle = panelBg;
    ctx.strokeStyle = panelBorder;
    ctx.beginPath();
    ctx.roundRect(420, 106, 740, 508, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = subColor;
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.fillText('RADIOGRAFÍA DEL PORTAFOLIO: AVANCES & RETRASOS', 440, 132);

    let rowY = 152;
    projectsListWithHealth.slice(0, 8).forEach((p) => {
      const isOverdue = p.statusType === 'overdue';
      const barColor = p.progressPct === 100 ? '#22c55e' : isOverdue ? '#ef4444' : '#38bdf8';

      ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.02)' : '#FFFFFF';
      ctx.beginPath();
      ctx.roundRect(440, rowY, 700, 38, 6);
      ctx.fill();

      ctx.fillStyle = p.tone || '#0F3446';
      ctx.beginPath();
      ctx.roundRect(448, rowY + 7, 30, 24, 4);
      ctx.fill();

      ctx.textAlign = 'center';
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 10px "JetBrains Mono", monospace';
      ctx.fillText(p.code || 'P', 463, rowY + 23);
      ctx.textAlign = 'left';

      ctx.fillStyle = textColor;
      ctx.font = 'bold 12px Inter, sans-serif';
      let displayName = p.name;
      if (displayName.length > 34) displayName = displayName.substring(0, 33) + '...';
      ctx.fillText(displayName, 490, rowY + 23);

      ctx.fillStyle = isDark ? '#1E293B' : '#E2E8F0';
      ctx.beginPath();
      ctx.roundRect(800, rowY + 16, 110, 6, 3);
      ctx.fill();

      ctx.fillStyle = barColor;
      ctx.beginPath();
      ctx.roundRect(800, rowY + 16, Math.max(4, (p.progressPct / 100) * 110), 6, 3);
      ctx.fill();

      ctx.fillStyle = barColor;
      ctx.font = 'bold 12px "JetBrains Mono", monospace';
      ctx.fillText(`${p.progressPct}%`, 920, rowY + 23);

      const badgeBg = isOverdue
        ? 'rgba(239, 68, 68, 0.2)'
        : p.statusType === 'completed'
        ? 'rgba(56, 189, 248, 0.2)'
        : 'rgba(34, 197, 94, 0.2)';
      const badgeText = isOverdue ? '#ef4444' : p.statusType === 'completed' ? '#38bdf8' : '#22c55e';

      ctx.fillStyle = badgeBg;
      ctx.beginPath();
      ctx.roundRect(975, rowY + 8, 150, 22, 4);
      ctx.fill();

      ctx.fillStyle = badgeText;
      ctx.font = 'bold 10px Inter, sans-serif';
      ctx.fillText(p.statusLabel, 985, rowY + 23);

      rowY += 44;
    });

    ctx.fillStyle = subColor;
    ctx.font = '10px Inter, sans-serif';
    ctx.fillText('Generado por Nexus Portfolio Management · Documento oficial de seguimiento ejecutivo · Confidencial', 40, 642);

    callback(canvas);
  };

  // ACCIONES DE EXPORTAR
  const handleCopySnapshot = () => {
    generateCanvasSnapshot(exportTheme, (canvas) => {
      canvas.toBlob((blob) => {
        if (!blob) return;
        if (navigator.clipboard && navigator.clipboard.write) {
          navigator.clipboard
            .write([new ClipboardItem({ 'image/png': blob })])
            .then(() => {
              triggerToast('✅ ¡Foto copiada al portapapeles! Pégala con Ctrl + V en Outlook, Teams o WhatsApp.');
            })
            .catch(() => {
              handleDownloadSnapshot();
            });
        } else {
          handleDownloadSnapshot();
        }
      }, 'image/png');
    });
  };

  const handleDownloadSnapshot = () => {
    generateCanvasSnapshot(exportTheme, (canvas) => {
      const link = document.createElement('a');
      link.download = `Estatus_Portafolio_Nexus_${todayStr || new Date().toISOString().slice(0, 10)}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      triggerToast('📥 Descarga de foto PNG iniciada con éxito.');
    });
  };

  const handlePrintPdf = () => {
    window.print();
  };

  // Cálculo de rotación dinámica de la aguja (-90° a +90°)
  const needleRotationDeg = Math.max(-90, Math.min(90, (portfolioHealth.globalProgress - 50) * 1.8));

  const dateHeading = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return 'Buenos días';
    } else if (hour >= 12 && hour < 19) {
      return 'Buenas tardes';
    } else {
      return 'Buenas noches';
    }
  };

  return (
    <div className="home-dashboard-container">
      {/* 1. CABECERA HERO EJECUTIVA */}
      <div className="home-hero-header">
        <div className="home-hero-content">
          <div className="home-hero-badge">
            <span className="home-hero-pulse-dot" />
            <span>Nexus - Centro de control general de proyectos o tareas.</span>
          </div>
          <h1 className="home-hero-title">
            {getGreeting()}, {activeUserName.split(' ')[0]} 👋
          </h1>
          <p className="home-hero-subtitle">
            {dateHeading.charAt(0).toUpperCase() + dateHeading.slice(1)}
          </p>
        </div>

        {/* Acciones Rápidas */}
        <div className="home-hero-actions">
          {/* Espacio Pill */}
          {onSpaceChange && (
            <div className="home-space-switch" role="group" aria-label="Espacio de trabajo">
              <button
                type="button"
                className={`home-space-pill ${space === 'all' ? 'is-active' : ''}`}
                onClick={() => onSpaceChange('all')}
              >
                Todos
              </button>
              <button
                type="button"
                className={`home-space-pill ${space === 'work' ? 'is-active' : ''}`}
                onClick={() => onSpaceChange('work')}
              >
                Trabajo
              </button>
              <button
                type="button"
                className={`home-space-pill ${space === 'personal' ? 'is-active' : ''}`}
                onClick={() => onSpaceChange('personal')}
              >
                Personal
              </button>
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="ui-btn ui-btn--secondary"
              onClick={onOpenDailyCheckin}
              title="Revisar tareas y reportes del día"
            >
              <Icons.DailyCheck size={16} />
              <span>Daily Check</span>
              {taskRisks.overdueCount > 0 && (
                <span className="top-daily-checkin-badge danger">{taskRisks.overdueCount}</span>
              )}
            </button>

            <button
              type="button"
              className="ui-btn ui-btn--primary"
              onClick={onOpenNewTask}
              title="Registrar nueva tarea"
            >
              <Icons.Plus size={16} />
              <span>Nueva Tarea</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. GRID DE LAS 2 SECCIONES PRINCIPALES */}
      <div className="home-sections-grid">
        {/* ======================================================== */}
        {/* SECCIÓN 1: «EN QUÉ ESTOY HOY!!!» (AISLADA POR USUARIO)     */}
        {/* ======================================================== */}
        <section className="home-section-card" aria-label="Sección Personal: En qué estoy hoy!!!">
          <div className="home-section-card-header">
            <div className="home-section-badge-title">
              <div className="home-section-icon-wrap personal">⚡</div>
              <div>
                <h2 className="home-section-title">En qué estoy hoy!!!</h2>
                <span className="home-section-subtitle">
                  Actividad, tareas editadas o agregadas hoy exclusivamente por ti
                </span>
              </div>
            </div>

            <div className="home-user-tag-pill" title={`Sesión activa como ${activeUserRole}`}>
              <span className="home-user-pulse-dot" />
              <span>{activeUserName}</span>
            </div>
          </div>

          {/* 3 KPIs Personales de Hoy */}
          <div className="home-personal-summary-grid">
            <div className="home-personal-stat-box" title="Tareas agregadas hoy por este usuario">
              <span className="home-personal-stat-val added">{userTodayActivity.addedCount}</span>
              <span className="home-personal-stat-label">Nuevas hoy</span>
            </div>
            <div className="home-personal-stat-box" title="Tareas editadas o con avance reportado hoy por este usuario">
              <span className="home-personal-stat-val edited">{userTodayActivity.editedCount}</span>
              <span className="home-personal-stat-label">Editadas hoy</span>
            </div>
            <div className="home-personal-stat-box" title="Tareas concluidas hoy por este usuario">
              <span className="home-personal-stat-val done">{userTodayActivity.doneCount}</span>
              <span className="home-personal-stat-label">Cerradas hoy</span>
            </div>
          </div>

          {/* Donut de Dedicación por Proyecto Hoy */}
          {userTodayActivity.projectDedications.length > 0 && (
            <div className="home-today-donut-card">
              <svg className="home-donut-svg" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.08)"
                  strokeWidth="4.5"
                />
                {(() => {
                  let offsetAcc = 0;
                  return userTodayActivity.projectDedications.map((d, idx) => {
                    const seg = (
                      <path
                        key={idx}
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke={d.color}
                        strokeWidth="4.5"
                        strokeDasharray={`${d.pct}, 100`}
                        strokeDashoffset={`${-offsetAcc}`}
                      />
                    );
                    offsetAcc += d.pct;
                    return seg;
                  });
                })()}
              </svg>

              <div className="home-donut-info-list">
                <span className="home-donut-title">Dedicación por Proyecto Hoy</span>
                {userTodayActivity.projectDedications.slice(0, 3).map((d, idx) => (
                  <div key={idx} className="home-donut-legend-item">
                    <span className="home-donut-legend-left">
                      <span className="home-donut-dot" style={{ background: d.color }} />
                      <span>{d.name}</span>
                    </span>
                    <strong style={{ fontFamily: 'var(--font-mono, monospace)' }}>{d.pct}%</strong>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Feed / Bitácora de Actividad de Hoy */}
          <div className="home-today-feed-wrap">
            <div className="home-feed-header-line">
              <span>Bitácora de hoy ({userTodayActivity.feed.length} actividades)</span>
              <button
                type="button"
                className="ui-btn ui-btn--ghost ui-btn--small"
                onClick={onOpenNewTask}
                style={{ fontSize: '11px', color: '#38bdf8' }}
              >
                + Registrar Tarea
              </button>
            </div>

            <div className="home-feed-list">
              {userTodayActivity.feed.length === 0 ? (
                <div className="home-empty-today-box">
                  <span style={{ fontSize: '28px' }}>☕</span>
                  <div className="home-empty-today-title">Sin actividad registrada hoy</div>
                  <div className="home-empty-today-desc">
                    {activeUserName} aún no ha registrado avances ni agregado tareas el día de hoy.
                  </div>
                  <button
                    type="button"
                    className="ui-btn ui-btn--primary ui-btn--small"
                    onClick={onOpenDailyCheckin}
                    style={{ marginTop: '4px' }}
                  >
                    + Registrar primer avance
                  </button>
                </div>
              ) : (
                userTodayActivity.feed.map((item) => (
                  <div
                    key={item.id}
                    className="home-feed-item"
                    onClick={() => onEditTask && onEditTask(item.task)}
                    title="Clic para ver o editar tarea"
                  >
                    <div className="home-feed-item-top">
                      <span className={`home-feed-badge ${item.type}`}>
                        {item.type === 'created'
                          ? '+ Creada Hoy'
                          : item.type === 'completed'
                          ? '✓ Cerrada Hoy'
                          : '✎ Editada / Avance'}
                      </span>
                      <span className="home-feed-time">{item.time}</span>
                    </div>

                    <div className="home-feed-title">{item.title}</div>

                    {item.type === 'updated' && (
                      <div className="home-feed-note">{item.actionText}</div>
                    )}

                    <div className="home-feed-meta">
                      <span className="home-feed-code">{item.code}</span>
                      <span>·</span>
                      <span>📁 {item.project}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* ======================================================== */}
        {/* SECCIÓN 2: «ASÍ VAMOS» (PORTAFOLIO GLOBAL)                 */}
        {/* ======================================================== */}
        <section className="home-section-card" aria-label="Sección Portafolio: Así vamos">
          <div className="home-section-card-header">
            <div className="home-section-badge-title">
              <div className="home-section-icon-wrap portfolio">📊</div>
              <div>
                <h2 className="home-section-title">Así vamos</h2>
                <span className="home-section-subtitle">
                  Gráficas generales de los proyectos o tareas.
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ fontSize: '12px', color: 'var(--ink-500)', fontFamily: 'var(--font-mono, monospace)', fontWeight: 700 }}>
                {portfolioHealth.totalProjects} PROYECTOS REGISTRADOS
              </div>
              {/* BOTÓN COMPARTIR CON ÍCONO UNIVERSAL */}
              <button
                type="button"
                className="export-snapshot-btn"
                onClick={() => setIsShareModalOpen(true)}
                title="Compartir reporte ejecutivo del portafolio en imagen o PDF"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="18" cy="5" r="3" />
                  <circle cx="6" cy="12" r="3" />
                  <circle cx="18" cy="19" r="3" />
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
                <span>Compartir</span>
              </button>
            </div>
          </div>

          {/* Fila Superior: Tacómetro + Proyectos por Etapa */}
          <div className="home-portfolio-grid-top">
            {/* TACÓMETRO DE AGUJA CLÁSICA (SIN COLISIÓN) */}
            <div className="home-gauge-card">
              <div className="home-gauge-header">
                <span className="home-gauge-title">Tacómetro de Avance</span>
                <span className={`home-gauge-status-badge ${portfolioHealth.healthStatus}`}>
                  {portfolioHealth.healthLabel}
                </span>
              </div>

              <div className="home-gauge-svg-wrap">
                <svg className="home-gauge-svg" viewBox="0 0 200 146" id="speedometerSvg">
                  {/* Zona Crítica (0-40%) */}
                  <path d="M 36 80 A 64 64 0 0 1 48 42" fill="none" stroke="#ef4444" strokeWidth="13" strokeLinecap="round" opacity="0.9" />
                  {/* Zona Observación (40-75%) */}
                  <path d="M 53 38 A 64 64 0 0 1 145 35" fill="none" stroke="#f59e0b" strokeWidth="13" strokeLinecap="round" opacity="0.9" />
                  {/* Zona Saludable (75-100%) */}
                  <path d="M 150 39 A 64 64 0 0 1 164 80" fill="none" stroke="#22c55e" strokeWidth="13" strokeLinecap="round" opacity="0.9" />

                  {/* Ticks graduados */}
                  <line x1="36" y1="80" x2="44" y2="80" stroke="var(--ink-500)" strokeWidth="2" />
                  <line x1="100" y1="16" x2="100" y2="24" stroke="var(--ink-500)" strokeWidth="2" />
                  <line x1="164" y1="80" x2="156" y2="80" stroke="var(--ink-500)" strokeWidth="2" />

                  {/* Aguja del Tacómetro orientada dinámicamente con pivote en 100, 80 */}
                  <g style={{ transformOrigin: '100px 80px', transform: `rotate(${needleRotationDeg}deg)`, transition: 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
                    <line x1="100" y1="80" x2="100" y2="22" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
                    <circle cx="100" cy="80" r="5" fill="#38bdf8" stroke="#FFFFFF" strokeWidth="1.5" />
                  </g>

                  {/* Cifra y rótulo ubicados estrictamente debajo del pivote (sin colisión) */}
                  <text x="100" y="115" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="30" fontWeight="800" fill="currentColor">
                    {portfolioHealth.globalProgress}%
                  </text>
                  <text x="100" y="132" textAnchor="middle" fontFamily="'Inter', sans-serif" fontSize="9" fontWeight="700" letterSpacing="0.5" fill="currentColor" opacity="0.7">
                    CUMPLIMIENTO GLOBAL
                  </text>
                </svg>
              </div>

              <div className="home-gauge-zones-legend">
                <div className="home-gauge-zone-item"><span className="home-gauge-zone-dot" style={{ background: '#ef4444' }} /> &lt;40% Vencido</div>
                <div className="home-gauge-zone-item"><span className="home-gauge-zone-dot" style={{ background: '#f59e0b' }} /> 40-75% Riesgo</div>
                <div className="home-gauge-zone-item"><span className="home-gauge-zone-dot" style={{ background: '#22c55e' }} /> &gt;75% En Fecha</div>
              </div>
            </div>

            {/* RESUMEN DE PROYECTOS POR ETAPA */}
            <div className="home-stages-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="home-gauge-title">Proyectos por Etapa</span>
                <span style={{ fontSize: '11px', color: 'var(--ink-500)' }}>Total: {portfolioHealth.totalProjects} proyectos</span>
              </div>

              <div className="home-stages-bars-stack">
                <div className="home-stage-row">
                  <div className="home-stage-row-meta">
                    <span className="home-stage-name">
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#2A6F62' }} />
                      <span>En Ejecución</span>
                    </span>
                    <span className="home-stage-count">
                      {portfolioHealth.stages.execution} ({portfolioHealth.stages.executionPct}%)
                    </span>
                  </div>
                  <div className="home-stage-track">
                    <div className="home-stage-fill" style={{ width: `${portfolioHealth.stages.executionPct}%`, background: '#2A6F62' }} />
                  </div>
                </div>

                <div className="home-stage-row">
                  <div className="home-stage-row-meta">
                    <span className="home-stage-name">
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#B98A1E' }} />
                      <span>En Revisión</span>
                    </span>
                    <span className="home-stage-count">
                      {portfolioHealth.stages.review} ({portfolioHealth.stages.reviewPct}%)
                    </span>
                  </div>
                  <div className="home-stage-track">
                    <div className="home-stage-fill" style={{ width: `${portfolioHealth.stages.reviewPct}%`, background: '#B98A1E' }} />
                  </div>
                </div>

                <div className="home-stage-row">
                  <div className="home-stage-row-meta">
                    <span className="home-stage-name">
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#4C8A45' }} />
                      <span>Finalizados</span>
                    </span>
                    <span className="home-stage-count">
                      {portfolioHealth.stages.completed} ({portfolioHealth.stages.completedPct}%)
                    </span>
                  </div>
                  <div className="home-stage-track">
                    <div className="home-stage-fill" style={{ width: `${portfolioHealth.stages.completedPct}%`, background: '#4C8A45' }} />
                  </div>
                </div>

                <div className="home-stage-row">
                  <div className="home-stage-row-meta">
                    <span className="home-stage-name">
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#7A8791' }} />
                      <span>Preproyecto / Backlog</span>
                    </span>
                    <span className="home-stage-count">
                      {portfolioHealth.stages.backlog} ({portfolioHealth.stages.backlogPct}%)
                    </span>
                  </div>
                  <div className="home-stage-track">
                    <div className="home-stage-fill" style={{ width: `${portfolioHealth.stages.backlogPct}%`, background: '#7A8791' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RADIOGRAFÍA DEL PORTAFOLIO: PROYECTOS, AVANCES & RETRASOS */}
          <div className="home-projects-radar-section">
            <div className="home-projects-radar-header">
              <div className="home-projects-radar-title-wrap">
                <span style={{ fontSize: '16px' }}>🎯</span>
                <div>
                  <span className="home-projects-radar-title">Radiografía del Portafolio: Proyectos, Avances & Retrasos</span>
                  <p style={{ fontSize: '11px', color: 'var(--ink-500)', margin: 0 }}>
                    Detalle individual de los proyectos que construyen el {portfolioHealth.globalProgress}% del tacómetro global
                  </p>
                </div>
              </div>

              {/* Filtros Rápidos */}
              <div className="home-radar-filter-tabs" role="tablist">
                <button
                  type="button"
                  className={`home-radar-tab-btn ${projectRadarFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setProjectRadarFilter('all')}
                >
                  Todos ({projectFilterCounts.all})
                </button>
                <button
                  type="button"
                  className={`home-radar-tab-btn danger ${projectRadarFilter === 'overdue' ? 'active' : ''}`}
                  onClick={() => setProjectRadarFilter('overdue')}
                >
                  ⚠️ Con Atraso ({projectFilterCounts.overdue})
                </button>
                <button
                  type="button"
                  className={`home-radar-tab-btn ${projectRadarFilter === 'ontrack' ? 'active' : ''}`}
                  onClick={() => setProjectRadarFilter('ontrack')}
                >
                  ✓ En Fecha ({projectFilterCounts.ontrack})
                </button>
                <button
                  type="button"
                  className={`home-radar-tab-btn ${projectRadarFilter === 'completed' ? 'active' : ''}`}
                  onClick={() => setProjectRadarFilter('completed')}
                >
                  Concluidos ({projectFilterCounts.completed})
                </button>
              </div>
            </div>

            {/* Lista Scorecard de Proyectos */}
            <div className="home-projects-scorecard-list">
              {displayedProjects.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px', color: 'var(--ink-500)', fontSize: '13px' }}>
                  No hay proyectos en este filtro.
                </div>
              ) : (
                displayedProjects.map((p) => {
                  const isOverdue = p.statusType === 'overdue';
                  const isGood = p.statusType === 'completed' || p.progressPct >= 50;
                  const barColor = p.progressPct === 100 ? '#22c55e' : isOverdue ? '#ef4444' : '#38bdf8';

                  return (
                    <div
                      key={p.id}
                      className={`home-project-scorecard-item ${isOverdue ? 'is-overdue' : isGood ? 'is-good' : ''}`}
                      onClick={() => onSelectProject && onSelectProject(p.id)}
                      title={`Abrir Detalle de ${p.name}`}
                    >
                      <span className="home-project-code-badge" style={{ background: p.tone }}>
                        {p.code || 'P'}
                      </span>

                      <div className="home-project-name-wrap">
                        <span className="home-project-name-text">{p.name}</span>
                        <span className="home-project-stage-sub">
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: p.stageColor }} />
                          <span>{p.stageName}</span>
                          <span>·</span>
                          <span>{p.doneTasks || 0} de {p.totalTasks || 0} tareas</span>
                        </span>
                      </div>

                      <div className="home-project-progress-cell">
                        <div className="home-project-progress-bar-wrap">
                          <div className="home-project-mini-track">
                            <div className="home-project-mini-fill" style={{ width: `${p.progressPct || 0}%`, background: barColor }} />
                          </div>
                          <span className="home-project-pct-num" style={{ color: barColor }}>
                            {p.progressPct || 0}%
                          </span>
                        </div>
                      </div>

                      <div className="home-project-scorecard-cell--time">
                        <span className={`home-project-time-pill ${p.statusType}`}>
                          {p.statusLabel}
                        </span>
                      </div>

                      <div className="home-project-scorecard-cell--action">
                        <div className="home-project-open-btn">→</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* 4 KPIs de Tareas Globales */}
          <div className="home-portfolio-grid-bottom">
            <div className="home-portfolio-kpi-card kpi-total">
              <span className="home-portfolio-kpi-val">{portfolioHealth.totalTasks}</span>
              <span className="home-portfolio-kpi-title">Total Tareas</span>
              <span className="home-portfolio-kpi-sub">En todo el portafolio</span>
            </div>

            <div className="home-portfolio-kpi-card kpi-progress">
              <span className="home-portfolio-kpi-val">{portfolioHealth.inProgressTasks}</span>
              <span className="home-portfolio-kpi-title">En Curso</span>
              <span className="home-portfolio-kpi-sub">Activas en ejecución</span>
            </div>

            <div className="home-portfolio-kpi-card kpi-done">
              <span className="home-portfolio-kpi-val">{portfolioHealth.doneTasks}</span>
              <span className="home-portfolio-kpi-title">Terminadas</span>
              <span className="home-portfolio-kpi-sub">Cerradas con reporte</span>
            </div>

            <div className="home-portfolio-kpi-card kpi-overdue">
              <span className="home-portfolio-kpi-val" style={{ color: '#ef4444' }}>
                {taskRisks.overdueCount}
              </span>
              <span className="home-portfolio-kpi-title">Vencidas / Riesgo</span>
              <span className="home-portfolio-kpi-sub">Requieren atención</span>
            </div>
          </div>

          {/* Franja de Alerta de Cronograma si hay tareas vencidas */}
          {taskRisks.overdueCount > 0 && (
            <div className="home-alerts-strip">
              <div className="home-alerts-strip-left">
                <span style={{ fontSize: '18px' }}>⚠️</span>
                <div>
                  <div className="home-alerts-strip-title">Atención de Cronograma</div>
                  <div className="home-alerts-strip-desc">
                    Hay {taskRisks.overdueCount} tareas que superaron su fecha límite estimada sin reporte de cierre.
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="home-alerts-strip-btn"
                onClick={() => onNavigate && onNavigate('tasks')}
              >
                Ver Tareas Vencidas →
              </button>
            </div>
          )}
        </section>
      </div>

      {/* ======================================================== */}
      {/* MODAL DE COMPARTIR FOTO / REPORTE DE ESTATUS             */}
      {/* ======================================================== */}
      {isShareModalOpen && (
        <div
          className="snapshot-modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsShareModalOpen(false);
          }}
        >
          <div className="snapshot-modal-box">
            <div className="snapshot-modal-header">
              <div className="snapshot-modal-title-group">
                <h3>📸 Foto Ejecutiva del Portafolio (Estatus de Hoy)</h3>
                <p>Genera una captura en alta resolución o reporte PDF para enviar por correo, Teams o WhatsApp.</p>
              </div>
              <button
                type="button"
                className="snapshot-modal-close"
                onClick={() => setIsShareModalOpen(false)}
                title="Cerrar modal"
              >
                ✕
              </button>
            </div>

            {/* Barra de Herramientas de Exportación */}
            <div className="snapshot-actions-bar">
              <div className="snapshot-style-toggle">
                <button
                  type="button"
                  className={`style-pill-btn ${exportTheme === 'dark' ? 'active' : ''}`}
                  onClick={() => setExportTheme('dark')}
                >
                  🌑 Fondo Oscuro Ejecutivo
                </button>
                <button
                  type="button"
                  className={`style-pill-btn ${exportTheme === 'light' ? 'active' : ''}`}
                  onClick={() => setExportTheme('light')}
                >
                  ☀️ Fondo Blanco Corporativo
                </button>
              </div>

              <div className="snapshot-export-btns">
                <button
                  type="button"
                  className="action-btn-primary"
                  onClick={handleCopySnapshot}
                  title="Copiar imagen al portapapeles para pegar con Ctrl + V"
                >
                  📋 Copiar Foto (Ctrl+V)
                </button>
                <button
                  type="button"
                  className="action-btn-secondary"
                  onClick={handleDownloadSnapshot}
                  title="Descargar archivo PNG en alta resolución"
                >
                  📥 Descargar PNG
                </button>
                <button
                  type="button"
                  className="action-btn-secondary"
                  onClick={handlePrintPdf}
                  title="Guardar como PDF apaisado de 1 página"
                >
                  📄 Guardar como PDF
                </button>
              </div>
            </div>

            {/* Vista Previa de la Tarjeta Ejecutiva (16:9) */}
            <div className="snapshot-preview-viewport">
              <div className="executive-card-export" data-export-theme={exportTheme}>
                <div className="exec-header">
                  <div className="exec-brand-group">
                    <div className="exec-logo-icon">N</div>
                    <div className="exec-brand-text">
                      <h2>NEXUS PORTFOLIO CADENCE</h2>
                      <p>Reporte Ejecutivo de Estatus · Foto del Portafolio</p>
                    </div>
                  </div>
                  <div className="exec-meta-box">
                    <div className="exec-meta-date">{dateHeading}</div>
                    <div style={{ opacity: 0.7 }}>Corte Oficial · Responsable: {activeUserName}</div>
                  </div>
                </div>

                <div className="exec-body-grid">
                  {/* Panel Izquierdo */}
                  <div className="exec-panel">
                    <div className="exec-panel-title">
                      <span>Rendimiento Global</span>
                      <span style={{ color: portfolioHealth.healthStatus === 'critical' ? '#ef4444' : '#4ade80' }}>
                        {portfolioHealth.healthLabel}
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '10px 0' }}>
                      <svg width="200" height="135" viewBox="0 0 200 146">
                        <path d="M 36 80 A 64 64 0 0 1 48 42" fill="none" stroke="#ef4444" strokeWidth="12" strokeLinecap="round" />
                        <path d="M 53 38 A 64 64 0 0 1 145 35" fill="none" stroke="#f59e0b" strokeWidth="12" strokeLinecap="round" />
                        <path d="M 150 39 A 64 64 0 0 1 164 80" fill="none" stroke="#22c55e" strokeWidth="12" strokeLinecap="round" />
                        <g style={{ transformOrigin: '100px 80px', transform: `rotate(${needleRotationDeg}deg)` }}>
                          <line x1="100" y1="80" x2="100" y2="24" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
                          <circle cx="100" cy="80" r="5" fill="#38bdf8" />
                        </g>
                        <text x="100" y="115" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="28" fontWeight="800" fill="currentColor">
                          {portfolioHealth.globalProgress}%
                        </text>
                        <text x="100" y="132" textAnchor="middle" fontFamily="'Inter', sans-serif" fontSize="9" fontWeight="700" letterSpacing="0.5" fill="currentColor" opacity="0.7">
                          CUMPLIMIENTO GLOBAL
                        </text>
                      </svg>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '14px', fontSize: '11px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>En Ejecución ({portfolioHealth.stages.execution})</span>
                        <strong style={{ fontFamily: 'var(--font-mono, monospace)' }}>{portfolioHealth.stages.executionPct}%</strong>
                      </div>
                      <div style={{ height: '5px', background: 'rgba(255,255,255,0.1)', borderRadius: '99px', overflow: 'hidden' }}>
                        <div style={{ width: `${portfolioHealth.stages.executionPct}%`, height: '100%', background: '#2A6F62' }} />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                        <span>En Revisión ({portfolioHealth.stages.review})</span>
                        <strong style={{ fontFamily: 'var(--font-mono, monospace)' }}>{portfolioHealth.stages.reviewPct}%</strong>
                      </div>
                      <div style={{ height: '5px', background: 'rgba(255,255,255,0.1)', borderRadius: '99px', overflow: 'hidden' }}>
                        <div style={{ width: `${portfolioHealth.stages.reviewPct}%`, height: '100%', background: '#B98A1E' }} />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                        <span>Finalizados ({portfolioHealth.stages.completed})</span>
                        <strong style={{ fontFamily: 'var(--font-mono, monospace)' }}>{portfolioHealth.stages.completedPct}%</strong>
                      </div>
                      <div style={{ height: '5px', background: 'rgba(255,255,255,0.1)', borderRadius: '99px', overflow: 'hidden' }}>
                        <div style={{ width: `${portfolioHealth.stages.completedPct}%`, height: '100%', background: '#4C8A45' }} />
                      </div>
                    </div>

                    <div className="exec-kpis-strip">
                      <div className="exec-kpi-pill">
                        <span className="exec-kpi-num" style={{ color: '#38bdf8' }}>{portfolioHealth.totalTasks}</span>
                        <span className="exec-kpi-lbl">Total</span>
                      </div>
                      <div className="exec-kpi-pill">
                        <span className="exec-kpi-num" style={{ color: '#2A6F62' }}>{portfolioHealth.inProgressTasks}</span>
                        <span className="exec-kpi-lbl">En Curso</span>
                      </div>
                      <div className="exec-kpi-pill">
                        <span className="exec-kpi-num" style={{ color: '#22c55e' }}>{portfolioHealth.doneTasks}</span>
                        <span className="exec-kpi-lbl">Cerradas</span>
                      </div>
                      <div className="exec-kpi-pill">
                        <span className="exec-kpi-num" style={{ color: '#ef4444' }}>{taskRisks.overdueCount}</span>
                        <span className="exec-kpi-lbl">Vencidas</span>
                      </div>
                    </div>
                  </div>

                  {/* Panel Derecho: Radiografía de Proyectos */}
                  <div className="exec-panel">
                    <div className="exec-panel-title">
                      <span>Radiografía del Portafolio ({projectsListWithHealth.length} Proyectos)</span>
                      <span style={{ fontSize: '10px', opacity: 0.7 }}>Avances & Plazos</span>
                    </div>

                    <div className="exec-projects-table">
                      {projectsListWithHealth.slice(0, 8).map((p) => {
                        const isOverdue = p.statusType === 'overdue';
                        const barColor = p.progressPct === 100 ? '#22c55e' : isOverdue ? '#ef4444' : '#38bdf8';
                        return (
                          <div key={p.id} className="exec-proj-row">
                            <span className="exec-proj-code" style={{ background: p.tone }}>
                              {p.code || 'P'}
                            </span>
                            <span className="exec-proj-name" title={p.name}>
                              {p.name}
                            </span>
                            <div className="exec-proj-bar-wrap">
                              <div className="exec-proj-track">
                                <div className="exec-proj-fill" style={{ width: `${p.progressPct || 0}%`, background: barColor }} />
                              </div>
                              <span className="exec-proj-pct" style={{ color: barColor }}>
                                {p.progressPct || 0}%
                              </span>
                            </div>
                            <span className={`exec-proj-badge ${p.statusType}`}>{p.statusLabel}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="exec-footer">
                  <span>Generado automáticamente por Nexus Portfolio Cadence</span>
                  <span>Documento Confidencial · Uso Interno Exclusivo</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TOAST FLOTANTE */}
      {toastMessage && (
        <div className="home-snapshot-toast active">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
