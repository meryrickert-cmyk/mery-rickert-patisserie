import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/index.js';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      const { data } = await api.post('/auth/admin/login', { email, password });
      localStorage.setItem('mr_token', data.token);
      navigate('/admin/dashboard');
    } catch {
      setError('Email o contraseña incorrectos');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--crema)' }}>
      <div className="w-full max-w-sm px-4">
        <div className="text-center mb-8">
          <h1 style={{ fontFamily: 'var(--serif)', color: 'var(--bordeaux)', fontSize: 32, fontWeight: 400 }}>Panel Admin</h1>
          <p style={{ color: 'var(--texto-suave)', fontSize: 14 }} className="mt-1">Mery Rickert Patisserie</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 bg-white p-8" style={{ border: '1px solid var(--crema-oscuro)' }}>
          <div>
            <label style={{ color: 'var(--texto-suave)', fontSize: 12, letterSpacing: '0.1em' }} className="block uppercase mb-1">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              placeholder="tu@email.com" autoComplete="email"
              className="w-full px-4 py-2.5 text-sm outline-none"
              style={{ border: '1px solid var(--crema-oscuro)', color: 'var(--texto)' }}
            />
          </div>
          <div>
            <label style={{ color: 'var(--texto-suave)', fontSize: 12, letterSpacing: '0.1em' }} className="block uppercase mb-1">Contraseña</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
              autoComplete="current-password"
              className="w-full px-4 py-2.5 text-sm outline-none"
              style={{ border: '1px solid var(--crema-oscuro)', color: 'var(--texto)' }}
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit"
            className="w-full py-3 text-sm tracking-widest uppercase transition"
            style={{ background: 'var(--bordeaux)', color: '#FAF7F2' }}>
            Ingresar
          </button>
        </form>
        <button onClick={() => window.history.back()} className="block text-center mt-4 text-sm"
          style={{ color: 'var(--texto-suave)' }}>
          ← Volver al sitio
        </button>
      </div>
    </div>
  );
}
