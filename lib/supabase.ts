import { createClient } from "@supabase/supabase-js";

const rawUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ---- Roles ----
export type UserRole = "owner" | "manager" | "worker" | "customer";

// ---- Profiles (unified table replacing staff + customers) ----
export type Profile = {
  id: string;
  role: UserRole;
  full_name: string;
  email: string | null;
  phone: string | null;
  status: "active" | "deactivated";
  created_at: string;
  updated_at: string;
};

// ---- Legacy aliases (for gradual migration of existing components) ----
export type StaffRole = "owner" | "manager" | "worker";
export type Staff = {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  created_at?: string;
};

// ---- Categories ----
export type Category = {
  id: string;
  name: string;
  display_order: number;
  is_active?: boolean;
};

// ---- Menu Items ----
export type MenuItem = {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_veg: boolean;
  is_available: boolean;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
};

// ---- Item Customizations ----
export type ItemCustomization = {
  id: string;
  menu_item_id: string;
  group_name: string;
  is_required: boolean;
  max_select: number;
  sort_order: number;
  created_at?: string;
  options?: CustomizationOption[]; // populated via join
};

export type CustomizationOption = {
  id: string;
  customization_id: string;
  label: string;
  extra_price: number;
  is_available: boolean;
  sort_order: number;
  created_at?: string;
};

// ---- Orders ----
export type OrderType = "dine-in" | "pickup" | "delivery";
export type OrderStatus =
  | "pending"
  | "confirmed"
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
  subtotal: number;
  discount: number;
  delivery_fee: number;
  total_amount: number;
  coupon_id: string | null;
  customer_id: string | null;
  payment_status: string;
  notes: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

export type OrderItem = {
  id: string;
  order_id: string;
  menu_item_id: string;
  item_name: string;
  quantity: number;
  price_at_order: number;
  item_notes: string | null;
  selected_customizations: SelectedCustomization[];
};

export type SelectedCustomization = {
  group: string;
  option: string;
  option_id: string;
  extra_price: number;
};

// ---- Coupons ----
export type CouponDiscountType = "flat" | "percent";

export type Coupon = {
  id: string;
  code: string;
  discount_type: CouponDiscountType;
  value: number;
  min_order_value: number;
  max_discount: number | null;
  usage_limit: number | null;
  per_user_limit: number;
  valid_from: string | null;
  valid_to: string | null;
  is_active: boolean;
  is_template?: boolean;
  created_by: string | null;
  created_at: string;
};

export type CouponUsage = {
  id: string;
  coupon_id: string;
  customer_id: string;
  order_id: string;
  used_at: string;
};

// ---- Offers (display banners — separate from coupons) ----
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

// ---- Addresses ----
export type Address = {
  id: string;
  customer_id: string;
  label: string;
  receiver_name?: string | null;
  receiver_phone?: string | null;
  line1: string;
  line2?: string | null;
  landmark?: string | null;
  city: string;
  state?: string | null;
  pincode: string;
  latitude?: number | null;
  longitude?: number | null;
  is_default: boolean;
  created_at: string;
  updated_at?: string;
};

// ---- Audit Logs ----
export type AuditLog = {
  id: string;
  actor_id: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
};

// ---- Staff Invites ----
export type StaffInvite = {
  id: string;
  email: string;
  name: string;
  role: string;
  created_at: string;
};
