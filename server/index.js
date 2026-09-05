import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import compression from 'compression';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import authRoutes from './routes/auth.js';
import productosRoutes from './routes/productos.js';
import pedidosRoutes from './routes/pedidos.js';
import clientesRoutes from './routes/clientes.js';
import dashboardRoutes from './routes/dashboard.js';
import configRoutes from './routes/config.js';
import heroRoutes from './routes/hero.js';
import insumosRoutes from './routes/insumos.js';
import analyticsRoutes from './routes/analytics.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const isProd = process.env.NODE_ENV === 'production';

// Directorio persistente (volumen Railway en prod, carpeta local en dev)
const DATA_DIR = process.env.DATA_DIR || __dirname;
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// Migración única: copia fotos del repo al volumen si el volumen está vacío
if (process.env.DATA_DIR) {
  const localUploads = path.join(__dirname, 'uploads');
  if (fs.existsSync(localUploads)) {
    const enLocal = fs.readdirSync(localUploads);
    if (enLocal.length > 0) {
      // Sync: copies new files and overwrites if local version is smaller (recompressed)
      let copiadas = 0;
      for (const f of enLocal) {
        const src = path.join(localUploads, f);
        const dst = path.join(UPLOADS_DIR, f);
        const srcSize = fs.statSync(src).size;
        const dstSize = fs.existsSync(dst) ? fs.statSync(dst).size : Infinity;
        if (!fs.existsSync(dst) || srcSize < dstSize) {
          fs.copyFileSync(src, dst);
          copiadas++;
        }
      }
      if (copiadas > 0) console.log(`📦 ${copiadas} fotos sincronizadas al volumen`);
    }
  }
}

app.use(compression());
app.use(cors({
  origin: isProd
    ? (process.env.CORS_ORIGIN || true)     // en prod: mismo origen o dominio Railway
    : ['http://localhost:3003', 'http://localhost:5173'],
}));
app.use(express.json());
app.use('/uploads', express.static(UPLOADS_DIR, {
  maxAge: '30d',
  immutable: true,
}));

app.use('/api/auth', authRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/config', configRoutes);
app.use('/api/hero', heroRoutes);
app.use('/api/insumos', insumosRoutes);
app.use('/api/analytics', analyticsRoutes);

app.get('/api/health', (req, res) => res.json({ ok: true }));


// Servir frontend buildeado (solo en producción / cuando existe dist/)
const DIST = path.join(__dirname, '../client/dist');
if (fs.existsSync(DIST)) {
  // Assets con hash en el nombre → cacheo agresivo
  app.use('/assets', express.static(path.join(DIST, 'assets'), {
    maxAge: '1y',
    immutable: true,
  }));
  // HTML — nunca cachear para que el SW y el router funcionen
  app.use(express.static(DIST, { maxAge: 0 }));
  // SPA fallback — rutas de React (debe ir DESPUÉS de las rutas /api)
  app.get('*', (req, res) => res.sendFile(path.join(DIST, 'index.html')));
}

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Servidor en http://localhost:${PORT} [${isProd ? 'prod' : 'dev'}]`));
