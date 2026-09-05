import { Router } from 'express';
import db from '../db.js';
import { authAdmin } from '../middleware/auth.js';

const router = Router();

// POST público — recibe eventos del frontend
router.post('/event', (req, res) => {
  const { session_id, event, meta, referrer, ua, path } = req.body;
  if (!session_id || !event) return res.status(400).json({ error: 'Faltan campos' });
  // Ignorar eventos que vengan de rutas /admin (por si acaso)
  if (path && path.startsWith('/admin')) return res.json({ ok: true });
  db.prepare(
    `INSERT INTO analytics_events (session_id, event, meta, referrer, ua, path) VALUES (?, ?, ?, ?, ?, ?)`
  ).run(session_id, event, meta || '{}', referrer || null, ua || null, path || null);
  res.json({ ok: true });
});

// GET admin — resumen por período (desde/hasta) o por días
router.get('/summary', authAdmin, (req, res) => {
  const { desde, hasta, dias: diasQ } = req.query;

  let filtro, params;
  if (desde && hasta) {
    filtro = `date(creado_en) BETWEEN ? AND ?`;
    params = [desde, hasta];
  } else {
    const dias = parseInt(diasQ) || 30;
    filtro = `creado_en >= datetime('now', ?)`;
    params = [`-${dias} days`];
  }

  const pageViews = db.prepare(`
    SELECT COUNT(*) as total, COUNT(DISTINCT session_id) as sesiones
    FROM analytics_events
    WHERE event = 'page_view' AND ${filtro}
  `).get(...params);

  const eventos = db.prepare(`
    SELECT event, COUNT(*) as total, COUNT(DISTINCT session_id) as sesiones
    FROM analytics_events
    WHERE ${filtro}
    GROUP BY event ORDER BY total DESC
  `).all(...params);

  const tiempoProm = db.prepare(`
    SELECT AVG(CAST(json_extract(meta, '$.seconds') AS INTEGER)) as prom_segundos
    FROM analytics_events
    WHERE event = 'time_on_page' AND ${filtro}
    AND json_extract(meta, '$.seconds') > 0
    AND json_extract(meta, '$.seconds') < 3600
  `).get(...params);

  const porDia = db.prepare(`
    SELECT DATE(creado_en) as dia, COUNT(DISTINCT session_id) as sesiones, COUNT(*) as eventos
    FROM analytics_events
    WHERE event = 'page_view' AND ${filtro}
    GROUP BY dia ORDER BY dia ASC
  `).all(...params);

  const funnel = {
    page_view: eventos.find(e => e.event === 'page_view')?.sesiones || 0,
    add_to_cart: eventos.find(e => e.event === 'add_to_cart')?.sesiones || 0,
    whatsapp_send: eventos.find(e => e.event === 'whatsapp_send')?.sesiones || 0,
    whatsapp_bubble: eventos.find(e => e.event === 'whatsapp_bubble')?.sesiones || 0,
  };

  res.json({
    sesiones_totales: pageViews.sesiones,
    page_views: pageViews.total,
    tiempo_promedio_segundos: Math.round(tiempoProm.prom_segundos || 0),
    funnel,
    eventos,
    por_dia: porDia,
  });
});

export default router;
