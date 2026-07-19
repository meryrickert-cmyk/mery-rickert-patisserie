import { useEffect, useState, useRef } from 'react';
import api from '../../api/index.js';

const CAMPOS = [
  { seccion: 'Hero', campos: [
    { clave: 'hero_tagline', label: 'Frase principal', tipo: 'text', placeholder: 'hecho con tiempo' },
  ]},
  { seccion: 'Quiénes somos', campos: [
    { clave: 'about_titulo', label: 'Título', tipo: 'text', placeholder: 'Quiénes somos' },
    { clave: 'about_texto', label: 'Texto', tipo: 'textarea', placeholder: 'Descripción...' },
  ]},
  { seccion: 'Eventos & Encargos', campos: [
    { clave: 'eventos_titulo', label: 'Título', tipo: 'text', placeholder: 'Cotizaciones para eventos' },
    { clave: 'eventos_texto', label: 'Texto introductorio', tipo: 'textarea' },
  ]},
  { seccion: 'Instagram & Redes', campos: [
    { clave: 'instagram_handle', label: 'Handle de Instagram', tipo: 'text', placeholder: '@meryrickertpatisserie' },
  ]},
  { seccion: 'Footer', campos: [
    { clave: 'footer_direccion', label: 'Dirección / Ubicación', tipo: 'text', placeholder: 'Buenos Aires, Argentina' },
  ]},
];

const inputStyle = { padding: '10px 14px', borderRadius: 10, border: '1.5px solid var(--crema-oscuro)', fontSize: 13, color: 'var(--texto)', outline: 'none', fontFamily: 'var(--sans)', width: '100%', boxSizing: 'border-box', background: '#fff' };
const labelStyle = { fontSize: 12, color: 'var(--texto-suave)', display: 'block', marginBottom: 5 };

