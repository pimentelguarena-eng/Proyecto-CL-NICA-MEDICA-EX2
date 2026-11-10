import { Router, Request, Response, NextFunction } from 'express';
import crypto from 'node:crypto';
import { clinicDb } from './db.ts';
import {
  hashPassword,
  verifyPassword,
  validatePasswordPolicy,
  generateToken,
  assertSingleAdminInvariant,
  type UserRecord,
  type SessionToken,
} from './authService.ts';
import {
  validateAppointmentSlot,
  generateAppointmentCode,
  canTransitionStatus,
  getDoctorAbsenceForDate,
} from './utils/appointmentLogic.ts';
import type { Appointment, DoctorAbsence } from './types/clinic.ts';
import {
  sendPasswordResetEmail,
  sendDoctorEmergencyNoticeEmail,
  sendAppointmentRescheduledEmail,
  sendDoctorAbsenceNoticeEmail,
} from './emailService.ts';

export const apiRouter = Router();

// Extend Request type to include authenticated session
export interface AuthenticatedRequest extends Request {
  userSession?: SessionToken;
  userRecord?: UserRecord;
}

// Authentication Middleware
export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({ error: 'No autenticado. Token de sesión no proporcionado.' });
  }

  const session = clinicDb.sessions.get(token);
  if (!session) {
    return res.status(401).json({ error: 'Sesión inválida o expirada. Por favor inicie sesión de nuevo.' });
  }

  if (Date.now() > session.expiresAt) {
    clinicDb.sessions.delete(token);
    return res.status(401).json({ error: 'Su sesión ha expirado por inactividad. Inicie sesión nuevamente.' });
  }

  const user = clinicDb.users.find(u => u.id === session.userId);
  if (!user || user.status !== 'ACTIVE') {
    clinicDb.sessions.delete(token);
    return res.status(403).json({ error: 'Cuenta no autorizada o suspendida.' });
  }

  req.userSession = session;
  req.userRecord = user;
  next();
}

// Optional Auth Middleware (for endpoints that work both for guests and users)
export function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
  if (token) {
    const session = clinicDb.sessions.get(token);
    if (session && Date.now() <= session.expiresAt) {
      const user = clinicDb.users.find(u => u.id === session.userId);
      if (user && user.status === 'ACTIVE') {
        req.userSession = session;
        req.userRecord = user;
      }
    }
  }
  next();
}

// Role Authorization Middleware Generator
export function requireRoles(...allowedRoles: UserRecord['role'][]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.userSession) {
      return res.status(401).json({ error: 'Acceso no autorizado. Inicie sesión.' });
    }
    if (!allowedRoles.includes(req.userSession.role)) {
      return res.status(403).json({
        error: `Acceso restringido: Se requiere rol [${allowedRoles.join(', ')}]. Su rol actual es [${req.userSession.role}].`,
      });
    }
    next();
  };
}

// -------------------------------------------------------------
// AUTHENTICATION ENDPOINTS
// -------------------------------------------------------------

/**
 * POST /api/auth/login
 * Real authentication verifying email & hashed password
 */
apiRouter.post('/auth/login', (req: Request, res: Response) => {
  const { email, password, rememberMe } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Debe ingresar su correo electrónico y contraseña.' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const user = clinicDb.users.find(u => u.email.toLowerCase() === normalizedEmail);

  if (!user) {
    // Check if there is a pending request with this email
    const pendingReq = clinicDb.staffRequests.find(r => r.email.toLowerCase() === normalizedEmail);
    if (pendingReq) {
      if (pendingReq.status === 'PENDING') {
        return res.status(403).json({
          error: `Su solicitud de registro como ${pendingReq.type === 'MEDICO' ? 'Médico' : 'Recepcionista'} se encuentra PENDIENTE de revisión por la Administración. No se permite el acceso hasta que sea aprobada.`,
          isPendingRequest: true,
        });
      }
      if (pendingReq.status === 'REJECTED') {
        return res.status(403).json({
          error: `Su solicitud de registro fue RECHAZADA por la administración de la clínica.${pendingReq.rejectionReason ? ` Motivo: ${pendingReq.rejectionReason}` : ''}`,
          isRejectedRequest: true,
        });
      }
    }
    return res.status(401).json({ error: 'Credenciales inválidas. Verifique el correo electrónico y la contraseña ingresados.' });
  }

  // Check lockout
  if (user.lockoutUntil && Date.now() < user.lockoutUntil) {
    const minutesLeft = Math.ceil((user.lockoutUntil - Date.now()) / 60000);
    return res.status(429).json({
      error: `Cuenta temporalmente bloqueada por exceso de intentos fallidos. Intente nuevamente en ${minutesLeft} minutos.`,
    });
  }

  // Check account status
  if (user.status === 'PENDING_APPROVAL') {
    return res.status(403).json({
      error: 'Su cuenta está pendiente de activación por la Administración. Por favor espere su confirmación.',
      isPendingRequest: true,
    });
  }
  if (user.status === 'REJECTED') {
    return res.status(403).json({ error: 'Su solicitud de cuenta fue rechazada por la administración.' });
  }
  if (user.status === 'SUSPENDED') {
    return res.status(403).json({ error: 'Su cuenta se encuentra suspendida. Contacte al administrador.' });
  }

  // Verify password
  const isMatch = verifyPassword(password, user.passwordHash, user.salt);
  if (!isMatch) {
    user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
    if (user.failedLoginAttempts >= 5) {
      user.lockoutUntil = Date.now() + 15 * 60 * 1000; // 15 minutes lockout
      clinicDb.logAudit({
        userName: user.fullName,
        userRole: user.role,
        moduleAffected: 'Seguridad y Autenticación',
        eventType: 'BLOQUEO_CUENTA',
        actionDescription: `Cuenta ${user.email} bloqueada temporalmente por 5 intentos fallidos consecutivos.`,
        ipAddress: req.ip,
      });
      return res.status(429).json({
        error: 'Demasiados intentos fallidos. Su cuenta ha sido bloqueada temporalmente por 15 minutos por seguridad.',
      });
    }
    return res.status(401).json({
      error: `Credenciales inválidas. Intentos restantes antes del bloqueo: ${5 - user.failedLoginAttempts}.`,
    });
  }

  // Successful Login
  user.failedLoginAttempts = 0;
  user.lockoutUntil = undefined;

  const token = generateToken();
  const sessionDuration = rememberMe ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
  const session: SessionToken = {
    token,
    userId: user.id,
    email: user.email,
    role: user.role,
    fullName: user.fullName,
    doctorId: user.doctorId,
    patientCi: user.patientCi || user.ci,
    patientId: user.patientId,
    createdAt: Date.now(),
    expiresAt: Date.now() + sessionDuration,
  };

  clinicDb.sessions.set(token, session);

  clinicDb.logAudit({
    userName: user.fullName,
    userRole: user.role,
    moduleAffected: 'Seguridad y Autenticación',
    eventType: 'LOGIN_EXITOSO',
    actionDescription: `Inicio de sesión exitoso como ${user.role} (${user.email}).`,
    ipAddress: req.ip,
  });

  return res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      doctorId: user.doctorId,
      patientCi: user.patientCi || user.ci,
      patientId: user.patientId,
    },
  });
});

