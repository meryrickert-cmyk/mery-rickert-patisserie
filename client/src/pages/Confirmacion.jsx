import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/index.js';

export default function Confirmacion() {
  const { id } = useParams();
  const [pedido, setPedido] = useState(null);
  const [whatsapp, setWhatsapp] = useState('');

  useEffect(() => {
    api.get(`/pedidos/mis-pedidos`).then(r => {
      const p = r.data.find(x => x.id === parseInt(id));
      if (p) setPedido(p);
    });
    api.get('/config').then(r => setWhatsapp(r.data.whatsapp));
  }, [id]);

  function abrirWhatsapp() {
    if (!pedido || !whatsapp) return;
    const items = pedido.items.map(i => `- ${i.nombre_producto} x${i.cantidad}`).join('\n');
    const msg = `Hola Mery! Hice un pedido 🧁\n\nPedido #${pedido.id}\n${items}\n\nTotal: $${pedido.total.toLocaleString('es-AR')}${pedido.nota ? '\n\nNota: ' + pedido.nota : ''}`;
    window.open(`https://wa.me/${whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16 text-center">
      <div className="text-6xl mb-4">🎉</div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">¡Pedido enviado!</h2>
      <p className="text-gray-500 mb-8">
        Gracias por tu compra. Mery se va a poner en contacto pronto.
      </p>

      {pedido && (
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6 text-left">
          <p className="text-sm text-gray-500 mb-3">Pedido #{pedido.id}</p>
          {pedido.items?.map(i => (
            <div key={i.id} className="flex justify-between text-sm text-gray-600 py-1">
              <span>{i.nombre_producto} x{i.cantidad}</span>
              <span>${(i.precio_unitario * i.cantidad).toLocaleString('es-AR')}</span>
            </div>
          ))}
          <div className="border-t mt-3 pt-3 flex justify-between font-bold">
            <span>Total</span>
            <span className="text-pink-500">${pedido.total?.toLocaleString('es-AR')}</span>
          </div>
        </div>
      )}

      <button
        onClick={abrirWhatsapp}
        className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-xl mb-3 transition flex items-center justify-center gap-2"
      >
        <span>💬</span> Avisar por WhatsApp
      </button>
      <Link to="/" className="block text-pink-500 hover:underline text-sm">Volver al inicio</Link>
    </div>
  );
}
