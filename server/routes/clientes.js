import { Router } from 'express';
import db from '../db.js';
import { authAdmin } from '../middleware/auth.js';

const router = Router();

// GET todos — con resumen de pedidos
router.get('/', authAdmin, (req, res) => {
  const clientes = db.prepare(`
    SELECT
      c.*,
      COUNT(p.id) as total_pedidos,
      COALESCE(SUM(p.total), 0) as total_gastado,
      MAX(p.creado_en) as ultimo_pedido_fecha,
      (SELECT p2.total FROM pedidos p2 WHERE p2.cliente_id = c.id ORDER BY p2.creado_en DESC LIMIT 1) as ultimo_pedido_total
    FROM clientes c
    LEFT JOIN pedidos p ON p.cliente_id = c.id
    GROUP BY c.id
    ORDER BY MAX(p.creado_en) DESC NULLS LAST
  `).all();
  res.json(clientes);
});

// GET nombres (para autocomplete)
router.get('/nombres', authAdmin, (req, res) => {
  const nombres = db.prepare('SELECT nombre FROM clientes ORDER BY nombre ASC').all().map(r => r.nombre);
  res.json(nombres);
});

// GET uno — con historial de pedidos
router.get('/:id', authAdmin, (req, res) => {
  const c = db.prepare('SELECT * FROM clientes WHERE id = ?').get(req.params.id);
  if (!c) return res.status(404).json({ error: 'No encontrado' });
  c.pedidos = db.prepare(`
    SELECT p.*, GROUP_CONCAT(pi.nombre_producto || ' x' || pi.cantidad, ', ') as items_resumen
    FROM pedidos p
    LEFT JOIN pedido_items pi ON pi.pedido_id = p.id
    WHERE p.cliente_id = ?
    GROUP BY p.id
    ORDER BY p.creado_en DESC
  `).all(c.id);
  res.json(c);
});

// POST — crear o retornar existente por nombre (upsert)
router.post('/', authAdmin, (req, res) => {
  const { nombre } = req.body;
  if (!nombre?.trim()) return res.status(400).json({ error: 'Nombre requerido' });
  const existente = db.prepare('SELECT * FROM clientes WHERE nombre = ? COLLATE NOCASE').get(nombre.trim());
  if (existente) return res.json(existente);
  const result = db.prepare('INSERT INTO clientes (nombre) VALUES (?)').run(nombre.trim());
  res.status(201).json(db.prepare('SELECT * FROM clientes WHERE id = ?').get(result.lastInsertRowid));
});

// PUT — editar recomendado_por y notas
router.put('/:id', authAdmin, (req, res) => {
  const { recomendado_por, notas, nombre } = req.body;
  const fields = [];
  const vals = [];
  if (nombre !== undefined) { fields.push('nombre = ?'); vals.push(nombre); }
  if (recomendado_por !== undefined) { fields.push('recomendado_por = ?'); vals.push(recomendado_por); }
  if (notas !== undefined) { fields.push('notas = ?'); vals.push(notas); }
  if (!fields.length) return res.status(400).json({ error: 'Nada para actualizar' });
  vals.push(req.params.id);
  db.prepare(`UPDATE clientes SET ${fields.join(', ')} WHERE id = ?`).run(...vals);
  res.json(db.prepare('SELECT * FROM clientes WHERE id = ?').get(req.params.id));
});

export default router;