/**
 * GET /api/auth/me
 * Retrieves current active session profile
 */
apiRouter.get('/auth/me', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const session = req.userSession!;
  const user = req.userRecord!;

  return res.json({
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      doctorId: user.doctorId,
      patientCi: user.patientCi || user.ci,
      patientId: user.patientId,
      phone: user.phone,
      status: user.status,
    },
  });
});

/**
 * POST /api/auth/logout
 * Invalidates current session token
 */
apiRouter.post('/auth/logout', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const token = req.userSession!.token;
  clinicDb.sessions.delete(token);

  clinicDb.logAudit({
    userName: req.userSession!.fullName,
    userRole: req.userSession!.role,
    moduleAffected: 'Seguridad y Autenticación',
    eventType: 'LOGOUT',
    actionDescription: `Cierre de sesión de ${req.userSession!.email}.`,
    ipAddress: req.ip,
  });

  return res.json({ success: true, message: 'Sesión cerrada correctamente.' });
});

/**
 * POST /api/auth/register-patient
 * Self-registration for patients only!
 */
apiRouter.post('/auth/register-patient', (req: Request, res: Response) => {
  const {
    firstName,
    lastName,
    ci,
    email,
    phone,
    password,
    confirmPassword,
    birthDate,
    gender,
    acceptTerms,
  } = req.body;

  if (!acceptTerms) {
    return res.status(400).json({ error: 'Debe aceptar los términos de servicio y políticas de privacidad.' });
  }

  if (!firstName || !lastName || !ci || !email || !password || !confirmPassword) {
    return res.status(400).json({ error: 'Por favor complete todos los campos obligatorios.' });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ error: 'Las contraseñas no coinciden.' });
  }

  const passCheck = validatePasswordPolicy(password);
  if (!passCheck.isValid) {
    return res.status(400).json({ error: passCheck.message });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const normalizedCI = String(ci).trim();

  // Check unique email
  if (clinicDb.users.some(u => u.email.toLowerCase() === normalizedEmail)) {
    return res.status(400).json({ error: 'Este correo electrónico ya se encuentra registrado en el sistema.' });
  }

  // Check unique CI
  if (clinicDb.patients.some(p => p.ci.trim() === normalizedCI)) {
    return res.status(400).json({ error: 'Ya existe un paciente registrado con este documento de identidad (CI).' });
  }

  const passwordData = hashPassword(password);
  const patientId = `pac-${Date.now()}`;
  const patientCode = `PAC-${(clinicDb.patients.length + 1).toString().padStart(3, '0')}`;
  const fullName = `${String(firstName).trim()} ${String(lastName).trim()}`;

  // 1. Create Patient record in clinical directory
  const newPatient = {
    id: patientId,
    code: patientCode,
    ci: normalizedCI,
    firstName: String(firstName).trim(),
    lastName: String(lastName).trim(),
    birthDate: birthDate || '1995-01-01',
    gender: gender || 'Otro',
    phone: phone ? String(phone).trim() : 'Sin teléfono',
    email: normalizedEmail,
    isActive: true,
  };
  clinicDb.patients.push(newPatient as any);

  // 2. Create User record with STRICT role Paciente
  const newUser: UserRecord = {
    id: `usr-${Date.now()}`,
    email: normalizedEmail,
    passwordHash: passwordData.hash,
    salt: passwordData.salt,
    fullName,
    role: 'Paciente', // Server-enforced, cannot be changed from client
    status: 'ACTIVE',
    ci: normalizedCI,
    phone: phone ? String(phone).trim() : undefined,
    patientId,
    patientCi: normalizedCI,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    failedLoginAttempts: 0,
  };
  clinicDb.users.push(newUser);

  // 3. Generate instant session for frictionless booking
  const token = generateToken();
  const session: SessionToken = {
    token,
    userId: newUser.id,
    email: newUser.email,
    role: 'Paciente',
    fullName: newUser.fullName,
    patientCi: normalizedCI,
    patientId,
    createdAt: Date.now(),
    expiresAt: Date.now() + 24 * 60 * 60 * 1000,
  };
  clinicDb.sessions.set(token, session);

  clinicDb.logAudit({
    userName: fullName,
    userRole: 'Paciente',
    moduleAffected: 'Registro de Pacientes',
    eventType: 'AUTORREGISTRO_PACIENTE',
    actionDescription: `Nuevo paciente registrado exitosamente: ${fullName} (CI: ${normalizedCI}, Cod: ${patientCode}).`,
    ipAddress: req.ip,
  });

  clinicDb.saveToDisk();

  return res.status(201).json({
    success: true,
    message: 'Cuenta de paciente creada exitosamente.',
    token,
    user: {
      id: newUser.id,
      email: newUser.email,
      fullName: newUser.fullName,
      role: newUser.role,
      patientCi: normalizedCI,
      patientId,
    },
  });
});

/**
 * POST /api/auth/register-staff-request
 * Submit application for Médico or Recepcionista.
 * Status is strictly PENDING until Administrator approves.
 */
