import React, { useState } from 'react';
import { UserPlus, Search, Phone, ShieldAlert, Eye, Activity } from 'lucide-react';

interface Patient {
  id: string;
  name: string;
  nationalId: string;
  phone: string;
  email: string;
  alerts: string[];
  lastVisit: string;
}

export const PacientesModule: React.FC = () => {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [activeTab, setActiveTab] = useState<'odontograma' | 'historial' | 'datos'>('odontograma');
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [toothDiagnosis, setToothDiagnosis] = useState('Sano / Restaurado');

  // Datos de prueba simulando PostgreSQL (mantis_dental_db)
  const patients: Patient[] = [
    {
      id: '1',
      name: 'María Fernanda López',
      nationalId: '1723456789',
      phone: '+593 99 123 4567',
      email: 'm.lopez@example.com',
      alerts: ['Hipertensión', 'Alergia a Penicilina'],
      lastVisit: '2026-08-10',
    },
    {
      id: '2',
      name: 'Carlos Alberto Rodríguez',
      nationalId: '1712987654',
      phone: '+593 98 765 4321',
      email: 'carlos.rod@example.com',
      alerts: ['Paciente Diabético'],
      lastVisit: '2026-08-18',
    },
  ];

  // Cuadrantes FDI Permanentes (11-18, 21-28, 41-48, 31-38)
  const quadrant1 = [18, 17, 16, 15, 14, 13, 12, 11];
  const quadrant2 = [21, 22, 23, 24, 25, 26, 27, 28];
  const quadrant4 = [48, 47, 46, 45, 44, 43, 42, 41];
  const quadrant3 = [31, 32, 33, 34, 35, 36, 37, 38];

  const filteredPatients = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.nationalId.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      {/* Vista de Lista de Pacientes */}
      {!selectedPatient ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Gestión de Pacientes</h2>
              <p className="text-xs text-slate-500">Expedientes clínicos 360° e historias odontológicas.</p>
            </div>
            <button className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-sm flex items-center gap-2 transition-all">
              <UserPlus className="w-4 h-4" />
              Nuevo Paciente
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar por nombre, cédula..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>
            </div>

            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase font-bold text-[10px]">
                <tr>
                  <th className="px-6 py-3.5">Paciente</th>
                  <th className="px-6 py-3.5">Cédula / DNI</th>
                  <th className="px-6 py-3.5">Contacto</th>
                  <th className="px-6 py-3.5">Alertas Médicas</th>
                  <th className="px-6 py-3.5">Última Visita</th>
                  <th className="px-6 py-3.5 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredPatients.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">{p.name}</td>
                    <td className="px-6 py-4 text-slate-500">{p.nationalId}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {p.phone}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {p.alerts.map((a, i) => (
                          <span key={i} className="bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1">
                            <ShieldAlert className="w-2.5 h-2.5" /> {a}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{p.lastVisit}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedPatient(p)}
                        className="bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-teal-700 text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-200 hover:border-teal-200 transition-all inline-flex items-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" /> Ver Perfil
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Vista Expediente Clínico 360° del Paciente seleccionado */
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                setSelectedPatient(null);
                setSelectedTooth(null);
              }}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1"
            >
              ← Volver a Pacientes
            </button>
            <span className="text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200 px-3 py-1 rounded-full">
              Expediente Activo
            </span>
          </div>

          {/* Banner de Datos del Paciente */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-teal-600 text-white font-black text-xl flex items-center justify-center shadow-md shadow-teal-600/20">
                {selectedPatient.name.charAt(0)}
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">{selectedPatient.name}</h2>
                <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                  <span>Cédula: <b>{selectedPatient.nationalId}</b></span>
                  <span>Teléfono: <b>{selectedPatient.phone}</b></span>
                </div>
              </div>
            </div>

            <div className="flex gap-1.5">
              {selectedPatient.alerts.map((a, i) => (
                <span key={i} className="bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold px-3 py-1 rounded-xl flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5" /> {a}
                </span>
              ))}
            </div>
          </div>

          {/* Navegación Interna del Perfil */}
          <div className="flex border-b border-slate-200 gap-6">
            <button
              onClick={() => setActiveTab('odontograma')}
              className={`pb-3 text-xs font-bold border-b-2 transition-all ${
                activeTab === 'odontograma'
                  ? 'border-teal-600 text-teal-600'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              🦷 Odontograma Interactivo (FDI)
            </button>
            <button
              onClick={() => setActiveTab('historial')}
              className={`pb-3 text-xs font-bold border-b-2 transition-all ${
                activeTab === 'historial'
                  ? 'border-teal-600 text-teal-600'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              📋 Diagnósticos & Tratamientos
            </button>
          </div>

          {/* TAB 1: Odontograma Interactivo FDI */}
          {activeTab === 'odontograma' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-slate-800 text-sm">Odontograma Adulto (Sistema Internacional FDI)</h3>
                  <span className="text-[11px] text-slate-400 font-medium">Haz clic en una pieza para inspeccionar</span>
                </div>

                {/* Arcada Superior */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block text-center">Arcada Superior (Maxilar)</span>
                  <div className="flex justify-center gap-2">
                    <div className="flex gap-1 bg-slate-50 p-2 rounded-xl border border-slate-100">
                      {quadrant1.map((num) => (
                        <button
                          key={num}
                          onClick={() => setSelectedTooth(num)}
                          className={`w-9 h-11 rounded-lg border flex flex-col items-center justify-between py-1 transition-all text-xs font-bold ${
                            selectedTooth === num
                              ? 'bg-teal-600 text-white border-teal-700 shadow-md ring-2 ring-teal-300'
                              : 'bg-white border-slate-200 hover:border-teal-400 text-slate-700'
                          }`}
                        >
                          <span className="text-[9px] opacity-70">P</span>
                          <span>{num}</span>
                        </button>
                      ))}
                    </div>
                    <div className="w-0.5 bg-slate-300 rounded-full my-1"></div>
                    <div className="flex gap-1 bg-slate-50 p-2 rounded-xl border border-slate-100">
                      {quadrant2.map((num) => (
                        <button
                          key={num}
                          onClick={() => setSelectedTooth(num)}
                          className={`w-9 h-11 rounded-lg border flex flex-col items-center justify-between py-1 transition-all text-xs font-bold ${
                            selectedTooth === num
                              ? 'bg-teal-600 text-white border-teal-700 shadow-md ring-2 ring-teal-300'
                              : 'bg-white border-slate-200 hover:border-teal-400 text-slate-700'
                          }`}
                        >
                          <span className="text-[9px] opacity-70">P</span>
                          <span>{num}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Arcada Inferior */}
                <div className="space-y-2 pt-4 border-t border-slate-100">
                  <div className="flex justify-center gap-2">
                    <div className="flex gap-1 bg-slate-50 p-2 rounded-xl border border-slate-100">
                      {quadrant4.map((num) => (
                        <button
                          key={num}
                          onClick={() => setSelectedTooth(num)}
                          className={`w-9 h-11 rounded-lg border flex flex-col items-center justify-between py-1 transition-all text-xs font-bold ${
                            selectedTooth === num
                              ? 'bg-teal-600 text-white border-teal-700 shadow-md ring-2 ring-teal-300'
                              : 'bg-white border-slate-200 hover:border-teal-400 text-slate-700'
                          }`}
                        >
                          <span>{num}</span>
                          <span className="text-[9px] opacity-70">P</span>
                        </button>
                      ))}
                    </div>
                    <div className="w-0.5 bg-slate-300 rounded-full my-1"></div>
                    <div className="flex gap-1 bg-slate-50 p-2 rounded-xl border border-slate-100">
                      {quadrant3.map((num) => (
                        <button
                          key={num}
                          onClick={() => setSelectedTooth(num)}
                          className={`w-9 h-11 rounded-lg border flex flex-col items-center justify-between py-1 transition-all text-xs font-bold ${
                            selectedTooth === num
                              ? 'bg-teal-600 text-white border-teal-700 shadow-md ring-2 ring-teal-300'
                              : 'bg-white border-slate-200 hover:border-teal-400 text-slate-700'
                          }`}
                        >
                          <span>{num}</span>
                          <span className="text-[9px] opacity-70">P</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block text-center">Arcada Inferior (Mandíbula)</span>
                </div>
              </div>

              {/* Detalle de Pieza Seleccionada */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-3 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-teal-600" />
                  Detalle de Pieza Dental
                </h3>

                {selectedTooth ? (
                  <div className="space-y-4">
                    <div className="bg-teal-50 border border-teal-200 p-4 rounded-xl text-center">
                      <span className="text-xs text-teal-600 font-bold uppercase block">Pieza Seleccionada</span>
                      <span className="text-3xl font-black text-teal-800">{selectedTooth}</span>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-600 block">Registrar Hallazgo / Tratamiento</label>
                      <select 
                        value={toothDiagnosis} 
                        onChange={(e) => setToothDiagnosis(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-teal-500 outline-none font-medium"
                      >
                        <option value="Sano / Restaurado">Sano / Restaurado</option>
                        <option value="Caries Oclusal">Caries Oclusal (Superficie O)</option>
                        <option value="Endodoncia Requerida">Endodoncia Requerida</option>
                        <option value="Ausente / Extracción">Ausente / Extracción</option>
                        <option value="Corona Definitiva">Corona Definitiva</option>
                      </select>
                    </div>

                    <button 
                      onClick={() => alert(`Pieza ${selectedTooth} actualizada con: ${toothDiagnosis}`)}
                      className="w-full bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold py-2.5 rounded-xl transition-all shadow-sm"
                    >
                      Guardar en Ficha
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-10 text-slate-400 space-y-2">
                    <span className="text-3xl block">👈</span>
                    <p className="text-xs font-medium">Selecciona cualquier pieza del odontograma para ver o registrar un diagnóstico.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: Diagnósticos & Tratamientos */}
          {activeTab === 'historial' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-800 text-sm">Historial Clínico de Diagnósticos</h3>
              <p className="text-xs text-slate-500">Registros almacenados en la base de datos PostgreSQL del paciente {selectedPatient.name}.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PacientesModule;