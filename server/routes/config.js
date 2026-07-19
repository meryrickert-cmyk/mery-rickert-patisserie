import { Router } from 'express';
import db from '../db.js';
import { authAdmin } from '../middleware/auth.js';

const router = Router();

// GET público — toda la config de la página
router.get('/', (req, res) => {
  const rows = db.prepare('SELECT clave, valor FROM config').all();
  const config = {};
  for (const r of rows) config[r.clave] = r.valor;
  res.json(config);
});

// PUT admin — actualizar una clave
router.put('/:clave', authAdmin, (req, res) => {
  const { valor } = req.body;
  db.prepare('INSERT INTO config (clave, valor) VALUES (?, ?) ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor')
    .run(req.params.clave, valor);
  res.json({ ok: true });
});

// PUT admin — actualizar varias claves a la vez
router.put('/', authAdmin, (req, res) => {
  const cambios = req.body; // { clave: valor, ... }
  for (const [clave, valor] of Object.entries(cambios)) {
    db.prepare('INSERT INTO config (clave, valor) VALUES (?, ?) ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor')
      .run(clave, String(valor));
  }
  res.json({ ok: true });
});

export default router;
