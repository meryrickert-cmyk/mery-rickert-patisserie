import { Router } from 'express';
import jwt from 'jsonwebtoken';

const router = Router();

const ADMIN_EMAILS = ['meryrickert@gmail.com', 'mbmendizabal@gmail.com'];
const ADMIN_PASS = 'pasteleria';

// Admin login — email + contraseña
router.post('/admin/login', (req, res) => {
  const { email, password, usuario } = req.body;

  // Soporte para login con email (nuevo) o usuario legacy
  const esEmail = email && ADMIN_EMAILS.includes(email.toLowerCase()) && password === ADMIN_PASS;
  const esLegacy = usuario === process.env.ADMIN_USER && password === process.env.ADMIN_PASS;

  if (!esEmail && !esLegacy) {
    return res.status(401).json({ error: 'Credenciales incorrectas' });
  }

  const token = jwt.sign({ rol: 'admin', email: email || usuario }, process.env.JWT_SECRET, { expiresIn: '8h' });
  res.json({ token });
});

export default router;
