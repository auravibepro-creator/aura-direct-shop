import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, Trash2, Truck, ShoppingBag } from "lucide-react";

import { ShopHeader } from "@/components/shop/ShopHeader";
import { BottomNav } from "@/components/shop/BottomNav";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { useCart } from "@/lib/cart";
import { FREE_SHIPPING_THRESHOLD, formatPKR } from "@/lib/shop";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your cart — Aura Vibe" },
      { name: "description", content: "Review your items, adjust quantities and check out on WhatsApp." },
      { property: "og:title", content: "Your cart — Aura Vibe" },
      { property: "og:description", content: "Review your Aura Vibe items and order on WhatsApp." },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { items, selectedTotal, setQuantity, toggleSelected, toggleAll, removeItem } = useCart();
  const allSelected = items.length > 0 && items.every((item) => item.selected);
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - selectedTotal);
  const selectedCount = items.filter((item) => item.selected).length;

  return (
    <div className="min-h-screen pb-40">
      <ShopHeader title="Shopping cart" showBack />

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 px-6 py-20 text-center">
          <ShoppingBag className="size-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Your cart is empty.</p>
          <Button asChild className="brand-gradient text-primary-foreground">
            <Link to="/">Start shopping</Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="mx-3 mt-3 rounded-2xl bg-card p-3 card-shadow">
            <p className="flex items-center gap-1.5 text-xs font-semibold">
              <Truck className="size-4 text-primary" />
              {remaining > 0
                ? `Add ${formatPKR(remaining)} more for FREE delivery`
                : "You unlocked FREE delivery 🎉"}
            </p>
            <Progress
              className="mt-2 h-2"
              value={Math.min(100, (selectedTotal / FREE_SHIPPING_THRESHOLD) * 100)}
            />
          </div>

          <div className="flex items-center gap-2 px-4 pt-4 pb-1 text-xs font-semibold">
            <Checkbox checked={allSelected} onCheckedChange={(value) => toggleAll(Boolean(value))} />
            Select all ({items.length})
          </div>

          <ul className="space-y-3 px-3 pt-2">
            {items.map((item) => (
              <li
                key={`${item.productId}-${item.variant ?? ""}`}
                className="flex gap-3 rounded-2xl bg-card p-3 card-shadow"
              >
                <Checkbox
                  className="mt-8"
                  checked={item.selected}
                  onCheckedChange={() => toggleSelected(item.productId, item.variant)}
                />
                <Link
                  to="/product/$productId"
                  params={{ productId: item.productId }}
                  className="size-20 shrink-0 overflow-hidden rounded-xl bg-muted"
                >
                  {item.image ? (
                    <img src={item.image} alt={item.name} loading="lazy" className="size-full object-cover" />
                  ) : null}
                </Link>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-[13px] font-medium">{item.name}</p>
                  {item.variant ? (
                    <span className="mt-1 inline-block rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-secondary-foreground">
                      {item.variant}
                    </span>
                  ) : null}
                  <div className="mt-1.5 flex items-center justify-between">
                    <span className="text-sm font-extrabold text-deal">{formatPKR(item.price)}</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        aria-label="Decrease quantity"
                        onClick={() => setQuantity(item.productId, item.variant, item.quantity - 1)}
                        className="flex size-7 items-center justify-center rounded-full bg-secondary"
                      >
                        <Minus className="size-3.5" />
                      </button>
                      <span className="w-5 text-center text-sm font-bold">{item.quantity}</span>
                      <button
                        type="button"
                        aria-label="Increase quantity"
                        onClick={() => setQuantity(item.productId, item.variant, item.quantity + 1)}
                        className="flex size-7 items-center justify-center rounded-full brand-gradient text-primary-foreground"
                      >
                        <Plus className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        aria-label="Remove item"
                        onClick={() => removeItem(item.productId, item.variant)}
                        className="flex size-7 items-center justify-center rounded-full text-muted-foreground"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="fixed bottom-14 left-0 z-30 w-full border-t border-border bg-card p-3">
            <div className="mx-auto flex max-w-md items-center gap-3">
              <div className="flex-1">
                <p className="text-[11px] text-muted-foreground">Total ({selectedCount} selected)</p>
                <p className="text-lg font-extrabold text-deal">{formatPKR(selectedTotal)}</p>
              </div>
              <Button
                asChild
                disabled={selectedCount === 0}
                className="brand-gradient px-6 text-primary-foreground"
              >
                <Link to="/checkout">Checkout</Link>
              </Button>
            </div>
          </div>
        </>
      )}

      <BottomNav />
    </div>
  );
}
