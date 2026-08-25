import { useState } from 'react';
import AppointmentsModule from './components/AppointmentsModule';
import FinanzasModule from './components/FinanzasModule';
import InventoryModule from './components/InventoryModule';
import BudgetsModule from './components/BudgetsModule';
import PatientsModule from './components/PatientsModule';
import ReportsModule from './components/ReportsModule';
import ClinicalReportsReport from './components/ClinicalReportsReport';
import ConfigurationModule from './components/ConfigurationModule';
import ColleaguesModule from './components/ColleaguesModule';
import WhatsAppModule from './components/WhatsAppModule';

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

export function App() {
  const [currentModule, setCurrentModule] = useState<ModuleId>('dashboard');

  const menuItems: { id: ModuleId; label: string }[] = [
    { id: 'dashboard', label: '🏠 Dashboard' },
    { id: 'pacientes', label: '👥 Pacientes' },
    { id: 'agenda', label: '📅 Agenda' },
    { id: 'presupuestos', label: '💰 Presupuestos' },
    { id: 'colegas', label: '🩺 Colegas' },
    { id: 'finanzas', label: '💵 Finanzas' },
    { id: 'whatsapp', label: '💬 WhatsApp' },
    { id: 'mantis-ai', label: '🤖 Mantis AI' },
    { id: 'reportes', label: '📊 Reportes' },
    { id: 'inventario', label: '📦 Inventario' },
    { id: 'configuracion', label: '⚙️ Configuración' },
  ];

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-800">
      {/* Sidebar Lateral */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen p-4 shrink-0 print:hidden">
        <div className="flex items-center gap-3 pb-4 mb-4 border-b border-slate-800">
          <span className="text-2xl">🦷</span>
          <div>
            <h1 className="font-bold text-white tracking-wider">MANTIS DENTAL</h1>
            <p className="text-[10px] text-teal-400 font-semibold">Sistema Inteligente</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentModule(item.id)}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                currentModule === item.id
                  ? 'bg-teal-600 text-white font-bold shadow-md'
                  : 'hover:bg-slate-800 text-slate-400'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="pt-4 border-t border-slate-800 text-xs text-slate-500">
          Dr. Juan Pérez (Odontólogo)
        </div>
      </aside>

      {/* Workspace Principal */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 print:hidden">
          <h2 className="font-bold text-slate-800">Consultorio Odontológico Mantis</h2>
          <span className="bg-emerald-100 text-emerald-700 text-xs px-3 py-1 rounded-full font-bold">
            🟢 Mantis AI Activo
          </span>
        </header>

        <main className="flex-1 p-6 overflow-y-auto bg-slate-50 print:p-0">
          {currentModule === 'dashboard' && (
            <ReportsModule />
          )}

          {currentModule === 'pacientes' && <PatientsModule />}

          {currentModule === 'agenda' && <AppointmentsModule />}

          {currentModule === 'presupuestos' && <BudgetsModule />}

          {currentModule === 'colegas' && <ColleaguesModule />}
          {currentModule === 'whatsapp' && <WhatsAppModule />}


          {currentModule === 'finanzas' && <FinanzasModule />}

          {currentModule === 'inventario' && <InventoryModule />}

          {currentModule === 'reportes' && <ClinicalReportsReport />}

          {currentModule === 'configuracion' && <ConfigurationModule />}

          {currentModule !== 'dashboard' && 
           currentModule !== 'pacientes' && 
           currentModule !== 'agenda' && 
           currentModule !== 'presupuestos' && 
           currentModule !== 'colegas' &&
                     currentModule !== 'whatsapp' &&
           currentModule !== 'finanzas' &&
           currentModule !== 'inventario' &&
           currentModule !== 'reportes' &&
           currentModule !== 'configuracion' && (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center max-w-xl mx-auto">
              <h3 className="text-lg font-bold text-slate-800">Módulo: {currentModule.toUpperCase()}</h3>
              <p className="text-xs text-slate-500 mt-2">Estructura vinculada a la base de datos PostgreSQL.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;