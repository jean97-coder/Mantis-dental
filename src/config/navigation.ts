import type { LucideIcon } from 'lucide-react'
import {
  BarChart3,
  Bot,
  CalendarDays,
  CircleDollarSign,
  LayoutDashboard,
  MessageCircle,
  Package,
  Receipt,
  Settings,
  Users,
  UserRoundCog,
} from 'lucide-react'
import type { ModuleId } from '../types/navigation'

export const MODULE_ICONS: Record<ModuleId, LucideIcon> = {
  dashboard: LayoutDashboard,
  pacientes: Users,
  agenda: CalendarDays,
  presupuestos: Receipt,
  colegas: UserRoundCog,
  finanzas: CircleDollarSign,
  whatsapp: MessageCircle,
  'mantis-ai': Bot,
  reportes: BarChart3,
  inventario: Package,
  configuracion: Settings,
}

export const MANTIS_AI_BADGE = '3'
