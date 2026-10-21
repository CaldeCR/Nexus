# Nexus — Guía de implementación del rediseño UI

> Repositorio: `CaldeCR/Nexus` · Frontend: `apps/web` (React 18 + Vite, CSS plano)
> Fecha: 20 oct 2026 · Estado: **paleta, tono y panel lateral aprobados (Opción A con riel de íconos de la C); vista móvil incluida**
> Prototipo de referencia: lienzo "Nexus — Rediseño" → fila "Escritorio": Mis proyectos, Tablero, Cronograma, Mis tareas, Agenda, Directorio · fila 2: opciones de panel A/B/C (histórico) · fila "Vista móvil": Mis proyectos, Tablero, Cronograma, Menú, Mis tareas (+ hoja de cierre), Agenda, Directorio, Nueva tarea · fila 4: formularios (panel vs. modal) y tablet vertical/horizontal

---

## 0. Resumen de decisiones

| Tema | Decisión |
|---|---|
| Tono visual | **Sobrio**. Neutros + 2 colores de marca tomados del logo. Nada de chips con fondo saturado. |
| Tema por defecto | **Claro**. El oscuro queda como opción del usuario. |
| Color primario | Azul petróleo del logo `#0F3446` (navegación, elementos de marca). |
| Color de acción | Verde azulado del logo `#2A6F62` (botón primario, barras de avance, pestaña activa). |
| Verde de la flecha del logo | Solo para "Finalizado" (versión apagada `#4C8A45`). |
| Tipografía | **Inter** (reemplaza Barlow, que es condensada y cansa en tablas). |
| Layout | Panel lateral + contenido **fluido** (se elimina el contenedor de 980 px). |
| Estados | **Punto de color 8 px + texto**, nunca fondo de color. |
| Atrasos | Solo texto en rojo ladrillo `#9B3B32` ("Venció 2 oct", "18 días de atraso"). |
| Enfoque del producto | Proyectos **personales y laborales**: selector de *Espacio* (Todos / Trabajo / Personal) + acceso directo a **Mis tareas**. |
| Navegación escritorio | **Riel de íconos petróleo (64px) con todas las secciones + panel claro acoplado y colapsable (272px)** con Espacio, búsqueda y lista de proyectos (§5). |
| Navegación móvil | **Barra superior petróleo + barra inferior de 5 pestañas + menú lateral (drawer)** con espacios y proyectos (§7.8). Obligatoria desde la primera entrega. |

---

## 1. Diagnóstico del código actual (evidencia)

| # | Hallazgo | Dónde | Impacto |
|---|---|---|---|
| 1 | Toda la app vive en un solo componente `App()` (~6.000 líneas, 63 `useState`) | `src/main.jsx` líneas 530–6533 | Cada vista se estiliza por separado; inconsistencias. |
| 2 | Librería UI existente **sin uso** | `src/components/ui/ui.js` (no se importa) | Botones/chips duplicados con variantes distintas. |
| 3 | Estilos fuera del sistema | 300 `style={{}}` inline, 31 hex en JSX, ~470 colores hardcodeados en CSS, 46 `!important` | Los tokens se ignoran; el tema claro se rompe en partes. |
| 4 | 42 tamaños de letra distintos | `src/styles/*.css` | Sin jerarquía tipográfica. |
| 5 | Contenedor angosto | `maxWidth: '980px'` en `main.jsx:4704` | Espacio desperdiciado en pantallas grandes. |
| 6 | Oscuro por defecto | `main.jsx:538-542` y `:root` en `tokens.css` | Contrario al estilo deseado. |
| 7 | Contraste insuficiente | `--ink-300 #64748b` sobre card oscura = 3.7:1; `--ink-300 #94a3b8` sobre blanco = 2.6:1 | Incumple WCAG AA (mín. 4.5:1). |
| 8 | Accesibilidad | 17 `aria-label` en toda la app; 7 botones sin nombre en "Mis Proyectos" | Botones de ícono no se anuncian. |
| 9 | Navegación en header | `<header className="top-navbar">` en `main.jsx:2078` | Se reemplaza por panel lateral. |
| 10 | Estilos duplicados en `index.html` | `apps/web/index.html` define otro `:root` (`--bg`, `--panel`…) y fondo degradado | Conflicto con `tokens.css`. |

---

## 2. Tokens de diseño

### 2.1 Estrategia
**Conservar los nombres de variables actuales** (`--surface-bg`, `--ink-900`, `--brand-600`…) y cambiar sus valores. Así las ~817 referencias `var(--…)` que ya existen en los CSS adoptan la nueva paleta sin tocar cada archivo. Se agregan tokens nuevos para lo que falta (navegación, estados, tipografía).

### 2.2 Reemplazo completo de `apps/web/src/styles/tokens.css` (bloque de variables)

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

