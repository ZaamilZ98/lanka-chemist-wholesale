# Lanka Chemist Wholesale - Project Guidelines

## Project Overview
This is a wholesale pharmacy e-commerce website for Lanka Chemist in Sri Lanka. See PROJECT_SPEC.md for the complete feature specification.

Target customers: SLMC registered medical practitioners (doctors, dentists), pharmacies, private health clinics, dispensaries, dentistries, and other registered business entities that can legally buy and sell medication.

---

## REQUIRED SKILLS - READ BEFORE CODING

**CRITICAL: Before implementing any feature, you MUST read the relevant skill file. Do not skip this step.**

| Task | Skill File | When to Read |
|------|------------|--------------|
| **ALL frontend/UI work** | `skills/frontend-design.md` | Before building ANY page, component, or styling |
| **PDF generation** | `skills/pdf.md` | Before implementing invoices, receipts, or any PDF export |
| **Excel/CSV reports** | `skills/xlsx.md` | Before implementing admin reports or data exports |
| **Word documents** | `skills/docx.md` | Before implementing any document generation |

### Frontend Design Requirements (CRITICAL)
Before writing ANY frontend code, read `skills/frontend-design.md` and follow these rules:
- **AVOID** generic "AI slop" aesthetics: no purple gradients, no Inter/Roboto fonts, no cookie-cutter centered layouts
- **CREATE** a professional, trustworthy design suitable for medical professionals
- **USE** distinctive typography and colors that reflect the "Lanka Chemist" brand
- **ENSURE** mobile responsiveness for doctors ordering from their phones
- **DESIGN** for credibility - this is a medical/pharmaceutical business

---

## Development Rules

### Before Writing Any Code
1. Read PROJECT_SPEC.md to understand the complete requirements
2. Read the relevant skill file(s) for the feature area you're working on
3. Ask clarifying questions if any requirement is unclear
4. Propose your implementation approach before writing code
5. Wait for confirmation on the approach before proceeding

### During Development
1. After completing each feature, verify it matches the specification in PROJECT_SPEC.md
2. Run the application and test that the feature works correctly
3. Check for console errors and warnings - fix them before moving on
4. Test on mobile viewport sizes
5. Review code for security vulnerabilities (see Security Checklist below)
6. Handle edge cases (empty states, errors, loading states)

### After Each Feature
1. Demonstrate that the feature works as specified
2. List any deviations from the specification and explain why
3. Confirm no console errors exist
4. Update the Progress Tracking section below

---

## Code Quality Standards

1. Write clean, readable code with meaningful comments
2. Use consistent naming conventions throughout the project
3. Handle errors gracefully with user-friendly messages
4. Validate all user inputs on both frontend AND backend
5. Sanitize all data before database operations
6. Use TypeScript for type safety where possible
7. Keep components small and focused on single responsibilities
8. Write reusable code - avoid duplication

---

## Security Requirements (CRITICAL)

This is a pharmacy website handling sensitive medical practitioner data. Security is paramount.

### Authentication & Sessions
- [ ] Hash all passwords using bcrypt (never store plain text)
- [ ] Implement proper session management with secure cookies
- [ ] Set appropriate session timeouts
- [ ] Protect all admin routes with authentication middleware
- [ ] Rate limit login attempts (max 5 attempts, then 15-minute lockout)

### Data Protection
- [ ] Use parameterized queries to prevent SQL injection
- [ ] Sanitize all user inputs to prevent XSS attacks
- [ ] Validate file uploads (SLMC ID, NMRA License photos):
  - Only allow image formats (jpg, jpeg, png, pdf)
  - Limit file size (max 5MB)
  - Scan/validate file headers, not just extensions
  - Store outside web root with randomized filenames
- [ ] Never expose sensitive data in API responses
- [ ] Never log passwords or sensitive credentials

