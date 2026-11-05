# ☕ Brew & Bean — Artisanal Coffee Shop (Supabase Guest Integration)

A modern, responsive e-commerce web application for **Brew & Bean Artisanal Coffee Roasters**. Built using HTML5, CSS3, Vanilla JavaScript, and **Supabase PostgreSQL** backend.

> **Zero Login System**: Customers can explore the full menu, customize cup sizes, add items to cart, checkout as a guest, track orders in real-time, and manage subscriptions with zero account registration or passwords.

---

## 📁 Project Structure

```
COFFEE-WEB/
│
├── index.html                # Homepage with hero, categories, bestsellers, and reviews
├── menu.html                 # Full dynamic menu with categories, search, and sorting
├── product.html              # Dynamic coffee details, cup size selector, and gallery
├── cart.html                 # Shopping cart with size badges, quantities, and coupons
├── checkout.html             # Guest checkout with delivery details and payment options
├── order-confirmation.html   # Post-checkout confirmation screen with order reference
├── track-order.html          # Order tracking lookup with visual delivery progress stepper
├── subscription.html         # Simple (₹49) and Premium (₹99) coffee club memberships
│
├── css/
│   ├── styles.css            # Global typography, color variables, buttons, and layout
│   ├── home.css              # Homepage-specific hero, marquee, and feature styles
│   └── pages.css             # Page layouts (menu, product, cart, checkout, tracking)
│
├── js/
│   ├── supabase.js           # Centralized Supabase JS client configuration
│   ├── data.js               # Initial seed data and review testimonials
│   ├── cart.js               # LocalStorage cart management and toast notifications
│   ├── products.js           # Dynamic product & category fetch from Supabase
│   ├── checkout.js           # Guest checkout validation & server-side order creation
│   ├── orders.js             # Order confirmation page renderer
│   ├── tracking.js           # Secure order tracking (Order # + Phone Number)
│   ├── subscription.js       # Simple & Premium subscriptions and cancellation
│   └── main.js               # Navigation toggles, countdown timer, and utilities
│
├── database/
│   └── schema.sql            # Complete PostgreSQL schema, RLS policies, and RPC functions
│
├── supabase/
│   └── functions/            # Supabase Edge Functions
│       ├── create-order/     # Edge Function for trusted order creation
│       ├── track-order/      # Edge Function for order tracking
│       └── create-subscription/ # Edge Function for guest subscriptions
│
└── README.md
```

---

## ⚡ Supabase Configuration & Setup

