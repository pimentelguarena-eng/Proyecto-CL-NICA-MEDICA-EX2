import { Building2, Heart, ShieldCheck, MapPin, Phone, Mail, Clock, AlertCircle } from 'lucide-react';
import type { Specialty, ClinicalService } from '../types/clinic.ts';

interface FooterProps {
  specialties: Specialty[];
  services: ClinicalService[];
  onOpenBooking: (specialtyId?: string) => void;
  onOpenExamTests?: () => void;
}

export default function Footer({
  specialties,
  services,
  onOpenBooking,
  onOpenExamTests: _onOpenExamTests,
}: FooterProps) {
  return (
    <footer className="bg-slate-950 text-slate-300 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Outpatient Reminder Banner */}
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
            <span>
              <strong>Política Asistencial:</strong> Clínica Medical brinda atención médica ambulatoria y estudios diagnósticos programados. <strong>No contamos con internación ni camas de hospitalización.</strong>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 text-xs">
          
          {/* Col 1: Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500 text-slate-950 flex items-center justify-center font-black">
                <Building2 className="w-6 h-6" />
              </div>
              <span className="text-xl font-black text-white tracking-tight">
                CLÍNICA <span className="text-teal-400">MEDICAL</span>
              </span>
            </div>

            <p className="text-slate-400 leading-relaxed max-w-sm">
              Centro privado de especialidades médicas ambulatorias, diagnóstico clínico, laboratorio y rehabilitación funcional con el más alto rigor médico.
            </p>

            <div className="space-y-2 text-slate-400">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-teal-400 shrink-0" />
                <span>Av. Las Américas #850 esq. Cañoto, Santa Cruz - Bolivia</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-teal-400 shrink-0" />
                <span>Central Telefónica: (03) 345-8000 • WhatsApp: +591 77218944</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-teal-400 shrink-0" />
                <span>citas@clinicamedical.com</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-teal-400 shrink-0" />
                <span>Lunes a Sábado: 07:00 a 20:00 (Turnos mañana y tarde)</span>
              </div>
            </div>
          </div>

          {/* Col 2: Specialties preview */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-3">
              Especialidades
            </h4>
            <ul className="space-y-1.5 text-slate-400">
              {specialties.slice(0, 11).map(s => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => onOpenBooking(s.id)}
                    className="hover:text-teal-400 transition-colors cursor-pointer text-left"
                  >
                    {s.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Specialties preview 2 */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-3">
              Más Especialidades
            </h4>
            <ul className="space-y-1.5 text-slate-400">
              {specialties.slice(11, 22).map(s => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => onOpenBooking(s.id)}
                    className="hover:text-teal-400 transition-colors cursor-pointer text-left"
                  >
                    {s.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4: Services */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-3">
              Servicios Clínicos
            </h4>
            <ul className="space-y-1.5 text-slate-400">
              {services.map(srv => (
                <li key={srv.id} className="text-slate-300">
                  {srv.name}
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Academic reference and copyright */}
        <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div>
            © {new Date().getFullYear()} Clínica Medical • Sistema Web para la Gestión de Citas Médicas
          </div>
          <div className="text-right text-[11px] text-slate-400">
            Proyecto Sistemas 1 • Examen Parcial II • MSc.Ing. Angélica Gazón Cuéllar
          </div>
        </div>

      </div>
    </footer>
  );
}
