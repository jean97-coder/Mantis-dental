import React, { useState } from 'react';
import { FileText, Plus, Download, Send } from 'lucide-react';

interface BudgetProcedure {
  id: string;
  toothNumber: number | string;
  procedure: string;
  cost: number;
}

interface Budget {
  id: string;
  patientName: string;
  date: string;
  procedures: BudgetProcedure[];
  total: number;
  status: 'Aprobado' | 'Pendiente' | 'Rechazado';
}

export const PresupuestosModule: React.FC = () => {
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);

  const mockBudgets: Budget[] = [
    {
      id: 'PRE-2026-001',
      patientName: 'María Fernanda López',
      date: '2026-08-20',
      status: 'Aprobado',
      total: 380.0,
      procedures: [
        { id: '1', toothNumber: 16, procedure: 'Endodoncia Unirradicular', cost: 220.0 },
        { id: '2', toothNumber: 16, procedure: 'Restauración con Resina Fotocurable', cost: 60.0 },
        { id: '3', toothNumber: 'General', procedure: 'Profilaxis Profunda + Aplicación de Flúor', cost: 100.0 },
      ],
    },
    {
      id: 'PRE-2026-002',
      patientName: 'Carlos Alberto Rodríguez',
      date: '2026-08-22',
      status: 'Pendiente',
      total: 650.0,
      procedures: [
        { id: '1', toothNumber: 24, procedure: 'Corona Metal-Cerámica', cost: 450.0 },
        { id: '2', toothNumber: 24, procedure: 'Núcleo Colado', cost: 200.0 },
      ],
    },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Planes de Tratamiento & Presupuestos</h2>
          <p className="text-xs text-slate-500">Cotizaciones detalladas vinculadas al odontograma del paciente.</p>
        </div>
        <button className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-sm flex items-center gap-2 transition-all">
          <Plus className="w-4 h-4" />
          Crear Presupuesto
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Presupuestos */}
        <div className="lg:col-span-1 space-y-3">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Historial de Cotizaciones</span>
          {mockBudgets.map((b) => (
            <div
              key={b.id}
              onClick={() => setSelectedBudget(b)}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                selectedBudget?.id === b.id
                  ? 'bg-white border-teal-500 ring-2 ring-teal-500/10 shadow-md'
                  : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-teal-600">{b.id}</span>
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                    b.status === 'Aprobado'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}
                >
                  {b.status}
                </span>
              </div>
              <h4 className="font-bold text-slate-900 text-sm">{b.patientName}</h4>
              <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100 text-xs">
                <span className="text-slate-400">{b.date}</span>
                <span className="font-black text-slate-900">${b.total.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Detalle del Presupuesto Seleccionado */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          {selectedBudget ? (
            <>
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <span className="text-xs text-teal-600 font-bold uppercase">{selectedBudget.id}</span>
                  <h3 className="text-lg font-bold text-slate-900">{selectedBudget.patientName}</h3>
                </div>
                <div className="flex gap-2">
                  <button className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all">
                    <Download className="w-3.5 h-3.5" /> PDF
                  </button>
                  <button className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-sm">
                    <Send className="w-3.5 h-3.5" /> WhatsApp
                  </button>
                </div>
              </div>

              {/* Tabla de Procedimientos */}
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-400 uppercase font-bold text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Pieza</th>
                    <th className="px-4 py-3">Procedimiento / Tratamiento</th>
                    <th className="px-4 py-3 text-right">Costo Unit.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {selectedBudget.procedures.map((p) => (
                    <tr key={p.id}>
                      <td className="px-4 py-3.5 font-bold text-slate-800">
                        {typeof p.toothNumber === 'number' ? `Pieza ${p.toothNumber}` : p.toothNumber}
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">{p.procedure}</td>
                      <td className="px-4 py-3.5 text-right font-bold text-slate-900">${p.cost.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totales y Acciones */}
              <div className="bg-slate-50 p-4 rounded-xl space-y-2 border border-slate-100">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-slate-700">${selectedBudget.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Descuento aplicado (0%):</span>
                  <span className="font-semibold text-slate-700">$0.00</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                  <span>Total Estimado:</span>
                  <span className="text-teal-700 text-base font-black">${selectedBudget.total.toFixed(2)}</span>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-16 text-slate-400 space-y-2">
              <FileText className="w-10 h-10 mx-auto text-slate-300" />
              <p className="text-xs font-medium">Selecciona un presupuesto de la lista para ver el desglose detallado.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PresupuestosModule;