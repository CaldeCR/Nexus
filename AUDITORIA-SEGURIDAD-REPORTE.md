# Reporte Ejecutivo de Auditoría de Seguridad y Remediaciones

**Proyecto:** Nexus (Gestor de Proyectos TI)  
**Fecha:** Octubre 2026  
**Alcance:** Código fuente cliente y backend, canalización de compilación (*build pipeline*), configuración de variables de entorno, mapas de código (*source maps*), control de sesiones y artefactos de distribución en producción.

---

## 1. Resumen Ejecutivo

Se realizó una auditoría de seguridad integral orientada a garantizar que **ninguna credencial, secreto, token, clave privada, cadena de conexión o dato sensible quede embebido o expuesto en el código del cliente**. Todas las operaciones sensibles se trasladaron a servicios seguros del lado del servidor (*backend*), se mitigaron vulnerabilidades críticas de autenticación y se blindó el pipeline de compilación e infraestructura.

### Resultados Globales

| Componente Auditado | Estado Inicial | Estado Final | Evaluación |
| :--- | :--- | :--- | :---: |
| **Cliente Web (React Bundle)** | Credenciales de admin en código; generador predecible `Math.random()`. | Formulario neutro, generador CSPRNG (`window.crypto`), cero secretos. | ✅ Seguro |
| **Control de Sesiones & Tokens** | Bypass crítico mediante tokens forjables `nexus-0-<userId>`. | Tokens criptográficos de 256 bits (`ses_<hex>`), validación estricta y TTL de 24h. | ✅ Seguro |
| **Almacenamiento de Contraseñas** | Múltiples rutas y base de datos guardaban contraseñas en texto plano. | Hasheo obligatorio con `bcrypt` (12 rondas), eliminación de campos planos y migración. | ✅ Seguro |
| **Source Maps & Distribución** | Sin directiva explícita en Vite / TS; riesgo de fuga de código fuente. | `sourcemap: false` explícito; 0 archivos `.map` en artefactos finales. | ✅ Seguro |
| **Red y CORS** | `app.use(cors())` abierto sin restricción de origen. | Lista blanca de orígenes autorizados configurable por entorno (`ALLOWED_ORIGINS`). | ✅ Seguro |
| **Pipeline & Contenedores** | `.dockerignore` permeable; contraseñas hardcodeadas en Compose. | `.dockerignore` y `.gitignore` blindados contra secretos; Compose parametrizado. | ✅ Seguro |

---

## 2. Detalle de Vulnerabilidades Identificadas y Remediadas

### 🔴 Hallazgo 1: Bypass Crítico de Autenticación por Falsificación de Tokens (Backdoor)
* **Severidad:** **CRÍTICA** (CVSS: 9.8)
* **Archivo afectado:** `apps/api/src/main.ts`
* **Condición encontrada:** La función de extracción de usuario contenía una expresión regular `^nexus-\d+-(.+)$` que rehidrataba sesiones asociando directamente el token a cualquier ID de usuario. Cualquier atacante no autenticado podía enviar `Authorization: Bearer nexus-0-u-1` y asumir la identidad del Administrador/Propietario (`u-1`) con privilegios totales.
* **Remediación realizada:**
  - Se eliminó completamente la lógica de coincidencia por expresión regular.
  - Se implementó un esquema de tokens criptográficos con prefijo `ses_` generado con `crypto.randomBytes(32)` (256 bits de entropía real).
  - Las sesiones legítimas se almacenan en memoria y se respaldan en base de datos (`db.sessions`) con expiración forzada (TTL de 24 horas), sobreviviendo reinicios sin crear puertas traseras.
  - Se añadió el endpoint `POST /api/auth/logout` para revocar e invalidar activamente el token en el servidor.

---

