import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/index.js';
import { useCart } from '../context/CartContext';

export default function Producto() {
  const { id } = useParams();
  const [producto, setProducto] = useState(null);
  const [cantidad, setCantidad] = useState(1);
  const [agregado, setAgregado] = useState(false);
  const { agregar } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    api.get(`/productos/${id}`).then(r => setProducto(r.data)).catch(() => navigate('/catalogo'));
  }, [id]);

  if (!producto) return <div className="text-center py-20 text-gray-400">Cargando...</div>;

  function handleAgregar() {
    agregar(producto, cantidad);
    setAgregado(true);
    setTimeout(() => setAgregado(false), 2000);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <button onClick={() => navigate(-1)} className="text-pink-500 mb-6 hover:underline">← Volver</button>
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden md:flex">
        <div className="md:w-1/2 aspect-square bg-pink-50 flex items-center justify-center">
          {producto.imagen
            ? <img src={producto.imagen} alt={producto.nombre} className="w-full h-full object-cover" />
            : <span className="text-8xl">🧁</span>
          }
        </div>
        <div className="md:w-1/2 p-8 flex flex-col justify-between">
          <div>
            <span className="text-xs text-pink-400 uppercase font-semibold tracking-wide">{producto.categoria}</span>
            <h1 className="text-2xl font-bold text-gray-800 mt-1 mb-3">{producto.nombre}</h1>
            <p className="text-gray-500 mb-4">{producto.descripcion}</p>
            <p className="text-3xl font-bold text-pink-500 mb-1">${producto.precio.toLocaleString('es-AR')}</p>
            <p className="text-sm text-gray-400">Stock disponible: {producto.stock}</p>
          </div>
          <div className="mt-6">
            <div className="flex items-center gap-3 mb-4">
              <button onClick={() => setCantidad(q => Math.max(1, q - 1))} className="w-10 h-10 rounded-full bg-pink-50 text-pink-500 font-bold text-lg hover:bg-pink-100">−</button>
              <span className="text-xl font-semibold w-8 text-center">{cantidad}</span>
              <button onClick={() => setCantidad(q => Math.min(producto.stock, q + 1))} className="w-10 h-10 rounded-full bg-pink-50 text-pink-500 font-bold text-lg hover:bg-pink-100">+</button>
            </div>
            <button
              onClick={handleAgregar}
              disabled={producto.stock === 0}
              className="w-full bg-pink-500 hover:bg-pink-600 disabled:bg-gray-200 text-white font-semibold py-3 rounded-xl transition text-lg"
            >
              {agregado ? '✓ Agregado!' : producto.stock === 0 ? 'Sin stock' : 'Agregar al carrito'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
