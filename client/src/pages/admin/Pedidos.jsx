import { useEffect, useState } from 'react';
import api from '../../api/index.js';

const MESES_LABEL = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

function getMesActual() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
}

function formatFecha(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' });
}

function labelMes(ym) {
  const [y, m] = ym.split('-');
  return `${MESES_LABEL[parseInt(m)-1]} ${y}`;
}

const ITEM_VACIO = { nombre_producto: '', cantidad: 1, precio_unitario: '' };

/* ══════════════════════════════════════════════════════════ */
export default function Pedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [mesFiltro, setMesFiltro] = useState(getMesActual());
  const [modalOpen, setModalOpen] = useState(false);
  const [detalle, setDetalle] = useState(null);

  function cargar() {
    api.get(`/pedidos?mes=${mesFiltro}`).then(r => setPedidos(r.data));
  }
  useEffect(cargar, [mesFiltro]);

  async function eliminar(id) {
    if (!confirm('¿Eliminar este pedido del registro?')) return;
    await api.delete(`/pedidos/${id}`);
    cargar();
  }

  const totalMes = pedidos.reduce((s, p) => s + p.total, 0);

  // Generar opciones de meses (últimos 12)
  const mesesOpciones = Array.from({ length: 12 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
  });

  return (
    <div style={{ padding: '36px 32px', maxWidth: 900 }}>
      {/* Encabezado */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 32, color: 'var(--texto)', margin: 0 }}>Pedidos</h2>
          <p style={{ color: 'var(--texto-suave)', fontSize: 13, marginTop: 4 }}>
            {pedidos.length} pedido{pedidos.length !== 1 ? 's' : ''} · Total: <strong style={{ color: 'var(--bordeaux)' }}>${totalMes.toLocaleString('es-AR')}</strong>
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {/* Filtro de mes */}
          <select value={mesFiltro} onChange={e => setMesFiltro(e.target.value)} style={{
            padding: '9px 14px', borderRadius: 10, border: '1.5px solid var(--crema-oscuro)',
            fontSize: 13, color: 'var(--texto)', background: '#fff', cursor: 'pointer', outline: 'none',
          }}>
            {mesesOpciones.map(m => (
              <option key={m} value={m}>{labelMes(m)}</option>
            ))}
          </select>
          <Btn onClick={() => setModalOpen(true)}>+ Cargar pedido</Btn>
        </div>
      </div>

      {/* Lista */}
      {pedidos.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid var(--crema-oscuro)', padding: '48px 24px', textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', color: 'var(--texto-suave)', fontSize: 18 }}>
            Sin pedidos en {labelMes(mesFiltro)}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {pedidos.map(p => (
            <PedidoRow key={p.id} pedido={p} onVer={() => setDetalle(p)} onEliminar={() => eliminar(p.id)} />
          ))}
        </div>
      )}

      {/* Modal nuevo pedido */}
      {modalOpen && <ModalNuevoPedido onClose={() => setModalOpen(false)} onGuardado={() => { setModalOpen(false); cargar(); }} />}

      {/* Modal detalle */}
      {detalle && <ModalDetalle pedido={detalle} onClose={() => setDetalle(null)} />}
    </div>
  );
}

