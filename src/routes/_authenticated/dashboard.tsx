import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { LogOut, Loader2 } from "lucide-react";

import { ShopHeader } from "@/components/shop/ShopHeader";
import { OrdersList } from "@/components/dashboard/OrdersList";
import { AdminTeamPanel } from "@/components/dashboard/AdminTeamPanel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { ROLE_LABELS, primaryRole, useAuth, type AppRole } from "@/lib/auth";
import { fetchOrders, updateOrder, type OrderRow, type OrderStatus } from "@/lib/orders";
import { formatPKR } from "@/lib/shop";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

type StaffSettings = {
  base_salary: number;
  commission_percent: number;
  monthly_target: number;
  is_active: boolean;
};

function DashboardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, profile, roles, hasRole, loading, signOut } = useAuth();
  const [tab, setTab] = useState<string>("orders");

  const role = primaryRole(roles);
  const isAdmin = hasRole("admin");
  const isSupport = hasRole("agent");
  const isSales = hasRole("sales");
  const isDelivery = hasRole("delivery");

  const ordersQuery = useQuery({
    queryKey: ["dashboard-orders", user?.id, role],
    enabled: Boolean(user?.id),
    queryFn: () => {
      if (isAdmin || isSupport) return fetchOrders();
      if (isSales) return fetchOrders({ salesAgentId: user!.id });
      if (isDelivery) return fetchOrders({ deliveryAgentId: user!.id });
      return fetchOrders({ userId: user!.id });
    },
  });

  const settingsQuery = useQuery({
    queryKey: ["staff-settings", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async (): Promise<StaffSettings | null> => {
      const { data, error } = await supabase
        .from("staff_settings")
        .select("base_salary,commission_percent,monthly_target,is_active")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const row = data as StaffSettings;
      return {
        base_salary: Number(row.base_salary),
        commission_percent: Number(row.commission_percent),
        monthly_target: Number(row.monthly_target),
        is_active: row.is_active,
      };
    },
  });

  const orders = ordersQuery.data ?? [];

  const stats = useMemo(() => {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const thisMonth = orders.filter((order) => new Date(order.created_at) >= monthStart);
    const completed = thisMonth.filter((order) => order.status === "delivered");
    const turnover = completed.reduce((sum, order) => sum + Number(order.total), 0);
    const percent = settingsQuery.data?.commission_percent ?? 0;
    return {
      monthCount: thisMonth.length,
      completedCount: completed.length,
      pendingCount: thisMonth.filter((order) => !["delivered", "cancelled"].includes(order.status)).length,
      turnover,
      commission: (turnover * percent) / 100,
      salary: settingsQuery.data?.base_salary ?? 0,
      target: settingsQuery.data?.monthly_target ?? 0,
      percent,
    };
  }, [orders, settingsQuery.data]);

  async function changeStatus(order: OrderRow, status: OrderStatus) {
    try {
      await updateOrder(order.id, { status });
      await queryClient.invalidateQueries({ queryKey: ["dashboard-orders"] });
      toast.success(`${order.order_code} marked ${status}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update the order.");
    }
  }

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await signOut();
    navigate({ to: "/auth", replace: true });
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  const canManage = isAdmin || isSupport || isSales || isDelivery;

  return (
    <div className="min-h-screen pb-20">
      <ShopHeader title="My dashboard" showBack />

      <section className="mx-3 mt-3 rounded-2xl bg-card p-4 card-shadow">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h1 className="truncate font-display text-lg font-bold">
              {profile?.full_name || user?.email}
            </h1>
            <p className="text-[11px] text-muted-foreground">{user?.email}</p>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {(roles.length > 0 ? roles : (["user"] as AppRole[])).map((item) => (
                <Badge key={item} className="bg-primary/15 text-primary">
                  {ROLE_LABELS[item]}
                </Badge>
              ))}
            </div>
          </div>
          <Button size="sm" variant="outline" className="h-8 text-[11px]" onClick={() => void handleSignOut()}>
            <LogOut className="size-3.5" /> Sign out
          </Button>
        </div>
      </section>

      <section className="mx-3 mt-3 grid grid-cols-2 gap-2">
        <StatCard label={canManage ? "Orders this month" : "My orders this month"} value={String(stats.monthCount)} />
        <StatCard label="Completed" value={String(stats.completedCount)} />
        <StatCard label="In progress" value={String(stats.pendingCount)} />
        <StatCard label="Turnover (delivered)" value={formatPKR(stats.turnover)} />
        {isSales || isDelivery ? (
          <>
            <StatCard label={`Commission @ ${stats.percent}%`} value={formatPKR(stats.commission)} />
            <StatCard label="Monthly package" value={formatPKR(stats.salary)} />
            <StatCard
              label="Target progress"
              value={stats.target > 0 ? `${Math.min(100, Math.round((stats.turnover / stats.target) * 100))}%` : "—"}
            />
            <StatCard label="Est. payout" value={formatPKR(stats.salary + stats.commission)} />
          </>
        ) : null}
      </section>

      <div className="mx-3 mt-4">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full">
            <TabsTrigger className="flex-1 text-[11px]" value="orders">
              {canManage ? "Orders" : "My orders"}
            </TabsTrigger>
            {isDelivery ? (
              <TabsTrigger className="flex-1 text-[11px]" value="route">
                Route
              </TabsTrigger>
            ) : null}
            {isAdmin ? (
              <TabsTrigger className="flex-1 text-[11px]" value="team">
                Team
              </TabsTrigger>
            ) : null}
          </TabsList>

          <TabsContent value="orders" className="mt-3">
            {ordersQuery.isLoading ? (
              <p className="rounded-xl bg-card p-4 text-xs text-muted-foreground card-shadow">Loading orders…</p>
            ) : (
              <OrdersList
                orders={orders}
                emptyLabel={
                  canManage
                    ? "No orders assigned to you yet."
                    : "You haven't placed any orders with this account yet."
                }
                {...(canManage ? { onStatusChange: changeStatus } : {})}
              />
            )}
            {!canManage ? (
              <Button asChild className="mt-3 w-full brand-gradient text-primary-foreground">
                <Link to="/">Start shopping</Link>
              </Button>
            ) : null}
          </TabsContent>

          {isDelivery ? (
            <TabsContent value="route" className="mt-3 space-y-2">
              <div className="rounded-xl bg-card p-3 text-[11px] text-muted-foreground card-shadow">
                Customers to visit today, with tap-to-open maps for each stop.
              </div>
              <OrdersList
                orders={orders.filter((order) => !["delivered", "cancelled"].includes(order.status))}
                emptyLabel="No pending deliveries. Nice work!"
                onStatusChange={changeStatus}
              />
            </TabsContent>
          ) : null}

          {isAdmin ? (
            <TabsContent value="team" className="mt-3">
              <AdminTeamPanel />
            </TabsContent>
          ) : null}
        </Tabs>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-card p-3 card-shadow">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-base font-extrabold text-foreground">{value}</p>
    </div>
  );
}
