import { Router } from 'express';
import db from '../db.js';
import { authAdmin } from '../middleware/auth.js';

const router = Router();

function periodoDefault() {
  const hoy = new Date();
  const desde = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-01`;
  const hasta = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-31`;
  return { desde, hasta };
}

function categoriaSQL(col) {
  return `CASE
    WHEN lower(${col}) LIKE '%torta%' THEN 'Tortas'
    WHEN lower(${col}) LIKE '%mix%' THEN 'Mixes'
    WHEN lower(${col}) LIKE '%alfajor%' THEN 'Alfajores'
    WHEN lower(${col}) LIKE '%budin%' OR lower(${col}) LIKE '%budín%' THEN 'Budines'
    WHEN lower(${col}) LIKE '%pavlov%' OR lower(${col}) LIKE '%mini pav%' THEN 'Mini Pavlovitas'
    ELSE 'Otros'
  END`;
}

router.get('/', authAdmin, (req, res) => {
  const { desde: qDesde, hasta: qHasta } = req.query;
  const { desde, hasta } = qDesde && qHasta ? { desde: qDesde, hasta: qHasta } : periodoDefault();

  // Calcular periodo anterior de igual duración
  const msDesde = new Date(desde).getTime();
  const msHasta = new Date(hasta).getTime();
  const duracion = msHasta - msDesde;
  const desdeAnt = new Date(msDesde - duracion - 86400000).toISOString().slice(0, 10);
  const hastaAnt = new Date(msDesde - 86400000).toISOString().slice(0, 10);

  const kpiActual = db.prepare(`
    SELECT
      COUNT(DISTINCT p.id) as pedidos,
      COALESCE(SUM(p.total), 0) as ventas,
      COALESCE(SUM(pi.cantidad * pi.precio_unitario), 0) as ventas_items,
      COALESCE(SUM(CASE WHEN pi.costo_unitario IS NOT NULL THEN pi.cantidad * pi.costo_unitario ELSE NULL END), 0) as costo_total,
      COUNT(CASE WHEN pi.costo_unitario IS NOT NULL THEN 1 END) as items_con_costo
    FROM pedidos p
    LEFT JOIN pedido_items pi ON pi.pedido_id = p.id
    WHERE date(p.creado_en) BETWEEN ? AND ? AND p.estado != 'cancelado'
  `).get(desde, hasta);

  const kpiPasado = db.prepare(`
    SELECT COUNT(DISTINCT p.id) as pedidos, COALESCE(SUM(p.total), 0) as ventas
    FROM pedidos p WHERE date(p.creado_en) BETWEEN ? AND ? AND p.estado != 'cancelado'
  `).get(desdeAnt, hastaAnt);

  const itemsVendidos = db.prepare(`
    SELECT COALESCE(SUM(pi.cantidad), 0) as total
    FROM pedido_items pi
    JOIN pedidos p ON p.id = pi.pedido_id
    WHERE date(p.creado_en) BETWEEN ? AND ? AND p.estado != 'cancelado'
  `).get(desde, hasta);

  const porCategoria = db.prepare(`
    SELECT ${categoriaSQL('pi.nombre_producto')} as categoria,
           SUM(pi.cantidad * pi.precio_unitario) as ingresos,
           SUM(pi.cantidad) as unidades
    FROM pedido_items pi
    JOIN pedidos p ON p.id = pi.pedido_id
    WHERE date(p.creado_en) BETWEEN ? AND ? AND p.estado != 'cancelado'
    GROUP BY categoria
    ORDER BY ingresos DESC
  `).all(desde, hasta);

  // Últimos 6 meses siempre (para el gráfico de barras)
  const mesMes = db.prepare(`
    SELECT strftime('%Y-%m', creado_en) as mes,
           COUNT(*) as pedidos,
           COALESCE(SUM(total), 0) as ventas
    FROM pedidos WHERE estado != 'cancelado'
      AND creado_en >= datetime('now', '-6 months')
    GROUP BY mes ORDER BY mes ASC
  `).all();

  const topProductos = db.prepare(`
    SELECT pi.nombre_producto as nombre,
           SUM(pi.cantidad) as unidades,
           SUM(pi.cantidad * pi.precio_unitario) as ingresos
    FROM pedido_items pi
    JOIN pedidos p ON p.id = pi.pedido_id
    WHERE p.estado != 'cancelado'
      AND date(p.creado_en) BETWEEN ? AND ?
    GROUP BY pi.nombre_producto
    ORDER BY unidades DESC LIMIT 5
  `).all(desde, hasta);

  const topCompradores = db.prepare(`
    SELECT nombre_cliente as nombre,
           COUNT(*) as pedidos,
           COALESCE(SUM(total), 0) as total_gastado
    FROM pedidos WHERE estado != 'cancelado' AND nombre_cliente IS NOT NULL
      AND date(creado_en) BETWEEN ? AND ?
    GROUP BY nombre_cliente
    ORDER BY total_gastado DESC LIMIT 5
  `).all(desde, hasta);

  const ultimosPedidos = db.prepare(`
    SELECT * FROM pedidos ORDER BY creado_en DESC LIMIT 10
  `).all();
  for (const p of ultimosPedidos) {
    p.items = db.prepare('SELECT * FROM pedido_items WHERE pedido_id = ?').all(p.id);
  }

  // Ganancia y margen solo sobre ítems con costo cargado
  const ganancia = kpiActual.costo_total > 0
    ? kpiActual.ventas_items - kpiActual.costo_total
    : null;
  const margen_pct = (ganancia !== null && kpiActual.ventas_items > 0)
    ? Math.round((ganancia / kpiActual.ventas_items) * 100)
    : null;

  res.json({
    desde, hasta,
    kpiActual, kpiPasado,
    ganancia, margen_pct,
    items_con_costo: kpiActual.items_con_costo,
    itemsVendidos: itemsVendidos.total,
    porCategoria,
    mesMes, topProductos, topCompradores, ultimosPedidos,
  });
});

// Detalle de un producto: todos los pedidos que lo contienen en el periodo
router.get('/producto/:nombre', authAdmin, (req, res) => {
  const { desde, hasta } = req.query;
  const nombre = decodeURIComponent(req.params.nombre);

  const pedidos = db.prepare(`
    SELECT DISTINCT p.*, pi.cantidad, pi.precio_unitario
    FROM pedidos p
    JOIN pedido_items pi ON pi.pedido_id = p.id
    WHERE lower(pi.nombre_producto) = lower(?)
      ${desde && hasta ? 'AND date(p.creado_en) BETWEEN ? AND ?' : ''}
    ORDER BY p.creado_en DESC
  `).all(desde && hasta ? [nombre, desde, hasta] : [nombre]);

  for (const p of pedidos) {
    p.items = db.prepare('SELECT * FROM pedido_items WHERE pedido_id = ?').all(p.id);
  }

  res.json(pedidos);
});

export default router;
