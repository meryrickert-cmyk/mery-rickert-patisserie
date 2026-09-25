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

const storage = multer.diskStorage({
  destination: UPLOADS_DIR,
  filename: (req, file, cb) => cb(null, `pres-${Date.now()}-${file.originalname.replace(/\s/g, '_')}`),
});
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } });

function withFotos(p) {
  p.fotos = db.prepare('SELECT * FROM presupuesto_fotos WHERE presupuesto_id = ? ORDER BY orden').all(p.id);
  try { p.items = JSON.parse(p.items || '[]'); } catch { p.items = []; }
  return p;
}

// GET — lista de presupuestos
router.get('/', authAdmin, (req, res) => {
  const rows = db.prepare('SELECT * FROM presupuestos ORDER BY creado_en DESC').all();
  res.json(rows.map(withFotos));
});

// GET — un presupuesto
router.get('/:id', authAdmin, (req, res) => {
  const p = db.prepare('SELECT * FROM presupuestos WHERE id = ?').get(req.params.id);
  if (!p) return res.status(404).json({ error: 'No encontrado' });
  res.json(withFotos(p));
});

// POST — crear presupuesto con fotos opcionales
router.post('/', authAdmin, (req, res, next) => {
  upload.array('fotos', 20)(req, res, err => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error: 'Foto demasiado grande (máx. 20 MB)' });
      return res.status(400).json({ error: `Error al subir foto: ${err.message}` });
    }
    try {
      const { fecha, cliente, personas, nota, items, total } = req.body;
      const result = db.prepare(
        'INSERT INTO presupuestos (fecha, cliente, personas, nota, items, total) VALUES (?, ?, ?, ?, ?, ?)'
      ).run(fecha, cliente, parseInt(personas) || 1, nota || '', items || '[]', parseFloat(total) || 0);

      const id = result.lastInsertRowid;

      if (req.files?.length) {
        const ins = db.prepare('INSERT INTO presupuesto_fotos (presupuesto_id, url, descripcion, orden) VALUES (?, ?, ?, ?)');
        req.files.forEach((f, i) => ins.run(id, `/uploads/${f.filename}`, '', i));
      }

      const p = db.prepare('SELECT * FROM presupuestos WHERE id = ?').get(id);
      res.status(201).json(withFotos(p));
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
});

// PUT — actualizar presupuesto
router.put('/:id', authAdmin, (req, res, next) => {
  upload.array('fotos', 20)(req, res, err => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error: 'Foto demasiado grande (máx. 20 MB)' });
      return res.status(400).json({ error: `Error al subir foto: ${err.message}` });
    }
    try {
      const { fecha, cliente, personas, nota, items, total } = req.body;
      db.prepare(
        'UPDATE presupuestos SET fecha=?, cliente=?, personas=?, nota=?, items=?, total=? WHERE id=?'
      ).run(fecha, cliente, parseInt(personas) || 1, nota || '', items || '[]', parseFloat(total) || 0, req.params.id);

      if (req.files?.length) {
        const maxOrden = db.prepare('SELECT COALESCE(MAX(orden),0) as m FROM presupuesto_fotos WHERE presupuesto_id=?').get(req.params.id).m;
        const ins = db.prepare('INSERT INTO presupuesto_fotos (presupuesto_id, url, descripcion, orden) VALUES (?, ?, ?, ?)');
        req.files.forEach((f, i) => ins.run(req.params.id, `/uploads/${f.filename}`, '', maxOrden + i + 1));
      }

      const p = db.prepare('SELECT * FROM presupuestos WHERE id = ?').get(req.params.id);
      res.json(withFotos(p));
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
});

// DELETE foto
router.delete('/:id/foto/:fotoId', authAdmin, (req, res) => {
  try {
    db.prepare('DELETE FROM presupuesto_fotos WHERE id = ? AND presupuesto_id = ?').run(req.params.fotoId, req.params.id);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE presupuesto
router.delete('/:id', authAdmin, (req, res) => {
  try {
    db.prepare('DELETE FROM presupuesto_fotos WHERE presupuesto_id = ?').run(req.params.id);
    db.prepare('DELETE FROM presupuestos WHERE id = ?').run(req.params.id);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
