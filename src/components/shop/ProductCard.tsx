import { Link } from "@tanstack/react-router";
import { Star } from "lucide-react";

import { discountPercent, formatPKR, type Product } from "@/lib/shop";

export function ProductCard({ product }: { product: Product }) {
  const off = discountPercent(product);

  return (
    <Link
      to="/product/$productId"
      params={{ productId: product.id }}
      className="flex flex-col overflow-hidden rounded-2xl bg-card card-shadow"
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        {product.images[0] ? (
          <img
            src={product.images[0]}
            alt={product.name}
            loading="lazy"
            className="size-full object-cover"
          />
        ) : null}
        {off ? (
          <span className="absolute top-2 left-2 rounded-full bg-deal px-2 py-0.5 text-[10px] font-bold text-deal-foreground">
            -{off}%
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-2.5">
        <p className="line-clamp-2 text-[13px] leading-snug font-medium">{product.name}</p>
        <div className="flex items-baseline gap-1.5">
          <span className="text-[15px] font-extrabold text-deal">{formatPKR(product.price)}</span>
          {product.compare_at_price ? (
            <span className="text-[11px] text-muted-foreground line-through">
              {formatPKR(product.compare_at_price)}
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <Star className="size-3 fill-gold text-gold" />
          {product.rating.toFixed(1)}
          <span>· {product.sold_count.toLocaleString("en-PK")} sold</span>
        </div>
      </div>
    </Link>
  );
}
