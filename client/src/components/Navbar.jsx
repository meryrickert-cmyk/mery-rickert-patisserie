import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import CartSidebar from './CartSidebar';

export default function Navbar() {
  const { cantidad } = useCart();
  const [cartOpen, setCartOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 40); }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 40,
        height: 56,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 16px',
        background: scrolled ? 'rgba(250,247,242,0.96)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled ? '1px solid var(--crema-oscuro)' : 'none',
        transition: 'background 0.3s, border 0.3s',
      }}>
        {/* Logo — solo cuando está scrolleado */}
        <a href="/" style={{
          fontFamily: 'var(--serif)', fontSize: 17, fontWeight: 400,
          color: 'var(--bordeaux)', textDecoration: 'none',
          opacity: scrolled ? 1 : 0, pointerEvents: scrolled ? 'auto' : 'none',
          transition: 'opacity 0.3s',
        }}>
          Mery Rickert
        </a>

        {/* Derecha: carrito + engranaje */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
          <button onClick={() => setCartOpen(true)} style={{
            position: 'relative',
            width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
            border: scrolled ? '1.5px solid var(--bordeaux)' : '1.5px solid rgba(255,255,255,0.55)',
            background: scrolled ? 'transparent' : 'rgba(255,255,255,0.15)',
            backdropFilter: 'blur(4px)',
            color: scrolled ? 'var(--bordeaux)' : '#FAF7F2',
            fontSize: 17, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.3s',
          }}>
            🛒
            {cantidad > 0 && (
              <span style={{
                position: 'absolute', top: -4, right: -4,
                width: 17, height: 17, borderRadius: '50%',
                background: 'var(--bordeaux)', color: '#FAF7F2',
                fontSize: 10, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '2px solid var(--crema)',
              }}>{cantidad}</span>
            )}
          </button>

          <button onClick={() => navigate('/admin/login')} title="Admin" style={{
            width: 34, height: 34, borderRadius: '50%', border: 'none', flexShrink: 0,
            background: 'transparent', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: scrolled ? 'var(--crema-oscuro)' : 'rgba(255,255,255,0.2)',
            transition: 'color 0.3s',
          }}
            onMouseEnter={e => e.currentTarget.style.color = scrolled ? 'var(--texto-suave)' : 'rgba(255,255,255,0.55)'}
            onMouseLeave={e => e.currentTarget.style.color = scrolled ? 'var(--crema-oscuro)' : 'rgba(255,255,255,0.2)'}>
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </button>
        </div>
      </nav>

      <CartSidebar open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}
