import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";

import { ShopHeader } from "@/components/shop/ShopHeader";
import { BottomNav } from "@/components/shop/BottomNav";
import { IncentivesBanner } from "@/components/shop/IncentivesBanner";
import { ProductCard } from "@/components/shop/ProductCard";
import { SIDEBAR_CATEGORIES } from "@/lib/taxonomy";
import { fetchProducts } from "@/lib/shop";

export const Route = createFileRoute("/categories")({
  head: () => ({
    meta: [
      { title: "All Categories — Aura Vibe Online Store" },
      {
        name: "description",
        content:
          "Browse every Aura Vibe category: beauty, home & kitchen, fashion, electronics, pets, groceries and more with cash on delivery in Pakistan.",
      },
      { property: "og:title", content: "All Categories — Aura Vibe Online Store" },
      {
        property: "og:description",
        content: "Explore 34 shopping categories with sub-categories and flash-sale prices.",
      },
    ],
  }),
  component: CategoriesPage,
});

function CategoriesPage() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [search, setSearch] = useState("");
  const products = useQuery({ queryKey: ["products"], queryFn: fetchProducts });

  const active = SIDEBAR_CATEGORIES[activeIndex] ?? SIDEBAR_CATEGORIES[0]!;

  const matches = useMemo(() => {
    const words = active.name.toLowerCase().split(/[^a-z]+/).filter((w) => w.length > 3);
    const all = products.data ?? [];
    const hits = all.filter((product) => {
      const text = `${product.name} ${product.description}`.toLowerCase();
      return words.some((word) => text.includes(word));
    });
    return hits.length > 0 ? hits : all;
  }, [products.data, active.name]);

  return (
    <div className="min-h-screen pb-20">
      <ShopHeader search={search} onSearchChange={setSearch} />
      <IncentivesBanner />

      <div className="flex">
        <aside className="no-scrollbar h-[calc(100vh-8rem)] w-32 shrink-0 overflow-y-auto border-r border-border bg-muted/60">
          {SIDEBAR_CATEGORIES.map((category, index) => {
            const isActive = index === activeIndex;
            return (
              <button
                key={category.name}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={`w-full px-2.5 py-3.5 text-left text-[12px] leading-tight transition-colors ${
                  isActive
                    ? "bg-background font-bold text-foreground"
                    : "font-medium text-muted-foreground"
                }`}
              >
                {category.name}
              </button>
            );
          })}
        </aside>

        <div className="no-scrollbar h-[calc(100vh-8rem)] flex-1 overflow-y-auto px-3 pb-6">
          <div className="flex items-center justify-between py-2.5">
            <h1 className="truncate text-sm font-bold">{active.name}</h1>
            <span className="flex shrink-0 items-center text-[11px] font-semibold text-deal">
              View all
              <ChevronRight className="size-3.5" />
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {active.subs.map((sub) => (
              <span
                key={sub}
                className="rounded-lg bg-secondary px-1.5 py-2 text-center text-[10px] leading-tight font-semibold text-secondary-foreground"
              >
                {sub}
              </span>
            ))}
          </div>

          <h2 className="mt-4 mb-2 text-[13px] font-bold">Popular in {active.name}</h2>
          <div className="grid grid-cols-2 gap-2">
            {matches.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
