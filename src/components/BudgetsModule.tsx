import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { FileText, Plus, Trash2, User, X } from 'lucide-react';
import TreatmentCatalogPanel, { type CatalogItem } from './TreatmentCatalogPanel';

interface Patient { id: number; name: string; dni: string }
interface FormItem { catalog_id: string; name: string; description: string; quantity: string; unit_price: string; line_discount: string }
interface Budget { id: number; patient_name: string; notes: string | null; total: number; created_at: string; items: Array<{ name?: string; description: string; quantity: number; unit_price: number; line_discount?: number }> }
type DiscountType = 'none' | 'fixed' | 'percent';

const BUDGETS_API = 'http://localhost:4001/api/budgets';
const PATIENTS_API = 'http://localhost:4001/api/patients';
const CATALOG_API = 'http://localhost:4001/api/templates/treatment-packages';
const emptyItem: FormItem = { catalog_id: '', name: '', description: '', quantity: '1', unit_price: '0', line_discount: '0' };

const numberValue = (value: unknown) => Number.isFinite(Number(value)) ? Number(value) : 0;
function lineBase(item: FormItem) { return Math.max(numberValue(item.quantity), 0) * Math.max(numberValue(item.unit_price), 0); }
function lineDiscount(item: FormItem) { return Math.min(lineBase(item), Math.max(numberValue(item.line_discount), 0)); }
function lineTotal(item: FormItem) { return lineBase(item) - lineDiscount(item); }
function normalizeBudget(value: unknown): Budget {
  const raw = value && typeof value === 'object' ? value as Partial<Budget> : {};
  return { id: numberValue(raw.id), patient_name: raw.patient_name || 'Paciente', notes: raw.notes || null, total: numberValue(raw.total), created_at: raw.created_at || new Date().toISOString(), items: Array.isArray(raw.items) ? raw.items.map((item) => ({ name: item.name || item.description, description: item.description || '', quantity: numberValue(item.quantity), unit_price: numberValue(item.unit_price), line_discount: numberValue(item.line_discount) })) : [] };
}

