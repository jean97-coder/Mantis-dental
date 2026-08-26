import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react';
import { Activity, FileText, ImagePlus, Pill, Printer, Search, ShieldAlert, Stethoscope, Trash2 } from 'lucide-react';
import TreatmentPlanModule from './TreatmentPlanModule';

interface Patient {
  id: number;
  name: string;
  dni: string;
}

interface HistorySheet {
  establishment: string;
  consultation_reason: string;
  current_illness: string;
  personal_history: Record<string, boolean>;
  family_history: Record<string, boolean>;
  vital_signs: Record<string, string>;
  stomatognathic_exam: Record<string, string>;
}

interface RecordItem {
  id: number;
  tooth_number: number;
  condition: string;
  recession: number;
  mobility: string;
  notes: string;
  surfaces: Record<string, boolean>;
}

interface Note {
  id: number;
  patient_id: number;
  note: string;
  created_at: string;
}

interface Diagnosis {
  id: number;
  cie10_code: string;
  description: string;
  patient_age: number | null;
  created_at: string;
}

interface PrescriptionMedicine {
  name: string;
  dose: string;
  frequency: string;
  observations: string;
  contraindications: string;
}

interface Prescription {
  id: number;
  medications: PrescriptionMedicine[];
  instructions: string;
  created_at: string;
}

interface DocumentTemplate {
  id: number;
  name: string;
  description: string;
  content: string;
}

interface DocumentItem {
  id: number;
  document_type: string;
  title: string;
  content: string;
  created_at: string;
}

interface PatientImage {
  id: number;
  title: string;
  image_url: string;
  image_type: string;
  created_at: string;
}

type Tab = 'ficha' | 'odontograma' | 'tratamientos' | 'notas' | 'diagnosticos' | 'recetas' | 'documentos' | 'imagenes';

const adultTeeth = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28, 48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];
const childTeeth = [55, 54, 53, 52, 51, 61, 62, 63, 64, 65, 85, 84, 83, 82, 81, 71, 72, 73, 74, 75];

const diagnosisCatalog = [
  ['K02', 'Caries dental'],
  ['K05', 'Gingivitis y enfermedad periodontal'],
  ['K04', 'Enfermedad de la pulpa dental'],
  ['K08', 'Pérdida de dientes'],
  ['K03', 'Desgaste de los dientes'],
  ['K00', 'Alteración del desarrollo dental'],
  ['K01', 'Diente incluido o impactado'],
  ['K06', 'Trastorno de la encía'],
  ['K09', 'Quiste de la región bucal'],
  ['K12', 'Estomatitis'],
] as const;

const personalHistoryOptions = ['Alergias', 'Asma', 'Diabetes', 'Hipertensión', 'Cardiopatías', 'Cirugías previas'];
const familyHistoryOptions = ['Hipertensión', 'Diabetes', 'Cardiopatías', 'Cáncer', 'Asma', 'Convulsiones'];
const commonMedicines = ['Ibuprofeno 400 mg', 'Paracetamol 500 mg', 'Amoxicilina 500 mg', 'Clindamicina 300 mg', 'Clorhexidina 0.12%'];

const emptyHistorySheet: HistorySheet = {
  establishment: 'Mantis Dental',
  consultation_reason: '',
  current_illness: '',
  personal_history: {},
  family_history: {},
  vital_signs: {},
  stomatognathic_exam: {},
};

const emptyMedicine: PrescriptionMedicine = {
  name: '',
  dose: '',
  frequency: '',
  observations: '',
  contraindications: '',
};

const API = 'http://localhost:4001/api/clinical-records';
const TEMPLATES_API = 'http://localhost:4001/api/templates/document-templates';

