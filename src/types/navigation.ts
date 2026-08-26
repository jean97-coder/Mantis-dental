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
  | 'configuracion'
  | 'accesos';

export interface NavItem {
  id: ModuleId;
  name: string;
  category: 'PRINCIPAL' | 'ATENCIÓN' | 'CLÍNICA' | 'GESTIÓN' | 'COMUNICACIÓN' | 'INTELIGENCIA' | 'SISTEMA';
  permission?: string;
  badge?: string;
}

export const NAVIGATION_MODULES: NavItem[] = [
  { id: 'dashboard', name: 'Dashboard', category: 'PRINCIPAL' },
  { id: 'pacientes', name: 'Pacientes', category: 'ATENCIÓN', permission: 'pacientes' },
  { id: 'agenda', name: 'Agenda', category: 'ATENCIÓN', permission: 'agenda' },
  { id: 'presupuestos', name: 'Presupuestos', category: 'ATENCIÓN', permission: 'presupuestos' },
  { id: 'colegas', name: 'Colegas y Especialistas', category: 'CLÍNICA', permission: 'colegas' },
  { id: 'reportes', name: 'Historial Clínico', category: 'CLÍNICA', permission: 'reportes' },
  { id: 'finanzas', name: 'Finanzas', category: 'GESTIÓN', permission: 'finanzas' },
  { id: 'inventario', name: 'Inventario', category: 'GESTIÓN', permission: 'inventario' },
  { id: 'whatsapp', name: 'WhatsApp', category: 'COMUNICACIÓN', permission: 'whatsapp' },
  { id: 'mantis-ai', name: 'Mantis AI', category: 'INTELIGENCIA', badge: 'PRO' },
  { id: 'configuracion', name: 'Configuración', category: 'SISTEMA', permission: 'configuracion' },
  { id: 'accesos', name: 'Gestión de accesos', category: 'SISTEMA', permission: 'admin' },
];