:root,
[data-theme='light'] {
  color-scheme: light;
  --font-sans: 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;

  /* Superficies */
  --surface-bg: #F6F7F7;        /* fondo de la app */
  --surface-card: #FFFFFF;      /* tarjetas, tablas, paneles */
  --surface-elevated: #FFFFFF;
  --surface-muted: #EDF0F0;     /* columnas kanban, segmentados, tracks */
  --surface-hover: #F1F4F4;

  /* Texto (todos ≥ 4.5:1 sobre #FFFFFF y #F6F7F7) */
  --ink-900: #1D2A33;           /* títulos y texto principal */
  --ink-700: #3A4650;           /* texto secundario fuerte */
  --ink-500: #5F6B76;           /* metadatos, labels (5.4:1) */
  --ink-300: #5F6B76;           /* antes #94a3b8 → subido por contraste */
  --line-200: #DDE2E4;          /* bordes */
  --line-100: #EDEFF0;          /* separadores de fila */
  --track-gray: #E3E8E7;        /* fondo de barras de progreso */

  /* Marca (del logo) */
  --nexus-petrol: #0F3446;      /* fondo del logo */
  --nexus-petrol-700: #1C4A5E;  /* ítem activo en nav oscura */
  --nexus-petrol-500: #23536A;  /* divisores dentro de la nav */
  --nexus-teal: #2A6F62;        /* acción primaria (5.9:1 con blanco) */
  --nexus-teal-700: #1F5449;    /* hover */
  --nexus-teal-50: #E6F0EE;     /* fondo de seleccionado */
  --nexus-green: #4C8A45;       /* finalizado */

  /* Compatibilidad con nombres existentes */
  --brand-100: var(--nexus-teal-50);
  --brand-300: #A8C3CF;
  --brand-600: var(--nexus-teal);
  --brand-700: var(--nexus-teal-700);

  /* Navegación */
  --nav-bg: var(--nexus-petrol);
  --nav-ink: #C9D8DF;
  --nav-ink-muted: #A8C3CF;
  --nav-active-bg: var(--nexus-petrol-700);
  --nav-active-ink: #FFFFFF;

  /* Estados (solo para puntos/íconos, NO para fondos) */
  --status-backlog: #9AA4AC;
  --status-progress: var(--nexus-teal);
  --status-review: #B98A1E;
  --status-done: var(--nexus-green);
  --status-late-ink: #9B3B32;   /* texto de atraso (6.9:1) */
  --priority-high-ink: #7A4A12;

  /* Compatibilidad semántica */
  --success-600: var(--nexus-green);
  --success-100: #E8F1E6;
  --warning-600: #B98A1E;
  --warning-100: #FAF3E2;
  --danger-600: var(--status-late-ink);
  --danger-100: #F8EDEC;
  --neutral-600: var(--ink-500);

  /* Colores de identificación de proyecto (cuadrito 8px) */
  --tag-1: #2A6F62; --tag-2: #4A6B7A; --tag-3: #0F3446;
  --tag-4: #7A5C3E; --tag-5: #4C8A45; --tag-6: #5C6670;

  /* Escala tipográfica (solo estos valores) */
  --text-xs: 11px;   /* overlines en mayúscula */
  --text-sm: 12px;   /* metadatos, IDs, fechas */
  --text-md: 13px;   /* labels, celdas secundarias */
  --text-base: 14px; /* cuerpo */
  --text-lg: 16px;   /* nombre de marca, subtítulos */
  --text-xl: 20px;
  --text-2xl: 26px;  /* título de página */

  /* Espaciado (sin cambios) */
  --space-1: 4px; --space-2: 8px; --space-3: 12px; --space-4: 16px;
  --space-5: 20px; --space-6: 24px; --space-8: 32px; --space-10: 40px;

  /* Radios */
  --radius-sm: 4px;   /* chips de código */
  --radius-md: 6px;   /* botones, inputs, tarjetas kanban */
  --radius-lg: 8px;   /* contenedores, tablas, columnas */
  --radius-full: 999px;

  /* Sombras (mínimas) */
  --shadow-card: none;                                   /* se usa borde, no sombra */
  --shadow-floating: 8px 0 24px rgba(15, 52, 70, 0.12);  /* paneles flotantes */
  --shadow-control: 0 1px 2px rgba(15, 52, 70, 0.15);    /* segmento activo */

  --focus-ring: 0 0 0 2px #FFFFFF, 0 0 0 4px var(--nexus-teal);
  --transition-base: 150ms ease;

  /* Layout */
  --rail-w: 64px;
  --panel-w: 272px;        /* panel de espacios y proyectos */
  --topbar-h-mobile: 56px;
  --tabbar-h-mobile: 68px;
  --drawer-w-mobile: 316px;
  --content-pad-x: 40px;
}

/* Modo oscuro opcional — derivado del petróleo del logo, no negro azulado */
[data-theme='dark'] {
  color-scheme: dark;
  --surface-bg: #0B2533;
  --surface-card: #0F3446;
  --surface-elevated: #143D52;
  --surface-muted: #123A4E;
  --surface-hover: #174458;
  --ink-900: #EEF3F5;
  --ink-700: #C9D8DF;
  --ink-500: #A8C3CF;
  --ink-300: #A8C3CF;
  --line-200: #23536A;
  --line-100: #1A475C;
  --track-gray: #23536A;
  --nav-bg: #082230;
  /* --nexus-teal se mantiene #2A6F62: texto blanco 5.9:1 (un teal más claro bajaría a 3.6:1) */
  --nexus-teal-700: #357F71;
  --nexus-teal-50: #173F4A;
  --status-late-ink: #E39A92;
}
```

### 2.3 Cambios asociados
1. `main.jsx:538-542` → default claro:
   ```js
   const [darkMode, setDarkMode] = useState(() => localStorage.getItem('nexus-theme') === 'dark');
   ```
2. `apps/web/index.html`: eliminar el bloque `<style>` con `--bg/--panel/...` y el degradado del `body` (dejar solo `meta` y `link`).
3. Regla: **prohibido** hex en JSX y en CSS fuera de `tokens.css`. Agregar un chequeo en CI (ver §10).

---

## 3. Tipografía

| Uso | Tamaño | Peso | Color |
|---|---|---|---|
| Título de página (`h1`) | 26px | 600 | `--ink-900` |
| Subtítulo de página | 14px | 400 | `--ink-500` |
| Nombre de proyecto / título de tarjeta | 14px | 600 / 500 | `--ink-900` |
| Cuerpo | 14px | 400 | `--ink-900` |
| Encabezado de tabla, labels | 12–13px | 500 | `--ink-500` |
| IDs (`P7`, `P1-T6`), fechas, contadores | 12px | 500 | `--ink-500` |
| Overline de sección ("GESTIÓN") | 11px | 600, `letter-spacing: .08em`, mayúsculas | `--nav-ink-muted` |
| KPI | 26px | 600 | `--ink-900` |

- Mayúsculas **solo** en overlines. Los nombres de proyecto se muestran en *Sentence case* (hoy están en MAYÚSCULAS en la base de datos: normalizar al mostrar o al guardar).
- Máx. 2 pesos por bloque.

---

## 4. Layout general (shell)

```
ESCRITORIO (≥ 1024px)
┌──────┬──────────────┬───────────────────────────────────────────┐
│ Riel │ Panel        │ Contenido (fluido, padding 32–40px)       │
│ 64px │ 272px        │  Encabezado de página                     │
│ ☰    │ Espacio      │  Barra de filtros                         │
│ ▣ ✓  │ Buscar       │  Vista (tabla / tablero / gantt)          │
│ ▦ ≡  │ Proyectos    │                                           │
└──────┴──────────────┴───────────────────────────────────────────┘

