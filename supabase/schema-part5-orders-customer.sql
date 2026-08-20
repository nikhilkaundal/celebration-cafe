-- Schema Part 5: Add customer_id FK to orders table
-- Links authenticated customer accounts to their orders

-- Add customer_id column (nullable to preserve existing orders)
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL;

-- Create index for fast lookups by customer
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);

-- RLS: Allow authenticated customers to SELECT their own orders
CREATE POLICY "Customers can view own orders"
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (customer_id = auth.uid());

-- RLS: Allow authenticated customers to SELECT their own order_items (via order)
CREATE POLICY "Customers can view own order items"
  ON public.order_items
  FOR SELECT
  TO authenticated
  USING (
    order_id IN (
      SELECT id FROM public.orders WHERE customer_id = auth.uid()
    )
  );
