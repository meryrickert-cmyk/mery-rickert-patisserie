import { Router } from 'express';
import db from '../db.js';
import { authAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/', authAdmin, (req, res) => {
  const clientes = db.prepare(`
    SELECT c.*, COUNT(p.id) as total_pedidos, COALESCE(SUM(p.total), 0) as total_gastado
    FROM clientes c
    LEFT JOIN pedidos p ON p.cliente_id = c.id
    GROUP BY c.id
    ORDER BY c.creado_en DESC
  `).all();
  res.json(clientes);
});

router.get('/:id', authAdmin, (req, res) => {
  const c = db.prepare('SELECT * FROM clientes WHERE id = ?').get(req.params.id);
  if (!c) return res.status(404).json({ error: 'No encontrado' });
  c.pedidos = db.prepare('SELECT * FROM pedidos WHERE cliente_id = ? ORDER BY creado_en DESC').all(c.id);
  res.json(c);
});

export default router;
