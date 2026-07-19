import { useEffect, useState, useRef, forwardRef } from 'react';
import api from '../api/index.js';
import { useCart } from '../context/CartContext';

/* ══════════════════════════════════════════════════════════ */
export default function Home() {
  const [config, setConfig] = useState({});
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const catalogoRef = useRef(null);

  useEffect(() => {
    Promise.all([api.get('/config'), api.get('/productos')])
      .then(([c, p]) => { setConfig(c.data); setProductos(p.data); })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ background: 'var(--crema)' }}>
      <HeroSection config={config} onScroll={() => catalogoRef.current?.scrollIntoView({ behavior: 'smooth' })} />
      <InfoBar />
      <ProductosSection ref={catalogoRef} productos={productos} loading={loading} />
      <EventosSection config={config} />
      <AboutSection config={config} />
      <InstagramSection config={config} />
      <FooterSection config={config} />
    </div>
  );
}

/* ══ HERO ══════════════════════════════════════════════════ */
function HeroSection({ config, onScroll }) {
  const [imagenes, setImagenes] = useState([]);
  const [idx, setIdx] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    api.get('/hero').then(r => setImagenes(r.data));
  }, []);

  useEffect(() => {
    if (imagenes.length < 2) return;
    timerRef.current = setInterval(() => setIdx(i => (i + 1) % imagenes.length), 5000);
    return () => clearInterval(timerRef.current);
  }, [imagenes.length]);

  function ir(nuevo) {
    clearInterval(timerRef.current);
    setIdx((nuevo + imagenes.length) % imagenes.length);
    if (imagenes.length > 1) {
      timerRef.current = setInterval(() => setIdx(i => (i + 1) % imagenes.length), 5000);
    }
  }

  return (
    <section style={{ position: 'relative', minHeight: '62vh', maxHeight: '75vh', height: '70vw', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#e8ddd4' }}>
      <div style={{ position: 'absolute', inset: 0 }}>
        {imagenes.length === 0 ? (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #e8ddd4, #c9b5a8)' }}>
            <span style={{ fontSize: 140, opacity: 0.12 }}>🧁</span>
          </div>
        ) : imagenes.map((img, i) => (
          <div key={img.id} style={{ position: 'absolute', inset: 0, opacity: i === idx ? 1 : 0, transition: 'opacity 1.2s ease-in-out' }}>
            <img src={img.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          </div>
        ))}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(43,10,18,0.72) 0%, rgba(43,10,18,0.2) 50%, transparent 100%)', zIndex: 1 }} />
      </div>

      {imagenes.length > 1 && (
        <>
          <button onClick={() => ir(idx - 1)} style={{ position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)', zIndex: 3, width: 40, height: 40, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.2)', color: '#FAF7F2', fontSize: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)', transition: 'background 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.35)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}>‹</button>
          <button onClick={() => ir(idx + 1)} style={{ position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)', zIndex: 3, width: 40, height: 40, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.2)', color: '#FAF7F2', fontSize: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)', transition: 'background 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.35)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}>›</button>
          <div style={{ position: 'absolute', bottom: 28, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 8, zIndex: 3 }}>
            {imagenes.map((_, i) => (
              <button key={i} onClick={() => ir(i)} style={{ width: i === idx ? 24 : 8, height: 8, borderRadius: 4, border: 'none', background: i === idx ? '#FAF7F2' : 'rgba(255,255,255,0.4)', cursor: 'pointer', transition: 'all 0.3s', padding: 0 }} />
            ))}
          </div>
        </>
      )}

      <div style={{ position: 'relative', zIndex: 2, marginTop: 'auto', textAlign: 'center', padding: '0 24px 44px' }}>
        <h1 style={{ fontFamily: 'var(--serif)', color: '#FAF7F2', fontSize: 'clamp(48px, 10vw, 90px)', fontWeight: 300, fontStyle: 'italic', lineHeight: 1.0, margin: 0 }}>
          {config.hero_tagline || 'hecho con tiempo'}
        </h1>
      </div>
    </section>
  );
}

