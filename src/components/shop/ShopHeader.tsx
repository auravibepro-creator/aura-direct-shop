import { Link } from "@tanstack/react-router";
import { Search, ShoppingCart, Shield, ArrowLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { Ticker } from "./Ticker";
import { useCart } from "@/lib/cart";
import { fetchAnnouncements } from "@/lib/shop";

type Props = {
  search?: string;
  onSearchChange?: (value: string) => void;
  title?: string;
  showBack?: boolean;
};

export function ShopHeader({ search, onSearchChange, title, showBack }: Props) {
  const { count } = useCart();
  const { data: messages } = useQuery({
    queryKey: ["announcements"],
    queryFn: fetchAnnouncements,
    staleTime: 60_000,
  });

  return (
    <header className="sticky top-0 z-30 bg-background/95 backdrop-blur">
      <Ticker messages={messages ?? []} />
      <div className="flex items-center gap-2 px-3 py-2.5">
        {showBack ? (
          <button
            type="button"
            onClick={() => window.history.back()}
            aria-label="Go back"
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground"
          >
            <ArrowLeft className="size-4.5" />
          </button>
        ) : null}

        {onSearchChange ? (
          <label className="flex h-10 flex-1 items-center gap-2 rounded-full border border-border bg-card px-3.5 card-shadow">
            <Search className="size-4 text-muted-foreground" />
            <input
              value={search ?? ""}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search cosmetics, masks, nail care…"
              maxLength={80}
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </label>
        ) : (
          <h1 className="flex-1 truncate text-base font-semibold">{title}</h1>
        )}

        <Link
          to="/admin"
          aria-label="Admin dashboard"
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground"
        >
          <Shield className="size-4.5" />
        </Link>
        <Link
          to="/cart"
          aria-label="Cart"
          className="relative flex size-9 shrink-0 items-center justify-center rounded-full brand-gradient text-primary-foreground"
        >
          <ShoppingCart className="size-4.5" />
          {count > 0 ? (
            <span className="absolute -top-1 -right-1 min-w-4.5 rounded-full bg-deal px-1 text-center text-[10px] leading-4.5 font-bold text-deal-foreground">
              {count}
            </span>
          ) : null}
        </Link>
      </div>
    </header>
  );
}
