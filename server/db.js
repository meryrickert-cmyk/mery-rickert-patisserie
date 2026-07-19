import { DatabaseSync } from 'node:sqlite';
import { seedRecetas } from './seeds/recetas.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// En producción (Railway) se usa DATA_DIR apuntando al volumen persistente
const DATA_DIR = process.env.DATA_DIR || __dirname;
const db = new DatabaseSync(path.join(DATA_DIR, 'mery.db'));

db.exec(`PRAGMA journal_mode = WAL`);
db.exec(`PRAGMA foreign_keys = ON`);

// Tablas principales
db.exec(`
  CREATE TABLE IF NOT EXISTS productos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    descripcion TEXT DEFAULT '',
    precio REAL NOT NULL,
    stock INTEGER NOT NULL DEFAULT 99,
    categoria TEXT NOT NULL DEFAULT 'tortas',
    imagen TEXT,
    orden INTEGER DEFAULT 0,
    activo INTEGER NOT NULL DEFAULT 1,
    creado_en TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS producto_imagenes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    producto_id INTEGER NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    orden INTEGER DEFAULT 0
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS pedidos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre_cliente TEXT,
    estado TEXT NOT NULL DEFAULT 'pendiente',
    total REAL NOT NULL,
    nota TEXT,
    creado_en TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS pedido_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pedido_id INTEGER NOT NULL REFERENCES pedidos(id),
    producto_id INTEGER REFERENCES productos(id),
    nombre_producto TEXT NOT NULL,
    precio_unitario REAL NOT NULL,
    cantidad INTEGER NOT NULL
  )
`);

// Imágenes del hero
db.exec(`
  CREATE TABLE IF NOT EXISTS hero_imagenes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT NOT NULL,
    orden INTEGER DEFAULT 0
  )
`);

// Tabla de configuración de la página
db.exec(`
  CREATE TABLE IF NOT EXISTS config (
    clave TEXT PRIMARY KEY,
    valor TEXT NOT NULL DEFAULT ''
  )
`);

// Seed de configuración inicial
const configDefaults = [
  ['hero_tagline', 'hecho con tiempo'],
  ['hero_subtitulo', 'Pastelería artesanal'],
  ['about_titulo', 'Quiénes somos'],
  ['about_texto', 'Mery Rickert Patisserie nació de la pasión por la pastelería artesanal y el deseo de crear momentos dulces especiales. Cada preparación lleva tiempo, dedicación y los mejores ingredientes. Trabajamos con amor y sin apuros, porque las cosas ricas no se hacen rápido.'],
  ['eventos_titulo', 'Cotizaciones para eventos'],
  ['eventos_texto', 'Si necesitás ayuda con el armado para un evento, contanos qué tenés en mente y te ayudamos a planificarlo.'],
  ['instagram_handle', '@meryrickertpatisserie'],
  ['whatsapp_numero', '5491164936089'],
  ['footer_direccion', 'Buenos Aires, Argentina'],
  ['seccion_orden', '["hero","productos","eventos","about","instagram"]'],
];
for (const [clave, valor] of configDefaults) {
  const existe = db.prepare('SELECT 1 FROM config WHERE clave = ?').get(clave);
  if (!existe) db.prepare('INSERT INTO config (clave, valor) VALUES (?, ?)').run(clave, valor);
}

