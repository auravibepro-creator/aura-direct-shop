import { Link } from "@tanstack/react-router";
import { Home, LayoutGrid, ShoppingCart, Shield, User } from "lucide-react";

import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";

const linkClass =
  "flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium text-muted-foreground";

export function BottomNav() {
  const { count } = useCart();
  const { session } = useAuth();

  return (
    <nav
      className="fixed bottom-0 left-0 z-30 w-full border-t border-border bg-card"
      style={{ boxShadow: "var(--shadow-float)" }}
    >
      <div className="mx-auto flex max-w-md">
        <Link to="/" className={linkClass} activeProps={{ className: "text-primary" }}>
          <Home className="size-5" />
          Home
        </Link>
        <Link to="/categories" className={linkClass} activeProps={{ className: "text-primary" }}>
          <LayoutGrid className="size-5" />
          Categories
        </Link>
        <Link to="/cart" className={linkClass} activeProps={{ className: "text-primary" }}>
          <span className="relative">
            <ShoppingCart className="size-5" />
            {count > 0 ? (
              <span className="absolute -top-1.5 -right-2 min-w-4 rounded-full bg-deal px-1 text-[9px] leading-4 font-bold text-deal-foreground">
                {count}
              </span>
            ) : null}
          </span>
          Cart
        </Link>
        <Link to="/admin" className={linkClass} activeProps={{ className: "text-primary" }}>
          <Shield className="size-5" />
          Admin
        </Link>
      </div>
    </nav>
  );
}
