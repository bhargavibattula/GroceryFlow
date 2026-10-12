import React, { createContext, useContext, useState } from 'react';
import { roundMoney } from '../utils/format';

export type CustomerType = 'RESELLER' | 'RETAIL';

export interface CartItem {
  productId: string;
  name: string;
  sku: string;
  baseUnit: string;
  selectedUnit: string;
  conversionFactor: number;
  quantity: number;
  unitPrice: number; // based on current customerType
  resellerPrice: number;
  retailPrice: number;
  discount: number;
  availableStock: number;
}

interface CartContextType {
  items: CartItem[];
  customerType: CustomerType;
  setCustomerType: (type: CustomerType) => void;
  addItem: (product: any, quantity?: number, unit?: string, factor?: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  updateDiscount: (productId: string, discount: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  subtotal: number;
  totalDiscount: number;
  grandTotal: number;
  itemCount: number;
}

const CartContext = createContext<CartContextType>({
  items: [],
  customerType: 'RETAIL',
  setCustomerType: () => {},
  addItem: () => {},
  updateQuantity: () => {},
  updateDiscount: () => {},
  removeItem: () => {},
  clearCart: () => {},
  subtotal: 0,
  totalDiscount: 0,
  grandTotal: 0,
  itemCount: 0,
});

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [customerType, setCustomerTypeState] = useState<CustomerType>('RETAIL');

  const setCustomerType = (newType: CustomerType) => {
    setCustomerTypeState(newType);
    // Update unit prices for all existing items in cart
    setItems((prev) =>
      prev.map((item) => ({
        ...item,
        unitPrice: newType === 'RESELLER' ? item.resellerPrice : item.retailPrice,
      }))
    );
  };

  const addItem = (product: any, quantity = 1, unit?: string, factor = 1) => {
    setItems((prev) => {
      const existingIndex = prev.findIndex((i) => i.productId === product._id);
      const unitPrice = customerType === 'RESELLER' ? product.resellerPrice : product.retailPrice;

      if (existingIndex > -1) {
        const copy = [...prev];
        const existing = copy[existingIndex];
        const newQty = existing.quantity + quantity;
        copy[existingIndex] = { ...existing, quantity: newQty };
        return copy;
      }

      return [
        ...prev,
        {
          productId: product._id,
          name: product.name,
          sku: product.sku,
          baseUnit: product.baseUnit,
          selectedUnit: unit || product.baseUnit,
          conversionFactor: factor,
          quantity,
          unitPrice,
          resellerPrice: product.resellerPrice,
          retailPrice: product.retailPrice,
          discount: 0,
          availableStock: product.availableQuantity,
        },
      ];
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.productId === productId ? { ...i, quantity } : i))
    );
  };

  const updateDiscount = (productId: string, discount: number) => {
    setItems((prev) =>
      prev.map((i) => (i.productId === productId ? { ...i, discount: Math.max(0, discount) } : i))
    );
  };

  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  };

  const clearCart = () => setItems([]);

  const subtotal = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
  const totalDiscount = items.reduce((sum, i) => sum + (i.discount || 0), 0);
  const grandTotal = Math.max(0, subtotal - totalDiscount);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        customerType,
        setCustomerType,
        addItem,
        updateQuantity,
        updateDiscount,
        removeItem,
        clearCart,
        subtotal,
        totalDiscount,
        grandTotal,
        itemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
