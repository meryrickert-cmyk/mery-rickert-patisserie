import { useEffect, useState } from 'react';
import api from '../../api/index.js';

const CATS = ['tortas', 'para el te', 'budines', 'shots'];
const FORM_VACIO = { nombre: '', descripcion: '', precio: '', stock: '99', categoria: 'tortas', orden: '0' };
const inputStyle = { padding: '10px 14px', borderRadius: 10, border: '1.5px solid var(--crema-oscuro)', fontSize: 13, color: 'var(--texto)', outline: 'none', fontFamily: 'var(--sans)', width: '100%', boxSizing: 'border-box', background: '#fff' };
const labelStyle = { fontSize: 12, color: 'var(--texto-suave)', display: 'block', marginBottom: 5 };

export default function Productos() {
  const [productos, setProductos] = useState([]);
  const [catFiltro, setCatFiltro] = useState('tortas');
  const [form, setForm] = useState(FORM_VACIO);
  const [editando, setEditando] = useState(null);
  const [imagenes, setImagenes] = useState([]);
  const [modal, setModal] = useState(false);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  function cargar() {
    api.get(`/productos/admin/todos?categoria=${catFiltro}`).then(r => setProductos(r.data));
  }
  useEffect(cargar, [catFiltro]);

  function abrirNuevo() {
    setForm({ ...FORM_VACIO, categoria: catFiltro });
    setEditando(null); setImagenes([]); setError(''); setModal(true);
  }
  function abrirEditar(p) {
    setForm({ nombre: p.nombre, descripcion: p.descripcion || '', precio: p.precio, stock: p.stock, categoria: p.categoria, orden: p.orden ?? 0 });
    setEditando(p); setImagenes([]); setError(''); setModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault(); setError(''); setGuardando(true);
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    for (const f of imagenes) fd.append('imagenes', f);
    try {
      if (editando) await api.put(`/productos/${editando.id}`, fd);
      else await api.post('/productos', fd);
      setModal(false); cargar();
    } catch (err) {
      console.error('Error al guardar producto:', err);
      const msg = err.response?.data?.error
        || err.response?.data?.message
        || err.message
        || 'Error al guardar';
      setError(msg);
    }
    finally { setGuardando(false); }
  }

  async function toggleActivo(p) {
    const fd = new FormData(); fd.append('activo', p.activo ? 0 : 1);
    await api.put(`/productos/${p.id}`, fd);
    cargar();
  }

  async function eliminarImagen(productoId, imgId) {
    await api.delete(`/productos/${productoId}/imagenes/${imgId}`);
    setEditando(e => e ? { ...e, imagenes: e.imagenes.filter(i => i.id !== imgId) } : e);
    cargar();
  }

  async function moverImagen(productoId, imagenes, idx, direccion) {
    const nuevas = [...imagenes];
    const destino = idx + direccion;
    if (destino < 0 || destino >= nuevas.length) return;
    [nuevas[idx], nuevas[destino]] = [nuevas[destino], nuevas[idx]];
    const items = nuevas.map((img, i) => ({ id: img.id, orden: i }));
    await api.patch(`/productos/${productoId}/imagenes/reordenar`, { items });
    setEditando(e => e ? { ...e, imagenes: nuevas.map((img, i) => ({ ...img, orden: i })) } : e);
  }

  return (
    <div style={{ padding: '36px 32px', maxWidth: 1000 }}>
      {/* Encabezado */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28, gap: 12, flexWrap: 'wrap' }}>
        <h2 style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 32, color: 'var(--texto)', margin: 0 }}>Productos</h2>
        <button onClick={abrirNuevo} style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: 'var(--bordeaux)', color: '#FAF7F2', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--sans)' }}>
          + Nuevo producto
        </button>
      </div>

      {/* Tabs categoría */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {CATS.map(c => (
          <button key={c} onClick={() => setCatFiltro(c)} style={{
            padding: '8px 18px', borderRadius: 50, fontSize: 13, cursor: 'pointer', capitalize: 'true',
            background: catFiltro === c ? 'var(--bordeaux)' : '#fff',
            color: catFiltro === c ? '#FAF7F2' : 'var(--texto-suave)',
            border: `1.5px solid ${catFiltro === c ? 'var(--bordeaux)' : 'var(--crema-oscuro)'}`,
            transition: 'all 0.15s', textTransform: 'capitalize',
          }}>
            {c}
          </button>
        ))}
      </div>

      {/* Grid de cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
        {productos.map(p => (
          <div key={p.id} style={{
            background: '#fff', borderRadius: 16, overflow: 'hidden',
            border: '1px solid var(--crema-oscuro)',
            opacity: p.activo ? 1 : 0.5,
            transition: 'box-shadow 0.2s',
          }}>
            {/* Imagen */}
            <div style={{ aspectRatio: '4/3', background: 'var(--crema-oscuro)', overflow: 'hidden', position: 'relative' }}>
              {p.imagen
                ? <img src={p.imagen} alt={p.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, opacity: 0.2 }}>🧁</div>
              }
              {!p.activo && (
                <div style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: 10, padding: '3px 8px', borderRadius: 50 }}>
                  Oculto
                </div>
              )}
            </div>

            <div style={{ padding: '12px 14px' }}>
              <p style={{ fontFamily: 'var(--serif)', color: 'var(--bordeaux)', fontSize: 15, marginBottom: 2, lineHeight: 1.3 }}
                className="line-clamp-2">{p.nombre}</p>
              {p.descripcion && <p style={{ fontSize: 11, color: 'var(--texto-suave)', marginBottom: 6 }} className="line-clamp-2">{p.descripcion}</p>}
              <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--texto)', marginBottom: 10 }}>${parseFloat(p.precio).toLocaleString('es-AR')}</p>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => abrirEditar(p)} style={{ flex: 1, padding: '7px 0', borderRadius: 8, border: '1.5px solid var(--crema-oscuro)', background: '#fff', color: 'var(--texto-suave)', fontSize: 12, cursor: 'pointer' }}>
                  Editar
                </button>
                <button onClick={() => toggleActivo(p)} style={{ flex: 1, padding: '7px 0', borderRadius: 8, border: 'none', background: p.activo ? 'var(--crema-oscuro)' : 'var(--bordeaux)', color: p.activo ? 'var(--texto-suave)' : '#FAF7F2', fontSize: 12, cursor: 'pointer' }}>
                  {p.activo ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {productos.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', color: 'var(--texto-suave)', fontSize: 18 }}>Sin productos en esta categoría</p>
        </div>
      )}

      {/* Modal editar/crear */}
      {modal && (
        <>
          <div onClick={() => setModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.25)', zIndex: 50, backdropFilter: 'blur(2px)' }} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 51, width: '92%', maxWidth: 500, background: '#fff', borderRadius: 20, boxShadow: '0 20px 60px rgba(0,0,0,0.15)', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}>

            {/* Header modal */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid var(--crema-oscuro)', position: 'sticky', top: 0, background: '#fff', zIndex: 1 }}>
              <h3 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: 22, color: 'var(--texto)', margin: 0 }}>
                {editando ? 'Editar producto' : 'Nuevo producto'}
              </h3>
              <button onClick={() => setModal(false)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: 'var(--texto-suave)', lineHeight: 1, padding: 4 }}>×</button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: '20px 24px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Nombre */}
              <div>
                <label style={labelStyle}>Nombre *</label>
                <input type="text" value={form.nombre} onChange={e => setForm(f => ({...f, nombre: e.target.value}))} required placeholder="Nombre del producto" style={inputStyle} />
              </div>

              {/* Descripción */}
              <div>
                <label style={labelStyle}>Descripción <span style={{ color: 'var(--crema-oscuro)' }}>(porciones, etc.)</span></label>
                <textarea value={form.descripcion} onChange={e => setForm(f => ({...f, descripcion: e.target.value}))} rows={2} placeholder="Ej: 10-12 porciones"
                  style={{ ...inputStyle, resize: 'none' }} />
              </div>

              {/* Precio / Orden */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px', gap: 10 }}>
                <div>
                  <label style={labelStyle}>Precio ($) *</label>
                  <input type="number" min="0" step="100" value={form.precio} onChange={e => setForm(f => ({...f, precio: e.target.value}))} required placeholder="57000" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Orden</label>
                  <input type="number" min="0" value={form.orden} onChange={e => setForm(f => ({...f, orden: e.target.value}))} style={inputStyle} />
                </div>
              </div>

              {/* Categoría */}
              <div>
                <label style={labelStyle}>Categoría</label>
                <select value={form.categoria} onChange={e => setForm(f => ({...f, categoria: e.target.value}))} style={{ ...inputStyle, cursor: 'pointer' }}>
                  {CATS.map(c => <option key={c} value={c} style={{ textTransform: 'capitalize' }}>{c}</option>)}
                </select>
              </div>

              {/* Fotos actuales con reordenamiento */}
              {editando && editando.imagenes?.length > 0 && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <label style={labelStyle}>Fotos actuales</label>
                    <span style={{ fontSize: 11, color: 'var(--texto-suave)' }}>Usá las flechas para ordenar</span>
                  </div>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {editando.imagenes.map((img, idx) => (
                      <div key={img.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        {/* Thumbnail */}
                        <div style={{ position: 'relative', width: 80, height: 80, borderRadius: 10, overflow: 'hidden', border: idx === 0 ? '2px solid var(--bordeaux)' : '2px solid transparent' }}>
                          <img src={img.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          {idx === 0 && (
                            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'var(--bordeaux)', color: '#fff', fontSize: 9, textAlign: 'center', padding: '2px 0', letterSpacing: '0.05em' }}>
                              PRINCIPAL
                            </div>
                          )}
                          {/* Botón eliminar */}
                          <button type="button" onClick={() => eliminarImagen(editando.id, img.id)}
                            style={{ position: 'absolute', top: 2, right: 2, width: 18, height: 18, borderRadius: '50%', background: 'rgba(192,57,43,0.9)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>
                            ×
                          </button>
                        </div>
                        {/* Flechas */}
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button type="button"
                            onClick={() => moverImagen(editando.id, editando.imagenes, idx, -1)}
                            disabled={idx === 0}
                            style={{ width: 24, height: 24, borderRadius: 6, border: '1px solid var(--crema-oscuro)', background: '#fff', cursor: idx === 0 ? 'default' : 'pointer', opacity: idx === 0 ? 0.3 : 1, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--bordeaux)' }}>
                            ‹
                          </button>
                          <button type="button"
                            onClick={() => moverImagen(editando.id, editando.imagenes, idx, 1)}
                            disabled={idx === editando.imagenes.length - 1}
                            style={{ width: 24, height: 24, borderRadius: 6, border: '1px solid var(--crema-oscuro)', background: '#fff', cursor: idx === editando.imagenes.length - 1 ? 'default' : 'pointer', opacity: idx === editando.imagenes.length - 1 ? 0.3 : 1, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--bordeaux)' }}>
                            ›
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Subir fotos */}
              <div>
                <label style={labelStyle}>{editando ? 'Agregar más fotos' : 'Fotos'} <span style={{ color: 'var(--crema-oscuro)' }}>(podés subir varias)</span></label>
                <div style={{ border: '1.5px dashed var(--crema-oscuro)', borderRadius: 10, padding: '14px 16px', textAlign: 'center', cursor: 'pointer', position: 'relative' }}>
                  <input type="file" accept="image/*" multiple onChange={e => setImagenes([...e.target.files])}
                    style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%' }} />
                  {imagenes.length > 0
                    ? <p style={{ fontSize: 13, color: 'var(--bordeaux)', margin: 0 }}>✓ {imagenes.length} foto{imagenes.length !== 1 ? 's' : ''} seleccionada{imagenes.length !== 1 ? 's' : ''}</p>
                    : <p style={{ fontSize: 13, color: 'var(--texto-suave)', margin: 0 }}>Tocá para elegir fotos</p>
                  }
                </div>
              </div>

              {error && <p style={{ color: '#c0392b', fontSize: 13, margin: 0 }}>{error}</p>}

              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button type="button" onClick={() => setModal(false)} style={{ flex: 1, padding: '12px', borderRadius: 10, border: '1.5px solid var(--crema-oscuro)', background: '#fff', color: 'var(--texto-suave)', cursor: 'pointer', fontSize: 13 }}>
                  Cancelar
                </button>
                <button type="submit" disabled={guardando} style={{ flex: 1, padding: '12px', borderRadius: 10, border: 'none', background: 'var(--bordeaux)', color: '#FAF7F2', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
                  {guardando ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
