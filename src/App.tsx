import { useState } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DashboardModule } from './components/dashboard/DashboardModule';
import AppointmentsModule from './components/AppointmentsModule';
import FinanzasModule from './components/FinanzasModule';
import InventoryModule from './components/InventoryModule';
import BudgetsModule from './components/BudgetsModule';
import PatientsModule from './components/PatientsModule';
import ClinicalReportsReport from './components/ClinicalReportsReport';
import ConfigurationModule from './components/ConfigurationModule';
import ColleaguesModule from './components/ColleaguesModule';
import WhatsAppModule from './components/WhatsAppModule';
import MantisAiModule from './components/MantisAiModule';
import LoginScreen from './components/LoginScreen';
import AccessManagementModule from './components/AccessManagementModule';
import type { ModuleId } from './types/navigation';

type Session = {
  token: string;
  user: {
    id: number;
    email: string;
    name: string;
    role: 'admin' | 'odontologo';
    permissions: string[];
  };
};

export function App() {
  const [currentModule, setCurrentModule] = useState<ModuleId>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [session, setSession] = useState<Session | null>(() => {
    try {
      return JSON.parse(localStorage.getItem('mantis-session') || 'null') as Session | null;
    } catch {
      return null;
    }
  });

  if (!session) {
    return <LoginScreen onLogin={setSession} />;
  }

  function handleLogout() {
    localStorage.removeItem('mantis-session');
    setSession(null);
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 font-sans text-slate-800 antialiased selection:bg-teal-500 selection:text-white">
      {/* Sidebar Categorizada y Responsiva */}
      <Sidebar
        activeModule={currentModule}
        onNavigate={(id: ModuleId) => {
          setCurrentModule(id);
          setIsSidebarOpen(false);
        }}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        user={session.user}
        onLogout={handleLogout}
      />

      {/* Workspace y Contenido Principal */}
      <div className="flex flex-1 flex-col h-screen min-w-0 overflow-hidden">
        {/* Header Superior Minimalista */}
        <Header
          onOpenSidebar={() => setIsSidebarOpen(true)}
          user={session.user}
          notificationCount={2}
          onConsultAi={() => setCurrentModule('mantis-ai')}
        />

        {/* Contenedor de Módulo con Scroll Suave */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-[#f8fafc] print:p-0 print:bg-white custom-scrollbar">
          {currentModule === 'dashboard' && (
            <DashboardModule
              userName={session.user.name}
              onNavigate={(id) => setCurrentModule(id)}
              onOpenNewPatient={() => setCurrentModule('pacientes')}
              onOpenNewAppointment={() => setCurrentModule('agenda')}
              onConsultAi={() => setCurrentModule('mantis-ai')}
            />
          )}

          {currentModule === 'pacientes' && <PatientsModule />}

          {currentModule === 'agenda' && <AppointmentsModule />}

          {currentModule === 'presupuestos' && <BudgetsModule />}

          {currentModule === 'colegas' && <ColleaguesModule />}

          {currentModule === 'whatsapp' && <WhatsAppModule />}

          {currentModule === 'mantis-ai' && <MantisAiModule />}

          {currentModule === 'finanzas' && <FinanzasModule />}

          {currentModule === 'inventario' && <InventoryModule />}

          {currentModule === 'reportes' && <ClinicalReportsReport />}

          {currentModule === 'configuracion' && <ConfigurationModule />}

          {currentModule === 'accesos' && (
            <AccessManagementModule token={session.token} />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;