apiRouter.post('/auth/register-staff-request', (req: Request, res: Response) => {
  const {
    type,
    firstName,
    lastName,
    email,
    phone,
    ci,
    specialtyId,
    licenseNumber,
    notes,
    password,
    confirmPassword,
    acceptTerms,
  } = req.body;

  if (!acceptTerms) {
    return res.status(400).json({ error: 'Debe aceptar los términos institucionales y código de ética de la clínica.' });
  }

  // Security check: Never allow requesting Administrator
  if (type === 'ADMINISTRADOR' || type === 'Administrador') {
    return res.status(403).json({
      error: 'Restricción de seguridad: No está permitido registrar solicitudes públicas para el rol de Administrador.',
    });
  }

  if (type !== 'MEDICO' && type !== 'RECEPCIONISTA') {
    return res.status(400).json({ error: 'Tipo de solicitud inválido. Debe ser MEDICO o RECEPCIONISTA.' });
  }

  if (!firstName || !lastName || !email || !phone || !ci || !password || !confirmPassword) {
    return res.status(400).json({ error: 'Complete todos los campos obligatorios de la solicitud.' });
  }

  if (type === 'MEDICO') {
    if (!licenseNumber || !specialtyId) {
      return res.status(400).json({
        error: 'Para postulaciones médicas es obligatorio especificar la Especialidad y la Matrícula Profesional.',
      });
    }
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ error: 'Las contraseñas no coinciden.' });
  }

  const passCheck = validatePasswordPolicy(password);
  if (!passCheck.isValid) {
    return res.status(400).json({ error: passCheck.message });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const normalizedCI = String(ci).trim();

  // Check unique in users
  if (clinicDb.users.some(u => u.email.toLowerCase() === normalizedEmail)) {
    return res.status(400).json({ error: 'Ya existe una cuenta activa con este correo electrónico.' });
  }

  // Check unique in pending requests
  if (clinicDb.staffRequests.some(r => r.email.toLowerCase() === normalizedEmail && r.status === 'PENDING')) {
    return res.status(400).json({
      error: 'Ya existe una solicitud pendiente de revisión registrada con este correo electrónico.',
    });
  }

  const passwordData = hashPassword(password);
  const fullName = `${String(firstName).trim()} ${String(lastName).trim()}`;
  const requestId = `req-${Date.now()}`;

  const requestRecord = {
    id: requestId,
    type,
    fullName,
    firstName: String(firstName).trim(),
    lastName: String(lastName).trim(),
    email: normalizedEmail,
    phone: String(phone).trim(),
    ci: normalizedCI,
    specialtyId: type === 'MEDICO' ? String(specialtyId) : undefined,
    licenseNumber: type === 'MEDICO' ? String(licenseNumber).trim() : undefined,
    notes: notes ? String(notes).trim() : undefined,
    status: 'PENDING' as const,
    passwordHash: passwordData.hash,
    salt: passwordData.salt,
    createdAt: new Date().toISOString(),
  };

  clinicDb.staffRequests.unshift(requestRecord);

  clinicDb.logAudit({
    userName: fullName,
    userRole: type === 'MEDICO' ? 'Médico (Postulante)' : 'Recepcionista (Postulante)',
    moduleAffected: 'Gestión de Personal',
    eventType: 'SOLICITUD_PERSONAL_CREADA',
    actionDescription: `Nueva solicitud de registro recibida como ${type}: ${fullName} (CI: ${normalizedCI}, ${normalizedEmail}). En espera de aprobación administrativa.`,
    ipAddress: req.ip,
  });

  clinicDb.saveToDisk();

  return res.status(201).json({
    success: true,
    message: `Su solicitud de registro como ${type === 'MEDICO' ? 'Médico Especialista' : 'Recepcionista'} ha sido recibida y se encuentra PENDIENTE de revisión por la Administración. Se le notificará tras la revisión de sus credenciales.`,
    requestId,
  });
});

/**
 * POST /api/auth/forgot-password
 * Initiates password recovery via secure email dispatch (CU03)
 */
apiRouter.post('/auth/forgot-password', async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Ingrese su correo electrónico.' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const user = clinicDb.users.find(u => u.email.toLowerCase() === normalizedEmail && u.status === 'ACTIVE');

  // Generic message to avoid email enumeration
  const genericMessage = 'Si el correo electrónico está registrado en el sistema, se ha enviado un código de recuperación válido por 30 minutos a su bandeja de entrada (revise también la carpeta de spam).';

  if (!user) {
    return res.json({ success: true, message: genericMessage });
  }

  // Genera un código numérico seguro de 6 dígitos (ej. 482910) fácil de leer y escribir
  const token = crypto.randomInt(100000, 1000000).toString();
  clinicDb.passwordResetTokens.set(token, {
    token,
    userId: user.id,
    email: user.email,
    expiresAt: Date.now() + 30 * 60 * 1000,
    used: false,
  });

  clinicDb.logAudit({
    userName: user.fullName,
    userRole: user.role,
    moduleAffected: 'Seguridad y Autenticación',
    eventType: 'SOLICITUD_RECUPERACION_CLAVE',
    actionDescription: `Solicitud de recuperación de contraseña para ${user.email}. Código despachado por correo electrónico.`,
    ipAddress: req.ip,
  });

  // Despacho del correo real vía SMTP de Gmail
  // Se utiliza Promise.race con un límite de 2.5s para no bloquear la pantalla del usuario si la red SMTP externa tarda
  const emailPromise = sendPasswordResetEmail(user.email, user.fullName, token)
    .then((emailResult) => {
      if (!emailResult.success) {
        console.warn(`[SMTP WARN] No se pudo enviar el correo a ${user.email}: ${emailResult.error}`);
      }
    })
    .catch((err: any) => {
      console.error(`[SMTP ERROR] Excepción al enviar correo a ${user.email}:`, err.message || err);
    });

  await Promise.race([
    emailPromise,
    new Promise((resolve) => setTimeout(resolve, 2500)),
  ]);

  return res.json({
    success: true,
    message: genericMessage,
    demoPin: token, // Proporciona el PIN en caso de que el firewall de Render Free bloquee puertos SMTP salientes
  });
});

/**
 * POST /api/auth/reset-password
 * Completes password reset using valid recovery token
 */
