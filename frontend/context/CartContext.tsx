"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { MenuItem } from "@/types/menu";

export interface CartItem {
  item: MenuItem;
  quantity: number;
}

interface CartContextType {
  cartItems: CartItem[];
  totalCartCount: number;
  subtotal: number;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addToCart: (item: MenuItem) => void;
  updateQuantity: (itemId: string | number, delta: number) => void;
  removeItem: (itemId: string | number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = "urban_spice_cart_items";

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setCartItems(parsed);
        }
      }
    } catch {
      // Ignore localStorage errors
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Sync to localStorage on cart change
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cartItems));
    } catch {
      // Ignore
    }
  }, [cartItems, isLoaded]);

  const addToCart = (item: MenuItem) => {
    setCartItems((prev) => {
      const existing = prev.find((ci) => String(ci.item.id) === String(item.id));
      if (existing) {
        return prev.map((ci) =>
          String(ci.item.id) === String(item.id)
            ? { ...ci, quantity: ci.quantity + 1 }
            : ci
        );
      }
      return [...prev, { item, quantity: 1 }];
    });
  };

  const updateQuantity = (itemId: string | number, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((ci) => {
          if (String(ci.item.id) === String(itemId)) {
            const newQty = ci.quantity + delta;
            return newQty > 0 ? { ...ci, quantity: newQty } : null;
          }
          return ci;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeItem = (itemId: string | number) => {
    setCartItems((prev) => prev.filter((ci) => String(ci.item.id) !== String(itemId)));
  };

  const clearCart = () => {
    setCartItems([]);
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch {
      // Ignore
    }
  };

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  const totalCartCount = cartItems.reduce((acc, cur) => acc + cur.quantity, 0);
  const subtotal = cartItems.reduce(
    (acc, cur) => acc + Number(cur.item.price) * cur.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        cartItems,
        totalCartCount,
        subtotal,
        isCartOpen,
        openCart,
        closeCart,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
