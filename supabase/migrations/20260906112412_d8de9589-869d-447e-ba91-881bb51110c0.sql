-- 1. Orders: restrict guest/user inserts to their own, unassigned, pending orders
DROP POLICY IF EXISTS "Anyone can place an order" ON public.orders;

CREATE POLICY "Place own or guest order"
ON public.orders
FOR INSERT
TO anon, authenticated
WITH CHECK (
  (user_id IS NULL OR user_id = auth.uid())
  AND sales_agent_id IS NULL
  AND delivery_agent_id IS NULL
  AND commission_amount = 0
  AND status = 'pending'
);

-- 2. Order items: must belong to an order the requester just created
DROP POLICY IF EXISTS "Anyone can add order items" ON public.order_items;

CREATE POLICY "Add items to own new order"
ON public.order_items
FOR INSERT
TO anon, authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_items.order_id
      AND o.created_at > now() - interval '30 minutes'
      AND (
        o.user_id = auth.uid()
        OR (o.user_id IS NULL AND auth.uid() IS NULL)
      )
  )
);

-- 3. SECURITY DEFINER functions: only trigger-owned / self-scoped access
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
      AND (_user_id = auth.uid() OR auth.uid() IS NULL)
  )
$$;

REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;