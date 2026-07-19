import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CartProvider } from './context/CartContext';

import Navbar from './components/Navbar';
import AdminLayout from './components/AdminLayout';
import WhatsAppButton from './components/WhatsAppButton';

import Home from './pages/Home';
import AdminLogin from './pages/admin/AdminLogin';
import Dashboard from './pages/admin/Dashboard';
import Pedidos from './pages/admin/Pedidos';
import Productos from './pages/admin/Productos';
import Stock from './pages/admin/Stock';
import Clientes from './pages/admin/Clientes';
import Contenido from './pages/admin/Contenido';
import Insumos from './pages/admin/Insumos';

function PublicLayout({ children }) {
  return (
    <div style={{ background: 'var(--crema)', minHeight: '100svh' }}>
      <Navbar />
      {/* Sin padding-top: el navbar es fixed y se superpone al hero */}
      {children}
      <WhatsAppButton />
    </div>
  );
}

export default function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />

          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="contenido" element={<Contenido />} />
            <Route path="productos" element={<Productos />} />
            <Route path="pedidos" element={<Pedidos />} />
            <Route path="stock" element={<Stock />} />
            <Route path="clientes" element={<Clientes />} />
            <Route path="insumos" element={<Insumos />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </CartProvider>
  );
}
