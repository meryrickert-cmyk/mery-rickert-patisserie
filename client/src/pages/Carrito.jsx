import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export default function Carrito() {
  const { items, quitar, cambiarCantidad, total, vaciar } = useCart();

  if (items.length === 0) return (
    <div className="text-center py-20">
      <div className="text-6xl mb-4">🛒</div>
      <p className="text-gray-500 mb-4">Tu carrito está vacío</p>
      <Link to="/catalogo" className="bg-pink-500 text-white px-6 py-2 rounded-full hover:bg-pink-600 transition">
        Ver catálogo
      </Link>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Tu carrito</h2>
      <div className="space-y-3 mb-6">
        {items.map(item => (
          <div key={item.producto_id} className="bg-white rounded-2xl p-4 flex items-center gap-4 shadow-sm">
            <div className="w-16 h-16 bg-pink-50 rounded-xl flex items-center justify-center shrink-0">
              {item.imagen
                ? <img src={item.imagen} alt={item.nombre} className="w-full h-full object-cover rounded-xl" />
                : <span className="text-2xl">🧁</span>
              }
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-800 text-sm">{item.nombre}</p>
              <p className="text-pink-500 font-bold">${item.precio.toLocaleString('es-AR')}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => cambiarCantidad(item.producto_id, item.cantidad - 1)} className="w-8 h-8 rounded-full bg-pink-50 text-pink-500 font-bold hover:bg-pink-100">−</button>
              <span className="w-6 text-center font-semibold">{item.cantidad}</span>
              <button onClick={() => cambiarCantidad(item.producto_id, item.cantidad + 1)} className="w-8 h-8 rounded-full bg-pink-50 text-pink-500 font-bold hover:bg-pink-100">+</button>
            </div>
            <button onClick={() => quitar(item.producto_id)} className="text-gray-300 hover:text-red-400 text-xl">×</button>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <span className="text-gray-600">Total</span>
          <span className="text-2xl font-bold text-pink-500">${total.toLocaleString('es-AR')}</span>
        </div>
        <Link
          to="/checkout"
          className="block w-full bg-pink-500 hover:bg-pink-600 text-white text-center font-semibold py-3 rounded-xl transition text-lg"
        >
          Confirmar pedido
        </Link>
        <button onClick={vaciar} className="block w-full text-center text-gray-400 hover:text-gray-600 text-sm mt-3">
          Vaciar carrito
        </button>
      </div>
    </div>
  );
}
