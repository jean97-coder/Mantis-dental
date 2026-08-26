import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { AlertTriangle, CalendarClock, DollarSign, Package, Plus, Search, Truck, X } from 'lucide-react';

interface InventoryProduct {
  id: number;
  name: string;
  category: string;
  stock: number;
  min_stock: number;
  price: number;
  supplier: string;
  entry_date: string | null;
  expiration_date: string | null;
  created_at: string;
}

interface ProductForm {
  name: string;
  category: string;
  stock: string;
  min_stock: string;
  price: string;
  supplier: string;
  entry_date: string;
  expiration_date: string;
}

const API_URL = 'http://localhost:4001/api/inventory';

const emptyForm: ProductForm = {
  name: '',
  category: '',
  stock: '',
  min_stock: '',
  price: '',
  supplier: '',
  entry_date: '',
  expiration_date: '',
};

function getExpirationState(product: InventoryProduct) {
  if (!product.expiration_date) return { state: 'normal', label: 'Sin vencimiento', tone: 'slate' };

  const today = new Date();
  const expirationDate = new Date(`${product.expiration_date}T00:00:00`);
  const diffInDays = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffInDays < 0) return { state: 'expired', label: 'Caducado', tone: 'rose' };
  if (diffInDays <= 30) return { state: 'warning', label: `Vence en ${diffInDays}d`, tone: 'amber' };
  return { state: 'normal', label: 'Vigente', tone: 'emerald' };
}

