import { useEffect, useState, useCallback } from 'react';
import { ComposedChart, BarChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts';
import api from '../../api/index.js';

const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

const COLORES_CAT = {
  'Tortas': '#7B1F2E',
  'Mixes': '#A8374A',
  'Alfajores': '#C4697A',
  'Budines': '#D4939F',
  'Mini Pavlovitas': '#E6BEC5',
  'Otros': '#D4C5B8',
};

function pct(actual, pasado) {
  if (!pasado) return null;
  return Math.round(((actual - pasado) / pasado) * 100);
}

function formatMes(ym) {
  const [y, m] = ym.split('-');
  return `${MESES[parseInt(m) - 1]} ${y.slice(2)}`;
}

function formatFecha(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' });
}

function hoy() { return new Date().toISOString().slice(0, 10); }

function periodos() {
  const ahora = new Date();
  const y = ahora.getFullYear();
  const m = ahora.getMonth();
  const esteDesde = `${y}-${String(m + 1).padStart(2, '0')}-01`;
  const esteHasta = `${y}-${String(m + 1).padStart(2, '0')}-31`;
  const pasadoD = new Date(y, m - 1, 1);
  const pasadoH = new Date(y, m - 1, 31);
  return {
    este_mes:   { desde: esteDesde, hasta: esteHasta, label: 'Este mes' },
    mes_pasado: { desde: pasadoD.toISOString().slice(0,10), hasta: pasadoH.toISOString().slice(0,10), label: 'Mes pasado' },
    este_anio:  { desde: `${y}-01-01`, hasta: `${y}-12-31`, label: 'Este año' },
  };
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [periodo, setPeriodo] = useState('este_mes');
  const [customDesde, setCustomDesde] = useState('');
  const [customHasta, setCustomHasta] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [productoModal, setProductoModal] = useState(null);

  const cargar = useCallback(() => {
    const ps = periodos();
    let desde, hasta;
    if (periodo === 'custom' && customDesde && customHasta) {
      desde = customDesde; hasta = customHasta;
    } else if (ps[periodo]) {
      desde = ps[periodo].desde; hasta = ps[periodo].hasta;
    } else {
      desde = ps.este_mes.desde; hasta = ps.este_mes.hasta;
    }
    api.get(`/dashboard?desde=${desde}&hasta=${hasta}`).then(r => setData(r.data));
  }, [periodo, customDesde, customHasta]);

  useEffect(() => { cargar(); }, [cargar]);

  const setPeriodoPreset = (p) => { setPeriodo(p); setShowCustom(false); };
  const toggleCustom = () => { setShowCustom(v => !v); if (!showCustom) setPeriodo('custom'); };

  if (!data) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <p style={{ color: 'var(--texto-suave)', fontFamily: 'var(--serif)', fontSize: 20, fontStyle: 'italic' }}>Cargando...</p>
    </div>
  );

  const delta = pct(data.kpiActual.ventas, data.kpiPasado.ventas);
  const grafData = data.mesMes.map(m => ({ mes: formatMes(m.mes), ventas: m.ventas, pedidos: m.pedidos }));
  const ps = periodos();
  const periodoLabel = periodo === 'custom' ? `${customDesde} — ${customHasta}` : ps[periodo]?.label ?? '';

  return (
    <div className="admin-page">
      {/* Encabezado + selector de periodo */}
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 32, color: 'var(--texto)', margin: 0 }}>Dashboard</h2>

        {/* Period selector */}
        <div style={{ marginTop: 14, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          {Object.entries(ps).map(([key, val]) => (
            <button key={key} onClick={() => setPeriodoPreset(key)} style={{
              padding: '6px 16px', borderRadius: 20, fontSize: 13, cursor: 'pointer',
              border: periodo === key ? '1.5px solid var(--bordeaux)' : '1.5px solid var(--crema-oscuro)',
              background: periodo === key ? 'var(--bordeaux)' : '#fff',
              color: periodo === key ? '#FAF7F2' : 'var(--texto-suave)',
              fontFamily: 'var(--sans)', transition: 'all 0.15s',
            }}>{val.label}</button>
          ))}
          <button onClick={toggleCustom} style={{
            padding: '6px 16px', borderRadius: 20, fontSize: 13, cursor: 'pointer',
            border: periodo === 'custom' ? '1.5px solid var(--bordeaux)' : '1.5px solid var(--crema-oscuro)',
            background: periodo === 'custom' ? 'var(--bordeaux)' : '#fff',
            color: periodo === 'custom' ? '#FAF7F2' : 'var(--texto-suave)',
            fontFamily: 'var(--sans)', transition: 'all 0.15s',
          }}>Personalizado</button>

          {showCustom && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <input type="date" value={customDesde} onChange={e => setCustomDesde(e.target.value)}
                style={{ padding: '5px 10px', borderRadius: 8, border: '1.5px solid var(--crema-oscuro)', fontSize: 13, color: 'var(--texto)', outline: 'none' }} />
              <span style={{ fontSize: 12, color: 'var(--texto-suave)' }}>→</span>
              <input type="date" value={customHasta} onChange={e => setCustomHasta(e.target.value)}
                style={{ padding: '5px 10px', borderRadius: 8, border: '1.5px solid var(--crema-oscuro)', fontSize: 13, color: 'var(--texto)', outline: 'none' }} />
              {customDesde && customHasta && (
                <button onClick={cargar} style={{ padding: '5px 14px', borderRadius: 8, border: 'none', background: 'var(--bordeaux)', color: '#FAF7F2', fontSize: 13, cursor: 'pointer' }}>Aplicar</button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 16, marginBottom: 32 }}>
        <KpiCard
          label="Ventas del período"
          valor={`$${data.kpiActual.ventas.toLocaleString('es-AR')}`}
          sub={delta !== null ? `${delta >= 0 ? '+' : ''}${delta}% vs período anterior` : undefined}
          color={delta !== null && delta >= 0 ? '#2d7a3a' : '#c0392b'}
        />
        <KpiCard label="Pedidos" valor={data.kpiActual.pedidos} sub={`${data.kpiPasado.pedidos} período anterior`} />
        <KpiCard
          label="Ticket promedio"
          valor={data.kpiActual.pedidos ? `$${Math.round(data.kpiActual.ventas / data.kpiActual.pedidos).toLocaleString('es-AR')}` : '—'}
        />
        <KpiCard label="Unidades vendidas" valor={data.itemsVendidos ?? 0} sub="Ítems en pedidos" />
        <KpiCard
          label="Ganancia estimada"
          valor={data.ganancia !== null ? `$${Math.round(data.ganancia).toLocaleString('es-AR')}` : '—'}
          sub={data.ganancia !== null ? `${data.items_con_costo} ítems con costo cargado` : 'Cargá recetas para calcular'}
          color={data.ganancia > 0 ? '#2d7a3a' : data.ganancia !== null ? '#c0392b' : undefined}
        />
        <KpiCard
          label="Margen"
          valor={data.margen_pct !== null ? `${data.margen_pct}%` : '—'}
          sub={data.margen_pct !== null ? 'Sobre ítems con receta' : 'Sin datos de costo aún'}
          color={data.margen_pct > 30 ? '#2d7a3a' : data.margen_pct !== null ? '#c0392b' : undefined}
        />
      </div>

      {/* Gráfico de barras */}
      <Section titulo="Ventas últimos 6 meses" sub="Independiente del período seleccionado">
        {grafData.length === 0
          ? <Empty />
          : (
            <ResponsiveContainer width="100%" height={240}>
              <ComposedChart data={grafData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--crema-oscuro)" vertical={false} />
                <XAxis dataKey="mes" tick={{ fontSize: 12, fill: 'var(--texto-suave)', fontFamily: 'var(--sans)' }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="ventas" tick={{ fontSize: 12, fill: 'var(--texto-suave)' }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                <YAxis yAxisId="pedidos" orientation="right" tick={{ fontSize: 12, fill: '#A8374A' }} axisLine={false} tickLine={false} tickFormatter={v => `${v} ped`} />
                <Tooltip
                  formatter={(v, name) => name === 'ventas' ? [`$${v.toLocaleString('es-AR')}`, 'Ventas'] : [v, 'Pedidos']}
                  contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontFamily: 'var(--sans)', fontSize: 13 }}
                />
                <Bar yAxisId="ventas" dataKey="ventas" fill="var(--bordeaux)" radius={[6, 6, 0, 0]} />
                <Line yAxisId="pedidos" dataKey="pedidos" stroke="#A8374A" strokeWidth={2} dot={{ fill: '#A8374A', r: 4 }} strokeDasharray="4 2" />
              </ComposedChart>
            </ResponsiveContainer>
          )
        }
      </Section>

      {/* Productos + Pie */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
        {/* Top productos */}
        <Section titulo="Productos más vendidos" sub={periodoLabel}>
          {data.topProductos.length === 0
            ? <Empty />
            : data.topProductos.map((p, i) => (
              <div key={i} onClick={() => setProductoModal(p.nombre)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < data.topProductos.length - 1 ? '1px solid var(--crema-oscuro)' : 'none', cursor: 'pointer', borderRadius: 8, transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--crema)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
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

        {/* Pie chart por categoría */}
        <Section titulo="Por categoría" sub={periodoLabel}>
          {data.porCategoria.length === 0
            ? <Empty />
            : (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={data.porCategoria}
                      dataKey="ingresos"
                      nameKey="categoria"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                    >
                      {data.porCategoria.map((entry) => (
                        <Cell key={entry.categoria} fill={COLORES_CAT[entry.categoria] || '#C4697A'} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v, name) => [`$${v.toLocaleString('es-AR')}`, name]}
                      contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontFamily: 'var(--sans)', fontSize: 12 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {data.porCategoria.map(cat => {
                    const total = data.porCategoria.reduce((s, c) => s + c.ingresos, 0);
                    const share = total ? Math.round(cat.ingresos / total * 100) : 0;
                    return (
                      <div key={cat.categoria} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 10, height: 10, borderRadius: '50%', background: COLORES_CAT[cat.categoria] || '#C4697A', flexShrink: 0 }} />
                        <span style={{ fontSize: 12, color: 'var(--texto)', flex: 1 }}>{cat.categoria}</span>
                        <span style={{ fontSize: 12, color: 'var(--texto-suave)' }}>{share}%</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--texto)', width: 70, textAlign: 'right' }}>${cat.ingresos.toLocaleString('es-AR')}</span>
                      </div>
                    );
                  })}
                </div>
              </>
            )
          }
        </Section>
      </div>

      {/* Mejores clientes */}
      <div style={{ marginTop: 16 }}>
        <Section titulo="Mejores clientes" sub={periodoLabel}>
          {data.topCompradores.length === 0
            ? <Empty />
            : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
                {data.topCompradores.map((c, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--crema-oscuro)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
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
                ))}
              </div>
            )
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

      {/* Modal detalle producto */}
      {productoModal && (
        <ProductoModal
          nombre={productoModal}
          desde={periodo === 'custom' ? customDesde : periodos()[periodo]?.desde}
          hasta={periodo === 'custom' ? customHasta : periodos()[periodo]?.hasta}
          onClose={() => setProductoModal(null)}
        />
      )}
    </div>
  );
}

function ProductoModal({ nombre, desde, hasta, onClose }) {
  const [pedidos, setPedidos] = useState(null);

  useEffect(() => {
    const params = desde && hasta ? `?desde=${desde}&hasta=${hasta}` : '';
    api.get(`/dashboard/producto/${encodeURIComponent(nombre)}${params}`).then(r => setPedidos(r.data));
  }, [nombre, desde, hasta]);

  const total = pedidos?.reduce((s, p) => {
    const item = p.items?.find(i => i.nombre_producto.toLowerCase() === nombre.toLowerCase());
    return s + (item ? item.cantidad * item.precio_unitario : 0);
  }, 0) ?? 0;

  const unidades = pedidos?.reduce((s, p) => {
    const item = p.items?.find(i => i.nombre_producto.toLowerCase() === nombre.toLowerCase());
    return s + (item ? item.cantidad : 0);
  }, 0) ?? 0;

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.25)', zIndex: 50, backdropFilter: 'blur(2px)' }} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 51, width: '96%', maxWidth: 700, background: '#fff', borderRadius: 20, boxShadow: '0 20px 60px rgba(0,0,0,0.15)', maxHeight: '88vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid var(--crema-oscuro)' }}>
          <div>
            <h3 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: 26, color: 'var(--texto)', margin: 0 }}>{nombre}</h3>
            {pedidos && <p style={{ fontSize: 13, color: 'var(--texto-suave)', margin: '4px 0 0' }}>{unidades} unidades · ${total.toLocaleString('es-AR')} en ventas</p>}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 26, cursor: 'pointer', color: 'var(--texto-suave)', lineHeight: 1, padding: 4 }}>×</button>
        </div>
        <div style={{ padding: '20px 24px 24px' }}>
          {!pedidos
            ? <p style={{ color: 'var(--texto-suave)', textAlign: 'center', fontStyle: 'italic' }}>Cargando...</p>
            : pedidos.length === 0
            ? <p style={{ color: 'var(--texto-suave)', textAlign: 'center', fontStyle: 'italic' }}>Sin pedidos en este período</p>
            : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {pedidos.map(p => {
                  const item = p.items?.find(i => i.nombre_producto.toLowerCase() === nombre.toLowerCase());
                  return (
                    <div key={p.id} style={{ background: 'var(--crema)', borderRadius: 12, padding: '14px 16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--texto)', margin: 0 }}>{p.nombre_cliente || '—'}</p>
                          <p style={{ fontSize: 12, color: 'var(--texto-suave)', margin: '3px 0 0' }}>#{p.id} · {formatFecha(p.creado_en)}</p>
                        </div>
                        {item && (
                          <div style={{ textAlign: 'right' }}>
                            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--bordeaux)', margin: 0 }}>${(item.precio_unitario * item.cantidad).toLocaleString('es-AR')}</p>
                            <p style={{ fontSize: 12, color: 'var(--texto-suave)', margin: '2px 0 0' }}>{item.cantidad} u. · ${item.precio_unitario.toLocaleString('es-AR')} c/u</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          }
        </div>
      </div>
    </>
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
