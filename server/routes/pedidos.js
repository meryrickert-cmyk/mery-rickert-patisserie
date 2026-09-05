import { Router } from 'express';
import db from '../db.js';
import { authAdmin } from '../middleware/auth.js';

// Calcula el costo unitario actual de un producto según su receta
function costoUnitario(producto_id) {
  if (!producto_id) return null;
  const receta = db.prepare(
    `SELECT id, rendimiento FROM recetas WHERE producto_id = ? AND activo = 1 LIMIT 1`
  ).get(producto_id);
  if (!receta || !receta.rendimiento) return null;
  const ings = db.prepare(
    `SELECT ri.cantidad, i.unidad, i.costo
     FROM receta_ingredientes ri JOIN insumos i ON i.id = ri.insumo_id
     WHERE ri.receta_id = ?`
  ).all(receta.id);
  let total = 0;
  for (const ing of ings) {
    total += (ing.unidad === 'kg' || ing.unidad === 'L')
      ? (ing.cantidad / 1000) * ing.costo
      : ing.cantidad * ing.costo;
  }
  return receta.rendimiento > 0 ? total / receta.rendimiento : null;
}

const router = Router();

// POST público — pedido desde la web
router.post('/', (req, res) => {
  const { items, nota, nombre_cliente } = req.body;
  if (!items?.length) return res.status(400).json({ error: 'El carrito está vacío' });

  db.exec('BEGIN');
  try {
    let total = 0;
    const validados = items.map(item => {
      const p = db.prepare('SELECT * FROM productos WHERE id = ? AND activo = 1').get(item.producto_id);
      if (!p) throw new Error(`Producto no disponible`);
      total += p.precio * item.cantidad;
      return { producto: p, cantidad: item.cantidad };
    });

    const pedido = db.prepare(
      'INSERT INTO pedidos (nombre_cliente, total, nota, origen) VALUES (?, ?, ?, ?)'
    ).run(nombre_cliente || 'Web', total, nota || null, 'web');

    for (const { producto, cantidad } of validados) {
      db.prepare(
        'INSERT INTO pedido_items (pedido_id, producto_id, nombre_producto, precio_unitario, cantidad) VALUES (?, ?, ?, ?, ?)'
      ).run(pedido.lastInsertRowid, producto.id, producto.nombre, producto.precio, cantidad);
    }

    db.exec('COMMIT');
    const resultado = db.prepare('SELECT * FROM pedidos WHERE id = ?').get(pedido.lastInsertRowid);
    resultado.items = db.prepare('SELECT * FROM pedido_items WHERE pedido_id = ?').all(pedido.lastInsertRowid);
    res.status(201).json(resultado);
  } catch (err) {
    db.exec('ROLLBACK');
    res.status(400).json({ error: err.message });
  }
});

// POST admin — pedido manual (texto libre, sin lookup de productos)
router.post('/manual', authAdmin, (req, res) => {
  const { nombre_cliente, items, nota, fecha } = req.body;
  if (!nombre_cliente?.trim()) return res.status(400).json({ error: 'Nombre requerido' });
  if (!items?.length) return res.status(400).json({ error: 'Agregá al menos un ítem' });

  const total = items.reduce((s, i) => s + (parseFloat(i.precio_unitario) * parseInt(i.cantidad)), 0);

  db.exec('BEGIN');
  try {
    // Upsert cliente por nombre
    let clienteId = null;
    const nombreCliente = nombre_cliente.trim();
    const clienteExistente = db.prepare('SELECT id FROM clientes WHERE nombre = ? COLLATE NOCASE').get(nombreCliente);
    if (clienteExistente) {
      clienteId = clienteExistente.id;
    } else {
      const r = db.prepare('INSERT INTO clientes (nombre) VALUES (?)').run(nombreCliente);
      clienteId = r.lastInsertRowid;
    }

    const pedido = db.prepare(
      `INSERT INTO pedidos (nombre_cliente, total, nota, origen, creado_en, cliente_id)
       VALUES (?, ?, ?, 'manual', ?, ?)`
    ).run(
      nombreCliente,
      total,
      nota || null,
      fecha ? `${fecha} 12:00:00` : new Date().toISOString().replace('T', ' ').slice(0, 19),
      clienteId
    );

    for (const item of items) {
      db.prepare(
        'INSERT INTO pedido_items (pedido_id, nombre_producto, precio_unitario, cantidad, producto_id, costo_unitario) VALUES (?, ?, ?, ?, ?, ?)'
      ).run(pedido.lastInsertRowid, item.nombre_producto, parseFloat(item.precio_unitario), parseInt(item.cantidad), item.producto_id || null, costoUnitario(item.producto_id));
    }

    db.exec('COMMIT');
    const resultado = db.prepare('SELECT * FROM pedidos WHERE id = ?').get(pedido.lastInsertRowid);
    resultado.items = db.prepare('SELECT * FROM pedido_items WHERE pedido_id = ?').all(pedido.lastInsertRowid);
    res.status(201).json(resultado);
  } catch (err) {
    db.exec('ROLLBACK');
    res.status(400).json({ error: err.message });
  }
});

