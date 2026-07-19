import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/index.js';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function Checkout() {
  const { items, total, vaciar } = useCart();
  const { cliente, loginCliente } = useAuth();
  const navigate = useNavigate();

  const [nombre, setNombre] = useState(cliente?.nombre || '');
  const [telefono, setTelefono] = useState('');
  const [nota, setNota] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (!cliente) await loginCliente(nombre, telefono);
      const payload = {
        items: items.map(i => ({ producto_id: i.producto_id, cantidad: i.cantidad })),
        nota,
      };
      const { data } = await api.post('/pedidos', payload);
      vaciar();
      navigate(`/confirmacion/${data.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al procesar el pedido');
    } finally {
      setLoading(false);
    }
  }

  if (items.length === 0) { navigate('/carrito'); return null; }

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Confirmar pedido</h2>

      {/* Resumen */}
      <div className="bg-white rounded-2xl p-4 shadow-sm mb-6">
        <h3 className="font-semibold text-gray-700 mb-3">Resumen</h3>
        {items.map(i => (
          <div key={i.producto_id} className="flex justify-between text-sm text-gray-600 py-1">
            <span>{i.nombre} x{i.cantidad}</span>
            <span>${(i.precio * i.cantidad).toLocaleString('es-AR')}</span>
          </div>
        ))}
        <div className="border-t mt-3 pt-3 flex justify-between font-bold">
          <span>Total</span>
          <span className="text-pink-500">${total.toLocaleString('es-AR')}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
        {!cliente && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
              <input
                type="text" value={nombre} onChange={e => setNombre(e.target.value)} required
                className="w-full border border-gray-200 rounded-xl px-4 py-2 focus:outline-none focus:border-pink-400"
                placeholder="Tu nombre"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
              <input
                type="tel" value={telefono} onChange={e => setTelefono(e.target.value)} required
                className="w-full border border-gray-200 rounded-xl px-4 py-2 focus:outline-none focus:border-pink-400"
                placeholder="Ej: 1123456789"
              />
            </div>
          </>
        )}
        {cliente && <p className="text-sm text-gray-500">Pedido como: <strong>{cliente.nombre}</strong></p>}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nota (opcional)</label>
          <textarea
            value={nota} onChange={e => setNota(e.target.value)} rows={3}
            className="w-full border border-gray-200 rounded-xl px-4 py-2 focus:outline-none focus:border-pink-400 resize-none"
            placeholder="Aclaraciones, personalización, fecha de entrega..."
          />
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit" disabled={loading}
          className="w-full bg-pink-500 hover:bg-pink-600 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition text-lg"
        >
          {loading ? 'Enviando...' : 'Enviar pedido'}
        </button>
      </form>
    </div>
  );
}
