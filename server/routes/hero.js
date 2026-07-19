import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import db from '../db.js';
import { authAdmin } from '../middleware/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = Router();

const UPLOADS_DIR = process.env.DATA_DIR
  ? path.join(process.env.DATA_DIR, 'uploads')
  : path.join(__dirname, '../uploads');
const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOADS_DIR,
    filename: (req, file, cb) => cb(null, `hero-${Date.now()}-${file.originalname.replace(/\s/g, '_')}`),
  }),
  limits: { fileSize: 20 * 1024 * 1024 },
});

// GET público — todas las imágenes del hero ordenadas
router.get('/', (req, res) => {
  res.json(db.prepare('SELECT * FROM hero_imagenes ORDER BY orden ASC').all());
});

// POST admin — subir nueva imagen
router.post('/', authAdmin, upload.single('imagen'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No se recibió imagen' });
  const maxOrden = db.prepare('SELECT MAX(orden) as m FROM hero_imagenes').get().m ?? -1;
  const result = db.prepare('INSERT INTO hero_imagenes (url, orden) VALUES (?, ?)').run(`/uploads/${req.file.filename}`, maxOrden + 1);
  res.status(201).json(db.prepare('SELECT * FROM hero_imagenes WHERE id = ?').get(result.lastInsertRowid));
});

// DELETE admin — eliminar imagen
router.delete('/:id', authAdmin, (req, res) => {
  db.prepare('DELETE FROM hero_imagenes WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// PATCH admin — reordenar [{id, orden}]
router.patch('/reordenar', authAdmin, (req, res) => {
  const { items } = req.body;
  for (const { id, orden } of items) {
    db.prepare('UPDATE hero_imagenes SET orden = ? WHERE id = ?').run(orden, id);
  }
  res.json({ ok: true });
});

export default router;
