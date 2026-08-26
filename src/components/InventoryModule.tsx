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
  if (diffInDays <= 30) return { state: 'warning', label: `Vence en ${diffInDays} días`, tone: 'amber' };
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
        product.category.toLowerCase().includes(normalizedSearch),
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
    <section className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-teal-600">
            <Package className="h-5 w-5" />
            <span className="text-xs font-bold uppercase tracking-widest">Control de suministros</span>
          </div>
          <h2 className="mt-1 text-2xl font-black text-slate-900">Inventario</h2>
          <p className="mt-1 text-sm text-slate-500">Supervisa existencias, precios, proveedores y fechas de vencimiento.</p>
        </div>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-teal-700"
        >
          <Plus className="h-4 w-4" />
          Nuevo Producto
        </button>
      </div>

      {error && <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Productos registrados</span>
            <Package className="h-5 w-5 text-teal-600" />
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900">{products.length}</p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wide text-amber-700">Stock por reponer</span>
            <AlertTriangle className="h-5 w-5 text-amber-600" />
          </div>
          <p className="mt-2 text-2xl font-black text-amber-900">{lowStockCount}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar por nombre o categoría..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            />
          </div>
          <span className="text-xs font-semibold text-slate-400">{filteredProducts.length} productos</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-6 py-4 font-bold">Producto</th>
                <th className="px-6 py-4 font-bold">Categoría</th>
                <th className="px-6 py-4 font-bold">Stock</th>
                <th className="px-6 py-4 font-bold">Precio</th>
                <th className="px-6 py-4 font-bold">Proveedor</th>
                <th className="px-6 py-4 font-bold">Ingreso</th>
                <th className="px-6 py-4 font-bold">Caducidad</th>
                <th className="px-6 py-4 font-bold">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400">Cargando inventario...</td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400">No hay productos para mostrar.</td>
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
                    <tr key={product.id} className="transition hover:bg-teal-50/40">
                      <td className="px-6 py-4 font-bold text-slate-900">{product.name}</td>
                      <td className="px-6 py-4 text-slate-500">{product.category}</td>
                      <td className="px-6 py-4">
                        <span className={isLowStock ? 'font-black text-rose-700' : 'font-bold text-slate-700'}>{product.stock}</span>
                        <span className="ml-1 text-xs text-slate-400">/ mín. {product.min_stock}</span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-700">
                        <span className="inline-flex items-center gap-1">
                          <DollarSign className="h-3.5 w-3.5 text-teal-600" />
                          {Number(product.price).toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        <span className="inline-flex items-center gap-2">
                          <Truck className="h-3.5 w-3.5 text-slate-400" />
                          {product.supplier}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {product.entry_date ? new Date(`${product.entry_date}T00:00:00`).toLocaleDateString('es-ES') : '—'}
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {product.expiration_date ? new Date(`${product.expiration_date}T00:00:00`).toLocaleDateString('es-ES') : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-2">
                          {isLowStock ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700">
                              <AlertTriangle className="h-3.5 w-3.5" />
                              Stock bajo
                            </span>
                          ) : (
                            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                              Disponible
                            </span>
                          )}
                          {product.expiration_date && (
                            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${expirationTone}`}>
                              <CalendarClock className="h-3.5 w-3.5" />
                              {expirationState.label}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" role="dialog" aria-modal="true" aria-labelledby="new-product-title">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h3 id="new-product-title" className="text-lg font-black text-slate-900">Nuevo Producto</h3>
                <p className="text-xs text-slate-500">Registra un artículo del inventario.</p>
              </div>
              <button type="button" onClick={closeModal} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Cerrar modal">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid gap-4 p-6 sm:grid-cols-2">
              <label>
                <span className="mb-1.5 block text-xs font-bold text-slate-600">Nombre</span>
                <input
                  required
                  value={form.name}
                  onChange={(event) => updateForm('name', event.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                />
              </label>
              <label>
                <span className="mb-1.5 block text-xs font-bold text-slate-600">Categoría</span>
                <input
                  required
                  value={form.category}
                  onChange={(event) => updateForm('category', event.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                />
              </label>
              <label>
                <span className="mb-1.5 block text-xs font-bold text-slate-600">Stock inicial</span>
                <input
                  required
                  min="0"
                  type="number"
                  value={form.stock}
                  onChange={(event) => updateForm('stock', event.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                />
              </label>
              <label>
                <span className="mb-1.5 block text-xs font-bold text-slate-600">Stock mínimo</span>
                <input
                  required
                  min="0"
                  type="number"
                  value={form.min_stock}
                  onChange={(event) => updateForm('min_stock', event.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                />
              </label>
              <label>
                <span className="mb-1.5 block text-xs font-bold text-slate-600">Precio</span>
                <input
                  required
                  min="0"
                  step="0.01"
                  type="number"
                  value={form.price}
                  onChange={(event) => updateForm('price', event.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                />
              </label>
              <label className="sm:col-span-2">
                <span className="mb-1.5 block text-xs font-bold text-slate-600">Proveedor</span>
                <input
                  required
                  value={form.supplier}
                  onChange={(event) => updateForm('supplier', event.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                />
              </label>
              <label className="flex-1">
                <span className="mb-1.5 block text-xs font-bold text-slate-600">Fecha de ingreso</span>
                <input
                  type="date"
                  value={form.entry_date}
                  onChange={(event) => updateForm('entry_date', event.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                />
              </label>
              <label className="flex-1">
                <span className="mb-1.5 block text-xs font-bold text-slate-600">Fecha de caducidad</span>
                <input
                  type="date"
                  value={form.expiration_date}
                  onChange={(event) => updateForm('expiration_date', event.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                />
              </label>
              <div className="sm:col-span-2 flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeModal} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600">
                  Cancelar
                </button>
                <button type="submit" disabled={isSaving} className="rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-teal-300">
                  {isSaving ? 'Guardando...' : 'Guardar producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

