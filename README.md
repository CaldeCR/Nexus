# Nexus - Gestor de Proyectos TI

Sistema integral de gestión de proyectos de TI, entregables, agenda y seguimiento de colaboradores y proveedores.

## 🚀 Arquitectura del Proyecto

Este proyecto está configurado como un monorepo con npm workspaces:

- **`apps/web`**: Frontend desarrollado con React 18, TypeScript, Vite y Lucide Icons.
- **`apps/api`**: Backend API REST desarrollado en Node.js, Express y TypeScript, con persistencia en `apps/api/data/db.json`.
- **`packages/contracts`**: Paquete compartido para interfaces y tipos de datos.

---

## 🛠️ Requisitos Previos

- [Node.js](https://nodejs.org/) (versión 18 o superior recomendada)
- [npm](https://www.npmjs.com/) (incluido con Node.js)
- [Git](https://git-scm.com/)

---

## 💻 Instalación y Configuración en una Nueva Computadora

1. **Clonar el repositorio:**
   ```bash
   git clone <URL_DEL_REPOSITORIO>
   cd ProjectM
   ```

2. **Instalar dependencias de todo el monorepo:**
   ```bash
   npm install
   ```

3. **Iniciar los servidores de desarrollo:**

   - **Terminal 1 - Servidor API (Backend en puerto 4001):**
     ```bash
     npm run dev:api
     ```

   - **Terminal 2 - Cliente Web (Frontend en puerto 5173):**
     ```bash
     npm run dev:web
     ```

4. **Acceder a la aplicación:**
   Abre tu navegador en [http://localhost:5173](http://localhost:5173).

---

## 📋 Scripts Disponibles

Desde la raíz del proyecto puedes ejecutar:

- `npm run dev:web`: Inicia el servidor de desarrollo de Vite para la interfaz web.
- `npm run dev:api`: Inicia la API con recarga automática en desarrollo.
- `npm run build:web`: Compila el frontend para producción.
- `npm run build:api`: Compila el backend en TypeScript a JavaScript.

---

## 📁 Persistencia de Datos

Los datos de proyectos, tareas y el Directorio Global se almacenan localmente en:
`apps/api/data/db.json`

Este archivo está incluido en el control de versiones inicial para que conserves tus proyectos y miembros registrados al cambiar de computadora.
