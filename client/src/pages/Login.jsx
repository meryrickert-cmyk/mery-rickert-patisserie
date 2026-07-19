import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [error, setError] = useState('');
  const { loginCliente } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      await loginCliente(nombre, telefono);
      navigate('/cuenta');
    } catch {
      setError('Error al ingresar. Verificá los datos.');
    }
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-16">
      <div className="text-center mb-8">
        <div className="text-5xl mb-3">🧁</div>
        <h2 className="text-2xl font-bold text-gray-800">Ingresar</h2>
        <p className="text-gray-500 text-sm mt-1">Con tu nombre y teléfono</p>
      </div>
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
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
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button type="submit" className="w-full bg-pink-500 hover:bg-pink-600 text-white font-semibold py-3 rounded-xl transition">
          Ingresar
        </button>
      </form>
    </div>
  );
}
