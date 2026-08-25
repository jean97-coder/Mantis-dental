import type { LucideIcon } from 'lucide-react'
import {
  AlertTriangle,
  CalendarClock,
  CircleDollarSign,
  Users,
} from 'lucide-react'
import { cn } from '../../lib/utils'

interface MetricCard {
  id: string
  label: string
  value: string
  hint: string
  icon: LucideIcon
  tone: 'teal' | 'sky' | 'amber' | 'rose'
}

const METRICS: readonly MetricCard[] = [
  {
    id: 'pacientes-hoy',
    label: 'Pacientes Hoy',
    value: '18',
    hint: '4 en sala de espera',
    icon: Users,
    tone: 'teal',
  },
  {
    id: 'citas-pendientes',
    label: 'Citas Pendientes',
    value: '7',
    hint: 'Próxima a las 09:30',
    icon: CalendarClock,
    tone: 'sky',
  },
  {
    id: 'ingresos-dia',
    label: 'Ingresos del Día',
    value: '$2.480.000',
    hint: '3 pagos confirmados',
    icon: CircleDollarSign,
    tone: 'amber',
  },
  {
    id: 'alertas-ia',
    label: 'Alertas IA',
    value: '3',
    hint: 'Seguimiento post-operatorio',
    icon: AlertTriangle,
    tone: 'rose',
  },
]

const TONE_CLASSES: Record<MetricCard['tone'], string> = {
  teal: 'bg-teal-50 text-teal-700',
  sky: 'bg-sky-50 text-sky-700',
  amber: 'bg-amber-50 text-amber-700',
  rose: 'bg-rose-50 text-rose-700',
}

export function DashboardPreview() {
  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Resumen clínico del día para Consultorio Odontológico Mantis.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {METRICS.map((metric) => {
          const Icon = metric.icon
          return (
            <article
              key={metric.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    {metric.label}
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">
                    {metric.value}
                  </p>
                </div>
                <span
                  className={cn(
                    'inline-flex h-10 w-10 items-center justify-center rounded-xl',
                    TONE_CLASSES[metric.tone],
                  )}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
              </div>
              <p className="mt-3 text-xs text-slate-500">{metric.hint}</p>
            </article>
          )
        })}
      </div>
    </section>
  )
}
