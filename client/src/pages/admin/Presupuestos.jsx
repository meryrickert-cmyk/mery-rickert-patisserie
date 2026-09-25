import { useEffect, useState, useRef, useCallback } from 'react';
import api from '../../api/index.js';

const $ = (v, fb = '') => v ?? fb;

function fmt(n) {
  if (!n && n !== 0) return '';
  return Number(n).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function fmtFecha(str) {
  if (!str) return '';
  const [y, m, d] = str.split('-');
  return `${d}/${m}/${y}`;
}

const ITEM_VACIO = { productoId: '', descripcion: '', cantidad: 1, precio: '', imagenUrl: '', manual: false };
const OPCION_VACIA = () => ({ items: [{ ...ITEM_VACIO }] });

// Parsea items guardados (flat array legacy → opción única; objeto con opciones → multi)
function parseOpciones(raw) {
  if (!raw) return [OPCION_VACIA()];
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (Array.isArray(parsed)) {
      // legacy: flat array de ítems
      return [{ items: parsed.length ? parsed : [{ ...ITEM_VACIO }] }];
    }
    if (parsed?.opciones?.length) return parsed.opciones;
  } catch {}
  return [OPCION_VACIA()];
}

function totalOpcion(items) {
  return (items || []).reduce((s, it) => s + (parseFloat(it.precio) || 0) * (parseInt(it.cantidad) || 1), 0);
}

const btn = {
  base: { padding: '9px 20px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 17, fontFamily: 'var(--sans)', transition: 'opacity 0.15s' },
  bordeaux: { background: 'var(--bordeaux)', color: '#FAF7F2' },
  outline: { background: 'transparent', color: 'var(--bordeaux)', border: '1.5px solid var(--bordeaux)' },
  ghost: { background: 'transparent', color: 'var(--texto-suave)', border: '1.5px solid var(--crema-oscuro)' },
  danger: { background: '#fef2f2', color: '#b91c1c', border: '1.5px solid #fecaca' },
};

const inp = {
  base: {
    padding: '9px 13px', borderRadius: 10, border: '1.5px solid var(--crema-oscuro)',
    fontSize: 17, fontFamily: 'var(--sans)', color: 'var(--texto)', outline: 'none',
    background: '#fff', width: '100%', boxSizing: 'border-box',
  },
};

// ── Logo ──────────────────────────────────────────────────────────────────
function Logo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{
        width: 48, height: 48, borderRadius: '50%',
        background: 'var(--bordeaux)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <span style={{ fontFamily: 'var(--serif)', color: '#FAF7F2', fontSize: 22, letterSpacing: '0.02em' }}>MR</span>
      </div>
      <p style={{ fontFamily: 'var(--serif)', fontSize: 20, color: 'var(--bordeaux)', margin: 0, fontWeight: 400 }}>
        Mery Rickert Patisserie
      </p>
    </div>
  );
}

