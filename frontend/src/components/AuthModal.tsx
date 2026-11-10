import { useState, useEffect, useId } from 'react';

import {
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Stethoscope,
  Building2,
  ArrowRight,
  ShieldCheck,
  X,
  KeyRound,
  FileBadge,
  Phone,
  FileText,
  UserPlus,
  LogIn,
} from 'lucide-react';
import { apiClient, type AuthUser } from '../utils/apiClient.ts';
import type { Specialty, Doctor } from '../types/clinic.ts';

export type AuthModalMode = 'LOGIN' | 'REGISTER_PATIENT' | 'REGISTER_STAFF' | 'FORGOT_PASSWORD';

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: AuthModalMode;
  onClose: () => void;
  onLoginSuccess: (user: AuthUser) => void;
  specialties: Specialty[];
  doctors?: Doctor[];
  pendingBookingContext?: {
    specialtyName?: string;
    doctorName?: string;
    date?: string;
    timeSlot?: string;
  } | null;
}

export default function AuthModal({
  isOpen,
  initialMode = 'LOGIN',
  onClose,
  onLoginSuccess,
  specialties,
  doctors = [],
  pendingBookingContext,
}: AuthModalProps) {
  const [mode, setMode] = useState<AuthModalMode>(initialMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setError(null);
      setSuccessMessage(null);
    }
  }, [isOpen, initialMode]);


  // Password visibility toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Patient Registration form state
  const [patientFirstName, setPatientFirstName] = useState('');
  const [patientLastName, setPatientLastName] = useState('');
  const [patientCI, setPatientCI] = useState('');
  const [patientEmail, setPatientEmail] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [patientBirthDate, setPatientBirthDate] = useState('1995-06-15');
  const [patientGender, setPatientGender] = useState<'Masculino' | 'Femenino' | 'Otro'>('Femenino');
  const [patientPassword, setPatientPassword] = useState('');
  const [patientConfirmPassword, setPatientConfirmPassword] = useState('');
  const [patientAcceptTerms, setPatientAcceptTerms] = useState(false);

  // Staff Registration form state
  const [staffType, setStaffType] = useState<'MEDICO' | 'RECEPCIONISTA'>('MEDICO');
  const [staffFirstName, setStaffFirstName] = useState('');
  const [staffLastName, setStaffLastName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPhone, setStaffPhone] = useState('');
  const [staffCI, setStaffCI] = useState('');
  const [staffSpecialtyId, setStaffSpecialtyId] = useState(specialties[0]?.id || 'esp-medgen');
  const [staffLicenseNumber, setStaffLicenseNumber] = useState('');
  const [staffNotes, setStaffNotes] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [staffConfirmPassword, setStaffConfirmPassword] = useState('');
  const [staffAcceptTerms, setStaffAcceptTerms] = useState(false);

  // Password recovery state
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryToken, setRecoveryToken] = useState('');
  const [recoveryStep, setRecoveryStep] = useState<'REQUEST' | 'RESET'>('REQUEST');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // Accessibility IDs
  const loginEmailId = useId();
  const loginPassId = useId();
  const rememberId = useId();
  const patTermsId = useId();
  const staffTermsId = useId();

  if (!isOpen) return null;

  const resetMessages = () => {
    setError(null);
    setSuccessMessage(null);
  };

  const switchMode = (newMode: AuthModalMode) => {
    resetMessages();
    if (newMode === 'FORGOT_PASSWORD') {
      setRecoveryStep('REQUEST');
      setRecoveryToken('');
      setNewPassword('');
      setConfirmNewPassword('');
    }
    setMode(newMode);
  };


  // 1. Submit Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);

    try {
      const res = await apiClient.login(loginEmail, loginPassword, rememberMe);
      onLoginSuccess(res.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  // 2. Submit Patient Self-Registration
  const handlePatientRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    if (!patientAcceptTerms) {
      setError('Debe aceptar las políticas de privacidad y condiciones de servicio.');
      return;
    }
    if (patientPassword !== patientConfirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.registerPatient({
        firstName: patientFirstName,
        lastName: patientLastName,
        ci: patientCI,
        email: patientEmail,
        phone: patientPhone,
        birthDate: patientBirthDate,
        gender: patientGender,
        password: patientPassword,
        confirmPassword: patientConfirmPassword,
        acceptTerms: patientAcceptTerms,
      });

      setSuccessMessage('¡Cuenta de paciente creada exitosamente! Sesión iniciada.');
      setTimeout(() => {
        onLoginSuccess(res.user);
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Error al registrar paciente');
    } finally {
      setLoading(false);
    }
  };

  // 3. Submit Staff Application (Requires Admin Approval)
  const handleStaffRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    if (!staffAcceptTerms) {
      setError('Debe aceptar el código de ética y políticas de la clínica.');
      return;
    }
    if (staffPassword !== staffConfirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.registerStaffRequest({
        type: staffType,
        firstName: staffFirstName,
        lastName: staffLastName,
        email: staffEmail,
        phone: staffPhone,
        ci: staffCI,
        specialtyId: staffType === 'MEDICO' ? staffSpecialtyId : undefined,
        licenseNumber: staffType === 'MEDICO' ? staffLicenseNumber : undefined,
        notes: staffNotes,
        password: staffPassword,
        confirmPassword: staffConfirmPassword,
        acceptTerms: staffAcceptTerms,
      });

      setSuccessMessage(res.message);
    } catch (err: any) {
      setError(err.message || 'Error al enviar solicitud de personal');
    } finally {
      setLoading(false);
    }
  };

  // 4. Submit Forgot Password
  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);

    try {
      const res = await apiClient.forgotPassword(recoveryEmail);
      setSuccessMessage(res.message);
      setRecoveryToken('');
      setRecoveryStep('RESET');
    } catch (err: any) {
      setError(err.message || 'Error al procesar recuperación');
    } finally {
      setLoading(false);
    }
  };

  // 5. Submit Reset Password
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    if (newPassword !== confirmNewPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.resetPassword(recoveryToken, newPassword, confirmNewPassword);
      setSuccessMessage(res.message);
      setTimeout(() => {
        setRecoveryStep('REQUEST');
        switchMode('LOGIN');
      }, 1800);
    } catch (err: any) {
      setError(err.message || 'Error al restablecer contraseña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">

      <div className="relative w-full max-w-xl my-8 bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden text-slate-800">
        
        {/* Header with clinic identity */}
        <div className="bg-gradient-to-r from-teal-800 via-teal-700 to-emerald-700 p-6 text-white relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/15 rounded-2xl backdrop-blur-xs border border-white/20">
              <Building2 className="w-6 h-6 text-teal-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black tracking-tight">CLÍNICA MEDICAL</h2>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-500/30 border border-teal-300/40 text-teal-100">
                  Ambulatoria
                </span>
              </div>
              <p className="text-xs text-teal-100/90 font-medium">
                Sistema Integral de Autenticación & Control de Acceso (RBAC)
              </p>
            </div>
          </div>

          {/* Pending booking alert banner if user was trying to book a slot */}
          {pendingBookingContext && (
            <div className="mt-4 p-3 bg-white/15 rounded-xl border border-white/25 text-xs flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block font-bold">Turno Preseleccionado:</strong>
                <span className="text-teal-100">
                  {pendingBookingContext.specialtyName || 'Especialidad'} con {pendingBookingContext.doctorName || 'Médico'}{' '}
                  • {pendingBookingContext.date} ({pendingBookingContext.timeSlot})
                </span>
                <p className="text-[11px] text-teal-200 mt-1">
                  Inicie sesión como <strong>Paciente</strong> o regístrese gratis para confirmar la cita de forma segura.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Global Notifications (Error / Success) */}
        <div className="px-6 pt-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}
        </div>

        {/* View Mode 1: LOGIN */}
        {mode === 'LOGIN' && (
          <div className="p-6 sm:p-8 space-y-6">
            <div>
              <h3 className="text-lg font-black text-slate-900">Iniciar Sesión</h3>
              <p className="text-xs text-slate-500 mt-1">
                Ingrese sus credenciales registradas. El servidor determinará automáticamente sus permisos y rol.
              </p>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label htmlFor={loginEmailId} className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Correo Electrónico *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    id={loginEmailId}
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="ejemplo@clinicamedical.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-teal-600 focus:ring-2 focus:ring-teal-100 text-sm outline-hidden transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor={loginPassId} className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Contraseña *
                  </label>
                  <button
                    type="button"
                    onClick={() => switchMode('FORGOT_PASSWORD')}
                    className="text-xs text-teal-700 hover:text-teal-900 font-semibold cursor-pointer"
                  >
                    ¿Olvidó su contraseña?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    id={loginPassId}
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 focus:border-teal-600 focus:ring-2 focus:ring-teal-100 text-sm outline-hidden transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
                    title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label htmlFor={rememberId} className="flex items-center gap-2 cursor-pointer text-xs text-slate-600">
                  <input
                    id={rememberId}
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded-md border-slate-300 text-teal-600 focus:ring-teal-500 w-4 h-4"
                  />
                  <span>Recordar sesión en este equipo</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md shadow-teal-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Ingresar al Sistema</span>
                  </>
                )}
              </button>
            </form>

            {/* Quick switches to patient register and staff application */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={() => switchMode('REGISTER_PATIENT')}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-teal-50 hover:bg-teal-100/80 border border-teal-200 text-teal-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <UserPlus className="w-4 h-4 text-teal-600" />
                  <span>Nuevo Paciente: Registrarse</span>
                </button>
                <button
                  type="button"
                  onClick={() => switchMode('REGISTER_STAFF')}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Stethoscope className="w-4 h-4 text-slate-500" />
                  <span>Personal: Solicitar Registro</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View Mode 2: REGISTER_PATIENT */}
        {mode === 'REGISTER_PATIENT' && (
          <div className="p-6 sm:p-8 space-y-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-teal-100 text-teal-800">
                  <UserPlus className="w-4 h-4" />
                </span>
                <h3 className="text-lg font-black text-slate-900">Registro de Pacientes</h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Cree su cuenta para solicitar citas médicas ambulatorias, consultar su historial y gestionar su ficha clínica.
              </p>
            </div>

            <form onSubmit={handlePatientRegisterSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Nombres *</label>
                  <input
                    type="text"
                    required
                    value={patientFirstName}
                    onChange={(e) => setPatientFirstName(e.target.value)}
                    placeholder="Ej. María"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:border-teal-600 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Apellidos *</label>
                  <input
                    type="text"
                    required
                    value={patientLastName}
                    onChange={(e) => setPatientLastName(e.target.value)}
                    placeholder="Ej. López Quispe"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:border-teal-600 outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Doc. Identidad (CI) *</label>
                  <input
                    type="text"
                    required
                    value={patientCI}
                    onChange={(e) => setPatientCI(e.target.value)}
                    placeholder="Ej. 5489123"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:border-teal-600 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Teléfono Móvil *</label>
                  <input
                    type="tel"
                    required
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                    placeholder="Ej. 77123456"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:border-teal-600 outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Correo Electrónico *</label>
                <input
                  type="email"
                  required
                  value={patientEmail}
                  onChange={(e) => setPatientEmail(e.target.value)}
                  placeholder="paciente@correo.com"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:border-teal-600 outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Fecha de Nacimiento</label>
                  <input
                    type="date"
                    value={patientBirthDate}
                    onChange={(e) => setPatientBirthDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:border-teal-600 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Género</label>
                  <select
                    value={patientGender}
                    onChange={(e) => setPatientGender(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:border-teal-600 outline-hidden"
                  >
                    <option value="Femenino">Femenino</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Contraseña *</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={patientPassword}
                    onChange={(e) => setPatientPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres (A-Z, a-z, 0-9)"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:border-teal-600 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Confirmar Contraseña *</label>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={patientConfirmPassword}
                    onChange={(e) => setPatientConfirmPassword(e.target.value)}
                    placeholder="Repita su contraseña"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:border-teal-600 outline-hidden"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label htmlFor={patTermsId} className="flex items-start gap-2 cursor-pointer text-xs text-slate-600">
                  <input
                    id={patTermsId}
                    type="checkbox"
                    checked={patientAcceptTerms}
                    onChange={(e) => setPatientAcceptTerms(e.target.checked)}
                    className="mt-0.5 rounded-md border-slate-300 text-teal-600 focus:ring-teal-500 w-4 h-4 shrink-0"
                  />
                  <span>
                    Acepto las políticas de privacidad y autorizo el tratamiento de mis datos de salud para atención ambulatoria.
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md shadow-teal-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Crear Cuenta de Paciente</span>
                  </>
                )}
              </button>
            </form>

            <div className="text-center pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => switchMode('LOGIN')}
                className="text-xs font-bold text-teal-700 hover:text-teal-900 cursor-pointer"
              >
                ¿Ya tiene una cuenta de paciente? Iniciar Sesión
              </button>
            </div>
          </div>
        )}

        {/* View Mode 3: REGISTER_STAFF (Application for Médico / Recepcionista) */}
        {mode === 'REGISTER_STAFF' && (
          <div className="p-6 sm:p-8 space-y-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-teal-100 text-teal-800">
                  <FileBadge className="w-4 h-4" />
                </span>
                <h3 className="text-lg font-black text-slate-900">
                  Solicitud de Registro Profesional
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Postulación para personal médico y recepcionistas. Requiere revisión y aprobación obligatoria por la Administración antes de habilitar el acceso.
              </p>
            </div>

            {/* Informative Security Warning */}
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Regla de Control Institucional:</strong> Las cuentas del personal de salud no se activan automáticamente. Su solicitud quedará en estado <strong>PENDIENTE</strong> hasta que el Administrador de la clínica valide su matrícula profesional y antecedentes.
              </span>
            </div>

            <form onSubmit={handleStaffRegisterSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Puesto al que Postula *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setStaffType('MEDICO')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-colors cursor-pointer flex items-center justify-center gap-2 ${
                      staffType === 'MEDICO'
                        ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Stethoscope className="w-4 h-4" />
                    <span>Médico Especialista</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStaffType('RECEPCIONISTA')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-colors cursor-pointer flex items-center justify-center gap-2 ${
                      staffType === 'RECEPCIONISTA'
                        ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Building2 className="w-4 h-4" />
                    <span>Recepcionista de Admisión</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Nombres *</label>
                  <input
                    type="text"
                    required
                    value={staffFirstName}
                    onChange={(e) => setStaffFirstName(e.target.value)}
                    placeholder="Ej. Dr. Roberto"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:border-teal-600 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Apellidos *</label>
                  <input
                    type="text"
                    required
                    value={staffLastName}
                    onChange={(e) => setStaffLastName(e.target.value)}
                    placeholder="Ej. Siles Morales"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:border-teal-600 outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Correo Institucional / Profesional *</label>
                  <input
                    type="email"
                    required
                    value={staffEmail}
                    onChange={(e) => setStaffEmail(e.target.value)}
                    placeholder="profesional@clinicamedical.com"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:border-teal-600 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Teléfono Móvil *</label>
                  <input
                    type="tel"
                    required
                    value={staffPhone}
                    onChange={(e) => setStaffPhone(e.target.value)}
                    placeholder="Ej. 77218900"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:border-teal-600 outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Documento de Identidad (CI) *</label>
                <input
                  type="text"
                  required
                  value={staffCI}
                  onChange={(e) => setStaffCI(e.target.value)}
                  placeholder="Ej. 4928172"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:border-teal-600 outline-hidden"
                />
              </div>

              {/* Doctor Specific Fields */}
              {staffType === 'MEDICO' && (
                <div className="p-3 bg-teal-50/60 rounded-xl border border-teal-100 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-teal-950 uppercase mb-1">
                        Especialidad Médica *
                      </label>
                      <select
                        value={staffSpecialtyId}
                        onChange={(e) => setStaffSpecialtyId(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-teal-200 bg-white text-sm focus:border-teal-600 outline-hidden"
                      >
                        {specialties.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-teal-950 uppercase mb-1">
                        Matrícula Profesional (Colegio Médico) *
                      </label>
                      <input
                        type="text"
                        required
                        value={staffLicenseNumber}
                        onChange={(e) => setStaffLicenseNumber(e.target.value)}
                        placeholder="Ej. MP-9821-BOL"
                        className="w-full px-3 py-2 rounded-xl border border-teal-200 bg-white text-sm focus:border-teal-600 outline-hidden"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Notas / Resumen Profesional (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={staffNotes}
                  onChange={(e) => setStaffNotes(e.target.value)}
                  placeholder="Años de experiencia, títulos de postgrado o turnos de preferencia..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:border-teal-600 outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Contraseña Deseada *</label>
                  <input
                    type="password"
                    required
                    value={staffPassword}
                    onChange={(e) => setStaffPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:border-teal-600 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Confirmar Contraseña *</label>
                  <input
                    type="password"
                    required
                    value={staffConfirmPassword}
                    onChange={(e) => setStaffConfirmPassword(e.target.value)}
                    placeholder="Repita la contraseña"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:border-teal-600 outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label htmlFor={staffTermsId} className="flex items-start gap-2 cursor-pointer text-xs text-slate-600">
                  <input
                    id={staffTermsId}
                    type="checkbox"
                    checked={staffAcceptTerms}
                    onChange={(e) => setStaffAcceptTerms(e.target.checked)}
                    className="mt-0.5 rounded-md border-slate-300 text-teal-600 focus:ring-teal-500 w-4 h-4 shrink-0"
                  />
                  <span>
                    Certifico la veracidad de los datos profesionales declarados y acepto el código de ética de Clínica Medical.
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md shadow-teal-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <FileBadge className="w-4 h-4" />
                    <span>Enviar Solicitud a la Administración</span>
                  </>
                )}
              </button>
            </form>

            <div className="text-center pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => switchMode('LOGIN')}
                className="text-xs font-bold text-teal-700 hover:text-teal-900 cursor-pointer"
              >
                Volver al Inicio de Sesión
              </button>
            </div>
          </div>
        )}

        {/* View Mode 4: FORGOT_PASSWORD */}
        {mode === 'FORGOT_PASSWORD' && (
          <div className="p-6 sm:p-8 space-y-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-teal-100 text-teal-800">
                  <KeyRound className="w-4 h-4" />
                </span>
                <h3 className="text-lg font-black text-slate-900">Recuperación de Contraseña</h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {recoveryStep === 'REQUEST'
                  ? 'Ingrese su correo electrónico registrado para generar un código seguro de restablecimiento.'
                  : 'Ingrese el código de recuperación y defina su nueva contraseña segura.'}
              </p>
            </div>

            {recoveryStep === 'REQUEST' ? (
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Correo Electrónico *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      required
                      value={recoveryEmail}
                      onChange={(e) => setRecoveryEmail(e.target.value)}
                      placeholder="ejemplo@clinicamedical.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-teal-600 focus:ring-2 focus:ring-teal-100 text-sm outline-hidden transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md shadow-teal-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Solicitar Código de Recuperación</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Código de Recuperación (PIN de 6 dígitos) *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    autoFocus
                    autoComplete="off"
                    value={recoveryToken}
                    onChange={(e) => setRecoveryToken(e.target.value.trim())}
                    placeholder="Ej. 482910"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-teal-600 text-center font-mono font-black text-xl tracking-widest outline-hidden bg-slate-50 focus:bg-white text-slate-900 shadow-inner"
                  />
                  <p className="text-[11px] text-slate-400 mt-1 text-center">
                    Ingrese el código de 6 dígitos que enviamos a su correo electrónico.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Nueva Contraseña *
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres (A-Z, a-z, 0-9)"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-teal-600 text-sm outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Confirmar Nueva Contraseña *
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Repita la nueva contraseña"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-teal-600 text-sm outline-hidden"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md shadow-teal-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>Actualizar Contraseña</span>
                  )}
                </button>
              </form>
            )}

            <div className="text-center pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => switchMode('LOGIN')}
                className="text-xs font-bold text-teal-700 hover:text-teal-900 cursor-pointer"
              >
                Volver al Inicio de Sesión
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