apiRouter.post('/auth/reset-password', (req: Request, res: Response) => {
  const { token, newPassword, confirmPassword } = req.body;

  if (!token || !newPassword || !confirmPassword) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ error: 'Las contraseñas no coinciden.' });
  }

  const passCheck = validatePasswordPolicy(newPassword);
  if (!passCheck.isValid) {
    return res.status(400).json({ error: passCheck.message });
  }

  const resetRecord = clinicDb.passwordResetTokens.get(String(token).trim());
  if (!resetRecord || resetRecord.used || Date.now() > resetRecord.expiresAt) {
    return res.status(400).json({ error: 'El código de recuperación es inválido o ha expirado.' });
  }

  const user = clinicDb.users.find(u => u.id === resetRecord.userId);
  if (!user) {
    return res.status(404).json({ error: 'Usuario no encontrado.' });
  }

  const newHash = hashPassword(newPassword);
  user.passwordHash = newHash.hash;
  user.salt = newHash.salt;
  user.updatedAt = new Date().toISOString();
  resetRecord.used = true;

  // Invalidate any active sessions for security
  for (const [sToken, session] of clinicDb.sessions.entries()) {
    if (session.userId === user.id) {
      clinicDb.sessions.delete(sToken);
    }
  }

  clinicDb.logAudit({
    userName: user.fullName,
    userRole: user.role,
    moduleAffected: 'Seguridad y Autenticación',
    eventType: 'RESTABLECIMIENTO_CLAVE',
    actionDescription: `Contraseña restablecida exitosamente para ${user.email}. Sesiones previas invalidadas.`,
    ipAddress: req.ip,
  });

  clinicDb.saveToDisk();

  return res.json({
    success: true,
    message: 'Contraseña actualizada exitosamente. Por favor inicie sesión con su nueva clave.',
  });
});

// -------------------------------------------------------------
// PUBLIC CLINICAL DATA ENDPOINT (Unauthenticated visitors)
// -------------------------------------------------------------

apiRouter.get('/public/data', (req: Request, res: Response) => {
  // Exposes ONLY public medical catalog without private patient info
  const publicDoctors = clinicDb.doctors
    .filter(d => d.isActive)
    .map(d => ({
      id: d.id,
      code: d.code,
      fullName: d.fullName,
      specialtyIds: d.specialtyIds,
      phone: d.phone,
      email: d.email,
      licenseNumber: d.licenseNumber,
      roomNumber: d.roomNumber,
      avatarUrl: d.avatarUrl,
      isActive: d.isActive,
    }));

  return res.json({
    specialties: clinicDb.specialties.filter(s => s.isActive),
    services: clinicDb.services,
    doctors: publicDoctors,
    schedules: clinicDb.schedules,
    absences: clinicDb.absences,
  });

});

// -------------------------------------------------------------
// PROTECTED ADMINISTRATIVE ENDPOINTS (Admin Only)
// -------------------------------------------------------------

/**
 * GET /api/admin/staff-requests
 * Lists all staff registration applications
 */
apiRouter.get(
  '/admin/staff-requests',
  authenticateToken,
  requireRoles('Administrador'),
  (req: AuthenticatedRequest, res: Response) => {
    return res.json({ requests: clinicDb.staffRequests });
  }
);

/**
 * POST /api/admin/staff-requests/:id/approve
 * Approves a staff request: creates active doctor or receptionist account
 */
apiRouter.post(
  '/admin/staff-requests/:id/approve',
  authenticateToken,
  requireRoles('Administrador'),
  (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const request = clinicDb.staffRequests.find(r => r.id === id);

    if (!request) {
      return res.status(404).json({ error: 'Solicitud no encontrada.' });
    }

    if (request.status !== 'PENDING') {
      return res.status(400).json({ error: `La solicitud ya ha sido procesada previamente (${request.status}).` });
    }

    // Safety check: ensure target role is NOT Administrador (single admin invariant)
    const targetRole = request.type === 'MEDICO' ? 'Médico' : 'Recepcionista';
    assertSingleAdminInvariant(clinicDb.users, targetRole);

    let doctorId: string | undefined = undefined;

    // If Médico, create doctor in clinic directory
    if (request.type === 'MEDICO') {
      doctorId = `doc-${(clinicDb.doctors.length + 1).toString().padStart(3, '0')}`;
      const newDoctor = {
        id: doctorId,
        code: `MED-${(clinicDb.doctors.length + 1).toString().padStart(3, '0')}`,
        licenseNumber: request.licenseNumber || 'MP-PENDIENTE',
        fullName: request.fullName,
        specialtyIds: request.specialtyId ? [request.specialtyId] : ['esp-medgen'],
        phone: request.phone,
        email: request.email,
        isActive: true,
        roomNumber: `Consultorio ${100 + clinicDb.doctors.length + 1}`,
      };
      clinicDb.doctors.push(newDoctor as any);

      // Create a default initial schedule (e.g. Lunes 08:00 - 12:00, 15 min slots)
      clinicDb.schedules.push({
        id: `sch-${clinicDb.schedules.length + 1}`,
        doctorId,
        dayOfWeek: 'Lunes',
        startTime: '08:00',
        endTime: '12:00',
        slotDurationMinutes: 15,
      });
    }

    // Create active User account
    const newUser: UserRecord = {
      id: `usr-${Date.now()}`,
      email: request.email,
      passwordHash: request.passwordHash,
      salt: request.salt,
      fullName: request.fullName,
      role: targetRole,
      status: 'ACTIVE',
      phone: request.phone,
      ci: request.ci,
      doctorId,
      licenseNumber: request.licenseNumber,
      specialtyId: request.specialtyId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      failedLoginAttempts: 0,
    };
    clinicDb.users.push(newUser);

    request.status = 'APPROVED';
    request.reviewedAt = new Date().toISOString();
    request.reviewedBy = req.userSession!.fullName;

    clinicDb.logAudit({
      userName: req.userSession!.fullName,
      userRole: 'Administrador',
      moduleAffected: 'Gestión de Personal',
      eventType: 'APROBACION_SOLICITUD_PERSONAL',
      actionDescription: `Solicitud de ${request.type} #${request.id} APROBADA para ${request.fullName} (${request.email}). Cuenta activada con rol ${targetRole}.`,
      ipAddress: req.ip,
    });

    clinicDb.saveToDisk();

    return res.json({
      success: true,
      message: `Solicitud aprobada con éxito. La cuenta de ${request.fullName} ha sido activada con rol ${targetRole}.`,
      newUser: {
        id: newUser.id,
        fullName: newUser.fullName,
        role: newUser.role,
        email: newUser.email,
      },
    });
  }
);

/**
 * POST /api/admin/staff-requests/:id/reject
 * Rejects a staff request with reason
 */
