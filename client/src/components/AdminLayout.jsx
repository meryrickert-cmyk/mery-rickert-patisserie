import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import { useEffect } from 'react';

const links = [
  { to: '/admin/dashboard', icon: '📊', label: 'Dashboard' },
  { to: '/admin/pedidos',   icon: '📦', label: 'Pedidos' },
  { to: '/admin/productos', icon: '🧁', label: 'Productos' },
  { to: '/admin/contenido', icon: '✏️', label: 'Contenido' },
  { to: '/admin/insumos',  icon: '🧾', label: 'Insumos & Costos' },
];

export default function AdminLayout() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('mr_token');
    if (!token) { navigate('/admin/login'); return; }
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.exp * 1000 < Date.now()) { localStorage.removeItem('mr_token'); navigate('/admin/login'); }
    } catch { navigate('/admin/login'); }
  }, []);

  return (
    <div style={{ minHeight: '100svh', display: 'flex', background: 'var(--crema)', fontFamily: 'var(--sans)' }}>
      {/* Sidebar */}
      <aside style={{
        width: 220, flexShrink: 0, background: '#fff',
        borderRight: '1px solid var(--crema-oscuro)',
        display: 'flex', flexDirection: 'column', minHeight: '100svh',
        position: 'sticky', top: 0, height: '100svh',
      }}>
        {/* Logo */}
        <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid var(--crema-oscuro)' }}>
          <p style={{ fontFamily: 'var(--serif)', color: 'var(--bordeaux)', fontSize: 18, fontWeight: 400, margin: 0 }}>
            Mery Rickert
          </p>
          <p style={{ fontSize: 11, color: 'var(--texto-suave)', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '4px 0 0' }}>
            Panel admin
          </p>
        </div>

        {/* Nav */}
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

        {/* Footer sidebar */}
        <div style={{ padding: '16px 12px 20px', borderTop: '1px solid var(--crema-oscuro)' }}>
          <button onClick={() => { window.open('/', '_blank'); }} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 14px', borderRadius: 10, border: 'none', background: 'transparent', color: 'var(--texto-suave)', fontSize: 13, cursor: 'pointer', marginBottom: 4 }}>
            🌐 Ver sitio
          </button>
          <button onClick={() => { localStorage.removeItem('mr_token'); navigate('/'); }} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 14px', borderRadius: 10, border: 'none', background: 'transparent', color: 'var(--texto-suave)', fontSize: 13, cursor: 'pointer' }}>
            → Salir
          </button>
        </div>
      </aside>

      {/* Contenido */}
      <main style={{ flex: 1, overflowY: 'auto', minHeight: '100svh' }}>
        <Outlet />
      </main>
    </div>
  );
}