export default function Contenido() {
  const [values, setValues] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [ok, setOk] = useState(false);

  // Hero images
  const [heroImagenes, setHeroImagenes] = useState([]);
  const [subiendo, setSubiendo] = useState(false);
  const fileRef = useRef();

  useEffect(() => {
    api.get('/config').then(r => setValues(r.data));
    cargarHero();
  }, []);

  function cargarHero() {
    api.get('/hero').then(r => setHeroImagenes(r.data));
  }

  function set(clave, valor) { setValues(v => ({ ...v, [clave]: valor })); }

  async function guardarTextos(e) {
    e.preventDefault();
    setGuardando(true);
    await api.put('/config', values);
    setGuardando(false);
    setOk(true);
    setTimeout(() => setOk(false), 2500);
  }

  async function subirFoto(e) {
    const files = e.target.files;
    if (!files?.length) return;
    setSubiendo(true);
    for (const file of files) {
      const fd = new FormData();
      fd.append('imagen', file);
      await api.post('/hero', fd);
    }
    setSubiendo(false);
    cargarHero();
    fileRef.current.value = '';
  }

  async function eliminarFoto(id) {
    await api.delete(`/hero/${id}`);
    cargarHero();
  }

  async function moverFoto(idx, direccion) {
    const nuevas = [...heroImagenes];
    const destino = idx + direccion;
    if (destino < 0 || destino >= nuevas.length) return;
    [nuevas[idx], nuevas[destino]] = [nuevas[destino], nuevas[idx]];
    await api.patch('/hero/reordenar', { items: nuevas.map((img, i) => ({ id: img.id, orden: i })) });
    setHeroImagenes(nuevas);
  }

  return (
    <div style={{ padding: '36px 32px', maxWidth: 720 }}>
      <h2 style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 32, color: 'var(--texto)', margin: '0 0 4px' }}>
        Contenido del sitio
      </h2>
      <p style={{ color: 'var(--texto-suave)', fontSize: 13, marginBottom: 36 }}>
        Editá textos e imágenes que aparecen en la web.
      </p>

      {/* ── Fotos del Hero ── */}
      <div style={{ marginBottom: 40 }}>
        <p style={{ color: 'var(--bordeaux)', fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 16, fontWeight: 500 }}>
          Fotos de portada (Hero)
        </p>
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid var(--crema-oscuro)', padding: '20px 22px' }}>
          <p style={{ ...labelStyle, marginBottom: 14 }}>
            Las fotos se muestran en la portada y se van cambiando automáticamente cada 5 segundos.
            {heroImagenes.length > 1 && <span style={{ color: 'var(--bordeaux)', marginLeft: 6 }}>La primera es la imagen de inicio.</span>}
          </p>

          {/* Grid de fotos actuales */}
          {heroImagenes.length > 0 && (
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
              {heroImagenes.map((img, i) => (
                <div key={img.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <div style={{ position: 'relative', width: 110, height: 80, borderRadius: 10, overflow: 'hidden', border: i === 0 ? '2px solid var(--bordeaux)' : '2px solid var(--crema-oscuro)' }}>
                    <img src={img.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    {i === 0 && (
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(123,31,46,0.85)', color: '#FAF7F2', fontSize: 9, textAlign: 'center', padding: '3px 0', letterSpacing: '0.06em' }}>
                        PORTADA
                      </div>
                    )}
                    <button onClick={() => eliminarFoto(img.id)} style={{
                      position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: '50%',
                      background: 'rgba(192,57,43,0.85)', color: '#fff', border: 'none', cursor: 'pointer',
                      fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1,
                    }}>×</button>
                  </div>

                  {/* Flechas reordenar */}
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button onClick={() => moverFoto(i, -1)} disabled={i === 0} style={{
                      width: 26, height: 26, borderRadius: 7, border: '1px solid var(--crema-oscuro)',
                      background: '#fff', color: 'var(--bordeaux)', cursor: i === 0 ? 'default' : 'pointer',
                      opacity: i === 0 ? 0.3 : 1, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>‹</button>
                    <button onClick={() => moverFoto(i, 1)} disabled={i === heroImagenes.length - 1} style={{
                      width: 26, height: 26, borderRadius: 7, border: '1px solid var(--crema-oscuro)',
                      background: '#fff', color: 'var(--bordeaux)', cursor: i === heroImagenes.length - 1 ? 'default' : 'pointer',
                      opacity: i === heroImagenes.length - 1 ? 0.3 : 1, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>›</button>
                  </div>
                </div>
              ))}

              {/* Botón agregar inline */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <label style={{
                  width: 110, height: 80, borderRadius: 10, border: '1.5px dashed var(--crema-oscuro)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', gap: 4,
                }}>
                  <span style={{ fontSize: 22, color: 'var(--crema-oscuro)' }}>+</span>
                  <span style={{ fontSize: 10, color: 'var(--texto-suave)' }}>Agregar</span>
                  <input type="file" accept="image/*" multiple onChange={subirFoto} ref={fileRef} style={{ display: 'none' }} />
                </label>
              </div>
            </div>
          )}

          {/* Estado vacío */}
          {heroImagenes.length === 0 && (
            <label style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              border: '1.5px dashed var(--crema-oscuro)', borderRadius: 12, padding: '32px 20px',
              cursor: 'pointer', gap: 8, marginBottom: 4,
            }}>
              <span style={{ fontSize: 32, opacity: 0.3 }}>🖼️</span>
              <p style={{ margin: 0, fontSize: 14, color: 'var(--texto-suave)', textAlign: 'center' }}>
                {subiendo ? 'Subiendo...' : 'Tocá para subir fotos de portada'}
              </p>
              <p style={{ margin: 0, fontSize: 12, color: '#bbb', textAlign: 'center' }}>Podés subir varias a la vez</p>
              <input type="file" accept="image/*" multiple onChange={subirFoto} ref={fileRef} style={{ display: 'none' }} />
            </label>
          )}

          {subiendo && (
            <p style={{ fontSize: 13, color: 'var(--bordeaux)', margin: '8px 0 0' }}>Subiendo fotos...</p>
          )}
        </div>
      </div>

      {/* ── Textos ── */}
      <form onSubmit={guardarTextos} style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        {CAMPOS.map(({ seccion, campos }) => (
          <div key={seccion}>
            <p style={{ color: 'var(--bordeaux)', fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 14, fontWeight: 500 }}>
              {seccion}
            </p>
            <div style={{ background: '#fff', borderRadius: 16, border: '1px solid var(--crema-oscuro)', padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {campos.map(({ clave, label, tipo, placeholder }) => (
                <div key={clave}>
                  <label style={labelStyle}>{label}</label>
                  {tipo === 'textarea' ? (
                    <textarea value={values[clave] || ''} onChange={e => set(clave, e.target.value)} rows={4}
                      placeholder={placeholder} style={{ ...inputStyle, resize: 'none' }} />
                  ) : (
                    <input type="text" value={values[clave] || ''} onChange={e => set(clave, e.target.value)}
                      placeholder={placeholder} style={inputStyle} />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button type="submit" disabled={guardando} style={{
            padding: '12px 32px', borderRadius: 10, border: 'none',
            background: 'var(--bordeaux)', color: '#FAF7F2', fontSize: 13, cursor: 'pointer',
          }}>
            {guardando ? 'Guardando...' : 'Guardar textos'}
          </button>
          {ok && <span style={{ color: 'var(--bordeaux)', fontSize: 14 }}>✓ Guardado</span>}
        </div>
      </form>
    </div>
  );
}