/* ══ INFO BAR ══════════════════════════════════════════════ */
function InfoBar() {
  return (
    <div style={{
      background: 'var(--bordeaux)',
      padding: '13px 24px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: 32, flexWrap: 'wrap',
    }}>
      {[
        { icon: '📍', text: 'Retiros en Km 47.5, Pilar' },
        { icon: '⏱', text: 'Pedidos con 48hs de anticipación' },
      ].map(({ icon, text }) => (
        <span key={text} style={{ display: 'flex', alignItems: 'center', gap: 7, color: 'rgba(250,247,242,0.9)', fontSize: 13, letterSpacing: '0.01em' }}>
          <span style={{ fontSize: 14 }}>{icon}</span>
          {text}
        </span>
      ))}
    </div>
  );
}

/* ══ CATÁLOGO (one-pager) ══════════════════════════════════ */
const ProductosSection = forwardRef(function ProductosSection({ productos, loading }, ref) {
  const [activeSection, setActiveSection] = useState('tortas');
  const tortasRef = useRef(null);
  const teRef = useRef(null);
  const budinesRef = useRef(null);
  const shotsRef = useRef(null);

  const sections = [
    { id: 'tortas',     ref: tortasRef,  label: 'Tortas' },
    { id: 'para-el-te', ref: teRef,      label: 'Para el té' },
    { id: 'budines',    ref: budinesRef, label: 'Budines' },
    { id: 'shots',      ref: shotsRef,   label: 'Shots' },
  ];

  useEffect(() => {
    function onScroll() {
      let active = 'tortas';
      for (const s of sections) {
        if (!s.ref.current) continue;
        if (s.ref.current.getBoundingClientRect().top <= 130) active = s.id;
      }
      setActiveSection(active);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  function scrollTo(sectionId) {
    const s = sections.find(s => s.id === sectionId);
    if (!s?.ref.current) return;
    const top = s.ref.current.getBoundingClientRect().top + window.scrollY - 112;
    window.scrollTo({ top, behavior: 'smooth' });
  }

  const byCat = cat => productos.filter(p => p.categoria === cat);

  return (
    <section ref={ref} id="catalogo" style={{ background: 'var(--crema)', paddingBottom: 0 }}>

      {/* Sticky nav de categorías */}
      <div style={{ position: 'sticky', top: 56, zIndex: 30, background: 'rgba(250,247,242,0.97)', backdropFilter: 'blur(10px)', borderBottom: '1px solid var(--crema-oscuro)', padding: '0 12px' }}>
        <div style={{ display: 'flex', overflowX: 'auto', gap: 0 }} className="scrollbar-hide">
          {sections.map(s => (
            <button key={s.id} onClick={() => scrollTo(s.id)} style={{
              flexShrink: 0, padding: '14px 18px', border: 'none',
              borderBottom: activeSection === s.id ? '2px solid var(--bordeaux)' : '2px solid transparent',
              background: 'transparent',
              color: activeSection === s.id ? 'var(--bordeaux)' : 'var(--texto-suave)',
              fontSize: 13, fontWeight: activeSection === s.id ? 600 : 400,
              cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s',
              fontFamily: 'var(--sans)', letterSpacing: '0.02em',
            }}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 16px' }}>

        {/* TORTAS */}
        <div ref={tortasRef} id="tortas" style={{ paddingTop: 48, paddingBottom: 72 }}>
          <SecDesc>Para cada ocasión especial</SecDesc>
          {loading ? <Spinner /> : (
            <div className="product-grid">
              {byCat('tortas').map(p => <ProductCard key={p.id} producto={p} />)}
            </div>
          )}
        </div>

        {/* PARA EL TÉ */}
        <div ref={teRef} id="para-el-te" style={{ paddingTop: 48, paddingBottom: 72, borderTop: '1px solid var(--crema-oscuro)' }}>
          <SecDesc>Alfajores, brownies, masitas y más</SecDesc>
          {loading ? <Spinner /> : <ParaElTeLayout productos={byCat('para el te')} />}
        </div>

        {/* BUDINES */}
        <div ref={budinesRef} id="budines" style={{ paddingTop: 48, paddingBottom: 72, borderTop: '1px solid var(--crema-oscuro)' }}>
          <SecDesc>Húmedos y llenos de sabor</SecDesc>
          {loading ? <Spinner /> : <FotoLista productos={byCat('budines')} />}
        </div>

        {/* SHOTS */}
        <div ref={shotsRef} id="shots" style={{ paddingTop: 48, paddingBottom: 80, borderTop: '1px solid var(--crema-oscuro)' }}>
          <SecDesc>Mínimo 10 unidades por sabor · $5.000 c/u</SecDesc>
          {loading ? <Spinner /> : <ShotsLayout productos={byCat('shots')} />}
        </div>

      </div>
    </section>
  );
});

function SecDesc({ children }) {
  return (
    <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 16, color: 'var(--texto-suave)', margin: '0 0 28px' }}>
      {children}
    </p>
  );
}

function Spinner() {
  return <p style={{ textAlign: 'center', color: 'var(--texto-suave)', padding: '60px 0' }}>Cargando...</p>;
}

/* ══ PARA EL TÉ — layout con subsecciones ══════════════════ */
function ParaElTeLayout({ productos }) {
  const n = p => p.nombre.toLowerCase();
  const mixGroup    = productos.filter(p => n(p).startsWith('mix'));
  const alfGroup    = productos.filter(p => n(p).startsWith('alfajor') && !n(p).includes('caja'));
  const cajaGroup   = productos.filter(p => n(p).startsWith('alfajor') && n(p).includes('caja'));
  const trufaGroup  = productos.filter(p => n(p).startsWith('trufa'));
  const individGroup = productos.filter(p =>
    n(p).startsWith('brownie') || n(p).startsWith('masitas') || n(p).startsWith('pavlovita')
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 56 }}>

      {/* 1. Mixes */}
      {mixGroup.length > 0 && (
        <div>
          <SubSecTitle>Mixes</SubSecTitle>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
            {mixGroup.map(p => <ProductCard key={p.id} producto={p} />)}
          </div>
        </div>
      )}

      {/* 2. Alfajores — foto + lista de sabores */}
      {alfGroup.length > 0 && (
        <div>
          <SubSecTitle>Alfajores</SubSecTitle>
          <FotoLista productos={alfGroup} />
        </div>
      )}

      {/* 3. Caja de 8 + Trufas — cards */}
      {(cajaGroup.length > 0 || trufaGroup.length > 0) && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 24 }}>
          {[...cajaGroup, ...trufaGroup].map(p => <ProductCard key={p.id} producto={p} />)}
        </div>
      )}

      {/* 4. Individuales — Brownie, Masitas, Pavlovitas */}
      {individGroup.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 24 }}>
          {individGroup.map(p => <ProductCard key={p.id} producto={p} />)}
        </div>
      )}
    </div>
  );
}

