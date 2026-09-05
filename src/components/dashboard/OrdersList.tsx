import { MapPin, Phone } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPKR } from "@/lib/shop";
import { ORDER_STATUSES, mapsUrl, type OrderRow, type OrderStatus } from "@/lib/orders";

type Props = {
  orders: OrderRow[];
  emptyLabel?: string;
  onStatusChange?: (order: OrderRow, status: OrderStatus) => void;
  assignSlot?: (order: OrderRow) => React.ReactNode;
};

const statusTone: Record<OrderStatus, string> = {
  pending: "bg-secondary text-secondary-foreground",
  confirmed: "bg-primary/15 text-primary",
  packed: "bg-primary/15 text-primary",
  dispatched: "bg-deal/15 text-deal",
  delivered: "bg-success/15 text-success",
  cancelled: "bg-destructive/15 text-destructive",
};

export function OrdersList({ orders, emptyLabel = "No orders yet.", onStatusChange, assignSlot }: Props) {
  if (orders.length === 0) {
    return <p className="rounded-xl bg-card p-4 text-xs text-muted-foreground card-shadow">{emptyLabel}</p>;
  }

  return (
    <div className="space-y-2">
      {orders.map((order) => (
        <article key={order.id} className="rounded-2xl bg-card p-3 card-shadow">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{order.customer_name}</p>
              <p className="text-[11px] text-muted-foreground">
                {order.order_code} · {new Date(order.created_at).toLocaleString()}
              </p>
            </div>
            <Badge className={`shrink-0 ${statusTone[order.status] ?? "bg-secondary"}`}>{order.status}</Badge>
          </div>

          <p className="mt-2 text-[11px] text-muted-foreground">{order.address}</p>

          <ul className="mt-2 space-y-0.5 text-[11px]">
            {(order.order_items ?? []).map((item) => (
              <li key={item.id} className="flex justify-between gap-2">
                <span className="min-w-0 truncate">
                  {item.quantity} × {item.name}
                  {item.variant ? ` · ${item.variant}` : ""}
                </span>
                <span className="font-semibold">{formatPKR(Number(item.line_total))}</span>
              </li>
            ))}
          </ul>

          <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
            <span className="text-[11px] text-muted-foreground">
              {order.payment_method.toUpperCase()} · {order.currency}
            </span>
            <span className="text-sm font-extrabold text-deal">{formatPKR(Number(order.total))}</span>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Button asChild size="sm" variant="outline" className="h-8 text-[11px]">
              <a href={`tel:${order.customer_phone}`}>
                <Phone className="size-3.5" /> Call
              </a>
            </Button>
            <Button asChild size="sm" variant="outline" className="h-8 text-[11px]">
              <a href={mapsUrl(order)} target="_blank" rel="noopener noreferrer">
                <MapPin className="size-3.5" /> Route
              </a>
            </Button>
            {onStatusChange ? (
              <select
                className="h-8 rounded-md border border-input bg-background px-2 text-[11px]"
                value={order.status}
                onChange={(event) => onStatusChange(order, event.target.value as OrderStatus)}
                aria-label={`Status for ${order.order_code}`}
              >
                {ORDER_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            ) : null}
            {assignSlot?.(order)}
          </div>
        </article>
      ))}
    </div>
  );
}