// GET admin — lista de pedidos
router.get('/', authAdmin, (req, res) => {
  const { mes } = req.query; // formato: 2026-05
  let sql = 'SELECT * FROM pedidos';
  const params = [];
  if (mes) {
    sql += ` WHERE strftime('%Y-%m', creado_en) = ?`;
    params.push(mes);
  }
  sql += ' ORDER BY creado_en DESC';
  const pedidos = db.prepare(sql).all(...params);
  for (const p of pedidos) {
    p.items = db.prepare('SELECT * FROM pedido_items WHERE pedido_id = ?').all(p.id);
  }
  res.json(pedidos);
});

// PUT admin — editar pedido manual
router.put('/:id', authAdmin, (req, res) => {
  const { nombre_cliente, items, nota, fecha } = req.body;
  if (!nombre_cliente?.trim()) return res.status(400).json({ error: 'Nombre requerido' });
  if (!items?.length) return res.status(400).json({ error: 'Agregá al menos un ítem' });

  const total = items.reduce((s, i) => s + (parseFloat(i.precio_unitario) * parseInt(i.cantidad)), 0);

  db.exec('BEGIN');
  try {
    // Upsert cliente
    const nombreCliente = nombre_cliente.trim();
    const clienteExistente = db.prepare('SELECT id FROM clientes WHERE nombre = ? COLLATE NOCASE').get(nombreCliente);
    let clienteId = clienteExistente?.id;
    if (!clienteId) {
      clienteId = db.prepare('INSERT INTO clientes (nombre) VALUES (?)').run(nombreCliente).lastInsertRowid;
    }

    db.prepare(
      `UPDATE pedidos SET nombre_cliente = ?, total = ?, nota = ?, cliente_id = ?,
       creado_en = COALESCE(?, creado_en) WHERE id = ?`
    ).run(
      nombreCliente, total, nota || null, clienteId,
      fecha ? `${fecha} 12:00:00` : null,
      req.params.id
    );

    db.prepare('DELETE FROM pedido_items WHERE pedido_id = ?').run(req.params.id);
    for (const item of items) {
      // Solo recalcular costo si el ítem tiene producto_id (fue seleccionado del catálogo)
      const costo = item.costo_unitario !== undefined
        ? item.costo_unitario  // mantener el snapshot existente si viene del frontend
        : costoUnitario(item.producto_id);
      db.prepare(
        'INSERT INTO pedido_items (pedido_id, nombre_producto, precio_unitario, cantidad, producto_id, costo_unitario) VALUES (?, ?, ?, ?, ?, ?)'
      ).run(req.params.id, item.nombre_producto, parseFloat(item.precio_unitario), parseInt(item.cantidad), item.producto_id || null, costo);
    }

    db.exec('COMMIT');
    const resultado = db.prepare('SELECT * FROM pedidos WHERE id = ?').get(req.params.id);
    resultado.items = db.prepare('SELECT * FROM pedido_items WHERE pedido_id = ?').all(req.params.id);
    res.json(resultado);
  } catch (err) {
    db.exec('ROLLBACK');
    res.status(400).json({ error: err.message });
  }
});

// DELETE admin — eliminar pedido
router.delete('/:id', authAdmin, (req, res) => {
  db.prepare('DELETE FROM pedido_items WHERE pedido_id = ?').run(req.params.id);
  db.prepare('DELETE FROM pedidos WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

export default router;
