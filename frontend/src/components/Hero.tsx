import { useState } from 'react';
import { 
  Calendar, 
  Search, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles,
  ArrowRight,
  HeartPulse,
  Award
} from 'lucide-react';
import type { Specialty } from '../types/clinic.ts';

interface HeroProps {
  specialties: Specialty[];
  onOpenBooking: (specialtyId?: string) => void;
  onSelectSpecialty: (specialty: Specialty) => void;
}

export default function Hero({ specialties, onOpenBooking, onSelectSpecialty }: HeroProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);

  const filtered = searchQuery.trim()
    ? specialties.filter(s => 
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.specificServices.some(serv => serv.toLowerCase().includes(searchQuery.toLowerCase())) ||
        s.commonConditions.some(cond => cond.toLowerCase().includes(searchQuery.toLowerCase()))
      ).slice(0, 5)
    : [];

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-teal-50/60 via-white to-slate-50 pt-8 pb-16 lg:pt-14 lg:pb-24 border-b border-teal-100/60">
      {/* Decorative background radial effects */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-teal-400/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 rounded-full bg-emerald-400/10 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Outpatient policy banner */}
        <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm font-medium shadow-xs">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Modalidad Ambulatoria:</strong> Servicios médicos y procedimientos diagnósticos de corta estancia. No contamos con camas ni internación hospitalaria.
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Headlines, Search, and CTAs */}
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold tracking-wide uppercase bg-teal-100 text-teal-800">
                <Sparkles className="w-3.5 h-3.5" />
                Excelencia Médica & Gestión Moderna
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.1]">
                Cuidado integral de tu salud en <span className="text-teal-600">Clínica Medical</span>
              </h1>
              <p className="text-lg text-slate-600 leading-relaxed max-w-2xl">
                22 especialidades médicas y 9 servicios de diagnóstico clínico ambulatorio. 
                Programa tu cita con horarios garantizados, sin esperas innecesarias y con profesionales acreditados.
              </p>
            </div>

            {/* Smart Search Bar */}
            <div className="relative max-w-xl">
              <div className="relative flex items-center">
                <Search className="w-5 h-5 text-slate-400 absolute left-4 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowResults(true);
                  }}
                  onFocus={() => setShowResults(true)}
                  placeholder="Buscar especialidad o motivo (ej. Cardiología, Glaucoma, Piel...)"
                  className="w-full pl-11 pr-28 py-3.5 rounded-2xl border border-slate-200 bg-white shadow-sm focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 text-sm text-slate-800 placeholder-slate-400 transition-all outline-hidden"
                />
                <button
                  type="button"
                  onClick={() => onOpenBooking(filtered[0]?.id)}
                  className="absolute right-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs transition-colors"
                >
                  Buscar Cita
                </button>
              </div>

              {/* Autocomplete dropdown */}
              {showResults && searchQuery.trim() && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Resultados coincidentes ({filtered.length})
                  </div>
                  {filtered.length > 0 ? (
                    <div className="divide-y divide-slate-50">
                      {filtered.map(spec => (
                        <div
                          key={spec.id}
                          className="p-3 hover:bg-teal-50/60 rounded-xl transition-colors cursor-pointer flex items-center justify-between group"
                          onClick={() => {
                            onSelectSpecialty(spec);
                            setShowResults(false);
                          }}
                        >
                          <div>
                            <div className="font-bold text-slate-900 text-sm group-hover:text-teal-700">
                              {spec.name}
                            </div>
                            <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                              {spec.description}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenBooking(spec.id);
                              setShowResults(false);
                            }}
                            className="px-3 py-1.5 text-xs font-bold rounded-lg bg-teal-600 text-white hover:bg-teal-700 shrink-0 ml-3"
                          >
                            Pedir Cita
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-xs text-slate-500">
                      No se encontraron especialidades con ese término.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Quick CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => onOpenBooking()}
                className="px-6 py-3.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-base shadow-md shadow-teal-600/25 hover:shadow-lg transition-all active:scale-98 flex items-center gap-2 cursor-pointer"
              >
                <Calendar className="w-5 h-5" />
                <span>Pedir Cita Médica</span>
              </button>
              
              <a
                href="#especialidades"
                className="px-6 py-3.5 rounded-xl bg-white border border-slate-200 hover:border-teal-300 hover:bg-teal-50/30 text-slate-700 hover:text-teal-800 font-bold text-base shadow-xs transition-all flex items-center gap-2"
              >
                <span>Ver Especialidades</span>
                <ArrowRight className="w-4 h-4 text-teal-600" />
              </a>
            </div>

            {/* Guarantee Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-200/80">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Sin cruce de horarios</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Citas en bloques de 15 min</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Ticket digital con código único</span>
              </div>
            </div>

          </div>

          {/* Right Column: Visual Feature Card & Metrics */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-teal-100/80 relative">
              
              {/* Badge */}
              <div className="flex items-center justify-between pb-6 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-black text-xl shadow-md shadow-teal-600/30">
                    <HeartPulse className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">Atención Ambulatoria</h3>
                    <p className="text-xs text-slate-500">Clínica Medical Especializada</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                  Abierto Hoy
                </span>
              </div>

              {/* Core numbers */}
              <div className="grid grid-cols-2 gap-4 py-6 border-b border-slate-100">
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <span className="text-3xl font-black text-teal-700">22</span>
                  <p className="text-xs font-bold text-slate-700 mt-0.5">Especialidades</p>
                  <p className="text-[11px] text-slate-500">Con servicios detallados</p>
                </div>
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <span className="text-3xl font-black text-emerald-600">9</span>
                  <p className="text-xs font-bold text-slate-700 mt-0.5">Servicios de Apoyo</p>
                  <p className="text-[11px] text-slate-500">Laboratorio e imágenes</p>
                </div>
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <span className="text-3xl font-black text-slate-800">100%</span>
                  <p className="text-xs font-bold text-slate-700 mt-0.5">Disponibilidad Real</p>
                  <p className="text-[11px] text-slate-500">Validada en servidor</p>
                </div>
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <span className="text-3xl font-black text-amber-600">0</span>
                  <p className="text-xs font-bold text-slate-700 mt-0.5">Internación</p>
                  <p className="text-[11px] text-slate-500">Atención 100% ambulatoria</p>
                </div>
              </div>

              {/* Doctor highlight preview */}
              <div className="pt-6 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                  <span>Horarios de Atención Médica</span>
                  <span className="text-teal-700 font-bold">Lunes a Sábado</span>
                </div>
                <div className="bg-teal-50/70 rounded-xl p-3 text-xs text-teal-900 border border-teal-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-teal-700 shrink-0" />
                    <span>Turno Mañana: <strong>08:00 a 12:00</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-teal-700 shrink-0" />
                    <span>Turno Tarde: <strong>14:00 a 19:00</strong></span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onOpenBooking()}
                  className="w-full mt-2 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider text-center transition-colors cursor-pointer"
                >
                  Reservar Consulta Médica Ahora
                </button>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
