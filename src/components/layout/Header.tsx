import { Bell, Menu, Mic, MicOff, Search } from 'lucide-react'
import { cn } from '../../lib/utils'

interface HeaderProps {
  isListening: boolean
  onToggleListening: () => void
  onOpenSidebar: () => void
  notificationCount: number
}

export function Header({
  isListening,
  onToggleListening,
  onOpenSidebar,
  notificationCount,
}: HeaderProps) {
  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4 lg:px-6">
      <button
        type="button"
        onClick={onOpenSidebar}
        className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden"
        aria-label="Abrir menú"
      >
        <Menu className="h-5 w-5" />
      </button>

      <label className="relative min-w-0 flex-1">
        <span className="sr-only">Buscador global</span>
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400"
        />
        <input
          type="search"
          placeholder="Buscar pacientes, citas o cédula..."
          className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pr-3 pl-10 text-sm text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100"
        />
      </label>

      <button
        type="button"
        onClick={onToggleListening}
        className={cn(
          'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 shadow-md',
          isListening
            ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
            : 'border-slate-200 bg-white text-slate-600',
        )}
        aria-pressed={isListening}
      >
        {isListening ? (
          <Mic className="h-4 w-4 text-emerald-600" aria-hidden="true" />
        ) : (
          <MicOff className="h-4 w-4 text-slate-400" aria-hidden="true" />
        )}
        <span className="text-xs font-semibold tracking-wide">
          {isListening ? '🟢 Mantis Escuchando' : 'Mantis Voice Status'}
        </span>
      </button>

      <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 md:flex">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600 text-xs font-bold text-white">
          MD
        </span>
        <div className="leading-tight">
          <p className="text-xs font-semibold text-slate-800">
            Consultorio Odontológico Mantis
          </p>
          <p className="text-[11px] text-slate-500">Clínica principal</p>
        </div>
      </div>

      <button
        type="button"
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
        aria-label="Notificaciones"
      >
        <Bell className="h-5 w-5" />
        {notificationCount > 0 ? (
          <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
            {notificationCount}
          </span>
        ) : null}
      </button>
    </header>
  )
}
