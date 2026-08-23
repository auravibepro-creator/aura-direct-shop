import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Check, Minus, Plus, Star, Truck, PlayCircle } from "lucide-react";

import { ShopHeader } from "@/components/shop/ShopHeader";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCart } from "@/lib/cart";
import { discountPercent, fetchProduct, formatPKR } from "@/lib/shop";
import { useAdminMode } from "@/lib/admin-mode";

export const Route = createFileRoute("/product/$productId")({
  head: () => ({
    meta: [
      { title: "Product details — Aura Vibe" },
      { name: "description", content: "See photos, video demo, variants and PKR pricing before you order." },
      { property: "og:title", content: "Product details — Aura Vibe" },
      {
        property: "og:description",
        content: "Photos, video demo, variants and PKR pricing on Aura Vibe.",
      },
    ],
  }),
  component: ProductPage,
});

function ProductPage() {
  const { productId } = Route.useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();

  const { data: product, isPending } = useQuery({
    queryKey: ["product", productId],
    queryFn: () => fetchProduct(productId),
  });

  const [activeImage, setActiveImage] = useState(0);
  const [variant, setVariant] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const adminMode = useAdminMode();

  if (isPending) {
    return (
      <div className="min-h-screen">
        <ShopHeader title="Loading…" showBack />
        <Skeleton className="aspect-square w-full" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen">
        <ShopHeader title="Not found" showBack />
        <div className="p-8 text-center text-sm text-muted-foreground">
          This product is no longer available.
          <div className="mt-4">
            <Button asChild>
              <Link to="/">Back to shop</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const off = discountPercent(product);
  const chosenVariant = variant ?? product.variants[0] ?? null;

  const handleAdd = () => {
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.images[0] ?? null,
      variant: chosenVariant,
      quantity,
    });
    setAdded(true);
  };

  return (
    <div className="min-h-screen pb-24">
      <ShopHeader title={product.name} showBack />

      <div className="relative aspect-square w-full overflow-hidden bg-muted">
        {product.images[activeImage] ? (
          <img
            src={product.images[activeImage]}
            alt={product.name}
            width={800}
            height={800}
            className="size-full object-cover"
          />
        ) : null}
        {off ? (
          <span className="absolute top-3 left-3 rounded-full deal-gradient px-2.5 py-1 text-xs font-bold text-deal-foreground">
            -{off}% OFF
          </span>
        ) : null}
        {adminMode.editMode ? (
          <button
            type="button"
            aria-label="Edit this product"
            onClick={() => adminMode.openEditor(product)}
            className="absolute inset-0 flex items-end justify-end bg-primary/15 p-3"
          >
            <span className="rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground">
              Edit image, price & offer
            </span>
          </button>
        ) : null}
      </div>

      {product.images.length > 1 ? (
        <div className="no-scrollbar flex gap-2 overflow-x-auto px-3 py-2">
          {product.images.map((image, index) => (
            <button
              key={image + index}
              type="button"
              onClick={() => setActiveImage(index)}
              className={`size-14 shrink-0 overflow-hidden rounded-xl border-2 ${
                index === activeImage ? "border-primary" : "border-transparent"
              }`}
            >
              <img src={image} alt="" loading="lazy" className="size-full object-cover" />
            </button>
          ))}
        </div>
      ) : null}

      <div className="flex items-center gap-3 bg-promo px-3 py-2 text-[11px] font-semibold text-success">
        <span className="rounded-md bg-deal px-2 py-0.5 text-[10px] font-extrabold text-deal-foreground">
          SAVINGS
        </span>
        <span>✔ Free shipping</span>
        <span>✔ Cash on delivery</span>
      </div>

      <div className="px-3 pt-3">
        <h2 className="text-base leading-snug font-semibold">{product.name}</h2>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {product.compare_at_price ? (
            <span className="text-sm text-muted-foreground line-through">
              {formatPKR(product.compare_at_price)}
            </span>
          ) : null}
          <span className="text-2xl font-extrabold text-deal">{formatPKR(product.price)}</span>
          {off ? (
            <span className="rounded-md bg-success px-2 py-1 text-xs font-extrabold text-deal-foreground italic">
              {off}% OFF
            </span>
          ) : null}
          {product.stock > 0 && product.stock <= 20 ? (
            <span className="rounded-md bg-hot px-2 py-1 text-xs font-extrabold text-deal-foreground">
              ONLY {product.stock} LEFT
            </span>
          ) : null}
        </div>
        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Star className="size-3.5 fill-gold text-gold" />
            {product.rating.toFixed(1)}
          </span>
          <span>{product.sold_count.toLocaleString("en-PK")} sold</span>
          <span className="flex items-center gap-1">
            <Truck className="size-3.5" />
            Fast delivery
          </span>
        </div>
      </div>

      {product.video_url ? (
        <section className="mt-4 px-3">
          <h3 className="mb-2 flex items-center gap-1.5 text-sm font-bold">
            <PlayCircle className="size-4 text-primary" />
            Video demo
          </h3>
          <video
            src={product.video_url}
            className="aspect-video w-full rounded-2xl bg-black object-cover"
            controls
            loop
            muted
            playsInline
            preload="metadata"
          />
        </section>
      ) : null}

      {product.variants.length > 0 ? (
        <section className="mt-4 px-3">
          <h3 className="mb-2 text-sm font-bold">
            Variant: <span className="font-normal text-muted-foreground">{chosenVariant}</span>
          </h3>
          <div className="flex flex-wrap gap-2">
            {product.variants.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setVariant(option)}
                className={`rounded-xl border px-3 py-2 text-xs font-semibold ${
                  option === chosenVariant
                    ? "border-primary bg-secondary text-secondary-foreground"
                    : "border-border bg-card"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-4 flex items-center gap-3 px-3">
        <h3 className="text-sm font-bold">Quantity</h3>
        <div className="flex items-center gap-3 rounded-full border border-border bg-card px-2 py-1">
          <button
            type="button"
            aria-label="Decrease quantity"
            onClick={() => setQuantity((value) => Math.max(1, value - 1))}
            className="flex size-7 items-center justify-center rounded-full bg-secondary"
          >
            <Minus className="size-3.5" />
          </button>
          <span className="w-6 text-center text-sm font-bold">{quantity}</span>
          <button
            type="button"
            aria-label="Increase quantity"
            onClick={() => setQuantity((value) => Math.min(product.stock || 99, value + 1))}
            className="flex size-7 items-center justify-center rounded-full brand-gradient text-primary-foreground"
          >
            <Plus className="size-3.5" />
          </button>
        </div>
        <span className="text-xs text-muted-foreground">{product.stock} in stock</span>
      </section>

      <section className="mt-5 px-3">
        <h3 className="mb-1 text-sm font-bold">Product details</h3>
        <p className="text-sm leading-relaxed whitespace-pre-line text-muted-foreground">
          {product.description}
        </p>
      </section>

      <div className="fixed bottom-0 left-0 z-30 w-full border-t border-border bg-card p-3">
        <div className="mx-auto flex max-w-md gap-2">
          <Button variant="outline" className="flex-1" asChild>
            <Link to="/cart">View cart</Link>
          </Button>
          <Button className="flex-2 brand-gradient text-primary-foreground" onClick={handleAdd}>
            Add to cart · {formatPKR(product.price * quantity)}
          </Button>
        </div>
      </div>

      {added ? (
        <div className="fixed inset-0 z-40 flex items-end bg-foreground/40 px-3 pb-3">
          <div className="mx-auto w-full max-w-md animate-rise rounded-2xl bg-card p-4 text-center">
            <span className="mx-auto flex size-11 animate-pop-in items-center justify-center rounded-full brand-gradient text-primary-foreground">
              <Check className="size-6" />
            </span>
            <p className="mt-2 text-base font-bold">Added to cart</p>
            <p className="text-xs text-muted-foreground">
              {quantity} × {product.name}
              {chosenVariant ? ` · ${chosenVariant}` : ""}
            </p>
            <div className="mt-4 flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setAdded(false)}>
                Keep shopping
              </Button>
              <Button
                className="flex-1 brand-gradient text-primary-foreground"
                onClick={() => navigate({ to: "/cart" })}
              >
                Go to cart
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
