import { useState } from 'react';
import { 
  ShieldCheck, 
  Search, 
  Filter, 
  Clock, 
  User, 
  Layers, 
  Download, 
  Lock,
  Calendar,
  AlertCircle
} from 'lucide-react';
import type { AuditLogEntry } from '../../types/clinic.ts';

interface AuditLogViewProps {
  logs: AuditLogEntry[];
}

export default function AuditLogView({ logs }: AuditLogViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterModule, setFilterModule] = useState('TODOS');
  const [filterRole, setFilterRole] = useState('TODOS');

  const filteredLogs = logs.filter(log => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      log.userName.toLowerCase().includes(term) ||
      log.actionDescription.toLowerCase().includes(term) ||
      log.eventType.toLowerCase().includes(term) ||
      log.ipAddress.includes(term);
    const matchesModule = filterModule === 'TODOS' || log.moduleAffected.includes(filterModule);
    const matchesRole = filterRole === 'TODOS' || log.userRole === filterRole;
    return matchesSearch && matchesModule && matchesRole;
  });

  const handleExportAuditCSV = () => {
    const headers = ['ID', 'Fecha y Hora', 'Usuario', 'Rol', 'Modulo Afectado', 'Tipo de Evento', 'Direccion IP', 'Descripcion'];
    const rows = filteredLogs.map(l => [
      l.id,
      l.timestamp,
      l.userName,
      l.userRole,
      `"${l.moduleAffected}"`,
      l.eventType,
      l.ipAddress,
      `"${l.actionDescription.replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `bitacora_auditoria_clinica_medical_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-teal-600" />
            <h2 className="text-xl font-black text-slate-900">
              Bitácora del Sistema y Auditoría Inmutable
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Registro cronológico no modificable de operaciones sensibles, autenticaciones, pagos y modificaciones clínicas
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportAuditCSV}
          className="px-4 py-2 rounded-xl bg-teal-50 text-teal-800 hover:bg-teal-100 font-bold text-xs border border-teal-200 flex items-center gap-2 cursor-pointer"
        >
          <Download className="w-4 h-4 text-teal-600" />
          <span>Exportar Bitácora CSV</span>
        </button>
      </div>

      {/* Security notice */}
      <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2.5">
        <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
        <span>
          <strong>Garantía de Inmutabilidad (RN04):</strong> Los registros de auditoría en la tabla <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">bitacora</code> son estrictamente append-only y no admiten operaciones UPDATE ni DELETE.
        </span>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
        <div>
          <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1">
            Buscar Evento o IP:
          </label>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Ej. CITA_CREADA, 190.181..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-white"
            />
          </div>
        </div>

        <div>
          <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1">
            Filtrar por Módulo:
          </label>
          <select
            value={filterModule}
            onChange={(e) => setFilterModule(e.target.value)}
            className="w-full p-2 rounded-xl border border-slate-200 bg-white font-semibold"
          >
            <option value="TODOS">Todos los Módulos</option>
            <option value="Seguridad">Módulo I: Seguridad</option>
            <option value="Pacientes">Módulo II: Pacientes</option>
            <option value="Citas">Módulo IV: Citas Médicas</option>
            <option value="Pasarela Pago">Módulo IV: Pasarela Pago</option>
            <option value="Historial">Módulo V: Historial Clínico</option>
          </select>
        </div>

        <div>
          <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1">
            Filtrar por Rol:
          </label>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="w-full p-2 rounded-xl border border-slate-200 bg-white font-semibold"
          >
            <option value="TODOS">Todos los Roles</option>
            <option value="Administrador">Administrador</option>
            <option value="Recepcionista">Recepcionista</option>
            <option value="Médico">Médico</option>
            <option value="Paciente">Paciente</option>
            <option value="Sistema Externo">Sistema Externo</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-500 border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">Fecha / Hora</th>
              <th className="py-3 px-4">Usuario & Rol</th>
              <th className="py-3 px-4">Módulo Afectado</th>
              <th className="py-3 px-4">Tipo de Evento</th>
              <th className="py-3 px-4">IP Dirección</th>
              <th className="py-3 px-4">Descripción de la Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
            {filteredLogs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50/60 font-sans">
                <td className="py-3.5 px-4 font-mono text-slate-600 whitespace-nowrap text-xs">
                  {log.timestamp}
                </td>
                <td className="py-3.5 px-4">
                  <strong className="text-slate-900 block font-bold text-xs">{log.userName}</strong>
                  <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-slate-100 text-slate-700 font-sans">
                    {log.userRole}
                  </span>
                </td>
                <td className="py-3.5 px-4 font-medium text-slate-700">
                  {log.moduleAffected}
                </td>
                <td className="py-3.5 px-4">
                  <span className="font-mono font-bold text-[11px] px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
                    {log.eventType}
                  </span>
                </td>
                <td className="py-3.5 px-4 font-mono text-slate-500 text-xs">
                  {log.ipAddress}
                </td>
                <td className="py-3.5 px-4 text-slate-700 font-sans max-w-sm text-xs">
                  {log.actionDescription}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
