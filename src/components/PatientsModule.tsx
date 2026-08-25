import { useEffect, useMemo, useState } from 'react';
import { Mail, Phone, Search, UserPlus, Users, X } from 'lucide-react';
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

const API_URL = 'http://localhost:4000/api/patients';

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
      patient.dni.toLowerCase().includes(normalizedSearch),
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

  return (
    <section className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-teal-600">
            <Users className="h-5 w-5" />
            <span className="text-xs font-bold uppercase tracking-widest">Directorio clínico</span>
          </div>
          <h2 className="mt-1 text-2xl font-black text-slate-900">Pacientes</h2>
          <p className="mt-1 text-sm text-slate-500">Gestiona expedientes y datos de contacto.</p>
        </div>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-teal-700"
        >
          <UserPlus className="h-4 w-4" />
          Nuevo Paciente
        </button>
      </div>

      {error && <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar por nombre o DNI..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            />
          </div>
          <span className="text-xs font-semibold text-slate-400">{filteredPatients.length} pacientes</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-6 py-4 font-bold">Paciente</th>
                <th className="px-6 py-4 font-bold">DNI</th>
                <th className="px-6 py-4 font-bold">Contacto</th>
                <th className="px-6 py-4 font-bold">Antecedentes médicos</th>
                <th className="px-6 py-4 font-bold">Registro</th>
                <th className="px-6 py-4 font-bold">Expediente</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400">Cargando pacientes...</td></tr>
              ) : filteredPatients.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400">No hay pacientes para mostrar.</td></tr>
              ) : filteredPatients.map((patient) => (
                <tr key={patient.id} className="transition hover:bg-teal-50/40">
                  <td className="px-6 py-4 font-bold text-slate-900">{patient.name}</td>
                  <td className="px-6 py-4 font-medium text-slate-500">{patient.dni}</td>
                  <td className="space-y-1 px-6 py-4 text-slate-600">
                    <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-teal-600" />{patient.phone}</div>
                    <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-teal-600" />{patient.email}</div>
                  </td>
                  <td className="max-w-xs px-6 py-4 text-slate-500">{patient.medical_history || 'Sin antecedentes registrados'}</td>
                  <td className="px-6 py-4 text-slate-500">{new Date(patient.created_at).toLocaleDateString('es-ES')}</td>
                  <td className="px-6 py-4"><button type="button" onClick={() => setSelectedPatient(patient)} className="rounded-lg bg-teal-50 px-3 py-2 text-xs font-bold text-teal-700 hover:bg-teal-100">Abrir expediente</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedPatient && <ClinicalHistoryModule patient={selectedPatient} onBack={() => setSelectedPatient(null)} />}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" role="dialog" aria-modal="true" aria-labelledby="new-patient-title">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div><h3 id="new-patient-title" className="text-lg font-black text-slate-900">Nuevo Paciente</h3><p className="text-xs text-slate-500">Completa los datos del expediente.</p></div>
              <button type="button" onClick={closeModal} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Cerrar modal"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="grid gap-4 p-6 sm:grid-cols-2">
              {([['name', 'Nombre completo', 'text'], ['dni', 'DNI', 'text'], ['phone', 'Teléfono', 'tel'], ['email', 'Correo electrónico', 'email'], ['address', 'Dirección', 'text']] as const).map(([field, label, type]) => (
                <label key={field} className={field === 'address' ? 'sm:col-span-2' : ''}>
                  <span className="mb-1.5 block text-xs font-bold text-slate-600">{label}</span>
                  <input required={['name', 'dni', 'phone', 'email'].includes(field)} type={type} value={form[field]} onChange={(event) => updateForm(field, event.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100" />
                </label>
              ))}
              <label className="sm:col-span-2"><span className="mb-1.5 block text-xs font-bold text-slate-600">Antecedentes médicos</span><textarea rows={3} value={form.medical_history} onChange={(event) => updateForm('medical_history', event.target.value)} className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100" /></label>
              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4 sm:col-span-2"><button type="button" onClick={closeModal} className="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100">Cancelar</button><button disabled={isSaving} type="submit" className="rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-teal-700 disabled:cursor-wait disabled:opacity-60">{isSaving ? 'Guardando...' : 'Guardar paciente'}</button></div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
