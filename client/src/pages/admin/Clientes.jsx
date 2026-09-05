import { useEffect, useState } from 'react';
import api from '../../api/index.js';

function formatFecha(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' });
}

const inputStyle = { padding: '10px 14px', borderRadius: 10, border: '1.5px solid var(--crema-oscuro)', fontSize: 17, color: 'var(--texto)', outline: 'none', fontFamily: 'var(--sans)', width: '100%', boxSizing: 'border-box' };
const labelStyle = { fontSize: 16, color: 'var(--texto-suave)', display: 'block', marginBottom: 4 };

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [seleccionada, setSeleccionada] = useState(null);
  const [detalle, setDetalle] = useState(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);

  function cargar() {
    api.get('/clientes').then(r => setClientes(r.data));
  }
  useEffect(cargar, []);

  async function verDetalle(c) {
    setSeleccionada(c);
    setCargandoDetalle(true);
    const r = await api.get(`/clientes/${c.id}`);
    setDetalle(r.data);
    setCargandoDetalle(false);
  }

  async function guardarEdicion(id, campos) {
    await api.put(`/clientes/${id}`, campos);
    cargar();
    const r = await api.get(`/clientes/${id}`);
    setDetalle(r.data);
  }

  const filtrados = clientes.filter(c =>
    c.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.recomendado_por?.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="admin-page" style={{ maxWidth: 960 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 42, color: 'var(--texto)', margin: 0 }}>Clientes</h2>
          <p style={{ color: 'var(--texto-suave)', fontSize: 17, marginTop: 4 }}>
            {clientes.length} cliente{clientes.length !== 1 ? 's' : ''} registrada{clientes.length !== 1 ? 's' : ''}
          </p>
        </div>
        <input
          type="text"
          placeholder="Buscar por nombre o referido por..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          style={{ ...inputStyle, width: 260 }}
        />
      </div>

      {/* Lista */}
      {filtrados.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid var(--crema-oscuro)', padding: '48px 24px', textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', color: 'var(--texto-suave)', fontSize: 18 }}>
            {busqueda ? 'Sin resultados' : 'Aún no hay clientes registradas'}
          </p>
          <p style={{ fontSize: 17, color: 'var(--texto-suave)', marginTop: 8 }}>
            Se guardan automáticamente al cargar un pedido manual
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtrados.map(c => (
            <ClienteRow
              key={c.id}
              cliente={c}
              activa={seleccionada?.id === c.id}
              onClick={() => seleccionada?.id === c.id ? setSeleccionada(null) : verDetalle(c)}
            />
          ))}
        </div>
      )}

      {/* Panel de detalle */}
      {seleccionada && detalle && (
        <ModalDetalle
          detalle={detalle}
          cargando={cargandoDetalle}
          onClose={() => { setSeleccionada(null); setDetalle(null); }}
          onGuardar={(campos) => guardarEdicion(detalle.id, campos)}
        />
      )}
    </div>
  );
}

function ClienteRow({ cliente: c, activa, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: '#fff', borderRadius: 14, cursor: 'pointer',
        border: `1.5px solid ${activa ? 'var(--bordeaux)' : 'var(--crema-oscuro)'}`,
        padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
        transition: 'border-color 0.15s',
      }}
    >
      {/* Avatar inicial */}
      <div style={{
        width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
        background: 'var(--crema)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--serif)', fontSize: 21, color: 'var(--bordeaux)', fontWeight: 400,
      }}>
        {c.nombre?.[0]?.toUpperCase() ?? '?'}
      </div>

      {/* Nombre + referido */}
      <div style={{ flex: 1, minWidth: 140 }}>
        <p style={{ margin: 0, fontWeight: 500, fontSize: 18, color: 'var(--texto)' }}>{c.nombre}</p>
        {c.recomendado_por && (
          <p style={{ margin: 0, fontSize: 16, color: 'var(--texto-suave)', marginTop: 2 }}>
            Referida por {c.recomendado_por}
          </p>
        )}
      </div>

      {/* Pedidos */}
      <div style={{ textAlign: 'center', minWidth: 60 }}>
        <p style={{ margin: 0, fontSize: 23, fontFamily: 'var(--serif)', color: 'var(--texto)', lineHeight: 1 }}>{c.total_pedidos}</p>
        <p style={{ margin: 0, fontSize: 14, color: 'var(--texto-suave)', marginTop: 2 }}>pedidos</p>
      </div>

      {/* Último pedido */}
      <div style={{ textAlign: 'right', minWidth: 110 }}>
        <p style={{ margin: 0, fontSize: 16, color: 'var(--texto-suave)' }}>último pedido</p>
        <p style={{ margin: 0, fontSize: 17, color: 'var(--texto)', fontWeight: 500, marginTop: 2 }}>
          {formatFecha(c.ultimo_pedido_fecha)}
        </p>
      </div>

      {/* Total histórico */}
      <div style={{ textAlign: 'right', minWidth: 100 }}>
        <p style={{ margin: 0, fontSize: 16, color: 'var(--texto-suave)' }}>total histórico</p>
        <p style={{ margin: 0, fontFamily: 'var(--serif)', fontSize: 23, color: 'var(--bordeaux)', lineHeight: 1, marginTop: 2 }}>
          ${parseFloat(c.total_gastado).toLocaleString('es-AR')}
        </p>
      </div>
    </div>
  );
}

