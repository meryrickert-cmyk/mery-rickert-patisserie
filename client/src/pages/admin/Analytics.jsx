import { useEffect, useState } from 'react';
import api from '../../api/index.js';

function fmt(n) { return (n || 0).toLocaleString('es-AR'); }
function fmtMin(secs) {
  if (!secs) return '0s';
  if (secs < 60) return `${secs}s`;
  return `${Math.floor(secs / 60)}m ${secs % 60}s`;
}

const labelStyle = { fontSize: 12, color: 'var(--texto-suave)', marginBottom: 4, display: 'block' };

export default function Analytics() {
  const [data, setData] = useState(null);
  const [dias, setDias] = useState(30);

  function cargar(d) {
    api.get(`/analytics/summary?dias=${d}`).then(r => setData(r.data));
  }
  useEffect(() => { cargar(dias); }, [dias]);

  if (!data) return <div className="admin-page" style={{ maxWidth: 900 }}><p style={{ color: 'var(--texto-suave)' }}>Cargando...</p></div>;

  const { funnel } = data;
  const convCart = funnel.page_view ? Math.round((funnel.add_to_cart / funnel.page_view) * 100) : 0;
  const convWsp = funnel.add_to_cart ? Math.round((funnel.whatsapp_send / funnel.add_to_cart) * 100) : 0;

  return (
    <div className="admin-page" style={{ maxWidth: 900 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 32, color: 'var(--texto)', margin: 0 }}>Analytics</h2>
          <p style={{ color: 'var(--texto-suave)', fontSize: 13, marginTop: 4 }}>Tráfico y comportamiento del sitio</p>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {[7, 30, 90].map(d => (
            <button key={d} onClick={() => setDias(d)} style={{
              padding: '8px 16px', borderRadius: 20, border: '1.5px solid var(--crema-oscuro)',
              background: dias === d ? 'var(--bordeaux)' : '#fff',
              color: dias === d ? '#FAF7F2' : 'var(--texto-suave)',
              fontSize: 13, cursor: 'pointer', fontFamily: 'var(--sans)',
            }}>
              {d === 7 ? '7 días' : d === 30 ? '30 días' : '90 días'}
            </button>
          ))}
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
        <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--texto)', marginBottom: 20 }}>Funnel de conversión</p>
        {[
          { label: 'Visitantes únicos', val: funnel.page_view, color: 'var(--crema-oscuro)' },
          { label: 'Agregaron al carrito', val: funnel.add_to_cart, color: '#d4a9b0' },
          { label: 'Enviaron por WhatsApp', val: funnel.whatsapp_send, color: 'var(--bordeaux)' },
        ].map((step, i) => {
          const pct = funnel.page_view ? Math.round((step.val / funnel.page_view) * 100) : 0;
          return (
            <div key={i} style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 13, color: 'var(--texto)' }}>{step.label}</span>
                <span style={{ fontSize: 13, color: 'var(--texto-suave)' }}>{fmt(step.val)} <span style={{ color: 'var(--bordeaux)', fontWeight: 600 }}>({pct}%)</span></span>
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
          <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--texto)', margin: 0 }}>Todos los eventos</p>
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
              <tr><td colSpan={3} style={{ padding: '32px', textAlign: 'center', color: 'var(--texto-suave)', fontStyle: 'italic' }}>Sin datos aún — los eventos aparecen en cuanto haya visitas al sitio</td></tr>
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
      <p style={{ fontSize: 11, color: 'var(--texto-suave)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px' }}>{label}</p>
      <p style={{ fontFamily: 'var(--serif)', fontSize: 28, color: 'var(--bordeaux)', margin: 0, lineHeight: 1 }}>{valor}</p>
      {sub && <p style={{ fontSize: 11, color: 'var(--texto-suave)', margin: '6px 0 0' }}>{sub}</p>}
    </div>
  );
}