/* ── Fila de pedido ── */
function PedidoRow({ pedido: p, onVer, onEliminar }) {
  return (
    <div style={{ background: '#fff', borderRadius: 14, border: '1px solid var(--crema-oscuro)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
      {/* Número */}
      <span style={{ fontSize: 12, color: 'var(--texto-suave)', width: 32, flexShrink: 0 }}>#{p.id}</span>

      {/* Origen */}
      <span style={{
        fontSize: 11, padding: '3px 10px', borderRadius: 50, flexShrink: 0,
        background: p.origen === 'manual' ? '#f0ebe1' : '#e8f0fe',
        color: p.origen === 'manual' ? 'var(--bordeaux-oscuro)' : '#1a56db',
      }}>
        {p.origen === 'manual' ? 'Manual' : 'Web'}
      </span>

      {/* Cliente */}
      <p style={{ flex: 1, fontWeight: 500, fontSize: 14, color: 'var(--texto)', margin: 0, minWidth: 120 }}>
        {p.nombre_cliente || '—'}
      </p>

      {/* Items resumen */}
      <p style={{ fontSize: 12, color: 'var(--texto-suave)', margin: 0, flex: 2, minWidth: 160 }} className="line-clamp-2">
        {p.items?.map(i => `${i.nombre_producto} x${i.cantidad}`).join(' · ')}
      </p>

      {/* Total */}
      <p style={{ fontFamily: 'var(--serif)', fontSize: 18, color: 'var(--bordeaux)', margin: 0, flexShrink: 0 }}>
        ${p.total.toLocaleString('es-AR')}
      </p>

      {/* Fecha */}
      <p style={{ fontSize: 12, color: 'var(--texto-suave)', margin: 0, flexShrink: 0 }}>
        {formatFecha(p.creado_en)}
      </p>

      {/* Acciones */}
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        <button onClick={onVer} style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid var(--crema-oscuro)', background: '#fff', color: 'var(--texto-suave)', fontSize: 12, cursor: 'pointer' }}>
          Ver
        </button>
        <button onClick={onEliminar} style={{ padding: '6px 10px', borderRadius: 8, border: 'none', background: '#fff', color: '#ddd', fontSize: 16, cursor: 'pointer', lineHeight: 1 }}
          onMouseEnter={e => e.target.style.color = '#c0392b'}
          onMouseLeave={e => e.target.style.color = '#ddd'}>
          ×
        </button>
      </div>
    </div>
  );
}

/* ── Modal: Nuevo pedido manual ── */
function ModalNuevoPedido({ onClose, onGuardado }) {
  const [cliente, setCliente] = useState('');
  const [items, setItems] = useState([{ ...ITEM_VACIO }]);
  const [nota, setNota] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  function addItem() { setItems(i => [...i, { ...ITEM_VACIO }]); }
  function removeItem(idx) { setItems(i => i.filter((_, j) => j !== idx)); }
  function setItem(idx, key, val) { setItems(i => i.map((item, j) => j === idx ? { ...item, [key]: val } : item)); }

  const total = items.reduce((s, i) => s + (parseFloat(i.precio_unitario) || 0) * (parseInt(i.cantidad) || 0), 0);

  async function guardar(e) {
    e.preventDefault();
    if (!cliente.trim()) return setError('Ingresá el nombre del cliente');
    if (items.some(i => !i.nombre_producto.trim() || !i.precio_unitario)) return setError('Completá todos los ítems');
    setError(''); setGuardando(true);
    try {
      await api.post('/pedidos/manual', { nombre_cliente: cliente, items, nota, fecha });
      onGuardado();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar');
    } finally { setGuardando(false); }
  }

  return (
    <Modal onClose={onClose} titulo="Cargar pedido manual">
      <form onSubmit={guardar} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Cliente">
            <Input value={cliente} onChange={e => setCliente(e.target.value)} placeholder="Nombre del cliente" required />
          </Field>
          <Field label="Fecha">
            <Input type="date" value={fecha} onChange={e => setFecha(e.target.value)} />
          </Field>
        </div>

        {/* Ítems */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <label style={labelStyle}>Productos</label>
            <button type="button" onClick={addItem} style={{ fontSize: 12, color: 'var(--bordeaux)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              + Agregar ítem
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {items.map((item, idx) => (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 60px 100px 28px', gap: 8, alignItems: 'center' }}>
                <Input value={item.nombre_producto} onChange={e => setItem(idx, 'nombre_producto', e.target.value)} placeholder="Producto" />
                <Input type="number" min="1" value={item.cantidad} onChange={e => setItem(idx, 'cantidad', e.target.value)} placeholder="Cant." style={{ textAlign: 'center' }} />
                <Input type="number" min="0" step="100" value={item.precio_unitario} onChange={e => setItem(idx, 'precio_unitario', e.target.value)} placeholder="Precio" />
                {items.length > 1 && (
                  <button type="button" onClick={() => removeItem(idx)} style={{ background: 'none', border: 'none', color: '#ccc', fontSize: 20, cursor: 'pointer', lineHeight: 1, padding: 0 }}
                    onMouseEnter={e => e.target.style.color = '#c0392b'}
                    onMouseLeave={e => e.target.style.color = '#ccc'}>×</button>
                )}
              </div>
            ))}
          </div>
        </div>

        <Field label="Nota (opcional)">
          <textarea value={nota} onChange={e => setNota(e.target.value)} rows={2} placeholder="Aclaraciones..."
            style={{ ...inputStyle, resize: 'none', width: '100%', boxSizing: 'border-box' }} />
        </Field>

        {/* Total calculado */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--crema)', borderRadius: 10 }}>
          <span style={{ fontSize: 13, color: 'var(--texto-suave)' }}>Total calculado</span>
          <span style={{ fontFamily: 'var(--serif)', fontSize: 22, color: 'var(--bordeaux)' }}>${total.toLocaleString('es-AR')}</span>
        </div>

        {error && <p style={{ color: '#c0392b', fontSize: 13 }}>{error}</p>}

        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" onClick={onClose} style={{ flex: 1, padding: '12px', borderRadius: 10, border: '1.5px solid var(--crema-oscuro)', background: '#fff', color: 'var(--texto-suave)', cursor: 'pointer', fontSize: 13 }}>
            Cancelar
          </button>
          <button type="submit" disabled={guardando} style={{ flex: 1, padding: '12px', borderRadius: 10, border: 'none', background: 'var(--bordeaux)', color: '#FAF7F2', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
            {guardando ? 'Guardando...' : 'Guardar pedido'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* ── Modal: Detalle pedido ── */
function ModalDetalle({ pedido: p, onClose }) {
  return (
    <Modal onClose={onClose} titulo={`Pedido #${p.id}`}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <InfoField label="Cliente" valor={p.nombre_cliente || '—'} />
          <InfoField label="Fecha" valor={formatFecha(p.creado_en)} />
          <InfoField label="Origen" valor={p.origen === 'manual' ? 'Manual' : 'Vía web'} />
          {p.nota && <InfoField label="Nota" valor={p.nota} />}
        </div>

        <div>
          <p style={labelStyle}>Detalle</p>
          <div style={{ background: 'var(--crema)', borderRadius: 10, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {p.items?.map((i, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                <span style={{ color: 'var(--texto)' }}>{i.nombre_producto} <span style={{ color: 'var(--texto-suave)' }}>×{i.cantidad}</span></span>
                <span style={{ fontWeight: 500, color: 'var(--texto)' }}>${(i.precio_unitario * i.cantidad).toLocaleString('es-AR')}</span>
              </div>
            ))}
            <div style={{ borderTop: '1px solid var(--crema-oscuro)', paddingTop: 10, display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 600, color: 'var(--texto)' }}>Total</span>
              <span style={{ fontFamily: 'var(--serif)', fontSize: 20, color: 'var(--bordeaux)' }}>${p.total.toLocaleString('es-AR')}</span>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

/* ── Helpers UI ── */
const inputStyle = { padding: '10px 14px', borderRadius: 10, border: '1.5px solid var(--crema-oscuro)', fontSize: 13, color: 'var(--texto)', outline: 'none', fontFamily: 'var(--sans)' };
const labelStyle = { fontSize: 12, color: 'var(--texto-suave)', display: 'block', marginBottom: 4 };

function Input({ style, ...props }) {
  return <input style={{ ...inputStyle, width: '100%', boxSizing: 'border-box', ...style }} {...props} />;
}
function Field({ label, children }) {
  return <div><label style={labelStyle}>{label}</label>{children}</div>;
}
function InfoField({ label, valor }) {
  return <div><p style={{ ...labelStyle, marginBottom: 2 }}>{label}</p><p style={{ fontSize: 14, color: 'var(--texto)', margin: 0, fontWeight: 500 }}>{valor}</p></div>;
}
function Btn({ children, onClick, variant = 'primary' }) {
  const styles = variant === 'primary'
    ? { background: 'var(--bordeaux)', color: '#FAF7F2', border: 'none' }
    : { background: '#fff', color: 'var(--texto-suave)', border: '1.5px solid var(--crema-oscuro)' };
  return (
    <button onClick={onClick} style={{ ...styles, padding: '10px 20px', borderRadius: 10, fontSize: 13, cursor: 'pointer', fontFamily: 'var(--sans)', transition: 'opacity 0.2s' }}>
      {children}
    </button>
  );
}

function Modal({ titulo, onClose, children }) {
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.25)', zIndex: 50, backdropFilter: 'blur(2px)' }} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 51, width: '92%', maxWidth: 520, background: '#fff', borderRadius: 20, boxShadow: '0 20px 60px rgba(0,0,0,0.15)', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid var(--crema-oscuro)' }}>
          <h3 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: 22, color: 'var(--texto)', margin: 0 }}>{titulo}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: 'var(--texto-suave)', lineHeight: 1, padding: 4 }}>×</button>
        </div>
        <div style={{ padding: '20px 24px 24px' }}>{children}</div>
      </div>
    </>
  );
}
