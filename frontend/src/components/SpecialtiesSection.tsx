import { useState } from 'react';
import { 
  CalendarPlus, 
  Search, 
  ChevronRight, 
  Check, 
  Sparkles, 
  Info, 
  X,
  UserCheck,
  Stethoscope
} from 'lucide-react';
import type { Specialty, Doctor } from '../types/clinic.ts';

interface SpecialtiesSectionProps {
  specialties: Specialty[];
  doctors: Doctor[];
  onBookSpecialty: (specialtyId: string) => void;
  selectedSpecialtyModal: Specialty | null;
  setSelectedSpecialtyModal: (specialty: Specialty | null) => void;
}

export default function SpecialtiesSection({
  specialties,
  doctors,
  onBookSpecialty,
  selectedSpecialtyModal,
  setSelectedSpecialtyModal,
}: SpecialtiesSectionProps) {
  const [activeCategory, setActiveCategory] = useState<string>('Todas');
  const [filterText, setFilterText] = useState('');

  const categories = ['Todas', 'Clínica', 'Quirúrgica', 'Rehabilitación', 'Salud Mental'];

  const filteredSpecialties = specialties.filter((spec) => {
    const matchesCategory = activeCategory === 'Todas' || spec.category === activeCategory;
    const matchesText =
      spec.name.toLowerCase().includes(filterText.toLowerCase()) ||
      spec.description.toLowerCase().includes(filterText.toLowerCase()) ||
      spec.specificServices.some(s => s.toLowerCase().includes(filterText.toLowerCase())) ||
      spec.commonConditions.some(c => c.toLowerCase().includes(filterText.toLowerCase()));
    return matchesCategory && matchesText;
  });

  return (
    <section id="especialidades" className="py-16 sm:py-20 bg-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wide bg-teal-100 text-teal-800">
              <Stethoscope className="w-3.5 h-3.5" />
              Catálogo Clínico Completo
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Especialidades Médicas
            </h2>
            <p className="text-sm sm:text-base text-slate-600 max-w-2xl">
              Cada especialidad cuenta con servicios clínicos específicos y orientación personalizada. Selecciona tu especialidad para conocer sus prestaciones y <strong>agendar tu cita médica de inmediato</strong>.
            </p>
          </div>

          {/* Quick Counter */}
          <div className="shrink-0 bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
            <span className="text-2xl font-black text-teal-600">{filteredSpecialties.length}</span>
            <div className="text-xs text-slate-500 leading-tight">
              Especialidades<br />disponibles
            </div>
          </div>
        </div>

        {/* Filter controls */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  activeCategory === cat
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search in specialties */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="Filtrar especialidad o síntoma..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
            />
          </div>
        </div>

        {/* Specialties Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSpecialties.map((spec) => {
            const assignedDoctors = doctors.filter(d => d.specialtyIds.includes(spec.id));

            return (
              <div
                key={spec.id}
                className="bg-white rounded-2xl border border-slate-200 hover:border-teal-400/80 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden group"
              >
                <div className="p-6">
                  {/* Category and active status */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 uppercase tracking-wider">
                      {spec.category}
                    </span>
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Ambulatorio
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-black text-slate-900 group-hover:text-teal-700 transition-colors tracking-tight">
                    {spec.name}
                  </h3>

                  {/* Brief description for patient guidance */}
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed line-clamp-2">
                    {spec.description}
                  </p>

                  {/* Specific services list */}
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-teal-600" />
                      <span>Servicios Específicos Ofrecidos:</span>
                    </div>
                    <ul className="space-y-1.5">
                      {spec.specificServices.slice(0, 3).map((serv, idx) => (
                        <li key={idx} className="text-xs text-slate-700 flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                          <span className="line-clamp-1">{serv}</span>
                        </li>
                      ))}
                      {spec.specificServices.length > 3 && (
                        <li className="text-[11px] text-teal-700 font-medium pl-5">
                          + {spec.specificServices.length - 3} servicios adicionales
                        </li>
                      )}
                    </ul>
                  </div>

                  {/* Doctors assigned info */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                      {assignedDoctors.length > 0
                        ? `${assignedDoctors.length} médico${assignedDoctors.length > 1 ? 's' : ''} disponible${assignedDoctors.length > 1 ? 's' : ''}`
                        : 'Staff médico de turno'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedSpecialtyModal(spec)}
                      className="text-xs font-semibold text-teal-600 hover:text-teal-800 hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                    >
                      <Info className="w-3.5 h-3.5" />
                      <span>Ver más</span>
                    </button>
                  </div>
                </div>

                {/* Direct Action Bottom Bar */}
                <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-100 flex items-center justify-between gap-3">
                  <div className="text-[11px] text-slate-500 font-medium">
                    Turno: 15 min aprox.
                  </div>
                  <button
                    type="button"
                    onClick={() => onBookSpecialty(spec.id)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs hover:shadow-sm transition-all active:scale-95 cursor-pointer"
                  >
                    <CalendarPlus className="w-3.5 h-3.5" />
                    <span>Pedir Cita</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {filteredSpecialties.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8">
            <p className="text-base font-bold text-slate-700">No se encontraron especialidades</p>
            <p className="text-xs text-slate-500 mt-1">Prueba seleccionando &quot;Todas&quot; o revisando el término de búsqueda.</p>
            <button
              type="button"
              onClick={() => { setActiveCategory('Todas'); setFilterText(''); }}
              className="mt-4 px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold"
            >
              Restablecer Filtros
            </button>
          </div>
        )}

      </div>

      {/* Specialty Detail Modal */}
      {selectedSpecialtyModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 sm:p-8 border border-slate-100 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-teal-100 text-teal-800 uppercase tracking-wider">
                  {selectedSpecialtyModal.category}
                </span>
                <h3 className="text-2xl font-black text-slate-900 mt-2">
                  {selectedSpecialtyModal.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSpecialtyModal(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-slate-700 leading-relaxed">
              {selectedSpecialtyModal.description}
            </p>

            {/* Complete Services List */}
            <div className="mt-6 bg-slate-50 rounded-2xl p-4 border border-slate-100">
              <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-600" />
                Servicios Específicos Ofrecidos para Pacientes:
              </h4>
              <ul className="space-y-2">
                {selectedSpecialtyModal.specificServices.map((serv, i) => (
                  <li key={i} className="text-xs text-slate-700 flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                    <span>{serv}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Conditions Treated */}
            <div className="mt-4">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Motivos Frecuentes de Consulta:
              </h4>
              <div className="flex flex-wrap gap-2">
                {selectedSpecialtyModal.commonConditions.map((cond, i) => (
                  <span key={i} className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-teal-50 text-teal-800 border border-teal-200">
                    {cond}
                  </span>
                ))}
              </div>
            </div>

            {/* Assigned Doctors */}
            <div className="mt-6 pt-4 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                Cuerpo Médico en esta Especialidad:
              </h4>
              <div className="space-y-2">
                {doctors.filter(d => d.specialtyIds.includes(selectedSpecialtyModal.id)).map(doc => (
                  <div key={doc.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900">{doc.fullName}</span>
                      <p className="text-slate-500 text-[11px]">Registro: {doc.licenseNumber} • {doc.roomNumber || 'Consultorio'}</p>
                    </div>
                    <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md">
                      Activo
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelectedSpecialtyModal(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => {
                  const id = selectedSpecialtyModal.id;
                  setSelectedSpecialtyModal(null);
                  onBookSpecialty(id);
                }}
                className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md shadow-teal-600/20 flex items-center gap-2 cursor-pointer"
              >
                <CalendarPlus className="w-4 h-4" />
                <span>Pedir Cita en {selectedSpecialtyModal.name}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
