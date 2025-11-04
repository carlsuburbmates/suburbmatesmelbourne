import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";

export interface CartItem {
  productId: number;
  vendorId: number;
  quantity: number;
  price: number;
  title: string;
  imageUrl?: string;
}

export interface CartContextType {
  items: CartItem[];
  totalCents: number;
  itemCount: number;
  isLoading: boolean;
  addItem: (item: Omit<CartItem, "quantity"> & { quantity: number }) => Promise<void>;
  removeItem: (productId: number, vendorId: number) => Promise<void>;
  updateQuantity: (productId: number, vendorId: number, quantity: number) => Promise<void>;
  clear: () => Promise<void>;
  syncWithDB: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const STORAGE_KEY = "suburbmates_cart";

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [totalCents, setTotalCents] = useState(0);
  const [itemCount, setItemCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const getMineQuery = trpc.cart.getMine.useQuery(undefined, {
    enabled: false, // Manual control
  });

  const addItemMutation = trpc.cart.addItem.useMutation();
  const removeItemMutation = trpc.cart.removeItem.useMutation();
  const updateQuantityMutation = trpc.cart.updateQuantity.useMutation();
  const clearMutation = trpc.cart.clear.useMutation();

  // Load from localStorage on mount
  useEffect(() => {
    const loadCartFromStorage = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setItems(parsed.items || []);
          setTotalCents(parsed.totalCents || 0);
          setItemCount(parsed.itemCount || 0);
        }
      } catch (error) {
        console.error("[Cart] Failed to load from localStorage:", error);
      }
      setIsLoading(false);
    };

    loadCartFromStorage();
  }, []);

  // Save to localStorage whenever cart changes
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ items, totalCents, itemCount })
        );
      } catch (error) {
        console.error("[Cart] Failed to save to localStorage:", error);
      }
    }
  }, [items, totalCents, itemCount, isLoading]);

  // Sync cart from DB
  const syncWithDB = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await getMineQuery.refetch();
      if (result.data) {
        setItems(result.data.items);
        setTotalCents(result.data.totalCents);
        setItemCount(result.data.itemCount);
      }
    } catch (error) {
      console.error("[Cart] Failed to sync with DB:", error);
    } finally {
      setIsLoading(false);
    }
  }, [getMineQuery]);

  const addItem = useCallback(
    async (item: Omit<CartItem, "quantity"> & { quantity: number }) => {
      try {
        await addItemMutation.mutateAsync({
          productId: item.productId,
          vendorId: item.vendorId,
          quantity: item.quantity,
          price: item.price,
          title: item.title,
          imageUrl: item.imageUrl,
        });

        // Update local state optimistically
        const existingIndex = items.findIndex(
          (i) =>
            i.productId === item.productId && i.vendorId === item.vendorId
        );

        let newItems: CartItem[];
        if (existingIndex >= 0) {
          newItems = [...items];
          newItems[existingIndex].quantity += item.quantity;
        } else {
          newItems = [...items, item as CartItem];
        }

        const newTotal = newItems.reduce(
          (sum, i) => sum + i.price * i.quantity,
          0
        );
        const newCount = newItems.reduce((sum, i) => sum + i.quantity, 0);

        setItems(newItems);
        setTotalCents(newTotal);
        setItemCount(newCount);
      } catch (error) {
        console.error("[Cart] Failed to add item:", error);
        throw error;
      }
    },
    [items, addItemMutation]
  );

  const removeItem = useCallback(
    async (productId: number, vendorId: number) => {
      try {
        await removeItemMutation.mutateAsync({ productId, vendorId });

        // Update local state optimistically
        const newItems = items.filter(
          (item) =>
            !(item.productId === productId && item.vendorId === vendorId)
        );

        const newTotal = newItems.reduce(
          (sum, i) => sum + i.price * i.quantity,
          0
        );
        const newCount = newItems.reduce((sum, i) => sum + i.quantity, 0);

        setItems(newItems);
        setTotalCents(newTotal);
        setItemCount(newCount);
      } catch (error) {
        console.error("[Cart] Failed to remove item:", error);
        throw error;
      }
    },
    [items, removeItemMutation]
  );

  const updateQuantity = useCallback(
    async (productId: number, vendorId: number, quantity: number) => {
      try {
        await updateQuantityMutation.mutateAsync({
          productId,
          vendorId,
          quantity,
        });

        // Update local state optimistically
        let newItems: CartItem[];
        if (quantity === 0) {
          newItems = items.filter(
            (item) =>
              !(item.productId === productId && item.vendorId === vendorId)
          );
        } else {
          newItems = items.map((item) =>
            item.productId === productId && item.vendorId === vendorId
              ? { ...item, quantity }
              : item
          );
        }

        const newTotal = newItems.reduce(
          (sum, i) => sum + i.price * i.quantity,
          0
        );
        const newCount = newItems.reduce((sum, i) => sum + i.quantity, 0);

        setItems(newItems);
        setTotalCents(newTotal);
        setItemCount(newCount);
      } catch (error) {
        console.error("[Cart] Failed to update quantity:", error);
        throw error;
      }
    },
    [items, updateQuantityMutation]
  );

  const clear = useCallback(async () => {
    try {
      await clearMutation.mutateAsync();
      setItems([]);
      setTotalCents(0);
      setItemCount(0);
    } catch (error) {
      console.error("[Cart] Failed to clear cart:", error);
      throw error;
    }
  }, [clearMutation]);

  return (
    <CartContext.Provider
      value={{
        items,
        totalCents,
        itemCount,
        isLoading,
        addItem,
        removeItem,
        updateQuantity,
        clear,
        syncWithDB,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
};
