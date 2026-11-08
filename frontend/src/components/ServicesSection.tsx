import { useState } from 'react';
import { 
  Activity, 
  FlaskConical, 
  Eye, 
  Ear, 
  Scissors, 
  Sparkles, 
  Zap, 
  HeartHandshake, 
  Mic, 
  ScanLine, 
  AlertCircle,
  Clock,
  CheckCircle,
  FileText
} from 'lucide-react';
import type { ClinicalService } from '../types/clinic.ts';

interface ServicesSectionProps {
  services: ClinicalService[];
  onOpenBooking: () => void;
}

export default function ServicesSection({ services, onOpenBooking }: ServicesSectionProps) {
  const [selectedService, setSelectedService] = useState<ClinicalService | null>(null);

  const getServiceIcon = (name: string) => {
    switch (name) {
      case 'AUDIOMETRÍA': return <Ear className="w-6 h-6 text-teal-600" />;
      case 'BIOPSIAS': return <Scissors className="w-6 h-6 text-teal-600" />;
      case 'CIRUGÍAS OFTALMOLÓGICAS': return <Eye className="w-6 h-6 text-teal-600" />;
      case 'DERMATOLOGÍA': return <Sparkles className="w-6 h-6 text-teal-600" />;
      case 'ELECTROMEDICINA': return <Zap className="w-6 h-6 text-teal-600" />;
      case 'ENFERMERÍA': return <HeartHandshake className="w-6 h-6 text-teal-600" />;
      case 'FONOAUDIOLOGÍA': return <Mic className="w-6 h-6 text-teal-600" />;
      case 'IMAGENOLOGÍA': return <ScanLine className="w-6 h-6 text-teal-600" />;
      case 'PAPANICOLAOU-COLPOSCOPIA Y LABORATORIO CLÍNICO': return <FlaskConical className="w-6 h-6 text-teal-600" />;
      default: return <Activity className="w-6 h-6 text-teal-600" />;
    }
  };

  return (
    <section id="servicios" className="py-16 sm:py-20 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wide bg-emerald-100 text-emerald-800">
            <Activity className="w-3.5 h-3.5" />
            Servicios Clínicos y Diagnósticos
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Procedimientos y Exámenes de Apoyo Diagnóstico
          </h2>
          <p className="text-sm sm:text-base text-slate-600">
            Tecnología biomédica de precisión y atención especializada bajo modalidad 100% ambulatoria.
          </p>
          
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold mt-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Todos los procedimientos son ambulatorios: sin necesidad ni servicio de internación hospitalaria.</span>
          </div>
        </div>

        {/* Services Grid (9 services) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((serv) => (
            <div
              key={serv.id}
              className="bg-slate-50/80 hover:bg-white rounded-2xl border border-slate-200 hover:border-teal-400 p-6 transition-all duration-200 flex flex-col justify-between group shadow-2xs hover:shadow-md"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center group-hover:scale-105 transition-transform">
                    {getServiceIcon(serv.name)}
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-200/70 text-slate-700">
                    {serv.category}
                  </span>
                </div>

                <h3 className="text-lg font-black text-slate-900 group-hover:text-teal-700 transition-colors">
                  {serv.name}
                </h3>

                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  {serv.description}
                </p>

                {/* Requirements / Prep summary */}
                <div className="mt-4 pt-3 border-t border-slate-200/60">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <FileText className="w-3 h-3 text-slate-400" />
                    <span>Preparación / Requisitos:</span>
                  </div>
                  <ul className="space-y-1">
                    {serv.requirements.map((req, i) => (
                      <li key={i} className="text-xs text-slate-600 flex items-start gap-1.5">
                        <span className="text-teal-600 font-bold">•</span>
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Footer info */}
              <div className="mt-6 pt-3 border-t border-slate-200/60 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  {serv.durationMinutes} minutos aprox.
                </span>
                <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200">
                  Ambulatorio
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Diagnostic support banner */}
        <div className="mt-12 bg-gradient-to-r from-teal-900 to-slate-900 rounded-3xl p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-2 text-center md:text-left">
            <h3 className="text-2xl font-black tracking-tight">
              ¿Requieres agendar un examen o valoración médica?
            </h3>
            <p className="text-sm text-teal-200 max-w-xl">
              Nuestros médicos especialistas y equipo técnico te orientarán sobre los estudios necesarios para tu caso sin demoras.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenBooking}
            className="px-6 py-3.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-teal-950 font-black text-sm uppercase tracking-wider shadow-lg hover:shadow-teal-500/25 transition-all shrink-0 cursor-pointer"
          >
            Agendar Consulta de Valoración
          </button>
        </div>

      </div>
    </section>
  );
}