### 🟠 Hallazgo 2: Almacenamiento y Actualización de Contraseñas en Texto Plano
* **Severidad:** **ALTA** (CVSS: 8.5)
* **Archivos afectados:** `apps/api/src/main.ts`, `apps/api/src/data/store.ts`, `apps/api/data/db.json`
* **Condición encontrada:**
  1. `PUT /api/users/:id/password` asignaba `targetUser.password = password` directamente sin hashear.
  2. `POST /api/directory` (con `createAccount: true`) y `POST /api/directory/:id/create-account` creaban cuentas con la propiedad `password` en texto plano.
  3. En `apps/api/data/db.json`, cuentas existentes contenían contraseñas planas (`secret123`, `NexusPass123!`).
  4. La función `createDefaultDb()` inicializaba al usuario default con `password: '123456'`.
* **Remediación realizada:**
  - Todas las rutas de creación, restablecimiento y actualización de contraseñas se convirtieron en `async` y ejecutan `await bcrypt.hash(password, 12)`.
  - Se elimina sistemáticamente la propiedad `password` antes de persistir, almacenando únicamente `passwordHash`.
  - Se migraron los usuarios de `db.json` a hashes bcrypt de 12 rondas.
  - Se incorporó un mecanismo de auto-sanitización en `normalizeDb()` de `store.ts` que convierte automáticamente a bcrypt cualquier contraseña legacy en texto plano que se detecte al leer la base de datos.

---

### 🟠 Hallazgo 3: Credenciales de Administrador Embebidas en el Bundle del Cliente
* **Severidad:** **ALTA** (CVSS: 7.5)
* **Archivo afectado:** `apps/web/src/main.jsx`
* **Condición encontrada:** El estado inicial de React en `loginForm` contenía las credenciales predeterminadas del propietario:
  ```javascript
  const [loginForm, setLoginForm] = useState({
    email: 'jorge@nexus.local',
    password: '123456'
  });
  ```
  Al compilar para producción con Vite, el archivo `.js` empaquetado contenía de forma permanente estas credenciales legibles por cualquier usuario.
* **Remediación realizada:**
  - Se inicializó el estado con cadenas vacías: `{ email: '', password: '' }`.
  - Se cambiaron los placeholders sensibles por máscaras genéricas (`placeholder="••••••••"`).
  - Se cambiaron los textos de fallback en el layout (`Rail.jsx`) para no exponer nombres ni correos personales.

---

### 🟡 Hallazgo 4: Generación Predecible de Contraseñas con `Math.random()`
* **Severidad:** **MEDIA** (CVSS: 5.3)
* **Archivo afectado:** `apps/web/src/main.jsx`
* **Condición encontrada:** La sugerencia de contraseñas en modales usaba `Math.random()` generando contraseñas del tipo `NexusXXXX!` con un espacio de búsqueda de solo 9,000 combinaciones, vulnerables a fuerza bruta inmediata.
* **Remediación realizada:**
  - Se creó el endpoint administrativo `GET /api/auth/generate-password` en el servidor, utilizando `crypto.randomBytes(16)`.
  - En el frontend, se implementó `generateSecurePassword()` usando `window.crypto.getRandomValues()` sobre un set de 64 caracteres de alta entropía (>90 bits).

---

### 🟡 Hallazgo 5: Política de CORS Totalmente Abierta
* **Severidad:** **MEDIA** (CVSS: 6.5)
* **Archivo afectado:** `apps/api/src/main.ts`
* **Condición encontrada:** La API ejecutaba `app.use(cors())` sin filtro de origen, permitiendo que cualquier página web externa ejecutara peticiones cross-origin enviando encabezados de autorización.
* **Remediación realizada:**
  - Se limitó el CORS a una lista blanca explícita (`http://localhost:5173`, `http://localhost:4173`, `https://nexus.mexicocentral.cloudapp.azure.com`, etc.).
  - Se habilitó la variable de entorno `ALLOWED_ORIGINS` para configuración en producción.
  - Se fijó el límite del cuerpo de solicitudes a `1mb` (`express.json({ limit: '1mb' })`) para mitigar ataques DoS por payload excesivo.

---

### 🟡 Hallazgo 6: Riesgo de Fuga de Archivos y Mapas de Código en el Pipeline
* **Severidad:** **MEDIA** (CVSS: 4.8)
* **Archivos afectados:** `apps/web/vite.config.js`, `apps/api/tsconfig.json`, `.dockerignore`, `.gitignore`, `docker-compose.yml`
* **Condición encontrada:**
  - Falta de configuración explícita para suprimir mapas de código (`.map`).
  - `.dockerignore` no excluía `.env*`, certificados `.pem/.key`, ni archivos de base de datos `apps/api/data/*.json`.
  - `docker-compose.yml` exponía la contraseña de Postgres en texto plano en el manifiesto.
