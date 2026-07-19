import { useEffect, useState } from 'react';
import api from '../../api/index.js';

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => { api.get('/clientes').then(r => setClientes(r.data)); }, []);

  const filtrados = clientes.filter(c =>
    c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.telefono.includes(busqueda)
  );

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Clientes</h2>
      <input
        type="text" placeholder="Buscar por nombre o teléfono..." value={busqueda} onChange={e => setBusqueda(e.target.value)}
        className="w-full max-w-sm border border-gray-200 rounded-xl px-4 py-2 mb-6 focus:outline-none focus:border-pink-400 text-sm"
      />
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-100">
            <tr className="text-left text-gray-400">
              <th className="px-4 py-3 font-medium">Nombre</th>
              <th className="px-4 py-3 font-medium">Teléfono</th>
              <th className="px-4 py-3 font-medium">Pedidos</th>
              <th className="px-4 py-3 font-medium">Total gastado</th>
              <th className="px-4 py-3 font-medium">Cliente desde</th>
              <th className="px-4 py-3 font-medium">WhatsApp</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map(c => (
              <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{c.nombre}</td>
                <td className="px-4 py-3 text-gray-500">{c.telefono}</td>
                <td className="px-4 py-3 text-gray-600">{c.total_pedidos}</td>
                <td className="px-4 py-3 text-pink-500 font-bold">${parseFloat(c.total_gastado).toLocaleString('es-AR')}</td>
                <td className="px-4 py-3 text-gray-400">{new Date(c.creado_en).toLocaleDateString('es-AR')}</td>
                <td className="px-4 py-3">
                  <a href={`https://wa.me/${c.telefono.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="text-green-500 hover:underline text-xs">
                    💬 Escribir
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtrados.length === 0 && <p className="text-center text-gray-400 py-8">Sin clientes</p>}
      </div>
    </div>
  );
}
