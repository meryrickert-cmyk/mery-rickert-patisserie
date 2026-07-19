import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import api from '../../api/index.js';

const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

function pct(actual, pasado) {
  if (!pasado) return null;
  return Math.round(((actual - pasado) / pasado) * 100);
}

function formatMes(ym) {
  const [y, m] = ym.split('-');
  return `${MESES[parseInt(m) - 1]} ${y.slice(2)}`;
}

export default function Dashboard() {
  const [data, setData] = useState(null);

  useEffect(() => { api.get('/dashboard').then(r => setData(r.data)); }, []);

  if (!data) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <p style={{ color: 'var(--texto-suave)', fontFamily: 'var(--serif)', fontSize: 20, fontStyle: 'italic' }}>Cargando...</p>
    </div>
  );

  const delta = pct(data.kpiActual.ventas, data.kpiPasado.ventas);
  const grafData = data.mesMes.map(m => ({ mes: formatMes(m.mes), ventas: m.ventas, pedidos: m.pedidos }));

  return (
    <div style={{ padding: '36px 32px', maxWidth: 1000 }}>
      {/* Título */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 32, color: 'var(--texto)', margin: 0 }}>Dashboard</h2>
        <p style={{ color: 'var(--texto-suave)', fontSize: 13, marginTop: 4 }}>
          {formatMes(data.mesActual)} · vista general del negocio
        </p>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 32 }}>
        <KpiCard
          label="Ventas este mes"
          valor={`$${data.kpiActual.ventas.toLocaleString('es-AR')}`}
          sub={delta !== null ? `${delta >= 0 ? '+' : ''}${delta}% vs mes anterior` : `$${data.kpiPasado.ventas.toLocaleString('es-AR')} el mes pasado`}
          color={delta !== null && delta >= 0 ? '#2d7a3a' : '#c0392b'}
        />
        <KpiCard
          label="Pedidos este mes"
          valor={data.kpiActual.pedidos}
          sub={`${data.kpiPasado.pedidos} el mes anterior`}
        />
        <KpiCard
          label="Ticket promedio"
          valor={data.kpiActual.pedidos ? `$${Math.round(data.kpiActual.ventas / data.kpiActual.pedidos).toLocaleString('es-AR')}` : '—'}
          sub="Este mes"
        />
      </div>

      {/* Gráfico */}
      <Section titulo="Ventas últimos 6 meses">
        {grafData.length === 0
          ? <Empty />
          : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={grafData} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--crema-oscuro)" vertical={false} />
                <XAxis dataKey="mes" tick={{ fontSize: 12, fill: 'var(--texto-suave)', fontFamily: 'var(--sans)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: 'var(--texto-suave)' }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={v => [`$${v.toLocaleString('es-AR')}`, 'Ventas']}
                  contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontFamily: 'var(--sans)', fontSize: 13 }}
                />
                <Bar dataKey="ventas" fill="var(--bordeaux)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )
        }
      </Section>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
        {/* Top productos */}
        <Section titulo="Productos más vendidos" sub="Últimos 30 días">
          {data.topProductos.length === 0
            ? <Empty />
            : data.topProductos.map((p, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < data.topProductos.length - 1 ? '1px solid var(--crema-oscuro)' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: 11, color: 'var(--bordeaux)', fontWeight: 600, width: 16, textAlign: 'right', flexShrink: 0 }}>{i + 1}</span>
                  <span style={{ fontSize: 13, color: 'var(--texto)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.nombre}</span>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 8 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--texto)', margin: 0 }}>{p.unidades} u.</p>
                  <p style={{ fontSize: 11, color: 'var(--texto-suave)', margin: 0 }}>${p.ingresos.toLocaleString('es-AR')}</p>
                </div>
              </div>
            ))
          }
        </Section>

        {/* Top compradores */}
        <Section titulo="Mejores clientes" sub="Histórico">
          {data.topCompradores.length === 0
            ? <Empty />
            : data.topCompradores.map((c, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < data.topCompradores.length - 1 ? '1px solid var(--crema-oscuro)' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: 11, color: 'var(--bordeaux)', fontWeight: 600, width: 16, textAlign: 'right', flexShrink: 0 }}>{i + 1}</span>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 13, color: 'var(--texto)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.nombre}</p>
                    <p style={{ fontSize: 11, color: 'var(--texto-suave)', margin: 0 }}>{c.pedidos} pedido{c.pedidos !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--texto)', margin: 0, flexShrink: 0, marginLeft: 8 }}>
                  ${Math.round(c.total_gastado).toLocaleString('es-AR')}
                </p>
              </div>
            ))
          }
        </Section>
      </div>

      {/* Últimos pedidos */}
      <Section titulo="Últimos pedidos" style={{ marginTop: 16 }}>
        {data.ultimosPedidos.length === 0
          ? <Empty />
          : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--crema-oscuro)' }}>
                  {['#', 'Cliente', 'Total', 'Origen', 'Fecha'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '0 8px 10px', color: 'var(--texto-suave)', fontWeight: 500, fontSize: 12 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.ultimosPedidos.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--crema-oscuro)' }}>
                    <td style={{ padding: '12px 8px', color: 'var(--texto-suave)' }}>#{p.id}</td>
                    <td style={{ padding: '12px 8px', color: 'var(--texto)', fontWeight: 500 }}>{p.nombre_cliente || '—'}</td>
                    <td style={{ padding: '12px 8px', color: 'var(--bordeaux)', fontWeight: 600 }}>${p.total.toLocaleString('es-AR')}</td>
                    <td style={{ padding: '12px 8px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 50, fontSize: 11, background: p.origen === 'manual' ? '#f0ebe1' : '#e8f0fe', color: p.origen === 'manual' ? 'var(--bordeaux-oscuro)' : '#1a56db' }}>
                        {p.origen === 'manual' ? 'Manual' : 'Web'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 8px', color: 'var(--texto-suave)' }}>
                      {new Date(p.creado_en).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        }
      </Section>
    </div>
  );
}

function KpiCard({ label, valor, sub, color }) {
  return (
    <div style={{ background: '#fff', borderRadius: 16, padding: '20px 22px', border: '1px solid var(--crema-oscuro)' }}>
      <p style={{ fontSize: 12, color: 'var(--texto-suave)', marginBottom: 8, letterSpacing: '0.05em' }}>{label}</p>
      <p style={{ fontFamily: 'var(--serif)', fontSize: 28, fontWeight: 400, color: 'var(--texto)', margin: '0 0 6px' }}>{valor}</p>
      {sub && <p style={{ fontSize: 12, color: color || 'var(--texto-suave)', margin: 0 }}>{sub}</p>}
    </div>
  );
}

function Section({ titulo, sub, children, style }) {
  return (
    <div style={{ background: '#fff', borderRadius: 16, padding: '22px 24px', border: '1px solid var(--crema-oscuro)', ...style }}>
      <div style={{ marginBottom: 16 }}>
        <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--texto)', margin: 0 }}>{titulo}</p>
        {sub && <p style={{ fontSize: 12, color: 'var(--texto-suave)', margin: '2px 0 0' }}>{sub}</p>}
      </div>
      {children}
    </div>
  );
}

function Empty() {
  return <p style={{ color: 'var(--texto-suave)', fontSize: 13, fontStyle: 'italic', textAlign: 'center', padding: '16px 0' }}>Sin datos aún</p>;
}