// Seed de productos si la tabla está vacía
const count = db.prepare('SELECT COUNT(*) as n FROM productos').get();
if (count.n === 0) {
  const ins = (nombre, descripcion, precio, categoria, orden = 0) =>
    db.prepare('INSERT INTO productos (nombre, descripcion, precio, categoria, orden) VALUES (?, ?, ?, ?, ?)').run(nombre, descripcion, precio, categoria, orden);

  // TORTAS (incluye Number Cake)
  ins('Tarta de Frutillas', '10-12 porciones', 57000, 'tortas', 1);
  ins('Pavlova de Frutillas', '10-12 porciones', 57000, 'tortas', 2);
  ins('Torta de Nuez', '8-10 porciones', 59000, 'tortas', 3);
  ins('Mousse de Chocolate', '10-12 porciones', 61000, 'tortas', 4);
  ins('Pavlova Frutos Rojos', '10-12 porciones', 59000, 'tortas', 5);
  ins('Pavlova Mango y Maracuyá', '10-12 porciones', 59000, 'tortas', 6);
  ins('Crumble de Manzana', '8-10 porciones', 55000, 'tortas', 7);
  ins('Chocotorta', '10-12 porciones', 62000, 'tortas', 8);
  ins('Cheese Cake DDL', '10-12 porciones', 61000, 'tortas', 9);
  ins('Choco Oreo', '10-12 porciones', 61000, 'tortas', 10);
  ins('Carrot Cake', '10-12 porciones', 61000, 'tortas', 11);
  ins('Sablee de Almendras', '10-12 porciones', 64000, 'tortas', 12);
  ins('Key Lime Pie', '8-10 porciones', 55000, 'tortas', 13);
  ins('Marquise con Frutillas o Frutos Rojos', '10-12 porciones', 61000, 'tortas', 14);
  ins('Number Cake — Brownie + DDL + Merengue', 'Con deco de chocolates. Cada número/letra rinde 10-12 porciones', 63000, 'tortas', 15);
  ins('Number Cake — Chocotorta + Deco', 'Cada número/letra rinde aprox 12 porciones', 65000, 'tortas', 16);

  // PARA EL TÉ
  ins('Alfajores de Nuez (20u)', '', 38000, 'para el te', 1);
  ins('Alfajores de Almendra (20u)', '', 38000, 'para el te', 2);
  ins('Alfajores de Maizena (20u)', '', 34000, 'para el te', 3);
  ins('Alfajores de Manteca (20u)', '', 34000, 'para el te', 4);
  ins('Alfajores de Chocolate (20u)', '', 34000, 'para el te', 5);
  ins('Alfajores — Caja 8u', '', 15000, 'para el te', 6);
  ins('Trufas Amarula — Caja 6u', '', 12000, 'para el te', 7);
  ins('Brownies (20u)', '', 38000, 'para el te', 8);
  ins('Masitas de Coco (20u)', '', 38000, 'para el te', 9);
  ins('Pavlovitas con Frutillas (12u)', '', 41000, 'para el te', 10);
  ins('Pavlovitas con Frutos del Bosque (12u)', '', 41000, 'para el te', 11);
  ins('Mix Húmedos (25 bocaditos)', 'Rogelitos, Micro bombitas, Micro lemons, Micro crumble de manzana, Micro de frutilla', 38000, 'para el te', 12);
  ins('Mix Secos (30 bocaditos)', 'Brownies, Masitas de Coco, Alfajores de Chocolate, Nuez y Manteca', 38000, 'para el te', 13);

  // BUDINES
  ins('Budín de Zanahoria', '', 20000, 'budines', 1);
  ins('Budín de Limón', '', 20000, 'budines', 2);
  ins('Budín de Banana', '', 20000, 'budines', 3);
  ins('Budín de Chocolate', '', 20000, 'budines', 4);

  // SHOTS
  ins('Shot: Brownie + DDL + Merengue Italiano', 'Mínimo 10 unidades por sabor', 5000, 'shots', 1);
  ins('Shot: Mousse de Maracuyá', 'Mínimo 10 unidades por sabor', 5000, 'shots', 2);
  ins('Shot: Brownie + DDL + Mousse de Chocolate', 'Mínimo 10 unidades por sabor', 5000, 'shots', 3);
  ins('Shot: Mousse de Limón', 'Mínimo 10 unidades por sabor', 5000, 'shots', 4);
  ins('Shot: Crocante de Nuez + DDL + Crema', 'Mínimo 10 unidades por sabor', 5000, 'shots', 5);
  ins('Shot: Chocotorta', 'Mínimo 10 unidades por sabor', 5000, 'shots', 6);
  ins('Shot: Crumble de Manzana', 'Mínimo 10 unidades por sabor', 5000, 'shots', 7);
  ins('Shot: Lemon Pie', 'Mínimo 10 unidades por sabor', 5000, 'shots', 8);
  ins('Shot: Sablee + DDL + Crema + Frutillas', 'Mínimo 10 unidades por sabor', 5000, 'shots', 9);
  ins('Shot: Oreo', 'Mínimo 10 unidades por sabor', 5000, 'shots', 10);
  ins('Shot: Sablee de Almendras + DDL + Crema + Frutos Rojos', 'Mínimo 10 unidades por sabor', 5000, 'shots', 11);
}

