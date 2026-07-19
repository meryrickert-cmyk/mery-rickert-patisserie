/**
 * Script de migración — corre ANTES de index.js en Railway
 * Copia la DB local y las fotos al volumen persistente si todavía no tienen datos.
 */
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DatabaseSync } from 'node:sqlite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.DATA_DIR;

if (!DATA_DIR) {
  console.log('[migrate] No DATA_DIR, saltando migración');
  process.exit(0);
}

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// ── DB ────────────────────────────────────────────────────────────────────────
const localDbPath = path.join(__dirname, 'mery.db');
const prodDbPath  = path.join(DATA_DIR, 'mery.db');

if (fs.existsSync(localDbPath)) {
  // Verificar si la DB de producción tiene imágenes de productos
  let tieneImagenes = false;
  if (fs.existsSync(prodDbPath)) {
    try {
      const prodDb = new DatabaseSync(prodDbPath);
      tieneImagenes = prodDb.prepare('SELECT COUNT(*) as n FROM producto_imagenes').get().n > 0;
    } catch {}
  }

  if (!tieneImagenes) {
    console.log('[migrate] Copiando DB local al volumen...');
    if (fs.existsSync(prodDbPath)) fs.unlinkSync(prodDbPath);
    fs.copyFileSync(localDbPath, prodDbPath);
    // Copiar también WAL si existe
    const walPath = localDbPath + '-wal';
    if (fs.existsSync(walPath)) fs.copyFileSync(walPath, prodDbPath + '-wal');
    console.log('[migrate] ✅ DB copiada al volumen');
  } else {
    console.log('[migrate] DB ya tiene datos, no se sobreescribe');
  }
}

// ── Uploads ───────────────────────────────────────────────────────────────────
const localUploads = path.join(__dirname, 'uploads');
const prodUploads  = path.join(DATA_DIR, 'uploads');
if (!fs.existsSync(prodUploads)) fs.mkdirSync(prodUploads, { recursive: true });

if (fs.existsSync(localUploads)) {
  const archivos = fs.readdirSync(localUploads);
  let copiados = 0;
  for (const f of archivos) {
    const dest = path.join(prodUploads, f);
    if (!fs.existsSync(dest)) {
      fs.copyFileSync(path.join(localUploads, f), dest);
      copiados++;
    }
  }
  if (copiados > 0) console.log(`[migrate] ✅ ${copiados} fotos copiadas al volumen`);
  else console.log('[migrate] Fotos ya en el volumen, no se copian');
}

console.log('[migrate] Migración completa');
