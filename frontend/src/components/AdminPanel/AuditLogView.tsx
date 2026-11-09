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
  AlertCircle,
  RefreshCw,
  CreditCard,
  KeyRound,
  FileText,
  AlertTriangle
} from 'lucide-react';
import type { AuditLogEntry } from '../../types/clinic.ts';

interface AuditLogViewProps {
  logs: AuditLogEntry[];
  onRefresh?: () => void;
}

export default function AuditLogView({ logs, onRefresh }: AuditLogViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterModule, setFilterModule] = useState('TODOS');
  const [filterRole, setFilterRole] = useState('TODOS');
  const [quickFilter, setQuickFilter] = useState<'ALL' | 'LOGIN' | 'PAGO' | 'CITA' | 'ALERTA'>('ALL');

  // Stats calculation
  const loginCount = logs.filter(l => l.eventType.includes('LOGIN') || l.eventType.includes('LOGOUT')).length;
  const pagoCount = logs.filter(l => l.eventType.includes('PAGO')).length;
  const citaCount = logs.filter(l => l.eventType.includes('CITA')).length;
  const alertaCount = logs.filter(l => l.eventType.includes('EMERGENCIA') || l.eventType.includes('CANCELAD') || l.eventType.includes('FAILED')).length;

  const filteredLogs = logs.filter(log => {
    // Quick filter override
    if (quickFilter === 'LOGIN' && !log.eventType.includes('LOGIN') && !log.eventType.includes('LOGOUT')) return false;
    if (quickFilter === 'PAGO' && !log.eventType.includes('PAGO')) return false;
    if (quickFilter === 'CITA' && !log.eventType.includes('CITA')) return false;
    if (quickFilter === 'ALERTA' && !log.eventType.includes('EMERGENCIA') && !log.eventType.includes('CANCELAD') && !log.eventType.includes('FAILED')) return false;

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

  const getEventBadgeClass = (eventType: string) => {
    if (eventType.includes('PAGO')) return 'bg-emerald-50 text-emerald-800 border-emerald-300';
    if (eventType.includes('LOGIN_SUCCESS')) return 'bg-sky-50 text-sky-800 border-sky-300';
    if (eventType.includes('LOGIN_FAILED') || eventType.includes('FAILED')) return 'bg-rose-50 text-rose-800 border-rose-300';
    if (eventType.includes('CITA_CREADA')) return 'bg-teal-50 text-teal-800 border-teal-300';
    if (eventType.includes('EMERGENCIA') || eventType.includes('CANCELAD')) return 'bg-amber-50 text-amber-800 border-amber-300';
    if (eventType.includes('CITA_ATENDIDA')) return 'bg-indigo-50 text-indigo-800 border-indigo-300';
    return 'bg-slate-50 text-slate-800 border-slate-300';
  };

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
      
      {/* Header with Live Indicator & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-50 text-teal-700 rounded-2xl border border-teal-200">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-slate-900">
                  Bitácora del Sistema y Auditoría Inmutable
                </h2>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  En Vivo (Tiempo Real)
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Registro cronológico no modificable de operaciones sensibles, autenticaciones, pagos y modificaciones clínicas
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-200 flex items-center gap-1.5 cursor-pointer transition-all"
              title="Refrescar eventos del servidor ahora"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
              <span>Actualizar</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleExportAuditCSV}
            className="px-4 py-2 rounded-xl bg-teal-50 text-teal-800 hover:bg-teal-100 font-bold text-xs border border-teal-200 flex items-center gap-2 cursor-pointer transition-all"
          >
            <Download className="w-4 h-4 text-teal-600" />
            <span>Exportar Bitácora CSV</span>
          </button>
        </div>
      </div>

      {/* Quick Event Filter Pills */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <button
          type="button"
          onClick={() => setQuickFilter('ALL')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            quickFilter === 'ALL'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          Todos ({logs.length})
        </button>
        <button
          type="button"
          onClick={() => setQuickFilter('LOGIN')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            quickFilter === 'LOGIN'
              ? 'bg-sky-700 text-white shadow-xs'
              : 'bg-sky-50 text-sky-800 border border-sky-200 hover:bg-sky-100'
          }`}
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>Inicios de Sesión ({loginCount})</span>
        </button>
        <button
          type="button"
          onClick={() => setQuickFilter('PAGO')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            quickFilter === 'PAGO'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>Pagos Procesados ({pagoCount})</span>
        </button>
        <button
          type="button"
          onClick={() => setQuickFilter('CITA')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            quickFilter === 'CITA'
              ? 'bg-teal-700 text-white shadow-xs'
              : 'bg-teal-50 text-teal-800 border border-teal-200 hover:bg-teal-100'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Citas Médicas ({citaCount})</span>
        </button>
        <button
          type="button"
          onClick={() => setQuickFilter('ALERTA')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            quickFilter === 'ALERTA'
              ? 'bg-amber-700 text-white shadow-xs'
              : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Alertas & Contingencias ({alertaCount})</span>
        </button>
      </div>

      {/* Security notice */}
      <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2.5">
        <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
        <span>
          <strong>Garantía de Inmutabilidad (RN04):</strong> Los registros de auditoría en la tabla <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">bitacora</code> son estrictamente append-only y no admiten operaciones UPDATE ni DELETE. Se actualizan automáticamente en tiempo real.
        </span>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
        <div>
          <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1">
            Buscar Evento, Usuario o IP:
          </label>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Ej. CITA_CREADA, PAGO, 190.181..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
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
            <option value="Seguridad">Módulo I: Seguridad y Autenticación</option>
            <option value="Pacientes">Módulo II: Pacientes</option>
            <option value="Citas">Módulo IV: Gestión de Citas</option>
            <option value="Pasarela">Módulo IV: Pasarela de Pagos</option>
            <option value="Historial">Módulo V: Historial Clínico</option>
            <option value="Personal">Módulo Staff: Gestión de Personal</option>
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
            <option value="Sistema">Sistema Automático</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200">
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
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400 font-sans text-xs">
                  No se encontraron eventos de auditoría con los filtros aplicados.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/70 font-sans transition-colors">
                  <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap text-xs">
                    {log.timestamp}
                  </td>
                  <td className="py-3 px-4">
                    <strong className="text-slate-900 block font-bold text-xs">{log.userName}</strong>
                    <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-slate-100 text-slate-700 font-sans">
                      {log.userRole}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-700">
                    {log.moduleAffected}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`font-mono font-bold text-[10px] px-2 py-0.5 rounded border ${getEventBadgeClass(log.eventType)}`}>
                      {log.eventType}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-500 text-xs">
                    {log.ipAddress}
                  </td>
                  <td className="py-3 px-4 text-slate-700 font-sans max-w-md text-xs leading-relaxed">
                    {log.actionDescription}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
