import { useEffect, useState } from "react";
import { Check, ChevronRight, Truck, ShieldCheck, BadgePercent, Clock } from "lucide-react";

const SLIDES = [
  [
    { icon: Check, title: "Free shipping", note: "Limited-time offer" },
    { icon: Truck, title: "Delivery guarantee", note: "Refund for any issue" },
  ],
  [
    { icon: BadgePercent, title: "Price adjustment", note: "Within 30 days" },
    { icon: ShieldCheck, title: "Safe payments", note: "Cash on delivery" },
  ],
  [
    { icon: Clock, title: "Fast dispatch", note: "Ships in 24 hours" },
    { icon: Check, title: "Easy returns", note: "7-day return window" },
  ],
];

/** Auto-rotating incentives strip (Temu-style peach box with green accents). */
export function IncentivesBanner() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setIndex((i) => (i + 1) % SLIDES.length), 3200);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="overflow-hidden bg-promo">
      <div className="flex items-center px-3">
        <div className="relative h-14 min-w-0 flex-1 overflow-hidden">
          {SLIDES.map((slide, slideIndex) => (
            <div
              key={slideIndex}
              className="absolute inset-0 grid grid-cols-2 items-center transition-all duration-500"
              style={{
                transform: `translateY(${(slideIndex - index) * 100}%)`,
                opacity: slideIndex === index ? 1 : 0,
              }}
            >
              {slide.map((item, itemIndex) => (
                <div
                  key={item.title}
                  className={`flex min-w-0 items-center gap-1.5 px-1 ${
                    itemIndex === 1 ? "border-l border-promo-border" : ""
                  }`}
                >
                  <item.icon className="size-4 shrink-0 text-success" />
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-semibold text-success">
                      {item.title}
                    </span>
                    <span className="block truncate text-[11px] text-promo-foreground">
                      {item.note}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
        <ChevronRight className="ml-1 size-5 shrink-0 text-success" />
      </div>
    </div>
  );
}
