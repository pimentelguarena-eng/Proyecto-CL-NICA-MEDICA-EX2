# Arquitectura y Documentación Integral del FRONTEND
## Clínica Medical - Portal y Sistema de Citas Médicas

Este documento contiene el desglose técnico, estructural y funcional completo de la capa **Frontend (Cliente)** del sistema **Clínica Medical**, desarrollada bajo la metodología **PUDS (Proceso Unificado de Desarrollo de Software / RUP)**.

---

### 1. Stack Tecnológico y Dependencias del Frontend

* **Framework Principal:** [React 19](https://react.dev/) (`react@^19.0.1`, `react-dom@^19.0.1`) con TypeScript.
* **Empaquetador y Servidor Dev:** [Vite](https://vitejs.dev/) (`vite@^6 / ^8`) con `@vitejs/plugin-react`.
* **Estilos y Diseño:** [Tailwind CSS v4](https://tailwindcss.com/) (`@tailwindcss/vite` / `tailwindcss`).
* **Iconografía:** [Lucide React](https://lucide.dev/) (`lucide-react@^0.546.0`).
* **Animaciones:** [Motion](https://motion.dev/) (`motion@^12.23.24`).
* **Comunicación con el Backend:** Cliente HTTP nativo con Fetch API y Bearer Authentication (`src/utils/apiClient.ts`).

---

### 2. Estructura de Directorios del Frontend (`src/`)

```
src/
├── main.tsx                         # Punto de entrada de la aplicación React SPA
├── App.tsx                          # Componente raíz, orquestador de estado global y vistas
├── index.css                        # Estilos globales con directivas de Tailwind CSS
│
├── types/
│   └── clinic.ts                    # Definiciones TypeScript de entidades clínicas y PUDS
│
├── data/
│   ├── initialData.ts               # Catálogos maestros iniciales (Especialidades, Servicios, Médicos, Horarios)
│   └── useCasesData.ts              # Especificación formal de los 23 Casos de Uso (CU01 - CU23)
│
├── utils/
│   ├── apiClient.ts                 # Cliente REST centralizado para conexión con la API
│   ├── appointmentLogic.ts          # Motor de cálculo de franjas horarias y reglas de negocio
│   ├── appointmentLogic.test.ts     # Pruebas unitarias de lógica de citas (Node.js test runner)
│   └── authLogic.test.ts            # Pruebas unitarias de lógica criptográfica y autenticación
│
└── components/
    ├── Navbar.tsx                   # Barra de navegación principal y control de sesión
    ├── Hero.tsx                     # Sección visual introductoria y accesos directos
    ├── SpecialtiesSection.tsx       # Catálogo visual de 22 especialidades médicas
    ├── ServicesSection.tsx          # Catálogo de servicios clínicos y diagnósticos ambulatorios
    ├── Footer.tsx                   # Pie de página institucional
    ├── AuthModal.tsx                # Modal de autenticación (Login, Registro Paciente, Solicitud Staff, Recuperación)
    ├── BookingModal.tsx             # Modal multipasos para reserva de citas y pago por QR
    ├── PatientPortal.tsx            # Portal privado del paciente (historial y antecedentes)
    │
    └── AdminPanel/                  # Panel de gestión clínica y administrativa
        ├── AdminPanel.tsx           # Contenedor principal con control de pestañas por rol
        ├── ReceptionView.tsx        # Módulo de Recepción (gestión de citas, check-in, registro de pacientes)
        ├── DoctorAgendaView.tsx     # Agenda Médica (triage, signos vitales y registro de consulta)
        ├── DoctorManagementView.tsx # Gestión de médicos, horarios y asignación de especialidades
        ├── StaffRequestsView.tsx    # Gestión de solicitudes pendientes de personal médico/recepción
        ├── ReportsView.tsx          # Panel de reportes estadísticos y gráficos de demanda
        ├── AuditLogView.tsx         # Visor de bitácora inmutable de auditoría del sistema
        └── ExamValidationModal.tsx  # Suite interactiva de pruebas de requisitos para defensas/exámenes
```

---

### 3. Modelo de Datos del Frontend ([src/types/clinic.ts](file:///home/andrez/Documentos/SI/MedicalProyect/Medical/src/types/clinic.ts))

El frontend define interfaces rigurosamente tipadas para garantizar consistencia:

1. **`Patient` (Paciente):**
   * Datos demográficos: `id`, `code` (`PAC-001`), `ci` (único, validado por RN01), `firstName`, `lastName`, `birthDate`, `gender`, `phone`, `email`, `address`, `isActive`.
   * Expediente médico (CU22): `bloodType`, `allergies`, `chronicDiseases`, `currentMedications`, `medicalHistory`, `emergencyContactName`, `emergencyContactPhone`, `emergencyContactRelationship`.
2. **`Doctor` (Médico):**
   * Identificación: `id`, `code` (`MED-001`), `licenseNumber` (`MP-7821-BOL`), `fullName`, `specialtyIds`, `phone`, `email`, `isActive`, `roomNumber`.
3. **`DoctorSchedule` (Horario de Atención):**
   * Asignación: `id`, `doctorId`, `dayOfWeek` (`Lunes` ... `Domingo`), `startTime` (`08:00`), `endTime` (`12:00`), `slotDurationMinutes` (15 o 30 min).
4. **`Specialty` (Especialidad):**
   * Catálogo de 22 especialidades médicas: `id`, `name`, `category`, `description`, `specificServices`, `commonConditions`, `isActive`, `typicalDurationMinutes`, `consultationFee` (Bs).
5. **`Appointment` (Cita Médica):**
   * Atributos: `id`, `code` (`CM-0001`), `patientId`, `doctorId`, `specialtyId`, `date`, `timeSlot`, `startTime`, `endTime`, `reason`, `status`.
   * Ciclo de Vida (`AppointmentStatus`): `'Pendiente' | 'Programada' | 'Confirmada' | 'Atendida' | 'Cancelada' | 'Inasistencia'`.
   * Atención y Cobro: `vitalSigns` (Presión, Temperatura, FC, Peso, Talla), `clinicalNotes`, `paymentMethod` (`QR_SIMPLE`, `TARJETA`, `TRANSFERENCIA`, `VENTANILLA`), `paymentAmount`.
6. **`UserSession` (Sesión Activa):**
   * `id`, `username`, `role` (`'Administrador' | 'Recepcionista' | 'Médico' | 'Paciente'`), `fullName`, `email`, `doctorId`, `patientCi`, `patientId`.

---

### 4. Componentes Clave y su Funcionamiento

#### A. Gestión de Navegación y Vistas (`src/App.tsx`)
* Mantiene el estado reactivo centralizado: `specialties`, `services`, `doctors`, `schedules`, `patients`, `appointments`, `auditLogs`.
* Gestiona tres vistas principales:
  1. `'portal'`: Landing page pública y catálogo general.
  2. `'patient'`: Portal del paciente autenticado.
  3. `'admin'`: Panel administrativo con control de acceso por roles.
* Registra bitácoras inmutables automáticas para cada acción (`logAuditEvent`).

#### B. Modal de Autenticación (`src/components/AuthModal.tsx`)
Implementa 4 modos operativos integrados:
* **`LOGIN`:** Acceso para los 4 roles con validación de credenciales contra el backend.
* **`REGISTER_PATIENT`:** Auto-registro inmediato de pacientes con validación de CI único.
* **`REGISTER_STAFF`:** Solicitud de registro para Médicos y Recepcionistas (queda en estado `PENDING` hasta aprobación del Administrador).
* **`FORGOT_PASSWORD`:** Flujo de recuperación de contraseña con token criptográfico temporal (30 min de vigencia).

#### C. Modal de Reserva de Citas (`src/components/BookingModal.tsx`)
* **Flujo Multipaso Guiado:**
  1. *Paso 1:* Selección de Especialidad Médica (filtrado por las 22 especialidades).
  2. *Paso 2:* Selección del Médico especialista activo (RN04).
  3. *Paso 3:* Selección de Fecha y Franja Horaria disponible (cálculo en tiempo real mediante `getAvailableSlotsForDoctorAndDate`, respetando RN05, RN06, RN07).
  4. *Paso 4:* Identificación del Paciente (búsqueda automática por CI; si no existe, formulario de alta rápida RN01).
  5. *Paso 5:* Pasarela de Pago simulada (Generación de código QR Simple dinámico, tarjeta de crédito o pago en ventanilla).
  6. *Paso 6:* Confirmación con generación de código correlativo `CM-XXXX` e impresión de comprobante oficial.

#### D. Portal del Paciente (`src/components/PatientPortal.tsx`)
* Consulta del historial cronológico de citas del paciente autenticado (CU08).
* Visualización y actualización del expediente médico: antecedentes, alergias, medicamentos habituales (CU21, CU22).
* Cancelación de citas programadas con registro de motivo justificado (RN09, CU17).
* Blindaje: las citas en estado `Atendida` no permiten cancelación ni modificación (RN10).

#### E. Panel Administrativo (`src/components/AdminPanel/`)
Estructurado en submódulos según el principio de responsabilidad única:
* **Recepción (`ReceptionView.tsx`):**
  * Vista de citas del día, filtro por fecha y especialidad.
  * Check-in de llegada del paciente (cambio a `Confirmada`).
  * Reprogramación de citas con recalculo de agenda (RN13).
  * Registro rápido de nuevos pacientes en mostrador.
* **Agenda Médica (`DoctorAgendaView.tsx`):**
  * Vista exclusiva para médicos: agenda de pacientes citados.
  * Formulario clínico de Triage y Signos Vitales (Presión Arterial, Temperatura, FC, Peso, Talla).
  * Registro inmutable de la consulta médica (anamnesis, diagnóstico, tratamiento).
  * Finalización de consulta con transición automática a estado `Atendida` (RN10).
* **Gestión Médica y Horarios (`DoctorManagementView.tsx`):**
  * Alta y edición de médicos con número de matrícula profesional (`MP-xxxx-BOL`).
  * Parametrización de turnos por día de la semana (`Lunes` a `Domingo`), rangos de horas y duración de turno (15 min / 30 min).
  * Activación y desactivación lógica que preserva el historial clínico (RN11).
* **Solicitudes de Personal (`StaffRequestsView.tsx`):**
  * Exclusivo del Administrador: bandeja de entrada de postulaciones de médicos y recepcionistas.
  * Acciones de Aprobación (creación de cuenta activa) y Rechazo (con motivo registrado).
* **Reportes y Estadísticas (`ReportsView.tsx`):**
  * Métricas de gestión: total de citas, tasa de asistencia vs cancelaciones, distribución por especialidad médica y productividad por médico.
* **Bitácora de Auditoría (`AuditLogView.tsx`):**
  * Registro inmutable con fecha/hora, usuario, rol, IP, módulo afectado y descripción del evento.
* **Consola de Validación de Examen (`ExamValidationModal.tsx`):**
  * Suite interactiva que corre 10 pruebas automatizadas en pantalla para demostrar el cumplimiento de los Requisitos Funcionales y Reglas de Negocio en defensas académicas.

---

### 5. Reglas de Negocio Validadas en el Frontend (`src/utils/appointmentLogic.ts`)

| Regla | Nombre | Implementación en Frontend |
| :--- | :--- | :--- |
| **RN01** | Unicidad de CI | `isDuplicateCI(ci, patients, currentId)` bloquea registros duplicados en modales de recepción, booking y registro. |
| **RN04** | Médico Activo | El selector de citas filtra exclusivamente médicos con `isActive === true`. |
| **RN05** | Correspondencia Horaria | `validateAppointmentSlot` valida que el turno solicitado coincida con el día y horario laboral del médico. |
| **RN06** | No Fechas Pasadas | `isPastDate(dateStr)` bloquea fechas anteriores a hoy en el selector de calendario. |
| **RN07** | No Superposición | `isTimeOverlapping` verifica que no existan citas activas colisionando en el mismo intervalo. |
| **RN09** | Liberación por Cancelación | Las citas canceladas liberan su intervalo horario y exigen justificación escrita. |
| **RN10** | Inmutabilidad de Atendidas | `canTransitionStatus` prohíbe cancelar o reprogramar citas con estado `Atendida`. |
| **RN12** | Control de Roles (RBAC) | `canAccessTab` en `AdminPanel.tsx` restringe el acceso a pestañas según el rol de la sesión activa. |
| **RN13** | Reprogramación Válida | Valida disponibilidad en el nuevo día/hora antes de permitir el cambio de turno. |

---

### 6. Comunicación con el Backend (`src/utils/apiClient.ts`)

El objeto `apiClient` encapsula:
* Manejo automático de tokens de autenticación en `localStorage` o `sessionStorage`.
* Inyección del encabezado `Authorization: Bearer <token>`.
* Manejo estandarizado de errores HTTP (401, 403, 404, 500).
* Métodos tipados para:
  * `login(email, password, remember)`
  * `getMe()`
  * `logout()`
  * `registerPatient(data)`
  * `registerStaffRequest(data)`
  * `forgotPassword(email)`
  * `resetPassword(token, newPassword, confirmPassword)`
  * `getPublicCatalog()`
  * `getAppointments()`
  * `bookAppointment(payload)`
  * `updateAppointmentStatus(id, newStatus, extraData)`
  * `getStaffRequests()`, `approveStaffRequest(id)`, `rejectStaffRequest(id, reason)`
  * `getSystemStatus()`
  * `getAuditLogs()`