function SubSecTitle({ children }) {
  return (
    <h3 style={{ fontFamily: 'var(--serif)', color: 'var(--texto)', fontSize: 22, fontWeight: 300, fontStyle: 'italic', margin: '0 0 20px' }}>
      {children}
    </h3>
  );
}

/* ══ FOTO + LISTA (Alfajores, Budines) ═════════════════════ */
function FotoLista({ productos }) {
  const fotoProducto = productos.find(p => p.imagen || p.imagenes?.length > 0);
  const fotoUrl = fotoProducto?.imagen || fotoProducto?.imagenes?.[0]?.url || null;

  return (
    <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', alignItems: 'flex-start' }}>
      {/* Foto */}
      <div style={{ flexShrink: 0, width: '100%', maxWidth: 260 }}>
        <div style={{ aspectRatio: '1/1', borderRadius: 20, overflow: 'hidden', background: 'var(--crema-oscuro)' }}>
          {fotoUrl
            ? <img src={fotoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64, opacity: 0.2 }}>🧁</div>
          }
        </div>
      </div>
      {/* Lista */}
      <div style={{ flex: 1, minWidth: 240 }}>
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid var(--crema-oscuro)', overflow: 'hidden' }}>
          {productos.map((p, i) => (
            <ListaItem key={p.id} producto={p} isLast={i === productos.length - 1} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ══ LISTA ITEM ════════════════════════════════════════════ */
function ListaItem({ producto: p, isLast }) {
  const { agregar, items, cambiarCantidad } = useCart();
  const enCarrito = items.find(i => i.producto_id === p.id);
  const cantidad = enCarrito?.cantidad || 0;
  const [cantLocal, setCantLocal] = useState(1);

  function handleAgregar() { agregar(p, cantLocal); }

  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', gap: 14, borderBottom: isLast ? 'none' : '1px solid var(--crema-oscuro)', transition: 'background 0.15s' }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--crema)'}
      onMouseLeave={e => e.currentTarget.style.background = '#fff'}>

      {/* Nombre + descripción */}
      <div style={{ flex: 1, minWidth: 80 }}>
        <p style={{ fontFamily: 'var(--serif)', color: 'var(--texto)', fontSize: 15, margin: '0 0 2px', lineHeight: 1.3 }}>{p.nombre}</p>
        {p.descripcion && <p style={{ fontSize: 12, color: 'var(--texto-suave)', margin: 0 }}>{p.descripcion}</p>}
      </div>

      {/* Precio */}
      <p style={{ fontFamily: 'var(--serif)', fontSize: 16, color: 'var(--bordeaux)', margin: 0, flexShrink: 0, minWidth: 80, textAlign: 'right' }}>
        ${p.precio.toLocaleString('es-AR')}
      </p>

      {/* Controles */}
      {!enCarrito ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--crema-oscuro)', borderRadius: 50 }}>
            <button onClick={() => setCantLocal(q => Math.max(1, q - 1))} style={{ width: 28, height: 28, border: 'none', background: 'transparent', color: 'var(--bordeaux)', fontSize: 17, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
            <span style={{ width: 20, textAlign: 'center', fontSize: 13, color: 'var(--texto)' }}>{cantLocal}</span>
            <button onClick={() => setCantLocal(q => q + 1)} style={{ width: 28, height: 28, border: 'none', background: 'transparent', color: 'var(--bordeaux)', fontSize: 17, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
          </div>
          <button onClick={handleAgregar} style={{ padding: '7px 14px', borderRadius: 50, border: 'none', background: 'var(--bordeaux)', color: '#FAF7F2', fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            Agregar
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <button onClick={() => cambiarCantidad(p.id, cantidad - 1)} style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: 'var(--bordeaux)', color: '#FAF7F2', fontSize: 17, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
          <span style={{ width: 20, textAlign: 'center', fontSize: 14, fontWeight: 500 }}>{cantidad}</span>
          <button onClick={() => cambiarCantidad(p.id, cantidad + 1)} style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: 'var(--bordeaux)', color: '#FAF7F2', fontSize: 17, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
          <span style={{ fontSize: 11, color: '#2d7a3a', fontWeight: 600 }}>✓</span>
        </div>
      )}
    </div>
  );
}

/* ══ PRODUCT CARD ══════════════════════════════════════════ */
function ProductCard({ producto: p }) {
  const { agregar, cambiarCantidad, items } = useCart();
  const itemEnCarrito = items.find(i => i.producto_id === p.id);
  const cantidad = itemEnCarrito?.cantidad || 0;

  const fotos = [];
  if (p.imagen) fotos.push(p.imagen);
  if (p.imagenes) p.imagenes.forEach(i => { if (!fotos.includes(i.url)) fotos.push(i.url); });
  const [imgIdx, setImgIdx] = useState(0);

  return (
    <div style={{ background: '#fff', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', transition: 'box-shadow 0.2s, transform 0.2s' }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,0,0,0.1)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)'; e.currentTarget.style.transform = 'translateY(0)'; }}>

      {/* Imagen */}
      <div style={{ position: 'relative', aspectRatio: '1/1', overflow: 'hidden', background: 'var(--crema-oscuro)' }}>
        {fotos.length > 0
          ? <img src={fotos[imgIdx]} alt={p.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.4s' }}
              onMouseEnter={e => e.target.style.transform = 'scale(1.04)'}
              onMouseLeave={e => e.target.style.transform = 'scale(1)'} />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 56, opacity: 0.2 }}>🧁</div>
        }
        {fotos.length > 1 && (
          <>
            {imgIdx > 0 && (
              <button onClick={e => { e.stopPropagation(); setImgIdx(i => i - 1); }} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', width: 28, height: 28, borderRadius: '50%', border: 'none', cursor: 'pointer', background: 'rgba(255,255,255,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.15)', fontSize: 13, color: 'var(--bordeaux)' }}>‹</button>
            )}
            {imgIdx < fotos.length - 1 && (
              <button onClick={e => { e.stopPropagation(); setImgIdx(i => i + 1); }} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', width: 28, height: 28, borderRadius: '50%', border: 'none', cursor: 'pointer', background: 'rgba(255,255,255,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.15)', fontSize: 13, color: 'var(--bordeaux)' }}>›</button>
            )}
            <div style={{ position: 'absolute', bottom: 8, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 4 }}>
              {fotos.map((_, i) => (
                <div key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: i === imgIdx ? 'var(--bordeaux)' : 'rgba(255,255,255,0.7)' }} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Contenido */}
      <div style={{ padding: '16px 18px 20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <p style={{ fontFamily: 'var(--serif)', color: 'var(--bordeaux)', fontSize: 18, lineHeight: 1.25, marginBottom: 6, fontWeight: 400 }}>{p.nombre}</p>
        {p.descripcion && <p style={{ color: '#9B8F93', fontSize: 13, marginBottom: 14, lineHeight: 1.4 }}>{p.descripcion}</p>}
        <p style={{ fontSize: 22, fontWeight: 600, color: 'var(--texto)', marginBottom: 14, marginTop: 'auto', paddingTop: 8 }}>
          ${p.precio.toLocaleString('es-AR')}
        </p>

        {!itemEnCarrito ? (
          <button onClick={() => agregar(p, 1)} style={{ width: '100%', padding: '13px 0', borderRadius: 50, border: 'none', background: 'var(--bordeaux)', color: '#FAF7F2', fontSize: 13, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', transition: 'background 0.2s' }}
            onMouseEnter={e => e.target.style.background = 'var(--bordeaux-claro)'}
            onMouseLeave={e => e.target.style.background = 'var(--bordeaux)'}>
            Agregar
          </button>
        ) : (
          <div>
            <button style={{ width: '100%', padding: '12px 0', borderRadius: 50, border: '1.5px solid var(--bordeaux)', background: 'transparent', color: 'var(--bordeaux)', fontSize: 13, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'default', marginBottom: 12 }}>
              Agregado ✓
            </button>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
              <button onClick={() => cambiarCantidad(p.id, cantidad - 1)} style={{ width: 36, height: 36, borderRadius: '50%', border: 'none', background: 'var(--bordeaux)', color: '#FAF7F2', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
              <span style={{ fontSize: 18, fontWeight: 500, color: 'var(--texto)', minWidth: 24, textAlign: 'center' }}>{cantidad}</span>
              <button onClick={() => cambiarCantidad(p.id, cantidad + 1)} style={{ width: 36, height: 36, borderRadius: '50%', border: 'none', background: 'var(--bordeaux)', color: '#FAF7F2', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ══ SHOTS ═════════════════════════════════════════════════ */
function ShotsLayout({ productos }) {
  const { agregar } = useCart();
  const [cantidades, setCantidades] = useState({});
  const [agregados, setAgregados] = useState({});
  const conFoto = productos.find(p => p.imagen);

  function handleAgregar(p) {
    agregar(p, cantidades[p.id] || 10);
    setAgregados(a => ({ ...a, [p.id]: true }));
    setTimeout(() => setAgregados(a => ({ ...a, [p.id]: false })), 1800);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32, maxWidth: 780, margin: '0 auto' }}>
      <div style={{ flexShrink: 0, width: '100%', maxWidth: 260 }}>
        <div style={{ aspectRatio: '1/1', borderRadius: 20, overflow: 'hidden', background: 'var(--crema-oscuro)' }}>
          {conFoto?.imagen
            ? <img src={conFoto.imagen} alt="shots" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64, opacity: 0.2 }}>🧁</div>
          }
        </div>
        <p style={{ color: 'var(--texto-suave)', fontSize: 12, marginTop: 10, lineHeight: 1.5 }}>
          Precio: $5.000 c/u<br />Mínimo 10 unidades por sabor
        </p>
      </div>

      <div style={{ flex: 1 }}>
        {productos.map(p => (
          <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid var(--crema-oscuro)', gap: 12 }}>
            <span style={{ color: 'var(--texto)', fontSize: 14, flex: 1 }}>{p.nombre.replace('Shot: ', '')}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <button onClick={() => setCantidades(c => ({ ...c, [p.id]: Math.max(10, (c[p.id] || 10) - 1) }))} style={{ width: 28, height: 28, borderRadius: '50%', border: '1.5px solid var(--crema-oscuro)', background: '#fff', color: 'var(--bordeaux)', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
              <span style={{ width: 28, textAlign: 'center', fontSize: 14, color: 'var(--texto)' }}>{cantidades[p.id] || 10}</span>
              <button onClick={() => setCantidades(c => ({ ...c, [p.id]: (c[p.id] || 10) + 1 }))} style={{ width: 28, height: 28, borderRadius: '50%', border: '1.5px solid var(--crema-oscuro)', background: '#fff', color: 'var(--bordeaux)', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
              <button onClick={() => handleAgregar(p)} style={{ padding: '6px 16px', borderRadius: 50, border: 'none', background: agregados[p.id] ? '#2d7a3a' : 'var(--bordeaux)', color: '#FAF7F2', fontSize: 12, cursor: 'pointer', transition: 'background 0.2s', whiteSpace: 'nowrap' }}>
                {agregados[p.id] ? '✓ Listo' : 'Agregar'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══ EVENTOS ═══════════════════════════════════════════════ */
function EventosSection({ config }) {
  const [form, setForm] = useState({ nombre: '', email: '', telefono: '', mensaje: '' });
  const [enviado, setEnviado] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  function enviarWsp(e) {
    e.preventDefault();
    const msg = `Hola Mery! 🎂 Consulta sobre un evento.\n\n*Nombre:* ${form.nombre}\n*Email:* ${form.email}\n*Teléfono:* ${form.telefono}\n\n*Consulta:*\n${form.mensaje}`;
    window.open(`https://wa.me/5491164936089?text=${encodeURIComponent(msg)}`, '_blank');
    setEnviado(true);
  }

  const inputStyle = {
    width: '100%', padding: '14px 18px', borderRadius: 12,
    border: '1.5px solid rgba(250,247,242,0.2)', background: 'rgba(255,255,255,0.07)',
    color: '#FAF7F2', fontSize: 14, outline: 'none', fontFamily: 'var(--sans)', boxSizing: 'border-box',
  };

  return (
    <section style={{ background: 'var(--bordeaux)', padding: '80px 24px' }}>
      <div style={{ maxWidth: 540, margin: '0 auto', textAlign: 'center' }}>
        <p style={{ color: 'rgba(250,247,242,0.5)', fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 12 }}>Eventos & Encargos</p>
        <h2 style={{ fontFamily: 'var(--serif)', color: '#FAF7F2', fontWeight: 300, fontSize: 'clamp(32px, 6vw, 48px)', marginBottom: 16, lineHeight: 1.1 }}>
          {config.eventos_titulo || 'Cotizaciones para eventos'}
        </h2>
        <p style={{ color: 'rgba(250,247,242,0.65)', fontSize: 15, lineHeight: 1.8, marginBottom: 40 }}>
          {config.eventos_texto || 'Si necesitás ayuda con el armado para un evento, contanos qué tenés en mente y te ayudamos a planificarlo.'}
        </p>
        {enviado ? (
          <p style={{ fontFamily: 'var(--serif)', color: '#FAF7F2', fontSize: 26, fontWeight: 300 }}>¡Gracias! Te contactamos pronto 🧁</p>
        ) : (
          <form onSubmit={enviarWsp} style={{ display: 'flex', flexDirection: 'column', gap: 12, textAlign: 'left' }}>
            {[
              { k: 'nombre', label: 'Nombre', type: 'text', ph: 'Tu nombre' },
              { k: 'email', label: 'Email', type: 'email', ph: 'tu@email.com' },
              { k: 'telefono', label: 'Teléfono', type: 'tel', ph: '+54 9 11...' },
            ].map(({ k, label, type, ph }) => (
              <div key={k}>
                <label style={{ color: 'rgba(250,247,242,0.55)', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>{label}</label>
                <input type={type} value={form[k]} onChange={e => set(k, e.target.value)} required placeholder={ph} style={inputStyle} />
              </div>
            ))}
            <div>
              <label style={{ color: 'rgba(250,247,242,0.55)', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Mensaje</label>
              <textarea value={form.mensaje} onChange={e => set('mensaje', e.target.value)} required rows={4}
                placeholder="Contanos sobre tu evento, fecha, cantidad de personas..." style={{ ...inputStyle, resize: 'none' }} />
            </div>
            <button type="submit" style={{ marginTop: 8, padding: '15px 0', borderRadius: 50, border: 'none', background: '#FAF7F2', color: 'var(--bordeaux)', fontSize: 13, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', transition: 'opacity 0.2s' }}
              onMouseEnter={e => e.target.style.opacity = '0.88'}
              onMouseLeave={e => e.target.style.opacity = '1'}>
              Enviar consulta por WhatsApp
            </button>
          </form>
        )}
      </div>
    </section>
  );
}

/* ══ ABOUT ═════════════════════════════════════════════════ */
function AboutSection({ config }) {
  return (
    <section style={{ background: 'var(--crema-oscuro)', padding: '80px 24px' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <div style={{ width: '100%', height: 320, borderRadius: 20, overflow: 'hidden', background: '#d4c5b8', marginBottom: 56, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 80, opacity: 0.2 }}>🧁</span>
        </div>
        <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ color: 'var(--bordeaux)', fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 14 }}>Nuestra historia</p>
          <h2 style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 'clamp(34px, 6vw, 50px)', color: 'var(--texto)', marginBottom: 24, lineHeight: 1.1 }}>
            {config.about_titulo || 'Quiénes somos'}
          </h2>
          <div style={{ width: 32, height: 1, background: 'var(--bordeaux)', margin: '0 auto 28px', opacity: 0.4 }} />
          <p style={{ color: 'var(--texto-suave)', lineHeight: 1.95, fontSize: 16 }}>
            {config.about_texto || 'Mery Rickert Patisserie nació de la pasión por la pastelería artesanal y el deseo de crear momentos dulces especiales.'}
          </p>
        </div>
      </div>
    </section>
  );
}

/* ══ INSTAGRAM ═════════════════════════════════════════════ */
function InstagramSection({ config }) {
  const handle = config.instagram_handle || '@meryrickertpatisserie';
  return (
    <section style={{ background: 'var(--crema)', padding: '72px 24px' }}>
      <div style={{ maxWidth: 840, margin: '0 auto', textAlign: 'center' }}>
        <p style={{ color: 'var(--bordeaux)', fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 10 }}>Seguinos</p>
        <h2 style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 'clamp(28px, 5vw, 42px)', color: 'var(--texto)', marginBottom: 8 }}>{handle}</h2>
        <p style={{ color: 'var(--texto-suave)', fontSize: 14, marginBottom: 36 }}>Mirá nuestras últimas creaciones</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8, marginBottom: 36 }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} style={{ aspectRatio: '1/1', borderRadius: 12, background: i % 2 === 0 ? '#d4c5b8' : '#c9b5a8' }} />
          ))}
        </div>
        <a href={`https://instagram.com/${handle.replace('@', '')}`} target="_blank" rel="noreferrer"
          style={{ display: 'inline-block', border: '1.5px solid var(--bordeaux)', color: 'var(--bordeaux)', padding: '12px 36px', borderRadius: 50, fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', textDecoration: 'none', transition: 'all 0.2s' }}
          onMouseEnter={e => { e.target.style.background = 'var(--bordeaux)'; e.target.style.color = '#FAF7F2'; }}
          onMouseLeave={e => { e.target.style.background = 'transparent'; e.target.style.color = 'var(--bordeaux)'; }}>
          Ver en Instagram
        </a>
      </div>
    </section>
  );
}

/* ══ FOOTER ════════════════════════════════════════════════ */
function FooterSection({ config }) {
  const handle = config.instagram_handle || '@meryrickertpatisserie';
  return (
    <footer style={{ background: 'var(--bordeaux-oscuro)', padding: '48px 24px' }}>
      <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
        <div>
          <p style={{ fontFamily: 'var(--serif)', color: '#FAF7F2', fontSize: 20, fontWeight: 300, marginBottom: 4 }}>Mery Rickert Patisserie</p>
          <p style={{ color: 'rgba(250,247,242,0.4)', fontSize: 13 }}>{config.footer_direccion || 'Buenos Aires, Argentina'}</p>
        </div>
        <div style={{ display: 'flex', gap: 28 }}>
          {[
            { label: 'Instagram', url: `https://instagram.com/${handle.replace('@', '')}` },
            { label: 'WhatsApp', url: 'https://wa.me/5491164936089' },
          ].map(l => (
            <a key={l.label} href={l.url} target="_blank" rel="noreferrer"
              style={{ color: 'rgba(250,247,242,0.4)', fontSize: 13, textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={e => e.target.style.color = '#FAF7F2'}
              onMouseLeave={e => e.target.style.color = 'rgba(250,247,242,0.4)'}>
              {l.label}
            </a>
          ))}
        </div>
      </div>
      <p style={{ color: 'rgba(250,247,242,0.15)', fontSize: 11, textAlign: 'center', marginTop: 40 }}>
        © {new Date().getFullYear()} Mery Rickert Patisserie
      </p>
    </footer>
  );
}
