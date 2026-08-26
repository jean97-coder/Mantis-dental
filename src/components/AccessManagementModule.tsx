import { useEffect, useState } from 'react';
import { CheckCircle2, Lock, Plus, Save, ShieldCheck, UserPlus, Users } from 'lucide-react';
import type { ModuleId } from '../types/navigation';

interface UserAccess {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'odontologo';
  permissions: string[];
}

const API = 'http://localhost:4001/api/auth';
const modules: Array<{ id: ModuleId; label: string }> = [
  { id: 'pacientes', label: 'Pacientes' },
  { id: 'agenda', label: 'Agenda' },
  { id: 'presupuestos', label: 'Presupuestos' },
  { id: 'colegas', label: 'Colegas' },
  { id: 'finanzas', label: 'Finanzas' },
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'reportes', label: 'Reportes' },
  { id: 'inventario', label: 'Inventario' },
  { id: 'configuracion', label: 'Configuración' },
];

export default function AccessManagementModule({ token }: { token: string }) {
  const [users, setUsers] = useState<UserAccess[]>([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'odontologo' });
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetch(`${API}/users`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (response) => {
        if (!response.ok) throw new Error('No se pudieron cargar los usuarios');
        setUsers((await response.json()) as UserAccess[]);
      })
      .catch((loadError) =>
        setError(loadError instanceof Error ? loadError.message : 'Error al cargar usuarios'),
      );
  }, [token]);

  function toggle(userId: number, moduleId: string) {
    setUsers((current) =>
      current.map((user) =>
        user.id === userId
          ? {
              ...user,
              permissions: user.permissions.includes(moduleId)
                ? user.permissions.filter((item) => item !== moduleId)
                : [...user.permissions, moduleId],
            }
          : user,
      ),
    );
  }

  async function save(user: UserAccess) {
    try {
      const response = await fetch(`${API}/users/${user.id}/permissions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ permissions: user.permissions }),
      });
      if (!response.ok) throw new Error('No se pudieron guardar los permisos');
      setMessage(`Permisos del usuario ${user.name} actualizados exitosamente ✨`);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Error al guardar permisos');
    }
  }

  async function create() {
    setIsCreating(true);
    setError('');
    setMessage('');
    try {
      const response = await fetch(`${API}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(newUser),
      });
      const data = (await response.json()) as UserAccess | { error?: string };
      if (!response.ok)
        throw new Error(
          'error' in data && data.error ? data.error : 'No se pudo crear el usuario',
        );
      setUsers((current) => [...current, data as UserAccess]);
      setNewUser({ name: '', email: '', password: '', role: 'odontologo' });
      setMessage('Usuario creado y activado correctamente ✨');
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Error al crear usuario');
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <section className="mx-auto w-full max-w-7xl space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-teal-600">
          <ShieldCheck className="h-4.5 w-4.5" />
          <span className="text-xs font-extrabold uppercase tracking-widest text-teal-700">Seguridad & Roles</span>
        </div>
        <h1 className="mt-1 text-2xl font-black text-slate-900 tracking-tight">Gestión de Accesos y Permisos</h1>
        <p className="mt-0.5 text-xs text-slate-500 font-medium">
          Control granular de usuarios, credenciales y matriz de permisos por módulo del consultorio.
        </p>
      </div>

      {error && (
        <p className="rounded-2xl border border-rose-200 bg-rose-50/90 px-4 py-3 text-xs font-semibold text-rose-700">
          {error}
        </p>
      )}

      {message && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/90 px-4 py-3 text-xs font-bold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span>{message}</span>
        </div>
      )}

      {/* Formulario Crear Usuario */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-600">
          <UserPlus className="h-4 w-4 text-teal-600" />
          <span>Registrar Nuevo Usuario del Sistema</span>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void create();
          }}
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 items-end"
        >
          <label className="block">
            <span className="block text-[11px] font-bold text-slate-600 mb-1">Nombre completo *</span>
            <input
              required
              placeholder="Ej. Dra. Carmen Vera"
              value={newUser.name}
              onChange={(e) => setNewUser((c) => ({ ...c, name: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs outline-none focus:border-teal-500"
            />
          </label>

          <label className="block">
            <span className="block text-[11px] font-bold text-slate-600 mb-1">Correo electrónico *</span>
            <input
              required
              type="email"
              placeholder="carmen@mantisdental.com"
              value={newUser.email}
              onChange={(e) => setNewUser((c) => ({ ...c, email: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs outline-none focus:border-teal-500"
            />
          </label>

          <label className="block">
            <span className="block text-[11px] font-bold text-slate-600 mb-1">Contraseña (mín. 8) *</span>
            <input
              required
              minLength={8}
              type="password"
              placeholder="••••••••"
              value={newUser.password}
              onChange={(e) => setNewUser((c) => ({ ...c, password: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs outline-none focus:border-teal-500"
            />
          </label>

          <label className="block">
            <span className="block text-[11px] font-bold text-slate-600 mb-1">Rol de Acceso *</span>
            <select
              value={newUser.role}
              onChange={(e) => setNewUser((c) => ({ ...c, role: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs outline-none focus:border-teal-500"
            >
              <option value="odontologo">Odontólogo</option>
              <option value="admin">Administrador Total</option>
            </select>
          </label>

          <button
            type="submit"
            disabled={isCreating}
            className="rounded-xl bg-teal-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-teal-600/20 hover:bg-teal-700 transition-all disabled:opacity-60 cursor-pointer h-9 flex items-center justify-center gap-1.5"
          >
            <Plus className="h-4 w-4" />
            <span>{isCreating ? 'Creando...' : 'Crear Usuario'}</span>
          </button>
        </form>
      </div>

      {/* Matriz de Permisos */}
      <div className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-xs">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-teal-600" />
            <h2 className="font-black text-slate-900 text-xs uppercase tracking-wider">Matriz de Permisos por Módulo</h2>
          </div>
          <span className="text-xs text-slate-500 font-semibold">{users.length} usuarios registrados</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-xs">
            <thead className="bg-slate-50/80 text-[10px] uppercase tracking-wider text-slate-500 font-extrabold border-b border-slate-100">
              <tr>
                <th className="px-5 py-3.5">Usuario</th>
                <th className="px-5 py-3.5">Rol</th>
                {modules.map((module) => (
                  <th key={module.id} className="px-3 py-3.5 text-center">
                    {module.label}
                  </th>
                ))}
                <th className="px-5 py-3.5 text-right">Guardar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
              {users.map((user) => {
                const isAdmin = user.role === 'admin';

                return (
                  <tr key={user.id} className="hover:bg-teal-50/30 transition-colors">
                    <td className="px-5 py-4">
                      <strong className="block text-slate-900 text-xs font-bold">{user.name}</strong>
                      <span className="text-[11px] text-slate-400 font-normal">{user.email}</span>
                    </td>

                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-extrabold uppercase ${
                        isAdmin
                          ? 'bg-slate-900 text-white'
                          : 'bg-teal-50 text-teal-700 border border-teal-100'
                      }`}>
                        {isAdmin && <Lock className="h-3 w-3" />}
                        {user.role}
                      </span>
                    </td>

                    {modules.map((module) => (
                      <td key={module.id} className="px-3 py-4 text-center">
                        <input
                          type="checkbox"
                          disabled={isAdmin}
                          checked={isAdmin || user.permissions.includes(module.id)}
                          onChange={() => toggle(user.id, module.id)}
                          className="h-4 w-4 rounded-md accent-teal-600 transition-transform hover:scale-110 cursor-pointer disabled:cursor-not-allowed"
                        />
                      </td>
                    ))}

                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        disabled={isAdmin}
                        onClick={() => void save(user)}
                        className="inline-flex items-center gap-1 rounded-xl bg-teal-600 px-3 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-teal-700 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <Save className="h-3.5 w-3.5" />
                        <span>Guardar</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}