// Migración: subcategoria para productos de "para el te"
try { db.exec(`ALTER TABLE productos ADD COLUMN subcategoria TEXT DEFAULT ''`); } catch {}
db.exec(`UPDATE productos SET subcategoria = 'mix' WHERE categoria = 'para el te' AND subcategoria = '' AND nombre LIKE 'Mix%'`);
db.exec(`UPDATE productos SET subcategoria = 'alfajor' WHERE categoria = 'para el te' AND subcategoria = '' AND nombre LIKE 'Alfajor%' AND nombre NOT LIKE '%Caja%'`);
db.exec(`UPDATE productos SET subcategoria = 'alfajor_caja' WHERE categoria = 'para el te' AND subcategoria = '' AND nombre LIKE '%Caja%' AND nombre LIKE 'Alfajor%'`);
db.exec(`UPDATE productos SET subcategoria = 'trufa' WHERE categoria = 'para el te' AND subcategoria = '' AND nombre LIKE 'Trufa%'`);
db.exec(`UPDATE productos SET subcategoria = 'individual' WHERE categoria = 'para el te' AND subcategoria = '' AND (nombre LIKE 'Brownie%' OR nombre LIKE 'Masitas%' OR nombre LIKE 'Pavlovita%')`);

// Tablas de insumos y recetas
db.exec(`
  CREATE TABLE IF NOT EXISTS insumos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    unidad TEXT DEFAULT 'kg',
    costo REAL DEFAULT 0,
    activo INTEGER DEFAULT 1,
    actualizado_en TEXT DEFAULT (datetime('now'))
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS insumo_costos_hist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    insumo_id INTEGER NOT NULL REFERENCES insumos(id),
    año INTEGER NOT NULL,
    mes INTEGER NOT NULL,
    costo REAL NOT NULL,
    UNIQUE(insumo_id, año, mes)
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS recetas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    categoria TEXT DEFAULT '',
    producto_id INTEGER REFERENCES productos(id),
    rendimiento INTEGER DEFAULT 1,
    activo INTEGER DEFAULT 1
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS receta_ingredientes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    receta_id INTEGER NOT NULL REFERENCES recetas(id) ON DELETE CASCADE,
    insumo_id INTEGER NOT NULL REFERENCES insumos(id),
    cantidad REAL DEFAULT 0
  )
`);

// Seed de insumos desde datos del Excel de costos
const insumosCount = db.prepare('SELECT COUNT(*) as n FROM insumos').get();
if (insumosCount.n === 0) {
  const ins = db.prepare('INSERT INTO insumos (nombre, unidad, costo) VALUES (?, ?, ?)');
  [
    ['Chocolate Fenix', 'kg', 50000],
    ['DDL Repostero', 'kg', 9000],
    ['Crema milkaut', 'kg', 12878],
    ['Manteca', 'kg', 18000],
    ['Harina 0000', 'kg', 1300],
    ['Huevos', 'u', 250],
    ['Azúcar', 'kg', 1300],
    ['Queso crematto / casancrem', 'kg', 13500],
    ['Harina leudante Blancaflor', 'kg', 1300],
    ['Gelatina sin sabor', 'kg', 25000],
    ['Leche', 'L', 2000],
    ['Polvo de almendras', 'kg', 3600],
    ['Azúcar impalpable', 'kg', 5000],
    ['Frutos Rojos', 'kg', 22500],
    ['Pulpa de Maracuyá', 'kg', 20000],
    ['Frutillas', 'kg', 10000],
    ['Coco Rallado', 'kg', 8800],
    ['Almendras', 'kg', 30000],
    ['Nueces', 'kg', 30000],
    ['Maicena', 'kg', 4000],
    ['Aceite', 'L', 4000],
    ['Zanahorias', 'kg', 2500],
    ['Leche condensada', 'kg', 13924],
    ['Mango cubeteado congelado', 'kg', 20000],
    ['Cacao amargo', 'kg', 40000],
    ['Paquete Oreo', 'u', 2200],
    ['Paquete Chocolinas', 'kg', 8800],
    ['Harina de Mandioca', 'kg', 976],
    ['Limas', 'u', 500],
    ['Azúcar invertido', 'kg', 37],
  ].forEach(([n, u, c]) => ins.run(n, u, c));
}

// Seed de recetas (solo corre una vez, ver seeds/recetas.js)
seedRecetas(db);

export default db;
