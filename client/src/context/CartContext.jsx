import { createContext, useContext, useState } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);

  function agregar(producto, cantidad = 1) {
    setItems(prev => {
      const existe = prev.find(i => i.producto_id === producto.id);
      if (existe) {
        return prev.map(i => i.producto_id === producto.id
          ? { ...i, cantidad: i.cantidad + cantidad }
          : i
        );
      }
      return [...prev, { producto_id: producto.id, nombre: producto.nombre, precio: producto.precio, imagen: producto.imagen, cantidad }];
    });
  }

  function quitar(producto_id) {
    setItems(prev => prev.filter(i => i.producto_id !== producto_id));
  }

  function cambiarCantidad(producto_id, cantidad) {
    if (cantidad <= 0) return quitar(producto_id);
    setItems(prev => prev.map(i => i.producto_id === producto_id ? { ...i, cantidad } : i));
  }

  function vaciar() { setItems([]); }

  const total = items.reduce((s, i) => s + i.precio * i.cantidad, 0);
  const cantidad = items.reduce((s, i) => s + i.cantidad, 0);

  return (
    <CartContext.Provider value={{ items, agregar, quitar, cambiarCantidad, vaciar, total, cantidad }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
