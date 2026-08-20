# 🍕 Celebration Food Cafe — Web Application

> **Full-Stack Restaurant & Cafe Platform** for **Celebration Food Cafe, Hamirpur, Himachal Pradesh**.  
> Built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, and **Supabase (Realtime WebSockets + Auth + Postgres RLS)**.

---

## 🌟 Key Features

### 🛒 Customer Experience
- **Interactive Menu & Smart Cart**: Category filtering, Veg/Non-Veg indicators, custom notes, sticky cart sidebar.
- **Google OAuth & Secure Login**: 1-click Google authentication with automated profile creation.
- **⚡ Real-Time Live Order Tracking**: Swiggy/Zomato style 5-stage live order progress tracker (`Pending` → `Preparing 🍳` → `Food Ready 📦` → `Out for Delivery 🛵` → `Delivered 🎉`). Powered by Supabase Realtime WebSockets.
- **Audio Chime & Confetti**: Live sound alerts on order stage advancement and confetti celebration burst on delivery.
- **My Profile & Order History**: Editable customer details (Name, Phone, Delivery Address) and reorder functionality.

### 👑 Cafe Staff & Owner Admin Portal (`/admin/login`)
- **Live Kanban Orders Dashboard**: Real-time incoming order columns with audio notification chimes.
- **Order Stage Controls**: Advance orders from kitchen to delivery with single clicks.
- **Menu & Offer Management**: Live menu item availability toggles, price updates, and promo coupon management.
- **Staff Management**: Owner & employee role permissions.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Custom Tokens (Pine, Marigold, Maroon, Stone, Charcoal)
- **Database & Auth**: Supabase (Postgres Database, Row Level Security, Google OAuth, Realtime WebSockets)
- **Icons & Motion**: Lucide React + Framer Motion (Motion for React)
- **Notifications**: Sonner Toast Notifications

---

## 🚀 Quick Setup Instructions

1. **Clone the repository**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/celebration-cafe.git
   cd celebration-cafe
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
   ```

4. **Run Database Migrations**:
   Execute the SQL scripts in `supabase/` directory in your Supabase SQL Editor:
   - `schema.sql` (Base tables: categories, menu_items, orders, order_items)
   - `schema-part2-roles.sql` (Staff & admin roles)
   - `schema-part4-customers.sql` (Customer profiles)
   - `schema-part5-orders-customer.sql` (Customer order linking)

5. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

---

## 📱 URL Routes

- **Customer Website**: `http://localhost:3000`
- **Online Order Menu**: `http://localhost:3000/order`
- **Customer Login**: `http://localhost:3000/login`
- **Customer Profile**: `http://localhost:3000/profile`
- **My Orders & Live Tracking**: `http://localhost:3000/orders`
- **Staff & Admin Portal**: `http://localhost:3000/admin/login`

---

## 🎨 Brand Palette

- **Pine (Primary Dark)**: `#1F3B2C`
- **Marigold (Accent Yellow)**: `#E8A93B`
- **Maroon (Secondary)**: `#7A2E2E`
- **Stone (Light Background)**: `#FAF7F0`
- **Charcoal (Dark Text)**: `#2A2622`

---

Developed for **Celebration Food Cafe**, Hamirpur, HP.