apiRouter.post(
  '/admin/staff-requests/:id/reject',
  authenticateToken,
  requireRoles('Administrador'),
  (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { reason } = req.body;
    const request = clinicDb.staffRequests.find(r => r.id === id);

    if (!request) {
      return res.status(404).json({ error: 'Solicitud no encontrada.' });
    }

    if (request.status !== 'PENDING') {
      return res.status(400).json({ error: `La solicitud ya se encuentra en estado ${request.status}.` });
    }

    request.status = 'REJECTED';
    request.reviewedAt = new Date().toISOString();
    request.reviewedBy = req.userSession!.fullName;
    request.rejectionReason = reason ? String(reason).trim() : 'No cumple con las credenciales requeridas por la clínica.';

    clinicDb.logAudit({
      userName: req.userSession!.fullName,
      userRole: 'Administrador',
      moduleAffected: 'Gestión de Personal',
      eventType: 'RECHAZO_SOLICITUD_PERSONAL',
      actionDescription: `Solicitud de ${request.type} #${request.id} RECHAZADA para ${request.fullName}. Motivo: ${request.rejectionReason}`,
      ipAddress: req.ip,
    });

    clinicDb.saveToDisk();

    return res.json({
      success: true,
      message: 'Solicitud rechazada.',
      request,
    });
  }
);

/**
 * GET /api/admin/system-status
 * Validates single admin guarantee & overall system stats
 */
apiRouter.get(
  '/admin/system-status',
  authenticateToken,
  requireRoles('Administrador'),
  (req: AuthenticatedRequest, res: Response) => {
    const activeAdmins = clinicDb.users.filter(u => u.role === 'Administrador' && u.status === 'ACTIVE');
    const singleAdminValid = activeAdmins.length === 1;

    return res.json({
      singleAdminValid,
      activeAdminCount: activeAdmins.length,
      administratorEmail: activeAdmins[0]?.email || null,
      totalUsers: clinicDb.users.length,
      usersByRole: {
        Administrador: activeAdmins.length,
        Médico: clinicDb.users.filter(u => u.role === 'Médico' && u.status === 'ACTIVE').length,
        Recepcionista: clinicDb.users.filter(u => u.role === 'Recepcionista' && u.status === 'ACTIVE').length,
        Paciente: clinicDb.users.filter(u => u.role === 'Paciente' && u.status === 'ACTIVE').length,
      },
      pendingStaffRequestsCount: clinicDb.staffRequests.filter(r => r.status === 'PENDING').length,
      totalAppointments: clinicDb.appointments.length,
      totalAuditLogs: clinicDb.auditLogs.length,
    });
  }
);

// -------------------------------------------------------------
// APPOINTMENTS ENDPOINTS (Role-based access)
// -------------------------------------------------------------

/**
 * GET /api/appointments
 * Patient sees only their appointments; Doctor sees only their agenda; Staff sees all
 * Supports ?patientId= query parameter to retrieve complete consultation history of a patient
 */
apiRouter.get('/appointments', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const session = req.userSession!;
  const patientId = req.query.patientId as string | undefined;

  if (session.role === 'Paciente') {
    const patientAppointments = clinicDb.appointments.filter(a => a.patientId === session.patientId);
    return res.json({ appointments: patientAppointments });
  }

  // Doctor or Staff requesting consultation history of a specific patient (CU21)
  if (patientId) {
    const patientAppointments = clinicDb.appointments
      .filter(a => a.patientId === patientId)
      .sort((a, b) => new Date(`${b.date}T${b.startTime}`).getTime() - new Date(`${a.date}T${a.startTime}`).getTime());
    return res.json({ appointments: patientAppointments });
  }

  if (session.role === 'Médico') {
    const doctorAppointments = clinicDb.appointments.filter(a => a.doctorId === session.doctorId);
    return res.json({ appointments: doctorAppointments });
  }

  // Recepcionista & Administrador see all
  return res.json({ appointments: clinicDb.appointments });
});

/**
 * GET /api/patients/:id/history
 * Comprehensive Patient Medical History (CU21, CU22)
 * Allows Doctors, Receptionists, and Administrators to view:
 * 1. Patient background (bloodType, allergies, chronicDiseases, medications)
 * 2. Full timeline of past consultations and prescriptions from other physicians
 */
apiRouter.get('/patients/:id/history', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const session = req.userSession!;

  const patient = clinicDb.patients.find(p => p.id === id);
  if (!patient) {
    return res.status(404).json({ error: 'Paciente no encontrado.' });
  }

  // If role is Paciente, can only inspect own file
  if (session.role === 'Paciente' && session.patientId !== id) {
    return res.status(403).json({ error: 'Acceso restringido: Solo puede consultar su propio expediente clínico.' });
  }

  // Get all patient appointments sorted descending
  const patientAppointments = clinicDb.appointments
    .filter(a => a.patientId === id)
    .sort((a, b) => new Date(`${b.date}T${b.startTime}`).getTime() - new Date(`${a.date}T${a.startTime}`).getTime());

  return res.json({
    patient,
    appointments: patientAppointments,
  });
});

/**
 * POST /api/appointments/book
 * STRICT Requirement: Only authenticated users with role PACIENTE can book through this self-service flow.
 * Associates appointment to the authenticated patient identity, preventing impersonation.
 */
