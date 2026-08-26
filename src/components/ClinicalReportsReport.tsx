import { useEffect, useState, type ReactNode } from 'react';
import { Calendar, FileText, Printer, User } from 'lucide-react';

interface Patient { id: number; name: string; dni: string; }
interface Note { id: number; note: string; created_at: string; }
interface Diagnosis { id: number; cie10_code: string; description: string; created_at: string; }
interface RecordItem { id: number; tooth_number: number; diagnosis: string; treatment_plan: string; created_at: string; }

const API = 'http://localhost:4001/api';

export default function ClinicalReportsReport() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientId, setPatientId] = useState('');
  const [notes, setNotes] = useState<Note[]>([]);
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [error, setError] = useState('');

  useEffect(() => { fetch(`${API}/patients`).then((response) => response.json() as Promise<Patient[]>).then(setPatients).catch(() => setError('No se pudieron cargar los pacientes')); }, []);
  useEffect(() => {
    if (!patientId) return;
    async function load() { try { const [notesResponse, diagnosesResponse, recordsResponse] = await Promise.all([fetch(`${API}/clinical-records/patient/${patientId}/notes`), fetch(`${API}/clinical-records/patient/${patientId}/diagnoses`), fetch(`${API}/medical-records/patient/${patientId}`)]); setNotes(await notesResponse.json() as Note[]); setDiagnoses(await diagnosesResponse.json() as Diagnosis[]); setRecords(await recordsResponse.json() as RecordItem[]); } catch { setError('No se pudo cargar el expediente'); } }
    void load();
  }, [patientId]);
  const patient = patients.find((item) => String(item.id) === patientId);
  return <section className="mx-auto max-w-5xl space-y-5"><div className="flex items-end justify-between print:hidden"><div><div className="flex items-center gap-2 text-teal-600"><FileText className="h-5 w-5" /><span className="text-xs font-bold uppercase tracking-widest">Expediente formal</span></div><h2 className="mt-1 text-2xl font-black text-slate-900">Historial Clínico Completo</h2><p className="mt-1 text-sm text-slate-500">Previsualiza e imprime la historia clínica del paciente.</p></div><button type="button" disabled={!patient} onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"><Printer className="h-4 w-4" />Imprimir historial</button></div>{error && <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 print:hidden">{error}</p>}<div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm print:border-0 print:shadow-none"><label className="block max-w-md print:hidden"><span className="mb-2 flex items-center gap-2 text-xs font-bold text-slate-600"><User className="h-4 w-4 text-teal-600" />Paciente</span><select value={patientId} onChange={(event) => setPatientId(event.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"><option value="">Selecciona un paciente</option>{patients.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.dni}</option>)}</select></label>{patient ? <div className="mt-6 space-y-6"><header className="border-b-2 border-teal-600 pb-4 text-center"><h1 className="text-xl font-black text-teal-700">MANTIS DENTAL</h1><p className="text-xs text-slate-500">Dr. Jean Pierre Salazar · Historia Clínica Odontológica</p><h2 className="mt-4 text-lg font-black text-slate-900">{patient.name}</h2><p className="text-sm text-slate-500">DNI: {patient.dni}</p></header><ReportSection title="Registros clínicos">{records.length ? records.map((item) => <div key={item.id} className="border-b border-slate-100 py-3"><p className="text-sm font-bold text-slate-800">Pieza {item.tooth_number}: {item.diagnosis}</p><p className="text-sm text-slate-600">Plan: {item.treatment_plan}</p><p className="mt-1 text-xs text-slate-400"><Calendar className="mr-1 inline h-3 w-3" />{new Date(item.created_at).toLocaleDateString('es-ES')}</p></div>) : <p className="text-sm text-slate-400">Sin registros clínicos.</p>}</ReportSection><ReportSection title="Diagnósticos">{diagnoses.length ? diagnoses.map((item) => <p key={item.id} className="py-2 text-sm"><strong className="mr-2 text-rose-700">{item.cie10_code}</strong>{item.description} · {new Date(item.created_at).toLocaleDateString('es-ES')}</p>) : <p className="text-sm text-slate-400">Sin diagnósticos.</p>}</ReportSection><ReportSection title="Notas de evolución">{notes.length ? notes.map((item) => <p key={item.id} className="border-b border-slate-100 py-2 text-sm"><span className="font-bold">{new Date(item.created_at).toLocaleString('es-ES')}:</span> {item.note}</p>) : <p className="text-sm text-slate-400">Sin notas.</p>}</ReportSection></div> : <p className="py-16 text-center text-sm text-slate-400">Selecciona un paciente para generar el historial.</p>}</div></section>;
}
function ReportSection({ title, children }: { title: string; children: ReactNode }) { return <section><h3 className="border-b border-slate-200 pb-2 text-sm font-black uppercase tracking-wide text-slate-700">{title}</h3><div className="mt-2">{children}</div></section>; }