export default function ClinicalHistoryModule({ patient, onBack }: { patient: Patient; onBack: () => void }) {
  const [tab, setTab] = useState<Tab>('ficha');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [sheet, setSheet] = useState<HistorySheet>(emptyHistorySheet);
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [documentTemplates, setDocumentTemplates] = useState<DocumentTemplate[]>([]);
  const [images, setImages] = useState<PatientImage[]>([]);
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [dentition, setDentition] = useState<'adulto' | 'nino'>('adulto');
  const [note, setNote] = useState('');
  const [diagnosisSearch, setDiagnosisSearch] = useState('');
  const [selectedDiagnoses, setSelectedDiagnoses] = useState<Array<{ cie10_code: string; description: string }>>([]);
  const [documentTitle, setDocumentTitle] = useState('Constancia de atención');
  const [documentText, setDocumentText] = useState('Estimado/a {{nombre}}:\n\nEste documento corresponde a la fecha {{fecha}} y tiene una vigencia de {{dias}} días.');
  const [prescription, setPrescription] = useState<PrescriptionMedicine>(emptyMedicine);
  const [prescriptionList, setPrescriptionList] = useState<PrescriptionMedicine[]>([]);
  const [instructions, setInstructions] = useState('');
  const [imageTitle, setImageTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  async function request<T>(path: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API}/patient/${patient.id}/${path}`, options);
    const data = (await response.json()) as T & { error?: string };
    if (!response.ok) throw new Error(data.error || 'No se pudo completar la operación');
    return data;
  }

  useEffect(() => {
    async function load() {
      try {
        const [historyData, recordsData, notesData, diagnosisData, prescriptionData, documentData, imageData, templatesRes] = await Promise.all([
          request<HistorySheet | null>('history-sheet').catch(() => null),
          request<RecordItem[]>('odontogram').catch(() => []),
          request<Note[]>('notes').catch(() => []),
          request<Diagnosis[]>('diagnoses').catch(() => []),
          request<Prescription[]>('prescriptions').catch(() => []),
          request<DocumentItem[]>('documents').catch(() => []),
          request<PatientImage[]>('images').catch(() => []),
          fetch(TEMPLATES_API).then(async (response) => {
            if (!response.ok) return [] as DocumentTemplate[];
            return (await response.json()) as DocumentTemplate[];
          }),
        ]);

        setSheet(historyData ?? emptyHistorySheet);
        setRecords(recordsData);
        setNotes(notesData);
        setDiagnoses(diagnosisData);
        setPrescriptions(prescriptionData);
        setDocuments(documentData);
        setImages(imageData);
        setDocumentTemplates(templatesRes);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Error al cargar el expediente');
      }
    }

    void load();
  }, [patient.id]);

  const filteredDiagnoses = useMemo(() => {
    const query = diagnosisSearch.trim().toLowerCase();
    if (!query) return diagnosisCatalog;
    return diagnosisCatalog.filter(([code, description]) => code.toLowerCase().includes(query) || description.toLowerCase().includes(query));
  }, [diagnosisSearch]);

  const toothSet = dentition === 'adulto' ? adultTeeth : childTeeth;

  const selectedRecord = records.find((item) => item.tooth_number === selectedTooth) ?? {
    id: 0,
    tooth_number: selectedTooth ?? 0,
    condition: 'sano',
    recession: 0,
    mobility: 'Sin movilidad',
    notes: '',
    surfaces: {},
  };

  function setField<T extends keyof HistorySheet>(key: T, value: HistorySheet[T]) {
    setSheet((current) => ({ ...current, [key]: value }));
  }

  function updateHistoryObject(section: 'personal_history' | 'family_history' | 'vital_signs' | 'stomatognathic_exam', key: string, value: string | boolean) {
    setSheet((current) => ({
      ...current,
      [section]: {
        ...current[section],
        [key]: value,
      },
    }));
  }

  async function saveHistory() {
    try {
      const saved = await request<HistorySheet>('history-sheet', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sheet),
      });
      setSheet(saved);
      setMessage('Ficha clínica guardada correctamente');
      setError('');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'No se pudo guardar la ficha');
    }
  }

  async function saveToothRecord() {
    if (selectedTooth === null) return;
    try {
      const saved = await request<RecordItem>('odontogram', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...selectedRecord,
          tooth_number: selectedTooth,
        }),
      });
      setRecords((current) => [
        ...current.filter((item) => item.tooth_number !== saved.tooth_number),
        saved,
      ]);
      setMessage('Pieza dental guardada correctamente');
      setError('');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'No se pudo guardar la pieza');
    }
  }

  async function addNoteEntry(event: FormEvent) {
    event.preventDefault();
    if (!note.trim()) {
      setError('Escribe una nota antes de guardar');
      return;
    }

    try {
      const saved = await request<Note>('notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note }),
      });
      setNotes((current) => [saved, ...current]);
      setNote('');
      setMessage('Nota clínico-evolutiva guardada');
      setError('');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'No se pudo guardar la nota');
    }
  }

  function toggleDiagnosisSelection(code: string, description: string) {
    setSelectedDiagnoses((current) => {
      const exists = current.some((item) => item.cie10_code === code && item.description === description);
      if (exists) {
        return current.filter((item) => !(item.cie10_code === code && item.description === description));
      }
      return [...current, { cie10_code: code, description }];
    });
  }

  function removeDiagnosisFromSelection(code: string, description: string) {
    setSelectedDiagnoses((current) => current.filter((item) => !(item.cie10_code === code && item.description === description)));
  }

  async function saveDiagnosisBatch() {
    if (!selectedDiagnoses.length) {
      setError('Selecciona al menos un diagnóstico');
      return;
    }

    try {
      const saved = await request<Diagnosis[]>('diagnoses/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ diagnoses: selectedDiagnoses }),
      });
      setDiagnoses((current) => [...saved, ...current]);
      setSelectedDiagnoses([]);
      setMessage('Diagnósticos guardados correctamente');
      setError('');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'No se pudo guardar el diagnóstico');
    }
  }

  function addMedicineToList() {
    if (!prescription.name.trim()) return;
    setPrescriptionList((current) => [...current, prescription]);
    setPrescription(emptyMedicine);
  }

  function removeMedicineFromList(index: number) {
    setPrescriptionList((current) => current.filter((_, currentIndex) => currentIndex !== index));
  }

  async function savePrescription() {
    if (!prescriptionList.length && !prescription.name.trim()) {
      setError('Agrega al menos un medicamento para guardar la receta');
      return;
    }

    const medications = [...prescriptionList, ...(prescription.name.trim() ? [prescription] : [])];

    try {
      const saved = await request<Prescription>('prescriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ medications, instructions }),
      });
      setPrescriptions((current) => [saved, ...current]);
      setPrescriptionList([]);
      setPrescription(emptyMedicine);
      setInstructions('');
      setMessage('Receta guardada correctamente');
      setError('');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'No se pudo guardar la receta');
    }
  }

  async function saveDocument(event: FormEvent) {
    event.preventDefault();

    try {
      const saved = await request<DocumentItem>('documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document_type: 'Consulta',
          title: documentTitle,
          content: documentText
            .replaceAll('{{nombre}}', patient.name)
            .replaceAll('{{fecha}}', new Date().toLocaleDateString('es-ES'))
            .replaceAll('{{dias}}', '1'),
        }),
      });
      setDocuments((current) => [saved, ...current]);
      setMessage('Documento guardado correctamente');
      setError('');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'No se pudo guardar el documento');
    }
  }

  async function deleteDocument(documentId: number) {
    const confirmed = window.confirm('¿Deseas eliminar este documento del expediente?');
    if (!confirmed) return;

    try {
      const response = await fetch(`${API}/patient/${patient.id}/documents/${documentId}`, { method: 'DELETE' });
      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error || 'No se pudo eliminar el documento');
      }
      setDocuments((current) => current.filter((document) => document.id !== documentId));
      setMessage('Documento eliminado correctamente');
      setError('');
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'No se pudo eliminar el documento');
    }
  }

  function applyTemplate(template: DocumentTemplate) {
    setDocumentTitle(template.name);
    setDocumentText(template.content);
    setMessage(`Plantilla ${template.name} cargada`);
  }

  async function handleImageUpload(event: FormEvent) {
    event.preventDefault();
    if (!imageUrl) {
      setError('Debes seleccionar un archivo antes de subirlo');
      return;
    }

    try {
      const saved = await request<PatientImage>('images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: imageTitle || 'Imagen',
          image_url: imageUrl,
          image_type: 'clinical',
        }),
      });
      setImages((current) => [saved, ...current]);
      setImageTitle('');
      setImageUrl('');
      setMessage('Imagen guardada correctamente');
      setError('');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'No se pudo guardar la imagen');
    }
  }

  async function removeImage(imageId: number) {
    const confirmed = window.confirm('¿Deseas eliminar esta imagen del expediente?');
    if (!confirmed) return;

    try {
      const response = await fetch(`${API}/patient/${patient.id}/images/${imageId}`, { method: 'DELETE' });
      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error || 'No se pudo eliminar la imagen');
      }
      setImages((current) => current.filter((image) => image.id !== imageId));
      setMessage('Imagen eliminada correctamente');
      setError('');
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'No se pudo eliminar la imagen');
    }
  }

  function handleFileSelection(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => setImageUrl(String(reader.result));
    reader.readAsDataURL(file);
    setImageTitle(file.name);
  }

  const tabs: Array<{ id: Tab; label: string; icon: typeof Stethoscope }> = [
    { id: 'ficha', label: 'Ficha', icon: Stethoscope },
    { id: 'odontograma', label: 'Odontograma', icon: Activity },
    { id: 'tratamientos', label: 'Tratamientos', icon: Stethoscope },
    { id: 'notas', label: 'Notas', icon: FileText },
    { id: 'diagnosticos', label: 'Diagnósticos', icon: ShieldAlert },
    { id: 'recetas', label: 'Recetas', icon: Pill },
    { id: 'documentos', label: 'Documentos', icon: FileText },
    { id: 'imagenes', label: 'Imágenes', icon: ImagePlus },
  ];

  return (
    <section className="mx-auto max-w-6xl space-y-5">
      <header className="flex items-center justify-between">
        <div>
          <button type="button" onClick={onBack} className="text-xs font-bold text-slate-500 hover:text-teal-700">← Volver a pacientes</button>
          <h2 className="mt-2 text-2xl font-black text-slate-900">{patient.name}</h2>
          <p className="text-xs text-slate-500">DNI {patient.dni} · Historia clínica</p>
        </div>
        <span className="rounded-xl bg-teal-50 px-3 py-2 text-xs font-bold text-teal-700">Dr. Jean Pierre Salazar</span>
      </header>

      {error && <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
      {message && <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p>}

      <nav className="flex overflow-x-auto rounded-2xl border border-slate-200 bg-white px-2 pt-2 shadow-sm">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            type="button"
            key={id}
            onClick={() => setTab(id)}
            className={`inline-flex min-w-max items-center gap-2 border-b-2 px-3 py-3 text-xs font-bold ${tab === id ? 'border-teal-600 text-teal-700' : 'border-transparent text-slate-400'}`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </nav>

      {tab === 'ficha' && (
        <div className="space-y-4">
          <Panel title="Historia Clínica Ministerial">
            <div className="grid gap-4">
              <Field label="Establecimiento" value={sheet.establishment} onChange={(value) => setField('establishment', value)} />
              <Field label="Motivo de consulta" value={sheet.consultation_reason} onChange={(value) => setField('consultation_reason', value)} />
              <TextArea label="Enfermedad o problema actual" value={sheet.current_illness} onChange={(value) => setField('current_illness', value)} />
            </div>
          </Panel>

          <Panel title="Antecedentes personales y familiares">
            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <h4 className="mb-3 text-sm font-black text-slate-700">Personales</h4>
                <div className="grid gap-2 sm:grid-cols-2">
                  {personalHistoryOptions.map((option) => (
                    <label key={option} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2 text-sm text-slate-600">
                      <input
                        type="checkbox"
                        checked={Boolean(sheet.personal_history[option])}
                        onChange={(event) => updateHistoryObject('personal_history', option, event.target.checked)}
                        className="accent-teal-600"
                      />
                      {option}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="mb-3 text-sm font-black text-slate-700">Familiares</h4>
                <div className="grid gap-2 sm:grid-cols-2">
                  {familyHistoryOptions.map((option) => (
                    <label key={option} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2 text-sm text-slate-600">
                      <input
                        type="checkbox"
                        checked={Boolean(sheet.family_history[option])}
                        onChange={(event) => updateHistoryObject('family_history', option, event.target.checked)}
                        className="accent-teal-600"
                      />
                      {option}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </Panel>

          <Panel title="Signos vitales y examen estomatognático">
            <div className="grid gap-4 md:grid-cols-4">
              <Field label="Presión" value={sheet.vital_signs.pressure ?? ''} onChange={(value) => updateHistoryObject('vital_signs', 'pressure', value)} />
              <Field label="Pulso" value={sheet.vital_signs.pulse ?? ''} onChange={(value) => updateHistoryObject('vital_signs', 'pulse', value)} />
              <Field label="Temperatura" value={sheet.vital_signs.temperature ?? ''} onChange={(value) => updateHistoryObject('vital_signs', 'temperature', value)} />
              <Field label="Peso" value={sheet.vital_signs.weight ?? ''} onChange={(value) => updateHistoryObject('vital_signs', 'weight', value)} />
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <TextArea label="Examen estomatognático" value={sheet.stomatognathic_exam.findings ?? ''} onChange={(value) => updateHistoryObject('stomatognathic_exam', 'findings', value)} />
              <TextArea label="Observaciones clínicas" value={sheet.stomatognathic_exam.observations ?? ''} onChange={(value) => updateHistoryObject('stomatognathic_exam', 'observations', value)} />
            </div>
          </Panel>

          <div className="flex justify-end">
            <button type="button" onClick={() => void saveHistory()} className="rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-teal-700">
              Guardar ficha
            </button>
          </div>
        </div>
      )}

      {tab === 'tratamientos' && <TreatmentPlanModule patientId={patient.id} />}

      {tab === 'odontograma' && (
        <div className="grid gap-4 lg:grid-cols-[1.3fr_320px]">
          <Panel title="Odontograma clínico">
            <div className="mb-4 flex justify-between gap-3">
              <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
                <button type="button" onClick={() => setDentition('adulto')} className={`rounded-lg px-3 py-1.5 text-xs font-bold ${dentition === 'adulto' ? 'bg-teal-600 text-white' : 'text-slate-600'}`}>
                  Adulto
                </button>
                <button type="button" onClick={() => setDentition('nino')} className={`rounded-lg px-3 py-1.5 text-xs font-bold ${dentition === 'nino' ? 'bg-teal-600 text-white' : 'text-slate-600'}`}>
                  Niño
                </button>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                <span className="inline-block h-3 w-3 rounded-sm bg-rose-500" /> Patología
                <span className="inline-block h-3 w-3 rounded-sm bg-sky-500" /> Tratamiento
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
              {toothSet.map((tooth) => {
                const record = records.find((item) => item.tooth_number === tooth);
                const klass =
                  record?.condition === 'patologia'
                    ? 'bg-rose-500 text-white border-rose-500'
                    : record?.condition === 'tratamiento'
                      ? 'bg-sky-500 text-white border-sky-500'
                      : 'bg-white text-slate-700 border-slate-200';

                return (
                  <button
                    type="button"
                    key={tooth}
                    onClick={() => setSelectedTooth(tooth)}
                    className={`flex h-12 items-center justify-center rounded-lg border-2 text-xs font-black transition ${klass} ${selectedTooth === tooth ? 'ring-2 ring-teal-200' : ''}`}
                  >
                    {tooth}
                  </button>
                );
              })}
            </div>
          </Panel>

          <Panel title={selectedTooth ? `Pieza ${selectedTooth}` : 'Selecciona una pieza'}>
            {selectedTooth === null ? (
              <p className="text-sm text-slate-500">Selecciona una pieza del odontograma para registrar su estado clínico.</p>
            ) : (
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-600">
                  Estado
                  <select
                    value={selectedRecord.condition}
                    onChange={(event) => {
                      const next = event.target.value;
                      setRecords((current) => [
                        ...current.filter((item) => item.tooth_number !== selectedTooth),
                        { ...selectedRecord, condition: next },
                      ]);
                    }}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  >
                    <option value="sano">Sano</option>
                    <option value="patologia">Patología</option>
                    <option value="tratamiento">Tratamiento</option>
                  </select>
                </label>

                <Field label="Recesión (mm)" value={String(selectedRecord.recession)} onChange={(value) => {
                  const numericValue = Number(value || 0);
                  setRecords((current) => [
                    ...current.filter((item) => item.tooth_number !== selectedTooth),
                    { ...selectedRecord, recession: numericValue },
                  ]);
                }} />

                <label className="block text-xs font-bold text-slate-600">
                  Movilidad
                  <select
                    value={selectedRecord.mobility}
                    onChange={(event) => {
                      const next = event.target.value;
                      setRecords((current) => [
                        ...current.filter((item) => item.tooth_number !== selectedTooth),
                        { ...selectedRecord, mobility: next },
                      ]);
                    }}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  >
                    <option value="Sin movilidad">Sin movilidad</option>
                    <option value="Grado I">Grado I</option>
                    <option value="Grado II">Grado II</option>
                    <option value="Grado III">Grado III</option>
                  </select>
                </label>

                <TextArea label="Notas de la pieza" value={selectedRecord.notes} onChange={(value) => {
                  setRecords((current) => [
                    ...current.filter((item) => item.tooth_number !== selectedTooth),
                    { ...selectedRecord, notes: value },
                  ]);
                }} />

                <button type="button" onClick={() => void saveToothRecord()} className="w-full rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-bold text-white">
                  Guardar pieza
                </button>
              </div>
            )}
          </Panel>
        </div>
      )}

      {tab === 'notas' && (
        <div className="space-y-4">
          <Panel title="Notas de evolución">
            <form onSubmit={addNoteEntry} className="space-y-3">
              <TextArea label="Nueva nota" value={note} onChange={setNote} />
              <button type="submit" className="rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-bold text-white">
                Guardar nota
              </button>
            </form>
          </Panel>

          <Panel title="Historial clínico">
            {notes.length === 0 ? (
              <p className="text-sm text-slate-500">No hay notas registradas para este paciente.</p>
            ) : (
              <div className="space-y-3">
                {notes.map((item) => (
                  <article key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-teal-700">{new Date(item.created_at).toLocaleString('es-ES')}</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{item.note}</p>
                  </article>
                ))}
              </div>
            )}
          </Panel>
        </div>
      )}

      {tab === 'diagnosticos' && (
        <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
          <Panel title="Diagnósticos">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                value={diagnosisSearch}
                onChange={(event) => setDiagnosisSearch(event.target.value)}
                placeholder="Buscar código o texto"
                className="w-full rounded-lg border border-slate-200 py-2 pl-9 text-sm outline-none focus:border-teal-500"
              />
            </div>
            <div className="mt-3 max-h-80 space-y-1 overflow-y-auto pr-1">
              {filteredDiagnoses.map(([code, description]) => {
                const checked = selectedDiagnoses.some((item) => item.cie10_code === code && item.description === description);
                return (
                  <button
                    type="button"
                    key={code}
                    onClick={() => toggleDiagnosisSelection(code, description)}
                    className={`block w-full rounded-lg border p-3 text-left ${checked ? 'border-teal-500 bg-teal-50' : 'border-transparent hover:border-teal-200 hover:bg-teal-50'}`}
                  >
                    <strong className="mr-2 text-xs text-teal-700">{code}</strong>
                    <span className="text-sm text-slate-700">{description}</span>
                  </button>
                );
              })}
            </div>
          </Panel>

          <Panel title="Selección / guardado">
            <div className="space-y-2">
              {selectedDiagnoses.length === 0 ? (
                <p className="text-sm text-slate-500">No hay diagnósticos seleccionados.</p>
              ) : (
                selectedDiagnoses.map((item, index) => (
                  <div key={`${item.cie10_code}-${index}`} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
                    <span>
                      <strong className="mr-2 text-rose-700">{item.cie10_code}</strong>
                      {item.description}
                    </span>
                    <button type="button" onClick={() => removeDiagnosisFromSelection(item.cie10_code, item.description)} className="rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-bold text-rose-700">
                      Quitar
                    </button>
                  </div>
                ))
              )}
            </div>
            <button type="button" onClick={() => void saveDiagnosisBatch()} className="mt-4 w-full rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-bold text-white">
              Guardar diagnósticos
            </button>

            <div className="mt-6 border-t border-slate-200 pt-4">
              <h4 className="mb-3 text-sm font-black text-slate-700">Diagnósticos del paciente</h4>
              {diagnoses.length === 0 ? (
                <p className="text-sm text-slate-500">Aún no hay diagnósticos guardados.</p>
              ) : (
                <div className="space-y-2">
                  {diagnoses.map((item) => (
                    <div key={item.id} className="flex justify-between border-b border-slate-100 py-3 text-sm">
                      <span>
                        <strong className="mr-2 text-rose-700">{item.cie10_code}</strong>
                        {item.description}
                      </span>
                      <span className="text-xs text-slate-400">{new Date(item.created_at).toLocaleDateString('es-ES')}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Panel>
        </div>
      )}

      {tab === 'recetas' && (
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <Panel title="Prescripción médica">
            <div className="space-y-4">
              <label className="block text-xs font-bold text-slate-600">
                Fármaco
                <input
                  list="common-medicine-list"
                  value={prescription.name}
                  onChange={(event) => setPrescription((current) => ({ ...current, name: event.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-500"
                />
                <datalist id="common-medicine-list">
                  {commonMedicines.map((item) => (
                    <option key={item} value={item} />
                  ))}
                </datalist>
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Dosis" value={prescription.dose} onChange={(value) => setPrescription((current) => ({ ...current, dose: value }))} />
                <Field label="Frecuencia" value={prescription.frequency} onChange={(value) => setPrescription((current) => ({ ...current, frequency: value }))} />
                <Field label="Observaciones" value={prescription.observations} onChange={(value) => setPrescription((current) => ({ ...current, observations: value }))} />
                <Field label="Contraindicaciones" value={prescription.contraindications} onChange={(value) => setPrescription((current) => ({ ...current, contraindications: value }))} />
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={addMedicineToList} className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700">
                  Agregar medicamento
                </button>
                <button type="button" onClick={() => void savePrescription()} className="rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-bold text-white">
                  Guardar receta
                </button>
                <button type="button" onClick={() => window.print()} className="rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-700">
                  Imprimir
                </button>
              </div>

              <div className="space-y-2">
                {prescriptionList.length === 0 ? (
                  <p className="text-sm text-slate-500">Todavía no has agregado ningún medicamento.</p>
                ) : (
                  prescriptionList.map((medicine, index) => (
                    <div key={`${medicine.name}-${index}`} className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <strong>{medicine.name}</strong>
                          <div className="mt-1">Dosis: {medicine.dose}</div>
                          <div>Frecuencia: {medicine.frequency}</div>
                          {medicine.observations && <div>Observaciones: {medicine.observations}</div>}
                        </div>
                        <button type="button" onClick={() => removeMedicineFromList(index)} className="rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-[10px] font-bold text-rose-700">
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="border-t border-slate-200 pt-4">
                <h4 className="mb-3 text-sm font-black text-slate-700">Recetas guardadas</h4>
                {prescriptions.length === 0 ? (
                  <p className="text-sm text-slate-500">No hay recetas guardadas para este paciente.</p>
                ) : (
                  <div className="space-y-3">
                    {prescriptions.map((item) => (
                      <div key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <div className="text-[11px] font-bold uppercase tracking-wide text-teal-700">{new Date(item.created_at).toLocaleDateString('es-ES')}</div>
                        <ul className="mt-2 space-y-1 text-sm text-slate-700">
                          {item.medications.map((medicine, index) => (
                            <li key={`${medicine.name}-${index}`}>
                              {medicine.name} · {medicine.dose} · {medicine.frequency}
                            </li>
                          ))}
                        </ul>
                        {item.instructions && <p className="mt-2 text-sm text-slate-600">{item.instructions}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <TextArea label="Indicaciones generales" value={instructions} onChange={setInstructions} />
            </div>
          </Panel>

          <Panel title="Vista previa institucional">
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <h3 className="text-center text-lg font-black text-teal-700">MANTIS DENTAL</h3>
              <p className="text-center text-xs text-slate-500">Dr. Jean Pierre Salazar · Odontólogo</p>
              <hr className="my-4" />
              {prescriptionList.length === 0 ? (
                <p className="text-sm text-slate-500">Agrega medicamentos para previsualizar la receta.</p>
              ) : (
                <div className="space-y-2 text-left text-sm text-slate-700">
                  {prescriptionList.map((medicine, index) => (
                    <div key={`${medicine.name}-${index}`} className="rounded-lg bg-slate-50 p-3">
                      <strong>{medicine.name}</strong>
                      <div className="mt-1">Dosis: {medicine.dose}</div>
                      <div>Frecuencia: {medicine.frequency}</div>
                      {medicine.observations && <div>Observaciones: {medicine.observations}</div>}
                    </div>
                  ))}
                </div>
              )}
              {instructions && <p className="mt-4 whitespace-pre-wrap text-sm text-slate-700">{instructions}</p>}
            </div>
          </Panel>
        </div>
      )}

      {tab === 'documentos' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel title="Plantillas predefinidas">
            <div className="space-y-3">
              {documentTemplates.length === 0 ? (
                <p className="text-sm text-slate-500">No hay plantillas disponibles aún.</p>
              ) : (
                documentTemplates.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => applyTemplate(template)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-left transition hover:border-teal-300 hover:bg-teal-50"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <strong className="text-sm font-black text-slate-800">{template.name}</strong>
                      <span className="text-[10px] uppercase tracking-wide text-teal-700">Predeterminada</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{template.description}</p>
                  </button>
                ))
              )}
            </div>
          </Panel>

          <Panel title="Documento personalizado">
            <form onSubmit={saveDocument} className="space-y-3">
              <Field label="Título" value={documentTitle} onChange={setDocumentTitle} />
              <TextArea label="Contenido ({{nombre}}, {{fecha}}, {{dias}})" value={documentText} onChange={setDocumentText} />
              <button type="submit" className="rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-bold text-white">
                Guardar documento
              </button>
            </form>
          </Panel>

          <Panel title="Vista previa e impresión">
            <div className="document-print min-h-64 border border-slate-200 p-6">
              <h3 className="text-center text-lg font-black text-teal-700">MANTIS DENTAL</h3>
              <p className="text-center text-xs text-slate-500">Dr. Jean Pierre Salazar</p>
              <hr className="my-4" />
              <h4 className="font-bold">{documentTitle}</h4>
              <p className="mt-4 whitespace-pre-wrap text-sm text-slate-700">
                {documentText.replaceAll('{{nombre}}', patient.name).replaceAll('{{fecha}}', new Date().toLocaleDateString('es-ES')).replaceAll('{{dias}}', '1')}
              </p>
              <button type="button" onClick={() => window.print()} className="mt-4 rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold print:hidden">
                <Printer className="mr-1 inline h-3 w-3" />
                Imprimir
              </button>
            </div>
          </Panel>

          <Panel title="Documentos guardados">
            {documents.length === 0 ? (
              <p className="text-sm text-slate-500">Todavía no hay documentos asociados.</p>
            ) : (
              <div className="space-y-3">
                {documents.map((item) => (
                  <article key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <strong>{item.title}</strong>
                        <p className="mt-1 text-[11px] uppercase tracking-wide text-slate-500">{item.document_type}</p>
                      </div>
                      <button type="button" onClick={() => void deleteDocument(item.id)} className="rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-[10px] font-bold text-rose-700">
                        Eliminar
                      </button>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-slate-700">{item.content}</p>
                  </article>
                ))}
              </div>
            )}
          </Panel>
        </div>
      )}

      {tab === 'imagenes' && (
        <div className="space-y-4">
          <Panel title="Subir imagen o radiografía">
            <form onSubmit={handleImageUpload} className="flex flex-wrap items-end gap-3">
              <Field label="Título" value={imageTitle} onChange={setImageTitle} />
              <label className="block text-xs font-bold text-slate-600">
                Archivo
                <input type="file" accept="image/jpeg,image/png,application/pdf,.dcm" onChange={handleFileSelection} className="mt-1 block text-xs" />
              </label>
              <button type="submit" className="rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-bold text-white">
                Subir imagen
              </button>
            </form>
          </Panel>

          <Panel title="Galería clínica del paciente">
            {images.length === 0 ? (
              <p className="text-sm text-slate-500">No hay imágenes asociadas a este expediente.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {images.map((item) => (
                  <figure key={item.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    {item.image_url.startsWith('data:') || item.image_url.startsWith('/uploads/') ? (
                      <img
                        src={item.image_url.startsWith('/uploads/') ? `http://localhost:4001${item.image_url}` : item.image_url}
                        alt={item.title}
                        className="h-40 w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-40 items-center justify-center bg-slate-50 text-xs font-bold text-slate-500">{item.image_type}</div>
                    )}
                    <figcaption className="flex items-center justify-between gap-2 p-3 text-sm font-bold">
                      <span>{item.title}</span>
                      <button type="button" onClick={() => void removeImage(item.id)} className="rounded-md border border-rose-200 bg-rose-50 p-2 text-rose-600" aria-label={`Eliminar ${item.title}`}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </figcaption>
                  </figure>
                ))}
              </div>
            )}
          </Panel>
        </div>
      )}
    </section>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-sm font-black text-slate-800">{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block text-xs font-bold text-slate-600">
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-500"
      />
    </label>
  );
}

function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block text-xs font-bold text-slate-600">
      {label}
      <textarea
        rows={5}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-500"
      />
    </label>
  );
}
