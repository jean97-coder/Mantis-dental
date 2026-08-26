import { useEffect, useState, type FormEvent } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';

export interface CatalogItem { id: number; name: string; description: string; price: number }
interface Props { onSelect: (item: CatalogItem) => void }
const API = 'http://localhost:4001/api/templates/treatment-packages';
const blank = { name: '', description: '', price: '' };

export default function TreatmentCatalogPanel({ onSelect }: Props) {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [form, setForm] = useState(blank);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState('');

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

  function reset() { setForm(blank); setEditingId(null); }
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
    if (!window.confirm(`¿Eliminar ${item.name}?`)) return;
    try { const response = await fetch(`${API}/${item.id}`, { method: 'DELETE' }); if (!response.ok) throw new Error('No se pudo eliminar el ítem'); setItems((current) => current.filter((entry) => entry.id !== item.id)); }
    catch (deleteError) { console.error('Error eliminando ítem del catálogo', deleteError); setError(deleteError instanceof Error ? deleteError.message : 'Error al eliminar ítem'); }
  }

  return <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-black text-slate-900">Catálogo rápido</h3><p className="mt-1 text-xs text-slate-500">Haz clic en un tratamiento para añadirlo al desglose.</p></div><button type="button" onClick={reset} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white"><Plus className="h-4 w-4" />Nuevo ítem</button></div><form onSubmit={save} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_8rem_auto]"><input required value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Nombre" className="min-w-0 rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /><input required value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="Descripción" className="min-w-0 rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /><input required min="0" step="0.01" type="number" value={form.price} onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))} placeholder="Costo $" className="min-w-0 rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /><button type="submit" className="rounded-xl bg-slate-900 px-3 py-2.5 text-xs font-bold text-white">{editingId ? 'Actualizar' : 'Guardar'}</button></form>{error && <p className="mt-3 text-xs font-semibold text-rose-600">{error}</p>}<div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{items.map((item) => <div key={item.id} className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-3"><button type="button" onClick={() => onSelect(item)} className="block w-full min-w-0 text-left"><strong className="block truncate text-sm text-slate-800">{item.name}</strong><span className="mt-1 block truncate text-xs text-slate-500">{item.description}</span><span className="mt-2 block text-sm font-black text-emerald-700">${item.price.toFixed(2)}</span></button><div className="mt-2 flex gap-3 border-t border-slate-200 pt-2"><button type="button" onClick={() => { setEditingId(item.id); setForm({ name: item.name, description: item.description, price: String(item.price) }); }} className="inline-flex items-center gap-1 text-xs font-bold text-slate-500"><Pencil className="h-3 w-3" />Editar</button><button type="button" onClick={() => void remove(item)} className="inline-flex items-center gap-1 text-xs font-bold text-rose-600"><Trash2 className="h-3 w-3" />Eliminar</button></div></div>)}</div>{items.length === 0 && <p className="mt-4 text-xs text-slate-500">No hay tratamientos personalizados guardados.</p>}</section>;
}