// ── Tabla de ítems para el preview ────────────────────────────────────────
function TablaItems({ items }) {
  const validos = items.filter(it => it.descripcion);
  if (!validos.length) return null;
  const total = totalOpcion(validos);
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr style={{ background: 'var(--crema-oscuro)' }}>
          <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 13, color: 'var(--texto-suave)', fontWeight: 500 }}>Descripción</th>
          <th style={{ padding: '10px 14px', textAlign: 'center', fontSize: 13, color: 'var(--texto-suave)', fontWeight: 500, width: 80 }}>Cant.</th>
          <th style={{ padding: '10px 14px', textAlign: 'right', fontSize: 13, color: 'var(--texto-suave)', fontWeight: 500, width: 140 }}>Precio unit.</th>
          <th style={{ padding: '10px 14px', textAlign: 'right', fontSize: 13, color: 'var(--texto-suave)', fontWeight: 500, width: 140 }}>Subtotal</th>
        </tr>
      </thead>
      <tbody>
        {validos.map((it, i) => {
          const cant = parseInt(it.cantidad) || 1;
          const precio = parseFloat(it.precio) || 0;
          return (
            <tr key={i} style={{ borderBottom: '1px solid var(--crema-oscuro)' }}>
              <td style={{ padding: '11px 14px', fontSize: 16, color: 'var(--texto)' }}>{it.descripcion}</td>
              <td style={{ padding: '11px 14px', textAlign: 'center', fontSize: 16, color: 'var(--texto)' }}>{cant}</td>
              <td style={{ padding: '11px 14px', textAlign: 'right', fontSize: 16, color: 'var(--texto)' }}>
                {precio ? `$${fmt(precio)}` : '—'}
              </td>
              <td style={{ padding: '11px 14px', textAlign: 'right', fontSize: 16, color: 'var(--texto)', fontWeight: 500 }}>
                {precio ? `$${fmt(cant * precio)}` : '—'}
              </td>
            </tr>
          );
        })}
      </tbody>
      <tfoot>
        <tr>
          <td colSpan={3} style={{ padding: '14px 14px', textAlign: 'right', fontSize: 17, color: 'var(--texto-suave)', fontWeight: 500 }}>
            Total
          </td>
          <td style={{ padding: '14px 14px', textAlign: 'right', fontFamily: 'var(--serif)', fontSize: 24, color: 'var(--bordeaux)', fontWeight: 400 }}>
            ${fmt(total)}
          </td>
        </tr>
      </tfoot>
    </table>
  );
}

// ── Preview ───────────────────────────────────────────────────────────────
function Preview({ form, opciones, fotosExtra }) {
  const multiOpcion = opciones.length > 1;

  // Imágenes de catálogo (de todos los ítems de todas las opciones, deduplicadas)
  const imgsCatalogo = [];
  const vistas = new Set();
  for (const op of opciones) {
    for (const it of (op.items || [])) {
      if (it.imagenUrl && !vistas.has(it.imagenUrl)) {
        vistas.add(it.imagenUrl);
        imgsCatalogo.push(it.imagenUrl);
      }
    }
  }
  const fotosRef = fotosExtra.map(f => f.url || f.preview);
  const todasImagenes = [...imgsCatalogo, ...fotosRef];

  return (
    <div id="presupuesto-preview" style={{
      background: '#FAF7F2', padding: '40px 48px', borderRadius: 16,
      border: '1px solid var(--crema-oscuro)', fontFamily: 'var(--sans)',
    }}>
      {/* Encabezado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
        <Logo />
        <p style={{ fontFamily: 'var(--serif)', fontSize: 28, color: 'var(--bordeaux)', margin: 0, fontWeight: 300 }}>
          Presupuesto
        </p>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid var(--crema-oscuro)', margin: '0 0 24px' }} />

      {/* Datos cliente */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 28 }}>
        <div>
          <p style={{ fontSize: 11, color: 'var(--texto-suave)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 4px' }}>Cliente</p>
          <p style={{ fontSize: 17, color: 'var(--texto)', margin: 0, fontWeight: 500 }}>{$(form.cliente, '—')}</p>
        </div>
        <div>
          <p style={{ fontSize: 11, color: 'var(--texto-suave)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 4px' }}>Fecha del evento</p>
          <p style={{ fontSize: 17, color: 'var(--texto)', margin: 0 }}>{form.fecha ? fmtFecha(form.fecha) : '—'}</p>
        </div>
        <div>
          <p style={{ fontSize: 11, color: 'var(--texto-suave)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 4px' }}>Personas</p>
          <p style={{ fontSize: 17, color: 'var(--texto)', margin: 0 }}>{$(form.personas, '—')}</p>
        </div>
      </div>

      {/* Opciones */}
      {opciones.map((op, oi) => {
        const validos = (op.items || []).filter(it => it.descripcion);
        if (!validos.length) return null;
        return (
          <div key={oi} style={{ marginBottom: multiOpcion ? 28 : 24 }}>
            {multiOpcion && (
              <p style={{
                fontFamily: 'var(--serif)', fontSize: 20, color: 'var(--bordeaux)',
                margin: '0 0 12px', fontWeight: 400, letterSpacing: '0.01em',
              }}>
                Opción {oi + 1}
              </p>
            )}
            <TablaItems items={op.items} />
          </div>
        );
      })}

      {/* Nota */}
      {form.nota && (
        <div style={{ background: '#fff', borderRadius: 10, padding: '14px 18px', marginBottom: 24, border: '1px solid var(--crema-oscuro)' }}>
          <p style={{ fontSize: 12, color: 'var(--texto-suave)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 6px' }}>Notas</p>
          <p style={{ fontSize: 16, color: 'var(--texto)', margin: 0, whiteSpace: 'pre-wrap' }}>{form.nota}</p>
        </div>
      )}

      {/* Imágenes de referencia */}
      {todasImagenes.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10 }}>
            {todasImagenes.map((url, i) => (
              <img key={i} src={url} alt="" style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 10, border: '1px solid var(--crema-oscuro)', display: 'block' }} />
            ))}
          </div>
        </div>
      )}

      {/* Pie */}
      <div style={{ marginTop: 32, paddingTop: 20, borderTop: '1px solid var(--crema-oscuro)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
          <p style={{ fontSize: 13, color: 'var(--texto-suave)', margin: 0 }}>
            Km 47.5, Pilar · @meryrickertpatisserie
          </p>
          <p style={{ fontSize: 12, color: 'var(--texto-suave)', margin: 0 }}>
            Presupuesto válido por 15 días
          </p>
        </div>
        <p style={{ fontSize: 12, color: 'var(--texto-suave)', margin: 0, lineHeight: 1.5 }}>
          Forma de pago: 50% de seña al confirmar · 50% restante el día de la entrega.
        </p>
      </div>
    </div>
  );
}

