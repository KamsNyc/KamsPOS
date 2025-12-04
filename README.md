# KamsPOS - Pizzeria Point of Sale System

A production-ready POS web application built for pizzerias, optimized for touchscreen terminals and phone/in-store ordering workflows.

## Tech Stack

- **Frontend:** Next.js 16 (App Router) + React 19 + TypeScript
- **Styling:** Tailwind CSS 4
- **Authentication:** Clerk
- **Database:** PostgreSQL on Supabase
- **ORM:** Prisma 7
- **Deployment:** Vercel

## Features

- **3-Panel Touchscreen-Optimized Dashboard** - Fast order entry with large, touch-friendly controls
- **Customer Management** - Search by phone, create customers on-the-fly for phone orders
- **Menu Management** - Categories, items, pricing, availability
- **Order Processing** - Pickup, Delivery, and Dine-In order types
- **Receipt Printing** - Optimized for 80mm thermal receipt printers
- **Order History** - Filterable, paginated order history with reprint support
- **Multi-Terminal Support** - All terminals share the same Supabase database
- **On-Screen Keypads** - Numeric keypads for phone numbers and quantities (no physical keyboard needed)

## Getting Started

### Prerequisites

- Node.js 18+ and pnpm
- Clerk account (for authentication)
- Supabase account (for PostgreSQL database)

### Installation

1. **Clone and install dependencies:**

```bash
pnpm install
```

2. **Set up environment variables:**

Create a `.env.local` file in the root directory:

```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Supabase Database (from Supabase Dashboard -> Settings -> Database -> Connection string -> URI)
DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres

# Supabase API (optional, for future features)
NEXT_PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

3. **Run database migrations:**

```bash
pnpm prisma migrate dev
```

4. **Seed the database with sample menu items:**

```bash
pnpm db:seed
```

This will create:
- Menu categories (Pizza, Sides, Drinks)
- Sample menu items (pizzas, sides, drinks)
- Sample customers for testing

5. **Start the development server:**

```bash
pnpm dev
```

6. **Open your browser:**

Navigate to `http://localhost:3000` and sign in with Clerk.

## Deployment to Vercel

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-repo-url>
git push -u origin main
```

### 2. Deploy to Vercel

1. Go to [Vercel](https://vercel.com) and import your GitHub repository
2. Add environment variables in Vercel project settings:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
   - `DATABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_URL` (optional)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (optional)

3. Configure Clerk:
   - In Clerk Dashboard, add your Vercel domain to "Allowed redirect URLs"
   - Set sign-in redirect to: `https://your-domain.vercel.app/dashboard`
   - Set sign-up redirect to: `https://your-domain.vercel.app/dashboard`

4. Run migrations on production:

After first deploy, run migrations against production database:

```bash
pnpm prisma migrate deploy
```

Or use Vercel's build command to auto-run migrations:

Add to `package.json`:

```json
{
  "scripts": {
    "postinstall": "prisma generate",
    "vercel-build": "prisma migrate deploy && next build"
  }
}
```

### 3. Seed Production Database (Optional)

```bash
DATABASE_URL=your_production_url pnpm db:seed
```

## Project Structure

```
app/
  ├── (auth)/              # Clerk auth pages
  ├── components/
  │   └── dashboard/       # POS dashboard components
  ├── dashboard/           # Main POS dashboard
  │   ├── page.tsx         # 3-panel POS interface
  │   └── orders/          # Order history page
  ├── api/                 # API routes
  │   ├── customers/       # Customer CRUD
  │   ├── menu/            # Menu listing
  │   └── orders/          # Order CRUD
  ├── orders/[id]/receipt/ # Receipt print view
  └── lib/
      └── prisma.ts        # Prisma client singleton

prisma/
  ├── schema.prisma        # Database schema
  ├── seed.ts              # Seed script
  └── migrations/          # Database migrations
```

## Key Workflows

### Phone Order Flow

1. Staff clicks "New Order"
2. Selects order type (Pickup/Delivery)
3. Enters phone number using on-screen keypad
4. System searches for existing customer
5. If found: shows customer info and default address
6. If not found: prompts to create new customer
7. Staff adds menu items to order
8. Completes order with payment method
9. Receipt automatically prints

### Dine-In Order Flow

1. Staff clicks "New Order"
2. Selects "Dine-In"
3. No customer required
4. Adds items and completes order

## Production Checklist

- [ ] Run database migrations (`pnpm prisma migrate deploy`)
- [ ] Seed menu items (`pnpm db:seed`)
- [ ] Configure Clerk redirect URLs for production domain
- [ ] Test receipt printing on actual thermal printer
- [ ] Verify multi-terminal ordering (test on 2+ devices)
- [ ] Set up admin users in Clerk and promote to ADMIN role in database
- [ ] Update pizzeria name/address/phone in receipt template (`app/orders/[id]/receipt/page.tsx`)

## Admin Features (Coming Soon)

- Menu item management (add/edit/delete)
- User role management
- Reports and analytics

## Support

For issues or questions, please open an issue on GitHub.

---

Built with ❤️ for pizzerias
