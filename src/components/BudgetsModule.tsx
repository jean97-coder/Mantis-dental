import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Calendar, FileText, Plus, Receipt, Trash2, User, X } from 'lucide-react';
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
  function addCatalogLine(item: CatalogItem) { setForm((current) => ({ ...current, items: [...current.items, { catalog_id: String(item.id), name: item.name, description: item.description, quantity: '1', unit_price: String(item.price), line_discount: '0' }] })); setModalOpen(true); }
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

  return (
    <section className="mx-auto w-full max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-teal-600">
            <Receipt className="h-4.5 w-4.5" />
            <span className="text-xs font-extrabold uppercase tracking-widest text-teal-700">Cotizaciones & Procedimientos</span>
          </div>
          <h1 className="mt-1 text-2xl font-black text-slate-900 tracking-tight">Presupuestos Clínicos</h1>
          <p className="mt-0.5 text-xs text-slate-500 font-medium">Planes de tratamiento cotizados, descuentos y paquetes predefinidos.</p>
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-teal-600/20 hover:bg-teal-700 transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Nuevo Presupuesto</span>
        </button>
      </div>

      {error && (
        <div className="flex flex-wrap justify-between items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50/90 px-4 py-3 text-xs font-semibold text-rose-700">
          <span>{error}</span>
          <button type="button" onClick={() => setRetry((v) => v + 1)} className="font-bold underline">Reintentar</button>
        </div>
      )}

      {success && (
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50/90 px-4 py-3 text-xs font-bold text-emerald-800">
          {success}
        </p>
      )}

      {/* Catálogo Rápido */}
      <TreatmentCatalogPanel onSelect={addCatalogLine} />

      {/* Listado de Presupuestos Guardados */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <FileText className="h-4 w-4 text-teal-600" />
            Presupuestos Emitidos
          </h2>
          <span className="text-xs font-bold text-slate-500">{budgets.length} registros</span>
        </div>

        {loading ? (
          <p className="py-12 text-center text-xs font-medium text-slate-400">Cargando presupuestos...</p>
        ) : budgets.length === 0 ? (
          <div className="py-12 text-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
            <FileText className="h-8 w-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-600">No hay presupuestos registrados.</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Crea uno nuevo usando el botón superior o haciendo clic en el catálogo.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {budgets.map((budget) => (
              <article key={budget.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:border-teal-300 hover:shadow-md space-y-3">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-900 truncate">
                    <User className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                    {budget.patient_name}
                  </span>
                  <span className="text-base font-black text-teal-700">${budget.total.toFixed(2)}</span>
                </div>

                <div className="space-y-1.5 pt-1">
                  {budget.items.slice(0, 3).map((item, index) => (
                    <div key={index} className="flex justify-between items-center text-[11px] bg-slate-50 p-2 rounded-lg text-slate-600">
                      <span className="truncate pr-2 font-medium">{item.name || item.description}</span>
                      <span className="font-bold shrink-0">{item.quantity} × ${item.unit_price.toFixed(2)}</span>
                    </div>
                  ))}
                  {budget.items.length > 3 && (
                    <span className="text-[10px] font-bold text-teal-600 block text-right">
                      +{budget.items.length - 3} procedimientos más
                    </span>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(budget.created_at).toLocaleDateString('es-ES')}
                  </span>
                  <span className="font-semibold text-slate-600">PRE-{budget.id}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* Modal Crear Presupuesto */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4" role="dialog">
          <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-3xl bg-white shadow-2xl border border-slate-100 animate-fade-in-up">
            <div className="flex items-center justify-between border-b border-slate-100 p-6 bg-slate-50/50">
              <div>
                <h3 className="text-base font-black text-slate-900">Nuevo Presupuesto Clínico</h3>
                <p className="text-xs text-slate-500 font-medium">Cotiza tratamientos detallados e individuales con cálculo de descuentos.</p>
              </div>
              <button type="button" onClick={closeModal} className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={saveBudget} className="space-y-5 p-6">
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-slate-700">Paciente *</span>
                <select
                  required
                  value={form.patient_id}
                  onChange={(e) => setForm((c) => ({ ...c, patient_id: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs outline-none focus:border-teal-500 focus:ring-3 focus:ring-teal-500/10"
                >
                  <option value="">Selecciona un paciente del directorio</option>
                  {patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>{patient.name} · DNI {patient.dni}</option>
                  ))}
                </select>
              </label>

              {/* Grid de Tratamientos */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-700 block">Desglose de Procedimientos</span>

                <div className="hidden rounded-xl bg-slate-100/80 px-4 py-2.5 text-[11px] font-extrabold uppercase text-slate-500 lg:grid lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_5.5rem_7.5rem_7rem_6.5rem_auto] lg:gap-3">
                  <span>Tratamiento</span>
                  <span>Descripción</span>
                  <span>Cant.</span>
                  <span>Precio Unit.</span>
                  <span>Desc. ($)</span>
                  <span>Subtotal</span>
                  <span />
                </div>

                {form.items.map((item, index) => (
                  <div key={index} className="grid min-w-0 gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_5.5rem_7.5rem_7rem_6.5rem_auto] lg:items-center">
                    <select
                      required
                      value={item.catalog_id}
                      onChange={(e) => selectCatalogItem(index, e.target.value)}
                      className="min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-teal-500"
                    >
                      <option value="">Selecciona tratamiento...</option>
                      {catalog.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name} · ${cat.price.toFixed(2)}</option>
                      ))}
                    </select>

                    <div className="min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 truncate">
                      {item.description || 'Descripción automática'}
                    </div>

                    <input
                      required
                      min="1"
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                      className="min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-center outline-none focus:border-teal-500"
                    />

                    <div className="rounded-xl border border-slate-200 bg-slate-100/90 px-3 py-2 text-xs font-bold text-slate-700">
                      ${numberValue(item.unit_price).toFixed(2)}
                    </div>

                    <input
                      min="0"
                      step="0.01"
                      type="number"
                      placeholder="0.00"
                      value={item.line_discount}
                      onChange={(e) => updateItem(index, 'line_discount', e.target.value)}
                      className="min-w-0 rounded-xl border border-amber-200 bg-amber-50/60 px-3 py-2 text-xs outline-none focus:border-amber-400"
                    />

                    <div className="rounded-xl bg-teal-50 px-3 py-2 text-xs font-black text-teal-800">
                      ${lineTotal(item).toFixed(2)}
                    </div>

                    <button
                      type="button"
                      onClick={() => removeLine(index)}
                      aria-label="Eliminar línea"
                      className="rounded-xl border border-rose-200 bg-rose-50 p-2 text-rose-600 hover:bg-rose-100 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={addLine}
                className="inline-flex items-center gap-1.5 rounded-xl border border-teal-200 bg-teal-50 px-3.5 py-2 text-xs font-bold text-teal-700 hover:bg-teal-100 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Añadir línea</span>
              </button>

              <label className="block">
                <span className="mb-1 block text-xs font-bold text-slate-700">Notas / Indicaciones del presupuesto</span>
                <textarea
                  rows={2}
                  placeholder="Observaciones de pago, cuotas o validez de la cotización..."
                  value={form.notes}
                  onChange={(e) => setForm((c) => ({ ...c, notes: e.target.value }))}
                  className="w-full resize-none rounded-xl border border-slate-200 px-3.5 py-2 text-xs outline-none focus:border-teal-500 focus:ring-3 focus:ring-teal-500/10"
                />
              </label>

              {/* Total & Descuentos */}
              <div className="rounded-2xl border border-teal-200/90 bg-teal-50/50 p-4.5 space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as DiscountType)}
                    className="rounded-xl border border-teal-200 bg-white px-3.5 py-2 text-xs font-medium outline-none focus:border-teal-500"
                  >
                    <option value="none">Sin descuento global</option>
                    <option value="fixed">Descuento fijo ($)</option>
                    <option value="percent">Descuento porcentual (%)</option>
                  </select>

                  <input
                    min="0"
                    step="0.01"
                    type="number"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    placeholder="Valor del descuento"
                    className="rounded-xl border border-teal-200 bg-white px-3.5 py-2 text-xs font-medium outline-none focus:border-teal-500"
                  />
                </div>

                <div className="flex flex-wrap justify-end gap-6 text-xs text-slate-700 pt-2 border-t border-teal-100">
                  <span>Subtotal: <strong className="font-bold text-slate-900">${subtotal.toFixed(2)}</strong></span>
                  <span>Descuentos: <strong className="font-bold text-amber-700">-${totalDiscount.toFixed(2)}</strong></span>
                  <span className="text-sm font-black text-teal-800">Total a Pagar: ${total.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-teal-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-teal-600/20 hover:bg-teal-700 disabled:opacity-60"
                >
                  {saving ? 'Guardando...' : 'Guardar Presupuesto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

export default BudgetsModule;

