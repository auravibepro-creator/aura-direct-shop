import { TOP_TABS } from "@/lib/taxonomy";

type Props = {
  active: string;
  onChange: (tab: string) => void;
};

/** Temu-style horizontally scrolling top category bar with an underlined active tab. */
export function CategoryTabs({ active, onChange }: Props) {
  return (
    <div className="no-scrollbar flex gap-5 overflow-x-auto border-b border-border bg-background px-3">
      {TOP_TABS.map((tab) => {
        const isActive = tab === active;
        return (
          <button
            key={tab}
            type="button"
            onClick={() => onChange(tab)}
            className={`relative shrink-0 py-2.5 text-[15px] whitespace-nowrap transition-colors ${
              isActive ? "font-bold text-foreground" : "font-medium text-muted-foreground"
            }`}
          >
            {tab}
            {isActive ? (
              <span className="absolute bottom-1 left-1/2 h-[3px] w-5 -translate-x-1/2 rounded-full bg-foreground" />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
