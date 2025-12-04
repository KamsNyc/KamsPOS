# KamsPOS - Pizzeria Point-of-Sale System

## Overview

KamsPOS is a **production-ready point-of-sale (POS) web application** designed specifically for pizzerias. It is an internal staff-only system optimized for fast order entry during phone calls and in-store transactions. The system supports multiple POS terminals reading/writing from the same central database, making it suitable for real pizzeria operations.

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 16 (App Router) + React 19 + TypeScript |
| **Styling** | Tailwind CSS 4 |
| **Authentication** | Supabase Auth + Custom PIN System |
| **Database** | PostgreSQL hosted on Supabase |
| **ORM** | Prisma 7 with PostgreSQL adapter |
| **Icons** | Lucide React + Untitled UI Icons |
| **Deployment** | Vercel-ready |

## Project Structure

```
kamspos/
├── app/
│   ├── api/                       # API routes
│   │   ├── auth/                  # Custom Auth (verify-pin, setup-admin)
│   │   ├── customers/             # Customer CRUD
│   │   ├── menu/                  # Menu fetching
│   │   ├── orders/                # Order management
│   │   └── users/                 # Employee management
│   ├── components/
│   │   └── dashboard/             # POS UI components
│   ├── context/
│   │   └── AuthContext.tsx        # Supabase + Employee Auth
│   ├── dashboard/
│   │   ├── page.tsx               # Main POS interface
│   │   └── orders/page.tsx        # Order history
│   ├── login/                     # Store login page
│   ├── signup/                    # Store signup page
│   ├── select-profile/            # Employee profile selection
│   ├── orders/[id]/receipt/       # Receipt printing
│   ├── lib/
│   │   ├── prisma.ts              # Prisma client singleton
│   │   ├── auth.ts                # Auth helpers (hashing)
│   │   └── supabase/              # Supabase clients
│   ├── globals.css                # Global styles + print CSS
│   ├── layout.tsx                 # Root layout
│   └── page.tsx                   # Landing page
├── prisma/
│   └── schema.prisma              # Database schema
├── middleware.ts                  # Route protection
└── package.json
```

## Database Schema

### Models

**User** - Staff accounts synced from Clerk
- `clerkUserId` (unique) - Links to Clerk identity
- `role` - ADMIN | CASHIER

**Customer** - Customer database (supports 8,000+)
- `phone` (unique, indexed) - Primary lookup field
- `fullName`, `email`, `notes`
- `defaultAddressId` - FK to preferred delivery address

**Address** - Customer addresses
- `customerId` (indexed) - FK to Customer
- `label`, `street`, `city`, `state`, `zip`, `extraDirections`
- `isDefault` - Boolean flag

**MenuCategory** - Menu organization
- `name`, `sortOrder`

**MenuItem** - Menu items
- `categoryId` (indexed) - FK to MenuCategory
- `name`, `description`, `basePrice` (Decimal 10,2)
- `isAvailable`, `sku`

**Order** - All orders
- `orderNumber` (unique, auto-increment)
- `type` - PICKUP | DELIVERY | DINE_IN
- `status` - NEW | IN_PROGRESS | READY | COMPLETED | CANCELLED
- `subtotal`, `tax`, `deliveryFee`, `discountTotal`, `total` (Decimal 10,2)
- `paymentStatus` - UNPAID | PAID | REFUNDED
- `paymentMethod` - CASH | CARD | OTHER
- `customerId`, `placedByUserId`, `deliveryAddressId`, `notes`
- Indexes on `createdAt` and `[customerId, createdAt]`

**OrderItem** - Line items per order
- `orderId` (indexed) - FK to Order
- `menuItemId` - FK to MenuItem
- `nameSnapshot`, `unitPriceSnapshot` - Point-in-time values
- `quantity`, `lineTotal`, `specialInstructions`

## Core Features

### 1. Three-Panel Dashboard (`/dashboard`)

The main POS interface uses a 3-panel layout optimized for touchscreen terminals:

- **Left Sidebar (64px)**: Navigation - New Order, Order History, User Profile
- **Left Panel (280-380px)**: Order type selection + customer search with on-screen keypad
- **Center Panel (flex)**: Menu grid organized by categories
- **Right Panel (360px)**: Order summary/cart with payment buttons

### 2. Order Types

| Type | Phone Required | Customer Required | Address Required |
|------|----------------|-------------------|------------------|
| PICKUP | Yes | Yes | No |
| DELIVERY | Yes | Yes | Yes |
| DINE_IN | No | No | No |

### 3. Customer Management

- **Phone-based search**: Real-time lookup as staff types (600ms debounce, 4+ digits)
- **Quick create**: Inline customer creation during order entry
- **Address management**: Multiple addresses per customer with default selection
- **Customer stats**: Order count, total spent, last order date

### 4. Menu & Cart

