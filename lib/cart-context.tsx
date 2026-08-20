"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import type { MenuItem } from "./supabase";

export type CartLine = {
  item: MenuItem;
  quantity: number;
  size?: string;
  extras?: string[];
  spiceLevel?: string;
  notes?: string;
  unitPrice?: number;
  subtotal?: number;
};

type CartContextValue = {
  lines: CartLine[];
  addItem: (
    item: MenuItem,
    quantity?: number,
    size?: string,
    extras?: string[],
    unitPrice?: number,
    spiceLevel?: string,
    notes?: string
  ) => void;
  removeItem: (lineKey: string) => void;
  updateQuantity: (lineKey: string, quantity: number) => void;
  clearCart: () => void;
  total: number;
  itemCount: number;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function getLineKey(
  item: MenuItem,
  size?: string,
  extras?: string[],
  spiceLevel?: string,
  notes?: string
): string {
  const sizeStr = size || "";
  const extrasStr = extras ? [...extras].sort().join(",") : "";
  const spiceStr = spiceLevel || "";
  const noteStr = notes || "";
  return `${item.id}:${sizeStr}:${extrasStr}:${spiceStr}:${noteStr}`;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);

  function addItem(
    item: MenuItem,
    quantity = 1,
    size?: string,
    extras?: string[],
    unitPrice?: number,
    spiceLevel?: string,
    notes?: string
  ) {
    const calculatedUnitPrice = unitPrice ?? item.price;
    const key = getLineKey(item, size, extras, spiceLevel, notes);

    setLines((prev) => {
      const existingIdx = prev.findIndex(
        (l) => getLineKey(l.item, l.size, l.extras, l.spiceLevel, l.notes) === key
      );
      if (existingIdx >= 0) {
        const updated = [...prev];
        const current = updated[existingIdx];
        const newQty = current.quantity + quantity;
        updated[existingIdx] = {
          ...current,
          quantity: newQty,
          subtotal: (current.unitPrice ?? item.price) * newQty,
        };
        return updated;
      }
      return [
        ...prev,
        {
          item,
          quantity,
          size,
          extras,
          spiceLevel,
          notes,
          unitPrice: calculatedUnitPrice,
          subtotal: calculatedUnitPrice * quantity,
        },
      ];
    });
  }

  function removeItem(lineKey: string) {
    setLines((prev) =>
      prev.filter((l) => getLineKey(l.item, l.size, l.extras, l.spiceLevel, l.notes) !== lineKey)
    );
  }

  function updateQuantity(lineKey: string, quantity: number) {
    if (quantity <= 0) {
      removeItem(lineKey);
      return;
    }
    setLines((prev) =>
      prev.map((l) => {
        if (getLineKey(l.item, l.size, l.extras, l.spiceLevel, l.notes) === lineKey) {
          const uPrice = l.unitPrice ?? l.item.price;
          return {
            ...l,
            quantity,
            subtotal: uPrice * quantity,
          };
        }
        return l;
      })
    );
  }

  function clearCart() {
    setLines([]);
  }

  const total = lines.reduce(
    (sum, l) => sum + (l.subtotal ?? (l.unitPrice ?? l.item.price) * l.quantity),
    0
  );
  const itemCount = lines.reduce((sum, l) => sum + l.quantity, 0);

  return (
    <CartContext.Provider
      value={{ lines, addItem, removeItem, updateQuantity, clearCart, total, itemCount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
