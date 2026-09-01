import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Ticker } from "@/components/shop/Ticker";
import { adminGetTickerStyle, adminSaveTickerStyle } from "@/lib/admin.functions";
import { DEFAULT_TICKER_STYLE, normalizeTickerStyle, type TickerStyle } from "@/lib/shop";

const PRESETS: { label: string; from: string; to: string; text: string }[] = [
  { label: "Deal red", from: "#e23c1f", to: "#f07a20", text: "#ffffff" },
  { label: "Brand purple", from: "#5b2a86", to: "#a13fa8", text: "#ffffff" },
  { label: "Gold", from: "#f4b73f", to: "#ffd98a", text: "#3a2600" },
  { label: "Ink", from: "#141420", to: "#3a3a52", text: "#ffffff" },
];

export function TickerStylePanel({
  password,
  previewMessages,
}: {
  password: string;
  previewMessages: string[];
}) {
  const getStyle = useServerFn(adminGetTickerStyle);
  const saveStyle = useServerFn(adminSaveTickerStyle);
  const [style, setStyle] = useState<TickerStyle>(DEFAULT_TICKER_STYLE);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    getStyle({ data: { password } })
      .then((res) => {
        if (active) setStyle(normalizeTickerStyle(res.value));
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [getStyle, password]);

  const set = <K extends keyof TickerStyle>(key: K, value: TickerStyle[K]) =>
    setStyle((prev) => ({ ...prev, [key]: value }));

  const messages =
    previewMessages.length > 0 ? previewMessages : ["Flash deal · Free shipping over Rs. 2,500"];

  return (
    <div className="space-y-4 rounded-2xl bg-card p-4 card-shadow">
      <div>
        <h3 className="text-sm font-semibold">Ticker appearance</h3>
        <p className="text-xs text-muted-foreground">
          Adjust the announcement bar thickness, text size, speed and colors.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        <Ticker messages={messages} style={style} />
      </div>

      <div className="flex items-center justify-between rounded-xl bg-secondary px-3 py-2">
        <Label className="text-xs">Show ticker</Label>
        <Switch checked={style.enabled} onCheckedChange={(v) => set("enabled", v)} />
      </div>

      <SliderRow
        label="Thickness / height"
        suffix="px"
        min={16}
        max={80}
        value={style.height}
        onChange={(v) => set("height", v)}
      />
      <SliderRow
        label="Text size"
        suffix="px"
        min={9}
        max={28}
        value={style.font_size}
        onChange={(v) => set("font_size", v)}
      />
      <SliderRow
        label="Scroll duration"
        suffix="s"
        min={5}
        max={120}
        value={style.speed}
        onChange={(v) => set("speed", v)}
      />
      <SliderRow
        label="Gap between messages"
        suffix="px"
        min={8}
        max={120}
        value={style.gap}
        onChange={(v) => set("gap", v)}
      />

      <div className="flex items-center justify-between rounded-xl bg-secondary px-3 py-2">
        <Label className="text-xs">Bold text</Label>
        <Switch checked={style.bold} onCheckedChange={(v) => set("bold", v)} />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <ColorRow label="Color A" value={style.bg_from} onChange={(v) => set("bg_from", v)} />
        <ColorRow label="Color B" value={style.bg_to} onChange={(v) => set("bg_to", v)} />
        <ColorRow label="Text" value={style.text_color} onChange={(v) => set("text_color", v)} />
      </div>

      <div>
        <Label className="text-xs">Presets</Label>
        <div className="mt-2 flex flex-wrap gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() =>
                setStyle((prev) => ({
                  ...prev,
                  bg_from: preset.from,
                  bg_to: preset.to,
                  text_color: preset.text,
                }))
              }
              className="rounded-full px-3 py-1 text-[11px] font-semibold"
              style={{
                backgroundImage: `linear-gradient(100deg, ${preset.from}, ${preset.to})`,
                color: preset.text,
              }}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => setStyle(DEFAULT_TICKER_STYLE)}
        >
          Reset
        </Button>
        <Button
          disabled={busy}
          className="flex-1 brand-gradient text-primary-foreground"
          onClick={async () => {
            setBusy(true);
            try {
              await saveStyle({ data: { password, style } });
              toast.success("Ticker style saved");
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Could not save ticker style");
            } finally {
              setBusy(false);
            }
          }}
        >
          Save ticker style
        </Button>
      </div>
    </div>
  );
}

function SliderRow({
  label,
  value,
  min,
  max,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  suffix: string;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-xs">{label}</Label>
        <span className="text-xs font-semibold text-muted-foreground">
          {value}
          {suffix}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          className="h-2 w-full flex-1 accent-primary"
        />
        <Input
          inputMode="numeric"
          value={String(value)}
          onChange={(event) => {
            const next = Number(event.target.value);
            if (!Number.isFinite(next)) return;
            onChange(Math.min(max, Math.max(min, next)));
          }}
          className="h-8 w-16 text-center text-xs"
        />
      </div>
    </div>
  );
}

function ColorRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <input
        type="color"
        value={value.slice(0, 7)}
        onChange={(event) => onChange(event.target.value)}
        aria-label={label}
        className="h-9 w-full cursor-pointer rounded-lg border border-border bg-card"
      />
    </div>
  );
}