apiRouter.post('/appointments/book', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const session = req.userSession!;

  // 1. Role verification
  if (session.role !== 'Paciente') {
    return res.status(403).json({
      error: 'Restricción de rol: Solo los usuarios con cuenta de PACIENTE pueden solicitar citas mediante el flujo de autoservicio.',
    });
  }

  const { specialtyId, doctorId, date, startTime, endTime, reason, paymentMethod } = req.body;

  if (!specialtyId || !doctorId || !date || !startTime || !endTime) {
    return res.status(400).json({ error: 'Faltan parámetros obligatorios de la cita médica.' });
  }

  const doctor = clinicDb.doctors.find(d => d.id === doctorId);
  if (!doctor || !doctor.isActive) {
    return res.status(400).json({ error: 'El médico especialista seleccionado no está disponible o está inactivo.' });
  }

  // 2. Validate slot availability, absences, and concurrency check
  const slotCheck = validateAppointmentSlot({
    doctorId,
    doctor,
    date,
    startTime,
    endTime,
    schedules: clinicDb.schedules,
    existingAppointments: clinicDb.appointments,
    absences: clinicDb.absences,
  });

  if (!slotCheck.isValid) {
    return res.status(409).json({
      error: slotCheck.errorMessage || 'El horario seleccionado ya no se encuentra disponible. Por favor elija otro turno.',
      errorCode: slotCheck.errorCode,
    });
  }

  // 3. Bind strictly to authenticated patient identity
  const patientId = session.patientId!;
  const patient = clinicDb.patients.find(p => p.id === patientId);

  const specialty = clinicDb.specialties.find(s => s.id === specialtyId);
  const newCode = generateAppointmentCode(clinicDb.appointments);

  const newAppointment: Appointment = {
    id: `appt-${Date.now()}`,
    code: newCode,
    patientId,
    doctorId,
    specialtyId,
    date,
    startTime,
    endTime,
    timeSlot: `${startTime} - ${endTime}`,
    reason: reason ? String(reason).trim() : 'Consulta médica ambulatoria programada',
    status: 'Programada',
    paymentMethod: paymentMethod || 'QR_SIMPLE',
    paymentTransactionId: `TX-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`,
    paymentAmount: specialty?.consultationFee || 180,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  clinicDb.appointments.push(newAppointment);

  clinicDb.logAudit({
    userName: session.fullName,
    userRole: session.role || 'Paciente',
    moduleAffected: 'Reserva de Citas',
    eventType: 'CITA_CREADA',
    actionDescription: `Cita ${newCode} generada exitosamente para ${patient?.firstName ? `${patient.firstName} ${patient.lastName}` : session.fullName} con ${doctor.fullName} (${specialty?.name || specialtyId}) para el ${date} en el horario ${startTime}-${endTime}.`,
    ipAddress: req.ip,
  });

  clinicDb.logAudit({
    userName: session.fullName,
    userRole: session.role || 'Paciente',
    moduleAffected: 'Pasarela de Pagos',
    eventType: 'PAGO_REGISTRADO',
    actionDescription: `Pago de Bs. ${newAppointment.paymentAmount}.00 procesado satisfactoriamente mediante pasarela ${newAppointment.paymentMethod} (ID Transacción: ${newAppointment.paymentTransactionId}) para la cita médica ${newCode}.`,
    ipAddress: req.ip,
  });

  clinicDb.saveToDisk();

  return res.status(201).json({
    success: true,
    message: 'Cita médica confirmada exitosamente.',
    appointment: newAppointment,
  });
});

/**
 * PATCH /api/appointments/:id/status
 * Update status with role-based permissions
 */
apiRouter.patch('/appointments/:id/status', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { newStatus, cancellationReason, clinicalNotes, vitalSigns } = req.body;
  const session = req.userSession!;

  const appt = clinicDb.appointments.find(a => a.id === id);
  if (!appt) {
    return res.status(404).json({ error: 'Cita no encontrada.' });
  }

  // Permission checks
  if (session.role === 'Paciente') {
    if (appt.patientId !== session.patientId) {
      return res.status(403).json({ error: 'No tiene permiso para modificar citas de otro paciente.' });
    }
    if (newStatus !== 'Cancelada') {
      return res.status(403).json({ error: 'Los pacientes únicamente pueden cancelar sus propias citas.' });
    }
  }

  if (session.role === 'Médico') {
    if (appt.doctorId !== session.doctorId) {
      return res.status(403).json({ error: 'No tiene permiso para gestionar citas de otro médico.' });
    }
  }

  const transition = canTransitionStatus(appt.status, newStatus);
  if (!transition.allowed) {
    return res.status(400).json({ error: transition.reason || 'Transición de estado no permitida.' });
  }

  appt.status = newStatus;
  if (cancellationReason) appt.cancellationReason = cancellationReason;
  if (clinicalNotes) appt.clinicalNotes = clinicalNotes;
  if (vitalSigns) appt.vitalSigns = vitalSigns;
  appt.updatedAt = new Date().toISOString();

  let eventType = 'ESTADO_CITA_ACTUALIZADO';
  if (newStatus === 'Atendida') eventType = 'CITA_ATENDIDA';
  else if (newStatus === 'Cancelada') eventType = 'CITA_CANCELADA';
  else if (newStatus === 'Confirmada') eventType = 'CITA_CONFIRMADA';

  clinicDb.logAudit({
    userName: session.fullName,
    userRole: session.role,
    moduleAffected: 'Gestión de Citas',
    eventType,
    actionDescription: `Cita ${appt.code} actualizada a "${newStatus}" por ${session.fullName} (${session.role}).${cancellationReason ? ` Motivo: ${cancellationReason}` : ''}`,
    ipAddress: req.ip,
  });

  clinicDb.saveToDisk();

  return res.json({ success: true, appointment: appt });
});

/**
 * POST /api/appointments/doctor-emergency-cancel
 * Cancels all scheduled/confirmed appointments for a doctor on a specific date
 * due to an emergency or contingency, notifying patients and enabling free rescheduling.
 */
