import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  Package,
  Plus,
  RefreshCw,
  Sparkles,
  TrendingUp,
  User,
  Users,
  Wallet,
} from 'lucide-react'
import type { ModuleId } from '../../types/navigation'

interface DashboardStats {
  patients: { total: number }
  appointments: {
    total: number
    pending: number
    completed: number
    confirmed: number
    cancelled: number
  }
  inventory: { total: number; lowStock: number }
  budgets: { revenue: number }
}

interface AppointmentItem {
  id: number
  patient_id: number
  patient_name: string
  appointment_date: string
  status: 'Pendiente' | 'Confirmada' | 'Completada' | 'Cancelada'
  reason: string
}

interface DashboardModuleProps {
  userName?: string
  onNavigate: (moduleId: ModuleId) => void
  onOpenNewPatient?: () => void
  onOpenNewAppointment?: () => void
  onConsultAi?: () => void
}

const REPORTS_URL = 'http://localhost:4001/api/reports'
const APPOINTMENTS_URL = 'http://localhost:4001/api/appointments'

export function DashboardModule({
  userName = 'Administrador',
  onNavigate,
  onOpenNewPatient,
  onOpenNewAppointment,
  onConsultAi,
}: DashboardModuleProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [appointments, setAppointments] = useState<AppointmentItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  // Determine greeting based on local time
  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    if (hour >= 5 && hour < 12) return 'Buenos días'
    if (hour >= 12 && hour < 19) return 'Buenas tardes'
    return 'Buenas noches'
  }, [])

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const [reportsRes, appointmentsRes] = await Promise.all([
        fetch(REPORTS_URL),
        fetch(APPOINTMENTS_URL),
      ])

      if (reportsRes.ok) {
        const statsData = (await reportsRes.json()) as DashboardStats
        setStats(statsData)
      }

      if (appointmentsRes.ok) {
        const appointmentsData = (await appointmentsRes.json()) as AppointmentItem[]
        setAppointments(Array.isArray(appointmentsData) ? appointmentsData : [])
      }
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Error al sincronizar datos del consultorio',
      )
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadData()
  }, [loadData])

  // Filter today's appointments or show upcoming
  const todayKey = new Date().toISOString().slice(0, 10)
  const todayAppointments = useMemo(() => {
    const filtered = appointments.filter(
      (a) => a.appointment_date && a.appointment_date.slice(0, 10) === todayKey,
    )
    if (filtered.length > 0) {
      return filtered.sort(
        (a, b) =>
          new Date(a.appointment_date).getTime() -
          new Date(b.appointment_date).getTime(),
      )
    }
    // If no appointments today, return the first 4 next appointments
    return [...appointments]
      .sort(
        (a, b) =>
          new Date(a.appointment_date).getTime() -
          new Date(b.appointment_date).getTime(),
      )
      .slice(0, 4)
  }, [appointments, todayKey])

  const appointmentTotal = stats?.appointments.total ?? 0
  const lowStockCount = stats?.inventory.lowStock ?? 0
  const totalInventory = stats?.inventory.total ?? 0
  const lowStockPercentage =
    totalInventory > 0
      ? Math.min(100, Math.round((lowStockCount / totalInventory) * 100))
      : 0

  const completedPercentage =
    appointmentTotal > 0
      ? Math.min(
          100,
          Math.round(((stats?.appointments.completed ?? 0) / appointmentTotal) * 100),
        )
      : 0

  return (
    <div className="mx-auto max-w-7xl space-y-7 pb-10">
      {/* 1. Header de Bienvenida Dinámico & Acciones Rápidas */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-gradient-to-r from-slate-900 via-[#0d2235] to-teal-950 p-6 md:p-8 rounded-3xl text-white shadow-xl shadow-slate-900/10 border border-slate-800 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-60 h-60 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-1.5 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-bold border border-teal-500/30">
            <span className="h-2 w-2 rounded-full bg-teal-400 animate-pulse-dot" />
            Centro de Control Clínico
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            {greeting}, {userName} 👋
          </h1>
          <p className="text-sm text-slate-300 font-medium">
            Aquí tienes el resumen operativo, agenda de citas y rendimiento de tu consultorio.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => void loadData()}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-800/80 border border-slate-700/80 px-3.5 py-2.5 text-xs font-bold text-slate-200 shadow-sm transition-all hover:bg-slate-700 hover:text-white disabled:opacity-60 cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/90 px-4 py-3.5 text-xs font-semibold text-rose-700 flex items-center justify-between">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => void loadData()}
            className="underline font-bold"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* 2. Cuatro Tarjetas Principales de Métricas */}
      <div className="grid gap-4.5 sm:grid-cols-2 xl:grid-cols-4">
        {/* Card 1: Pacientes */}
        <article className="group rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-teal-300/80">
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
              Pacientes
            </span>
            <span className="rounded-xl bg-teal-50 text-teal-600 p-2.5 group-hover:scale-105 transition-transform">
              <Users className="h-5 w-5" />
            </span>
          </div>
          <div className="mt-3">
            <p className="text-3xl font-black text-slate-900 tracking-tight">
              {stats?.patients.total ?? 0}
            </p>
            <p className="mt-1 text-xs text-slate-600 font-medium flex items-center gap-1">
              <span className="text-teal-700 font-bold">● Expedientes</span> registrados
            </p>
          </div>
        </article>

        {/* Card 2: Citas de Hoy / Registradas */}
        <article className="group rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-sky-300/80">
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
              Citas Registradas
            </span>
            <span className="rounded-xl bg-sky-50 text-sky-600 p-2.5 group-hover:scale-105 transition-transform">
              <Calendar className="h-5 w-5" />
            </span>
          </div>
          <div className="mt-3">
            <p className="text-3xl font-black text-slate-900 tracking-tight">
              {appointmentTotal}
            </p>
            <div className="mt-1 flex items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-md">
                {stats?.appointments.pending ?? 0} pend.
              </span>
              <span className="inline-flex items-center gap-1 font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded-md">
                {stats?.appointments.confirmed ?? 0} conf.
              </span>
            </div>
          </div>
        </article>

        {/* Card 3: Ingresos Aprobados */}
        <article className="group rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-emerald-300/80">
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
              Ingresos Aprobados
            </span>
            <span className="rounded-xl bg-emerald-50 text-emerald-600 p-2.5 group-hover:scale-105 transition-transform">
              <DollarSign className="h-5 w-5" />
            </span>
          </div>
          <div className="mt-3">
            <p className="text-3xl font-black text-slate-900 tracking-tight">
              ${(stats?.budgets.revenue ?? 0).toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
            <p className="mt-1 text-xs text-emerald-700 font-bold flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5" />
              Presupuestos confirmados
            </p>
          </div>
        </article>

        {/* Card 4: Alertas & Pendientes */}
        <article className="group rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-amber-300/80">
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
              Alertas de Stock
            </span>
            <span
              className={`rounded-xl p-2.5 transition-transform group-hover:scale-105 ${
                lowStockCount > 0
                  ? 'bg-amber-50 text-amber-600'
                  : 'bg-emerald-50 text-emerald-600'
              }`}
            >
              {lowStockCount > 0 ? (
                <AlertTriangle className="h-5 w-5" />
              ) : (
                <CheckCircle2 className="h-5 w-5" />
              )}
            </span>
          </div>
          <div className="mt-3">
            <p className="text-3xl font-black text-slate-900 tracking-tight">
              {lowStockCount}
            </p>
            <p
              className={`mt-1 text-xs font-bold ${
                lowStockCount > 0 ? 'text-amber-700' : 'text-emerald-700'
              }`}
            >
              {lowStockCount > 0
                ? `${lowStockCount} productos por reponer`
                : 'Inventario en nivel óptimo'}
            </p>
          </div>
        </article>
      </div>

      {/* 3. Bloque de Acciones Rápidas */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3.5">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
            Acciones Rápidas
          </h2>
          <span className="text-[11px] text-slate-600 font-medium">
            Acceso directo a funciones frecuentes
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            type="button"
            onClick={() => {
              if (onOpenNewPatient) onOpenNewPatient()
              else onNavigate('pacientes')
            }}
            className="group flex flex-col items-center justify-center gap-2 p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-teal-50 hover:border-teal-300 text-slate-700 hover:text-teal-900 transition-all cursor-pointer"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-xs border border-slate-200/80 group-hover:border-teal-300 group-hover:bg-teal-600 group-hover:text-white transition-all text-teal-700">
              <Plus className="h-5 w-5" />
            </div>
            <span className="text-xs font-bold text-center">Nuevo Paciente</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (onOpenNewAppointment) onOpenNewAppointment()
              else onNavigate('agenda')
            }}
            className="group flex flex-col items-center justify-center gap-2 p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-teal-50 hover:border-teal-300 text-slate-700 hover:text-teal-900 transition-all cursor-pointer"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-xs border border-slate-200/80 group-hover:border-teal-300 group-hover:bg-teal-600 group-hover:text-white transition-all text-sky-700">
              <Calendar className="h-5 w-5" />
            </div>
            <span className="text-xs font-bold text-center">Nueva Cita</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('presupuestos')}
            className="group flex flex-col items-center justify-center gap-2 p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-teal-50 hover:border-teal-300 text-slate-700 hover:text-teal-900 transition-all cursor-pointer"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-xs border border-slate-200/80 group-hover:border-teal-300 group-hover:bg-teal-600 group-hover:text-white transition-all text-emerald-700">
              <DollarSign className="h-5 w-5" />
            </div>
            <span className="text-xs font-bold text-center">Nuevo Presupuesto</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('finanzas')}
            className="group flex flex-col items-center justify-center gap-2 p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-teal-50 hover:border-teal-300 text-slate-700 hover:text-teal-900 transition-all cursor-pointer"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-xs border border-slate-200/80 group-hover:border-teal-300 group-hover:bg-teal-600 group-hover:text-white transition-all text-amber-700">
              <Wallet className="h-5 w-5" />
            </div>
            <span className="text-xs font-bold text-center">Registrar Cobro</span>
          </button>
        </div>
      </div>

      {/* 4. Agenda del Día & Mantis AI Card */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Agenda de Hoy (2 columnas) */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
            <div>
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Clock className="h-4.5 w-4.5 text-teal-600" />
                Agenda de Hoy
              </h2>
              <p className="text-xs text-slate-600 mt-0.5 font-medium">
                Citas y turnos programados en el consultorio.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('agenda')}
              className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 hover:text-teal-900 transition-colors"
            >
              Ver agenda completa <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {todayAppointments.length === 0 ? (
            <div className="py-12 text-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
              <Calendar className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-600">
                No hay citas programadas para el día de hoy.
              </p>
              <button
                type="button"
                onClick={() => onNavigate('agenda')}
                className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-teal-700 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" /> Agendar cita
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 overflow-hidden">
              {todayAppointments.map((appt) => {
                const dateObj = new Date(appt.appointment_date)
                const timeString = isNaN(dateObj.getTime())
                  ? '09:00 AM'
                  : dateObj.toLocaleTimeString('es-ES', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })

                const statusStyles: Record<string, string> = {
                  Pendiente:
                    'bg-amber-50 text-amber-700 border-amber-200/90',
                  Confirmada:
                    'bg-teal-50 text-teal-700 border-teal-200/90',
                  Completada:
                    'bg-emerald-50 text-emerald-700 border-emerald-200/90',
                  Cancelada:
                    'bg-rose-50 text-rose-700 border-rose-200/90',
                }

                return (
                  <div
                    key={appt.id}
                    className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 px-2 rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex flex-col items-center justify-center bg-teal-50/80 text-teal-800 border border-teal-100 rounded-xl px-2.5 py-1.5 min-w-[65px] shrink-0">
                        <span className="text-[10px] font-extrabold uppercase text-teal-600">
                          HORA
                        </span>
                        <span className="text-xs font-black">{timeString}</span>
                      </div>

                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-900 truncate flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          {appt.patient_name}
                        </h4>
                        <p className="text-[11px] text-slate-600 truncate mt-0.5">
                          {appt.reason || 'Consulta odontológica general'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold ${
                          statusStyles[appt.status] ||
                          'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {appt.status}
                      </span>

                      <button
                        type="button"
                        onClick={() => onNavigate('agenda')}
                        className="rounded-lg bg-slate-100 hover:bg-teal-50 hover:text-teal-700 px-2.5 py-1 text-[11px] font-bold text-slate-600 transition-colors"
                      >
                        Ver
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Mantis AI Feature Card & Resumen Odontológico Rápido */}
        <div className="space-y-6">
          {/* Card Mantis AI */}
          <div className="rounded-2xl border border-teal-200/80 bg-gradient-to-br from-[#0c2336] to-[#081a29] p-6 text-white shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 h-28 w-28 rounded-full bg-teal-500/20 blur-2xl pointer-events-none" />
            <div className="flex items-center gap-2 text-teal-300 text-xs font-extrabold uppercase tracking-wider">
              <Bot className="h-4 w-4" />
              <span>Inteligencia Clínica</span>
            </div>

            <h2 className="mt-2 text-lg font-black text-white">Mantis AI</h2>
            <p className="mt-1 text-xs text-slate-300 font-medium leading-relaxed">
              Asistente clínico inteligente para diagnóstico, sugerencias de tratamientos y notas odontológicas.
            </p>

            <button
              type="button"
              onClick={() => {
                if (onConsultAi) onConsultAi()
                else onNavigate('mantis-ai')
              }}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-400 to-cyan-400 px-4 py-2.5 text-xs font-black text-slate-950 shadow-md transition-all hover:brightness-105 cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Consultar Mantis AI →</span>
            </button>
          </div>

          {/* Elemento Odontológico Destacado (Resumen Dental) */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <span>🦷 Resumen Odontológico</span>
              </h2>
              <span className="text-[10px] font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">
                Vista Rápida
              </span>
            </div>

            {/* Visual simplified dental arch */}
            <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100 space-y-2">
              <p className="text-[11px] font-semibold text-slate-500 text-center">
                Estado esquemático de arcadas clínicas
              </p>

              {/* Upper Arch mini dots */}
              <div className="flex justify-center gap-1">
                {[18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28].map(
                  (tooth, index) => {
                    const isTreated = [16, 24, 26].includes(tooth)
                    const isPending = [14, 21].includes(tooth)
                    const isAttention = tooth === 18

                    return (
                      <div
                        key={tooth}
                        title={`Pieza ${tooth}`}
                        className={`h-4.5 w-3.5 rounded-xs flex items-center justify-center text-[7px] font-black transition-transform hover:scale-125 cursor-pointer ${
                          isAttention
                            ? 'bg-rose-500 text-white'
                            : isPending
                              ? 'bg-amber-400 text-amber-950'
                              : isTreated
                                ? 'bg-emerald-500 text-white'
                                : 'bg-slate-200 text-slate-600'
                        } ${index === 7 ? 'mr-1.5' : ''}`}
                      >
                        {tooth % 10}
                      </div>
                    )
                  },
                )}
              </div>

              {/* Lower Arch mini dots */}
              <div className="flex justify-center gap-1">
                {[48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38].map(
                  (tooth, index) => {
                    const isTreated = [46, 36].includes(tooth)
                    const isPending = [44].includes(tooth)

                    return (
                      <div
                        key={tooth}
                        title={`Pieza ${tooth}`}
                        className={`h-4.5 w-3.5 rounded-xs flex items-center justify-center text-[7px] font-black transition-transform hover:scale-125 cursor-pointer ${
                          isPending
                            ? 'bg-amber-400 text-amber-950'
                            : isTreated
                              ? 'bg-emerald-500 text-white'
                              : 'bg-slate-200 text-slate-600'
                        } ${index === 7 ? 'mr-1.5' : ''}`}
                      >
                        {tooth % 10}
                      </div>
                    )
                  },
                )}
              </div>
            </div>

            {/* Legend */}
            <div className="grid grid-cols-2 gap-1.5 text-[10px] font-bold text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Completado
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-teal-500" />
                En proceso
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                Pendiente
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-rose-500" />
                Atención
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Estado de Citas & Salud del Inventario */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Estado de Citas */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="font-black text-slate-900 text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-teal-600" />
                Estado de Citas
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Distribución global de la agenda del consultorio.
              </p>
            </div>
            <span className="text-xs font-extrabold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full">
              {completedPercentage}% Completadas
            </span>
          </div>

          <div className="space-y-3.5 pt-1">
            <ProgressRow
              label="Pendientes"
              value={stats?.appointments.pending ?? 0}
              total={appointmentTotal}
              color="bg-amber-400"
            />
            <ProgressRow
              label="Confirmadas"
              value={stats?.appointments.confirmed ?? 0}
              total={appointmentTotal}
              color="bg-teal-500"
            />
            <ProgressRow
              label="Completadas"
              value={stats?.appointments.completed ?? 0}
              total={appointmentTotal}
              color="bg-emerald-500"
            />
            <ProgressRow
              label="Canceladas"
              value={stats?.appointments.cancelled ?? 0}
              total={appointmentTotal}
              color="bg-rose-400"
            />
          </div>
        </div>

        {/* Salud del Inventario */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="font-black text-slate-900 text-sm flex items-center gap-2">
                <Package className="h-4 w-4 text-teal-600" />
                Salud del Inventario
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Disponibilidad de insumos y materiales odontológicos.
              </p>
            </div>

            {lowStockCount === 0 ? (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-full">
                <CheckCircle2 className="h-3.5 w-3.5" /> Inventario saludable ✨
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200/80 px-2.5 py-1 rounded-full">
                <AlertTriangle className="h-3.5 w-3.5" /> Requiere revisión
              </span>
            )}
          </div>

          <div className="flex items-center gap-6 pt-2">
            {/* Radial graphic */}
            <div
              className="relative h-28 w-28 shrink-0 rounded-full flex items-center justify-center shadow-inner"
              style={{
                background: `conic-gradient(#f59e0b ${lowStockPercentage}%, #10b981 ${lowStockPercentage}% 100%)`,
              }}
            >
              <div className="h-20 w-20 rounded-full bg-white flex flex-col items-center justify-center shadow-sm">
                <span className="text-xl font-black text-slate-900">
                  {totalInventory}
                </span>
                <span className="text-[9px] font-bold uppercase text-slate-400">
                  Insumos
                </span>
              </div>
            </div>

            <div className="space-y-2 flex-1">
              <p className="text-xs text-slate-700">
                <strong className="text-slate-900 font-bold">
                  {totalInventory - lowStockCount}
                </strong>{' '}
                productos en stock óptimo.
              </p>
              <p className="text-xs text-slate-600">
                <strong className="text-amber-600 font-bold">
                  {lowStockCount}
                </strong>{' '}
                artículos con stock bajo o por reponer.
              </p>

              <button
                type="button"
                onClick={() => onNavigate('inventario')}
                className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-teal-700 hover:text-teal-900 transition-colors"
              >
                Gestionar inventario →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ProgressRow({
  label,
  value,
  total,
  color,
}: {
  label: string
  value: number
  total: number
  color: string
}) {
  const percentage = total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0

  return (
    <div>
      <div className="mb-1 flex justify-between text-xs font-semibold text-slate-600">
        <span>{label}</span>
        <span className="font-bold text-slate-800">
          {value} <span className="text-slate-400 font-normal">({percentage}%)</span>
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

export default DashboardModule