- Categories displayed as tabs
- Items shown as grid with name, description, price
- Click to add items (quantity = 1)
- Adjust quantities via on-screen numeric keypad
- Special instructions per item
- Real-time subtotal/tax/total calculation

### 5. Payment & Checkout

- Tax rate: 8% (hardcoded)
- Delivery fee: $5.00 (automatic for delivery orders)
- Payment methods: CASH, CARD, OTHER
- "PAY & PRINT" completes order and triggers receipt printing

### 6. Receipt Printing (`/orders/[id]/receipt`)

Optimized for 80mm thermal receipt printers:
- Auto-triggers `window.print()` on page load
- Monospace font (Courier New) for consistent formatting
- Includes: order number, date/time, customer info, items, totals, payment method
- Reprint accessible from order history

### 7. Order History (`/dashboard/orders`)

- Paginated list (20 per page)
- Filters: status, type, date range (Today, Yesterday, Last 7 Days)
- View/reprint receipts from history

## API Endpoints

### Customers

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/customers` | Search by phone/name with pagination |
| POST | `/api/customers` | Create or update customer |
| GET | `/api/customers/:id` | Get customer with stats and recent orders |
| PATCH | `/api/customers/:id` | Update customer and addresses |

### Menu

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/menu` | Get all categories with available items |

### Orders

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/orders` | List orders with filters and pagination |
| POST | `/api/orders` | Create new order with items |
| GET | `/api/orders/:id` | Get order with full details |

## Authentication

- **Provider**: Supabase Auth (Store Level) + Custom PIN (Employee Level)
- **Protected routes**: `/dashboard/*`, `/orders/*`, `/select-profile`, all API routes
- **Public routes**: `/`, `/login`, `/signup`, `/api/health`, `/api/auth/*`
- **User sync**: Employees are managed in `User` table with hashed PINs

## Key Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `OrderTypeSelector` | `components/dashboard/` | PICKUP/DELIVERY/DINE_IN buttons |
| `CustomerSearch` | `components/dashboard/` | Phone lookup with inline results |
| `PhoneInput` | `components/dashboard/` | Formatted phone input with keypad |
| `MenuPanel` | `components/dashboard/` | Category tabs + item grid |
| `OrderSummary` | `components/dashboard/` | Cart, totals, payment, checkout |
| `NumericKeypad` | `components/dashboard/` | On-screen numeric input |
| `OnScreenKeyboard` | `components/dashboard/` | Full QWERTY for text input |
| `CustomerEditModal` | `components/dashboard/` | Edit customer info and addresses |

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
DATABASE_URL=postgresql://...
```

## Business Logic Constants

- **Tax rate**: 8%
- **Delivery fee**: $5.00
- **Phone search minimum**: 4 digits
- **Search debounce**: 600ms
- **Page size**: 20 orders per page

## Development Notes

### Running Locally

```bash
npm install
npx prisma generate
npx prisma db push  # or migrate
npm run dev
```

### Database Seeding

Seed data should include:
- Menu categories (Pizza, Sides, Drinks, Desserts)
- Menu items with prices
- Sample customers with addresses

### Multi-Terminal Support

All POS terminals connect to the same Supabase PostgreSQL database. Orders and customers are immediately visible across all terminals.

## Design Philosophy

1. **Speed over features**: Minimal clicks, large touch targets, keyboard shortcuts
2. **Phone-first workflow**: Staff handles phone calls while entering orders
3. **Reliability**: Simple architecture, no complex state management
4. **Clarity**: Clear visual hierarchy, obvious actions, consistent patterns
5. **Print-ready**: Receipt layout works with standard thermal printers

## Color Scheme

- **Primary**: Emerald green (#10b981, #059669)
- **Background**: Dark neutrals (neutral-950, neutral-900)
- **Text**: Light neutrals (neutral-50, neutral-300)
- **Accents**: Red (delete), Yellow (pending), Green (completed)

## Typography

- **Font**: Geist Sans (Next.js variable font)
- **Prices**: Monospace for alignment
- **Sizes**: 12px (labels) to 32px (headings)

---

## Optimization Opportunities

This section documents potential optimizations for the dashboard components. **Only implement if necessary** - the current implementation works and is stable.

### Component Analysis

#### 1. MenuPanel (`components/dashboard/MenuPanel.tsx`)

**Current behavior:**
- Fetches `/api/menu` on every mount via `useEffect` with empty dependency array `[]`
- Menu data rarely changes (categories, items, prices are static day-to-day)

**Current code (lines 29-46):**
```typescript
useEffect(() => {
  const fetchMenu = async () => {
    try {
      const response = await fetch("/api/menu");
      const data = await response.json();
      setCategories(data);
      if (data.length > 0) {
        setSelectedCategory(data[0].id);
      }
    } catch (error) {
      console.error("Menu fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  };
  fetchMenu();
}, []);
```

**Issue:** MenuPanel is mounted/unmounted when:
- User selects order type (menu appears)
- User clicks "New Order" (resets state, menu remounts)
- User navigates away and back

Each mount triggers a fresh API call even though menu hasn't changed.

**Optimization: IndexedDB Cache**
- Cache menu data in IndexedDB with 24-hour TTL
- On mount: check cache first, use if valid, otherwise fetch
- Reduces API calls from ~50+/day to 1/day per terminal
- Menu updates (admin changes) can invalidate cache via version stamp

**Implementation approach:**
```typescript
// lib/menuCache.ts
const CACHE_KEY = 'kamspos_menu';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

interface CachedMenu {
  data: MenuCategory[];
  timestamp: number;
  version: string;
}

export async function getCachedMenu(): Promise<MenuCategory[] | null> {
  // Check IndexedDB for valid cache
}

export async function setCachedMenu(data: MenuCategory[]): Promise<void> {
  // Store in IndexedDB with timestamp
}

export async function invalidateMenuCache(): Promise<void> {
  // Clear cache (call from admin menu edit)
}
```

---

#### 2. CustomerSearch (`components/dashboard/CustomerSearch.tsx`)

**Current behavior:**
- Debounced search (600ms) on phone input - ✅ Already optimized
- Searches `/api/customers?phone=...&pageSize=5`
- Auto-selects exact match

**Current code is good:**
```typescript
// Debounce to 600ms to reduce API calls while typing
const timeoutId = setTimeout(() => {
  performSearch();
}, 600);
```

**No optimization needed** - debounce prevents excessive API calls.

---

#### 3. DashboardPage (`dashboard/page.tsx`)

**Current behavior:**
- Fetches customer stats when `selectedCustomer?.id` changes (line 78-106)
- Fetches full customer data when opening edit modal (line 109-122)

**Current code (lines 78-106):**
```typescript
useEffect(() => {
  const fetchCustomerStats = async () => {
    if (!selectedCustomer?.id) {
      setCustomerStats(null);
      return;
    }
    try {
      const response = await fetch(`/api/customers/${selectedCustomer.id}`);
      if (response.ok) {
        const data = await response.json();
        setCustomerStats({...});
        setSelectedCustomer((prev) => ({...prev!, defaultAddress: data.defaultAddress}));
      }
    } catch (error) {...}
  };
  fetchCustomerStats();
}, [selectedCustomer?.id]);
```

**Issue:** Two separate fetches for same customer:
1. When customer selected → fetch stats
2. When edit modal opens → fetch full data again

**Potential optimization:**
- Fetch full customer data once on selection
- Store in state, reuse for edit modal
- Saves 1 API call per customer edit

**Note:** This is minor - only affects users who edit customers frequently.

---

#### 4. OrderSummary (`components/dashboard/OrderSummary.tsx`)

**Current behavior:**
- Pure component - receives items as props
- Calculates totals on every render
- No API calls

**No optimization needed** - calculations are O(n) where n = cart items (typically < 20).

---

### Recommended Priority

| Priority | Component | Optimization | Impact |
|----------|-----------|--------------|--------|
| **HIGH** | MenuPanel | IndexedDB cache (24h TTL) | Reduces API calls ~50x |
| LOW | DashboardPage | Combine customer fetches | Saves 1 call/edit |
| NONE | CustomerSearch | Already debounced | N/A |
| NONE | OrderSummary | Pure calculations | N/A |

---

### Implementation Checklist (When Ready)

#### Menu Cache (HIGH Priority)

- [ ] Create `lib/menuCache.ts` with IndexedDB helpers
- [ ] Update `MenuPanel.tsx` to check cache before fetch
- [ ] Add cache invalidation hook for admin menu changes
- [ ] Add version stamp to detect stale cache after admin updates
- [ ] Test: cache hit, cache miss, cache expiry, cache invalidation

#### Customer Fetch Consolidation (LOW Priority)

- [ ] Modify `handleCustomerSelect` to fetch full customer data
- [ ] Store full customer data in state
- [ ] Update `handleOpenEditModal` to use stored data
- [ ] Remove duplicate fetch in edit modal flow

---

### Cache Strategy Notes

**Why IndexedDB over localStorage:**
- localStorage: 5MB limit, blocks main thread, synchronous
- IndexedDB: 50MB+ limit, async, doesn't block UI

**Cache invalidation triggers:**
- Admin adds/edits/deletes menu item → bump version
- Admin changes category → bump version
- Cache TTL expires (24 hours)
- User manually refreshes (Ctrl+F5)

**Multi-terminal consideration:**
- Each terminal has its own IndexedDB cache
- Admin changes on one terminal won't auto-update others
- 24h TTL ensures all terminals sync within a day
- For immediate sync: could use Supabase realtime (future feature)