### 1. Project Credentials
The frontend uses the centralized configuration in [`js/supabase.js`](file:///c:/Users/harik/OneDrive/Desktop/COFFEE-WEB/js/supabase.js):

- **Project URL:** `https://szjrhlxsghjwxapjnmvj.supabase.co`
- **Publishable Key:** `sb_publishable_OoxS1p90-MIoXDpQbE9LKg_BvhkEcHi`

> **Security Note:** Only the publishable key is present in client-side code. The secret service role key is never used or exposed in frontend JavaScript.

### 2. Setting Up the Database in Supabase (1-Minute Setup)
1. Open your [Supabase Dashboard](https://supabase.com/dashboard/project/szjrhlxsghjwxapjnmvj).
2. Navigate to **SQL Editor** in the left sidebar.
3. Open [`database/schema.sql`](file:///c:/Users/harik/OneDrive/Desktop/COFFEE-WEB/database/schema.sql), copy its entire contents, and paste it into the Supabase SQL editor.
4. Click **Run**.

This one script:
- Creates all 5 tables (`categories`, `products`, `orders`, `order_items`, `subscriptions`).
- Enables **Row Level Security (RLS)** on all tables.
- Creates public read policies for available products and categories while locking down sensitive order and subscription tables.
- Installs the secure PostgreSQL stored procedures:
  - `create_guest_order`: Server-side price recalculation, delivery fee computation (Free >= ₹499, else ₹49), unique order number generation, and atomic insertion.
  - `track_guest_order`: Verified tracking requiring **both** Order Number and Customer Phone Number.
  - `create_guest_subscription`: Enforces plan pricing (₹49 / ₹99) and prevents duplicate active subscriptions for the same customer phone.
  - `cancel_guest_subscription`: Verified guest subscription cancellation.
- Seeds 6 initial categories and 16 handcrafted coffee products.

---

## 🛒 Complete Guest Shopping Workflow

### 1. Browse & Search ([menu.html](file:///c:/Users/harik/OneDrive/Desktop/COFFEE-WEB/menu.html))
- Fetches all available products dynamically from Supabase `products`.
- Real-time text search across product names, descriptions, and notes.
- Category filtering with pills (Espresso, Cappuccino, Latte, Cold Coffee, Frappuccino, Tea & Snacks).
- Sorting by Price (Low to High, High to Low), Rating, and Review counts.

### 2. Product Details & Customization ([product.html](file:///c:/Users/harik/OneDrive/Desktop/COFFEE-WEB/product.html))
- Loads product by `?id=` from Supabase.
- Interactive Cup Size Selector (`S` 240ml, `M` 350ml, `L` 450ml) with dynamic price calculation matching server validation:
  - **Small (S):** `Base Price - ₹30` (min ₹50)
  - **Medium (M):** `Base Price`
  - **Large (L):** `Base Price + ₹40`
- Quantity selector and one-click "Add to Cart" or "Buy Now".

### 3. Shopping Cart ([cart.html](file:///c:/Users/harik/OneDrive/Desktop/COFFEE-WEB/cart.html))
- Persistent across page reloads via browser `localStorage`.
- Live quantity increment/decrement and item removal.
- Promo coupon support (`BEAN20` for 20% off, `BREW10` for 10% off).
- Free delivery threshold calculation (Orders >= ₹499 get free shipping; otherwise ₹49).

### 4. Guest Checkout ([checkout.html](file:///c:/Users/harik/OneDrive/Desktop/COFFEE-WEB/checkout.html))
- Form inputs: Full Name, Mobile Number, Email, Street Address, City, Pincode.
- Payment Options:
  - **Cash on Delivery (Recommended):** Order created with status `Pending` payment verification.
  - **UPI / Online (Demo Simulation):** Ready for Razorpay payment gateway integration.
- Submits order to Supabase RPC `create_guest_order`.
- Server recalculates prices directly from the database table to prevent client-side tampering.
- Clears the cart automatically upon order success and redirects to `order-confirmation.html`.

### 5. Order Tracking ([track-order.html](file:///c:/Users/harik/OneDrive/Desktop/COFFEE-WEB/track-order.html))
- Accessible without logging in.
- Requires:
  1. **Order Number** (e.g., `BB-20241030-4921`)
  2. **Mobile Number** (10 digits)
- Renders visual progress stepper:
  `Pending` ➔ `Confirmed` ➔ `Preparing` ➔ `Out for Delivery` ➔ `Delivered` (or `Cancelled`).
- Shows full itemized list, delivery address, and payment status.

### 6. Coffee Subscriptions ([subscription.html](file:///c:/Users/harik/OneDrive/Desktop/COFFEE-WEB/subscription.html))
- **Simple Plan (₹49/month):** Weekly exclusive coffee offers, member discounts, monthly special offers.
- **Premium Plan (₹99/month):** All Simple perks, 10% store discount, exclusive micro-lots, priority support.
- Guest subscription modal requiring Full Name, Email, and Phone Number.
- Duplicate subscription prevention: Checks if the phone number already has an active subscription.
- Cancellation self-service: Customers can cancel anytime using their Subscription Reference and Phone Number.

---

## 🧪 Testing Checklist

All 14 core features have been tested and verified:

1. **Product fetching:** Fetches all available products from Supabase `products` table with local fallback.
2. **Category filtering:** Live filter pills accurately filter between roasts and snacks.
3. **Product searching:** Live debounce search filters cards instantly.
4. **Add to cart:** Adds item with selected size and quantity; updates navbar badges immediately.
5. **Remove from cart:** Deletes item from cart and recalculates subtotal and tax.
6. **Quantity updates:** Plus/minus buttons update quantities without page refresh.
7. **Cart persistence:** Cart persists in `localStorage` across all pages and browser sessions.
8. **Checkout validation:** Ensures full name, valid phone number, and address are provided before submitting.
9. **Order creation:** Invokes `create_guest_order` RPC with server-side price recalculation.
10. **Order items insertion:** Inserts corresponding line items into `order_items` linked to the order.
11. **Order confirmation:** Displays order reference ID and link to live tracking.
12. **Order tracking:** Verifies both Order Number and Phone Number before displaying status stepper.
13. **Subscription creation:** Creates guest subscription record in `subscriptions` table.
14. **Subscription status & cancellation:** Prevents duplicate active subscriptions and supports cancellation.

