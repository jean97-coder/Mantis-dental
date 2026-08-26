import React, { useState } from 'react';
import { DollarSign, ArrowUpRight, CreditCard, Wallet, Calendar, Plus, Download, Search, CheckCircle2, X } from 'lucide-react';

interface Payment {
  id: string;
  patientName: string;
  concept: string;
  amount: number;
  date: string;
  paymentMethod: 'Efectivo' | 'Tarjeta' | 'Transferencia';
  status: 'Completado' | 'Pendiente';
}

export const FinanzasModule: React.FC = () => {
  const [filterMethod, setFilterMethod] = useState<string>('todos');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [payments, setPayments] = useState<Payment[]>([
    {
      id: 'PAG-2026-089',
      patientName: 'María Fernanda López',
      concept: 'Abono Presupuesto PRE-2026-001 (Endodoncia)',
      amount: 200.0,
      date: '2026-08-24 10:30 AM',
      paymentMethod: 'Tarjeta',
      status: 'Completado',
    },
    {
      id: 'PAG-2026-088',
      patientName: 'Carlos Alberto Rodríguez',
      concept: 'Pago Consulta Evaluación & Diagnóstico',
      amount: 50.0,
      date: '2026-08-24 09:15 AM',
      paymentMethod: 'Efectivo',
      status: 'Completado',
    },
    {
      id: 'PAG-2026-087',
      patientName: 'Ana Lucía Gómez',
      concept: 'Limpieza Profunda & Flúor Clínico',
      amount: 100.0,
      date: '2026-08-23 04:00 PM',
      paymentMethod: 'Transferencia',
      status: 'Completado',
    },
  ]);

  const [newPayment, setNewPayment] = useState({
    patientName: '',
    concept: '',
    amount: '',
    paymentMethod: 'Efectivo' as 'Efectivo' | 'Tarjeta' | 'Transferencia',
  });

  const filteredPayments = payments
    .filter((p) => filterMethod === 'todos' || p.paymentMethod.toLowerCase() === filterMethod.toLowerCase())
    .filter((p) => !searchTerm || p.patientName.toLowerCase().includes(searchTerm.toLowerCase()) || p.id.toLowerCase().includes(searchTerm.toLowerCase()));

  const totalIngresosHoy = 350.0;
  const totalIngresosMes = 4850.0;
  const cuentasPorCobrar = 830.0;

  function handleRegisterPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!newPayment.patientName || !newPayment.amount) return;

    const item: Payment = {
      id: `PAG-2026-0${payments.length + 90}`,
      patientName: newPayment.patientName,
      concept: newPayment.concept || 'Consulta odontológica',
      amount: Number(newPayment.amount),
      date: new Date().toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' }),
      paymentMethod: newPayment.paymentMethod,
      status: 'Completado',
    };

    setPayments([item, ...payments]);
    setIsModalOpen(false);
    setNewPayment({ patientName: '', concept: '', amount: '', paymentMethod: 'Efectivo' });
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-teal-600">
            <DollarSign className="h-4.5 w-4.5" />
            <span className="text-xs font-extrabold uppercase tracking-widest text-teal-700">Módulo Financiero</span>
          </div>
          <h1 className="mt-1 text-2xl font-black text-slate-900 tracking-tight">Finanzas & Facturación</h1>
          <p className="mt-0.5 text-xs text-slate-500 font-medium">Control de flujos de caja, cobros, ingresos y transacciones clínicas.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Exportar Reporte</span>
          </button>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-teal-600/20 hover:bg-teal-700 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Cobro</span>
          </button>
        </div>
      </div>

      {/* Tarjetas Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4.5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between transition-all hover:border-emerald-300">
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Ingresos de Hoy</span>
            <p className="text-3xl font-black text-slate-900 mt-1.5 tracking-tight">${totalIngresosHoy.toFixed(2)}</p>
            <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1 mt-1">
              <ArrowUpRight className="w-3.5 h-3.5" /> +15% vs ayer
            </span>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center border border-emerald-100">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between transition-all hover:border-teal-300">
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Ingresos del Mes</span>
            <p className="text-3xl font-black text-slate-900 mt-1.5 tracking-tight">${totalIngresosMes.toFixed(2)}</p>
            <span className="text-[11px] text-teal-700 font-bold block mt-1">Agosto 2026 · Mes en curso</span>
          </div>
          <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center border border-teal-100">
            <Wallet className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between transition-all hover:border-amber-300">
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Cuentas por Cobrar</span>
            <p className="text-3xl font-black text-slate-900 mt-1.5 tracking-tight">${cuentasPorCobrar.toFixed(2)}</p>
            <span className="text-[11px] text-amber-700 font-bold block mt-1">2 Presupuestos en cuotas</span>
          </div>
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center border border-amber-100">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Historial de Transacciones */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/40">
          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por paciente o código..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs outline-none focus:border-teal-500 focus:ring-3 focus:ring-teal-500/10"
              />
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {['todos', 'efectivo', 'tarjeta', 'transferencia'].map((method) => (
              <button
                key={method}
                type="button"
                onClick={() => setFilterMethod(method)}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl capitalize transition-all cursor-pointer ${
                  filterMethod === method
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {method}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 uppercase font-extrabold text-[10px] tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-6 py-3.5">Código</th>
                <th className="px-6 py-3.5">Paciente</th>
                <th className="px-6 py-3.5">Concepto</th>
                <th className="px-6 py-3.5">Fecha</th>
                <th className="px-6 py-3.5">Método de Pago</th>
                <th className="px-6 py-3.5">Estado</th>
                <th className="px-6 py-3.5 text-right">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
              {filteredPayments.map((p) => (
                <tr key={p.id} className="hover:bg-teal-50/30 transition-colors">
                  <td className="px-6 py-4 font-bold text-teal-700">{p.id}</td>
                  <td className="px-6 py-4 font-bold text-slate-900">{p.patientName}</td>
                  <td className="px-6 py-4 text-slate-600">{p.concept}</td>
                  <td className="px-6 py-4 text-slate-500 text-[11px]">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {p.date}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-block px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-100 text-slate-700 border border-slate-200/80">
                      {p.paymentMethod}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3" /> {p.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-black text-slate-900 text-sm">
                    +${p.amount.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Registrar Cobro */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4" role="dialog">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 animate-fade-in-up space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">Registrar Cobro Clínico</h3>
                <p className="text-xs text-slate-500">Ingreso directo a caja del consultorio.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterPayment} className="space-y-3.5">
              <label className="block">
                <span className="text-xs font-bold text-slate-700 block mb-1">Paciente *</span>
                <input
                  required
                  type="text"
                  placeholder="Nombre del paciente"
                  value={newPayment.patientName}
                  onChange={(e) => setNewPayment({ ...newPayment, patientName: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs outline-none focus:border-teal-500 focus:ring-3 focus:ring-teal-500/10"
                />
              </label>

              <label className="block">
                <span className="text-xs font-bold text-slate-700 block mb-1">Concepto</span>
                <input
                  type="text"
                  placeholder="Ej. Abono tratamiento / Limpieza"
                  value={newPayment.concept}
                  onChange={(e) => setNewPayment({ ...newPayment, concept: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs outline-none focus:border-teal-500 focus:ring-3 focus:ring-teal-500/10"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs font-bold text-slate-700 block mb-1">Monto ($) *</span>
                  <input
                    required
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={newPayment.amount}
                    onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs outline-none focus:border-teal-500 focus:ring-3 focus:ring-teal-500/10"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-bold text-slate-700 block mb-1">Método de Pago</span>
                  <select
                    value={newPayment.paymentMethod}
                    onChange={(e) => setNewPayment({ ...newPayment, paymentMethod: e.target.value as Payment['paymentMethod'] })}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs outline-none focus:border-teal-500 focus:ring-3 focus:ring-teal-500/10"
                  >
                    <option value="Efectivo">Efectivo</option>
                    <option value="Tarjeta">Tarjeta</option>
                    <option value="Transferencia">Transferencia</option>
                  </select>
                </label>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-teal-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-teal-600/20 hover:bg-teal-700"
                >
                  Registrar Cobro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinanzasModule;