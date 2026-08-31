import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Flame } from "lucide-react";

import { ShopHeader } from "@/components/shop/ShopHeader";
import { BottomNav } from "@/components/shop/BottomNav";
import { CategoryTabs } from "@/components/shop/CategoryTabs";
import { IncentivesBanner } from "@/components/shop/IncentivesBanner";
import { ProductCard } from "@/components/shop/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { RewardBox } from "@/components/shop/RewardBox";
import { fetchCategories, fetchProducts, fetchTabs } from "@/lib/shop";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Aura Vibe — Beauty, Skincare & Personal Care Deals" },
      {
        name: "description",
        content:
          "Flash deals on cosmetics, hair removal sprays, nail polish thinner, face masks and personal care. Order in seconds on WhatsApp.",
      },
      { property: "og:title", content: "Aura Vibe — Beauty, Skincare & Personal Care Deals" },
      {
        property: "og:description",
        content: "Flash deals on cosmetics, masks and personal care. Cash on delivery in Pakistan.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("All");

  const categories = useQuery({ queryKey: ["categories"], queryFn: fetchCategories });
  const products = useQuery({ queryKey: ["products"], queryFn: fetchProducts });
  const tabs = useQuery({ queryKey: ["tabs"], queryFn: fetchTabs, staleTime: 60_000 });

  const tabNames = useMemo(() => {
    const names = (tabs.data ?? []).map((tab) => tab.name);
    return names.includes("All") ? names : ["All", ...names];
  }, [tabs.data]);
  const activeTabRow = useMemo(
    () => (tabs.data ?? []).find((tab) => tab.name === activeTab) ?? null,
    [tabs.data, activeTab],
  );

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    const tabTerm = activeTab === "All" ? "" : activeTab.toLowerCase();
    const tabId = activeTab === "All" ? null : (activeTabRow?.id ?? null);
    const filtered = (products.data ?? []).filter((product) => {
      const text = `${product.name} ${product.description}`.toLowerCase();
      const matchesCategory = !activeCategory || product.category_id === activeCategory;
      const matchesTerm = !term || text.includes(term);
      const matchesTab = !tabTerm || product.tab_id === tabId || text.includes(tabTerm);
      return matchesCategory && matchesTerm && matchesTab;
    });
    // Keep the grid populated when a tab has no dedicated inventory yet.
    if (filtered.length === 0 && tabTerm && !term && !activeCategory) return products.data ?? [];
    return filtered;
  }, [products.data, search, activeCategory, activeTab, activeTabRow]);

  const flashDeals = useMemo(
    () => (products.data ?? []).filter((product) => product.is_featured).slice(0, 6),
    [products.data],
  );

  return (
    <div className="min-h-screen pb-20">
      <ShopHeader search={search} onSearchChange={setSearch} />

      <CategoryTabs tabs={tabNames} active={activeTab} onChange={setActiveTab} />
      <IncentivesBanner />

      <section id="categories" className="scroll-mt-28 px-3 pt-4">
        <h2 className="mb-2 font-display text-lg font-bold">Shop by category</h2>
        <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
          <CategoryBubble
            label="All"
            icon="🛍️"
            active={activeCategory === null}
            onClick={() => setActiveCategory(null)}
          />
          {(categories.data ?? []).map((category) => (
            <CategoryBubble
              key={category.id}
              label={category.name}
              icon={category.icon}
              hot={category.is_hot}
              active={activeCategory === category.id}
              onClick={() =>
                setActiveCategory(activeCategory === category.id ? null : category.id)
              }
            />
          ))}
        </div>
      </section>

      {flashDeals.length > 0 && !search && !activeCategory ? (
        <section className="mt-5 px-3">
          <div className="flex items-center gap-1.5">
            <Flame className="size-5 text-deal" />
            <h2 className="font-display text-lg font-bold">Flash deals</h2>
            <span className="ml-auto rounded-full deal-gradient px-2 py-0.5 text-[10px] font-bold text-deal-foreground">
              Limited time
            </span>
          </div>
          <div className="no-scrollbar mt-2 flex gap-3 overflow-x-auto pb-1">
            {flashDeals.map((product) => (
              <div key={product.id} className="w-36 shrink-0">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-5 px-3">
        <h2 className="mb-2 font-display text-lg font-bold">
          {activeCategory
            ? (categories.data ?? []).find((c) => c.id === activeCategory)?.name
            : search
              ? `Results for “${search}”`
              : "Picked for you"}
        </h2>

        {products.isPending ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-56 rounded-2xl" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No products found. Try another search.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {visible.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      <RewardBox />
      <BottomNav />
    </div>
  );
}

function CategoryBubble({
  label,
  icon,
  hot,
  active,
  onClick,
}: {
  label: string;
  icon: string;
  hot?: boolean;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className="w-18 shrink-0 text-center">
      <span
        className={`relative flex size-16 items-center justify-center rounded-full text-2xl transition-transform ${
          active
            ? "brand-gradient text-primary-foreground scale-105"
            : "bg-secondary text-secondary-foreground"
        }`}
      >
        {icon}
        {hot ? (
          <span className="absolute -top-1 -right-1 rounded-full bg-hot px-1.5 py-px text-[9px] font-bold text-deal-foreground">
            HOT
          </span>
        ) : null}
      </span>
      <span className="mt-1 block text-[10px] leading-tight font-medium">{label}</span>
    </button>
  );
}