export default function InventoryModule() {
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadInventory() {
      try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('No se pudo cargar el inventario');
        setProducts((await response.json()) as InventoryProduct[]);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Error al cargar el inventario');
      } finally {
        setIsLoading(false);
      }
    }

    void loadInventory();
  }, []);

  const filteredProducts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    if (!normalizedSearch) return products;

    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(normalizedSearch) ||
        product.category.toLowerCase().includes(normalizedSearch) ||
        product.supplier.toLowerCase().includes(normalizedSearch),
    );
  }, [products, searchTerm]);

  const lowStockCount = products.filter((product) => product.stock <= product.min_stock).length;

  function updateForm(field: keyof ProductForm, value: string) {
    setForm((currentForm) => ({ ...currentForm, [field]: value }));
  }

  function closeModal() {
    if (isSaving) return;
    setIsModalOpen(false);
    setForm(emptyForm);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError('');

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          category: form.category,
          stock: Number(form.stock),
          min_stock: Number(form.min_stock),
          price: Number(form.price),
          supplier: form.supplier,
          entry_date: form.entry_date || null,
          expiration_date: form.expiration_date || null,
        }),
      });
      const data = (await response.json()) as InventoryProduct | { error?: string };

      if (!response.ok) {
        throw new Error('error' in data && data.error ? data.error : 'No se pudo crear el producto');
      }

      setProducts((currentProducts) => [data as InventoryProduct, ...currentProducts]);
      closeModal();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Error al crear el producto');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-teal-600">
            <Package className="h-4.5 w-4.5" />
            <span className="text-xs font-extrabold uppercase tracking-widest text-teal-700">Farmacia & Materiales</span>
          </div>
          <h1 className="mt-1 text-2xl font-black text-slate-900 tracking-tight">Inventario de Suministros</h1>
          <p className="mt-0.5 text-xs text-slate-500 font-medium">Control de stock de materiales dentales, anestésicos, instrumental y caducidades.</p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-teal-600/20 hover:bg-teal-700 transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Nuevo Producto</span>
        </button>
      </div>

      {error && (
        <p className="rounded-xl border border-rose-200 bg-rose-50/90 px-4 py-3 text-xs font-semibold text-rose-700">
          {error}
        </p>
      )}

      {/* Tarjetas Resumen */}
      <div className="grid gap-4.5 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs flex items-center justify-between transition-all hover:border-teal-300">
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Total Artículos Registrados</span>
            <p className="mt-1.5 text-3xl font-black text-slate-900 tracking-tight">{products.length}</p>
            <p className="mt-1 text-xs text-teal-700 font-semibold">Materiales odontológicos disponibles</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 border border-teal-100">
            <Package className="h-6 w-6" />
          </div>
        </div>

        <div className={`rounded-2xl border p-5 shadow-xs flex items-center justify-between transition-all ${
          lowStockCount > 0
            ? 'border-amber-200 bg-amber-50/50'
            : 'border-emerald-200 bg-emerald-50/50'
        }`}>
          <div>
            <span className={`text-[11px] font-extrabold uppercase tracking-wider ${
              lowStockCount > 0 ? 'text-amber-700' : 'text-emerald-700'
            }`}>
              {lowStockCount > 0 ? 'Alertas de Stock Bajo' : 'Estado de Stock'}
            </span>
            <p className={`mt-1.5 text-3xl font-black tracking-tight ${
              lowStockCount > 0 ? 'text-amber-900' : 'text-emerald-900'
            }`}>
              {lowStockCount}
            </p>
            <p className={`mt-1 text-xs font-bold ${
              lowStockCount > 0 ? 'text-amber-700' : 'text-emerald-700'
            }`}>
              {lowStockCount > 0 ? 'Artículos que requieren reposición urgente' : 'Todos los insumos en nivel óptimo ✨'}
            </p>
          </div>
          <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
            lowStockCount > 0 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
          }`}>
            <AlertTriangle className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Tabla de Productos */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between bg-slate-50/40">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar insumo por nombre, categoría o proveedor..."
              className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-800 outline-none transition focus:border-teal-500 focus:ring-3 focus:ring-teal-500/10"
            />
          </div>
          <span className="text-xs font-bold text-slate-500">{filteredProducts.length} productos listados</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-xs">
            <thead className="bg-slate-50/80 text-[10px] uppercase tracking-wider text-slate-500 font-extrabold border-b border-slate-100">
              <tr>
                <th className="px-6 py-3.5">Insumo / Material</th>
                <th className="px-6 py-3.5">Categoría</th>
                <th className="px-6 py-3.5">Stock Actual</th>
                <th className="px-6 py-3.5">Costo Unit.</th>
                <th className="px-6 py-3.5">Proveedor</th>
                <th className="px-6 py-3.5">Fecha Caducidad</th>
                <th className="px-6 py-3.5 text-right">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400 font-semibold">Cargando inventario...</td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400 font-semibold">No se encontraron productos registrados.</td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const isLowStock = product.stock <= product.min_stock;
                  const expirationState = getExpirationState(product);
                  const expirationTone =
                    expirationState.tone === 'rose'
                      ? 'border-rose-200 bg-rose-50 text-rose-700'
                      : expirationState.tone === 'amber'
                        ? 'border-amber-200 bg-amber-50 text-amber-700'
                        : expirationState.tone === 'emerald'
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : 'border-slate-200 bg-slate-100 text-slate-600';

                  return (
                    <tr key={product.id} className="transition-colors hover:bg-teal-50/30">
                      <td className="px-6 py-4 font-bold text-slate-900">{product.name}</td>
                      <td className="px-6 py-4">
                        <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[11px]">
                          {product.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-sm ${isLowStock ? 'font-black text-rose-600' : 'font-bold text-slate-800'}`}>
                          {product.stock}
                        </span>
                        <span className="ml-1 text-[11px] text-slate-400 font-normal">/ mín. {product.min_stock}</span>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-800">
                        <span className="inline-flex items-center gap-0.5">
                          <DollarSign className="h-3.5 w-3.5 text-teal-600" />
                          {Number(product.price).toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        <span className="inline-flex items-center gap-1.5">
                          <Truck className="h-3.5 w-3.5 text-slate-400" />
                          {product.supplier}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {product.expiration_date ? (
                          <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${expirationTone}`}>
                            <CalendarClock className="h-3 w-3" />
                            {expirationState.label}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Sin caducidad</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {isLowStock ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-[10px] font-bold text-rose-700">
                            <AlertTriangle className="h-3 w-3" />
                            Stock bajo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                            Disponible
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nuevo Producto */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4" role="dialog">
          <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white shadow-2xl border border-slate-100 animate-fade-in-up">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4.5 bg-slate-50/50">
              <div>
                <h3 className="text-base font-black text-slate-900">Nuevo Producto / Insumo</h3>
                <p className="text-xs text-slate-500 font-medium">Registra existencias, costos y datos del proveedor.</p>
              </div>
              <button type="button" onClick={closeModal} className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-3.5">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="sm:col-span-2">
                  <span className="mb-1 block text-xs font-bold text-slate-700">Nombre del material / insumo *</span>
                  <input
                    required
                    placeholder="Ej. Resina Filtek Z350 XT"
                    value={form.name}
                    onChange={(e) => updateForm('name', e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs outline-none focus:border-teal-500 focus:ring-3 focus:ring-teal-500/10"
                  />
                </label>

                <label>
                  <span className="mb-1 block text-xs font-bold text-slate-700">Categoría *</span>
                  <input
                    required
                    placeholder="Ej. Restauración / Anestesia"
                    value={form.category}
                    onChange={(e) => updateForm('category', e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs outline-none focus:border-teal-500 focus:ring-3 focus:ring-teal-500/10"
                  />
                </label>

                <label>
                  <span className="mb-1 block text-xs font-bold text-slate-700">Proveedor *</span>
                  <input
                    required
                    placeholder="Ej. Dental Corp / 3M"
                    value={form.supplier}
                    onChange={(e) => updateForm('supplier', e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs outline-none focus:border-teal-500 focus:ring-3 focus:ring-teal-500/10"
                  />
                </label>

                <label>
                  <span className="mb-1 block text-xs font-bold text-slate-700">Stock Inicial *</span>
                  <input
                    required
                    min="0"
                    type="number"
                    value={form.stock}
                    onChange={(e) => updateForm('stock', e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs outline-none focus:border-teal-500 focus:ring-3 focus:ring-teal-500/10"
                  />
                </label>

                <label>
                  <span className="mb-1 block text-xs font-bold text-slate-700">Stock Mínimo *</span>
                  <input
                    required
                    min="0"
                    type="number"
                    value={form.min_stock}
                    onChange={(e) => updateForm('min_stock', e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs outline-none focus:border-teal-500 focus:ring-3 focus:ring-teal-500/10"
                  />
                </label>

                <label>
                  <span className="mb-1 block text-xs font-bold text-slate-700">Precio Unitario ($) *</span>
                  <input
                    required
                    min="0"
                    step="0.01"
                    type="number"
                    value={form.price}
                    onChange={(e) => updateForm('price', e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs outline-none focus:border-teal-500 focus:ring-3 focus:ring-teal-500/10"
                  />
                </label>

                <label>
                  <span className="mb-1 block text-xs font-bold text-slate-700">Fecha de Caducidad</span>
                  <input
                    type="date"
                    value={form.expiration_date}
                    onChange={(e) => updateForm('expiration_date', e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs outline-none focus:border-teal-500 focus:ring-3 focus:ring-teal-500/10"
                  />
                </label>
              </div>

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
                  {isSaving ? 'Guardando...' : 'Guardar Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}


