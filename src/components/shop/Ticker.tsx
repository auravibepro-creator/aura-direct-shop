export function Ticker({ messages }: { messages: string[] }) {
  if (messages.length === 0) return null;
  const loop = [...messages, ...messages];

  return (
    <div className="deal-gradient overflow-hidden py-1.5 text-deal-foreground">
      <div className="flex w-max animate-ticker items-center gap-10 pr-10">
        {loop.map((message, index) => (
          <span key={`${message}-${index}`} className="text-[12px] font-semibold whitespace-nowrap">
            {message}
          </span>
        ))}
      </div>
    </div>
  );
}