// ── Fila de ítem ─────────────────────────────────────────────────────────
function ItemRow({ it, i, catalogo, onChange, onQuitar }) {
  const handleProducto = (e) => {
    const val = e.target.value;
    if (!val) { onChange(i, { ...ITEM_VACIO }); return; }
    if (val === '__manual__') { onChange(i, { ...ITEM_VACIO, manual: true }); return; }
    const prod = catalogo.find(p => String(p.id) === val);
    if (prod) {
      onChange(i, {
        productoId: String(prod.id),
        descripcion: prod.nombre,
        cantidad: it.cantidad || 1,
        precio: prod.precio,
        imagenUrl: prod.imagen || prod.imagenes?.[0]?.url || '',
        manual: false,
      });
    }
  };

  return (
    <div style={{ background: '#fff', border: '1px solid var(--crema-oscuro)', borderRadius: 12, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      {!it.manual ? (
        <select value={it.productoId || ''} onChange={handleProducto} style={inp.base}>
          <option value="">— Elegir producto del catálogo —</option>
          {catalogo.map(p => (
            <option key={p.id} value={p.id}>{p.nombre} — ${fmt(p.precio)}</option>
          ))}
          <option value="__manual__">✏️ Cargar manualmente</option>
        </select>
      ) : (
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            value={it.descripcion}
            onChange={e => onChange(i, { ...it, descripcion: e.target.value })}
            placeholder="Descripción del ítem"
            style={inp.base}
            autoFocus
          />
          <button onClick={() => onChange(i, { ...ITEM_VACIO })} style={{ ...btn.base, ...btn.ghost, padding: '8px 12px', fontSize: 14, whiteSpace: 'nowrap', flexShrink: 0 }}>
            Catálogo
          </button>
        </div>
      )}

      {it.imagenUrl && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <img src={it.imagenUrl} alt="" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--crema-oscuro)' }} />
          <span style={{ fontSize: 13, color: 'var(--texto-suave)' }}>Imagen incluida en el presupuesto</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 36px', gap: 8, alignItems: 'center' }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 12, color: 'var(--texto-suave)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Cantidad</span>
          <input type="number" value={it.cantidad} onChange={e => onChange(i, { ...it, cantidad: e.target.value })} min={1} style={{ ...inp.base, textAlign: 'center' }} />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 12, color: 'var(--texto-suave)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Precio unitario</span>
          <input type="number" value={it.precio} onChange={e => onChange(i, { ...it, precio: e.target.value })} placeholder="0" min={0} style={{ ...inp.base, textAlign: 'right' }} />
        </label>
        <button onClick={() => onQuitar(i)} style={{ ...btn.base, ...btn.danger, padding: '8px', fontSize: 16, marginTop: 20 }} title="Quitar">✕</button>
      </div>

      {(parseFloat(it.precio) > 0) && (
        <p style={{ fontSize: 14, color: 'var(--texto-suave)', margin: 0, textAlign: 'right' }}>
          Subtotal: <strong style={{ color: 'var(--bordeaux)' }}>${fmt((parseInt(it.cantidad) || 1) * parseFloat(it.precio))}</strong>
        </p>
      )}
    </div>
  );
}

// ── Bloque de una opción en el form ──────────────────────────────────────
function OpcionBlock({ op, oi, totalOpciones, catalogo, onChange, onQuitar }) {
  const setItem = (ii, nuevoItem) => {
    const items = [...op.items];
    items[ii] = nuevoItem;
    onChange(oi, { ...op, items });
  };
  const quitarItem = (ii) => onChange(oi, { ...op, items: op.items.filter((_, j) => j !== ii) });
  const agregarItem = () => onChange(oi, { ...op, items: [...op.items, { ...ITEM_VACIO }] });

  const total = totalOpcion(op.items);

  return (
    <div style={{ background: 'var(--crema)', borderRadius: 14, border: '1px solid var(--crema-oscuro)', padding: '18px 18px 14px' }}>
      {/* Header de la opción */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {totalOpciones > 1 && (
            <p style={{ fontFamily: 'var(--serif)', fontSize: 20, color: 'var(--bordeaux)', margin: 0, fontWeight: 400 }}>
              Opción {oi + 1}
            </p>
          )}
          {total > 0 && (
            <p style={{ fontSize: 15, color: 'var(--bordeaux)', margin: 0 }}>
              {totalOpciones > 1 ? '— ' : ''}<span style={{ fontFamily: 'var(--serif)', fontSize: 18 }}>${fmt(total)}</span>
            </p>
          )}
        </div>
        {totalOpciones > 1 && (
          <button onClick={() => onQuitar(oi)} style={{ ...btn.base, ...btn.danger, padding: '6px 14px', fontSize: 14 }}>
            Quitar opción
          </button>
        )}
      </div>

      {/* Ítems */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {op.items.map((it, ii) => (
          <ItemRow key={ii} it={it} i={ii} catalogo={catalogo} onChange={setItem} onQuitar={quitarItem} />
        ))}
      </div>
      <button onClick={agregarItem} style={{ ...btn.base, ...btn.ghost, marginTop: 10, fontSize: 15 }}>
        + Agregar ítem
      </button>
    </div>
  );
}

// ── Formulario ─────────────────────────────────────────────────────────────
function FormPresupuesto({ inicial, catalogo, onGuardado, onCancelar }) {
  const [form, setForm] = useState({
    fecha: inicial?.fecha || new Date().toISOString().slice(0, 10),
    cliente: inicial?.cliente || '',
    personas: inicial?.personas || '',
    nota: inicial?.nota || '',
  });
  const [opciones, setOpciones] = useState(() => parseOpciones(inicial?.items));
  const [fotosExistentes, setFotosExistentes] = useState(inicial?.fotos || []);
  const [fotasNuevas, setFotasNuevas] = useState([]);
  const [fotosEliminar, setFotosEliminar] = useState([]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const fileRef = useRef();

  const set = (campo, val) => setForm(f => ({ ...f, [campo]: val }));

  const setOpcion = (i, op) => setOpciones(prev => { const next = [...prev]; next[i] = op; return next; });
  const quitarOpcion = (i) => setOpciones(prev => prev.filter((_, j) => j !== i));
  const agregarOpcion = () => setOpciones(prev => [...prev, OPCION_VACIA()]);

  const onFotos = (e) => {
    const files = Array.from(e.target.files);
    setFotasNuevas(prev => [...prev, ...files.map(file => ({ file, preview: URL.createObjectURL(file) }))]);
    e.target.value = '';
  };

  const quitarFotoNueva = (i) => setFotasNuevas(prev => prev.filter((_, j) => j !== i));
  const quitarFotoExistente = (foto) => {
    setFotosExistentes(prev => prev.filter(f => f.id !== foto.id));
    setFotosEliminar(prev => [...prev, foto.id]);
  };

  const guardar = async () => {
    if (!form.cliente.trim()) { setError('El nombre del cliente es obligatorio.'); return; }
    if (!form.fecha) { setError('La fecha es obligatoria.'); return; }
    setGuardando(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('fecha', form.fecha);
      fd.append('cliente', form.cliente);
      fd.append('personas', form.personas || '');
      fd.append('nota', form.nota || '');
      // Guardar como objeto con opciones para soportar multi
      fd.append('items', JSON.stringify({ opciones }));
      const total = opciones.reduce((s, op) => s + totalOpcion(op.items), 0);
      fd.append('total', total);
      fotasNuevas.forEach(({ file }) => fd.append('fotos', file));

      let resp;
      if (inicial?.id) {
        for (const fid of fotosEliminar) {
          await api.delete(`/presupuestos/${inicial.id}/foto/${fid}`);
        }
        resp = await api.put(`/presupuestos/${inicial.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        resp = await api.post('/presupuestos', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      onGuardado(resp.data);
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Error al guardar');
    } finally {
      setGuardando(false);
    }
  };

  const fotosPreview = [
    ...fotosExistentes,
    ...fotasNuevas.map(n => ({ preview: n.preview })),
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Campos principales */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 13, color: 'var(--texto-suave)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Fecha del evento</span>
          <input type="date" value={form.fecha} onChange={e => set('fecha', e.target.value)} style={inp.base} />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 13, color: 'var(--texto-suave)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Cliente</span>
          <input type="text" value={form.cliente} onChange={e => set('cliente', e.target.value)} placeholder="Nombre del cliente" style={inp.base} />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 13, color: 'var(--texto-suave)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Cantidad de personas</span>
          <input type="number" value={form.personas} onChange={e => set('personas', e.target.value)} placeholder="ej. 50" min={1} style={inp.base} />
        </label>
      </div>

      {/* Opciones */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {opciones.map((op, oi) => (
          <OpcionBlock
            key={oi}
            op={op}
            oi={oi}
            totalOpciones={opciones.length}
            catalogo={catalogo}
            onChange={setOpcion}
            onQuitar={quitarOpcion}
          />
        ))}
        <button onClick={agregarOpcion} style={{ ...btn.base, ...btn.outline, alignSelf: 'flex-start', fontSize: 15 }}>
          + Agregar opción
        </button>
      </div>

      {/* Nota */}
      <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: 13, color: 'var(--texto-suave)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Notas adicionales</span>
        <textarea
          value={form.nota}
          onChange={e => set('nota', e.target.value)}
          placeholder="Indicaciones, condiciones, detalles del evento..."
          rows={3}
          style={{ ...inp.base, resize: 'vertical' }}
        />
      </label>

      {/* Fotos extra */}
      <div>
        <p style={{ fontSize: 13, color: 'var(--texto-suave)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px' }}>
          Fotos adicionales
        </p>
        <p style={{ fontSize: 14, color: 'var(--texto-suave)', margin: '0 0 10px' }}>
          Las imágenes del catálogo se incluyen automáticamente.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {fotosExistentes.map((f) => (
            <div key={f.id} style={{ position: 'relative' }}>
              <img src={f.url} alt="" style={{ width: 90, height: 90, objectFit: 'cover', borderRadius: 10, border: '1px solid var(--crema-oscuro)', display: 'block' }} />
              <button onClick={() => quitarFotoExistente(f)} style={{ position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: '50%', border: 'none', background: '#7B1F2E', color: '#fff', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>
          ))}
          {fotasNuevas.map((f, i) => (
            <div key={i} style={{ position: 'relative' }}>
              <img src={f.preview} alt="" style={{ width: 90, height: 90, objectFit: 'cover', borderRadius: 10, border: '2px solid var(--bordeaux)', display: 'block' }} />
              <button onClick={() => quitarFotoNueva(i)} style={{ position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: '50%', border: 'none', background: '#7B1F2E', color: '#fff', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>
          ))}
          <button
            onClick={() => fileRef.current?.click()}
            style={{ width: 90, height: 90, borderRadius: 10, border: '2px dashed var(--crema-oscuro)', background: '#fff', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, color: 'var(--texto-suave)', fontSize: 13 }}
          >
            <span style={{ fontSize: 22 }}>+</span>
            <span>Agregar</span>
          </button>
          <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={onFotos} />
        </div>
      </div>

      {error && <p style={{ color: '#b91c1c', fontSize: 15, margin: 0 }}>{error}</p>}

      {/* Botones */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button onClick={guardar} disabled={guardando} style={{ ...btn.base, ...btn.bordeaux, opacity: guardando ? 0.6 : 1 }}>
          {guardando ? 'Guardando...' : 'Guardar presupuesto'}
        </button>
        <button onClick={() => setShowPreview(v => !v)} style={{ ...btn.base, ...btn.outline }}>
          {showPreview ? 'Ocultar preview' : 'Ver preview'}
        </button>
        {onCancelar && (
          <button onClick={onCancelar} style={{ ...btn.base, ...btn.ghost }}>Cancelar</button>
        )}
      </div>

      {showPreview && (
        <div style={{ marginTop: 8 }}>
          <Preview form={form} opciones={opciones} fotosExtra={fotosPreview} />
        </div>
      )}
    </div>
  );
}

// ── Lista ─────────────────────────────────────────────────────────────────
function ListaPresupuestos({ presupuestos, onEditar, onEliminar, onNuevo }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <p style={{ fontSize: 17, color: 'var(--texto-suave)', margin: 0 }}>
          {presupuestos.length} presupuesto{presupuestos.length !== 1 ? 's' : ''}
        </p>
        <button onClick={onNuevo} style={{ ...btn.base, ...btn.bordeaux }}>+ Nuevo presupuesto</button>
      </div>

      {presupuestos.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--texto-suave)' }}>
          <p style={{ fontFamily: 'var(--serif)', fontSize: 28, margin: '0 0 10px', color: 'var(--bordeaux)' }}>Todavía no hay presupuestos</p>
          <p style={{ fontSize: 17 }}>Creá el primero con el botón de arriba.</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {presupuestos.map(p => {
          const opciones = parseOpciones(p.items);
          const total = p.total || opciones.reduce((s, op) => s + totalOpcion(op.items), 0);
          const nOpciones = opciones.length;
          return (
            <div key={p.id} style={{ background: '#fff', borderRadius: 14, border: '1px solid var(--crema-oscuro)', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 180 }}>
                <p style={{ fontWeight: 500, fontSize: 18, color: 'var(--texto)', margin: '0 0 4px' }}>{p.cliente}</p>
                <p style={{ fontSize: 14, color: 'var(--texto-suave)', margin: 0 }}>
                  {p.fecha ? fmtFecha(p.fecha) : ''}
                  {p.personas ? ` · ${p.personas} personas` : ''}
                  {nOpciones > 1 ? ` · ${nOpciones} opciones` : ''}
                </p>
              </div>
              {total > 0 && (
                <p style={{ fontFamily: 'var(--serif)', fontSize: 22, color: 'var(--bordeaux)', margin: 0 }}>
                  ${fmt(total)}
                </p>
              )}
              {p.fotos?.length > 0 && (
                <div style={{ display: 'flex', gap: 6 }}>
                  {p.fotos.slice(0, 3).map(f => (
                    <img key={f.id} src={f.url} alt="" style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--crema-oscuro)' }} />
                  ))}
                  {p.fotos.length > 3 && <div style={{ width: 44, height: 44, borderRadius: 8, background: 'var(--crema)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: 'var(--texto-suave)' }}>+{p.fotos.length - 3}</div>}
                </div>
              )}
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => onEditar(p)} style={{ ...btn.base, ...btn.outline, padding: '7px 16px', fontSize: 15 }}>Editar</button>
                <button onClick={() => onEliminar(p)} style={{ ...btn.base, ...btn.danger, padding: '7px 16px', fontSize: 15 }}>Eliminar</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Detalle + PDF ─────────────────────────────────────────────────────────
function DetallePresupuesto({ pres, onVolver, onEditar }) {
  const imprimirPDF = () => {
    const contenido = document.getElementById('presupuesto-preview');
    if (!contenido) return;
    const w = window.open('', '_blank');
    w.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Presupuesto ${pres.cliente}</title>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    :root{--bordeaux:#7B1F2E;--crema:#FAF7F2;--crema-oscuro:#F0EBE1;--texto:#2C1A1F;--texto-suave:#9b7b6b;--serif:'Cormorant Garamond',serif;--sans:'Inter',sans-serif}
    body{font-family:var(--sans);background:#FAF7F2;padding:0}
    @page{margin:0;size:A4}
    @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}#presupuesto-preview{border:none;border-radius:0;padding:40px 48px}}
  </style>
</head>
<body>${contenido.outerHTML}</body>
</html>`);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); w.close(); }, 800);
  };

  const opciones = parseOpciones(pres.items);
  const fotosExtra = (pres.fotos || []).map(f => ({ url: f.url }));

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
        <button onClick={onVolver} style={{ ...btn.base, ...btn.ghost }}>← Volver</button>
        <button onClick={onEditar} style={{ ...btn.base, ...btn.outline }}>Editar</button>
        <button onClick={imprimirPDF} style={{ ...btn.base, ...btn.bordeaux }}>Descargar PDF</button>
      </div>
      <Preview form={pres} opciones={opciones} fotosExtra={fotosExtra} />
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────
export default function Presupuestos() {
  const [presupuestos, setPresupuestos] = useState([]);
  const [catalogo, setCatalogo] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [vista, setVista] = useState('lista');
  const [seleccionado, setSeleccionado] = useState(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const [rPres, rProd] = await Promise.all([
        api.get('/presupuestos'),
        api.get('/productos'),
      ]);
      setPresupuestos(rPres.data);
      setCatalogo(rProd.data.filter(p => p.activo));
    } catch (e) {
      console.error(e);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const handleGuardado = (pres) => {
    cargar();
    setSeleccionado(pres);
    setVista('detalle');
  };

  const handleEliminar = async (p) => {
    if (!confirm(`¿Eliminar el presupuesto de ${p.cliente}?`)) return;
    try {
      await api.delete(`/presupuestos/${p.id}`);
      cargar();
    } catch {
      alert('No se pudo eliminar. Intentá de nuevo.');
    }
  };

  return (
    <div className="admin-page" style={{ maxWidth: 1100 }}>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 42, color: 'var(--texto)', margin: 0 }}>
          Presupuestos
        </h2>
        <p style={{ color: 'var(--texto-suave)', fontSize: 17, marginTop: 4 }}>
          Armá y enviá presupuestos a tus clientes
        </p>
      </div>

      {cargando && vista === 'lista' ? (
        <p style={{ color: 'var(--texto-suave)' }}>Cargando...</p>
      ) : vista === 'lista' ? (
        <ListaPresupuestos
          presupuestos={presupuestos}
          onNuevo={() => { setSeleccionado(null); setVista('nuevo'); }}
          onEditar={(p) => { setSeleccionado(p); setVista('editar'); }}
          onEliminar={handleEliminar}
        />
      ) : vista === 'detalle' ? (
        <DetallePresupuesto
          pres={seleccionado}
          onVolver={() => setVista('lista')}
          onEditar={() => setVista('editar')}
        />
      ) : (
        <div>
          <h3 style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 28, color: 'var(--texto)', margin: '0 0 20px' }}>
            {vista === 'editar' ? `Editando — ${seleccionado?.cliente}` : 'Nuevo presupuesto'}
          </h3>
          <FormPresupuesto
            inicial={vista === 'editar' ? seleccionado : null}
            catalogo={catalogo}
            onGuardado={handleGuardado}
            onCancelar={() => setVista(seleccionado ? 'detalle' : 'lista')}
          />
        </div>
      )}
    </div>
  );
}
