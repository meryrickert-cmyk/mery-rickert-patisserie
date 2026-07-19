import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/index.js';
import { useCart } from '../context/CartContext';

export default function Catalogo() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [catActiva, setCatActiva] = useState('');
  const [loading, setLoading] = useState(true);
  const { agregar } = useCart();

  useEffect(() => {
    Promise.all([
      api.get('/productos' + (catActiva ? `?categoria=${catActiva}` : '')),
      api.get('/productos/categorias'),
    ]).then(([p, c]) => {
      setProductos(p.data);
      setCategorias(c.data);
    }).finally(() => setLoading(false));
  }, [catActiva]);

  if (loading) return <div className="text-center py-20 text-gray-400">Cargando...</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Nuestros productos</h2>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap mb-8">
        <button
          onClick={() => setCatActiva('')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition ${!catActiva ? 'bg-pink-500 text-white' : 'bg-white text-gray-600 hover:bg-pink-50'}`}
        >
          Todos
        </button>
        {categorias.map(c => (
          <button
            key={c}
            onClick={() => setCatActiva(c)}
            className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition ${catActiva === c ? 'bg-pink-500 text-white' : 'bg-white text-gray-600 hover:bg-pink-50'}`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {productos.map(p => (
          <div key={p.id} className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition">
            <Link to={`/producto/${p.id}`}>
              <div className="aspect-square bg-pink-50 flex items-center justify-center">
                {p.imagen
                  ? <img src={p.imagen} alt={p.nombre} className="w-full h-full object-cover" />
                  : <span className="text-5xl">🧁</span>
                }
              </div>
            </Link>
            <div className="p-3">
              <Link to={`/producto/${p.id}`}>
                <h3 className="font-semibold text-gray-800 text-sm mb-1 line-clamp-2">{p.nombre}</h3>
              </Link>
              <p className="text-pink-500 font-bold">${p.precio.toLocaleString('es-AR')}</p>
              <p className="text-xs text-gray-400 mb-2">Stock: {p.stock}</p>
              <button
                onClick={() => agregar(p)}
                disabled={p.stock === 0}
                className="w-full bg-pink-500 hover:bg-pink-600 disabled:bg-gray-200 disabled:text-gray-400 text-white text-sm py-2 rounded-xl transition font-medium"
              >
                {p.stock === 0 ? 'Sin stock' : 'Agregar'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {productos.length === 0 && (
        <p className="text-center text-gray-400 py-20">No hay productos disponibles</p>
      )}
    </div>
  );
}
