import { useEffect, useState, useMemo } from 'react';
import api from '../../api/index.js';

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const CATS_RECETA = ['tortas','minis','budines','shots','sub-receta'];

export default function Insumos() {
  const [tab, setTab] = useState('insumos');

  return (
    <div style={{ padding: '32px 32px 80px', maxWidth: 1100, margin: '0 auto' }}>
      <h1 style={{ fontFamily: 'var(--serif)', fontSize: 28, fontWeight: 400, color: 'var(--texto)', marginBottom: 6 }}>
        Insumos & Costos
      </h1>
      <p style={{ color: 'var(--texto-suave)', fontSize: 14, marginBottom: 32 }}>
        Precios de materias primas · Recetas con costo automático · Análisis de márgenes por producto
      </p>

      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--crema-oscuro)', marginBottom: 36 }}>
        {[
          { id: 'insumos', label: '📦 Insumos' },
          { id: 'recetas', label: '📋 Recetas' },
          { id: 'analisis', label: '📊 Análisis' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '12px 24px', border: 'none', background: 'transparent',
            borderBottom: tab === t.id ? '2px solid var(--bordeaux)' : '2px solid transparent',
            color: tab === t.id ? 'var(--bordeaux)' : 'var(--texto-suave)',
            fontSize: 14, fontWeight: tab === t.id ? 600 : 400, cursor: 'pointer',
            fontFamily: 'var(--sans)', transition: 'all 0.2s',
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'insumos'  && <TabInsumos />}
      {tab === 'recetas'  && <TabRecetas />}
      {tab === 'analisis' && <TabAnalisis />}
    </div>
  );
}

/* ══ TAB INSUMOS ══════════════════════════════════════════ */
function TabInsumos() {
  const [insumos, setInsumos] = useState([]);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ nombre: '', unidad: 'kg', costo: '' });
  const [saving, setSaving] = useState(false);
  const [snapMsg, setSnapMsg] = useState('');
  // (inflación removida por el momento)
  const [buscar, setBuscar] = useState('');

  useEffect(() => { cargar(); }, []);

  function cargar() { api.get('/insumos').then(r => setInsumos(r.data)); }

  // Separar packaging del resto
  const pkgItems = insumos.filter(i => i.nombre.startsWith('Packaging'));
  const resto = insumos.filter(i => !i.nombre.startsWith('Packaging'));
  const filtrados = buscar ? resto.filter(i => i.nombre.toLowerCase().includes(buscar.toLowerCase())) : resto;

  async function guardar() {
    if (!form.nombre || !form.costo) return;
    setSaving(true);
    try {
      if (modal === 'nuevo') await api.post('/insumos', { ...form, costo: parseFloat(form.costo) });
      else await api.put(`/insumos/${modal.id}`, { ...form, costo: parseFloat(form.costo) });
      setModal(null);
      cargar();
    } finally { setSaving(false); }
  }

  async function eliminar(id) {
    if (!confirm('¿Eliminar este insumo?')) return;
    await api.delete(`/insumos/${id}`);
    cargar();
  }

  async function tomarSnapshot() {
    await api.post('/insumos/snapshot');
    const ahora = new Date();
    setSnapMsg(`✓ Snapshot ${MESES[ahora.getMonth()]} ${ahora.getFullYear()}`);
    setTimeout(() => setSnapMsg(''), 5000);
  }

  async function sincronizarBase() {
    try {
      const r = await api.post('/insumos/sync-insumo/Base Brownie (1 receta)');
      alert(`Base Brownie actualizado a $${Math.round(r.data.nuevo_costo).toLocaleString('es-AR')}`);
      cargar();
    } catch { alert('No se pudo sincronizar. Verificá que la receta "Base Brownie" esté cargada.'); }
  }

  const rowInsumo = (ins, isLast) => (
    <tr key={ins.id} style={{ borderBottom: isLast ? 'none' : '1px solid var(--crema-oscuro)' }}>
      <td style={{ padding: '9px 16px', fontSize: 15, fontWeight: 500, color: 'var(--texto)', fontFamily: 'var(--serif)' }}>{ins.nombre}</td>
      <td style={{ padding: '9px 16px', fontSize: 13, color: 'var(--texto-suave)' }}>{ins.unidad}</td>
      <td style={{ padding: '9px 16px', fontSize: 15, fontWeight: 500, color: 'var(--bordeaux)' }}>
        ${parseFloat(ins.costo).toLocaleString('es-AR')} / {ins.unidad}
      </td>
      <td style={{ padding: '9px 16px' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => { setForm({ nombre: ins.nombre, unidad: ins.unidad, costo: ins.costo }); setModal(ins); }} style={btnTabla}>Editar</button>
          <button onClick={() => eliminar(ins.id)} style={{ ...btnTabla, color: '#c0392b' }}>✕</button>
        </div>
      </td>
      <td style={{ padding: '9px 16px', fontSize: 12, color: 'var(--texto-suave)' }}>
        {ins.actualizado_en ? new Date(ins.actualizado_en).toLocaleDateString('es-AR') : '—'}
      </td>
    </tr>
  );

  return (
    <div>
      {/* Acciones rápidas */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 10 }}>
        <input value={buscar} onChange={e => setBuscar(e.target.value)} placeholder="Buscar insumo..." style={{ ...inputStyle, width: 240, padding: '8px 14px' }} />
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {snapMsg && <span style={{ fontSize: 13, color: '#2d7a3a', fontWeight: 500 }}>{snapMsg}</span>}
          <button onClick={tomarSnapshot} style={btnSecundario}>📸 Snapshot del mes</button>
          <button onClick={() => { setForm({ nombre: '', unidad: 'kg', costo: '' }); setModal('nuevo'); }} style={btnPrimario}>+ Nuevo insumo</button>
        </div>
      </div>

      {/* Packaging — bloque especial arriba */}
      {pkgItems.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <span style={{ fontSize: 11, color: 'var(--texto-suave)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>Packaging (transversal a todas las recetas)</span>
            <div style={{ flex: 1, height: 1, background: 'var(--crema-oscuro)' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
            {pkgItems.map(ins => (
              <div key={ins.id} style={{ background: '#fff', border: '1.5px solid var(--crema-oscuro)', borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <div>
                  <p style={{ fontSize: 14, color: 'var(--texto)', margin: 0, fontFamily: 'var(--serif)' }}>{ins.nombre}</p>
                  <p style={{ fontSize: 13, color: 'var(--bordeaux)', fontWeight: 600, margin: '4px 0 0' }}>${parseFloat(ins.costo).toLocaleString('es-AR')} / u</p>
                </div>
                <button onClick={() => { setForm({ nombre: ins.nombre, unidad: ins.unidad, costo: ins.costo }); setModal(ins); }} style={btnTabla}>Editar</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sync Base Brownie */}
      <div style={{ background: '#fffbf0', border: '1px solid #f0e0a0', borderRadius: 10, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <p style={{ margin: 0, fontSize: 13, color: '#7a5c00' }}>
          💡 <strong>Base Brownie (1 receta)</strong> es un insumo derivado. Al actualizar los costos de sus ingredientes, sincronizalo para que todas las recetas que lo usan reflejen el precio real.
        </p>
        <button onClick={sincronizarBase} style={{ ...btnSecundario, whiteSpace: 'nowrap', flexShrink: 0, borderColor: '#d4a800', color: '#7a5c00' }}>
          ↻ Sincronizar precio
        </button>
      </div>

      {/* Tabla principal */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid var(--crema-oscuro)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--crema-oscuro)', background: 'var(--crema)' }}>
              {['Insumo', 'Unidad', 'Costo actual', '', 'Actualizado'].map(h => (
                <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 11, color: 'var(--texto-suave)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtrados.map((ins, i) => rowInsumo(ins, i === filtrados.length - 1))}
            {filtrados.length === 0 && (
              <tr><td colSpan={5} style={{ padding: '48px', textAlign: 'center', color: 'var(--texto-suave)' }}>Sin resultados</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <p style={{ fontSize: 12, color: 'var(--texto-suave)', marginTop: 10 }}>
        {filtrados.length} insumos · Cada edición guarda un snapshot automático del mes actual · Usá "Snapshot del mes" al inicio de cada mes para fijar todos los precios.
      </p>

      {/* Modal insumo */}
      {modal && (
        <Modal title={modal === 'nuevo' ? 'Nuevo insumo' : `Editar: ${modal.nombre}`} onClose={() => setModal(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Campo label="Nombre"><input value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} style={inputStyle} /></Campo>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Campo label="Unidad de compra">
                <select value={form.unidad} onChange={e => setForm(f => ({ ...f, unidad: e.target.value }))} style={inputStyle}>
                  <option value="kg">kg (por kilo)</option>
                  <option value="L">L (por litro)</option>
                  <option value="u">u (por unidad)</option>
                  <option value="g">g (por gramo)</option>
                </select>
              </Campo>
              <Campo label={`Precio por ${form.unidad}`}>
                <input type="number" value={form.costo} onChange={e => setForm(f => ({ ...f, costo: e.target.value }))} style={inputStyle} />
              </Campo>
            </div>
            <p style={{ fontSize: 12, color: 'var(--texto-suave)', margin: 0 }}>Al guardar se registra el costo en el historial del mes actual.</p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
            <button onClick={() => setModal(null)} style={btnSecundario}>Cancelar</button>
            <button onClick={guardar} disabled={saving} style={btnPrimario}>{saving ? '...' : 'Guardar'}</button>
          </div>
        </Modal>
      )}

    </div>
  );
}

/* ══ TAB RECETAS ══════════════════════════════════════════ */
function TabRecetas() {
  const [recetas, setRecetas] = useState([]);
  const [insumos, setInsumos] = useState([]);
  const [productos, setProductos] = useState([]);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ nombre: '', categoria: 'tortas', producto_id: '', rendimiento: 1, ingredientes: [] });
  const [saving, setSaving] = useState(false);
  const [expandido, setExpandido] = useState(null);
  // inline edit: { ingId, valor }
  const [editingQty, setEditingQty] = useState(null);

  useEffect(() => {
    cargar();
    api.get('/insumos').then(r => setInsumos(r.data));
    api.get('/productos').then(r => setProductos(r.data));
  }, []);

  function cargar() { api.get('/insumos/recetas').then(r => setRecetas(r.data)); }

  // Orden de secciones igual al front
  const CAT_ORDER = { tortas: 0, minis: 1, budines: 2, shots: 3, 'sub-receta': 4 };
  const CAT_LABEL = { tortas: '🎂 Tortas', minis: '🧁 Minis & Para el té', budines: '🍞 Budines', shots: '🥃 Shots', 'sub-receta': '⚙️ Sub-recetas' };

  const recetasOrdenadas = useMemo(() => {
    return [...recetas].sort((a, b) => {
      const ca = CAT_ORDER[a.categoria] ?? 9;
      const cb = CAT_ORDER[b.categoria] ?? 9;
      return ca !== cb ? ca - cb : a.nombre.localeCompare(b.nombre);
    });
  }, [recetas]);

  const categorias = useMemo(() => [...new Set(recetasOrdenadas.map(r => r.categoria))], [recetasOrdenadas]);

  function costoLocal(rec) {
    let total = 0;
    for (const ing of rec.ingredientes || []) {
      if (!ing.costo) continue;
      total += (ing.unidad === 'kg' || ing.unidad === 'L') ? (ing.cantidad / 1000) * ing.costo : ing.cantidad * ing.costo;
    }
    return total;
  }

  async function guardar() {
    setSaving(true);
    try {
      const payload = {
        ...form,
        producto_id: form.producto_id || null,
        rendimiento: parseInt(form.rendimiento) || 1,
        ingredientes: form.ingredientes.filter(i => i.insumo_id).map(i => ({
          insumo_id: parseInt(i.insumo_id),
          cantidad: parseFloat(i.cantidad) || 0,
        })),
      };
      if (modal === 'nuevo') await api.post('/insumos/recetas', payload);
      else await api.put(`/insumos/recetas/${modal.id}`, payload);
      setModal(null);
      cargar();
    } finally { setSaving(false); }
  }

  async function eliminar(id) {
    if (!confirm('¿Eliminar esta receta?')) return;
    await api.delete(`/insumos/recetas/${id}`);
    cargar();
  }

  async function guardarQty(ingId) {
    if (!editingQty || editingQty.ingId !== ingId) return;
    await api.patch(`/insumos/receta-ingredientes/${ingId}`, { cantidad: parseFloat(editingQty.valor) });
    setEditingQty(null);
    cargar();
  }

  // Determina si mostrar el nombre del producto vinculado
  function nombreDiferente(recNombre, prodNombre) {
    if (!prodNombre) return false;
    const normalize = s => s.toLowerCase().replace(/[^a-záéíóúñ]/g, '');
    const a = normalize(recNombre), b = normalize(prodNombre);
    return a !== b && !a.startsWith(b.substring(0, Math.min(b.length, 10)));
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24 }}>
        <button onClick={() => { setForm({ nombre: '', categoria: 'tortas', producto_id: '', rendimiento: 1, ingredientes: [] }); setModal('nuevo'); }} style={btnPrimario}>
          + Nueva receta
        </button>
      </div>

      {/* Secciones agrupadas por categoría */}
      {categorias.map(cat => {
        const recsDecat = recetasOrdenadas.filter(r => r.categoria === cat);
        // Columnas: nombre | costo/u | precio | margen | acciones
        const COLS = 'minmax(180px,1fr) 110px 110px 80px 100px';
        return (
          <div key={cat} style={{ marginBottom: 40 }}>
            {/* Header de sección */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 0 }}>
              <span style={{ fontSize: 12, color: 'var(--texto-suave)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>
                {CAT_LABEL[cat] || cat}
              </span>
              <span style={{ fontSize: 12, color: 'var(--texto-suave)', background: 'var(--crema)', borderRadius: 20, padding: '1px 8px' }}>{recsDecat.length}</span>
              <div style={{ flex: 1, height: 1, background: 'var(--crema-oscuro)' }} />
            </div>

            {/* Header de columnas — una sola vez por sección */}
            <div style={{ display: 'grid', gridTemplateColumns: COLS, padding: '8px 16px', gap: 8 }}>
              <span style={colHead}>Receta</span>
              <span style={{ ...colHead, textAlign: 'right' }}>Costo/u</span>
              <span style={{ ...colHead, textAlign: 'right' }}>Precio venta</span>
              <span style={{ ...colHead, textAlign: 'right' }}>Margen</span>
              <span />
            </div>

            <div style={{ background: '#fff', borderRadius: 10, border: '1px solid var(--crema-oscuro)', overflow: 'hidden' }}>
              {recsDecat.map((rec, idx) => {
                const costo = costoLocal(rec);
                const costoPorU = rec.rendimiento > 0 ? costo / rec.rendimiento : 0;
                const margen = rec.precio_venta ? rec.precio_venta - costoPorU : null;
                const margenPct = (rec.precio_venta && costoPorU > 0) ? ((rec.precio_venta - costoPorU) / rec.precio_venta * 100) : null;
                const isOpen = expandido === rec.id;
                const margenColor = margenPct >= 60 ? '#2d7a3a' : margenPct >= 35 ? '#d97706' : '#c0392b';
                const isLast = idx === recsDecat.length - 1;

                return (
                  <div key={rec.id} style={{ borderBottom: (!isLast || isOpen) ? '1px solid var(--crema-oscuro)' : 'none' }}>
                    {/* Fila colapsada — grid de columnas */}
                    <div
                      style={{ display: 'grid', gridTemplateColumns: COLS, alignItems: 'center', padding: '11px 16px', gap: 8, cursor: 'pointer' }}
                      onClick={() => setExpandido(isOpen ? null : rec.id)}
                    >
                      {/* Nombre */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                        <span style={{ fontSize: 11, color: 'var(--texto-suave)', flexShrink: 0 }}>{isOpen ? '▾' : '▸'}</span>
                        <span style={{ fontFamily: 'var(--serif)', fontSize: 15, color: 'var(--texto)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {rec.nombre}
                        </span>
                      </div>
                      {/* Costo/u */}
                      <span style={{ textAlign: 'right', fontSize: 14, color: 'var(--texto)', fontWeight: 500 }}>
                        {costoPorU > 0 ? `$${Math.round(costoPorU).toLocaleString('es-AR')}` : '—'}
                      </span>
                      {/* Precio */}
                      <span style={{ textAlign: 'right', fontSize: 14, color: rec.precio_venta ? 'var(--bordeaux)' : 'var(--texto-suave)', fontWeight: 500 }}>
                        {rec.precio_venta ? `$${rec.precio_venta.toLocaleString('es-AR')}` : '—'}
                      </span>
                      {/* Margen */}
                      <span style={{ textAlign: 'right', fontSize: 14, fontWeight: 600, color: margenPct !== null ? margenColor : 'var(--texto-suave)' }}>
                        {margenPct !== null ? `${margenPct.toFixed(0)}%` : '—'}
                      </span>
                      {/* Acciones */}
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }} onClick={e => e.stopPropagation()}>
                        <button onClick={() => {
                          setForm({ nombre: rec.nombre, categoria: rec.categoria || 'tortas', producto_id: rec.producto_id || '', rendimiento: rec.rendimiento, ingredientes: rec.ingredientes.map(i => ({ insumo_id: i.insumo_id, cantidad: i.cantidad })) });
                          setModal(rec);
                        }} style={btnTabla}>Editar</button>
                        <button onClick={() => eliminar(rec.id)} style={{ ...btnTabla, color: '#c0392b' }}>✕</button>
                      </div>
                    </div>

                    {/* Detalle expandido — solo tabla de ingredientes */}
                    {isOpen && (
                      <div style={{ padding: '0 16px 14px', borderTop: '1px solid var(--crema-oscuro)', background: '#faf9f7' }}>
                        <p style={{ fontSize: 12, color: 'var(--texto-suave)', margin: '10px 0 8px' }}>
                          Rendimiento: <strong>{rec.rendimiento}u</strong> · Costo total receta: <strong>${Math.round(costo).toLocaleString('es-AR')}</strong>
                          {margen !== null && <> · Ganancia/u: <strong style={{ color: margen > 0 ? '#2d7a3a' : '#c0392b' }}>${Math.round(margen).toLocaleString('es-AR')}</strong></>}
                        </p>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid var(--crema-oscuro)' }}>
                              <th style={thStyle}>Ingrediente</th>
                              <th style={{ ...thStyle, textAlign: 'center' }}>Cantidad <span style={{ fontSize: 10, fontWeight: 400, textTransform: 'none' }}>· clic para editar</span></th>
                              <th style={{ ...thStyle, textAlign: 'right' }}>Costo parcial</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rec.ingredientes.map((ing) => {
                              const c = (ing.unidad === 'kg' || ing.unidad === 'L') ? (ing.cantidad / 1000) * ing.costo : ing.cantidad * ing.costo;
                              const unidadLabel = ing.unidad === 'kg' || ing.unidad === 'L' ? 'g' : 'u';
                              const isEditing = editingQty?.ingId === ing.id;
                              return (
                                <tr key={ing.id} style={{ borderBottom: '1px solid #f0ebe4' }}>
                                  <td style={{ padding: '7px 0', color: 'var(--texto)', fontSize: 13 }}>{ing.insumo_nombre}</td>
                                  <td style={{ padding: '7px 0', textAlign: 'center' }}>
                                    {isEditing ? (
                                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                        <input type="number" value={editingQty.valor}
                                          onChange={e => setEditingQty(q => ({ ...q, valor: e.target.value }))}
                                          onBlur={() => guardarQty(ing.id)}
                                          onKeyDown={e => { if (e.key === 'Enter') e.target.blur(); if (e.key === 'Escape') setEditingQty(null); }}
                                          autoFocus
                                          style={{ width: 70, padding: '4px 8px', borderRadius: 6, border: '1.5px solid var(--bordeaux)', fontSize: 13, textAlign: 'center' }} />
                                        <span style={{ fontSize: 11, color: 'var(--texto-suave)' }}>{unidadLabel}</span>
                                      </div>
                                    ) : (
                                      <span onClick={() => setEditingQty({ ingId: ing.id, valor: ing.cantidad })}
                                        style={{ cursor: 'pointer', color: 'var(--texto-suave)', fontSize: 13, borderBottom: '1px dashed #ccc', paddingBottom: 1 }}
                                        title="Clic para editar">
                                        {ing.cantidad} {unidadLabel}
                                      </span>
                                    )}
                                  </td>
                                  <td style={{ padding: '7px 0', textAlign: 'right', color: 'var(--bordeaux)', fontWeight: 500, fontSize: 13 }}>
                                    ${Math.round(c).toLocaleString('es-AR')}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {recetas.length === 0 && (
        <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--texto-suave)' }}>No hay recetas cargadas</div>
      )}

      {/* Modal editar/crear */}
      {modal && (
        <Modal title={modal === 'nuevo' ? 'Nueva receta' : `Editar: ${modal.nombre}`} onClose={() => setModal(null)} wide>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 12 }}>
              <Campo label="Nombre"><input value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} style={inputStyle} /></Campo>
              <Campo label="Categoría">
                <select value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))} style={inputStyle}>
                  {CATS_RECETA.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </Campo>
              <Campo label="Rendimiento (u)">
                <input type="number" value={form.rendimiento} onChange={e => setForm(f => ({ ...f, rendimiento: e.target.value }))} style={inputStyle} min={1} />
              </Campo>
            </div>
            <Campo label="Producto del catálogo (opcional — vincula precio)">
              <select value={form.producto_id} onChange={e => setForm(f => ({ ...f, producto_id: e.target.value }))} style={inputStyle}>
                <option value="">Sin vincular</option>
                {productos.map(p => <option key={p.id} value={p.id}>{p.nombre} — ${p.precio.toLocaleString('es-AR')}</option>)}
              </select>
            </Campo>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <label style={labelStyle}>Ingredientes</label>
                <button onClick={() => setForm(f => ({ ...f, ingredientes: [...f.ingredientes, { insumo_id: '', cantidad: '' }] }))} style={btnSecundario}>+ Ingrediente</button>
              </div>
              {form.ingredientes.map((ing, i) => {
                const sel = insumos.find(ins => ins.id === parseInt(ing.insumo_id));
                return (
                  <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ flex: 2 }}>
                      <select value={ing.insumo_id} onChange={e => { const ings = [...form.ingredientes]; ings[i] = { ...ings[i], insumo_id: e.target.value }; setForm(f => ({ ...f, ingredientes: ings })); }} style={inputStyle}>
                        <option value="">Seleccionar...</option>
                        {insumos.map(ins => <option key={ins.id} value={ins.id}>{ins.nombre} (${ins.costo.toLocaleString('es-AR')}/{ins.unidad})</option>)}
                      </select>
                    </div>
                    <div style={{ flex: 1, position: 'relative' }}>
                      <input type="number" value={ing.cantidad} onChange={e => { const ings = [...form.ingredientes]; ings[i] = { ...ings[i], cantidad: e.target.value }; setForm(f => ({ ...f, ingredientes: ings })); }} style={{ ...inputStyle, paddingRight: 36 }} placeholder="0" />
                      {sel && <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'var(--texto-suave)' }}>{sel.unidad === 'kg' || sel.unidad === 'L' ? 'g' : 'u'}</span>}
                    </div>
                    <button onClick={() => setForm(f => ({ ...f, ingredientes: f.ingredientes.filter((_, j) => j !== i) }))} style={{ ...btnTabla, color: '#c0392b', width: 32, height: 40 }}>✕</button>
                  </div>
                );
              })}
              {form.ingredientes.length === 0 && <p style={{ fontSize: 13, color: 'var(--texto-suave)' }}>Hacé clic en "+ Ingrediente" para agregar.</p>}
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
            <button onClick={() => setModal(null)} style={btnSecundario}>Cancelar</button>
            <button onClick={guardar} disabled={saving} style={btnPrimario}>{saving ? '...' : 'Guardar receta'}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ══ TAB ANÁLISIS ═════════════════════════════════════════ */
function TabAnalisis() {
  const ahora = new Date();
  const [año, setAño] = useState(ahora.getFullYear());
  const [mes, setMes] = useState(ahora.getMonth() + 1);
  const [datos, setDatos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [catFiltro, setCatFiltro] = useState('todas');
  const [sortField, setSortField] = useState('margen_pct');
  const [sortAsc, setSortAsc] = useState(false);

  useEffect(() => { cargar(); }, [año, mes]);

  function cargar() {
    setLoading(true);
    api.get(`/insumos/analisis?año=${año}&mes=${mes}`).then(r => setDatos(r.data)).finally(() => setLoading(false));
  }

  function toggleSort(f) {
    if (sortField === f) setSortAsc(a => !a);
    else { setSortField(f); setSortAsc(false); }
  }

  const categorias = useMemo(() => [...new Set(datos.map(d => d.categoria))].sort(), [datos]);

  const filtrados = useMemo(() => {
    let arr = catFiltro === 'todas' ? datos : datos.filter(d => d.categoria === catFiltro);
    arr = arr.filter(d => d.categoria !== 'sub-receta'); // Ocultar sub-recetas del análisis
    return [...arr].sort((a, b) => {
      const va = a[sortField] ?? -999999;
      const vb = b[sortField] ?? -999999;
      return sortAsc ? va - vb : vb - va;
    });
  }, [datos, catFiltro, sortField, sortAsc]);

  // KPIs resumen
  const conPrecio = filtrados.filter(d => d.precio_venta && d.costo_por_unidad > 0);
  const margenProm = conPrecio.length ? conPrecio.reduce((a, d) => a + d.margen_pct, 0) / conPrecio.length : null;
  const totalGanancia = filtrados.reduce((a, d) => a + (d.ganancia_mes || 0), 0);
  const totalIngresos = filtrados.reduce((a, d) => a + (d.ingresos_mes || 0), 0);
  const conVentas = filtrados.filter(d => d.unidades_vendidas > 0).length;

  const SortBtn = ({ field, label }) => (
    <th onClick={() => toggleSort(field)} style={{ ...thStyle, textAlign: 'right', cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>
      {label} {sortField === field ? (sortAsc ? '↑' : '↓') : ''}
    </th>
  );

  const mesActual = mes === ahora.getMonth() + 1 && año === ahora.getFullYear();

  return (
    <div>
      {/* Selector de mes */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 14, color: 'var(--texto-suave)' }}>Período:</span>
        <select value={mes} onChange={e => setMes(parseInt(e.target.value))} style={{ ...inputStyle, width: 'auto', padding: '8px 12px' }}>
          {MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <input type="number" value={año} onChange={e => setAño(parseInt(e.target.value))} style={{ ...inputStyle, width: 80, padding: '8px 12px' }} min={2020} max={2030} />
      </div>

      {loading && <p style={{ color: 'var(--texto-suave)', padding: '40px', textAlign: 'center' }}>Calculando...</p>}

      {!loading && datos.length > 0 && (
        <>
          {/* KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 28 }}>
            <Kpi label="Recetas analizadas" value={filtrados.length} />
            {margenProm !== null && <Kpi label="Margen promedio" value={`${margenProm.toFixed(1)}%`} color={margenProm >= 50 ? '#2d7a3a' : margenProm >= 30 ? '#d97706' : '#c0392b'} />}
            {conVentas > 0 && <Kpi label="Productos vendidos" value={conVentas} />}
            {totalGanancia > 0 && <Kpi label="Ganancia estimada mes" value={`$${Math.round(totalGanancia).toLocaleString('es-AR')}`} color="#2d7a3a" />}
            {totalIngresos > 0 && <Kpi label="Ingresos del mes" value={`$${Math.round(totalIngresos).toLocaleString('es-AR')}`} />}
          </div>

          {/* Filtro de categoría */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
            {['todas', ...categorias.filter(c => c !== 'sub-receta')].map(c => (
              <button key={c} onClick={() => setCatFiltro(c)} style={{
                padding: '6px 14px', borderRadius: 50, border: '1.5px solid var(--crema-oscuro)',
                background: catFiltro === c ? 'var(--bordeaux)' : '#fff',
                color: catFiltro === c ? '#FAF7F2' : 'var(--texto-suave)',
                fontSize: 12, cursor: 'pointer',
              }}>
                {c === 'todas' ? 'Todas' : c}
              </button>
            ))}
          </div>

          {/* Tabla */}
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid var(--crema-oscuro)', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--crema-oscuro)', background: 'var(--crema)' }}>
                  <th style={{ ...thStyle, textAlign: 'left' }}>Receta</th>
                  <th style={thStyle}>Rend.</th>
                  <SortBtn field="costo_por_unidad" label="Costo/u" />
                  <SortBtn field="precio_venta" label="Precio" />
                  <SortBtn field="margen" label="Ganancia/u" />
                  <SortBtn field="margen_pct" label="Margen %" />
                  <SortBtn field="unidades_vendidas" label="Vendidas" />
                  <SortBtn field="ganancia_mes" label="Ganancia mes" />
                </tr>
              </thead>
              <tbody>
                {filtrados.map((d, i) => {
                  const c = d.margen_pct >= 60 ? '#2d7a3a' : d.margen_pct >= 35 ? '#d97706' : '#c0392b';
                  return (
                    <tr key={d.id} style={{ borderBottom: i === filtrados.length - 1 ? 'none' : '1px solid #f5f0eb' }}>
                      <td style={{ padding: '11px 14px', fontSize: 14, fontFamily: 'var(--serif)', color: 'var(--texto)', minWidth: 160 }}>
                        {d.nombre}
                        {d.producto_nombre && <span style={{ fontSize: 11, color: 'var(--texto-suave)', display: 'block' }}>→ {d.producto_nombre}</span>}
                      </td>
                      <td style={tdR}>{d.rendimiento}u</td>
                      <td style={tdR}>{d.costo_por_unidad > 0 ? `$${Math.round(d.costo_por_unidad).toLocaleString('es-AR')}` : '—'}</td>
                      <td style={{ ...tdR, color: 'var(--bordeaux)' }}>{d.precio_venta ? `$${d.precio_venta.toLocaleString('es-AR')}` : '—'}</td>
                      <td style={{ ...tdR, fontWeight: 600, color: d.margen > 0 ? '#2d7a3a' : '#c0392b' }}>
                        {d.margen !== null ? `$${Math.round(d.margen).toLocaleString('es-AR')}` : '—'}
                      </td>
                      <td style={{ ...tdR }}>
                        {d.margen_pct !== null
                          ? <span style={{ background: c + '18', color: c, padding: '3px 10px', borderRadius: 50, fontSize: 13, fontWeight: 700 }}>{d.margen_pct.toFixed(1)}%</span>
                          : '—'}
                      </td>
                      <td style={{ ...tdR, color: d.unidades_vendidas > 0 ? 'var(--texto)' : 'var(--texto-suave)' }}>
                        {d.unidades_vendidas > 0 ? d.unidades_vendidas : '—'}
                      </td>
                      <td style={{ ...tdR, fontWeight: 600, color: d.ganancia_mes > 0 ? '#2d7a3a' : 'var(--texto-suave)' }}>
                        {d.ganancia_mes > 0 ? `$${Math.round(d.ganancia_mes).toLocaleString('es-AR')}` : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p style={{ fontSize: 12, color: 'var(--texto-suave)', marginTop: 10 }}>
            Clic en los encabezados para ordenar · "Vendidas" y "Ganancia mes" requieren pedidos cargados en el período · Márgenes basados en {mesActual ? 'costos actuales' : `snapshot ${MESES[mes-1]} ${año}`}
          </p>
        </>
      )}

      {!loading && datos.length === 0 && (
        <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--texto-suave)' }}>
          <p>Cargá recetas en la pestaña "Recetas" para ver el análisis de márgenes.</p>
        </div>
      )}
    </div>
  );
}

/* ══ HELPERS ══════════════════════════════════════════════ */
function Modal({ title, onClose, children, wide }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 18, padding: '28px 28px 24px', width: '100%', maxWidth: wide ? 720 : 460, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontFamily: 'var(--serif)', fontSize: 19, color: 'var(--texto)', margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ border: 'none', background: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--texto-suave)', lineHeight: 1 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Campo({ label, children }) {
  return <div><label style={labelStyle}>{label}</label>{children}</div>;
}

function Kpi({ label, value, color }) {
  return (
    <div style={{ background: 'var(--crema)', borderRadius: 10, padding: '13px 16px' }}>
      <p style={{ fontSize: 10, color: 'var(--texto-suave)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 5px' }}>{label}</p>
      <p style={{ fontSize: 20, fontWeight: 700, color: color || 'var(--texto)', margin: 0 }}>{value}</p>
    </div>
  );
}

/* Estilos compartidos */
const btnPrimario = { padding: '9px 20px', borderRadius: 50, border: 'none', background: 'var(--bordeaux)', color: '#FAF7F2', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)', whiteSpace: 'nowrap' };
const btnSecundario = { padding: '9px 18px', borderRadius: 50, border: '1.5px solid var(--crema-oscuro)', background: '#fff', color: 'var(--texto-suave)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--sans)', whiteSpace: 'nowrap' };
const btnTabla = { padding: '5px 12px', borderRadius: 8, border: '1px solid var(--crema-oscuro)', background: '#fff', color: 'var(--texto-suave)', fontSize: 12, cursor: 'pointer' };
const inputStyle = { width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid var(--crema-oscuro)', background: '#fff', fontSize: 14, color: 'var(--texto)', outline: 'none', fontFamily: 'var(--sans)', boxSizing: 'border-box' };
const labelStyle = { display: 'block', fontSize: 11, color: 'var(--texto-suave)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 };
const thStyle = { padding: '10px 14px', textAlign: 'left', fontSize: 11, color: 'var(--texto-suave)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' };
const tdR = { padding: '11px 14px', textAlign: 'right', fontSize: 13, color: 'var(--texto)' };
const kpiLabel = { fontSize: 10, color: 'var(--texto-suave)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 };
const colHead = { fontSize: 10, color: 'var(--texto-suave)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 };
