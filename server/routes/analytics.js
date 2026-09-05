import { Router } from 'express';
import db from '../db.js';
import { authAdmin } from '../middleware/auth.js';

const router = Router();

// POST público — recibe eventos del frontend
router.post('/event', (req, res) => {
  const { session_id, event, meta, referrer, ua, path } = req.body;
  if (!session_id || !event) return res.status(400).json({ error: 'Faltan campos' });
  db.prepare(
    `INSERT INTO analytics_events (session_id, event, meta, referrer, ua, path) VALUES (?, ?, ?, ?, ?, ?)`
  ).run(session_id, event, meta || '{}', referrer || null, ua || null, path || null);
  res.json({ ok: true });
});

// GET admin — resumen de los últimos N días
router.get('/summary', authAdmin, (req, res) => {
  const dias = parseInt(req.query.dias) || 30;

  const pageViews = db.prepare(`
    SELECT COUNT(*) as total, COUNT(DISTINCT session_id) as sesiones
    FROM analytics_events
    WHERE event = 'page_view' AND creado_en >= datetime('now', ?)
  `).get(`-${dias} days`);

  const eventos = db.prepare(`
    SELECT event, COUNT(*) as total, COUNT(DISTINCT session_id) as sesiones
    FROM analytics_events
    WHERE creado_en >= datetime('now', ?)
    GROUP BY event ORDER BY total DESC
  `).all(`-${dias} days`);

  const tiempoProm = db.prepare(`
    SELECT AVG(CAST(json_extract(meta, '$.seconds') AS INTEGER)) as prom_segundos
    FROM analytics_events
    WHERE event = 'time_on_page' AND creado_en >= datetime('now', ?)
    AND json_extract(meta, '$.seconds') > 0
    AND json_extract(meta, '$.seconds') < 3600
  `).get(`-${dias} days`);

  const porDia = db.prepare(`
    SELECT DATE(creado_en) as dia, COUNT(DISTINCT session_id) as sesiones, COUNT(*) as eventos
    FROM analytics_events
    WHERE event = 'page_view' AND creado_en >= datetime('now', ?)
    GROUP BY dia ORDER BY dia ASC
  `).all(`-${dias} days`);

  const funnel = {
    page_view: eventos.find(e => e.event === 'page_view')?.sesiones || 0,
    add_to_cart: eventos.find(e => e.event === 'add_to_cart')?.sesiones || 0,
    whatsapp_send: eventos.find(e => e.event === 'whatsapp_send')?.sesiones || 0,
    whatsapp_bubble: eventos.find(e => e.event === 'whatsapp_bubble')?.sesiones || 0,
  };

  res.json({
    dias,
    sesiones_totales: pageViews.sesiones,
    page_views: pageViews.total,
    tiempo_promedio_segundos: Math.round(tiempoProm.prom_segundos || 0),
    funnel,
    eventos,
    por_dia: porDia,
  });
});

export default router;
