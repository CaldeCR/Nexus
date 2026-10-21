import React, { useState, useMemo } from 'react';
import { useBreakpoint } from '../hooks/useBreakpoint';

export function AgendaView({
  workItems = [],
  projects = [],
  todayStr = '',
  onSelectProject,
  onNavigateToTasks
}) {
  const bp = useBreakpoint();
  const isMobile = bp === 'mobile';

  const [currentDate, setCurrentDate] = useState(() => {
    return todayStr ? new Date(todayStr + 'T12:00:00') : new Date(2026, 9, 20);
  });
  const [viewMode, setViewMode] = useState('month'); // 'month' | 'week' | 'day' | 'list'

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const projectToneMap = useMemo(() => {
    const tones = ['#2A6F62', '#4A6B7A', '#0F3446', '#5C6670', '#7A5C3E', '#4C8A45', '#B98A1E'];
    const map = {};
    projects.forEach((p, idx) => {
      map[p.id] = tones[idx % tones.length];
      if (p.code) map[p.code] = tones[idx % tones.length];
    });
    return map;
  }, [projects]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrev = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNext = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(todayStr ? new Date(todayStr + 'T12:00:00') : new Date(2026, 9, 20));
  };

  // Calendar cells generation (Month view)
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Monday = 0, Sunday = 6
    let startingDayOfWeek = firstDay.getDay() - 1;
    if (startingDayOfWeek === -1) startingDayOfWeek = 6;

    const days = [];

    // Prev month padding
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const d = prevMonthLastDay - i;
      const iso = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ dayNumber: d, isCurrentMonth: false, isoDate: iso });
    }

    // Current month days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({ dayNumber: i, isCurrentMonth: true, isoDate: iso });
    }

    // Next month padding
    const remaining = 35 - days.length;
    if (remaining > 0) {
      for (let i = 1; i <= remaining; i++) {
        const iso = `${year}-${String(month + 2).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        days.push({ dayNumber: i, isCurrentMonth: false, isoDate: iso });
      }
    }

    return days;
  }, [year, month]);

  // Tasks mapped by date
  const tasksByDate = useMemo(() => {
    const map = {};
    workItems.forEach((t) => {
      if (t.dueDate) {
        if (!map[t.dueDate]) map[t.dueDate] = [];
        map[t.dueDate].push(t);
      }
    });
    return map;
  }, [workItems]);

  // Project target dates
  const projectMilestonesByDate = useMemo(() => {
    const map = {};
    projects.forEach((p) => {
      if (p.targetDate) {
        if (!map[p.targetDate]) map[p.targetDate] = [];
        map[p.targetDate].push(p);
      }
    });
    return map;
  }, [projects]);

  /* ========================================================================= */
  /* VISTA MÓVIL (< 768px)                                                    */
  /* ========================================================================= */
  if (isMobile) {
    const tomorrowStr = (() => {
      if (!todayStr) return '2026-10-21';
      const d = new Date(todayStr + 'T12:00:00');
      d.setDate(d.getDate() + 1);
      return d.toISOString().split('T')[0];
    })();

    const todayItems = tasksByDate[todayStr] || [];
    const tomorrowItems = tasksByDate[tomorrowStr] || [];

    const upcomingDates = Object.keys(tasksByDate)
      .filter((d) => d > tomorrowStr)
      .sort();

    return (
      <div style={{ flex: 1, padding: '14px 16px 88px 16px', display: 'flex', flexDirection: 'column', gap: '14px', boxSizing: 'border-box' }}>
        {/* Sección: Hoy */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <strong style={{ fontSize: '13px', color: '#3A4650' }}>Hoy · Martes 20 oct</strong>
          {todayItems.length > 0 ? (
            todayItems.map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  background: '#FFFFFF',
                  border: '1px solid #DDE2E4',
                  borderRadius: '8px',
                  padding: '12px',
                  minHeight: '48px',
                  boxSizing: 'border-box'
                }}
              >
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: projectToneMap[item.projectId] || '#2A6F62', flex: 'none' }} />
                <span style={{ flex: 1, lineHeight: '20px', fontSize: '14px' }}>{item.title}</span>
                <span style={{ fontSize: '12px', color: '#5F6B76' }}>{item.code || `T-${item.id}`}</span>
              </div>
            ))
          ) : (
            <div style={{ padding: '16px', border: '1px dashed #C5CDD0', borderRadius: '8px', textAlign: 'center', fontSize: '13px', color: '#5F6B76' }}>
              Sin tareas ni fechas meta para hoy
            </div>
          )}
        </section>

        {/* Sección: Mañana */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <strong style={{ fontSize: '13px', color: '#3A4650' }}>Mañana · Miércoles 21 oct</strong>
          {tomorrowItems.length > 0 ? (
            tomorrowItems.map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  background: '#FFFFFF',
                  border: '1px solid #DDE2E4',
                  borderRadius: '8px',
                  padding: '12px',
                  minHeight: '48px',
                  boxSizing: 'border-box'
                }}
              >
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: projectToneMap[item.projectId] || '#2A6F62', flex: 'none' }} />
                <span style={{ flex: 1, lineHeight: '20px', fontSize: '14px' }}>{item.title}</span>
                <span style={{ fontSize: '12px', color: '#5F6B76' }}>{item.code || `T-${item.id}`}</span>
              </div>
            ))
          ) : (
            <div style={{ padding: '16px', border: '1px dashed #C5CDD0', borderRadius: '8px', textAlign: 'center', fontSize: '13px', color: '#5F6B76' }}>
              Sin tareas ni fechas meta
            </div>
          )}
        </section>

        {/* Acceso a tareas completas */}
        {onNavigateToTasks && (
          <button
            type="button"
            onClick={onNavigateToTasks}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px',
              borderRadius: '8px',
              background: '#FFFFFF',
              border: '1px solid #DDE2E4',
              color: '#1D2A33',
              minHeight: '48px',
              boxSizing: 'border-box',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#9B3B32' }} />
            <span style={{ flex: 1, fontSize: '13px', fontWeight: 500 }}>Ver todas las tareas pendientes</span>
            <span style={{ fontSize: '14px', color: '#5F6B76' }}>→</span>
          </button>
        )}
      </div>
    );
  }

  /* ========================================================================= */
  /* VISTA ESCRITORIO / TABLET (§7.5)                                          */
  /* ========================================================================= */
  return (
    <div style={{ flex: 1, minWidth: 0, padding: bp === 'tablet' ? '24px 28px' : '32px 40px 40px 40px', display: 'flex', flexDirection: 'column', gap: '20px', boxSizing: 'border-box' }}>
      {/* Cabecera */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <h1 style={{ margin: 0, fontSize: '26px', fontWeight: 600, color: '#1D2A33' }}>Agenda</h1>
          <span style={{ fontSize: '14px', color: '#5F6B76' }}>Tareas con fecha y fechas meta de tus proyectos</span>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px' }}>
          {/* Navegador de Mes */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Periodo anterior"
              style={{
                width: '36px',
                height: '36px',
                border: '1px solid #DDE2E4',
                borderRadius: '6px',
                background: '#FFFFFF',
                color: '#3A4650',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M15 6l-6 6 6 6" />
              </svg>
            </button>
            <span style={{ minWidth: '170px', textAlign: 'center', fontWeight: 600, fontSize: '15px' }}>
              {monthNames[month]} {year}
            </span>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Periodo siguiente"
              style={{
                width: '36px',
                height: '36px',
                border: '1px solid #DDE2E4',
                borderRadius: '6px',
                background: '#FFFFFF',
                color: '#3A4650',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M9 6l6 6-6 6" />
              </svg>
            </button>
            <button
              type="button"
              onClick={handleToday}
              style={{
                height: '36px',
                padding: '0 12px',
                border: '1px solid #DDE2E4',
                borderRadius: '6px',
                background: '#FFFFFF',
                color: '#1D2A33',
                font: 'inherit',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                marginLeft: '4px'
              }}
            >
              Hoy
            </button>
          </div>

          {/* Selector de Modo */}
          <div style={{ display: 'flex', background: '#FFFFFF', border: '1px solid #DDE2E4', borderRadius: '6px', padding: '2px' }}>
            {['month', 'week', 'list'].map((mode) => {
              const label = mode === 'month' ? 'Mes' : mode === 'week' ? 'Semana' : 'Lista';
              const on = viewMode === mode;
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setViewMode(mode)}
                  style={{
                    height: '32px',
                    padding: '0 12px',
                    border: 0,
                    borderRadius: '4px',
                    background: on ? '#EDF0F0' : 'transparent',
                    color: on ? '#1D2A33' : '#5F6B76',
                    font: 'inherit',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Calendario Mensual */}
      <div style={{ background: '#FFFFFF', border: '1px solid #DDE2E4', borderRadius: '8px', overflow: 'hidden' }}>
        {/* Días de la semana */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', background: '#F6F7F7', borderBottom: '1px solid #DDE2E4' }}>
          {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((d) => (
            <div key={d} style={{ padding: '10px 12px', fontSize: '12px', fontWeight: 600, color: '#5F6B76', textAlign: 'center' }}>
              {d}
            </div>
          ))}
        </div>

        {/* Celdas del Mes */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridAutoRows: 'minmax(110px, 1fr)' }}>
          {calendarDays.map((cell, idx) => {
            const isToday = cell.isoDate === todayStr;
            const dayTasks = tasksByDate[cell.isoDate] || [];
            const dayMilestones = projectMilestonesByDate[cell.isoDate] || [];

            return (
              <div
                key={cell.isoDate + idx}
                style={{
                  borderRight: (idx + 1) % 7 === 0 ? 'none' : '1px solid #EDEFF0',
                  borderBottom: '1px solid #EDEFF0',
                  padding: '8px',
                  background: cell.isCurrentMonth ? '#FFFFFF' : '#FAFAFA',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  boxSizing: 'border-box'
                }}
              >
                {/* Número del día */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: isToday ? 700 : 500,
                      background: isToday ? '#2A6F62' : 'transparent',
                      color: isToday ? '#FFFFFF' : (cell.isCurrentMonth ? '#1D2A33' : '#9AA4AC')
                    }}
                  >
                    {cell.dayNumber}
                  </span>
                </div>

                {/* Eventos / Tareas del Día */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', overflowY: 'auto', maxHeight: '80px' }}>
                  {dayMilestones.map((p) => (
                    <div
                      key={'m-' + p.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: '#F0F5F4',
                        borderLeft: '3px solid #2A6F62',
                        borderRadius: '2px',
                        padding: '2px 4px',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: '#1F5449'
                      }}
                      title={`Meta: ${p.name}`}
                    >
                      <span>◆</span>
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        Meta: {p.code || p.name}
                      </span>
                    </div>
                  ))}

                  {dayTasks.map((t) => (
                    <div
                      key={t.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: '#EDF0F0',
                        borderRadius: '3px',
                        padding: '2px 4px',
                        fontSize: '11px',
                        color: t.status === 'done' ? '#5F6B76' : '#1D2A33',
                        textDecoration: t.status === 'done' ? 'line-through' : 'none'
                      }}
                      title={t.title}
                    >
                      <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: projectToneMap[t.projectId] || '#2A6F62', flex: 'none' }} />
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {t.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
