import { useEffect, useState, type FormEvent } from 'react';
import { Mail, Pencil, Phone, Plus, Stethoscope, Trash2, X } from 'lucide-react';

interface Colleague {
  id: number;
  full_name: string;
  specialty: string;
  phone: string;
  email: string;
  professional_license: string;
}

type ColleagueForm = Omit<Colleague, 'id'>;
const API = 'http://localhost:4000/api/colleagues';
const emptyForm: ColleagueForm = { full_name: '', specialty: '', phone: '', email: '', professional_license: '' };

export default function ColleaguesModule() {
  const [colleagues, setColleagues] = useState<Colleague[]>([]);
  const [form, setForm] = useState<ColleagueForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadColleagues() {
      try {
        const response = await fetch(API);
        if (!response.ok) throw new Error('No se pudieron cargar los colegas');
        setColleagues(await response.json() as Colleague[]);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Error al cargar colegas');
      } finally { setIsLoading(false); }
    }
    void loadColleagues();
  }, []);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setIsModalOpen(true);
  }

  function openEdit(colleague: Colleague) {
    setEditingId(colleague.id);
    setForm({ full_name: colleague.full_name, specialty: colleague.specialty, phone: colleague.phone, email: colleague.email, professional_license: colleague.professional_license });
    setIsModalOpen(true);
  }

  function closeModal() {
    if (!isSaving) setIsModalOpen(false);
  }

  function updateForm(field: keyof ColleagueForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError('');
    try {
      const response = await fetch(editingId ? `${API}/${editingId}` : API, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await response.json() as Colleague | { error?: string };
      if (!response.ok) throw new Error('error' in data && data.error ? data.error : 'No se pudo guardar el colega');
      const saved = data as Colleague;
      setColleagues((current) => editingId ? current.map((item) => item.id === editingId ? saved : item) : [saved, ...current]);
      setIsModalOpen(false);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Error al guardar el colega');
    } finally { setIsSaving(false); }
  }

  async function removeColleague(colleague: Colleague) {
    if (!window.confirm(`¿Eliminar a ${colleague.full_name}?`)) return;
    try {
      const response = await fetch(`${API}/${colleague.id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('No se pudo eliminar el colega');
      setColleagues((current) => current.filter((item) => item.id !== colleague.id));
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Error al eliminar el colega');
    }
  }

  return (
    <section className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div><div className="flex items-center gap-2 text-teal-600"><Stethoscope className="h-5 w-5" /><span className="text-xs font-bold uppercase tracking-widest">Red clínica</span></div><h2 className="mt-1 text-2xl font-black text-slate-900">Colegas y Especialistas</h2><p className="mt-1 text-sm text-slate-500">Administra los profesionales asociados a la clínica.</p></div>
        <button type="button" onClick={openCreate} className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-bold text-white"><Plus className="h-4 w-4" />Nuevo colega</button>
      </div>
      {error && <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
      {isLoading ? <p className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">Cargando colegas...</p> : colleagues.length === 0 ? <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">No hay colegas registrados.</p> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{colleagues.map((colleague) => <article key={colleague.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div><h3 className="font-black text-slate-900">{colleague.full_name}</h3><p className="mt-1 text-sm font-semibold text-teal-700">{colleague.specialty}</p></div><div className="flex gap-1"><button type="button" onClick={() => openEdit(colleague)} aria-label="Editar colega" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><Pencil className="h-4 w-4" /></button><button type="button" onClick={() => void removeColleague(colleague)} aria-label="Eliminar colega" className="rounded-lg p-2 text-rose-500 hover:bg-rose-50"><Trash2 className="h-4 w-4" /></button></div></div><div className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-xs text-slate-500"><p>Licencia: <strong className="text-slate-700">{colleague.professional_license}</strong></p><p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" />{colleague.phone || 'Sin teléfono'}</p><p className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" />{colleague.email || 'Sin correo'}</p></div></article>)}</div>}
      {isModalOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" role="dialog" aria-modal="true"><div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl"><div className="flex items-center justify-between border-b border-slate-100 px-6 py-4"><h3 className="text-lg font-black text-slate-900">{editingId ? 'Editar colega' : 'Nuevo colega'}</h3><button type="button" onClick={closeModal} aria-label="Cerrar modal" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button></div><form onSubmit={handleSubmit} className="space-y-4 p-6"><label className="block"><span className="mb-1.5 block text-xs font-bold text-slate-600">Nombre completo</span><input required value={form.full_name} onChange={(event) => updateForm('full_name', event.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /></label><label className="block"><span className="mb-1.5 block text-xs font-bold text-slate-600">Especialidad</span><input required list="specialties" value={form.specialty} onChange={(event) => updateForm('specialty', event.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /><datalist id="specialties"><option value="Ortodoncista" /><option value="Endodoncista" /><option value="Periodoncista" /><option value="Cirujano Maxilofacial" /></datalist></label><div className="grid gap-4 sm:grid-cols-2"><label><span className="mb-1.5 block text-xs font-bold text-slate-600">Teléfono</span><input value={form.phone} onChange={(event) => updateForm('phone', event.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /></label><label><span className="mb-1.5 block text-xs font-bold text-slate-600">Correo electrónico</span><input type="email" value={form.email} onChange={(event) => updateForm('email', event.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /></label></div><label className="block"><span className="mb-1.5 block text-xs font-bold text-slate-600">Registro profesional / Licencia</span><input required value={form.professional_license} onChange={(event) => updateForm('professional_license', event.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /></label><div className="flex justify-end gap-3"><button type="button" onClick={closeModal} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600">Cancelar</button><button type="submit" disabled={isSaving} className="rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60">{isSaving ? 'Guardando...' : 'Guardar colega'}</button></div></form></div></div>}
    </section>
  );
}
