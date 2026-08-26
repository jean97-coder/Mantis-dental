import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle as PackageAlert, BarChart3, Calendar, DollarSign, RefreshCw, TrendingUp, Users } from 'lucide-react';

interface DashboardStats {
  patients: { total: number };
  appointments: { total: number; pending: number; completed: number; confirmed: number; cancelled: number };
  inventory: { total: number; lowStock: number };
  budgets: { revenue: number };
}

const REPORTS_URL = 'http://localhost:4001/api/reports';

export default function ReportsModule() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadStats = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch(REPORTS_URL);
      if (!response.ok) throw new Error('No se pudieron cargar las estadísticas');
      setStats(await response.json() as DashboardStats);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Error al cargar el reporte');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  const appointmentTotal = stats?.appointments.total ?? 0;
  const lowStockPercentage = stats && stats.inventory.total > 0 ? Math.min(100, (stats.inventory.lowStock / stats.inventory.total) * 100) : 0;
  const completedPercentage = appointmentTotal > 0 ? Math.min(100, ((stats?.appointments.completed ?? 0) / appointmentTotal) * 100) : 0;

  return (
    <section className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-2 text-teal-600"><BarChart3 className="h-5 w-5" /><span className="text-xs font-bold uppercase tracking-widest">Visión operativa</span></div><h2 className="mt-1 text-2xl font-black text-slate-900">Reportes y Estadísticas</h2><p className="mt-1 text-sm text-slate-500">Una lectura rápida del rendimiento del consultorio.</p></div><button type="button" onClick={() => void loadStats()} disabled={isLoading} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:border-teal-300 hover:text-teal-700 disabled:opacity-60"><RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />Actualizar Reporte</button></div>
      {error && <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
      {isLoading && !stats ? <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center text-slate-400 shadow-sm">Cargando estadísticas...</div> : <><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><MetricCard label="Total Pacientes" value={stats?.patients.total ?? 0} icon={<Users className="h-5 w-5" />} tone="teal" /><MetricCard label="Citas Registradas" value={appointmentTotal} icon={<Calendar className="h-5 w-5" />} tone="blue" /><MetricCard label="Alertas de Inventario" value={stats?.inventory.lowStock ?? 0} icon={<PackageAlert className="h-5 w-5" />} tone="amber" /><MetricCard label="Ingresos Aprobados" value={`$${(stats?.budgets.revenue ?? 0).toFixed(2)}`} icon={<DollarSign className="h-5 w-5" />} tone="emerald" /></div><div className="grid gap-5 lg:grid-cols-2"><div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><div><h3 className="font-black text-slate-900">Estado de citas</h3><p className="mt-1 text-xs text-slate-500">Distribución de la agenda registrada.</p></div><TrendingUp className="h-5 w-5 text-teal-600" /></div><div className="mt-6 space-y-4"><ProgressRow label="Pendientes" value={stats?.appointments.pending ?? 0} total={appointmentTotal} color="bg-amber-400" /><ProgressRow label="Confirmadas" value={stats?.appointments.confirmed ?? 0} total={appointmentTotal} color="bg-teal-500" /><ProgressRow label="Completadas" value={stats?.appointments.completed ?? 0} total={appointmentTotal} color="bg-emerald-500" /><ProgressRow label="Canceladas" value={stats?.appointments.cancelled ?? 0} total={appointmentTotal} color="bg-rose-400" /></div></div><div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><div><h3 className="font-black text-slate-900">Salud del inventario</h3><p className="mt-1 text-xs text-slate-500">Productos que requieren reposición.</p></div><PackageAlert className="h-5 w-5 text-amber-500" /></div><div className="mt-7 flex items-center gap-6"><div className="relative h-32 w-32 shrink-0 rounded-full" style={{ background: `conic-gradient(#f59e0b ${lowStockPercentage}%, #dff7f2 ${lowStockPercentage}% 100%)` }}><div className="absolute inset-3 flex flex-col items-center justify-center rounded-full bg-white"><span className="text-2xl font-black text-slate-900">{stats?.inventory.lowStock ?? 0}</span><span className="text-[10px] font-bold uppercase text-slate-400">alertas</span></div></div><div className="space-y-3"><p className="text-sm text-slate-600"><strong className="text-slate-900">{stats?.inventory.total ?? 0}</strong> productos registrados</p><p className="text-xs text-slate-500">{lowStockPercentage.toFixed(0)}% necesitan revisión de stock.</p><div className="h-2 w-48 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-amber-400 transition-all" style={{ width: `${lowStockPercentage}%` }} /></div></div></div></div></div><div className="rounded-2xl border border-teal-100 bg-teal-50/60 p-5"><p className="text-sm font-semibold text-teal-900">Rendimiento de citas completadas</p><div className="mt-3 flex items-center gap-4"><div className="h-2 flex-1 overflow-hidden rounded-full bg-white"><div className="h-full rounded-full bg-teal-600 transition-all" style={{ width: `${completedPercentage}%` }} /></div><span className="text-sm font-black text-teal-700">{completedPercentage.toFixed(0)}%</span></div></div></>}
    </section>
  );
}

function MetricCard({ label, value, icon, tone }: { label: string; value: number | string; icon: React.ReactNode; tone: 'teal' | 'blue' | 'amber' | 'emerald' }) {
  const colors = { teal: 'bg-teal-50 text-teal-600', blue: 'bg-sky-50 text-sky-600', amber: 'bg-amber-50 text-amber-600', emerald: 'bg-emerald-50 text-emerald-600' };
  return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</span><span className={`rounded-xl p-2.5 ${colors[tone]}`}>{icon}</span></div><p className="mt-4 text-2xl font-black text-slate-900">{value}</p></div>;
}

function ProgressRow({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const percentage = total > 0 ? Math.min(100, (value / total) * 100) : 0;
  return <div><div className="mb-1.5 flex justify-between text-xs font-semibold text-slate-500"><span>{label}</span><span>{value}</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${percentage}%` }} /></div></div>;
}
