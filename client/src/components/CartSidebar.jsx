import { useCart } from '../context/CartContext';

export default function CartSidebar({ open, onClose }) {
  const { items, quitar, cambiarCantidad, total, vaciar } = useCart();

  function enviarWhatsapp() {
    if (!items.length) return;
    const lineas = items.map(i =>
      `• ${i.nombre} x${i.cantidad} — $${(i.precio * i.cantidad).toLocaleString('es-AR')}`
    ).join('\n');
    const msg = `Hola Mery! 🧁 Quiero hacer el siguiente pedido:\n\n${lineas}\n\n*Total: $${total.toLocaleString('es-AR')}*\n\n¡Muchas gracias!`;
    window.open(`https://wa.me/5491164936089?text=${encodeURIComponent(msg)}`, '_blank');
  }

  return (
    <>
      {/* Overlay */}
      {open && (
        <div onClick={onClose} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.25)',
          zIndex: 40, backdropFilter: 'blur(2px)',
        }} />
      )}

      {/* Panel */}
      <div style={{
        position: 'fixed', top: 0, right: 0, height: '100%', width: 340,
        background: '#fff', zIndex: 50, display: 'flex', flexDirection: 'column',
        borderLeft: '1px solid var(--crema-oscuro)',
        boxShadow: '-8px 0 32px rgba(0,0,0,0.08)',
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid var(--crema-oscuro)' }}>
          <h2 style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 24, color: 'var(--texto)' }}>Tu pedido</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: 'var(--texto-suave)', lineHeight: 1, padding: 4 }}>×</button>
        </div>

        {/* Items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {items.length === 0 && (
            <div style={{ textAlign: 'center', paddingTop: 60 }}>
              <p style={{ fontSize: 40, marginBottom: 12 }}>🛒</p>
              <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', color: 'var(--texto-suave)', fontSize: 18 }}>
                El carrito está vacío
              </p>
            </div>
          )}

          {items.map(item => (
            <div key={item.producto_id} style={{
              display: 'flex', gap: 14, padding: '14px 0',
              borderBottom: '1px solid var(--crema-oscuro)', alignItems: 'flex-start',
            }}>
              {/* Miniatura */}
              <div style={{ width: 60, height: 60, borderRadius: 12, overflow: 'hidden', background: 'var(--crema-oscuro)', flexShrink: 0 }}>
                {item.imagen
                  ? <img src={item.imagen} alt={item.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🧁</div>
                }
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ color: 'var(--texto)', fontSize: 14, lineHeight: 1.35, marginBottom: 4, fontWeight: 500 }}
                  className="line-clamp-2">
                  {item.nombre}
                </p>
                <p style={{ color: 'var(--bordeaux)', fontFamily: 'var(--serif)', fontSize: 16, marginBottom: 10 }}>
                  ${item.precio.toLocaleString('es-AR')}
                </p>

                {/* +/- */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button onClick={() => cambiarCantidad(item.producto_id, item.cantidad - 1)} style={{
                    width: 28, height: 28, borderRadius: '50%', border: '1.5px solid var(--crema-oscuro)',
                    background: '#fff', color: 'var(--bordeaux)', fontSize: 16, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>−</button>
                  <span style={{ fontSize: 15, fontWeight: 500, minWidth: 20, textAlign: 'center', color: 'var(--texto)' }}>
                    {item.cantidad}
                  </span>
                  <button onClick={() => cambiarCantidad(item.producto_id, item.cantidad + 1)} style={{
                    width: 28, height: 28, borderRadius: '50%', border: '1.5px solid var(--crema-oscuro)',
                    background: '#fff', color: 'var(--bordeaux)', fontSize: 16, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>+</button>
                  <button onClick={() => quitar(item.producto_id)} style={{
                    marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer',
                    color: '#ccc', fontSize: 20, lineHeight: 1, padding: 4, transition: 'color 0.15s',
                  }}
                    onMouseEnter={e => e.target.style.color = '#999'}
                    onMouseLeave={e => e.target.style.color = '#ccc'}>
                    ×
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div style={{ padding: '20px 24px', borderTop: '1px solid var(--crema-oscuro)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16 }}>
              <span style={{ color: 'var(--texto-suave)', fontSize: 14 }}>Total</span>
              <span style={{ fontFamily: 'var(--serif)', fontSize: 26, color: 'var(--texto)' }}>
                ${total.toLocaleString('es-AR')}
              </span>
            </div>
            <button onClick={enviarWhatsapp} style={{
              width: '100%', padding: '15px 0', borderRadius: 50, border: 'none',
              background: '#25D366', color: '#fff', fontSize: 14, fontWeight: 600,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 8, marginBottom: 10, transition: 'opacity 0.2s',
            }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
              <span>💬</span> Enviar por WhatsApp
            </button>
            <button onClick={vaciar} style={{
              width: '100%', background: 'none', border: 'none', cursor: 'pointer',
              color: '#bbb', fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase',
              transition: 'color 0.2s', padding: '4px 0',
            }}
              onMouseEnter={e => e.target.style.color = 'var(--texto-suave)'}
              onMouseLeave={e => e.target.style.color = '#bbb'}>
              Vaciar carrito
            </button>
          </div>
        )}
      </div>
    </>
  );
}
