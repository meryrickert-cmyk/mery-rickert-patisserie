import 'dotenv/config';
import express from 'express';
import cors from 'cors';
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
    const enVolumen = fs.readdirSync(UPLOADS_DIR).length;
    const enLocal = fs.readdirSync(localUploads);
    if (enVolumen === 0 && enLocal.length > 0) {
      console.log(`📦 Migrando ${enLocal.length} fotos al volumen...`);
      for (const f of enLocal) {
        fs.copyFileSync(path.join(localUploads, f), path.join(UPLOADS_DIR, f));
      }
      console.log('✅ Fotos migradas al volumen');
    }
  }
}

app.use(cors({
  origin: isProd
    ? (process.env.CORS_ORIGIN || true)     // en prod: mismo origen o dominio Railway
    : ['http://localhost:3003', 'http://localhost:5173'],
}));
app.use(express.json());
app.use('/uploads', express.static(UPLOADS_DIR));

app.use('/api/auth', authRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/config', configRoutes);
app.use('/api/hero', heroRoutes);
app.use('/api/insumos', insumosRoutes);

app.get('/api/health', (req, res) => res.json({ ok: true }));

// Servir frontend buildeado (solo en producción / cuando existe dist/)
const DIST = path.join(__dirname, '../client/dist');
if (fs.existsSync(DIST)) {
  app.use(express.static(DIST));
  // SPA fallback — rutas de React (debe ir DESPUÉS de las rutas /api)
  app.get('*', (req, res) => res.sendFile(path.join(DIST, 'index.html')));
}

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Servidor en http://localhost:${PORT} [${isProd ? 'prod' : 'dev'}]`));