apiRouter.post(
  '/appointments/doctor-emergency-cancel',
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    const { doctorId, date, reason } = req.body;
    const session = req.userSession!;

    if (!doctorId || !date) {
      return res.status(400).json({ error: 'Debe especificar el médico y la fecha de la emergencia.' });
    }

    // Role check: Only the assigned doctor or an Administrator can declare an emergency
    if (session.role === 'Médico' && session.doctorId !== doctorId) {
      return res.status(403).json({ error: 'Únicamente puede suspender sus propias consultas.' });
    }
    if (session.role !== 'Médico' && session.role !== 'Administrador') {
      return res.status(403).json({ error: 'No tiene permisos para suspender consultas médicas.' });
    }

    const doctor = clinicDb.doctors.find(d => d.id === doctorId);
    if (!doctor) {
      return res.status(404).json({ error: 'Médico no encontrado.' });
    }

    const emergencyReason = reason
      ? String(reason).trim()
      : 'Emergencia médica del doctor: No podrá atender en esta fecha. La ficha médica conserva su validez para ser reprogramada sin costo adicional en el portal.';

    // Filter appointments for this doctor on this date that are not yet Attended (RN10)
    const affectedAppointments = clinicDb.appointments.filter(
      a => a.doctorId === doctorId && a.date === date && a.status !== 'Atendida' && a.status !== 'Cancelada'
    );

    if (affectedAppointments.length === 0) {
      return res.json({
        success: true,
        count: 0,
        message: 'No se encontraron citas activas pendientes para cancelar en la fecha seleccionada.',
        appointments: [],
      });
    }

    const updatedList: Appointment[] = [];

    for (const appt of affectedAppointments) {
      appt.status = 'Cancelada';
      appt.cancellationReason = emergencyReason;
      appt.updatedAt = new Date().toISOString();
      updatedList.push(appt);

      // Notify patient via email if patient record has email
      const patient = clinicDb.patients.find(p => p.id === appt.patientId);
      const specialty = clinicDb.specialties.find(s => s.id === appt.specialtyId);
      if (patient?.email) {
        sendDoctorEmergencyNoticeEmail({
          toEmail: patient.email,
          recipientName: `${patient.firstName} ${patient.lastName}`,
          doctorName: doctor.fullName,
          specialtyName: specialty?.name || 'Consulta Médica',
          date: appt.date,
          timeSlot: appt.timeSlot,
          apptCode: appt.code,
          reason: emergencyReason,
        }).catch(err => console.warn(`[SMTP NOTICE ERROR] ${err.message}`));
      }
    }

    clinicDb.logAudit({
      userName: session.fullName,
      userRole: session.role,
      moduleAffected: 'Gestión de Citas',
      eventType: 'EMERGENCIA_MEDICA_CANCELACION_DIARIA',
      actionDescription: `El ${doctor.fullName} declaró emergencia médica para el ${date}. Se cancelaron ${affectedAppointments.length} citas activas, garantizando la validez de la ficha para reprogramación. Motivo: ${emergencyReason}`,
      ipAddress: req.ip,
    });

    clinicDb.saveToDisk();

    return res.json({
      success: true,
      count: affectedAppointments.length,
      message: `Se han suspendido ${affectedAppointments.length} citas médicas por emergencia médica. Se notificó a los pacientes y sus fichas han sido habilitadas para reprogramación inmediata sin costo.`,
      cancelledAppointments: updatedList,
    });
  }
);

/**
 * PATCH /api/appointments/:id/reschedule
 * Reschedules an appointment to a new date and time slot with full collision validation.
 * Enables patients to select a new date without losing their purchased ficha.
 */
apiRouter.patch(
  '/appointments/:id/reschedule',
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { newDate, newStartTime, newEndTime, newTimeSlot } = req.body;
    const session = req.userSession!;

    if (!newDate || !newStartTime || !newEndTime) {
      return res.status(400).json({ error: 'Debe especificar la nueva fecha, hora de inicio y hora de fin.' });
    }

    const appt = clinicDb.appointments.find(a => a.id === id);
    if (!appt) {
      return res.status(404).json({ error: 'Cita médica no encontrada.' });
    }

    // RN10: Inmutabilidad de citas ya atendidas
    if (appt.status === 'Atendida') {
      return res.status(400).json({ error: 'Una cita ya atendida no puede ser reprogramada (RN10).' });
    }

    // Role checks
    if (session.role === 'Paciente' && appt.patientId !== session.patientId) {
      return res.status(403).json({ error: 'No tiene permiso para reprogramar citas de otro paciente.' });
    }
    if (session.role === 'Médico' && appt.doctorId !== session.doctorId) {
      return res.status(403).json({ error: 'No tiene permiso para reprogramar citas de otro médico.' });
    }

    const doctor = clinicDb.doctors.find(d => d.id === appt.doctorId);
    if (!doctor || !doctor.isActive) {
      return res.status(400).json({ error: 'El médico asignado no se encuentra activo.' });
    }

    const slotLabel = newTimeSlot || `${newStartTime} - ${newEndTime}`;

    // Validate collision, absences, and schedule availability
    const validation = validateAppointmentSlot({
      doctorId: doctor.id,
      doctor,
      date: newDate,
      startTime: newStartTime,
      endTime: newEndTime,
      schedules: clinicDb.schedules,
      existingAppointments: clinicDb.appointments,
      absences: clinicDb.absences,
      excludeAppointmentId: appt.id,
    });

    if (!validation.isValid) {
      return res.status(400).json({ error: validation.errorMessage || 'El horario seleccionado no está disponible.' });
    }

    const oldDate = appt.date;
    const oldSlot = appt.timeSlot;

    appt.date = newDate;
    appt.startTime = newStartTime;
    appt.endTime = newEndTime;
    appt.timeSlot = slotLabel;
    appt.status = 'Programada';
    appt.cancellationReason = undefined;
    appt.updatedAt = new Date().toISOString();

    clinicDb.logAudit({
      userName: session.fullName,
      userRole: session.role,
      moduleAffected: 'Gestión de Citas',
      eventType: 'CITA_REPROGRAMADA',
      actionDescription: `Cita ${appt.code} reprogramada exitosamente del ${oldDate} (${oldSlot}) al ${newDate} (${slotLabel}) con ${doctor.fullName} por ${session.fullName} (${session.role}).`,
      ipAddress: req.ip,
    });

    clinicDb.saveToDisk();

    // Send confirmation email
    const patient = clinicDb.patients.find(p => p.id === appt.patientId);
    const specialty = clinicDb.specialties.find(s => s.id === appt.specialtyId);
    if (patient?.email) {
      sendAppointmentRescheduledEmail({
        toEmail: patient.email,
        recipientName: `${patient.firstName} ${patient.lastName}`,
        doctorName: doctor.fullName,
        specialtyName: specialty?.name || 'Consulta Médica',
        newDate: appt.date,
        newTimeSlot: appt.timeSlot,
        apptCode: appt.code,
      }).catch(err => console.warn(`[SMTP NOTICE ERROR] ${err.message}`));
    }

    return res.json({
      success: true,
      message: `Cita ${appt.code} reprogramada exitosamente para el ${newDate} a las ${slotLabel}.`,
      appointment: appt,
    });
  }
);

// -------------------------------------------------------------
// DOCTOR ABSENCES AND VACATIONS MANAGEMENT (CU12b)
// -------------------------------------------------------------

/**
 * GET /api/doctor-absences
 * Lists doctor absences and vacations, optionally filtered by doctorId.
 */
