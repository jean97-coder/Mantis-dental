import { useEffect, useState, type ReactNode } from 'react';
import { Calendar, FileText, Printer, User } from 'lucide-react';

interface Patient { id: number; name: string; dni: string; }
interface Note { id: number; note: string; created_at: string; }
interface Diagnosis { id: number; cie10_code: string; description: string; created_at: string; }
interface RecordItem { id: number; tooth_number: number; diagnosis: string; treatment_plan: string; created_at: string; }

const API = 'http://localhost:4001/api';

export default function ClinicalReportsReport() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientId, setPatientId] = useState('');
  const [notes, setNotes] = useState<Note[]>([]);
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${API}/patients`)
      .then((response) => response.json() as Promise<Patient[]>)
      .then(setPatients)
      .catch(() => setError('No se pudieron cargar los pacientes'));
  }, []);

  useEffect(() => {
    if (!patientId) return;
    async function load() {
      try {
        const [notesResponse, diagnosesResponse, recordsResponse] = await Promise.all([
          fetch(`${API}/clinical-records/patient/${patientId}/notes`),
          fetch(`${API}/clinical-records/patient/${patientId}/diagnoses`),
          fetch(`${API}/medical-records/patient/${patientId}`),
        ]);
        setNotes((await notesResponse.json()) as Note[]);
        setDiagnoses((await diagnosesResponse.json()) as Diagnosis[]);
        setRecords((await recordsResponse.json()) as RecordItem[]);
      } catch {
        setError('No se pudo cargar el expediente del paciente.');
      }
    }
    void load();
  }, [patientId]);

  const patient = patients.find((item) => String(item.id) === patientId);

  return (
    <section className="mx-auto max-w-5xl space-y-6">
      {/* Header (hidden in print) */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div>
          <div className="flex items-center gap-2 text-teal-600">
            <FileText className="h-4.5 w-4.5" />
            <span className="text-xs font-extrabold uppercase tracking-widest text-teal-700">Documento Oficial</span>
          </div>
          <h1 className="mt-1 text-2xl font-black text-slate-900 tracking-tight">Reporte de Historial Clínico</h1>
          <p className="mt-0.5 text-xs text-slate-500 font-medium">Previsualización formal e impresión legal del expediente del paciente.</p>
        </div>

        <button
          type="button"
          disabled={!patient}
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-teal-600/20 hover:bg-teal-700 transition-all disabled:opacity-40 cursor-pointer"
        >
          <Printer className="h-4 w-4" />
          <span>Imprimir Historial</span>
        </button>
      </div>

      {error && (
        <p className="rounded-2xl border border-rose-200 bg-rose-50/90 px-4 py-3 text-xs font-semibold text-rose-700 print:hidden">
          {error}
        </p>
      )}

      {/* Patient Selector */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs print:border-0 print:shadow-none print:p-0">
        <label className="block max-w-md print:hidden">
          <span className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <User className="h-3.5 w-3.5 text-teal-600" />
            Seleccionar Paciente para el Reporte *
          </span>
          <select
            value={patientId}
            onChange={(event) => setPatientId(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs font-medium text-slate-800 outline-none transition focus:border-teal-500 focus:bg-white"
          >
            <option value="">Selecciona un paciente del directorio</option>
            {patients.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} · DNI {item.dni}
              </option>
            ))}
          </select>
        </label>

        {patient ? (
          <div className="mt-6 space-y-6 pt-6 border-t border-slate-100 print:border-0 print:pt-0">
            {/* Encabezado clínico formal de impresión */}
            <div className="border-b-2 border-slate-900 pb-5 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600 text-white font-black text-xs">
                    MD
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-900 tracking-tight">MANTIS DENTAL CLINIC</h2>
                    <p className="text-[11px] text-slate-500 font-medium">Especialidades Odontológicas & Diagnóstico Avanzado</p>
                  </div>
                </div>
              </div>

              <div className="text-right text-xs">
                <span className="font-bold text-slate-900 block">HISTORIA CLÍNICA ODONTOLÓGICA</span>
                <span className="text-slate-500 text-[11px]">Fecha: {new Date().toLocaleDateString('es-ES')}</span>
              </div>
            </div>

            {/* Datos del Paciente */}
            <div className="rounded-2xl bg-slate-50/80 p-4 border border-slate-200/80 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Paciente</span>
                <strong className="text-slate-900 font-bold">{patient.name}</strong>
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Identificación / DNI</span>
                <span className="text-slate-700 font-semibold">{patient.dni}</span>
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Número de Expediente</span>
                <span className="text-teal-700 font-bold">EXP-{patient.id}</span>
              </div>
            </div>

            {/* Secciones del Reporte */}
            <ReportSection title="Tratamientos y Procedimientos Registrados">
              {records.length ? (
                <div className="divide-y divide-slate-100">
                  {records.map((item) => (
                    <div key={item.id} className="py-2.5 flex justify-between items-start text-xs">
                      <div>
                        <strong className="text-slate-900 font-bold">Pieza #{item.tooth_number}:</strong>{' '}
                        <span className="text-slate-700">{item.diagnosis}</span>
                        <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Plan: {item.treatment_plan}</p>
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0 flex items-center gap-1 font-medium">
                        <Calendar className="h-3 w-3" />
                        {new Date(item.created_at).toLocaleDateString('es-ES')}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-2">Sin procedimientos específicos registrados.</p>
              )}
            </ReportSection>

            <ReportSection title="Diagnósticos CIE-10 y Hallazgos">
              {diagnoses.length ? (
                <div className="space-y-1.5 pt-1">
                  {diagnoses.map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-xs py-1">
                      <span className="text-slate-800">
                        <strong className="text-teal-700 font-black mr-2 bg-teal-50 px-1.5 py-0.5 rounded-sm">
                          {item.cie10_code}
                        </strong>
                        {item.description}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {new Date(item.created_at).toLocaleDateString('es-ES')}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-2">Sin diagnósticos CIE-10 asentados.</p>
              )}
            </ReportSection>

            <ReportSection title="Notas de Evolución y Seguimiento">
              {notes.length ? (
                <div className="space-y-2 pt-1">
                  {notes.map((item) => (
                    <div key={item.id} className="text-xs bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                      <div className="flex items-center justify-between mb-1 text-[10px] text-slate-500 font-bold">
                        <span>Nota de evolución</span>
                        <span>{new Date(item.created_at).toLocaleString('es-ES')}</span>
                      </div>
                      <p className="text-slate-700 leading-relaxed font-medium">{item.note}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-2">Sin notas de evolución registradas.</p>
              )}
            </ReportSection>

            {/* Firma médica al pie */}
            <div className="pt-16 mt-12 grid grid-cols-2 gap-12 text-center text-xs">
              <div className="border-t border-slate-300 pt-2">
                <span className="font-bold text-slate-800 block">Firma del Profesional Odontólogo</span>
                <span className="text-[10px] text-slate-400">Dr. Jean Pierre Salazar · Mantis Dental</span>
              </div>
              <div className="border-t border-slate-300 pt-2">
                <span className="font-bold text-slate-800 block">Firma o Consentimiento del Paciente</span>
                <span className="text-[10px] text-slate-400">{patient.name}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-20 text-center text-xs text-slate-400 font-medium">
            Por favor, selecciona un paciente de la lista para previsualizar el expediente completo.
          </div>
        )}
      </div>
    </section>
  );
}

function ReportSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="border-b border-slate-200 pb-1.5 text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-teal-600" />
        {title}
      </h3>
      <div>{children}</div>
    </section>
  );
}

