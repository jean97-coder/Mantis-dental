import { LogOut, Sparkles } from 'lucide-react'
import { MODULE_ICONS } from '../../config/navigation'
import { cn } from '../../lib/utils'
import { NAVIGATION_MODULES, type ModuleId } from '../../types/navigation'

interface SidebarUser {
  id?: number
  name: string
  role: 'admin' | 'odontologo'
  email?: string
  permissions?: string[]
}

interface SidebarProps {
  activeModule: ModuleId
  onNavigate: (moduleId: ModuleId) => void
  isOpen: boolean
  onClose: () => void
  user?: SidebarUser | null
  onLogout?: () => void
}

const CATEGORIES = [
  'PRINCIPAL',
  'ATENCIÓN',
  'CLÍNICA',
  'GESTIÓN',
  'COMUNICACIÓN',
  'INTELIGENCIA',
  'SISTEMA',
] as const

export function Sidebar({
  activeModule,
  onNavigate,
  isOpen,
  onClose,
  user,
  onLogout,
}: SidebarProps) {
  const userInitials = (user?.name || 'Admin')
    .split(' ')
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()

  const isVisible = (item: (typeof NAVIGATION_MODULES)[number]) => {
    if (!user) return true
    if (user.role === 'admin') return true
    if (!item.permission) return true
    if (item.permission === 'admin') return false
    return user.permissions?.includes(item.permission) ?? false
  }

  return (
    <>
      {/* Backdrop for mobile drawer */}
      <button
        type="button"
        aria-label="Cerrar menú lateral"
        className={cn(
          'fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-300 lg:hidden',
          isOpen ? 'opacity-100 pointer-events-auto' : 'pointer-events-none opacity-0',
        )}
        onClick={onClose}
      />

      {/* Sidebar panel */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-[#0b1726] text-slate-200 shadow-2xl transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 border-r border-slate-800/80',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Cabecera / Branding */}
        <div className="flex items-center gap-3.5 px-6 py-6 border-b border-slate-800/80">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-teal-500 to-cyan-400 text-slate-950 font-black shadow-lg shadow-teal-500/20">
            <svg
              className="h-6 w-6 text-slate-950"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 2C8.5 2 6 4 6 7c0 2.5 1.5 5 2.5 8 .5 1.5 1 4 2 6 .5 1 1.5 1 1.5 0 0-2 .5-4 1-6 .5-2 1-4 1.5-6C15 6 15 4 12 2zm-3.5 6C8 7 8 6 9.5 5c1-.7 2-.7 3 0 1.5 1 1.5 2 1 3-.5 1-1.5 1.5-2.5 1.5S9 9 8.5 8z" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-base font-black tracking-wider text-white">
              MANTIS DENTAL
            </h1>
            <p className="text-[11px] font-bold uppercase tracking-wider text-teal-400 flex items-center gap-1 mt-0.5">
              <span>Sistema Inteligente</span>
            </p>
          </div>
        </div>

        {/* Menú de Navegación Categorizado */}
        <nav
          className="flex-1 overflow-y-auto px-3.5 py-4 space-y-4 text-xs"
          aria-label="Menú principal de módulos"
        >
          {CATEGORIES.map((category) => {
            const items = NAVIGATION_MODULES.filter(
              (mod) => mod.category === category && isVisible(mod),
            )
            if (items.length === 0) return null

            return (
              <div key={category} className="space-y-1">
                <div className="px-3 pt-1 pb-1 text-[10px] font-extrabold uppercase tracking-widest text-slate-400/90">
                  {category}
                </div>
                <div className="space-y-1">
                  {items.map((item) => {
                    const Icon = MODULE_ICONS[item.id]
                    const isActive = activeModule === item.id
                    const isAi = item.id === 'mantis-ai'

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          onNavigate(item.id)
                          onClose()
                        }}
                        className={cn(
                          'group flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-xs font-semibold transition-all duration-150',
                          isActive
                            ? 'bg-teal-500/15 text-teal-300 shadow-[inset_0_0_0_1px_rgba(45,212,191,0.35)]'
                            : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100',
                        )}
                      >
                        <Icon
                          aria-hidden="true"
                          className={cn(
                            'h-4 w-4 shrink-0 transition-colors',
                            isActive
                              ? 'text-teal-400'
                              : 'text-slate-400 group-hover:text-slate-200',
                          )}
                        />
                        <span className="flex-1 truncate">{item.name}</span>
                        {isAi ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-teal-400 to-cyan-400 px-2 py-0.5 text-[9px] font-black text-slate-950 shadow-xs">
                            <Sparkles className="h-2.5 w-2.5" />
                            PRO
                          </span>
                        ) : null}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </nav>

        {/* Tarjeta Inferior de Usuario Integrada */}
        <div className="p-3.5 border-t border-slate-800/80">
          <div className="rounded-2xl bg-slate-800/60 border border-slate-700/50 p-3 shadow-inner">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-500/20 text-xs font-bold text-teal-300 border border-teal-500/30">
                {userInitials || 'AD'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-white">
                  {user?.name || 'Administrador Mantis'}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse-dot"
                    aria-hidden="true"
                  />
                  <span className="text-[11px] font-semibold text-emerald-400">
                    En línea
                  </span>
                </div>
              </div>
            </div>

            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-slate-800 py-1.5 text-[11px] font-bold text-slate-300 hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Cerrar sesión</span>
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}

