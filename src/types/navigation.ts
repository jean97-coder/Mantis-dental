export type ModuleId = 
  | 'dashboard'
  | 'pacientes'
  | 'agenda'
  | 'presupuestos'
  | 'colegas'
  | 'finanzas'
  | 'whatsapp'
  | 'mantis-ai'
  | 'reportes'
  | 'inventario'
  | 'configuracion';

export interface NavItem {
  id: ModuleId;
  name: string;
  label?: string;
  icon?: string;
  badge?: string;
}

export const NAVIGATION_MODULES: NavItem[] = [
  { id: 'dashboard', name: 'Dashboard' },
  { id: 'pacientes', name: 'Pacientes' },
  { id: 'agenda', name: 'Agenda' },
  { id: 'presupuestos', name: 'Presupuestos' },
  { id: 'colegas', name: 'Colegas' },
  { id: 'finanzas', name: 'Finanzas' },
  { id: 'whatsapp', name: 'WhatsApp' },
  { id: 'mantis-ai', name: 'Mantis AI' },
  { id: 'reportes', name: 'Reportes' },
  { id: 'inventario', name: 'Inventario' },
  { id: 'configuracion', name: 'Configuración' },
];