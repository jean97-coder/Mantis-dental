import React, { useState } from 'react';
import { DollarSign, ArrowUpRight, CreditCard, Wallet, Calendar, Plus, Download } from 'lucide-react';

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

  const mockPayments: Payment[] = [
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
      concept: 'Pago Consulta Evaluación',
      amount: 50.0,
      date: '2026-08-24 09:15 AM',
      paymentMethod: 'Efectivo',
      status: 'Completado',
    },
    {
      id: 'PAG-2026-087',
      patientName: 'Ana Lucía Gómez',
      concept: 'Limpieza Profunda & Flúor',
      amount: 100.0,
      date: '2026-08-23 04:00 PM',
      paymentMethod: 'Transferencia',
      status: 'Completado',
    },
  ];

  const filteredPayments = filterMethod === 'todos' 
    ? mockPayments 
    : mockPayments.filter(p => p.paymentMethod.toLowerCase() === filterMethod.toLowerCase());

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Módulo de Finanzas & Pagos</h2>
          <p className="text-xs text-slate-500">Gestión de ingresos, facturación e historial de cobros.</p>
        </div>
        <div className="flex gap-2">
          <button className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all flex items-center gap-2">
            <Download className="w-4 h-4" /> Exportar Reporte
          </button>
          <button className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-sm flex items-center gap-2 transition-all">
            <Plus className="w-4 h-4" /> Registrar Cobro
          </button>
        </div>
      </div>

      {/* Tarjetas Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-semibold">Ingresos de Hoy</span>
            <p className="text-2xl font-black text-slate-900 mt-1">$250.00</p>
            <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5 mt-1">
              <ArrowUpRight className="w-3 h-3" /> +15% vs ayer
            </span>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-semibold">Ingresos del Mes</span>
            <p className="text-2xl font-black text-slate-900 mt-1">$4,850.00</p>
            <span className="text-[10px] text-slate-400 font-medium block mt-1">Agosto 2026</span>
          </div>
          <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center">
            <Wallet className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-semibold">Cuentas por Cobrar</span>
            <p className="text-2xl font-black text-slate-900 mt-1">$830.00</p>
            <span className="text-[10px] text-amber-600 font-bold block mt-1">2 Presupuestos pendientes</span>
          </div>
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Historial de Transacciones */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="text-sm font-bold text-slate-900">Historial de Transacciones Recientes</h3>
          
          <div className="flex gap-2">
            {['todos', 'efectivo', 'tarjeta', 'transferencia'].map((method) => (
              <button
                key={method}
                onClick={() => setFilterMethod(method)}
                className={`text-[11px] font-semibold px-3 py-1.5 rounded-lg capitalize transition-all ${
                  filterMethod === method
                    ? 'bg-slate-900 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {method}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-400 uppercase font-bold text-[10px] border-b border-slate-100">
              <tr>
                <th className="px-6 py-3">Código</th>
                <th className="px-6 py-3">Paciente</th>
                <th className="px-6 py-3">Concepto</th>
                <th className="px-6 py-3">Fecha</th>
                <th className="px-6 py-3">Método</th>
                <th className="px-6 py-3 text-right">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredPayments.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4 font-bold text-teal-600">{p.id}</td>
                  <td className="px-6 py-4 font-bold text-slate-900">{p.patientName}</td>
                  <td className="px-6 py-4 text-slate-600">{p.concept}</td>
                  <td className="px-6 py-4 text-slate-400 text-[11px]">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-300" />
                      {p.date}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-block px-2.5 py-1 text-[10px] font-bold rounded-md bg-slate-100 text-slate-700">
                      {p.paymentMethod}
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
    </div>
  );
};

export default FinanzasModule;