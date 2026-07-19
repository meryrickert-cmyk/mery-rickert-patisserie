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
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/\s/g, '_')}`),
});
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } }); // 20MB

function withImagenes(producto) {
  producto.imagenes = db.prepare('SELECT * FROM producto_imagenes WHERE producto_id = ? ORDER BY orden').all(producto.id);
  return producto;
}

// GET público — catálogo activo
router.get('/', (req, res) => {
  const { categoria } = req.query;
  let sql = 'SELECT * FROM productos WHERE activo = 1';
  const params = [];
  if (categoria) { sql += ' AND categoria = ?'; params.push(categoria); }
  sql += ' ORDER BY categoria, orden, nombre ASC';
  const productos = db.prepare(sql).all(...params).map(withImagenes);
  res.json(productos);
});

// GET público — detalle
router.get('/:id', (req, res) => {
  const p = db.prepare('SELECT * FROM productos WHERE id = ? AND activo = 1').get(req.params.id);
  if (!p) return res.status(404).json({ error: 'No encontrado' });
  res.json(withImagenes(p));
});

// Middleware para capturar errores de multer
function handleUpload(req, res, next) {
  upload.array('imagenes', 10)(req, res, err => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error: 'La foto es demasiado grande (máx. 20 MB)' });
      return res.status(400).json({ error: `Error al subir imagen: ${err.message}` });
    }
    next();
  });
}

// POST admin — crear producto
router.post('/', authAdmin, handleUpload, (req, res) => {
  const { nombre, descripcion, precio, stock, categoria, orden } = req.body;
  if (!nombre || !precio) return res.status(400).json({ error: 'Nombre y precio requeridos' });
  const imagen = req.files?.[0] ? `/uploads/${req.files[0].filename}` : null;
  const result = db.prepare(
    'INSERT INTO productos (nombre, descripcion, precio, stock, categoria, imagen, orden) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(nombre, descripcion || '', parseFloat(precio), parseInt(stock ?? 99), categoria || 'tortas', imagen, parseInt(orden ?? 0));

  // Guardar imágenes adicionales
  if (req.files?.length) {
    req.files.forEach((f, i) => {
      db.prepare('INSERT INTO producto_imagenes (producto_id, url, orden) VALUES (?, ?, ?)').run(result.lastInsertRowid, `/uploads/${f.filename}`, i);
    });
  }

  res.status(201).json(withImagenes(db.prepare('SELECT * FROM productos WHERE id = ?').get(result.lastInsertRowid)));
});

// PUT admin — editar producto
router.put('/:id', authAdmin, handleUpload, (req, res) => {
  const { nombre, descripcion, precio, stock, categoria, activo, orden } = req.body;
  const actual = db.prepare('SELECT * FROM productos WHERE id = ?').get(req.params.id);
  if (!actual) return res.status(404).json({ error: 'No encontrado' });

  const imagen = req.files?.[0] ? `/uploads/${req.files[0].filename}` : actual.imagen;

  db.prepare(
    'UPDATE productos SET nombre=?, descripcion=?, precio=?, stock=?, categoria=?, imagen=?, activo=?, orden=? WHERE id=?'
  ).run(
    nombre ?? actual.nombre,
    descripcion ?? actual.descripcion,
    precio != null ? parseFloat(precio) : actual.precio,
    stock != null ? parseInt(stock) : actual.stock,
    categoria ?? actual.categoria,
    imagen,
    activo != null ? parseInt(activo) : actual.activo,
    orden != null ? parseInt(orden) : actual.orden,
    req.params.id
  );

  // Agregar nuevas imágenes si se subieron
  if (req.files?.length) {
    const maxOrden = db.prepare('SELECT MAX(orden) as m FROM producto_imagenes WHERE producto_id = ?').get(req.params.id).m ?? -1;
    req.files.forEach((f, i) => {
      db.prepare('INSERT INTO producto_imagenes (producto_id, url, orden) VALUES (?, ?, ?)').run(req.params.id, `/uploads/${f.filename}`, maxOrden + i + 1);
    });
  }

  res.json(withImagenes(db.prepare('SELECT * FROM productos WHERE id = ?').get(req.params.id)));
});

// DELETE admin — desactivar
router.delete('/:id', authAdmin, (req, res) => {
  db.prepare('UPDATE productos SET activo = 0 WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// DELETE imagen individual
router.delete('/:id/imagenes/:imgId', authAdmin, (req, res) => {
  db.prepare('DELETE FROM producto_imagenes WHERE id = ? AND producto_id = ?').run(req.params.imgId, req.params.id);
  res.json({ ok: true });
});

// PATCH — reordenar imágenes de un producto: [{id, orden}]
router.patch('/:id/imagenes/reordenar', authAdmin, (req, res) => {
  const { items } = req.body;
  for (const { id, orden } of items) {
    db.prepare('UPDATE producto_imagenes SET orden = ? WHERE id = ? AND producto_id = ?').run(orden, id, req.params.id);
  }
  res.json({ ok: true });
});

// PATCH — reordenar productos (array de {id, orden})
router.patch('/reordenar', authAdmin, (req, res) => {
  const { items } = req.body;
  for (const { id, orden } of items) {
    db.prepare('UPDATE productos SET orden = ? WHERE id = ?').run(orden, id);
  }
  res.json({ ok: true });
});

// GET admin — todos (incluyendo inactivos)
router.get('/admin/todos', authAdmin, (req, res) => {
  const { categoria } = req.query;
  let sql = 'SELECT * FROM productos';
  const params = [];
  if (categoria) { sql += ' WHERE categoria = ?'; params.push(categoria); }
  sql += ' ORDER BY categoria, orden, nombre ASC';
  res.json(db.prepare(sql).all(...params).map(withImagenes));
});

export default router;
