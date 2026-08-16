import { NavLink, useNavigate, Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';

const links = [
  { to: '/admin/dashboard', icon: '📊', label: 'Dashboard' },
  { to: '/admin/pedidos',   icon: '📦', label: 'Pedidos' },
  { to: '/admin/productos', icon: '🧁', label: 'Productos' },
  { to: '/admin/contenido', icon: '✏️', label: 'Contenido' },
  { to: '/admin/insumos',  icon: '🧾', label: 'Insumos' },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem('mr_token');
    if (!token) { navigate('/admin/login'); return; }
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.exp * 1000 < Date.now()) { localStorage.removeItem('mr_token'); navigate('/admin/login'); }
    } catch { navigate('/admin/login'); }
  }, []);

  const currentLabel = links.find(l => location.pathname.startsWith(l.to))?.label ?? 'Admin';

  return (
    <div className="admin-shell">
      {/* ── Sidebar desktop ── */}
      <aside className="admin-sidebar">
        <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid var(--crema-oscuro)' }}>
          <p style={{ fontFamily: 'var(--serif)', color: 'var(--bordeaux)', fontSize: 18, fontWeight: 400, margin: 0 }}>
            Mery Rickert
          </p>
          <p style={{ fontSize: 11, color: 'var(--texto-suave)', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '4px 0 0' }}>
            Panel admin
          </p>
        </div>

        <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {links.map(l => (
            <NavLink key={l.to} to={l.to} style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 14px', borderRadius: 10, textDecoration: 'none',
              fontSize: 14, transition: 'all 0.15s',
              background: isActive ? 'var(--crema)' : 'transparent',
              color: isActive ? 'var(--bordeaux)' : 'var(--texto-suave)',
              fontWeight: isActive ? 500 : 400,
            })}>
              <span style={{ fontSize: 16 }}>{l.icon}</span>
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: '16px 12px 20px', borderTop: '1px solid var(--crema-oscuro)' }}>
          <button onClick={() => window.open('/', '_blank')} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 14px', borderRadius: 10, border: 'none', background: 'transparent', color: 'var(--texto-suave)', fontSize: 13, cursor: 'pointer', marginBottom: 4 }}>
            🌐 Ver sitio
          </button>
          <button onClick={() => { localStorage.removeItem('mr_token'); navigate('/'); }} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 14px', borderRadius: 10, border: 'none', background: 'transparent', color: 'var(--texto-suave)', fontSize: 13, cursor: 'pointer' }}>
            → Salir
          </button>
        </div>
      </aside>

      {/* ── Contenido ── */}
      <main className="admin-main">
        {/* Top bar mobile */}
        <div className="admin-topbar">
          <span style={{ fontFamily: 'var(--serif)', color: 'var(--bordeaux)', fontSize: 16 }}>
            {currentLabel}
          </span>
          <a href="/" target="_blank" rel="noreferrer" style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
            borderRadius: 20, border: '1.5px solid var(--crema-oscuro)',
            color: 'var(--texto-suave)', fontSize: 12, textDecoration: 'none',
          }}>
            🌐 Ver sitio
          </a>
        </div>
        <Outlet />
      </main>

      {/* ── Bottom nav mobile ── */}
      <nav className="admin-bottomnav">
        {links.map(l => {
          const isActive = location.pathname.startsWith(l.to);
          return (
            <NavLink key={l.to} to={l.to} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, textDecoration: 'none', flex: 1, padding: '8px 4px 6px', color: isActive ? 'var(--bordeaux)' : 'var(--texto-suave)' }}>
              <span style={{ fontSize: 20 }}>{l.icon}</span>
              <span style={{ fontSize: 10, fontWeight: isActive ? 600 : 400, letterSpacing: '0.02em' }}>{l.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
