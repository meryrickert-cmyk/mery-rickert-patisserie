import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/index.js';
import { useAuth } from '../context/AuthContext';

const ESTADOS = {
  pendiente: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-700' },
  confirmado: { label: 'Confirmado', color: 'bg-blue-100 text-blue-700' },
  preparando: { label: 'Preparando', color: 'bg-orange-100 text-orange-700' },
  listo: { label: 'Listo', color: 'bg-green-100 text-green-700' },
  entregado: { label: 'Entregado', color: 'bg-gray-100 text-gray-600' },
  cancelado: { label: 'Cancelado', color: 'bg-red-100 text-red-500' },
};

export default function Cuenta() {
  const { cliente, logoutCliente } = useAuth();
  const navigate = useNavigate();
  const [pedidos, setPedidos] = useState([]);

  useEffect(() => {
    if (!cliente) { navigate('/login'); return; }
    api.get('/pedidos/mis-pedidos').then(r => setPedidos(r.data));
  }, [cliente]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Mi cuenta</h2>
        <button onClick={() => { logoutCliente(); navigate('/'); }} className="text-sm text-gray-400 hover:text-gray-600">Salir</button>
      </div>
      <p className="text-gray-500 mb-6">Hola, <strong>{cliente?.nombre}</strong> 👋</p>

      <h3 className="font-semibold text-gray-700 mb-3">Mis pedidos</h3>
      {pedidos.length === 0 && <p className="text-gray-400 text-sm">Todavía no hiciste pedidos</p>}
      <div className="space-y-3">
        {pedidos.map(p => {
          const est = ESTADOS[p.estado] || ESTADOS.pendiente;
          return (
            <div key={p.id} className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-gray-800">Pedido #{p.id}</span>
                <span className={`text-xs px-3 py-1 rounded-full font-medium ${est.color}`}>{est.label}</span>
              </div>
              <div className="text-sm text-gray-500 mb-2">
                {new Date(p.creado_en).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
              {p.items?.map(i => (
                <div key={i.id} className="flex justify-between text-xs text-gray-500 py-0.5">
                  <span>{i.nombre_producto} x{i.cantidad}</span>
                  <span>${(i.precio_unitario * i.cantidad).toLocaleString('es-AR')}</span>
                </div>
              ))}
              <div className="border-t mt-2 pt-2 flex justify-between font-bold text-sm">
                <span>Total</span>
                <span className="text-pink-500">${p.total.toLocaleString('es-AR')}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
