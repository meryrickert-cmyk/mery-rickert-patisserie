import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/index.js';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const { data } = await api.post('/auth/admin/login', { email, password });
      localStorage.setItem('mr_token', data.token);
      navigate('/admin/dashboard');
    } catch {
      setError('Email o contraseña incorrectos');
    } finally { setLoading(false); }
  }

  const inp = {
    width: '100%', padding: '13px 16px', fontSize: 14,
    border: 'none', borderBottom: '1.5px solid var(--crema-oscuro)',
    background: 'transparent', color: 'var(--texto)', outline: 'none',
    fontFamily: 'var(--sans)', boxSizing: 'border-box', transition: 'border-color 0.2s',
  };

  return (
    <div style={{ minHeight: '100svh', display: 'flex', background: 'var(--crema)' }}>
      {/* Panel izquierdo — bordeaux */}
      <div style={{
        width: '42%', background: 'var(--bordeaux-oscuro)',
        display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
        padding: '64px 56px', flexShrink: 0,
      }} className="admin-login-panel">
        <p style={{ color: 'rgba(250,247,242,0.35)', fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 16 }}>
          Panel de administración
        </p>
        <h1 style={{ fontFamily: 'var(--serif)', color: '#FAF7F2', fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 300, lineHeight: 1.1, margin: 0 }}>
          Mery Rickert<br />Patisserie
        </h1>
        <div style={{ width: 32, height: 1, background: 'rgba(250,247,242,0.2)', margin: '32px 0' }} />
        <a href="/" style={{ color: 'rgba(250,247,242,0.4)', fontSize: 12, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, transition: 'color 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.color = 'rgba(250,247,242,0.8)'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(250,247,242,0.4)'}>
          ← Ver sitio
        </a>
      </div>

      {/* Panel derecho — formulario */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 32px' }}>
        <div style={{ width: '100%', maxWidth: 360 }}>
          <h2 style={{ fontFamily: 'var(--serif)', color: 'var(--texto)', fontSize: 28, fontWeight: 300, marginBottom: 8 }}>
            Bienvenida
          </h2>
          <p style={{ color: 'var(--texto-suave)', fontSize: 14, marginBottom: 40 }}>
            Ingresá con tu cuenta de administrador
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            <div>
              <label style={{ fontSize: 11, color: 'var(--texto-suave)', letterSpacing: '0.12em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
                Email
              </label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                placeholder="tu@email.com" autoComplete="email" style={inp}
                onFocus={e => e.target.style.borderBottomColor = 'var(--bordeaux)'}
                onBlur={e => e.target.style.borderBottomColor = 'var(--crema-oscuro)'} />
            </div>

            <div>
              <label style={{ fontSize: 11, color: 'var(--texto-suave)', letterSpacing: '0.12em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
                Contraseña
              </label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                autoComplete="current-password" style={inp}
                onFocus={e => e.target.style.borderBottomColor = 'var(--bordeaux)'}
                onBlur={e => e.target.style.borderBottomColor = 'var(--crema-oscuro)'} />
            </div>

            {error && (
              <p style={{ color: '#c0392b', fontSize: 13, margin: 0 }}>{error}</p>
            )}

            <button type="submit" disabled={loading} style={{
              padding: '14px', border: 'none', background: 'var(--bordeaux)',
              color: '#FAF7F2', fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase',
              cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.7 : 1,
              fontFamily: 'var(--sans)', transition: 'opacity 0.2s',
              marginTop: 8,
            }}>
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