function ModalDetalle({ detalle: c, cargando, onClose, onGuardar }) {
  const [editando, setEditando] = useState(false);
  const [recomendado, setRecomendado] = useState(c.recomendado_por || '');
  const [notas, setNotas] = useState(c.notas || '');

  function guardar() {
    onGuardar({ recomendado_por: recomendado, notas });
    setEditando(false);
  }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.25)', zIndex: 50, backdropFilter: 'blur(2px)' }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        zIndex: 51, width: '92%', maxWidth: 560, background: '#fff', borderRadius: 20,
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)', maxHeight: '88vh', overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid var(--crema-oscuro)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--crema)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--serif)', fontSize: 26, color: 'var(--bordeaux)' }}>
              {c.nombre?.[0]?.toUpperCase()}
            </div>
            <div>
              <h3 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: 29, color: 'var(--texto)', margin: 0 }}>{c.nombre}</h3>
              <p style={{ margin: 0, fontSize: 16, color: 'var(--texto-suave)' }}>cliente desde {formatFecha(c.creado_en)}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 29, cursor: 'pointer', color: 'var(--texto-suave)', lineHeight: 1, padding: 4 }}>×</button>
        </div>

        <div style={{ padding: '20px 24px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            <StatCard label="Pedidos" valor={c.total_pedidos || 0} />
            <StatCard label="Total histórico" valor={`$${parseFloat(c.total_gastado || 0).toLocaleString('es-AR')}`} grande />
            <StatCard label="Último pedido" valor={`$${parseFloat(c.ultimo_pedido_total || 0).toLocaleString('es-AR')}`} />
          </div>

          {/* Edición */}
          {editando ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={labelStyle}>Referida por</label>
                <input value={recomendado} onChange={e => setRecomendado(e.target.value)} placeholder="¿Quién la recomendó?" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Notas</label>
                <textarea value={notas} onChange={e => setNotas(e.target.value)} rows={3} placeholder="Preferencias, alergias, detalles..." style={{ ...inputStyle, resize: 'none' }} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setEditando(false)} style={{ flex: 1, padding: '10px', borderRadius: 10, border: '1.5px solid var(--crema-oscuro)', background: '#fff', color: 'var(--texto-suave)', cursor: 'pointer', fontSize: 13 }}>Cancelar</button>
                <button onClick={guardar} style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', background: 'var(--bordeaux)', color: '#FAF7F2', cursor: 'pointer', fontSize: 17, fontWeight: 500 }}>Guardar</button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(c.recomendado_por || c.notas) ? (
                <>
                  {c.recomendado_por && <InfoPill label="Referida por" valor={c.recomendado_por} />}
                  {c.notas && <InfoPill label="Notas" valor={c.notas} />}
                </>
              ) : (
                <p style={{ fontSize: 17, color: 'var(--texto-suave)', fontStyle: 'italic' }}>Sin notas aún</p>
              )}
              <button onClick={() => setEditando(true)} style={{ alignSelf: 'flex-start', padding: '7px 16px', borderRadius: 8, border: '1.5px solid var(--crema-oscuro)', background: '#fff', color: 'var(--texto-suave)', cursor: 'pointer', fontSize: 12 }}>
                ✏️ Editar datos
              </button>
            </div>
          )}

          {/* Historial de pedidos */}
          {c.pedidos?.length > 0 && (
            <div>
              <p style={{ ...labelStyle, marginBottom: 10, fontSize: 13 }}>Historial de pedidos</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {c.pedidos.map(p => (
                  <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--crema)', borderRadius: 10, gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 17, color: 'var(--texto)', fontWeight: 500 }}>{formatFecha(p.creado_en)}</p>
                      {p.items_resumen && <p style={{ margin: 0, fontSize: 14, color: 'var(--texto-suave)', marginTop: 2 }} className="line-clamp-2">{p.items_resumen}</p>}
                    </div>
                    <span style={{ fontFamily: 'var(--serif)', fontSize: 17, color: 'var(--bordeaux)', flexShrink: 0 }}>
                      ${p.total.toLocaleString('es-AR')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function StatCard({ label, valor, grande }) {
  return (
    <div style={{ background: 'var(--crema)', borderRadius: 12, padding: '12px 14px', textAlign: 'center' }}>
      <p style={{ margin: 0, fontFamily: 'var(--serif)', fontSize: grande ? 20 : 18, color: 'var(--bordeaux)', lineHeight: 1 }}>{valor}</p>
      <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--texto-suave)' }}>{label}</p>
    </div>
  );
}

function InfoPill({ label, valor }) {
  return (
    <div style={{ background: 'var(--crema)', borderRadius: 10, padding: '10px 14px' }}>
      <p style={{ margin: 0, fontSize: 14, color: 'var(--texto-suave)', marginBottom: 2 }}>{label}</p>
      <p style={{ margin: 0, fontSize: 17, color: 'var(--texto)' }}>{valor}</p>
    </div>
  );
}
