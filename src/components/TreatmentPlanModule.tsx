import { useEffect, useState, type FormEvent } from 'react';
import { Calendar, CheckCircle, Plus, UserRound, X } from 'lucide-react';

interface Colleague { id: number; full_name: string; specialty: string }
interface Treatment { id: number; tooth_number: number; diagnosis: string; treatment_plan: string; notes: string | null; created_at: string; colleague_name: string | null; colleague_specialty: string | null; session_number: number; total_sessions: number; progress_status: string }
interface TreatmentForm { tooth_number: string; diagnosis: string; treatment_plan: string; notes: string; colleague_id: string; session_number: string; total_sessions: string; progress_status: string }

const RECORDS_URL = 'http://localhost:4000/api/medical-records';
const COLLEAGUES_URL = 'http://localhost:4000/api/colleagues';
const emptyForm: TreatmentForm = { tooth_number: '', diagnosis: '', treatment_plan: '', notes: '', colleague_id: '', session_number: '1', total_sessions: '1', progress_status: 'Planificado' };

export default function TreatmentPlanModule({ patientId }: { patientId: number }) {
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [colleagues, setColleagues] = useState<Colleague[]>([]);
  const [form, setForm] = useState<TreatmentForm>(emptyForm);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [recordsResponse, colleaguesResponse] = await Promise.all([fetch(`${RECORDS_URL}/patient/${patientId}`), fetch(COLLEAGUES_URL)]);
        if (!recordsResponse.ok) throw new Error('No se pudieron cargar los tratamientos');
        setTreatments(await recordsResponse.json() as Treatment[]);
        if (colleaguesResponse.ok) setColleagues(await colleaguesResponse.json() as Colleague[]);
      } catch (loadError) { setError(loadError instanceof Error ? loadError.message : 'Error al cargar tratamientos'); }
    }
    void load();
  }, [patientId]);

  function update(field: keyof TreatmentForm, value: string) { setForm((current) => ({ ...current, [field]: value })); }
  function close() { if (!isSaving) { setIsModalOpen(false); setForm(emptyForm); } }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setIsSaving(true); setError('');
    try {
      const response = await fetch(RECORDS_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ patient_id: patientId, tooth_number: Number(form.tooth_number), diagnosis: form.diagnosis, treatment_plan: form.treatment_plan, notes: form.notes, colleague_id: form.colleague_id ? Number(form.colleague_id) : null, session_number: Number(form.session_number), total_sessions: Number(form.total_sessions), progress_status: form.progress_status }) });
      const data = await response.json() as Treatment | { error?: string };
      if (!response.ok) throw new Error('error' in data && data.error ? data.error : 'No se pudo guardar el tratamiento');
      const colleague = colleagues.find((item) => item.id === Number(form.colleague_id));
      setTreatments((current) => [{ ...(data as Treatment), colleague_name: colleague?.full_name ?? null, colleague_specialty: colleague?.specialty ?? null }, ...current]);
      close();
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : 'Error al guardar el tratamiento'); }
    finally { setIsSaving(false); }
  }

  return <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><div><h3 className="text-lg font-black text-slate-900">Plan de tratamientos</h3><p className="mt-1 text-xs text-slate-500">Procedimientos, sesiones y especialistas asignados.</p></div><button type="button" onClick={() => setIsModalOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-3 py-2 text-sm font-bold text-white"><Plus className="h-4 w-4" />Añadir procedimiento</button></div>{error && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}{treatments.length === 0 ? <p className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">Todavía no hay procedimientos en este plan.</p> : <div className="space-y-3">{treatments.map((treatment) => <article key={treatment.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><h4 className="font-black text-slate-900">{treatment.diagnosis} · Pieza {treatment.tooth_number}</h4><span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700"><CheckCircle className="h-3.5 w-3.5" />{treatment.progress_status}</span></div><p className="mt-1 text-sm text-slate-600">{treatment.treatment_plan}</p><div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500"><span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />Sesión {treatment.session_number}/{treatment.total_sessions}</span>{treatment.colleague_name && <span className="inline-flex items-center gap-1 text-teal-700"><UserRound className="h-3.5 w-3.5" />{treatment.colleague_name} · {treatment.colleague_specialty}</span>}</div></article>)}</div>}{isModalOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" role="dialog" aria-modal="true"><div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl"><div className="flex items-center justify-between border-b border-slate-100 px-6 py-4"><h3 className="text-lg font-black text-slate-900">Nuevo procedimiento</h3><button type="button" onClick={close} aria-label="Cerrar" className="rounded-lg p-2 text-slate-400"><X className="h-5 w-5" /></button></div><form onSubmit={save} className="space-y-4 p-6"><div className="grid gap-4 sm:grid-cols-2"><label><span className="mb-1 block text-xs font-bold text-slate-600">Pieza dental</span><input required type="number" min="1" value={form.tooth_number} onChange={(e) => update('tooth_number', e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /></label><label><span className="mb-1 block text-xs font-bold text-slate-600">Estado</span><select value={form.progress_status} onChange={(e) => update('progress_status', e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"><option>Planificado</option><option>En progreso</option><option>Completado</option><option>Cancelado</option></select></label></div><label><span className="mb-1 block text-xs font-bold text-slate-600">Procedimiento / diagnóstico</span><input required value={form.diagnosis} onChange={(e) => update('diagnosis', e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /></label><label><span className="mb-1 block text-xs font-bold text-slate-600">Plan de atención</span><textarea required rows={3} value={form.treatment_plan} onChange={(e) => update('treatment_plan', e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /></label><label><span className="mb-1 block text-xs font-bold text-slate-600">Colega / especialista</span><select value={form.colleague_id} onChange={(e) => update('colleague_id', e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"><option value="">Sin asignar</option>{colleagues.map((colleague) => <option key={colleague.id} value={colleague.id}>{colleague.full_name} · {colleague.specialty}</option>)}</select></label><div className="grid gap-4 sm:grid-cols-2"><label><span className="mb-1 block text-xs font-bold text-slate-600">Sesión actual</span><input required type="number" min="1" value={form.session_number} onChange={(e) => update('session_number', e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /></label><label><span className="mb-1 block text-xs font-bold text-slate-600">Total de sesiones</span><input required type="number" min="1" value={form.total_sessions} onChange={(e) => update('total_sessions', e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /></label></div><label><span className="mb-1 block text-xs font-bold text-slate-600">Notas</span><textarea rows={2} value={form.notes} onChange={(e) => update('notes', e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /></label><div className="flex justify-end gap-3"><button type="button" onClick={close} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600">Cancelar</button><button type="submit" disabled={isSaving} className="rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60">{isSaving ? 'Guardando...' : 'Guardar procedimiento'}</button></div></form></div></div>}</div>;
}
