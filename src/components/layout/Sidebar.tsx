import { MODULE_ICONS, MANTIS_AI_BADGE } from '../../config/navigation'
import { cn } from '../../lib/utils'
import { NAVIGATION_MODULES, type ModuleId } from '../../types/navigation'

interface SidebarProps {
  activeModule: ModuleId
  onNavigate: (moduleId: ModuleId) => void
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({
  activeModule,
  onNavigate,
  isOpen,
  onClose,
}: SidebarProps) {
  return (
    <>
      <button
        type="button"
        aria-label="Cerrar menú"
        className={cn(
          'fixed inset-0 z-30 bg-slate-950/50 transition-opacity lg:hidden',
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={onClose}
      />

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-72 flex-col bg-slate-900 text-slate-100 shadow-xl transition-transform duration-200 lg:static lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="border-b border-slate-800 px-5 py-6">
          <p className="text-lg font-semibold tracking-tight">
            🦷 MANTIS DENTAL
          </p>
          <p className="mt-1 text-xs font-medium uppercase tracking-[0.16em] text-teal-400">
            Sistema Inteligente Clínico
          </p>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label="Módulos">
          {NAVIGATION_MODULES.map((module) => {
            const Icon = MODULE_ICONS[module.id]
            const isActive = module.id === activeModule
            const showAiBadge = module.id === 'mantis-ai'

            return (
              <button
                key={module.id}
                type="button"
                onClick={() => {
                  onNavigate(module.id)
                  onClose()
                }}
                className={cn(
                  'group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors',
                  isActive
                    ? 'bg-teal-500/15 text-white shadow-[inset_0_0_0_1px_rgba(45,212,191,0.25)]'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white',
                )}
              >
                <Icon
                  aria-hidden="true"
                  className={cn(
                    'h-5 w-5 shrink-0',
                    isActive
                      ? 'text-teal-300'
                      : 'text-slate-400 group-hover:text-slate-200',
                  )}
                />
                <span className="flex-1 font-medium">{module.name}</span>
                {showAiBadge ? (
                  <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-teal-400 px-1.5 py-0.5 text-[10px] font-semibold text-slate-900">
                    {MANTIS_AI_BADGE}
                  </span>
                ) : null}
              </button>
            )
          })}
        </nav>

        <div className="border-t border-slate-800 px-4 py-4">
          <div className="flex items-center gap-3 rounded-xl bg-slate-800/70 px-3 py-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-500/20 text-sm font-semibold text-teal-300">
              JP
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">
                Dr. Juan Pérez
              </p>
              <p className="flex items-center gap-1.5 truncate text-xs text-slate-400">
                <span
                  className="h-1.5 w-1.5 rounded-full bg-emerald-400"
                  aria-hidden="true"
                />
                Odontólogo Principal
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
