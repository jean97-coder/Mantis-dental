import { useEffect, useState, type FormEvent } from 'react';
import { Mail, Pencil, Phone, Plus, ShieldCheck, Stethoscope, Trash2, UserCheck, X } from 'lucide-react';

interface Colleague {
  id: number;
  full_name: string;
  specialty: string;
  phone: string;
  email: string;
  professional_license: string;
}

type ColleagueForm = Omit<Colleague, 'id'>;
const API = 'http://localhost:4001/api/colleagues';
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
    if (!window.confirm(`¿Eliminar al profesional ${colleague.full_name}?`)) return;
    try {
      const response = await fetch(`${API}/${colleague.id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('No se pudo eliminar el colega');
      setColleagues((current) => current.filter((item) => item.id !== colleague.id));
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Error al eliminar el colega');
    }
  }

  return (
    <section className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-teal-600">
            <Stethoscope className="h-4.5 w-4.5" />
            <span className="text-xs font-extrabold uppercase tracking-widest text-teal-700">Equipo Médico & Especialistas</span>
          </div>
          <h1 className="mt-1 text-2xl font-black text-slate-900 tracking-tight">Colegas y Especialistas</h1>
          <p className="mt-0.5 text-xs text-slate-500 font-medium">Directorio de odontólogos, especialistas y personal médico de la clínica.</p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-teal-600/20 hover:bg-teal-700 transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Nuevo Especialista</span>
        </button>
      </div>

      {error && (
        <p className="rounded-2xl border border-rose-200 bg-rose-50/90 px-4 py-3 text-xs font-semibold text-rose-700">
          {error}
        </p>
      )}

      {isLoading ? (
        <p className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-xs font-medium text-slate-400">
          Cargando directorio médico...
        </p>
      ) : colleagues.length === 0 ? (
        <div className="py-14 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50">
          <UserCheck className="h-10 w-10 text-slate-300 mx-auto mb-2" />
          <p className="text-xs font-bold text-slate-600">No hay especialistas registrados en el equipo.</p>
          <button
            type="button"
            onClick={openCreate}
            className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-teal-700"
          >
            <Plus className="h-3.5 w-3.5" /> Registrar colega
          </button>
        </div>
      ) : (
        <div className="grid gap-4.5 md:grid-cols-2 xl:grid-cols-3">
          {colleagues.map((colleague) => {
            const initials = colleague.full_name
              .split(' ')
              .slice(0, 2)
              .map((w) => w[0])
              .join('')
              .toUpperCase();

            return (
              <article
                key={colleague.id}
                className="group rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:border-teal-300 hover:shadow-md flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 font-black text-sm border border-teal-100 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                        {initials || <Stethoscope className="h-5 w-5" />}
                      </div>
                      <div>
                        <h2 className="font-bold text-slate-900 text-sm leading-tight">{colleague.full_name}</h2>
                        <span className="inline-block mt-1 px-2.5 py-0.5 rounded-md bg-teal-50 text-teal-800 text-[11px] font-bold border border-teal-100">
                          {colleague.specialty || 'Odontología General'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(colleague)}
                        aria-label="Editar profesional"
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-teal-600 transition-colors"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void removeColleague(colleague)}
                        aria-label="Eliminar profesional"
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 border-t border-slate-100 pt-3.5 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                      <span>Licencia: <strong className="text-slate-800 font-semibold">{colleague.professional_license}</strong></span>
                    </div>
                    {colleague.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span>{colleague.phone}</span>
                      </div>
                    )}
                    {colleague.email && (
                      <div className="flex items-center gap-2 text-slate-500">
                        <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{colleague.email}</span>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Modal Nuevo / Editar Colega */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4" role="dialog">
          <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl border border-slate-100 animate-fade-in-up">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4.5 bg-slate-50/50">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  {editingId ? 'Editar Especialista' : 'Registrar Nuevo Especialista'}
                </h3>
                <p className="text-xs text-slate-500 font-medium">Completa las credenciales y datos de contacto.</p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-3.5">
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-slate-700">Nombre completo con título *</span>
                <input
                  required
                  placeholder="Ej. Dr. Andrés Morales"
                  value={form.full_name}
                  onChange={(e) => updateForm('full_name', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs outline-none focus:border-teal-500 focus:ring-3 focus:ring-teal-500/10"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-bold text-slate-700">Especialidad odontológica *</span>
                <input
                  required
                  list="specialties-list"
                  placeholder="Ej. Ortodoncia / Endodoncia / Implantología"
                  value={form.specialty}
                  onChange={(e) => updateForm('specialty', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs outline-none focus:border-teal-500 focus:ring-3 focus:ring-teal-500/10"
                />
                <datalist id="specialties-list">
                  <option value="Ortodoncista" />
                  <option value="Endodoncista" />
                  <option value="Periodoncista" />
                  <option value="Cirujano Maxilofacial" />
                  <option value="Odontopediatra" />
                  <option value="Rehabilitador Oral" />
                </datalist>
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <label>
                  <span className="mb-1 block text-xs font-bold text-slate-700">Teléfono / WhatsApp</span>
                  <input
                    type="tel"
                    placeholder="Ej. +593 98 765 4321"
                    value={form.phone}
                    onChange={(e) => updateForm('phone', e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs outline-none focus:border-teal-500 focus:ring-3 focus:ring-teal-500/10"
                  />
                </label>

                <label>
                  <span className="mb-1 block text-xs font-bold text-slate-700">Correo institucional</span>
                  <input
                    type="email"
                    placeholder="doctor@mantisdental.com"
                    value={form.email}
                    onChange={(e) => updateForm('email', e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs outline-none focus:border-teal-500 focus:ring-3 focus:ring-teal-500/10"
                  />
                </label>
              </div>

              <label className="block">
                <span className="mb-1 block text-xs font-bold text-slate-700">Número de Registro Profesional / Licencia *</span>
                <input
                  required
                  placeholder="Ej. MSP-2024-OD-089"
                  value={form.professional_license}
                  onChange={(e) => updateForm('professional_license', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs outline-none focus:border-teal-500 focus:ring-3 focus:ring-teal-500/10"
                />
              </label>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-xl bg-teal-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-teal-600/20 hover:bg-teal-700 disabled:opacity-60"
                >
                  {isSaving ? 'Guardando...' : 'Guardar Especialista'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