export function BudgetsModule() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [form, setForm] = useState({ patient_id: '', notes: '', items: [{ ...emptyItem }] });
  const [discountType, setDiscountType] = useState<DiscountType>('none');
  const [discountValue, setDiscountValue] = useState('0');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    async function load() {
      setLoading(true); setError('');
      try {
        const [budgetsResponse, patientsResponse, catalogResponse] = await Promise.all([fetch(BUDGETS_API), fetch(PATIENTS_API), fetch(CATALOG_API)]);
        if (!budgetsResponse.ok || !patientsResponse.ok || !catalogResponse.ok) throw new Error('No se pudieron cargar los datos del presupuesto');
        const budgetsData: unknown = await budgetsResponse.json();
        const patientsData: unknown = await patientsResponse.json();
        const catalogData: unknown = await catalogResponse.json();
        setBudgets(Array.isArray(budgetsData) ? budgetsData.map(normalizeBudget) : []);
        setPatients(Array.isArray(patientsData) ? patientsData as Patient[] : []);
        setCatalog(Array.isArray(catalogData) ? catalogData.map((value) => { const row = value as { id?: number; name?: string; description?: string; items?: Array<{ unit_price?: number }> }; return { id: numberValue(row.id), name: row.name || 'Tratamiento', description: row.description || '', price: numberValue(row.items?.[0]?.unit_price) }; }) : []);
      } catch (loadError) { setBudgets([]); setPatients([]); setCatalog([]); setError(loadError instanceof Error ? loadError.message : 'Error al cargar presupuestos'); }
      finally { setLoading(false); }
    }
    void load();
  }, [retry]);

  const subtotal = useMemo(() => form.items.reduce((sum, item) => sum + lineBase(item), 0), [form.items]);
  const rowDiscount = useMemo(() => form.items.reduce((sum, item) => sum + lineDiscount(item), 0), [form.items]);
  const remaining = Math.max(subtotal - rowDiscount, 0);
  const globalDiscount = discountType === 'fixed' ? Math.min(remaining, numberValue(discountValue)) : discountType === 'percent' ? remaining * Math.min(100, Math.max(0, numberValue(discountValue))) / 100 : 0;
  const totalDiscount = rowDiscount + globalDiscount;
  const total = Math.max(subtotal - rowDiscount - globalDiscount, 0);

  function updateItem(index: number, field: keyof FormItem, value: string) { setForm((current) => ({ ...current, items: current.items.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item) })); }
  function selectCatalogItem(index: number, catalogId: string) { const selected = catalog.find((item) => String(item.id) === catalogId); if (!selected) { updateItem(index, 'catalog_id', ''); return; } setForm((current) => ({ ...current, items: current.items.map((item, itemIndex) => itemIndex === index ? { ...item, catalog_id: catalogId, name: selected.name, description: selected.description, unit_price: String(selected.price) } : item) })); }
  function addLine() { setForm((current) => ({ ...current, items: [...current.items, { ...emptyItem }] })); }
  function removeLine(index: number) { setForm((current) => ({ ...current, items: current.items.length > 1 ? current.items.filter((_, itemIndex) => itemIndex !== index) : [{ ...emptyItem }] })); }
  function addCatalogLine(item: CatalogItem) { setForm((current) => ({ ...current, items: [...current.items, { catalog_id: String(item.id), name: item.name, description: item.description, quantity: '1', unit_price: String(item.price), line_discount: '0' }] })); }
  function closeModal() { if (!saving) { setModalOpen(false); setForm({ patient_id: '', notes: '', items: [{ ...emptyItem }] }); setDiscountType('none'); setDiscountValue('0'); } }

  async function saveBudget(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError(''); setSuccess('');
    try {
      const items = form.items.map((item) => ({ name: item.name, description: item.description, quantity: numberValue(item.quantity), unit_price: numberValue(item.unit_price), line_discount: lineDiscount(item) }));
      if (!form.patient_id || items.some((item) => !item.name || item.quantity <= 0)) throw new Error('Selecciona un tratamiento y completa la cantidad en cada línea');
      const response = await fetch(BUDGETS_API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ patient_id: numberValue(form.patient_id), notes: form.notes.trim(), status: 'Pendiente', discount_type: discountType, discount_value: Math.max(0, numberValue(discountValue)), items }) });
      const data: unknown = await response.json();
      if (!response.ok) throw new Error(data && typeof data === 'object' && 'error' in data && typeof data.error === 'string' ? data.error : 'No se pudo guardar el presupuesto');
      setBudgets((current) => [normalizeBudget(data), ...current]); closeModal(); setSuccess('Presupuesto guardado correctamente.');
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : 'Error al guardar el presupuesto'); }
    finally { setSaving(false); }
  }

  return <section className="mx-auto w-full max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8"><header className="flex flex-wrap items-end justify-between gap-4"><div><div className="flex items-center gap-2 text-emerald-600"><FileText className="h-5 w-5" /><span className="text-xs font-bold uppercase tracking-widest">Presupuestos</span></div><h2 className="mt-1 text-2xl font-black text-slate-900">Gestión de Presupuestos</h2></div><button type="button" onClick={() => setModalOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white"><Plus className="h-4 w-4" />Nuevo presupuesto</button></header>{error && <div className="flex flex-wrap justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"><span>{error}</span><button type="button" onClick={() => setRetry((value) => value + 1)} className="font-bold underline">Reintentar</button></div>}{success && <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{success}</p>}<TreatmentCatalogPanel onSelect={addCatalogLine} /><div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6"><h3 className="font-black text-slate-900">Presupuestos guardados</h3>{loading ? <p className="py-8 text-sm text-slate-500">Cargando...</p> : budgets.length === 0 ? <p className="py-8 text-sm text-slate-500">No hay presupuestos registrados.</p> : budgets.map((budget) => <article key={budget.id} className="mt-3 min-w-0 rounded-xl border border-slate-200 p-4"><div className="flex flex-wrap justify-between gap-2"><span className="flex min-w-0 items-center gap-2 font-bold text-slate-900"><User className="h-4 w-4 shrink-0 text-emerald-600" />{budget.patient_name}</span><strong>${budget.total.toFixed(2)}</strong></div><div className="mt-3 space-y-2">{budget.items.map((item, index) => <div key={index} className="flex flex-wrap justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600"><span>{item.name || item.description}</span><span>{item.quantity} × ${item.unit_price.toFixed(2)}</span></div>)}</div></article>)}</div>{modalOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4"><div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white shadow-2xl"><div className="flex items-center justify-between border-b border-slate-100 p-4 sm:p-6"><div><h3 className="text-lg font-black text-slate-900">Nuevo presupuesto</h3><p className="text-xs text-slate-500">Selecciona tratamientos del catálogo.</p></div><button type="button" onClick={closeModal} aria-label="Cerrar" className="rounded-lg p-2 text-slate-400"><X className="h-5 w-5" /></button></div><form onSubmit={saveBudget} className="space-y-5 p-4 sm:p-6"><label className="block"><span className="mb-1.5 block text-xs font-bold text-slate-600">Paciente</span><select required value={form.patient_id} onChange={(event) => setForm((current) => ({ ...current, patient_id: event.target.value }))} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"><option value="">Selecciona un paciente</option>{patients.map((patient) => <option key={patient.id} value={patient.id}>{patient.name} · {patient.dni}</option>)}</select></label><div className="space-y-3"><div className="hidden rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-500 lg:grid lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_6rem_8rem_8rem_7rem_auto] lg:gap-3"><span>Tratamiento del catálogo</span><span>Descripción</span><span>Cant.</span><span>Precio unitario</span><span>Desc. $</span><span>Subtotal</span><span /></div>{form.items.map((item, index) => <div key={index} className="grid min-w-0 gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_6rem_8rem_8rem_7rem_auto] lg:items-center"><select required value={item.catalog_id} onChange={(event) => selectCatalogItem(index, event.target.value)} className="min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm"><option value="">Selecciona un tratamiento</option>{catalog.map((catalogItem) => <option key={catalogItem.id} value={catalogItem.id}>{catalogItem.name} · ${catalogItem.price.toFixed(2)}</option>)}</select><div className="min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600"><span className="block truncate">{item.description || 'Descripción automática'}</span></div><input required min="1" type="number" value={item.quantity} onChange={(event) => updateItem(index, 'quantity', event.target.value)} className="min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm" /><div className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-2.5 text-sm font-semibold text-slate-600">${numberValue(item.unit_price).toFixed(2)}</div><input min="0" step="0.01" type="number" value={item.line_discount} onChange={(event) => updateItem(index, 'line_discount', event.target.value)} placeholder="Descuento $" className="min-w-0 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm" /><div className="rounded-lg bg-emerald-50 px-3 py-2.5 text-sm font-black text-emerald-700">${lineTotal(item).toFixed(2)}</div><button type="button" onClick={() => removeLine(index)} aria-label="Eliminar línea" className="rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-rose-600"><Trash2 className="h-4 w-4" /></button></div>)}</div><button type="button" onClick={addLine} className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700"><Plus className="h-4 w-4" />Añadir línea</button><label className="block"><span className="mb-1.5 block text-xs font-bold text-slate-600">Notas</span><textarea rows={2} value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /></label><div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4"><div className="grid gap-3 sm:grid-cols-2"><select value={discountType} onChange={(event) => setDiscountType(event.target.value as DiscountType)} className="rounded-xl border border-emerald-200 bg-white px-3 py-2.5 text-sm"><option value="none">Sin descuento global</option><option value="fixed">Descuento fijo ($)</option><option value="percent">Descuento porcentual</option></select><input min="0" step="0.01" type="number" value={discountValue} onChange={(event) => setDiscountValue(event.target.value)} placeholder="Valor" className="min-w-0 rounded-xl border border-emerald-200 bg-white px-3 py-2.5 text-sm" /></div><div className="mt-3 flex flex-wrap justify-end gap-4 text-sm text-emerald-800"><span>Subtotal: <strong>${subtotal.toFixed(2)}</strong></span><span>Descuento: <strong>-${totalDiscount.toFixed(2)}</strong></span><span className="font-black">Total: <strong>${total.toFixed(2)}</strong></span></div></div><div className="flex flex-wrap justify-end gap-3"><button type="button" onClick={closeModal} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600">Cancelar</button><button type="submit" disabled={saving} className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60">{saving ? 'Guardando...' : 'Guardar presupuesto'}</button></div></form></div></div>}</section>;
}

export default BudgetsModule;
