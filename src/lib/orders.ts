import { supabase } from "@/integrations/supabase/client";

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "packed",
  "dispatched",
  "delivered",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export type OrderItemRow = {
  id: string;
  order_id: string;
  product_id: string | null;
  name: string;
  variant: string | null;
  image: string | null;
  unit_price: number;
  quantity: number;
  line_total: number;
};

export type OrderRow = {
  id: string;
  order_code: string;
  user_id: string | null;
  customer_name: string;
  customer_phone: string;
  address: string;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  subtotal: number;
  shipping: number;
  total: number;
  currency: string;
  payment_method: string;
  status: OrderStatus;
  sales_agent_id: string | null;
  delivery_agent_id: string | null;
  commission_amount: number;
  notes: string;
  created_at: string;
  order_items?: OrderItemRow[];
};

export type GeoPoint = { latitude: number; longitude: number; accuracy: number | null };

/** Best-effort GPS capture; never blocks checkout. */
export function captureLocation(timeoutMs = 8000): Promise<GeoPoint | null> {
  if (typeof navigator === "undefined" || !navigator.geolocation) return Promise.resolve(null);
  return new Promise((resolve) => {
    let settled = false;
    const done = (value: GeoPoint | null) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };
    const timer = setTimeout(() => done(null), timeoutMs);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        clearTimeout(timer);
        done({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy ?? null,
        });
      },
      () => {
        clearTimeout(timer);
        done(null);
      },
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 60_000 },
    );
  });
}

export type NewOrderInput = {
  customerName: string;
  customerPhone: string;
  address: string;
  city?: string | null;
  subtotal: number;
  shipping: number;
  total: number;
  paymentMethod?: string;
  location?: GeoPoint | null;
  items: {
    productId: string | null;
    name: string;
    variant: string | null;
    image: string | null;
    unitPrice: number;
    quantity: number;
  }[];
};

/**
 * Persists the order (guests included) so the ledger, sales and delivery
 * dashboards have real data. Returns the stored order code.
 */
export async function createOrder(input: NewOrderInput): Promise<{ id: string; order_code: string }> {
  const { data: sessionData } = await supabase.auth.getSession();

  const { data, error } = await supabase
    .from("orders")
    .insert({
      user_id: sessionData.session?.user.id ?? null,
      customer_name: input.customerName,
      customer_phone: input.customerPhone,
      address: input.address,
      city: input.city ?? null,
      latitude: input.location?.latitude ?? null,
      longitude: input.location?.longitude ?? null,
      location_accuracy: input.location?.accuracy ?? null,
      subtotal: input.subtotal,
      shipping: input.shipping,
      total: input.total,
      payment_method: input.paymentMethod ?? "cod",
    })
    .select("id, order_code")
    .single();

  if (error) throw error;
  const order = data as { id: string; order_code: string };

  if (input.items.length > 0) {
    const { error: itemsError } = await supabase.from("order_items").insert(
      input.items.map((item) => ({
        order_id: order.id,
        product_id: item.productId,
        name: item.name,
        variant: item.variant,
        image: item.image,
        unit_price: item.unitPrice,
        quantity: item.quantity,
        line_total: item.unitPrice * item.quantity,
      })),
    );
    if (itemsError) throw itemsError;
  }

  return order;
}

export const ORDER_SELECT =
  "id,order_code,user_id,customer_name,customer_phone,address,city,latitude,longitude,subtotal,shipping,total,currency,payment_method,status,sales_agent_id,delivery_agent_id,commission_amount,notes,created_at,order_items(id,order_id,product_id,name,variant,image,unit_price,quantity,line_total)";

export async function fetchOrders(filter?: {
  salesAgentId?: string;
  deliveryAgentId?: string;
  userId?: string;
}): Promise<OrderRow[]> {
  let query = supabase.from("orders").select(ORDER_SELECT).order("created_at", { ascending: false }).limit(300);
  if (filter?.salesAgentId) query = query.eq("sales_agent_id", filter.salesAgentId);
  if (filter?.deliveryAgentId) query = query.eq("delivery_agent_id", filter.deliveryAgentId);
  if (filter?.userId) query = query.eq("user_id", filter.userId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as OrderRow[];
}

export async function updateOrder(
  id: string,
  patch: Partial<{
    status: OrderStatus;
    sales_agent_id: string | null;
    delivery_agent_id: string | null;
    commission_amount: number;
    notes: string;
  }>,
) {
  const { error } = await supabase.from("orders").update(patch).eq("id", id);
  if (error) throw error;
}

export function mapsUrl(order: Pick<OrderRow, "latitude" | "longitude" | "address">) {
  if (order.latitude != null && order.longitude != null) {
    return `https://www.google.com/maps/search/?api=1&query=${order.latitude},${order.longitude}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.address)}`;
}

/** Haversine distance in km between two points. */
export function distanceKm(from: GeoPoint, to: { latitude: number; longitude: number }) {
  const R = 6371;
  const dLat = ((to.latitude - from.latitude) * Math.PI) / 180;
  const dLon = ((to.longitude - from.longitude) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((from.latitude * Math.PI) / 180) *
      Math.cos((to.latitude * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
