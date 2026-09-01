import { DEFAULT_TICKER_STYLE, type TickerStyle } from "@/lib/shop";

export function Ticker({
  messages,
  style = DEFAULT_TICKER_STYLE,
}: {
  messages: string[];
  style?: TickerStyle;
}) {
  if (messages.length === 0 || !style.enabled) return null;
  const loop = [...messages, ...messages];

  return (
    <div
      className="overflow-hidden"
      style={{
        minHeight: `${style.height}px`,
        display: "flex",
        alignItems: "center",
        color: style.text_color,
        backgroundImage: `linear-gradient(100deg, ${style.bg_from}, ${style.bg_to})`,
      }}
    >
      <div
        className="flex w-max items-center animate-ticker"
        style={{
          gap: `${style.gap}px`,
          paddingRight: `${style.gap}px`,
          animationDuration: `${style.speed}s`,
        }}
      >
        {loop.map((message, index) => (
          <span
            key={`${message}-${index}`}
            className="whitespace-nowrap"
            style={{
              fontSize: `${style.font_size}px`,
              fontWeight: style.bold ? 700 : 500,
              lineHeight: 1.2,
            }}
          >
            {message}
          </span>
        ))}
      </div>
    </div>
  );
}
