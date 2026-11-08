# Arquitectura y Documentación Integral del BACKEND
## Clínica Medical - Servidor API RESTful y Capa de Datos

Este documento contiene el desglose técnico, estructural, criptográfico y funcional completo de la capa **Backend (Servidor)** del sistema **Clínica Medical**, desarrollada bajo la metodología **PUDS (Proceso Unificado de Desarrollo de Software / RUP)**.

---

### 1. Stack Tecnológico y Entorno de Ejecución

* **Entorno de Ejecución:** [Node.js](https://nodejs.org/) v24.16.0 (Soporte nativo de TypeScript y `node:test`).
* **Framework Web:** [Express.js](https://expressjs.com/) v4.21.2 (`express`).
* **Ejecutor TypeScript:** [tsx](https://github.com/privatenumber/tsx) v4.21.0.
* **Criptografía:** Módulo nativo `node:crypto` (PBKDF2, SHA-512, generador de números aleatorios criptográficamente seguros y comparación en tiempo constante).
* **Integración Frontend-Backend:** En desarrollo, `server.ts` actúa como servidor unificado orquestando los middlewares de la API REST (`/api`) y el servidor Vite en modo middleware para la SPA.

---

### 2. Estructura de Directorios del Backend

```
Medical/
├── server.ts                        # Servidor principal Express y montaje de rutas /api
├── server/
│   ├── apiRouter.ts                 # Enrutador RESTful con todos los endpoints del sistema
│   ├── authService.ts               # Lógica criptográfica, gestión de sesiones y Single Admin Invariant
│   └── db.ts                        # Base de datos en memoria (ClinicDatabase) y seeding inicial
│
└── src/utils/
    ├── appointmentLogic.ts          # Reglas de negocio (RN01, RN04-RN10, RN13) compartidas con servidor
    ├── appointmentLogic.test.ts     # Pruebas unitarias nativas (7 tests aprobados)
    └── authLogic.test.ts            # Pruebas unitarias nativas de seguridad (4 tests aprobados)
```

---

### 3. Capa de Seguridad y Criptografía ([server/authService.ts](file:///home/andrez/Documentos/SI/MedicalProyect/Medical/server/authService.ts))

La seguridad del sistema está implementada siguiendo los más altos estándares de la industria para datos sensibles de salud:

#### A. Algoritmo de Hashing de Contraseñas (PBKDF2)
* **Función:** `hashPassword(password, salt)`
* **Implementación:**
  * Generación de una sal aleatoria única de 16 bytes mediante `crypto.randomBytes(16).toString('hex')`.
  * Derivación de clave mediante `crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512')`.
  * **10,000 iteraciones** y longitud de clave de 64 bytes en formato hexadecimal.
  * Ninguna contraseña se almacena jamás en texto plano.

#### B. Verificación Inmune a Ataques de Temporización (Timing Attack Protection)
* **Función:** `verifyPassword(password, hash, salt)`
* **Implementación:**
  * Se deriva el hash del intento de contraseña con la sal almacenada.
  * La comprobación se ejecuta mediante `crypto.timingSafeEqual(Buffer.from(result.hash, 'hex'), Buffer.from(hash, 'hex'))`.
  * Esto previene que un atacante deduzca caracteres correctos midiendo diferencias de tiempo en nanosegundos.

#### C. Política Estricta de Contraseñas de la Clínica
* **Función:** `validatePasswordPolicy(password)`
* **Requisitos:**
  1. Longitud mínima de **8 caracteres**.
  2. Al menos **una letra mayúscula** (`[A-Z]`).
  3. Al menos **una letra minúscula** (`[a-z]`).
  4. Al menos **un número** (`[0-9]`).

#### D. Invariante Estricta de Administrador Único (*Single Administrator Invariant*)
* **Función:** `assertSingleAdminInvariant(users, targetRole, targetUserId)`
* **Garantía:**
  * El sistema prohíbe terminantemente la coexistencia de más de un usuario activo con el rol `Administrador`.
  * Si un usuario intenta registrarse, ser aprobado o promoverse a Administrador mientras ya existe uno activo, el servidor lanza una excepción inmediata:
    > *"Violación de seguridad y restricción de unicidad: La Clínica Medical permite estrictamente un único Administrador activo. Operación rechazada."*

#### E. Gestión de Sesiones y Tokens Criptográficos
* **Función:** `generateToken()` genera cadenas criptográficas de alta entropía (32 bytes aleatorios = 64 caracteres hex).
* **Sesión:** Cada token tiene una validez temporal vinculada a `expiresAt` (24 horas con *remember me*, o sesión de navegador).
* **Recuperación de Contraseña:** Los tokens de reseteo caducan a los **30 minutos** y son de **un solo uso** (`used: true`).

---

### 4. Capa de Persistencia y Seeding ([server/db.ts](file:///home/andrez/Documentos/SI/MedicalProyect/Medical/server/db.ts))

La persistencia en desarrollo y demostración está gobernada por la clase `ClinicDatabase`, la cual mantiene colecciones fuertemente tipadas en memoria con operaciones síncronas y seguras:

#### Colecciones:
* `users`: Registros de cuentas de usuario con roles (`Administrador`, `Médico`, `Recepcionista`, `Paciente`).
* `staffRequests`: Solicitudes pendientes de personal médico y de recepción.
* `sessions`: Mapa clave-valor de tokens activos indexados por Bearer Token.
* `passwordResetTokens`: Tokens temporales de recuperación de cuenta.
* `specialties`: Catálogo de 22 especialidades médicas ambulatorias.
* `services`: Catálogo de servicios clínicos y diagnósticos.
* `doctors`: Ficha de médicos con número de colegiatura y estado activo.
* `schedules`: Parametrización de turnos semanales por médico.
* `patients`: Expedientes de pacientes con datos demográficos y antecedentes médicos.
* `appointments`: Registro transaccional de citas médicas con estados y signos vitales.
* `auditLogs`: Registro inmutable de eventos de auditoría.

#### Cuentas Iniciales Pre-sembradas (Seeding Seguro con PBKDF2):
| Rol | Nombre de Usuario / Correo | Contraseña Inicial | ID de Referencia |
| :--- | :--- | :--- | :--- |
| **Administrador** | `admin@clinicamedical.com` | `Admin123!` | `usr-admin` |
| **Médico** | `dr.perez@clinicamedical.com` | `Medico123!` | `usr-doc` (`doc-003` - Med. General) |
| **Recepcionista** | `recepcion@clinicamedical.com` | `Recep123!` | `usr-recep` |
| **Paciente** | `paciente@clinicamedical.com` | `Paciente123!` | `usr-pac` (`pac-001` - Carlos Mendoza) |

---

### 5. Catálogo Completo de Endpoints RESTful ([server/apiRouter.ts](file:///home/andrez/Documentos/SI/MedicalProyect/Medical/server/apiRouter.ts))

Todos los endpoints están expuestos bajo el prefijo `/api`:

#### A. Middlewares de Seguridad y Control de Acceso
1. `authenticateToken`: Extrae el header `Authorization: Bearer <token>`, comprueba existencia en `clinicDb.sessions`, valida que `Date.now() <= session.expiresAt` y que el usuario esté activo.
2. `optionalAuth`: Permite que peticiones públicas o anónimas funcionen, pero si se provee un token válido, inyecta la sesión del usuario.
3. `requireRoles(...allowedRoles)`: Bloquea con `403 Forbidden` cualquier intento de acceso si el rol del token no está explícitamente en la lista permitida.

#### B. Tabla de Endpoints de la API

| Método | Endpoint | Middleware | Roles Permitidos | Propósito / Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Ninguno | Público | Autentica con correo y contraseña hasheada. Devuelve token de sesión y perfil. |
| `GET` | `/api/auth/me` | `authenticateToken` | Cualquier rol autenticado | Obtiene los datos del perfil y rol de la sesión activa actual. |
| `POST` | `/api/auth/logout` | `authenticateToken` | Cualquier rol autenticado | Destruye la sesión en el servidor e invalida el Bearer Token. |
| `POST` | `/api/auth/register-patient` | Ninguno | Público | Auto-registro de pacientes. Valida CI único (RN01), crea usuario y paciente. |
| `POST` | `/api/auth/register-staff-request` | Ninguno | Público | Envía postulación de personal médico/recepción con estado `PENDING`. |
| `POST` | `/api/auth/forgot-password` | Ninguno | Público | Inicia recuperación de clave generando token temporal criptográfico de 30 min. |
| `POST` | `/api/auth/reset-password` | Ninguno | Público | Actualiza contraseña verificando token de recuperación de un solo uso. |
| `GET` | `/api/public/data` | Ninguno | Público | Expone catálogo médico público (especialidades, médicos, servicios) sin datos privados. |
| `GET` | `/api/admin/staff-requests` | `requireRoles('Administrador')` | Administrador | Lista todas las solicitudes de personal pendientes y procesadas. |
| `POST` | `/api/admin/staff-requests/:id/approve` | `requireRoles('Administrador')` | Administrador | Aprueba solicitud: crea médico/recepcionista activo con credenciales listas. |
| `POST` | `/api/admin/staff-requests/:id/reject` | `requireRoles('Administrador')` | Administrador | Rechaza solicitud con registro de motivo de rechazo en auditoría. |
| `GET` | `/api/admin/system-status` | `requireRoles('Administrador')` | Administrador | Valida cumplimiento del Invariante de Administrador Único y estadísticas de usuarios. |
| `GET` | `/api/appointments` | `authenticateToken` | Todos (filtrado) | Paciente ve solo sus citas; Médico ve su agenda; Soporta `?patientId=` para historial cruzado. |
| `GET` | `/api/patients/:id/history` | `authenticateToken` | Médico, Recepcionista, Admin, Paciente (propio) | **CU21, CU22**: Consulta de expediente médico, antecedentes, alergias y recetas de otros médicos. |
| `POST` | `/api/appointments/book` | `authenticateToken` | Todos | Registra cita validando reglas RN04, RN05, RN06, RN07 y asignando código `CM-XXXX`. |
| `PATCH` | `/api/appointments/:id/status` | `authenticateToken` | Todos (controlado) | Actualiza estado (Confirmada, Atendida, Cancelada), signos vitales y notas clínicas. |
| `GET` | `/api/audit-logs` | `requireRoles('Administrador')` | Administrador | Consulta la bitácora inmutable de eventos de auditoría del sistema. |

---

### 6. Reglas de Negocio Ejecutadas en el Servidor (`src/utils/appointmentLogic.ts`)

1. **Unicidad de Documento de Identidad (RN01):**
   * Validación en `POST /api/auth/register-patient` y `POST /api/appointments/book`.
   * Si el CI ya existe para otro paciente, la solicitud es rechazada con código `409 Conflict`.
2. **Médico Activo Obligatorio (RN04):**
   * No se permite agendar citas con médicos cuyo estado sea `isActive === false`.
3. **Pertenencia a Horario de Atención (RN05):**
   * El día de la semana y el rango horario solicitado deben corresponder a la grilla de turnos registrada del médico.
4. **Bloqueo de Citas en el Pasado (RN06):**
   * No se permiten registros ni reprogramaciones con fecha u hora anterior a la del servidor.
5. **Detección de Colisiones / Superposición Horaria (RN07):**
   * El servidor comprueba colisiones con citas existentes no canceladas para el mismo médico.
6. **Cancelación con Liberación de Cupo (RN09):**
   * La cita cancelada libera su intervalo horario pero se mantiene en la base de datos con su motivo de cancelación.
7. **Inmutabilidad de Citas Atendidas (RN10):**
   * El endpoint `/api/appointments/:id/status` prohíbe expresamente alterar el estado de una cita que ya fue `Atendida`.

---

### 7. Pruebas Unitarias Automatizadas (Node.js 24 Test Runner)

El backend cuenta con pruebas unitarias nativas que no requieren librerías externas pesadas como Jest o Mocha, ejecutándose a la máxima velocidad directamente sobre el runtime de Node.js:

#### Pruebas de Seguridad (`src/utils/authLogic.test.ts`):
* `validatePasswordPolicy enforces secure password requirements`: Verifica longitud mínima, mayúsculas, minúsculas y dígitos.
* `hashPassword and verifyPassword with PBKDF2 works reliably`: Comprueba derivación de hashes y verificación segura con `crypto.timingSafeEqual`.
* `assertSingleAdminInvariant strictly enforces strictly ONE active administrator`: Valida el bloqueo estricto ante intentos de duplicar administradores.
* `generateToken produces high-entropy crypto tokens`: Valida la unicidad y entropía de tokens.

#### Pruebas de Citas y Turnos (`src/utils/appointmentLogic.test.ts`):
* `timeToMinutes converts HH:mm accurately`: Conversión de tiempos para aritmética de intervalos.
* `generateSlotsForSchedule creates 15 min intervals`: Generación de franjas horarias exactas de 15 minutos.
* `isTimeOverlapping accurately detects collisions`: Detección de solapamiento de intervalos.
* `isDuplicateCI catches duplicate document numbers`: Detección de duplicados según RN01.
* `validateAppointmentSlot enforces RN04, RN05, RN06, RN07, RN09`: Validación integral del motor de turnos.
* `canTransitionStatus enforces RN10 and valid flows`: Validación de la máquina de estados de citas.
* `generateAppointmentCode increments sequentially`: Generación correlativa de códigos `CM-0001`, `CM-0002`, etc.

#### Comando de Ejecución:
```bash
node --test src/utils/authLogic.test.ts
node --test src/utils/appointmentLogic.test.ts
```
*(Ambos suites pasan al 100% con 11/11 tests exitosos).*

---

### 8. Cómo Iniciar el Servidor Backend

Para poner en marcha el servidor:
```bash
# Modo Desarrollo (Express + API REST + Vite Frontend integrado)
npx tsx server.ts
```
El servidor escuchará en `http://0.0.0.0:3000` con la API accesible en `http://localhost:3000/api`.
