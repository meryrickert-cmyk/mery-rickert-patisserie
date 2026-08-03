import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import db from '../db.js';
import { authAdmin } from '../middleware/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = process.env.DATA_DIR
  ? path.join(process.env.DATA_DIR, 'uploads')
  : path.join(__dirname, '../uploads');
const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOADS_DIR,
    filename: (req, file, cb) => cb(null, `cfg-${Date.now()}-${file.originalname.replace(/\s/g, '_')}`),
  }),
  limits: { fileSize: 20 * 1024 * 1024 },
});

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

// POST admin — subir imagen de config (about_imagen, etc.)
router.post('/imagen', authAdmin, upload.single('imagen'), (req, res) => {
  const { clave } = req.body;
  if (!req.file || !clave) return res.status(400).json({ error: 'Faltan datos' });
  const url = `/uploads/${req.file.filename}`;
  db.prepare('INSERT INTO config (clave, valor) VALUES (?, ?) ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor')
    .run(clave, url);
  res.json({ url });
});

export default router;
