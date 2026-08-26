import { useEffect, useMemo, useState } from 'react';
import { Calendar, FileText, Mail, Phone, Search, ShieldAlert, User, UserPlus, Users, X } from 'lucide-react';
import ClinicalHistoryModule from './ClinicalHistoryModule';

interface Patient {
  id: number;
  name: string;
  email: string;
  phone: string;
  dni: string;
  address: string | null;
  medical_history: string | null;
  created_at: string;
}

interface PatientForm {
  name: string;
  dni: string;
  phone: string;
  email: string;
  address: string;
  medical_history: string;
}

const API_URL = 'http://localhost:4001/api/patients';

const emptyForm: PatientForm = {
  name: '',
  dni: '',
  phone: '',
  email: '',
  address: '',
  medical_history: '',
};

export default function PatientsModule() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<PatientForm>(emptyForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  useEffect(() => {
    async function loadPatients() {
      try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('No se pudieron cargar los pacientes');
        setPatients(await response.json() as Patient[]);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Error al cargar pacientes');
      } finally {
        setIsLoading(false);
      }
    }

    void loadPatients();
  }, []);

  const filteredPatients = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    if (!normalizedSearch) return patients;

    return patients.filter((patient) =>
      patient.name.toLowerCase().includes(normalizedSearch) ||
      patient.dni.toLowerCase().includes(normalizedSearch) ||
      (patient.phone && patient.phone.toLowerCase().includes(normalizedSearch))
    );
  }, [patients, searchTerm]);

  function updateForm(field: keyof PatientForm, value: string) {
    setForm((currentForm) => ({ ...currentForm, [field]: value }));
  }

  function closeModal() {
    if (isSaving) return;
    setIsModalOpen(false);
    setForm(emptyForm);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError('');

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await response.json() as Patient | { error?: string };

      if (!response.ok) {
        throw new Error('error' in data && data.error ? data.error : 'No se pudo crear el paciente');
      }

      setPatients((currentPatients) => [data as Patient, ...currentPatients]);
      closeModal();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Error al crear paciente');
    } finally {
      setIsSaving(false);
    }
  }

  if (selectedPatient) {
    return <ClinicalHistoryModule patient={selectedPatient} onBack={() => setSelectedPatient(null)} />;
  }

  return (
    <section className="mx-auto max-w-7xl space-y-6">
      {/* Header del Módulo */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-teal-600">
            <Users className="h-4.5 w-4.5" />
            <span className="text-xs font-extrabold uppercase tracking-widest text-teal-700">Directorio Clínico</span>
          </div>
          <h1 className="mt-1 text-2xl font-black text-slate-900 tracking-tight">Pacientes & Expedientes</h1>
          <p className="mt-0.5 text-xs text-slate-500 font-medium">Gestión de historias odontológicas, diagnósticos y datos de contacto.</p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-teal-600/20 transition-all hover:bg-teal-700 hover:shadow-lg cursor-pointer"
        >
          <UserPlus className="h-4 w-4" />
          <span>Nuevo Paciente</span>
        </button>
      </div>

      {error && (
        <p className="rounded-xl border border-rose-200 bg-rose-50/90 px-4 py-3 text-xs font-semibold text-rose-700">
          {error}
        </p>
      )}

      {/* Tabla y Filtros */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between bg-slate-50/40">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar por nombre, cédula/DNI o teléfono..."
              className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-teal-500 focus:ring-3 focus:ring-teal-500/10"
            />
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
            <span className="h-2 w-2 rounded-full bg-teal-500" />
            <span>{filteredPatients.length} pacientes registrados</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-xs">
            <thead className="bg-slate-50/80 text-[10px] uppercase tracking-wider text-slate-500 font-extrabold border-b border-slate-100">
              <tr>
                <th className="px-6 py-3.5">Paciente</th>
                <th className="px-6 py-3.5">Identificación (DNI)</th>
                <th className="px-6 py-3.5">Contacto</th>
                <th className="px-6 py-3.5">Antecedentes Médicos</th>
                <th className="px-6 py-3.5">Fecha Registro</th>
                <th className="px-6 py-3.5 text-right">Expediente</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-semibold">
                    Cargando directorio de pacientes...
                  </td>
                </tr>
              ) : filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-semibold">
                    No se encontraron pacientes que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : (
                filteredPatients.map((patient) => {
                  const initials = patient.name
                    .split(' ')
                    .slice(0, 2)
                    .map((word) => word[0])
                    .join('')
                    .toUpperCase();

                  const hasAlert = Boolean(patient.medical_history && patient.medical_history.trim());

                  return (
                    <tr key={patient.id} className="transition-colors hover:bg-teal-50/30 group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 font-black text-xs border border-teal-100 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                            {initials || <User className="h-4 w-4" />}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block text-xs">{patient.name}</span>
                            <span className="text-[11px] text-slate-400 font-normal">ID #{patient.id}</span>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 font-semibold text-slate-700">
                        {patient.dni}
                      </td>

                      <td className="px-6 py-4 space-y-1">
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <Phone className="h-3 w-3 text-teal-600" />
                          <span>{patient.phone || 'Sin teléfono'}</span>
                        </div>
                        {patient.email && (
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                            <Mail className="h-3 w-3 text-slate-400" />
                            <span>{patient.email}</span>
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-4 max-w-xs">
                        {hasAlert ? (
                          <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 border border-amber-200/80 px-2 py-1 text-[11px] font-semibold text-amber-800">
                            <ShieldAlert className="h-3 w-3 text-amber-600 shrink-0" />
                            <span className="truncate">{patient.medical_history}</span>
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">Sin antecedentes críticos</span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-slate-500 text-[11px]">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-slate-400" />
                          {new Date(patient.created_at).toLocaleDateString('es-ES')}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedPatient(patient)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 hover:bg-teal-600 hover:text-white px-3 py-1.5 text-xs font-bold text-slate-700 transition-all cursor-pointer shadow-2xs"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          <span>Ver Expediente</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Nuevo Paciente */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="new-patient-title"
        >
          <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white shadow-2xl border border-slate-100 animate-fade-in-up">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4.5 bg-slate-50/50">
              <div>
                <h3 id="new-patient-title" className="text-base font-black text-slate-900">
                  Nuevo Paciente
                </h3>
                <p className="text-xs text-slate-500 font-medium">Registra los datos generales y antecedentes médicos.</p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition-colors"
                aria-label="Cerrar ventana"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid gap-3.5 sm:grid-cols-2">
                <label className="sm:col-span-2">
                  <span className="mb-1 block text-xs font-bold text-slate-700">Nombre completo *</span>
                  <input
                    required
                    type="text"
                    placeholder="Ej. María Fernanda Gómez"
                    value={form.name}
                    onChange={(e) => updateForm('name', e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 outline-none transition focus:border-teal-500 focus:ring-3 focus:ring-teal-500/10"
                  />
                </label>

                <label>
                  <span className="mb-1 block text-xs font-bold text-slate-700">DNI / Cédula *</span>
                  <input
                    required
                    type="text"
                    placeholder="Ej. 1723456789"
                    value={form.dni}
                    onChange={(e) => updateForm('dni', e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 outline-none transition focus:border-teal-500 focus:ring-3 focus:ring-teal-500/10"
                  />
                </label>

                <label>
                  <span className="mb-1 block text-xs font-bold text-slate-700">Teléfono / WhatsApp *</span>
                  <input
                    required
                    type="tel"
                    placeholder="Ej. +593 99 123 4567"
                    value={form.phone}
                    onChange={(e) => updateForm('phone', e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 outline-none transition focus:border-teal-500 focus:ring-3 focus:ring-teal-500/10"
                  />
                </label>

                <label>
                  <span className="mb-1 block text-xs font-bold text-slate-700">Correo electrónico *</span>
                  <input
                    required
                    type="email"
                    placeholder="nombre@ejemplo.com"
                    value={form.email}
                    onChange={(e) => updateForm('email', e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 outline-none transition focus:border-teal-500 focus:ring-3 focus:ring-teal-500/10"
                  />
                </label>

                <label>
                  <span className="mb-1 block text-xs font-bold text-slate-700">Dirección</span>
                  <input
                    type="text"
                    placeholder="Calle, número o sector"
                    value={form.address}
                    onChange={(e) => updateForm('address', e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 outline-none transition focus:border-teal-500 focus:ring-3 focus:ring-teal-500/10"
                  />
                </label>

                <label className="sm:col-span-2">
                  <span className="mb-1 block text-xs font-bold text-slate-700">Antecedentes médicos y alergias</span>
                  <textarea
                    rows={3}
                    placeholder="Alergias a medicamentos, hipertensión, diabetes, cirugías recientes..."
                    value={form.medical_history}
                    onChange={(e) => updateForm('medical_history', e.target.value)}
                    className="w-full resize-none rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 outline-none transition focus:border-teal-500 focus:ring-3 focus:ring-teal-500/10"
                  />
                </label>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  disabled={isSaving}
                  type="submit"
                  className="rounded-xl bg-teal-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-teal-600/20 hover:bg-teal-700 transition-all disabled:opacity-60 cursor-pointer"
                >
                  {isSaving ? 'Guardando...' : 'Guardar Paciente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

