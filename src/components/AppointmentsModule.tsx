import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  Calendar,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
  User,
  X,
  XCircle,
} from 'lucide-react';

interface Patient {
  id: number;
  name: string;
  dni: string;
}

type AppointmentStatus = 'Pendiente' | 'Confirmada' | 'Completada' | 'Cancelada';
type AgendaView = 'day' | 'week' | 'month';

interface Appointment {
  id: number;
  patient_id: number;
  patient_name: string;
  appointment_date: string;
  status: AppointmentStatus;
  reason: string;
  created_at: string;
}

interface AppointmentForm {
  patient_id: string;
  appointment_date: string;
  reason: string;
}

const APPOINTMENTS_URL = 'http://localhost:4000/api/appointments';
const PATIENTS_URL = 'http://localhost:4000/api/patients';

const emptyForm: AppointmentForm = {
  patient_id: '',
  appointment_date: '',
  reason: '',
};

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function getWeekDates(referenceDate: Date) {
  const start = startOfDay(referenceDate);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diff);

  return Array.from({ length: 7 }, (_, index) => addDays(start, index));
}

function formatDateKey(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString().slice(0, 10);
}

export default function AppointmentsModule() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [form, setForm] = useState<AppointmentForm>(emptyForm);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [activeView, setActiveView] = useState<AgendaView>('day');
  const [calendarDate, setCalendarDate] = useState(new Date());

  useEffect(() => {
    async function loadData() {
      try {
        const [appointmentsResponse, patientsResponse] = await Promise.all([
          fetch(APPOINTMENTS_URL),
          fetch(PATIENTS_URL),
        ]);

        if (!appointmentsResponse.ok || !patientsResponse.ok) {
          throw new Error('No se pudo cargar la agenda');
        }

        setAppointments((await appointmentsResponse.json()) as Appointment[]);
        setPatients((await patientsResponse.json()) as Patient[]);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Error al cargar la agenda');
      } finally {
        setIsLoading(false);
      }
    }

    void loadData();
  }, []);

  const groupedAppointments = useMemo(() => {
    return appointments.reduce<Record<string, Appointment[]>>((groups, appointment) => {
      const date = appointment.appointment_date.slice(0, 10);
      groups[date] = [...(groups[date] ?? []), appointment];
      return groups;
    }, {});
  }, [appointments]);

  const selectedDayKey = formatDateKey(calendarDate);

  const dayAppointments = useMemo(
    () =>
      appointments
        .filter((appointment) => appointment.appointment_date.slice(0, 10) === selectedDayKey)
        .sort(
          (a, b) => new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime(),
        ),
    [appointments, selectedDayKey],
  );

  const weekDates = useMemo(() => getWeekDates(calendarDate), [calendarDate]);

  const monthDays = useMemo(() => {
    const firstDay = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), 1);
    const start = new Date(firstDay);
    start.setDate(start.getDate() - ((firstDay.getDay() + 6) % 7));
    return Array.from({ length: 42 }, (_, index) => addDays(start, index));
  }, [calendarDate]);

  function navigateDate(direction: number) {
    const days = activeView === 'day' ? 1 : activeView === 'week' ? 7 : 30;
    setCalendarDate((currentDate) => addDays(currentDate, direction * days));
  }

  function updateForm(field: keyof AppointmentForm, value: string) {
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
      const response = await fetch(APPOINTMENTS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: Number(form.patient_id),
          appointment_date: form.appointment_date,
          status: 'Pendiente',
          reason: form.reason,
        }),
      });

      const data = (await response.json()) as Appointment | { error?: string };
      if (!response.ok) {
        throw new Error('error' in data && data.error ? data.error : 'No se pudo crear la cita');
      }

      const patient = patients.find((item) => item.id === Number(form.patient_id));
      setAppointments((currentAppointments) => [
        { ...(data as Appointment), patient_name: patient?.name ?? 'Paciente' },
        ...currentAppointments,
      ]);

      closeModal();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Error al crear la cita');
    } finally {
      setIsSaving(false);
    }
  }

  async function changeStatus(appointment: Appointment, status: AppointmentStatus) {
    try {
      const response = await fetch(`${APPOINTMENTS_URL}/${appointment.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error('No se pudo actualizar el estado');
      }

      setAppointments((currentAppointments) =>
        currentAppointments.map((item) => (item.id === appointment.id ? { ...item, status } : item)),
      );
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : 'Error al actualizar el estado');
    }
  }

  function statusBadge(status: AppointmentStatus) {
    const styles: Record<AppointmentStatus, string> = {
      Pendiente: 'border-amber-200 bg-amber-50 text-amber-700',
      Confirmada: 'border-emerald-200 bg-emerald-50 text-emerald-700',
      Completada: 'border-teal-200 bg-teal-50 text-teal-700',
      Cancelada: 'border-rose-200 bg-rose-50 text-rose-700',
    };

    const Icon = status === 'Cancelada' ? XCircle : status === 'Pendiente' ? Clock : CheckCircle;

    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${styles[status]}`}>
        <Icon className="h-3.5 w-3.5" />
        {status}
      </span>
    );
  }

  return (
    <section className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-teal-600">
            <Calendar className="h-5 w-5" />
            <span className="text-xs font-bold uppercase tracking-widest">Planificación clínica</span>
          </div>
          <h2 className="mt-1 text-2xl font-black text-slate-900">Agenda de Citas</h2>
          <p className="mt-1 text-sm text-slate-500">Organiza las consultas y acompaña cada turno.</p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-teal-700"
        >
          <Plus className="h-4 w-4" />
          Nueva Cita
        </button>
      </div>

      {isLoading ? (
        <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
          Cargando agenda...
        </p>
      ) : null}

      {error && (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </p>
      )}

      <div className="rounded-2xl border border-teal-200 bg-teal-50/70 p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-black text-teal-900">
              Vista {activeView === 'day' ? 'diaria' : activeView === 'week' ? 'semanal' : 'mensual'}
            </h3>
            <p className="mt-1 text-xs text-teal-700">
              {activeView === 'day'
                ? calendarDate.toLocaleDateString('es-ES', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  })
                : activeView === 'week'
                  ? `${weekDates[0].toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'short',
                    })} - ${weekDates[6].toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'short',
                    })}`
                  : calendarDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button type="button" onClick={() => navigateDate(-1)} className="rounded-lg border border-teal-200 bg-white p-2 text-teal-700">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => setCalendarDate(new Date())} className="rounded-lg bg-white px-3 py-2 text-xs font-bold text-teal-700">
              Hoy
            </button>
            <button type="button" onClick={() => navigateDate(1)} className="rounded-lg border border-teal-200 bg-white p-2 text-teal-700">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {(['day', 'week', 'month'] as AgendaView[]).map((view) => (
            <button
              key={view}
              type="button"
              onClick={() => setActiveView(view)}
              className={`rounded-xl px-3 py-2 text-sm font-bold ${activeView === view ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600'}`}
            >
              {view === 'day' ? 'Día' : view === 'week' ? 'Semana' : 'Mes'}
            </button>
          ))}
        </div>

        {activeView === 'day' && (
          <div className="space-y-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-bold text-slate-700">
              {calendarDate.toLocaleDateString('es-ES', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </div>

            {dayAppointments.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-200 px-4 py-10 text-center text-sm text-slate-500">
                No hay citas en esta fecha.
              </p>
            ) : (
              dayAppointments.map((appointment) => (
                <article key={appointment.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div className="flex items-center gap-2 font-black text-slate-900">
                        <Clock className="h-4 w-4 text-teal-600" />
                        {new Date(appointment.appointment_date).toLocaleTimeString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>

                      <h4 className="mt-2 flex items-center gap-2 font-bold text-slate-800">
                        <User className="h-4 w-4 text-slate-400" />
                        {appointment.patient_name}
                      </h4>

                      <p className="mt-1 text-sm text-slate-500">{appointment.reason}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      {statusBadge(appointment.status)}
                      <select
                        aria-label={`Estado de ${appointment.patient_name}`}
                        value={appointment.status}
                        onChange={(event) => void changeStatus(appointment, event.target.value as AppointmentStatus)}
                        className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold text-slate-600 outline-none focus:border-teal-500"
                      >
                        <option value="Pendiente">Pendiente</option>
                        <option value="Confirmada">Confirmada</option>
                        <option value="Completada">Completada</option>
                        <option value="Cancelada">Cancelada</option>
                      </select>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        )}

        {activeView === 'week' && (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-7">
            {weekDates.map((date) => {
              const dayKey = formatDateKey(date);
              const dayAppointmentsForThisDate = (groupedAppointments[dayKey] ?? []).sort(
                (a, b) => new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime(),
              );

              return (
                <div key={dayKey} className="min-h-[220px] rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <div className={`mb-3 text-center text-xs font-bold ${dayKey === selectedDayKey ? 'text-teal-700' : 'text-slate-500'}`}>
                    {date.toLocaleDateString('es-ES', { weekday: 'short' })}
                    <div className="mt-1 text-base text-slate-800">{date.getDate()}</div>
                  </div>

                  <div className="space-y-2">
                    {dayAppointmentsForThisDate.length === 0 ? (
                      <p className="text-center text-[10px] text-slate-400">Sin citas</p>
                    ) : (
                      dayAppointmentsForThisDate.map((appointment) => (
                        <div key={appointment.id} className="rounded-xl border border-teal-200 bg-white p-2 text-left">
                          <div className="text-[10px] font-bold text-teal-700">
                            {new Date(appointment.appointment_date).toLocaleTimeString('es-ES', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                          <div className="mt-1 text-xs font-bold text-slate-800">{appointment.patient_name}</div>
                          <div className="mt-1 text-[10px] text-slate-500">{appointment.reason}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeView === 'month' && (
          <div className="grid grid-cols-1 gap-2 md:grid-cols-7">
            {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((label) => (
              <div key={label} className="px-2 py-3 text-center text-[11px] font-black uppercase tracking-wide text-slate-500">
                {label}
              </div>
            ))}

            {monthDays.map((date) => {
              const dayKey = formatDateKey(date);
              const dayAppointmentsForThisDate = groupedAppointments[dayKey] ?? [];

              return (
                <button
                  key={dayKey}
                  type="button"
                  onClick={() => {
                    setCalendarDate(date);
                    setActiveView('day');
                  }}
                  className={`min-h-[120px] rounded-2xl border p-2 text-left ${date.getMonth() === calendarDate.getMonth() ? 'border-slate-200 bg-white' : 'border-slate-100 bg-slate-50 text-slate-400'} ${dayKey === selectedDayKey ? 'ring-2 ring-teal-200' : ''}`}
                >
                  <div className="mb-2 text-right text-xs font-bold">{date.getDate()}</div>
                  <div className="space-y-1">
                    {dayAppointmentsForThisDate.slice(0, 2).map((appointment) => (
                      <div key={appointment.id} className="truncate rounded-lg bg-teal-50 px-2 py-1 text-[10px] font-bold text-teal-700">
                        {appointment.patient_name}
                      </div>
                    ))}

                    {dayAppointmentsForThisDate.length > 2 && (
                      <div className="text-[10px] font-bold text-slate-500">+{dayAppointmentsForThisDate.length - 2}</div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" role="dialog" aria-modal="true" aria-labelledby="new-appointment-title">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h3 id="new-appointment-title" className="text-lg font-black text-slate-900">Nueva Cita</h3>
                <p className="text-xs text-slate-500">Programa una consulta para un paciente.</p>
              </div>

              <button type="button" onClick={closeModal} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100" aria-label="Cerrar modal">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 p-6">
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold text-slate-600">Paciente</span>
                <select
                  required
                  value={form.patient_id}
                  onChange={(event) => updateForm('patient_id', event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                >
                  <option value="">Selecciona un paciente</option>
                  {patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.name} · {patient.dni}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label>
                  <span className="mb-1.5 block text-xs font-bold text-slate-600">Fecha y hora</span>
                  <input
                    required
                    type="datetime-local"
                    value={form.appointment_date}
                    onChange={(event) => updateForm('appointment_date', event.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                  />
                </label>

                <label>
                  <span className="mb-1.5 block text-xs font-bold text-slate-600">Motivo</span>
                  <input
                    required
                    value={form.reason}
                    onChange={(event) => updateForm('reason', event.target.value)}
                    placeholder="Ej. Limpieza dental"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                  />
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={closeModal} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600">
                  Cancelar
                </button>
                <button type="submit" disabled={isSaving} className="rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60">
                  {isSaving ? 'Guardando...' : 'Guardar Cita'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}