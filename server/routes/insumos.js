import { Router } from 'express';
import db from '../db.js';
import { authAdmin } from '../middleware/auth.js';

const router = Router();

/* ── INSUMOS ──────────────────────────────────────────────── */

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM insumos WHERE activo = 1 ORDER BY nombre').all();
  res.json(rows);
});

router.post('/', authAdmin, (req, res) => {
  const { nombre, unidad, costo } = req.body;
  const r = db.prepare('INSERT INTO insumos (nombre, unidad, costo) VALUES (?, ?, ?)').run(nombre, unidad, costo);
  const now = new Date();
  db.prepare('INSERT OR REPLACE INTO insumo_costos_hist (insumo_id, año, mes, costo) VALUES (?, ?, ?, ?)')
    .run(r.lastInsertRowid, now.getFullYear(), now.getMonth() + 1, costo);
  res.json({ id: r.lastInsertRowid });
});

router.put('/:id', authAdmin, (req, res) => {
  const { nombre, unidad, costo } = req.body;
  db.prepare('UPDATE insumos SET nombre = ?, unidad = ?, costo = ?, actualizado_en = datetime("now") WHERE id = ?')
    .run(nombre, unidad, costo, req.params.id);
  const now = new Date();
  db.prepare('INSERT OR REPLACE INTO insumo_costos_hist (insumo_id, año, mes, costo) VALUES (?, ?, ?, ?)')
    .run(req.params.id, now.getFullYear(), now.getMonth() + 1, costo);
  res.json({ ok: true });
});

