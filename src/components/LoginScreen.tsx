import { useState, type FormEvent } from 'react';
import { LockKeyhole, Mail, ShieldCheck } from 'lucide-react';

interface LoginResponse { token: string; user: { id: number; email: string; name: string; role: 'admin' | 'odontologo'; permissions: string[] } }
const API = 'http://localhost:4001/api/auth/login';

export default function LoginScreen({ onLogin }: { onLogin: (session: LoginResponse) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError('');
    try {
      const response = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
      const data = await response.json() as LoginResponse | { error?: string };
      if (!response.ok) throw new Error('error' in data && data.error ? data.error : 'No se pudo iniciar sesión');
      localStorage.setItem('mantis-session', JSON.stringify(data));
      onLogin(data as LoginResponse);
    } catch (loginError) { setError(loginError instanceof Error ? loginError.message : 'Error al iniciar sesión'); }
    finally { setLoading(false); }
  }

  return <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-8"><div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl"><div className="mb-8 text-center"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-600 text-3xl text-white">🦷</div><h1 className="mt-5 text-2xl font-black tracking-tight text-slate-900">MANTIS DENTAL</h1><p className="mt-2 text-sm text-slate-500">Acceso al consultorio clínico</p></div><form onSubmit={submit} className="space-y-5"><label className="block"><span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">Correo electrónico</span><div className="relative"><Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100" /></div></label><label className="block"><span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">Contraseña</span><div className="relative"><LockKeyhole className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input required type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100" /></div></label>{error && <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}<button disabled={loading} type="submit" className="w-full rounded-xl bg-teal-600 py-3 text-sm font-bold text-white shadow-sm hover:bg-teal-700 disabled:opacity-60">{loading ? 'Validando...' : 'Iniciar sesión'}</button></form><p className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400"><ShieldCheck className="h-4 w-4 text-teal-600" />Acceso protegido</p></div></main>;
}