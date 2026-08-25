import React, { useState } from 'react';
import { Calendar as CalendarIcon, Clock, Plus, User, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';

interface Appointment {
  id: string;
  patientName: string;
  treatment: string;
  time: string;
  status: 'confirmada' | 'pendiente' | 'completada' | 'cancelada';
  doctor: string;
}

  export const AgendaModule: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState('2026-08-25');
  const [, setShowNewModal] = useState(false);

  const appointments: Appointment[] = [
    {
      id: '1',
      patientName: 'María Fernanda López',
      treatment: 'Limpieza Profunda & Fluorización',
      time: '09:00 AM',
      status: 'confirmada',
      doctor: 'Dr. Juan Pérez',
    },
    {
      id: '2',
      patientName: 'Carlos Alberto Rodríguez',
      treatment: 'Evaluación Endodoncia (Pieza 16)',
      time: '10:30 AM',
      status: 'pendiente',
      doctor: 'Dr. Juan Pérez',
    },
    {
      id: '3',
      patientName: 'Ana Lucía Gómez',
      treatment: 'Diseño de Sonrisa - Control',
      time: '03:00 PM',
      status: 'completada',
      doctor: 'Dra. Sofía Mendoza',
    },
  ];

  const getStatusBadge = (status: Appointment['status']) => {
    switch (status) {
      case 'confirmada':
        return <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Confirmada</span>;
      case 'pendiente':
        return <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Pendiente</span>;
      case 'completada':
        return <span className="bg-teal-50 text-teal-700 border border-teal-200 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Completada</span>;
      case 'cancelada':
        return <span className="bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1"><XCircle className="w-3 h-3" /> Cancelada</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Agenda de Citas Médicas</h2>
          <p className="text-xs text-slate-500">Planificación de consultas y gestión de turnos del consultorio.</p>
        </div>
        <button 
          onClick={() => setShowNewModal(true)}
          className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-sm flex items-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" />
          Agendar Nueva Cita
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Selector de Fecha y Filtros */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-teal-600" />
            Fecha de Consulta
          </h3>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-teal-500 outline-none"
          />

          <div className="pt-4 border-t border-slate-100 space-y-2">
            <span className="text-[11px] font-bold text-slate-400 block">Resumen del Día</span>
            <div className="flex justify-between text-xs py-1 text-slate-600">
              <span>Total Citas:</span>
              <span className="font-bold text-slate-900">3</span>
            </div>
            <div className="flex justify-between text-xs py-1 text-slate-600">
              <span>Confirmadas:</span>
              <span className="font-bold text-emerald-600">1</span>
            </div>
            <div className="flex justify-between text-xs py-1 text-slate-600">
              <span>Pendientes:</span>
              <span className="font-bold text-amber-600">1</span>
            </div>
          </div>
        </div>

        {/* Lista del Cronograma */}
        <div className="lg:col-span-3 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-800 text-sm">Cronograma del Día ({selectedDate})</h3>
            <span className="text-xs text-teal-600 font-semibold bg-teal-50 px-3 py-1 rounded-full">Sincronizado con WhatsApp</span>
          </div>

          <div className="space-y-3">
            {appointments.map((item) => (
              <div 
                key={item.id} 
                className="p-4 rounded-xl border border-slate-100 hover:border-teal-200 bg-slate-50/50 hover:bg-white transition-all flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-center justify-center bg-teal-50 text-teal-700 px-3 py-2 rounded-xl border border-teal-100 min-w-[75px]">
                    <Clock className="w-3.5 h-3.5 mb-1" />
                    <span className="text-xs font-bold">{item.time}</span>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      {item.patientName}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">{item.treatment}</p>
                    <span className="text-[10px] text-slate-400 font-medium">Atiende: {item.doctor}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {getStatusBadge(item.status)}
                  <button className="text-xs text-slate-600 hover:text-teal-600 font-bold px-2 py-1 rounded-lg hover:bg-slate-100">
                    Editar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgendaModule;