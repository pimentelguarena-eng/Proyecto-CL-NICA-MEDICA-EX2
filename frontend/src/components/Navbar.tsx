import { useState } from 'react';
import { 
  Building2, 
  CalendarPlus, 
  UserCheck, 
  Stethoscope, 
  Activity, 
  ShieldCheck, 
  Menu, 
  X,
  Users,
  LogIn,
  UserPlus,
  LogOut,
  User as UserIcon,
} from 'lucide-react';
import type { UserSession } from '../types/clinic.ts';
import type { AuthModalMode } from './AuthModal.tsx';

interface NavbarProps {
  currentSession: UserSession | null;
  onOpenAuth: (mode?: AuthModalMode) => void;
  onLogout: () => void;
  onOpenBooking: (specialtyId?: string) => void;
  onOpenExamTests?: () => void;
  onNavigate: (view: 'portal' | 'patient' | 'admin') => void;
  currentView: 'portal' | 'patient' | 'admin';
}

export default function Navbar({
  currentSession,
  onOpenAuth,
  onLogout,
  onOpenBooking,
  onOpenExamTests: _onOpenExamTests,
  onNavigate,
  currentView,
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-teal-100 shadow-xs">
        {/* Top Emergency / Notice Bar */}
        <div className="bg-teal-900 text-teal-100 text-xs px-4 py-1.5 flex justify-between items-center flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-400/20 text-amber-200 border border-amber-400/30">
              Aviso Importante
            </span>
            <span className="font-medium text-emerald-100">
              Centro de Atención Ambulatoria Especializada • <strong>No disponemos de servicio de internación hospitalaria</strong>
            </span>
          </div>
          <div className="flex items-center gap-4 text-teal-200">
            <span>Urgencias Ambulatorias: <strong>(03) 345-8000</strong></span>
            <span className="hidden sm:inline">Lun - Sáb: 07:00 a 20:00</span>
          </div>
        </div>

        {/* Main Navbar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3 min-h-[4.5rem]">
            {/* Logo */}
            <div 
              className="flex items-center gap-2.5 sm:gap-3 cursor-pointer select-none group"
              onClick={() => onNavigate('portal')}
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-tr from-teal-700 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-teal-700/20 group-hover:scale-105 transition-transform shrink-0">
                <Building2 className="w-5 h-5 sm:w-7 sm:h-7" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  <span className="text-lg sm:text-2xl font-black tracking-tight text-teal-950 font-sans leading-none">
                    CLÍNICA MEDICAL
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-teal-100 text-teal-900 border border-teal-200">
                    Ambulatoria
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-500 font-medium tracking-tight hidden sm:block">
                  Centro de Especialidades & Diagnóstico Clínico
                </p>
              </div>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1 lg:gap-2 text-slate-700 font-medium">
              <button
                type="button"
                onClick={() => onNavigate('portal')}
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  currentView === 'portal' 
                    ? 'text-teal-700 bg-teal-50 font-bold' 
                    : 'text-slate-600 hover:text-teal-700 hover:bg-slate-50'
                }`}
              >
                Inicio
              </button>

              <a
                href="#especialidades"
                onClick={(e) => {
                  if (currentView !== 'portal') {
                    e.preventDefault();
                    onNavigate('portal');
                    setTimeout(() => {
                      document.getElementById('especialidades')?.scrollIntoView({ behavior: 'smooth' });
                    }, 100);
                  }
                }}
                className="px-3 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:text-teal-700 hover:bg-slate-50 transition-colors"
              >
                Especialidades
              </a>

              <a
                href="#servicios"
                onClick={(e) => {
                  if (currentView !== 'portal') {
                    e.preventDefault();
                    onNavigate('portal');
                    setTimeout(() => {
                      document.getElementById('servicios')?.scrollIntoView({ behavior: 'smooth' });
                    }, 100);
                  }
                }}
                className="px-3 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:text-teal-700 hover:bg-slate-50 transition-colors"
              >
                Servicios
              </a>

              {/* Role-Specific Portal Links when authenticated */}
              {currentSession && currentSession.role === 'Paciente' && (
                <button
                  type="button"
                  onClick={() => onNavigate('patient')}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                    currentView === 'patient'
                      ? 'text-teal-700 bg-teal-50 font-bold'
                      : 'text-slate-600 hover:text-teal-700 hover:bg-slate-50'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  Portal Paciente
                </button>
              )}

              {currentSession && currentSession.role !== 'Paciente' && (
                <button
                  type="button"
                  onClick={() => onNavigate('admin')}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                    currentView === 'admin'
                      ? 'text-teal-700 bg-teal-50 font-bold'
                      : 'text-slate-600 hover:text-teal-700 hover:bg-slate-50'
                  }`}
                >
                  <Stethoscope className="w-4 h-4" />
                  {currentSession.role === 'Médico'
                    ? 'Agenda Médica'
                    : currentSession.role === 'Recepcionista'
                    ? 'Panel Recepción'
                    : 'Panel Administrativo'}
                </button>
              )}
            </nav>

            {/* Action Buttons & Session State */}
            <div className="hidden lg:flex items-center gap-3">
              {currentSession ? (
                <>
                  {/* User Profile & Role Badge */}
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50/80 text-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="font-bold text-slate-900">{currentSession.role}</span>
                    <span className="text-slate-300">|</span>
                    <span className="text-slate-700 font-medium truncate max-w-[130px]" title={currentSession.fullName}>
                      {currentSession.fullName.split(' ')[0]}
                    </span>
                  </div>

                  {/* Logout Button */}
                  <button
                    type="button"
                    onClick={onLogout}
                    className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors cursor-pointer"
                    title="Cerrar Sesión"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  {/* Login Button */}
                  <button
                    type="button"
                    onClick={() => onOpenAuth('LOGIN')}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 hover:border-teal-300 bg-white hover:bg-teal-50/40 text-slate-700 hover:text-teal-800 font-bold text-xs shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <LogIn className="w-4 h-4 text-teal-600" />
                    <span>Iniciar Sesión</span>
                  </button>

                  {/* Patient Register Button */}
                  <button
                    type="button"
                    onClick={() => onOpenAuth('REGISTER_PATIENT')}
                    className="px-3.5 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4 text-teal-700" />
                    <span>Registrarse</span>
                  </button>
                </>
              )}

              {/* Book Appointment CTA */}
              <button
                type="button"
                onClick={() => onOpenBooking()}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-bold text-sm shadow-md shadow-teal-600/20 hover:from-teal-700 hover:to-emerald-700 hover:shadow-lg transition-all active:scale-95 cursor-pointer"
              >
                <CalendarPlus className="w-4 h-4" />
                <span>Pedir Cita</span>
              </button>
            </div>

            {/* Mobile Hamburger */}
            <div className="flex md:hidden items-center gap-2">
              <button
                type="button"
                onClick={() => onOpenBooking()}
                className="px-3 py-1.5 rounded-lg bg-teal-600 text-white text-xs font-bold"
              >
                Pedir Cita
              </button>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
                aria-label="Abrir menú"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3">
            <button
              type="button"
              onClick={() => {
                onNavigate('portal');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Inicio
            </button>
            <a
              href="#especialidades"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Especialidades Médicas
            </a>
            <a
              href="#servicios"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Servicios Clínicos
            </a>

            {currentSession && currentSession.role === 'Paciente' && (
              <button
                type="button"
                onClick={() => {
                  onNavigate('patient');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
              >
                <Users className="w-4 h-4 text-teal-600" />
                Portal del Paciente
              </button>
            )}

            {currentSession && currentSession.role !== 'Paciente' && (
              <button
                type="button"
                onClick={() => {
                  onNavigate('admin');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
              >
                <Stethoscope className="w-4 h-4 text-teal-600" />
                Panel de Gestión ({currentSession.role})
              </button>
            )}

            <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
              {currentSession ? (
                <div className="space-y-2">
                  <div className="p-2.5 bg-slate-50 rounded-xl text-xs flex items-center justify-between">
                    <div>
                      <strong className="block text-slate-900">{currentSession.fullName}</strong>
                      <span className="text-teal-700 font-semibold">{currentSession.role}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full py-2 px-3 rounded-lg bg-rose-50 text-rose-700 text-xs font-bold flex items-center justify-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Cerrar Sesión</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onOpenAuth('LOGIN');
                      setMobileMenuOpen(false);
                    }}
                    className="py-2.5 px-3 rounded-xl bg-teal-600 text-white text-xs font-bold text-center"
                  >
                    Iniciar Sesión
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onOpenAuth('REGISTER_PATIENT');
                      setMobileMenuOpen(false);
                    }}
                    className="py-2.5 px-3 rounded-xl bg-teal-50 text-teal-800 border border-teal-200 text-xs font-bold text-center"
                  >
                    Registrarse
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </header>
    </>
  );
}