router.delete('/:id', authAdmin, (req, res) => {
  db.prepare('UPDATE insumos SET activo = 0 WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// Snapshot manual del mes actual
router.post('/snapshot', authAdmin, (req, res) => {
  const insumos = db.prepare('SELECT * FROM insumos WHERE activo = 1').all();
  const now = new Date();
  const año = now.getFullYear();
  const mes = now.getMonth() + 1;
  db.exec('BEGIN');
  try {
    for (const ins of insumos) {
      db.prepare('INSERT OR REPLACE INTO insumo_costos_hist (insumo_id, año, mes, costo) VALUES (?, ?, ?, ?)')
        .run(ins.id, año, mes, ins.costo);
    }
    db.exec('COMMIT');
    res.json({ ok: true, count: insumos.length, año, mes });
  } catch (e) {
    db.exec('ROLLBACK');
    res.status(500).json({ error: e.message });
  }
});

/* ── RECETAS ──────────────────────────────────────────────── */

router.get('/recetas', authAdmin, (req, res) => {
  const recetas = db.prepare('SELECT r.*, p.precio as precio_venta, p.nombre as producto_nombre FROM recetas r LEFT JOIN productos p ON p.id = r.producto_id WHERE r.activo = 1 ORDER BY r.nombre').all();
  const result = recetas.map(r => {
    const ingredientes = db.prepare(`
      SELECT ri.id, ri.cantidad, i.id as insumo_id, i.nombre as insumo_nombre, i.unidad, i.costo
      FROM receta_ingredientes ri
      JOIN insumos i ON i.id = ri.insumo_id
      WHERE ri.receta_id = ?
    `).all(r.id);
    return { ...r, ingredientes };
  });
  res.json(result);
});

router.post('/recetas', authAdmin, (req, res) => {
  const { nombre, categoria, producto_id, rendimiento, ingredientes } = req.body;
  db.exec('BEGIN');
  try {
    const r = db.prepare('INSERT INTO recetas (nombre, categoria, producto_id, rendimiento) VALUES (?, ?, ?, ?)')
      .run(nombre, categoria || '', producto_id || null, rendimiento || 1);
    const receta_id = r.lastInsertRowid;
    if (ingredientes?.length) {
      const ins = db.prepare('INSERT INTO receta_ingredientes (receta_id, insumo_id, cantidad) VALUES (?, ?, ?)');
      for (const ing of ingredientes) ins.run(receta_id, ing.insumo_id, ing.cantidad);
    }
    db.exec('COMMIT');
    res.json({ id: receta_id });
  } catch (e) {
    db.exec('ROLLBACK');
    res.status(500).json({ error: e.message });
  }
});

router.put('/recetas/:id', authAdmin, (req, res) => {
  const { nombre, categoria, producto_id, rendimiento, ingredientes } = req.body;
  db.exec('BEGIN');
  try {
    db.prepare('UPDATE recetas SET nombre = ?, categoria = ?, producto_id = ?, rendimiento = ? WHERE id = ?')
      .run(nombre, categoria || '', producto_id || null, rendimiento || 1, req.params.id);
    db.prepare('DELETE FROM receta_ingredientes WHERE receta_id = ?').run(req.params.id);
    if (ingredientes?.length) {
      const ins = db.prepare('INSERT INTO receta_ingredientes (receta_id, insumo_id, cantidad) VALUES (?, ?, ?)');
      for (const ing of ingredientes) ins.run(req.params.id, ing.insumo_id, ing.cantidad);
    }
    db.exec('COMMIT');
    res.json({ ok: true });
  } catch (e) {
    db.exec('ROLLBACK');
    res.status(500).json({ error: e.message });
  }
});

router.delete('/recetas/:id', authAdmin, (req, res) => {
  db.prepare('UPDATE recetas SET activo = 0 WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// Editar cantidad de un ingrediente específico (inline editing)
router.patch('/receta-ingredientes/:id', authAdmin, (req, res) => {
  const { cantidad } = req.body;
  db.prepare('UPDATE receta_ingredientes SET cantidad = ? WHERE id = ?').run(parseFloat(cantidad), req.params.id);
  res.json({ ok: true });
});

/* ── ANÁLISIS ─────────────────────────────────────────────── */

function calcularCostos(receta_id, año, mes) {
  const q = (año && mes)
    ? db.prepare(`
        SELECT ri.cantidad, i.unidad,
          COALESCE(h.costo, i.costo) as costo
        FROM receta_ingredientes ri
        JOIN insumos i ON i.id = ri.insumo_id
        LEFT JOIN insumo_costos_hist h ON h.insumo_id = i.id AND h.año = ? AND h.mes = ?
        WHERE ri.receta_id = ?
      `).all(año, mes, receta_id)
    : db.prepare(`
        SELECT ri.cantidad, i.unidad, i.costo
        FROM receta_ingredientes ri
        JOIN insumos i ON i.id = ri.insumo_id
        WHERE ri.receta_id = ?
      `).all(receta_id);

  let total = 0;
  for (const ing of q) {
    if (ing.unidad === 'kg' || ing.unidad === 'L') {
      total += (ing.cantidad / 1000) * ing.costo;
    } else {
      total += ing.cantidad * ing.costo;
    }
  }
  return total;
}

router.get('/analisis', authAdmin, (req, res) => {
  const { año, mes } = req.query;
  const recetas = db.prepare(`
    SELECT r.*, p.precio as precio_venta, p.nombre as producto_nombre
    FROM recetas r
    LEFT JOIN productos p ON p.id = r.producto_id
    WHERE r.activo = 1
    ORDER BY r.categoria, r.nombre
  `).all();

  // Ventas del mes por producto (desde pedidos)
  const ventasMap = {};
  if (año && mes) {
    const mesPad = mes.toString().padStart(2, '0');
    const ventas = db.prepare(`
      SELECT pi.producto_id, SUM(pi.cantidad) as unidades, SUM(pi.cantidad * pi.precio_unitario) as ingresos
      FROM pedido_items pi
      JOIN pedidos ped ON ped.id = pi.pedido_id
      WHERE strftime('%Y', ped.creado_en) = ? AND strftime('%m', ped.creado_en) = ?
      GROUP BY pi.producto_id
    `).all(año.toString(), mesPad);
    for (const v of ventas) ventasMap[v.producto_id] = v;
  }

  const result = recetas.map(r => {
    const costo_total = calcularCostos(r.id, año, mes);
    const costo_por_unidad = r.rendimiento > 0 ? costo_total / r.rendimiento : 0;
    const precio_venta = r.precio_venta || null;
    const margen = precio_venta ? precio_venta - costo_por_unidad : null;
    const margen_pct = (precio_venta && costo_por_unidad > 0) ? ((precio_venta - costo_por_unidad) / precio_venta) * 100 : null;

    // Ventas reales del mes
    const ventas = r.producto_id ? ventasMap[r.producto_id] : null;
    const unidades_vendidas = ventas?.unidades || 0;
    const ingresos_mes = ventas?.ingresos || 0;
    const ganancia_mes = (margen && unidades_vendidas) ? margen * unidades_vendidas : 0;

    return { ...r, costo_total, costo_por_unidad, margen, margen_pct, unidades_vendidas, ingresos_mes, ganancia_mes };
  });

  res.json(result);
});

// Sincronizar precio de un insumo desde su receta vinculada
router.post('/sync-insumo/:nombre', authAdmin, (req, res) => {
  const insumo = db.prepare('SELECT * FROM insumos WHERE nombre = ?').get(req.params.nombre);
  if (!insumo) return res.status(404).json({ error: 'Insumo no encontrado' });

  const receta = db.prepare("SELECT id, rendimiento FROM recetas WHERE nombre LIKE ? AND activo = 1").get(`%${req.params.nombre.replace(' (1 receta)', '')}%`);
  if (!receta) return res.status(404).json({ error: 'Receta no encontrada para sincronizar' });

  const costo = calcularCostos(receta.id, null, null);
  const costoPorU = receta.rendimiento > 0 ? costo / receta.rendimiento : costo;

  db.prepare('UPDATE insumos SET costo = ?, actualizado_en = datetime("now") WHERE id = ?').run(costoPorU, insumo.id);
  const now = new Date();
  db.prepare('INSERT OR REPLACE INTO insumo_costos_hist (insumo_id, año, mes, costo) VALUES (?, ?, ?, ?)')
    .run(insumo.id, now.getFullYear(), now.getMonth() + 1, costoPorU);

  res.json({ ok: true, nuevo_costo: costoPorU });
});

// Meses disponibles en histórico
router.get('/snapshot/meses', authAdmin, (req, res) => {
  const meses = db.prepare('SELECT DISTINCT año, mes FROM insumo_costos_hist ORDER BY año DESC, mes DESC').all();
  res.json(meses);
});

export default router;
