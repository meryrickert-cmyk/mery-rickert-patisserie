import { createContext, useContext, useState } from 'react';
import api from '../api/index.js';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [cliente, setCliente] = useState(() => {
    const token = localStorage.getItem('mr_customer_token');
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.exp * 1000 < Date.now()) { localStorage.removeItem('mr_customer_token'); return null; }
      return { id: payload.id, nombre: payload.nombre };
    } catch { return null; }
  });

  async function loginCliente(nombre, telefono) {
    const { data } = await api.post('/auth/cliente/login', { nombre, telefono });
    localStorage.setItem('mr_customer_token', data.token);
    setCliente(data.cliente);
    return data.cliente;
  }

  function logoutCliente() {
    localStorage.removeItem('mr_customer_token');
    setCliente(null);
  }

  return (
    <AuthContext.Provider value={{ cliente, loginCliente, logoutCliente }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
