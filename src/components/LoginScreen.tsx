import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from 'lucide-react';

interface LoginResponse { token: string; user: { id: number; email: string; name: string; role: 'admin' | 'odontologo'; permissions: string[] } }
const API = 'http://localhost:4001/api/auth/login';

function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const particles = Array.from({ length: 56 }, () => ({
      x: Math.random(), y: Math.random(), radius: Math.random() * 1.7 + 0.5,
      speedX: (Math.random() - 0.5) * 0.00013, speedY: (Math.random() - 0.5) * 0.00013,
      alpha: Math.random() * 0.42 + 0.12,
    }));
    let animationFrame = 0;
    const resize = () => { canvas.width = window.innerWidth * devicePixelRatio; canvas.height = window.innerHeight * devicePixelRatio; context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0); };
    const draw = () => {
      const width = window.innerWidth; const height = window.innerHeight;
      context.clearRect(0, 0, width, height);
      particles.forEach((particle) => {
        if (!reducedMotion) { particle.x = (particle.x + particle.speedX + 1) % 1; particle.y = (particle.y + particle.speedY + 1) % 1; }
        context.beginPath(); context.arc(particle.x * width, particle.y * height, particle.radius, 0, Math.PI * 2);
        context.fillStyle = `rgba(110, 224, 175, ${particle.alpha})`; context.fill();
      });
      particles.forEach((first, index) => particles.slice(index + 1).forEach((second) => {
        const distance = Math.hypot((first.x - second.x) * width, (first.y - second.y) * height);
        if (distance < 145) { context.beginPath(); context.moveTo(first.x * width, first.y * height); context.lineTo(second.x * width, second.y * height); context.strokeStyle = `rgba(85, 192, 159, ${0.11 * (1 - distance / 145)})`; context.stroke(); }
      }));
      animationFrame = requestAnimationFrame(draw);
    };
    resize(); draw(); window.addEventListener('resize', resize);
    return () => { cancelAnimationFrame(animationFrame); window.removeEventListener('resize', resize); };
  }, []);

  return <canvas ref={canvasRef} className="login-particles" aria-hidden="true" />;
}

export default function LoginScreen({ onLogin }: { onLogin: (session: LoginResponse) => void }) {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [error, setError] = useState(''); const [loading, setLoading] = useState(false); const [showPassword, setShowPassword] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError('');
    try {
      const response = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
      const data = await response.json() as LoginResponse | { error?: string };
      if (!response.ok) throw new Error('error' in data && data.error ? data.error : 'No se pudo iniciar sesión');
      localStorage.setItem('mantis-session', JSON.stringify(data)); onLogin(data as LoginResponse);
    } catch (loginError) { setError(loginError instanceof Error ? loginError.message : 'Error al iniciar sesión'); }
    finally { setLoading(false); }
  }

  return <main className="login-shell"><ParticleField /><div className="login-ambient login-ambient-one" /><div className="login-ambient login-ambient-two" />
    <section className="login-card" aria-labelledby="login-title">
      <div className="login-brand">
        <div className="login-logo-wrap">
          <img src="/mantis-logo.svg" alt="Mantis Dental" />
        </div>
        <p className="login-kicker">SISTEMA ODONTOLÓGICO CLÍNICO</p>
        <h1 id="login-title">Consultorio Mantis Dental</h1>
        <p className="login-subtitle">Gestión clínica, odontogramas y agenda en una plataforma moderna y segura.</p>
      </div>
      <form onSubmit={submit} className="login-form">
        <label>
          <span>Correo electrónico</span>
          <div className="login-input">
            <Mail aria-hidden="true" />
            <input
              required
              type="email"
              autoComplete="email"
              placeholder="doctor@mantisdental.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
        </label>
        <label>
          <span>Contraseña</span>
          <div className="login-input">
            <LockKeyhole aria-hidden="true" />
            <input
              required
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Ingresa tu contraseña"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <button
              type="button"
              className="password-toggle"
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              onClick={() => setShowPassword((visible) => !visible)}
            >
              {showPassword ? <EyeOff /> : <Eye />}
            </button>
          </div>
        </label>
        {error && <p className="login-error" role="alert">{error}</p>}
        <button disabled={loading} type="submit" className="login-submit cursor-pointer">
          {loading ? 'Validando credenciales...' : 'Iniciar Sesión Clínica'}
          {!loading && <ArrowRight aria-hidden="true" />}
        </button>
      </form>
      <div className="login-footer">
        <ShieldCheck aria-hidden="true" />
        <span>Conexión cifrada de grado médico · Acceso seguro</span>
        <i />
      </div>
    </section>
    <p className="login-copyright">MANTIS DENTAL <span>•</span> GESTIÓN INTELIGENTE & ESPECIALIDADES ODONTOLÓGICAS</p>
  </main>;
}

