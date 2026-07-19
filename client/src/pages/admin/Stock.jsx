import { useEffect, useState } from 'react';
import api from '../../api/index.js';

export default function Stock() {
  const [productos, setProductos] = useState([]);
  const [editando, setEditando] = useState({});

  function cargar() { api.get('/productos').then(r => setProductos(r.data)); }
  useEffect(cargar, []);

  async function guardarStock(id, stock) {
    await api.patch(`/productos/${id}/stock`, { stock: parseInt(stock) });
    setEditando(e => { const n = {...e}; delete n[id]; return n; });
    cargar();
  }

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Stock</h2>
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-100">
            <tr className="text-left text-gray-400">
              <th className="px-4 py-3 font-medium">Producto</th>
              <th className="px-4 py-3 font-medium">Categoría</th>
              <th className="px-4 py-3 font-medium">Precio</th>
              <th className="px-4 py-3 font-medium">Stock</th>
              <th className="px-4 py-3 font-medium">Acción</th>
            </tr>
          </thead>
          <tbody>
            {productos.map(p => (
              <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{p.nombre}</td>
                <td className="px-4 py-3 text-gray-500 capitalize">{p.categoria}</td>
                <td className="px-4 py-3 text-pink-500 font-bold">${p.precio.toLocaleString('es-AR')}</td>
                <td className="px-4 py-3">
                  {editando[p.id] !== undefined ? (
                    <input
                      type="number" min="0"
                      value={editando[p.id]}
                      onChange={e => setEditando(ed => ({...ed, [p.id]: e.target.value}))}
                      className="w-20 border border-pink-300 rounded-lg px-2 py-1 text-center focus:outline-none"
                      autoFocus
                    />
                  ) : (
                    <span className={p.stock === 0 ? 'text-red-400 font-bold' : p.stock < 5 ? 'text-yellow-500 font-bold' : 'text-gray-700'}>
                      {p.stock}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {editando[p.id] !== undefined ? (
                    <div className="flex gap-2">
                      <button onClick={() => guardarStock(p.id, editando[p.id])} className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-lg hover:bg-green-200">Guardar</button>
                      <button onClick={() => setEditando(e => { const n={...e}; delete n[p.id]; return n; })} className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-lg">Cancelar</button>
                    </div>
                  ) : (
                    <button onClick={() => setEditando(e => ({...e, [p.id]: p.stock}))} className="text-xs text-pink-500 hover:underline">Editar</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
