import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type CartItem = {
  productId: string;
  name: string;
  price: number;
  image: string | null;
  variant: string | null;
  quantity: number;
  selected: boolean;
};

type CartContextValue = {
  items: CartItem[];
  count: number;
  selectedTotal: number;
  addItem: (item: Omit<CartItem, "selected">) => void;
  setQuantity: (productId: string, variant: string | null, quantity: number) => void;
  toggleSelected: (productId: string, variant: string | null) => void;
  toggleAll: (selected: boolean) => void;
  removeItem: (productId: string, variant: string | null) => void;
  clear: () => void;
  ready: boolean;
};

const STORAGE_KEY = "auravibe-cart-v1";
const CartContext = createContext<CartContextValue | null>(null);

const sameLine = (item: CartItem, productId: string, variant: string | null) =>
  item.productId === productId && (item.variant ?? null) === (variant ?? null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw) as CartItem[]);
    } catch {
      /* ignore corrupt cart */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, ready]);

  const value = useMemo<CartContextValue>(() => {
    return {
      items,
      ready,
      count: items.reduce((sum, item) => sum + item.quantity, 0),
      selectedTotal: items
        .filter((item) => item.selected)
        .reduce((sum, item) => sum + item.price * item.quantity, 0),
      addItem: (incoming) =>
        setItems((prev) => {
          const existing = prev.find((item) => sameLine(item, incoming.productId, incoming.variant));
          if (existing) {
            return prev.map((item) =>
              sameLine(item, incoming.productId, incoming.variant)
                ? { ...item, quantity: item.quantity + incoming.quantity, selected: true }
                : item,
            );
          }
          return [...prev, { ...incoming, selected: true }];
        }),
      setQuantity: (productId, variant, quantity) =>
        setItems((prev) =>
          quantity <= 0
            ? prev.filter((item) => !sameLine(item, productId, variant))
            : prev.map((item) => (sameLine(item, productId, variant) ? { ...item, quantity } : item)),
        ),
      toggleSelected: (productId, variant) =>
        setItems((prev) =>
          prev.map((item) =>
            sameLine(item, productId, variant) ? { ...item, selected: !item.selected } : item,
          ),
        ),
      toggleAll: (selected) => setItems((prev) => prev.map((item) => ({ ...item, selected }))),
      removeItem: (productId, variant) =>
        setItems((prev) => prev.filter((item) => !sameLine(item, productId, variant))),
      clear: () => setItems([]),
    };
  }, [items, ready]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
