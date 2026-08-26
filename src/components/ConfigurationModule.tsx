import { useState, type ReactNode } from 'react';
import { CheckCircle2, FilePlus, Package, Save, Settings } from 'lucide-react';

const API = 'http://localhost:4001/api/templates';

export default function ConfigurationModule() {
  const [template, setTemplate] = useState({ name: '', description: '', content: '' });
  const [pack, setPack] = useState({ name: '', description: '', item: '', price: '' });
  const [message, setMessage] = useState('');
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [isSavingPack, setIsSavingPack] = useState(false);

  async function saveTemplate() {
    setIsSavingTemplate(true);
    try {
      const response = await fetch(`${API}/document-templates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template),
      });
      if (!response.ok) {
        setMessage('No se pudo guardar la plantilla.');
        return;
      }
      setTemplate({ name: '', description: '', content: '' });
      setMessage('Plantilla documental guardada exitosamente ✨');
    } catch {
      setMessage('Error de conexión al guardar plantilla.');
    } finally {
      setIsSavingTemplate(false);
    }
  }

  async function savePackage() {
    setIsSavingPack(true);
    try {
      const response = await fetch(`${API}/treatment-packages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: pack.name,
          description: pack.description,
          items: [{ description: pack.item, quantity: 1, unit_price: Number(pack.price) }],
        }),
      });
      if (!response.ok) {
        setMessage('No se pudo guardar el paquete.');
        return;
      }
      setPack({ name: '', description: '', item: '', price: '' });
      setMessage('Paquete odontológico guardado exitosamente ✨');
    } catch {
      setMessage('Error de conexión al guardar paquete.');
    } finally {
      setIsSavingPack(false);
    }
  }

  return (
    <section className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-teal-600">
          <Settings className="h-4.5 w-4.5" />
          <span className="text-xs font-extrabold uppercase tracking-widest text-teal-700">Parámetros del Sistema</span>
        </div>
        <h1 className="mt-1 text-2xl font-black text-slate-900 tracking-tight">Configuración & Plantillas</h1>
        <p className="mt-0.5 text-xs text-slate-500 font-medium">
          Personaliza certificados de descanso, recetas clínicas, consentimientos y paquetes de tratamiento.
        </p>
      </div>

      {message && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/90 px-4 py-3 text-xs font-bold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span>{message}</span>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Panel Plantilla */}
        <Panel
          title="Nueva Plantilla Documental"
          subtitle="Certificados, recetas y consentimientos informados"
          icon={<FilePlus className="h-5 w-5 text-teal-600" />}
        >
          <Field
            label="Nombre de la plantilla *"
            placeholder="Ej. Certificado de Reposo Odontológico"
            value={template.name}
            onChange={(value) => setTemplate({ ...template, name: value })}
          />
          <Field
            label="Descripción por defecto"
            placeholder="Ej. Emitido tras cirugía o endodoncia"
            value={template.description}
            onChange={(value) => setTemplate({ ...template, description: value })}
          />
          <TextArea
            label="Cuerpo del documento (Variables admitidas: {{nombre}}, {{dni}}, {{fecha}}, {{dias}})"
            placeholder="Certifico que el/la paciente {{nombre}} con DNI {{dni}} asistió a consulta y requiere reposo de {{dias}} días..."
            value={template.content}
            onChange={(value) => setTemplate({ ...template, content: value })}
          />
          <button
            type="button"
            disabled={isSavingTemplate || !template.name.trim()}
            onClick={() => void saveTemplate()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-teal-600/20 hover:bg-teal-700 transition-all disabled:opacity-60 cursor-pointer"
          >
            <Save className="h-4 w-4" />
            <span>{isSavingTemplate ? 'Guardando...' : 'Guardar Plantilla'}</span>
          </button>
        </Panel>

        {/* Panel Paquete */}
        <Panel
          title="Nuevo Paquete o Tratamiento Frecuente"
          subtitle="Añade procedimientos para cotizaciones rápidas"
          icon={<Package className="h-5 w-5 text-teal-600" />}
        >
          <Field
            label="Nombre del paquete / tratamiento *"
            placeholder="Ej. Profilaxis + Aplicación de Flúor"
            value={pack.name}
            onChange={(value) => setPack({ ...pack, name: value })}
          />
          <Field
            label="Descripción clínica"
            placeholder="Ej. Limpieza ultrasónica profunda y pulido coronario"
            value={pack.description}
            onChange={(value) => setPack({ ...pack, description: value })}
          />
          <Field
            label="Ítem o material incluido"
            placeholder="Ej. Profilaxis dental con pasta abrasiva y flúor neutro"
            value={pack.item}
            onChange={(value) => setPack({ ...pack, item: value })}
          />
          <Field
            label="Precio estándar ($) *"
            placeholder="Ej. 45.00"
            type="number"
            value={pack.price}
            onChange={(value) => setPack({ ...pack, price: value })}
          />
          <button
            type="button"
            disabled={isSavingPack || !pack.name.trim() || !pack.price}
            onClick={() => void savePackage()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-teal-600/20 hover:bg-teal-700 transition-all disabled:opacity-60 cursor-pointer"
          >
            <Save className="h-4 w-4" />
            <span>{isSavingPack ? 'Guardando...' : 'Guardar Paquete'}</span>
          </button>
        </Panel>
      </div>
    </section>
  );
}

function Panel({
  title,
  subtitle,
  icon,
  children,
}: {
  title: string;
  subtitle: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="space-y-4 rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-teal-50 border border-teal-100">
            {icon}
          </div>
          <div>
            <h2 className="font-black text-slate-900 text-sm">{title}</h2>
            <p className="text-xs text-slate-500 font-medium">{subtitle}</p>
          </div>
        </div>
        <div className="mt-4 space-y-3.5">{children}</div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block text-xs font-bold text-slate-700">
      <span className="block mb-1">{label}</span>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-normal text-slate-800 outline-none transition focus:border-teal-500 focus:ring-3 focus:ring-teal-500/10"
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block text-xs font-bold text-slate-700">
      <span className="block mb-1">{label}</span>
      <textarea
        rows={5}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full resize-none rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-normal text-slate-800 outline-none transition focus:border-teal-500 focus:ring-3 focus:ring-teal-500/10"
      />
    </label>
  );
}

