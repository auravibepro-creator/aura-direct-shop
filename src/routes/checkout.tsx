import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { MessageCircle } from "lucide-react";

import { ShopHeader } from "@/components/shop/ShopHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCart } from "@/lib/cart";
import { FREE_SHIPPING_THRESHOLD, WHATSAPP_NUMBER, formatPKR } from "@/lib/shop";
import { captureLocation, createOrder } from "@/lib/orders";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — Aura Vibe" },
      { name: "description", content: "Name, phone and address — then your order goes straight to WhatsApp." },
      { property: "og:title", content: "Checkout — Aura Vibe" },
      { property: "og:description", content: "Three fields and your Aura Vibe order is placed on WhatsApp." },
    ],
  }),
  component: CheckoutPage,
});

const schema = z.object({
  name: z.string().trim().min(2, "Please enter your full name").max(80),
  phone: z
    .string()
    .trim()
    .min(10, "Enter a valid phone number")
    .max(20)
    .regex(/^[0-9+\-\s]+$/, "Digits only, please"),
  address: z.string().trim().min(10, "Please add a complete delivery address").max(400),
});

function CheckoutPage() {
  const navigate = useNavigate();
  const { items, selectedTotal, clear } = useCart();
  const ordered = items.filter((item) => item.selected);
  const [form, setForm] = useState({ name: "", phone: "", address: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const shipping = selectedTotal >= FREE_SHIPPING_THRESHOLD || selectedTotal === 0 ? 0 : 200;
  const grandTotal = selectedTotal + shipping;

  const [placing, setPlacing] = useState(false);

  const placeOrder = async () => {
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) next[String(issue.path[0])] = issue.message;
      setErrors(next);
      return;
    }
    if (ordered.length === 0) {
      toast.error("Your cart is empty.");
      return;
    }
    setErrors({});
    setPlacing(true);

    // Capture GPS (best effort) and store the order so the sales, delivery and
    // ledger dashboards have real data; WhatsApp still receives the message.
    let orderCode = "";
    try {
      const location = await captureLocation();
      const stored = await createOrder({
        customerName: parsed.data.name,
        customerPhone: parsed.data.phone,
        address: parsed.data.address,
        subtotal: selectedTotal,
        shipping,
        total: grandTotal,
        location,
        items: ordered.map((item) => ({
          productId: item.productId,
          name: item.name,
          variant: item.variant,
          image: item.image,
          unitPrice: item.price,
          quantity: item.quantity,
        })),
      });
      orderCode = stored.order_code;
    } catch {
      toast.error("Saved locally only — sending your order on WhatsApp now.");
    } finally {
      setPlacing(false);
    }

    const lines = ordered.map(
      (item, index) =>
        `${index + 1}. ${item.name}${item.variant ? ` (${item.variant})` : ""}\n   Qty: ${item.quantity} × ${formatPKR(item.price)} = ${formatPKR(item.price * item.quantity)}`,
    );

    const message = [
      "*NEW ORDER — AURA VIBE*",
      ...(orderCode ? [`Order: ${orderCode}`] : []),
      "",
      "*Items*",
      ...lines,
      "",
      `Subtotal: ${formatPKR(selectedTotal)}`,
      `Delivery: ${shipping === 0 ? "FREE" : formatPKR(shipping)}`,
      `*Total: ${formatPKR(grandTotal)}*`,
      "",
      "*Customer*",
      `Name: ${parsed.data.name}`,
      `Phone: ${parsed.data.phone}`,
      `Address: ${parsed.data.address}`,
    ].join("\n");

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    clear();
    toast.success("Order sent on WhatsApp!");
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen pb-28">
      <ShopHeader title={`Checkout (${ordered.length})`} showBack />

      <div className="mx-3 mt-3 rounded-xl border border-success px-3 py-2.5 text-[12px] font-semibold text-success">
        ✔ Free shipping over Rs. 2,500 · Cash on delivery · All data is safeguarded
      </div>

      {ordered.length > 0 ? (
        <section className="mx-3 mt-3 rounded-2xl bg-card p-3 card-shadow">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold">Item details ({ordered.length})</h2>
            <Link to="/cart" className="text-xs font-semibold text-muted-foreground">
              View details ›
            </Link>
          </div>
          <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto">
            {ordered.map((item) => (
              <div key={`${item.productId}-${item.variant ?? ""}`} className="w-24 shrink-0">
                <div className="aspect-square overflow-hidden rounded-lg bg-muted">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      loading="lazy"
                      className="size-full object-cover"
                    />
                  ) : null}
                </div>
                <p className="mt-1 text-[11px] font-bold text-deal">
                  {formatPKR(item.price)}
                  <span className="font-medium text-muted-foreground"> ×{item.quantity}</span>
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mx-3 mt-3 space-y-3 rounded-2xl bg-card p-4 card-shadow">
        <h2 className="text-sm font-bold">Delivery details</h2>

        <div className="space-y-1.5">
          <Label htmlFor="name">Full name</Label>
          <Input
            id="name"
            value={form.name}
            maxLength={80}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            placeholder="e.g. Ayesha Khan"
          />
          {errors["name"] ? <p className="text-xs text-destructive">{errors["name"]}</p> : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="phone">WhatsApp / phone number</Label>
          <Input
            id="phone"
            inputMode="tel"
            value={form.phone}
            maxLength={20}
            onChange={(event) => setForm({ ...form, phone: event.target.value })}
            placeholder="03XX XXXXXXX"
          />
          {errors["phone"] ? <p className="text-xs text-destructive">{errors["phone"]}</p> : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="address">Delivery address</Label>
          <Textarea
            id="address"
            rows={3}
            value={form.address}
            maxLength={400}
            onChange={(event) => setForm({ ...form, address: event.target.value })}
            placeholder="House / street, area, city"
          />
          {errors["address"] ? <p className="text-xs text-destructive">{errors["address"]}</p> : null}
        </div>
      </section>

      <section className="mx-3 mt-3 rounded-2xl bg-card p-4 card-shadow">
        <h2 className="mb-2 text-sm font-bold">Order summary ({ordered.length})</h2>
        {ordered.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Nothing selected.{" "}
            <Link to="/cart" className="font-semibold text-primary">
              Back to cart
            </Link>
          </p>
        ) : (
          <ul className="space-y-1.5 text-xs">
            {ordered.map((item) => (
              <li key={`${item.productId}-${item.variant ?? ""}`} className="flex justify-between gap-2">
                <span className="min-w-0 truncate">
                  {item.quantity} × {item.name}
                  {item.variant ? ` · ${item.variant}` : ""}
                </span>
                <span className="font-semibold">{formatPKR(item.price * item.quantity)}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-3 space-y-1 border-t border-border pt-3 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatPKR(selectedTotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Delivery</span>
            <span>{shipping === 0 ? "FREE" : formatPKR(shipping)}</span>
          </div>
          <div className="flex justify-between text-base font-extrabold text-deal">
            <span>Total</span>
            <span>{formatPKR(grandTotal)}</span>
          </div>
        </div>
      </section>

      <section className="mx-3 mt-3 rounded-2xl bg-card p-4 card-shadow">
        <h2 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-success">
          ✔ Delivery guarantee
        </h2>
        <ul className="space-y-1 text-[12px] text-success">
          <li>✔ Return if the item arrives damaged</li>
          <li>✔ Refund if the order is never delivered</li>
          <li>✔ Your details are only shared with our delivery rider</li>
        </ul>
      </section>

      <div className="fixed bottom-0 left-0 z-30 w-full border-t border-border bg-card px-3 pt-2 pb-3">
        <div className="mx-auto flex max-w-md items-center gap-3">
          <div className="min-w-0">
            <p className="truncate text-lg font-extrabold text-deal">{formatPKR(grandTotal)}</p>
            <p className="text-[11px] text-muted-foreground">
              {shipping === 0 ? "Free delivery" : `+ ${formatPKR(shipping)} delivery`}
            </p>
          </div>
          <button
            type="button"
            disabled={placing}
            onClick={() => void placeOrder()}
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-hot px-4 py-3 text-sm font-extrabold text-deal-foreground disabled:opacity-70"
          >
            <MessageCircle className="size-5" />
            {placing ? "Saving order…" : `Submit order (${ordered.length})`}
          </button>
        </div>
      </div>
    </div>
  );
}
