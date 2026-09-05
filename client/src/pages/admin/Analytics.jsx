import { useEffect, useState, useCallback } from 'react';
import api from '../../api/index.js';

function fmt(n) { return (n || 0).toLocaleString('es-AR'); }
function fmtMin(secs) {
  if (!secs) return '0s';
  if (secs < 60) return `${secs}s`;
  return `${Math.floor(secs / 60)}m ${secs % 60}s`;
}

function periodos() {
  const ahora = new Date();
  const y = ahora.getFullYear();
  const m = ahora.getMonth();
  const esteDesde = `${y}-${String(m + 1).padStart(2, '0')}-01`;
  const esteHasta = `${y}-${String(m + 1).padStart(2, '0')}-31`;
  const pasadoD = new Date(y, m - 1, 1);
  const pasadoH = new Date(y, m - 1, 31);
  return {
    '7d':       { label: '7 días',     dias: 7 },
    '30d':      { label: '30 días',    dias: 30 },
    '90d':      { label: '90 días',    dias: 90 },
    este_mes:   { label: 'Este mes',   desde: esteDesde, hasta: esteHasta },
    mes_pasado: { label: 'Mes pasado', desde: pasadoD.toISOString().slice(0,10), hasta: pasadoH.toISOString().slice(0,10) },
    este_anio:  { label: 'Este año',   desde: `${y}-01-01`, hasta: `${y}-12-31` },
  };
}

const pillStyle = (activo) => ({
  padding: '6px 16px', borderRadius: 20, fontSize: 17, cursor: 'pointer',
  border: activo ? '1.5px solid var(--bordeaux)' : '1.5px solid var(--crema-oscuro)',
  background: activo ? 'var(--bordeaux)' : '#fff',
  color: activo ? '#FAF7F2' : 'var(--texto-suave)',
  fontFamily: 'var(--sans)', transition: 'all 0.15s',
});

