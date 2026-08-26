import type { LucideIcon } from 'lucide-react'
import {
  Bot,
  CalendarDays,
  CircleDollarSign,
  FileText,
  LayoutDashboard,
  MessageCircle,
  Package,
  Receipt,
  Settings,
  ShieldCheck,
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
  reportes: FileText,
  finanzas: CircleDollarSign,
  inventario: Package,
  whatsapp: MessageCircle,
  'mantis-ai': Bot,
  configuracion: Settings,
  accesos: ShieldCheck,
}

export const MANTIS_AI_BADGE = 'IA'

