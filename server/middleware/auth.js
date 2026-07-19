import jwt from 'jsonwebtoken';

export function authAdmin(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token requerido' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.rol !== 'admin') return res.status(403).json({ error: 'Sin acceso' });
    req.usuario = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido' });
  }
}

export function authCliente(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token requerido' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.rol !== 'cliente') return res.status(403).json({ error: 'Sin acceso' });
    req.cliente = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido' });
  }
}

export function authAny(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token requerido' });
  try {
    req.usuario = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido' });
  }
}
