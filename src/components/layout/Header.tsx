import { Bell, Menu, Search, Sparkles } from 'lucide-react'

interface HeaderUser {
  name: string
  role: 'admin' | 'odontologo'
  email?: string
}

interface HeaderProps {
  onOpenSidebar: () => void
  notificationCount?: number
  user?: HeaderUser | null
  onConsultAi?: () => void
}

export function Header({
  onOpenSidebar,
  notificationCount = 0,
  user,
  onConsultAi,
}: HeaderProps) {
  const userInitials = (user?.name || 'Admin')
    .split(' ')
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-slate-200/90 bg-white/95 backdrop-blur-md px-4 lg:px-7 sticky top-0 z-30">
      {/* Left: Mobile hamburger & Clinic Title */}
      <div className="flex items-center gap-3.5">
        <button
          type="button"
          onClick={onOpenSidebar}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors lg:hidden"
          aria-label="Abrir menú de navegación"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="hidden sm:flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600/10 text-teal-700 font-black text-xs border border-teal-600/20">
            MD
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight leading-tight">
              Consultorio Odontológico Mantis
            </h2>
            <p className="text-[11px] font-medium text-slate-600 hidden sm:block">
              Sede Principal · Especialidades Dentales
            </p>
          </div>
        </div>
      </div>

      {/* Center/Right: Global search, AI status, Notifications, User pill */}
      <div className="flex items-center gap-3">
        {/* Search bar */}
        <div className="relative hidden md:block w-64 lg:w-72">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400"
          />
          <input
            type="search"
            placeholder="Buscar paciente, cita, DNI..."
            className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/80 pr-3 pl-9 text-xs text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:ring-3 focus:ring-teal-500/10"
          />
        </div>

        {/* Mantis AI Status Badge */}
        <button
          type="button"
          onClick={onConsultAi}
          className="inline-flex items-center gap-2 rounded-full border border-emerald-200/90 bg-emerald-50/70 px-3 py-1.5 text-xs font-bold text-emerald-800 shadow-xs hover:bg-emerald-100/70 hover:border-emerald-300 transition-all cursor-pointer"
          title="Mantis AI está activo y listo para asistir"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-teal-600" />
            <span className="text-[11px] font-extrabold tracking-wide">Mantis AI Activo</span>
          </span>
        </button>

        {/* Notification Bell */}
        <button
          type="button"
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/90 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          aria-label="Notificaciones del consultorio"
        >
          <Bell className="h-4 w-4" />
          {notificationCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-black text-white shadow-xs">
              {notificationCount}
            </span>
          )}
        </button>

        {/* User Profile Pill */}
        <div className="flex items-center gap-2.5 pl-1.5 border-l border-slate-200">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-600 text-xs font-extrabold text-white shadow-sm">
            {userInitials || 'AD'}
          </div>
          <div className="hidden xl:block text-left leading-tight">
            <p className="text-xs font-bold text-slate-800 truncate max-w-[120px]">
              {user?.name || 'Administrador'}
            </p>
            <p className="text-[10px] font-medium text-teal-700 capitalize">
              {user?.role || 'admin'}
            </p>
          </div>
        </div>
      </div>
    </header>
  )
}

