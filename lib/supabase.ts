import { createClient } from "@supabase/supabase-js";

const rawUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ---- Types matching supabase/schema.sql ----
export type Category = {
  id: string;
  name: string;
  display_order: number;
};

export type MenuItem = {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_veg: boolean;
  is_available: boolean;
};

export type OrderType = "dine-in" | "pickup" | "delivery";
export type OrderStatus =
  | "pending"
  | "preparing"
  | "ready"
  | "out-for-delivery"
  | "completed"
  | "cancelled";

export type Order = {
  id: string;
  order_type: OrderType;
  customer_name: string;
  phone: string;
  address: string | null;
  status: OrderStatus;
  total_amount: number;
  payment_status: string;
  notes: string | null;
  created_at: string;
};

export type OrderItem = {
  id: string;
  order_id: string;
  menu_item_id: string;
  item_name: string;
  quantity: number;
  price_at_order: number;
  item_notes: string | null;
};

export type StaffRole = "owner" | "employee";

export type Staff = {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  created_at?: string;
};

export type Offer = {
  id: string;
  title: string;
  description: string | null;
  coupon_code: string;
  discount_type: "flat" | "percent";
  discount_value: number;
  is_active: boolean;
  valid_until: string | null;
  created_at?: string;
};

