import { useEffect, useState, type FormEvent } from 'react';
import { Pencil, Plus, Stethoscope, Trash2, X } from 'lucide-react';

export interface CatalogItem { id: number; name: string; description: string; price: number }
interface Props { onSelect: (item: CatalogItem) => void }
const API = 'http://localhost:4001/api/templates/treatment-packages';
const blank = { name: '', description: '', price: '' };

export default function TreatmentCatalogPanel({ onSelect }: Props) {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [form, setForm] = useState(blank);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [isFormVisible, setIsFormVisible] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch(API);
        if (!response.ok) throw new Error('No se pudo cargar el catálogo');
        const data: unknown = await response.json();
        setItems(Array.isArray(data) ? data.map((value) => {
          const row = value && typeof value === 'object' ? value as { id?: number; name?: string; description?: string; items?: Array<{ unit_price?: number }> } : {};
          return { id: Number(row.id) || 0, name: row.name || 'Tratamiento', description: row.description || '', price: Number(row.items?.[0]?.unit_price) || 0 };
        }) : []);
      } catch (loadError) { setError(loadError instanceof Error ? loadError.message : 'Error al cargar catálogo'); }
    }
    void load();
  }, []);

  function reset() { setForm(blank); setEditingId(null); setIsFormVisible(false); }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError('');
    const price = Number(form.price);
    if (!form.name.trim() || !form.description.trim() || !Number.isFinite(price) || price < 0) { setError('Completa nombre, descripción y costo válido'); return; }
    try {
      const response = await fetch(editingId ? `${API}/${editingId}` : API, { method: editingId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: form.name.trim(), description: form.description.trim(), items: [{ description: form.name.trim(), quantity: 1, unit_price: price }] }) });
      const data = await response.json() as { id: number; name: string; description: string; items?: Array<{ unit_price?: number }> } | { error?: string };
      if (!response.ok) throw new Error('error' in data && data.error ? data.error : 'No se pudo guardar el ítem');
      const saved = data as { id: number; name: string; description: string; items?: Array<{ unit_price?: number }> };
      const item = { id: Number(saved.id), name: saved.name, description: saved.description, price: Number(saved.items?.[0]?.unit_price) || price };
      setItems((current) => editingId ? current.map((entry) => entry.id === editingId ? item : entry) : [item, ...current]); reset();
    } catch (saveError) { console.error('Error guardando ítem del catálogo', saveError); setError(saveError instanceof Error ? saveError.message : 'Error al guardar ítem'); }
  }
  async function remove(item: CatalogItem) {
    if (!window.confirm(`¿Eliminar ${item.name} del catálogo?`)) return;
    try { const response = await fetch(`${API}/${item.id}`, { method: 'DELETE' }); if (!response.ok) throw new Error('No se pudo eliminar el ítem'); setItems((current) => current.filter((entry) => entry.id !== item.id)); }
    catch (deleteError) { console.error('Error eliminando ítem del catálogo', deleteError); setError(deleteError instanceof Error ? deleteError.message : 'Error al eliminar ítem'); }
  }

  return (
    <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <Stethoscope className="h-4 w-4 text-teal-600" />
            Catálogo de Tratamientos Predefinidos
          </h2>
          <p className="mt-0.5 text-xs text-slate-500 font-medium">Haz clic en cualquier paquete para cotizarlo directamente al paciente.</p>
        </div>

        <button
          type="button"
          onClick={() => { reset(); setIsFormVisible(!isFormVisible); }}
          className="inline-flex items-center gap-1.5 rounded-xl border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-bold text-teal-700 hover:bg-teal-100 transition-colors cursor-pointer"
        >
          {isFormVisible ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          <span>{isFormVisible ? 'Cerrar formulario' : 'Nuevo tratamiento'}</span>
        </button>
      </div>

      {isFormVisible && (
        <form onSubmit={save} className="rounded-2xl border border-teal-200/80 bg-teal-50/40 p-4 space-y-3 animate-fade-in-up">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-teal-900">
              {editingId ? 'Editar tratamiento del catálogo' : 'Agregar nuevo tratamiento al catálogo'}
            </span>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_8rem_auto]">
            <input
              required
              value={form.name}
              onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))}
              placeholder="Nombre del tratamiento"
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs outline-none focus:border-teal-500"
            />
            <input
              required
              value={form.description}
              onChange={(e) => setForm((c) => ({ ...c, description: e.target.value }))}
              placeholder="Descripción / Piezas incluidas"
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs outline-none focus:border-teal-500"
            />
            <input
              required
              min="0"
              step="0.01"
              type="number"
              value={form.price}
              onChange={(e) => setForm((c) => ({ ...c, price: e.target.value }))}
              placeholder="Precio ($)"
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs outline-none focus:border-teal-500"
            />
            <button
              type="submit"
              className="rounded-xl bg-teal-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-teal-700 transition-colors"
            >
              {editingId ? 'Actualizar' : 'Guardar'}
            </button>
          </div>
          {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}
        </form>
      )}

      {/* Grid de Tratamientos */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs hover:border-teal-300 hover:shadow-xs transition-all flex flex-col justify-between"
          >
            <button
              type="button"
              onClick={() => onSelect(item)}
              className="block w-full text-left cursor-pointer"
            >
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-bold text-xs text-slate-900 group-hover:text-teal-700 transition-colors line-clamp-1">
                  {item.name}
                </h4>
                <span className="shrink-0 text-xs font-black text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md">
                  ${item.price.toFixed(2)}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500 font-medium line-clamp-2 leading-relaxed">
                {item.description}
              </p>
            </button>

            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5">
              <span className="text-[10px] font-semibold text-slate-400">Clic para cotizar</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingId(item.id);
                    setForm({ name: item.name, description: item.description, price: String(item.price) });
                    setIsFormVisible(true);
                  }}
                  className="p-1 text-slate-400 hover:text-teal-600 transition-colors"
                  title="Editar tratamiento"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    void remove(item);
                  }}
                  className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                  title="Eliminar tratamiento"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {items.length === 0 && (
        <p className="py-6 text-center text-xs font-medium text-slate-400">
          No hay paquetes ni tratamientos guardados en el catálogo.
        </p>
      )}
    </section>
  );
}