* **Remediación realizada:**
  - Se configuró `"sourceMap": false` en `tsconfig.json` y `build.sourcemap = false` en `vite.config.js`.
  - Se blindó `.dockerignore` y `.gitignore` para bloquear `.env*`, llaves privadas, certificados y archivos `.json` de runtime.
  - Se parametrizó `docker-compose.yml` con `${POSTGRES_PASSWORD}` y se documentó en `.env.example`.

---

### 🔵 Hallazgo 7: Cabeceras de Seguridad Faltantes en el Servidor Web Estático
* **Severidad:** **BAJA** (CVSS: 3.5)
* **Archivo afectado:** `apps/web/nginx.conf`
* **Condición encontrada:** El contenedor Nginx que sirve los estáticos carecía de cabeceras de protección HTTP y exponía versiones del servidor.
* **Remediación realizada:**
  - Se añadieron cabeceras: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-XSS-Protection: 1; mode=block`.
  - Se desactivó la firma del servidor con `server_tokens off;`.
  - Se bloqueó el acceso a archivos ocultos con la regla `location ~ /\.(?!well-known) { deny all; }`.

---

## 3. Verificación de Artefactos de Producción

Se compilaron ambos proyectos en modo de producción (`npm run build:api` y `npm run build:web`):

1. **Inspección de Source Maps:**
   - Búsqueda recursiva de archivos `*.map` en `apps/web/dist` y `apps/api/dist`: **0 encontrados.**
2. **Escaneo del Bundle JavaScript Cliente (`dist/assets/index-*.js`):**
   - Búsqueda de credenciales de prueba (`123456`, `secret123`, `NexusPass`): **0 ocurrencias.**
   - Búsqueda de correos administrativos hardcodeados (`jorge@nexus.local`, `jorge@empresa.com`): **0 ocurrencias.**
   - Búsqueda de llaves privadas y cadenas de conexión (`PRIVATE KEY`, `postgresql:`, `DATABASE_URL`): **0 ocurrencias.**

---

## 4. Batería de Pruebas Automatizadas de Seguridad

Se validaron los 7 escenarios críticos de seguridad sobre la API activa:

```
[TEST 1] Verificación de Health Check (/api/health)
         Resultado: 200 OK | Status: healthy -> PASS

[TEST 2] Intento de Ataque con Token Forjado (nexus-0-u-1)
         Resultado: 401 Unauthorized (Backdoor cerrado) -> PASS

[TEST 3] Autenticación Legítima con Cripto-Tokens (/api/auth/login)
         Resultado: 200 OK | Token ses_<64 hex chars> -> PASS

[TEST 4] Acceso a Rutas Protegidas con Token Válido (/api/projects)
         Resultado: 200 OK | Proyectos autorizados consultados -> PASS

[TEST 5] Generador Criptográfico de Contraseñas (/api/auth/generate-password)
         Resultado: 200 OK | Clave de alta entropía (16 chars) -> PASS

[TEST 6] Revocación Activa de Sesión (/api/auth/logout)
         Resultado: 200 OK | Sesión eliminada de memoria y persistencia -> PASS

[TEST 7] Intento de Reúso de Token Tras Logout
         Resultado: 401 Unauthorized (Token invalidado) -> PASS
```

---

## 5. Instrucciones de Despliegue Seguro

1. **Configurar el archivo `.env` en el servidor de producción:**
   ```bash
   POSTGRES_PASSWORD=$(openssl rand -hex 24)
   DATABASE_URL="postgresql://postgres:${POSTGRES_PASSWORD}@localhost:5432/nexus?schema=public"
   PORT=4001
   ALLOWED_ORIGINS="https://nexus.mexicocentral.cloudapp.azure.com"
   ```
2. **Despliegue con Docker Compose:**
   ```bash
   docker compose build --pull
   docker compose up -d
   ```