MÓVIL (< 768px)
┌──────────────────────────┐
│ ☰ [logo] Título    🔍 (J) │  barra superior 56px, petróleo
├──────────────────────────┤
│ Contenido en 1 columna   │  padding 16px
│ (tarjetas / lista)       │
│                     [+]  │  botón flotante 56px (acción primaria)
├──────────────────────────┤
│ Proy Tareas Tabl Cron Ag │  barra inferior 68px, blanca
└──────────────────────────┘
```

- Contenido: `flex: 1; min-width: 0`. **Eliminar** `maxWidth: '980px'` (`main.jsx:4704`).
- Tablas y tableros anchos: contenedor con `overflow-x: auto`, nunca scroll horizontal de la página.

### 4.1 Breakpoints
| Rango | Nombre | Navegación | Panel de proyectos |
|---|---|---|---|
| ≥ 1280px | `desktop` | Riel + panel acoplado | Abierto por defecto (respeta preferencia guardada) |
| 1024–1279px | `laptop` | Riel + panel acoplado | **Cerrado** por defecto; ☰ lo abre |
| 768–1023px | `tablet` | Riel 64px | Se abre **sobre** el contenido (overlay con fondo `rgba(15,52,70,.45)`) |
| < 768px | `mobile` | Barra superior + barra inferior | Drawer de 316px desde la izquierda (§7.8) |

```css
/* styles/shell.css */
:root { --bp-mobile: 768px; --bp-laptop: 1024px; --bp-desktop: 1280px; }
@media (max-width: 1279px) { .app-shell[data-panel="auto"] .side-panel { display: none; } }
@media (max-width: 1023px) { .side-panel { position: fixed; inset: 0 auto 0 64px; z-index: 40; box-shadow: var(--shadow-floating); } }
@media (max-width: 767px)  { .rail { display: none; } .mobile-topbar, .mobile-tabbar { display: flex; } }
```
- Hook sugerido: `useBreakpoint()` con `matchMedia` para decidir qué shell renderizar; evita duplicar lógica en CSS y JSX.

---

## 5. Navegación de escritorio — decisión final: **Opción A + riel de íconos de la C**

Se combinan la **estructura** de la opción A (riel + panel acoplado que se puede ocultar) con el **riel** de la opción C (todas las secciones como íconos). Las opciones B y C quedan en el lienzo solo como referencia histórica.

### 5.1 Riel global (`<Rail />`) — 64px, fondo `--nav-bg`
De arriba hacia abajo:

| Elemento | Detalle |
|---|---|
| Logo | `/logobase01.png`, 36×36, radio 8px, margen inferior 14px |
| Botón ☰ | Muestra/oculta el panel. 44×44. Activo (panel abierto): fondo `--nexus-teal-50`, ícono `--nexus-petrol`. `aria-expanded`, `aria-controls="side-panel"` |
| Divisor | 28×1px `--nexus-petrol-500` |
| Secciones (orden fijo) | Mis proyectos · Mis tareas · Agenda · Tablero · Cronograma · Directorio |
| Espaciador | `flex: 1` |
| Ayuda | ícono `?` |
| Avatar | 36px, abre menú de cuenta (perfil, tema claro/oscuro, cerrar sesión) |

- Cada sección: `<a>` de 44×44, radio 8px, ícono de trazo 20px/1.8. Inactivo `--nav-ink`; activo fondo `--nav-active-bg`, ícono blanco, `aria-current="page"`.
- **Tooltip obligatorio** con el nombre (`title` + `aria-label`); recomendado un tooltip propio a la derecha con 300ms de retardo.
- Íconos (paths de 24×24 usados en el prototipo):
  - Mis proyectos: carpeta · Mis tareas: casilla con check · Agenda: calendario · Tablero: 3 columnas · Cronograma: 3 barras escalonadas · Directorio: dos personas.
  - Se sugiere usar **Lucide** (`lucide-react`): `Folder`, `SquareCheck`, `Calendar`, `Columns3`, `ChartGantt`, `Users`, `Menu`, `CircleHelp`.

### 5.2 Panel de espacios y proyectos (`<SidePanel id="side-panel" />`) — 272px, fondo `--surface-card`, borde derecho `--line-200`
1. Marca: "Nexus" 16px/600 + "Track your goals" 12px `--ink-500`.
2. **Segmentado Espacio**: Todos / Trabajo / Personal (`aria-pressed`). Cambia el filtro **global** de la app.
3. Buscador de proyectos (36px).
4. "Todos los proyectos" (ítem activo por defecto en Tablero/Cronograma): fondo `--nexus-teal-50`, texto `--nexus-teal-700`, 600.
5. Grupo **Trabajo · {organización}**: ítems de 36px con cuadro 24px de color (`--tag-n`) y el código (`P7`) en blanco, nombre truncado, % de avance a la derecha. Clic → abre ese proyecto en la vista actual (Tablero o Cronograma).
6. Grupo **Personal**: proyectos personales; si no hay, botón con borde punteado "Crear proyecto personal".
7. Los grupos se ocultan según el Espacio elegido (Trabajo oculta Personal y viceversa).

### 5.3 Comportamiento
- Estado del panel persistido en `localStorage('nexus-panel')` = `open | closed`; por defecto según breakpoint (§4.1).
- Vistas que necesitan ancho (Cronograma) pueden abrir con el panel **cerrado** por defecto (como en el prototipo).
- Atajo de teclado sugerido: `[` alterna el panel (anunciarlo en el tooltip del ☰).
- Transición: `width 180ms ease` o `transform` en el panel; respetar `prefers-reduced-motion`.

```jsx
// components/layout/AppShell.jsx (esqueleto)
export function AppShell({ view, onNavigate, space, onSpaceChange, projects, children }) {
  const bp = useBreakpoint();               // 'mobile' | 'tablet' | 'laptop' | 'desktop'
  const [panel, setPanel] = usePersistentState('nexus-panel', bp === 'desktop' ? 'open' : 'closed');
  if (bp === 'mobile') return <MobileShell {...{ view, onNavigate, space, onSpaceChange, projects }}>{children}</MobileShell>;
  return (
    <div className="app-shell" data-panel={panel}>
      <Rail view={view} onNavigate={onNavigate} panelOpen={panel === 'open'} onTogglePanel={() => setPanel(panel === 'open' ? 'closed' : 'open')} />
      {panel === 'open' && <SidePanel space={space} onSpaceChange={onSpaceChange} projects={projects} overlay={bp === 'tablet'} />}
      <main className="app-content">{children}</main>
    </div>
  );
}
```

---

## 6. Componentes

Ubicación sugerida: `apps/web/src/components/ui/` (ampliar el `ui.js` existente y **usarlo**).

### 6.1 Button
| Variante | Fondo | Texto | Borde | Uso |
|---|---|---|---|---|
| `primary` | `--nexus-teal` | `#FFF` | — | 1 por vista ("Nuevo proyecto", "Nueva tarea") |
| `secondary` | `--surface-card` | `--ink-900` | `1px --line-200` | "Estatus del proyecto", "Ir a hoy" |
| `ghost` | transparente | `--ink-500` | — | "Añadir tarea", "Limpiar" |
| `icon` | transparente | `--ink-500` | — | 32×32, **`aria-label` obligatorio** |

Alto 40px (header) / 36px (barras de filtro). Radio `--radius-md`. Focus: `--focus-ring`.

### 6.2 StatusDot (reemplaza los chips de estado)
```jsx
const STATUS = {
  backlog:    { label: 'Pendiente',    color: 'var(--status-backlog)' },
  in_progress:{ label: 'En curso',     color: 'var(--status-progress)' },
  review:     { label: 'En revisión',  color: 'var(--status-review)' },
  execution:  { label: 'En ejecución', color: 'var(--status-progress)' },
  preproject: { label: 'Preproyecto',  color: 'var(--status-backlog)' },
  completed:  { label: 'Finalizado',   color: 'var(--status-done)' },
  done:       { label: 'Hecho',        color: 'var(--status-done)' },
};
export function StatusDot({ status }) {
  const s = STATUS[status] ?? STATUS.backlog;
  return (
    <span className="ui-status">
      <span className="ui-status__dot" style={{ '--dot': s.color }} aria-hidden="true" />
      {s.label}
    </span>
  );
}
```
```css
.ui-status{display:inline-flex;align-items:center;gap:8px;font-size:var(--text-md);color:var(--ink-700);white-space:nowrap}
.ui-status__dot{width:8px;height:8px;border-radius:50%;background:var(--dot)}
```

### 6.3 ProgressBar
- Alto **4px** (tabla, KPI) / 12px (Gantt). Track `--track-gray`, relleno `--nexus-teal`; al 100% `--nexus-green`.
- Siempre acompañada del % en texto y "x de y tareas" debajo (12px `--ink-500`).
- `role="progressbar" aria-valuenow aria-valuemin="0" aria-valuemax="100"`.

### 6.4 Avatar / AvatarGroup
- 26px (tabla), 22px (tarjeta kanban), 34px (filtro de personas). Iniciales 2 letras, borde 2px del color de fondo, solapamiento `-6px`.
- Paleta de avatares derivada del logo: `#2A6F62, #0F3446, #4A6B7A, #7A5C3E, #5C6670` (asignar por hash del nombre).
- `title` y `aria-label` con el nombre completo.

### 6.5 ProjectMark (identificador de proyecto)
- Cuadrito 8×8, radio 2px, color `--tag-n` + nombre en 12px `--ink-500`.
- En listas del panel: cuadro 22–24px con el código (`P7`) en blanco.

### 6.6 Segmented / Tabs
- **Segmentado** (Espacio, escala del Gantt): contenedor `--surface-muted`, opción activa en blanco con `--shadow-control`, `aria-pressed`.
- **Tabs** (Mi rol: Todos · Soy encargado · Colaboro): subrayado 2px `--nexus-teal` en la activa, `role="tablist"/"tab"`, `aria-selected`.

### 6.7 KPI strip
Una sola tarjeta con 4 celdas separadas por bordes (no 4 tarjetas): Proyectos activos · Tareas abiertas · Fuera de fecha (texto rojo ladrillo pequeño) · Avance general (+ barra 4px). Los valores se **calculan** del filtro activo.

### 6.8 EmptyState
Texto centrado + 1 botón secundario. Ej. espacio Personal vacío: "Aún no tienes proyectos personales" + "Crear proyecto personal".

---

## 7. Vistas

### 7.1 Mis proyectos (`activeView === 'portfolio'`, hoy `main.jsx:2234`)
Reemplazar las tarjetas altas (~220px) por **tabla**:

| Columna | Contenido |
|---|---|
| Proyecto | Código 12px + nombre (enlace al tablero) + descripción 1 línea con `text-overflow: ellipsis` |
| Espacio | "Trabajo · Kanban" / "Personal · PMI" |
| Estado | `StatusDot` |
| Avance | `ProgressBar` 4px + % + "x de y tareas" |
| Equipo | `AvatarGroup` |
| Fecha meta | Fecha; si atrasado, en `--status-late-ink` + "N días de atraso" |
| Acciones | Botón `icon` ⋯ con menú (Editar, Estatus y resumen, Eliminar). **Eliminar sale del flujo directo** (hoy está pegado a "Editar"). |

Encima: título + fecha de hoy, buscador + "Nuevo proyecto", KPI strip, tabs de rol + select de etapa.
Mantener la vista de tarjetas actual como alternativa solo si se usa; si no, eliminarla.

### 7.2 Tablero (`activeView === 'kanban'`, `main.jsx:3522`)
- Columnas `--surface-muted`, radio 8px, encabezado = punto de estado + nombre + contador.
- Tarjeta blanca, borde `1px #E1E5E6`, **sin sombra**, padding 12/14px. Orden interno: `ProjectMark` → título (14px/500) → fila con ID · prioridad (solo si es Alta: flecha ↑ + "Alta" en `--priority-high-ink`) · fecha · avatares a la derecha.
- Tareas en "Hecho": título tachado y en `--ink-500`.
- Fecha vencida: "Venció 2 oct" en `--status-late-ink`.
- Filtros: buscador, avatares clicables (atenúa los no seleccionados a 0.55), select de proyecto, toggle "Solo vencidas", "Limpiar".
- Quitar el "Volver a Mis Proyectos" duplicado; usar breadcrumb.

### 7.3 Cronograma (vista "Cronograma & Avance")
- Columna fija 300px: código + nombre + `StatusDot` + "N días de atraso".
- Escala semanal; líneas verticales `#F0F2F2`.
- Barra 12px: fondo claro del estado + relleno con el % real; rombo 8px `--ink-900` en la fecha meta; % a la derecha de la barra.
- Retraso: **línea punteada 2px** `--status-late-ink` desde la fecha meta hasta hoy.
- Línea de **Hoy** 1px `--nexus-petrol` con etiqueta "Hoy 20 oct" en el encabezado.
- Segmentado Días / Semanas / Meses + botón "Ir a hoy". Leyenda abajo.
- Reutilizar `src/styles/gantt.css` migrando colores a tokens.

### 7.4 Mis tareas (nueva vista)
Referencia: `MisTareas.dc.html` (escritorio) y `MobileTareas.dc.html` (móvil).
- **Agrupación por defecto: por proyecto.** Segmentado "Agrupar por: Proyecto · Fecha · Estado".
  - Fecha = Vencidas / Hoy / Esta semana / Después / Cerradas.
  - Estado = Pendiente / En curso / Validación / Cerrada.
- Filtros: "Asignadas a mí" (por defecto apagado: se ven todas las tareas de los proyectos del usuario) y "Mostrar cerradas" (apagado).
- Cada grupo es una tarjeta con cabecera (cuadro del proyecto o punto de color + nombre + "N tareas").
- Fila (escritorio, grilla `32px 64px 1fr 120px 60px 80px 110px`): círculo de cierre · código · título (+ "Cierre: …" si está cerrada) · estado · "↑ Alta" · avatares · fecha ("Venció 2 oct" en rojo ladrillo).

#### 7.4.1 Regla de negocio: **cierre obligatorio con registro**
> Una tarea **no puede pasar a "Hecho/Cerrada" sin un registro final** que diga qué se hizo o justifique por qué se finaliza.

- Disparadores: clic en el círculo de la fila (Mis tareas), mover la tarjeta a "Hecho" (Tablero, escritorio o botón Mover en móvil), o cambiar el estado en cualquier formulario. **Todos** abren el mismo formulario de cierre; si se cancela, la tarea no cambia de estado.
- Formulario de cierre:
  - Escritorio: se expande **en línea** bajo la fila (no requiere modal ni panel).
  - Móvil: **hoja inferior** (bottom sheet) con `role="dialog"`.
  - Tablero de escritorio: al soltar en "Hecho", abre el mismo formulario en un diálogo pequeño; si se cancela, la tarjeta vuelve a su columna.
- Campos:
  1. **Tipo de cierre** (obligatorio, por defecto "Completada"): Completada · Cancelada · Reemplazada por otra tarea. Si es "Reemplazada", pedir el código de la tarea que la sustituye (ej. `P1-T2`).
  2. **Detalle del cierre** (obligatorio): mínimo **20 caracteres** sin contar espacios iniciales/finales; contador visible "Mínimo 20 caracteres · n/20".
- Botón "Cerrar tarea" deshabilitado hasta cumplir la regla. La validación **también se aplica en la API** (no solo en la UI).
- Las tareas cerradas muestran el registro debajo del título; las cerradas antes de esta regla muestran "Sin registro (dato anterior a la regla de cierre)".
- **Reabrir** una tarea cerrada conserva el registro anterior en el historial (`progressLogs`).

```ts
// apps/api/src/data/store.ts — WorkItem (el campo completionReport YA existe en db.json)
completionReport: string;                         // obligatorio si status === 'done'
closeType?: 'completed' | 'cancelled' | 'replaced';
replacedBy?: string;                              // código de tarea, si closeType === 'replaced'
closedAt?: string;                                // ISO
closedBy?: string;                                // id de usuario
// Validación en PATCH /work-items/:id
if (body.status === 'done' && (body.completionReport ?? '').trim().length < 20) {
  return res.status(422).json({ error: 'completionReport_required', min: 20 });
}
```

### 7.5 Agenda (escritorio)
Referencia: `Agenda.dc.html`.
- Se mantienen las **tres vistas: Día · Semana · Mes** (pestañas), con navegación ‹ › y botón "Hoy".
  - **Mes**: grilla de 6 semanas (lunes a domingo). Cada día muestra hasta 3 elementos y "+N más". Hoy = número en círculo petróleo.
  - **Semana**: 7 columnas; los días sin elementos dicen "Sin tareas".
  - **Día**: lista del día. Si está vacío, muestra un estado vacío con el número de vencidas y enlace a Mis tareas, más una lista "Próximo".
- Elementos que se muestran:
  - Tareas abiertas con fecha límite (cuadrito del color del proyecto + código + título).
  - **Fechas meta de proyectos** (rombo + "Meta P7").
- Columna derecha fija (300px): **"Vencidas sin cerrar"**, siempre visible.
- **"Compromisos" se eliminan** de la Agenda por ahora (decisión del 20 oct): hoy no tienen una definición clara. Quitar el botón "Agregar compromiso" y el filtro asociado del código actual (`activeView === 'agenda'`, `main.jsx:2993`).

### 7.6 Directorio (escritorio)
Referencia: `Directorio.dc.html`.
- Tabla: Persona (avatar + nombre + correo) · Tipo (punto + Administrador / Colaborador / Proveedor) · Organización/área · Tareas abiertas (calculado) · Acceso a Nexus (Activo / Sin acceso).
- Pestañas por tipo con contador, buscador y botón primario "Agregar persona".
- Menú ⋯ por fila: Editar datos · Generar acceso / Restablecer contraseña · Ver tareas asignadas · **Eliminar del directorio** (texto rojo ladrillo, siempre con confirmación).
- **Permisos (supuesto, la pregunta quedó sin respuesta):** solo el rol **Administrador** ve las acciones de acceso y eliminación. Para los demás, el menú muestra solo "Ver tareas asignadas". La regla se valida también en la API.
- Aviso de **posible duplicado** cuando dos registros se parecen (ver §8.1).

### 7.7 Formularios: Nuevo proyecto / Nueva tarea
Referencias: `FormPanel.dc.html` (opción 1) y `FormModal.dc.html` (opción 2). **Decisión pendiente del usuario tras compararlas.**

| | Opción 1 · Panel lateral derecho (520px) | Opción 2 · Ventana modal (640px) |
|---|---|---|
| Contexto | Se sigue viendo parte de la página detrás | Tapa el centro de la pantalla |
| Formularios largos | Mejor: altura completa con scroll interno | Limitado a ~820px de alto |
| Metodología | 2×2 tarjetas | 4 en fila (más compacto) |
| Reutilización | Sirve también para "ver/editar detalle" de una tarea | Mejor para acciones cortas |
| Tablet | Se adapta a 100% de ancho bajo 768px | Requiere otro layout |

- **Campos obligatorios (decididos):**
  - Proyecto: Nombre · Espacio · Metodología · Fecha meta.
  - Tarea: Título · Proyecto · Responsable · Fecha límite.
- Opcionales:
  - Proyecto: fecha de inicio, descripción y equipo.
  - Tarea: prioridad (por defecto Media) y descripción.
- Pie fijo con contador "n de 4 campos obligatorios" y botón primario deshabilitado hasta completar.
- Ambos: `role="dialog"`, `aria-modal`, foco inicial en el primer campo, `Esc` cierra y avisa si hay cambios sin guardar.
- **Móvil: siempre pantalla completa** (`MobileNuevaTarea.dc.html`). Inputs de 48px y texto de 16px, para que iOS no haga zoom.

---

## 7.8 Vista móvil (obligatoria, < 768px)

> Referencia: fila "Vista móvil" del lienzo (390×844). La app debe ser completamente usable en teléfono; no es una versión reducida.

### 7.8.1 Shell móvil (`<MobileShell />`)
| Pieza | Especificación |
|---|---|
| **Barra superior** | 56px, `--nav-bg`. Izquierda: ☰ (44×44, abre el drawer) + logo 28px + título de la vista (16px/600 blanco). Derecha: buscar (44×44) + avatar 32px. |
| **Barra inferior** | 68px, fondo blanco, borde superior `--line-200`, `padding-bottom: env(safe-area-inset-bottom)`. 5 pestañas: **Proyectos · Tareas · Tablero · Cronograma · Agenda**. Ícono 22px + etiqueta 11px. Activa: `--nexus-teal`, peso 600, `aria-current="page"`. Inactiva: `--ink-500`. |
| **Botón flotante (FAB)** | 56×56, radio 16px, `--nexus-teal`, ícono +, `bottom: 84px; right: 16px`. Acción primaria de la vista ("Nuevo proyecto", "Nueva tarea"). `aria-label` obligatorio. |
| **Drawer** | 316px desde la izquierda, fondo blanco, sombra `8px 0 24px rgba(15,52,70,.2)`, fondo detrás `rgba(15,52,70,.45)` (toque fuera = cerrar). Cabecera petróleo con logo, "Nexus", usuario y ✕. Contenido = mismo panel de escritorio (§5.2): Espacio, buscador, Todos los proyectos, Trabajo, Personal. Pie: Directorio · Ayuda · Cerrar sesión. |
| Contenido | 1 columna, `padding: 16px 16px 88px` (deja espacio a la barra inferior y al FAB). |

- **Directorio** no está en la barra inferior: se accede desde el drawer.
- Drawer accesible: `role="dialog"`, `aria-modal="true"`, foco atrapado, cierre con `Esc`/botón atrás del navegador, foco devuelto al ☰.
- Objetivos táctiles **≥ 44px** en todo (ítems del drawer, pestañas, botones de tarjeta).

### 7.8.2 Mis proyectos (móvil)
- Segmentado Espacio arriba (36px de alto).
- KPIs en **grilla 2×2** dentro de una sola tarjeta (Activos, Tareas abiertas, Fuera de fecha en rojo ladrillo, Avance).
- Fila "N proyectos" + botón secundario **Filtrar** (abre hoja inferior con Rol y Etapa).
- La tabla se convierte en **tarjetas apiladas** (toda la tarjeta es enlace al tablero del proyecto):
  1. Cuadro 28px con código + nombre (2 líneas máx.) + `StatusDot` · método + chevron ›.
  2. Barra de avance 4px + %.
  3. "x de y tareas" · fecha meta o "N días de atraso" (rojo ladrillo) · avatares 22px.
- Estado vacío del espacio Personal con botón "Crear proyecto personal".

### 7.8.3 Tablero (móvil)
- **Una columna a la vez**: pestañas desplazables horizontalmente (Pendiente · En curso · Validación · Hecho) con punto de estado y contador; subrayado teal en la activa (`role="tablist"`).
- Encima: select de proyecto + toggle "Vencidas".
- Tarjetas a todo el ancho (título 15px). Botón **Mover** (32px) en cada tarjeta abre una hoja inferior para cambiar de columna — **reemplaza el drag & drop**, que es poco fiable en táctil. Opcional: deslizar horizontalmente entre columnas.
- Abre por defecto en "En curso".

### 7.8.4 Cronograma (móvil)
- Sin tabla de dos paneles. Cada proyecto es una **tarjeta** con: código + nombre + % · **mini línea de tiempo** (barra 8px con relleno de avance, rombo de fecha meta, línea punteada de atraso y línea vertical de Hoy) · estado + rango de fechas + atraso.
- Escala por meses (Ago–Nov) fija en la cabecera, con la etiqueta "Hoy 20 oct".
- Orden: atrasados primero, luego por fecha meta.

### 7.8.5 Mis tareas (móvil)
- Segmentado Proyecto / Fecha / Estado. Grupos con cabecera fuera de la tarjeta.
- Cada fila: círculo de cierre con área táctil de 44px, título, y "código · estado · fecha".
- Al tocar el círculo se abre la **hoja de cierre**: tipo de cierre en chips, textarea de 15px, contador, botón "Cerrar tarea" de 48px de alto y "Cancelar".
- FAB "+" → Nueva tarea a pantalla completa.

### 7.8.6 Agenda (móvil)
- Pestañas Día / Semana / Mes.
- **Mes**: calendario compacto (celdas de 44px) con un punto en los días que tienen elementos. Al tocar un día, la lista de ese día aparece debajo.
- **Semana**: lista de 7 días.
- **Día**: lista de hoy.
- Siempre al final: acceso "N tareas vencidas sin cerrar" → Mis tareas.

### 7.8.7 Directorio (móvil)
- Se llega desde el drawer.
- Chips de tipo desplazables, y tarjetas con avatar de 40px, tipo · área, tareas abiertas y acceso. El menú ⋮ abre una hoja inferior.
- FAB "Agregar persona" (solo administradores).

### 7.8.8 Tablet (768–1023px vertical, 1024–1279px horizontal)
Referencias: `TabletProyectos.dc.html` (820×1180) y `TabletTablero.dc.html` (1180×820).
- Se mantiene el **riel de 64px**. El panel de proyectos se abre **superpuesto** (300px, con sombra y fondo `rgba(15,52,70,.45)`) y se cierra al tocar fuera.
- Vertical: la tabla de proyectos pasa a **filas de 3 columnas** (proyecto + estado · avance · meta) con altura mínima de 72px; KPIs en 4 columnas compactas.
- Horizontal: el tablero mantiene las 4 columnas con tarjetas compactas.
- Objetivos táctiles de 44px, igual que en móvil.

---

## 8. Modelo de datos: espacio Personal / Trabajo

Hoy los proyectos no distinguen espacio. Propuesta mínima compatible con `db.json` / `store.ts`:

```ts
// apps/api/src/data/store.ts — Project
space: 'work' | 'personal';   // default 'work' para los existentes
organization?: string;        // ej. 'Grupo Extra' (se muestra en el panel C)
```
- Migración: asignar `space: 'work'` a los 7 proyectos actuales.
- API: `GET /projects?space=work|personal`.
- Front: `const [space, setSpace] = useState(localStorage.getItem('nexus-space') ?? 'all')` y filtrar en todas las vistas (proyectos, tablero, cronograma, agenda, KPIs).
- En Prisma ya existe `Workspace` (`schema.prisma:36-53`); si se migra a Prisma, mapear "Trabajo/Personal" a dos workspaces por usuario.

### 8.1 Calidad de datos detectada en `db.json` (corregir antes o durante la migración)
| Hallazgo | Evidencia | Acción sugerida |
|---|---|---|
| Persona duplicada | "Jean Paul" y "Jean Paul TI" existen como dos registros del directorio y ambos tienen tareas asignadas | Unificar en un solo registro y reasignar tareas; las tareas guardan nombres en texto (`assignees: ["Jean Paul TI"]`) → migrar a **ids** del directorio |
| Tipo incorrecto | "Pasarela BAC Credomatic" está como *colaborador / Equipo interno* | Cambiar a **Proveedor** |
| Tareas cerradas sin registro | La mayoría de tareas `done` tienen `completionReport: ""` (solo P1-T1 y P1-T3 lo tienen) | Conservar tal cual y mostrarlas como "Sin registro (dato anterior a la regla)"; la regla aplica desde la implementación |
| Responsables por nombre | `assignee` es texto libre ("Jorge, Josué B") además de `assignees[]` | Eliminar `assignee` y usar solo `assignees` con ids |

---

## 9. Accesibilidad (criterios obligatorios)

- [ ] Contraste ≥ 4.5:1 en todo texto (los tokens de §2 ya cumplen; no usar `--ink-500` sobre `--surface-muted` en tamaños < 12px).
- [ ] Todo botón de ícono con `aria-label` (y `title` como tooltip).
- [ ] Navegación: `<nav aria-label>`, ítem activo con `aria-current="page"`.
- [ ] Segmentados con `aria-pressed`; tabs con `role="tab"` + `aria-selected`.
- [ ] Panel colapsable: `aria-expanded` + `aria-controls` en el ☰; en tablet (overlay) y en el drawer móvil: focus trap y cierre con `Esc`.
- [ ] Objetivos táctiles ≥ 36px (filtros) / 40px (navegación).
- [ ] Estados nunca comunicados solo por color (siempre punto + texto).
- [ ] `:focus-visible` con `--focus-ring` en botones, enlaces e inputs.

---

## 10. Plan de implementación por fases

| Fase | Trabajo | Archivos | Resultado verificable |
|---|---|---|---|
| **0. Seguridad** (urgente) | Ver §11 | `apps/api/data/db.json`, `.gitignore`, `store.ts` | Sin contraseñas en el repo |
| **1. Tokens** | Reemplazar variables (§2.2), default claro, limpiar `index.html` | `styles/tokens.css`, `main.jsx:538`, `index.html` | La app completa cambia de paleta sin romper vistas |
| **2. Shell escritorio + móvil** | Quitar `top-navbar`; crear `AppShell`, `Rail`, `SidePanel`, `MobileShell` (`MobileTopBar`, `MobileTabBar`, `MobileDrawer`, `Fab`), hooks `useBreakpoint` y `usePersistentState`; contenido fluido | `components/layout/*.jsx`, `hooks/*.js`, `styles/shell.css`; borrar header en `main.jsx:2078-2230` y `maxWidth` en `:4704` | Riel + panel colapsable en escritorio; barra superior + pestañas + drawer en 390px |
| **3. Componentes** | `Button`, `StatusDot`, `ProgressBar`, `Avatar(Group)`, `ProjectMark`, `Segmented`, `Tabs`, `EmptyState` | `components/ui/*.jsx`, `styles/ui.css` | Página `DesignSystemDemo.jsx` mostrando todos |
| **4. Separar vistas** | Extraer cada `activeView` a su archivo; estado compartido en un contexto (`NexusContext`) o hooks (`useProjects`, `useWorkItems`) | `views/PortfolioView.jsx`, `KanbanView.jsx`, `AgendaView.jsx`, `DirectoryView.jsx`, `TimelineView.jsx` | `main.jsx` < 300 líneas |
| **5. Rediseño de vistas** | Aplicar §7 **y §7.8 en la misma entrega** (cada vista con su variante móvil: tabla→tarjetas, tablero→una columna con pestañas + "Mover", Gantt→tarjetas con mini línea de tiempo) | `views/*`, `styles/portfolio.css`, `kanban.css`, `gantt.css` | Coincide con el prototipo en 1440px y 390px |
| **6. Espacios** | Campo `space` + filtro global | `store.ts`, `main.ts` (API), `SidePanel.jsx`, `MobileDrawer.jsx` | Selector Todos/Trabajo/Personal filtra todo |
| **6b. Cierre obligatorio y datos** | Regla de cierre en UI y API (§7.4.1); quitar "compromisos" de Agenda; unificar duplicados y migrar responsables a ids (§8.1); permisos de administrador en Directorio | `store.ts`, `main.ts`, `views/TasksView.jsx`, `KanbanView.jsx`, `AgendaView.jsx`, `DirectoryView.jsx` | Test de API: `PATCH status=done` sin registro → `422` |
| **7. Limpieza** | Eliminar `style={{}}` inline, hex sueltos y `!important` | todos | Chequeos de §10.1 en verde |

### 10.1 Chequeos automáticos sugeridos (CI o `npm run lint:ui`)
```bash
# Hex fuera de tokens.css (debe dar 0)
grep -rnoE "#[0-9a-fA-F]{6}\b" apps/web/src --include=*.jsx --include=*.css | grep -v tokens.css | wc -l
# Estilos inline (meta: 0, salvo variables CSS dinámicas como --dot o width de barras)
grep -c "style={{" apps/web/src/**/*.jsx
# !important (meta: 0)
grep -rc "!important" apps/web/src/styles
# font-size fuera de la escala (meta: solo var(--text-*))
grep -rhoE "font-size: *[0-9.]+(px|rem)" apps/web/src/styles | sort -u
```

---

## 11. Seguridad — acción inmediata

`apps/api/data/db.json` contiene usuarios con **contraseñas en texto plano** (p. ej. `"password": "123456"`) y el repositorio `CaldeCR/Nexus` es **público**; la app está desplegada.

1. Cambiar las contraseñas de los usuarios en producción **ya**.
2. Quitar `apps/api/data/db.json` del repo: agregar a `.gitignore`, commitear un `db.example.json` sin credenciales.
3. Purgar el historial (`git filter-repo --path apps/api/data/db.json --invert-paths`) y forzar push; asumir que lo publicado ya está comprometido.
4. Guardar contraseñas con **argon2id** o **bcrypt** (costo ≥ 12) en `store.ts`/`main.ts`; nunca devolver el campo `password` en respuestas de la API.
5. Revisar si `.env` o tokens se subieron en algún commit.

---

## 12. Brechas y supuestos

| Tipo | Detalle |
|---|---|
| Supuesto | Datos del prototipo tomados de `db.json` del repo; pueden diferir de producción. |
| Supuesto | "Track your goals" como subtítulo de marca (viene del `<title>` actual). |
| Decidido | Panel lateral: Opción A con riel de íconos de la C (§5). |
| Decidido | Mis tareas agrupada por proyecto, con filtro para ver por fecha o estado. |
| Decidido | Cierre de tarea solo con registro final obligatorio (§7.4.1). |
| Decidido | Agenda con las 3 vistas (Día, Semana, Mes); "compromisos" omitidos por ahora. |
| Decidido | Campos obligatorios de proyecto y tarea (§7.7). |
| Decidido | Multiplataforma: escritorio, tablet y móvil dibujados en el lienzo. |
| **Pendiente (usuario)** | Elegir formulario de escritorio: **panel lateral** o **modal** (§7.7). |
| Supuesto | Solo administradores gestionan accesos y eliminan personas del Directorio (pregunta sin respuesta). |
| Supuesto | Mínimo de 20 caracteres para el registro de cierre (ajustable). |
| Pendiente | Hojas inferiores móviles de "Filtrar" y "Mover" y el diálogo de cierre al soltar en "Hecho" en el tablero de escritorio: especificados, no dibujados. |
| Pendiente | Vistas de detalle de proyecto y de tarea (historial, `progressLogs`): no diseñadas. |
| Supuesto | Barra inferior móvil con 5 pestañas; Directorio va al drawer. Si se usa poco Cronograma en móvil, puede cambiarse por "Más". |
| Riesgo | Al conservar nombres de tokens, algún CSS puede usar `--ink-300` esperando un gris muy claro (decorativo); revisar visualmente tras la fase 1. |
| Riesgo | Barlow → Inter cambia anchos de texto (Inter es más ancha); revisar truncados en tarjetas y botones. |
| No verificado | Estado real del modo claro actual y comportamiento móvil en producción. |

---

## 13. Criterios de aceptación

- [ ] La app abre en **tema claro** con fondo `#F6F7F7` y navegación lateral petróleo.
- [ ] No hay chips con fondo de color saturado; estados = punto + texto.
- [ ] El contenido usa todo el ancho disponible (sin contenedor de 980px).
- [ ] Solo un botón primario (teal) por vista.
- [ ] Selector de Espacio filtra proyectos, tareas, tablero, cronograma y KPIs.
- [ ] Los atrasos se ven solo como texto rojo ladrillo y línea punteada en el Gantt.
- [ ] 0 colores hex fuera de `tokens.css`; 0 `!important`.
- [ ] Riel con las 6 secciones y tooltips; ☰ oculta/muestra el panel y el estado se recuerda.
- [ ] **Móvil (390×844):** barra superior, barra inferior de 5 pestañas, FAB y drawer funcionan; sin scroll horizontal de página; todos los objetivos táctiles ≥ 44px.
- [ ] **Móvil:** Mis proyectos en tarjetas, Tablero de una columna con pestañas y "Mover", Cronograma en tarjetas con mini línea de tiempo.
- [ ] Probado en Chrome Android y Safari iOS (incluido `safe-area-inset-bottom`) y en tablet vertical/horizontal.
- [ ] **Ninguna tarea puede quedar en "Hecho" sin `completionReport` de 20+ caracteres**, por ningún camino (Mis tareas, Tablero, formulario, API); probado con un test de API que espera `422`.
- [ ] Mis tareas agrupa por proyecto por defecto y permite cambiar a fecha y estado.
- [ ] Agenda con Día / Semana / Mes y columna de vencidas; sin "compromisos".
- [ ] Directorio: acciones de acceso/eliminación visibles solo para administradores (UI y API).
- [ ] Lighthouse Accessibility ≥ 95 en Mis proyectos, Tablero y Cronograma (escritorio y móvil).
- [ ] `db.json` con contraseñas fuera del repositorio y del historial.