apiRouter.get('/doctor-absences', (req: Request, res: Response) => {
  const { doctorId } = req.query;
  let list = clinicDb.absences;
  if (doctorId && typeof doctorId === 'string') {
    list = list.filter(a => a.doctorId === doctorId);
  }
  return res.json({ absences: list });
});

/**
 * POST /api/doctor-absences
 * Allows Doctors or Administrators to schedule periods of non-attendance
 * (vacations, congress, personal leave). Automatically suspends conflicting appointments
 * and notifies patients so they can reschedule without additional fees.
 */
apiRouter.post(
  '/doctor-absences',
  authenticateToken,
  requireRoles('Médico', 'Administrador'),
  async (req: AuthenticatedRequest, res: Response) => {
    const session = req.userSession!;
    const { doctorId, startDate, endDate, type, reason } = req.body;

    if (!doctorId || !startDate || !endDate || !type || !reason) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios: médico, fecha de inicio, fecha de fin, tipo y motivo.' });
    }

    // Role check: If doctor, can only register for own account
    if (session.role === 'Médico' && session.doctorId !== doctorId) {
      return res.status(403).json({ error: 'No tiene autorización para registrar ausencias de otro profesional médico.' });
    }

    const doctor = clinicDb.doctors.find(d => d.id === doctorId);
    if (!doctor) {
      return res.status(404).json({ error: 'Médico especialista no encontrado.' });
    }

    if (startDate > endDate) {
      return res.status(400).json({ error: 'La fecha de inicio no puede ser posterior a la fecha de finalización.' });
    }

    const validTypes: DoctorAbsence['type'][] = ['VACACIONES', 'PERMISO', 'CONGRESO', 'LICENCIA', 'OTRO'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: `Tipo de ausencia no válido. Debe ser uno de: ${validTypes.join(', ')}.` });
    }

    const typeLabels: Record<string, string> = {
      VACACIONES: 'Vacaciones',
      PERMISO: 'Permiso institucional',
      CONGRESO: 'Congreso médico',
      LICENCIA: 'Licencia médica',
      OTRO: 'Ausencia autorizada',
    };
    const friendlyType = typeLabels[type] || type;

    // Check conflicting active appointments within this date range
    const affectedAppointments = clinicDb.appointments.filter(
      a => a.doctorId === doctorId &&
           a.date >= startDate &&
           a.date <= endDate &&
           a.status !== 'Cancelada' &&
           a.status !== 'Atendida'
    );

    for (const appt of affectedAppointments) {
      appt.status = 'Cancelada';
      appt.cancellationReason = `Cancelada por ${friendlyType.toLowerCase()} del médico (${reason}). Se garantiza la validez de la ficha médica para reprogramación gratuita.`;
      appt.updatedAt = new Date().toISOString();

      const patient = clinicDb.patients.find(p => p.id === appt.patientId);
      const specialty = clinicDb.specialties.find(s => s.id === appt.specialtyId);
      if (patient?.email) {
        sendDoctorAbsenceNoticeEmail({
          toEmail: patient.email,
          recipientName: `${patient.firstName} ${patient.lastName}`,
          doctorName: doctor.fullName,
          specialtyName: specialty?.name || 'Consulta Médica',
          date: appt.date,
          timeSlot: appt.timeSlot,
          apptCode: appt.code,
          absenceType: friendlyType,
          absenceReason: reason,
        }).catch(err => console.warn(`[SMTP NOTICE ERROR] ${err.message}`));
      }
    }

    const newAbsence: DoctorAbsence = {
      id: `abs-${Date.now()}`,
      doctorId,
      startDate,
      endDate,
      type,
      reason: String(reason).trim(),
      createdAt: new Date().toISOString(),
      createdBy: session.fullName,
    };

    clinicDb.absences.push(newAbsence);

    clinicDb.logAudit({
      userName: session.fullName,
      userRole: session.role,
      moduleAffected: 'Gestión de Ausencias',
      eventType: 'AUSENCIA_MEDICA_REGISTRADA',
      actionDescription: `${friendlyType} programada para el ${doctor.fullName} del ${startDate} al ${endDate}. Motivo: ${reason}. Citas suspendidas para reprogramación gratuita: ${affectedAppointments.length}.`,
      ipAddress: req.ip,
    });

    clinicDb.saveToDisk();

    return res.json({
      success: true,
      message: `Período de ${friendlyType.toLowerCase()} registrado correctamente del ${startDate} al ${endDate}. ${affectedAppointments.length > 0 ? `Se suspendieron ${affectedAppointments.length} citas activas notificando a los pacientes para su reprogramación.` : 'No habían citas previas en ese período.'}`,
      absence: newAbsence,
      affectedAppointmentsCount: affectedAppointments.length,
    });
  }
);

/**
 * DELETE /api/doctor-absences/:id
 * Removes an absence / vacation record
 */
apiRouter.delete(
  '/doctor-absences/:id',
  authenticateToken,
  requireRoles('Médico', 'Administrador'),
  (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const session = req.userSession!;

    const index = clinicDb.absences.findIndex(a => a.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Registro de ausencia no encontrado.' });
    }

    const absence = clinicDb.absences[index];

    // If role is Médico, must match session.doctorId
    if (session.role === 'Médico' && session.doctorId !== absence.doctorId) {
      return res.status(403).json({ error: 'No tiene permiso para eliminar ausencias de otro profesional.' });
    }

    const doctor = clinicDb.doctors.find(d => d.id === absence.doctorId);

    clinicDb.absences.splice(index, 1);

    clinicDb.logAudit({
      userName: session.fullName,
      userRole: session.role,
      moduleAffected: 'Gestión de Ausencias',
      eventType: 'AUSENCIA_MEDICA_ELIMINADA',
      actionDescription: `Se eliminó el registro de ausencia (${absence.type}) para el ${doctor?.fullName || absence.doctorId} del ${absence.startDate} al ${absence.endDate}.`,
      ipAddress: req.ip,
    });

    clinicDb.saveToDisk();

    return res.json({
      success: true,
      message: 'Registro de ausencia eliminado con éxito.',
    });
  }
);

/**
 * GET /api/audit-logs
 * Protected: Administrator Only
 */
apiRouter.get(
  '/audit-logs',
  authenticateToken,
  requireRoles('Administrador'),
  (req: AuthenticatedRequest, res: Response) => {
    return res.json({ logs: clinicDb.auditLogs });
  }
);