### Infrastructure
- [ ] Use HTTPS in production (SSL certificate)
- [ ] Set secure HTTP headers (CORS, CSP, etc.)
- [ ] Keep dependencies updated
- [ ] Sanitize error messages (don't expose stack traces to users)

---

## Security Review Checklist

Run this checklist after completing each feature:
```
[ ] No SQL injection vulnerabilities (using parameterized queries)
[ ] No XSS vulnerabilities (sanitizing user input, escaping output)
[ ] Authentication required where needed
[ ] Authorization checked (users can only access their own data)
[ ] File uploads validated and secured
[ ] Sensitive data not exposed in responses or logs
[ ] Error messages don't reveal system details
[ ] Rate limiting in place for sensitive endpoints
```

---

## Testing Checklist

After implementing each feature:
```
[ ] Feature works as specified in PROJECT_SPEC.md
[ ] No console errors or warnings
[ ] Mobile responsive (test at 375px, 768px, 1024px widths)
[ ] Form validation works (required fields, format validation)
[ ] Error states handled gracefully
[ ] Loading states shown during async operations
[ ] Empty states handled (no data, no results)
[ ] Edge cases tested (very long text, special characters, etc.)
[ ] Security review completed
```

---

## Tech Stack

- **Framework:** Next.js 15 (App Router) — single project for frontend + API routes
- **Language:** TypeScript 5, React 19
- **Styling:** Tailwind CSS 4
- **Database:** PostgreSQL via Supabase (free tier)
- **Image Storage:** Cloudflare R2 (S3-compatible)
- **Auth:** bcryptjs (password hashing) + jsonwebtoken (JWT sessions)
- **Email:** Resend (or Amazon SES)
- **Distance Calc:** Haversine formula (no external API)

## File Structure

Unified Next.js project (no separate backend):
```
lanka-chemist-wholesale/
├── CLAUDE.md                       # This file - development guidelines
├── PROJECT_SPEC.md                 # Complete feature specification
├── .env.example                    # Environment variable template
├── .env.local                      # Local env values (gitignored)
├── package.json                    # All dependencies
├── tsconfig.json
├── next.config.ts                  # R2 image domains configured
├── postcss.config.mjs
│
├── src/
│   ├── app/
│   │   ├── globals.css             # Tailwind import
│   │   ├── layout.tsx              # Root layout with metadata
│   │   ├── page.tsx                # Homepage
│   │   ├── products/               # Product pages
│   │   ├── cart/                   # Cart page
│   │   ├── checkout/               # Checkout flow
│   │   ├── account/                # Customer account pages
│   │   ├── auth/                   # Login/register pages
│   │   ├── admin/                  # Admin panel pages
│   │   └── api/                    # API routes (replaces separate backend)
│   │       ├── auth/               # Login, register, session
│   │       ├── products/           # Product CRUD & search
│   │       ├── cart/               # Cart operations
│   │       ├── orders/             # Order placement & management
│   │       ├── customers/          # Customer management
│   │       ├── upload/             # File/image uploads
│   │       └── admin/              # Admin-specific endpoints
│   ├── components/                 # Reusable UI components
│   ├── lib/                        # Utility functions & clients
│   │   ├── constants.ts            # Enums, labels, config values
│   │   ├── haversine.ts            # Distance & delivery fee calc
│   │   ├── r2.ts                   # Cloudflare R2 S3 client
│   │   └── supabase/
│   │       ├── server.ts           # Service-role client (API routes)
│   │       └── browser.ts          # Anon-key client (browser)
│   ├── hooks/                      # Custom React hooks
│   └── types/
│       └── database.ts             # TypeScript types for all tables
│
├── public/                         # Static assets (logo, icons)
│
└── database/
    ├── schema.sql                  # Full PostgreSQL schema (14 tables)
    ├── migrations/                 # Schema migrations
    └── seeds/
        └── sample_data.sql         # 10 manufacturers, 17 categories, 14 products
```

---

## Environment Variables

See `.env.example` for the full template. Key variables:
```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=         # Project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=    # Anon key (public, browser-safe)
SUPABASE_SERVICE_ROLE_KEY=        # Service role key (server only)

# Auth
JWT_SECRET=                       # Min 32 chars, random
SESSION_SECRET=                   # Min 32 chars, random

# Cloudflare R2
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=lanka-chemist-images
R2_PUBLIC_URL=

# Email (Resend)
RESEND_API_KEY=
EMAIL_FROM=noreply@lankachemist.lk

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

---

## Progress Tracking

Update this checklist as features are completed:

### Phase 1 - MVP
- [x] **Project Setup**
  - [x] Initialize Next.js 15 project (App Router + TypeScript + Tailwind 4)
  - [x] Set up API routes structure (unified, no separate backend)
  - [x] Set up Supabase client (server + browser)
  - [x] Configure environment variables (.env.example + .env.local)
  - [x] Set up Cloudflare R2 client for image storage
  - [x] Create full database schema (14 tables, indexes, triggers, full-text search)
  - [x] Create TypeScript types for all database tables
  - [x] Create seed data (manufacturers, categories, sample products)
  - [x] Create constants/labels file (order statuses, dosage forms, upload limits)
  - [x] Create Haversine distance utility for delivery fee calc

- [x] **Product Catalog**
  - [x] Database schema for products
  - [x] Product listing page with grid view
  - [x] Product detail page
  - [x] Search functionality
  - [x] Filter by: in-stock, prescription/OTC, drug class, dosage form, manufacturer
  - [x] Sort by: name, price, newest, popularity
  - [x] Category organization (Medicines, Surgical, Equipment, SPC)
  - [x] SPC section with Rs 50,000 minimum notice

- [x] **Image Management**
  - [x] Image upload functionality
  - [x] Automatic watermarking with "Lanka Chemist"
  - [x] Multiple images per product
  - [x] Image optimization

- [x] **Customer Registration & Authentication**
  - [x] Registration form with required fields
  - [x] SLMC ID / NMRA License photo upload
  - [x] Login functionality
  - [x] Password hashing
  - [x] Session management
  - [x] "Pending Verification" status for new accounts

- [x] **Account Verification System**
  - [x] Admin view of pending registrations
  - [x] Document viewing for admin
  - [x] Approve/reject functionality with reason
  - [x] Email notification on approval/rejection

- [x] **Shopping Cart**
  - [x] Add to cart (logged in users only)
  - [x] Update quantities
  - [x] Remove items
  - [x] Cart persistence
  - [x] Stock validation

- [x] **Order Placement**
  - [x] Order review page
  - [x] Delivery method selection (pickup, standard, express)
  - [x] Delivery address entry
  - [x] Order notes field
  - [x] "We may contact you" notice
  - [x] Order confirmation page
  - [x] Order number generation

- [x] **Admin Panel - Foundation & Dashboard**
  - [x] Admin layout with sidebar nav + top bar + mobile hamburger
  - [x] Admin login page and auth flow (JWT, rate limiting, cookie)
  - [x] Admin setup endpoint (one-time first admin creation)
  - [x] Admin auth API routes (login, me, logout)
  - [x] Middleware: /admin routes redirect to /admin/login, login exclusion
  - [x] Storefront header hidden on admin pages
  - [x] Shared admin components (StatCard, DataTable, StatusBadge, PageHeader, EmptyState)
  - [x] Today's orders and revenue
  - [x] Pending orders count
  - [x] Low stock alerts
  - [x] Pending verifications count
  - [x] Recent orders table
  - [x] Low stock products list

- [x] **Admin Panel - Product Management**
  - [x] Add new product
  - [x] Edit product
  - [x] Hide/show product
  - [x] Delete product (soft delete for products with order references)
  - [x] Duplicate product
  - [x] Bulk CSV import
  - [x] Quick price update (bulk price editor)
  - [x] Stock adjustment with reason (+ stock movement audit trail)

- [x] **Admin Panel - Order Management**
  - [x] Order list with filters
  - [x] Order status workflow (New → Confirmed → Packing → Ready → Dispatched → Delivered)
  - [x] Update order status
  - [x] Print picking list
  - [x] Print invoice
  - [x] Cancel order (with required reason)

- [x] **Admin Panel - Customer Management**
  - [x] Customer list with search/filter
  - [x] View customer details
  - [x] View uploaded documents
  - [x] Approve/reject customers (with reason for rejection)
  - [x] View customer order history
  - [x] Add notes to customer
  - [x] Block/suspend account

- [x] **Email Notifications**
  - [x] Order confirmation email
  - [x] Order status update emails
  - [x] Account verification status email
  - [x] Admin notification for new orders
  - [x] Admin notification for new registrations

- [x] **Invoice Generation** (Read PDF skill first)
  - [x] Auto-generate PDF invoice
  - [x] Include pharmacy NMRA license
  - [x] Itemized product list
  - [x] Customer details
  - [x] Bank details for transfer
  - [x] Email invoice to customer

### Phase 2 - Enhancements
- [ ] **Delivery Calculation**
  - [x] Haversine formula implementation
  - [x] Rs 25/km rate calculation
  - [x] "Subject to change" notice
  - [ ] Address caching

- [ ] **Quick Reorder**
  - [ ] View past orders
  - [ ] Repeat order with one click

- [ ] **Reports** (Read XLSX skill first)
  - [ ] Sales reports by period
  - [ ] Best-selling products report
  - [ ] Customer purchase analysis
  - [ ] Inventory movement report
  - [ ] Outstanding orders report

- [ ] **Product Alternatives**
  - [ ] Suggest same generic drug alternatives
  - [ ] Suggest similar therapeutic class products
  - [ ] Show when item is out of stock

### Phase 3 - Future
- [ ] Advanced analytics dashboard
- [ ] Mobile app (future consideration)

---

## When Stuck or Encountering Errors

1. **Read the error message carefully** - it often tells you exactly what's wrong
2. **Check the relevant skill file** - it may have guidance for the issue
3. **Re-read PROJECT_SPEC.md** - make sure you understand the requirement correctly
4. **Show the full error** - include stack trace and context
5. **Explain what you tried** - helps identify the root cause
6. **Ask for clarification** - don't guess if unsure

---

## Important Reminders

1. **Always read the skill file before implementing a feature in that area**
2. **Security is critical** - this handles medical practitioner data
3. **Test on mobile** - many doctors will order from their phones
4. **Professional design** - this needs to look trustworthy for medical professionals
5. **Follow the specification** - check PROJECT_SPEC.md for exact requirements
6. **Ask before assuming** - clarify unclear requirements before implementing
