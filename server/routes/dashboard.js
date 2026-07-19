import { Router } from 'express';
import db from '../db.js';
import { authAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/', authAdmin, (req, res) => {
  const hoy = new Date();
  const mesActual = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
  const mesPasado = (() => {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  })();

  // KPIs mes actual
  const kpiActual = db.prepare(`
    SELECT COUNT(*) as pedidos, COALESCE(SUM(total), 0) as ventas
    FROM pedidos WHERE strftime('%Y-%m', creado_en) = ? AND estado != 'cancelado'
  `).get(mesActual);

  const kpiPasado = db.prepare(`
    SELECT COUNT(*) as pedidos, COALESCE(SUM(total), 0) as ventas
    FROM pedidos WHERE strftime('%Y-%m', creado_en) = ? AND estado != 'cancelado'
  `).get(mesPasado);

  // Últimos 6 meses — ventas mes a mes
  const mesMes = db.prepare(`
    SELECT strftime('%Y-%m', creado_en) as mes,
           COUNT(*) as pedidos,
           COALESCE(SUM(total), 0) as ventas
    FROM pedidos WHERE estado != 'cancelado'
      AND creado_en >= datetime('now', '-6 months')
    GROUP BY mes ORDER BY mes ASC
  `).all();

  // Top 5 productos (últimos 30 días)
  const topProductos = db.prepare(`
    SELECT pi.nombre_producto as nombre,
           SUM(pi.cantidad) as unidades,
           SUM(pi.cantidad * pi.precio_unitario) as ingresos
    FROM pedido_items pi
    JOIN pedidos p ON p.id = pi.pedido_id
    WHERE p.estado != 'cancelado'
      AND p.creado_en >= datetime('now', '-30 days')
    GROUP BY pi.nombre_producto
    ORDER BY unidades DESC LIMIT 5
  `).all();

  // Top 5 compradores (histórico)
  const topCompradores = db.prepare(`
    SELECT nombre_cliente as nombre,
           COUNT(*) as pedidos,
           COALESCE(SUM(total), 0) as total_gastado
    FROM pedidos WHERE estado != 'cancelado' AND nombre_cliente IS NOT NULL
    GROUP BY nombre_cliente
    ORDER BY total_gastado DESC LIMIT 5
  `).all();

  // Últimos 10 pedidos
  const ultimosPedidos = db.prepare(`
    SELECT * FROM pedidos ORDER BY creado_en DESC LIMIT 10
  `).all();
  for (const p of ultimosPedidos) {
    p.items = db.prepare('SELECT * FROM pedido_items WHERE pedido_id = ?').all(p.id);
  }

  res.json({
    mesActual, mesPasado,
    kpiActual, kpiPasado,
    mesMes, topProductos, topCompradores, ultimosPedidos,
  });
});

export default router;