export default function Analytics() {
  const [data, setData] = useState(null);
  const [periodo, setPeriodo] = useState('30d');
  const [customDesde, setCustomDesde] = useState('');
  const [customHasta, setCustomHasta] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  const cargar = useCallback(() => {
    const ps = periodos();
    const p = ps[periodo];
    let url;
    if (periodo === 'custom' && customDesde && customHasta) {
      url = `/analytics/summary?desde=${customDesde}&hasta=${customHasta}`;
    } else if (p?.dias) {
      url = `/analytics/summary?dias=${p.dias}`;
    } else if (p?.desde) {
      url = `/analytics/summary?desde=${p.desde}&hasta=${p.hasta}`;
    } else {
      url = '/analytics/summary?dias=30';
    }
    api.get(url).then(r => setData(r.data));
  }, [periodo, customDesde, customHasta]);

  useEffect(() => { cargar(); }, [cargar]);

  const setPeriodoPreset = (p) => { setPeriodo(p); setShowCustom(false); };
  const toggleCustom = () => { setShowCustom(v => !v); if (!showCustom) setPeriodo('custom'); };

  if (!data) return <div className="admin-page" style={{ maxWidth: 900 }}><p style={{ color: 'var(--texto-suave)' }}>Cargando...</p></div>;

  const { funnel } = data;
  const convCart = funnel.page_view ? Math.round((funnel.add_to_cart / funnel.page_view) * 100) : 0;
  const convWsp = funnel.add_to_cart ? Math.round((funnel.whatsapp_send / funnel.add_to_cart) * 100) : 0;
  const ps = periodos();

  return (
    <div className="admin-page" style={{ maxWidth: 900 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 42, color: 'var(--texto)', margin: 0 }}>Analytics</h2>
        <p style={{ color: 'var(--texto-suave)', fontSize: 17, marginTop: 4 }}>Tráfico y comportamiento del sitio público</p>

        {/* Period selector */}
        <div style={{ marginTop: 14, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          {Object.entries(ps).map(([key, val]) => (
            <button key={key} onClick={() => setPeriodoPreset(key)} style={pillStyle(periodo === key)}>
              {val.label}
            </button>
          ))}
          <button onClick={toggleCustom} style={pillStyle(periodo === 'custom')}>Personalizado</button>

          {showCustom && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <input type="date" value={customDesde} onChange={e => setCustomDesde(e.target.value)}
                style={{ padding: '5px 10px', borderRadius: 8, border: '1.5px solid var(--crema-oscuro)', fontSize: 17, color: 'var(--texto)', outline: 'none' }} />
              <span style={{ fontSize: 16, color: 'var(--texto-suave)' }}>→</span>
              <input type="date" value={customHasta} onChange={e => setCustomHasta(e.target.value)}
                style={{ padding: '5px 10px', borderRadius: 8, border: '1.5px solid var(--crema-oscuro)', fontSize: 17, color: 'var(--texto)', outline: 'none' }} />
              {customDesde && customHasta && (
                <button onClick={cargar} style={{ padding: '5px 14px', borderRadius: 8, border: 'none', background: 'var(--bordeaux)', color: '#FAF7F2', fontSize: 17, cursor: 'pointer' }}>Aplicar</button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 28 }}>
        <KPI label="Sesiones únicas" valor={fmt(data.sesiones_totales)} />
        <KPI label="Páginas vistas" valor={fmt(data.page_views)} />
        <KPI label="Tiempo promedio" valor={fmtMin(data.tiempo_promedio_segundos)} />
        <KPI label="Abrieron carrito" valor={fmt(funnel.add_to_cart)} sub={`${convCart}% de sesiones`} />
        <KPI label="Enviaron por WA" valor={fmt(funnel.whatsapp_send)} sub={`${convWsp}% de carrito`} />
        <KPI label="Tocaron globo WA" valor={fmt(funnel.whatsapp_bubble)} />
      </div>

      {/* Funnel */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid var(--crema-oscuro)', padding: '24px', marginBottom: 20 }}>
        <p style={{ fontWeight: 600, fontSize: 18, color: 'var(--texto)', marginBottom: 20 }}>Funnel de conversión</p>
        {[
          { label: 'Visitantes únicos', val: funnel.page_view, color: 'var(--crema-oscuro)' },
          { label: 'Agregaron al carrito', val: funnel.add_to_cart, color: '#d4a9b0' },
          { label: 'Enviaron por WhatsApp', val: funnel.whatsapp_send, color: 'var(--bordeaux)' },
        ].map((step, i) => {
          const pct = funnel.page_view ? Math.round((step.val / funnel.page_view) * 100) : 0;
          return (
            <div key={i} style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 17, color: 'var(--texto)' }}>{step.label}</span>
                <span style={{ fontSize: 17, color: 'var(--texto-suave)' }}>{fmt(step.val)} <span style={{ color: 'var(--bordeaux)', fontWeight: 600 }}>({pct}%)</span></span>
              </div>
              <div style={{ height: 8, background: 'var(--crema)', borderRadius: 8, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: step.color, borderRadius: 8, transition: 'width 0.6s ease' }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabla de eventos */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid var(--crema-oscuro)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--crema-oscuro)' }}>
          <p style={{ fontWeight: 600, fontSize: 18, color: 'var(--texto)', margin: 0 }}>Todos los eventos</p>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'var(--crema)' }}>
              <th style={{ padding: '10px 20px', textAlign: 'left', color: 'var(--texto-suave)', fontWeight: 500 }}>Evento</th>
              <th style={{ padding: '10px 20px', textAlign: 'right', color: 'var(--texto-suave)', fontWeight: 500 }}>Total</th>
              <th style={{ padding: '10px 20px', textAlign: 'right', color: 'var(--texto-suave)', fontWeight: 500 }}>Sesiones únicas</th>
            </tr>
          </thead>
          <tbody>
            {data.eventos.map((e, i) => (
              <tr key={e.event} style={{ borderTop: i === 0 ? 'none' : '1px solid var(--crema-oscuro)' }}>
                <td style={{ padding: '12px 20px', color: 'var(--texto)' }}>{e.event}</td>
                <td style={{ padding: '12px 20px', textAlign: 'right', fontWeight: 500 }}>{fmt(e.total)}</td>
                <td style={{ padding: '12px 20px', textAlign: 'right', color: 'var(--texto-suave)' }}>{fmt(e.sesiones)}</td>
              </tr>
            ))}
            {data.eventos.length === 0 && (
              <tr><td colSpan={3} style={{ padding: '32px', textAlign: 'center', color: 'var(--texto-suave)', fontStyle: 'italic' }}>Sin datos aún</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function KPI({ label, valor, sub }) {
  return (
    <div style={{ background: '#fff', borderRadius: 14, border: '1px solid var(--crema-oscuro)', padding: '18px 20px' }}>
      <p style={{ fontSize: 14, color: 'var(--texto-suave)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px' }}>{label}</p>
      <p style={{ fontFamily: 'var(--serif)', fontSize: 36, color: 'var(--bordeaux)', margin: 0, lineHeight: 1 }}>{valor}</p>
      {sub && <p style={{ fontSize: 14, color: 'var(--texto-suave)', margin: '6px 0 0' }}>{sub}</p>}
    </div>
  );
}
