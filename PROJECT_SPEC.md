# Lanka Chemist Wholesale - E-Commerce Website Specification

## Project Overview

- **Project Name:** Lanka Chemist Wholesale
- **Type:** B2B Wholesale Pharmacy E-Commerce Website
- **Target Customers:** SLMC registered medical practitioners (doctors, dentists), pharmacies, private health clinics, dispensaries, dentistries, and other registered business entities that can legally buy and sell medication in Sri Lanka
- **Initial Product Catalog:** 500-1000 products, with plans to expand
- **Watermark Brand Name:** "Lanka Chemist"

---

## Customer Access & Authentication

### Browsing & Login System
- Allow browsing of products without login (for SEO and discovery)
- Require login to view wholesale prices
- Allow account creation with order placement capability
- Orders can only be placed if the following criteria are met:
  - Valid phone number entered
  - Valid photo of ID/license uploaded
  - Delivery address filled in
- Orders remain pending until admin manually approves the customer account
- Display clear messaging to new customers that their account is pending verification

### Customer Registration Requirements
- Upload photo of SLMC ID (for doctors/dentists/medical practitioners)
- Upload NMRA License (for pharmacies/businesses)
- Business name OR name of doctor/dentist
- SLMC ID number OR NMRA License number
- Contact details (phone, email)
- Delivery address

### Account Verification Workflow
- New registrations go to "Pending Verification" status
- Admin receives notification of new registration
- Admin can view uploaded documents
- Admin can approve or reject with reason
- Customer receives email notification of approval/rejection
- Rejected customers can re-upload corrected documents

---

## Product Catalog & Organization

### Product Data Fields
- Generic name (INN - International Nonproprietary Name)
- Brand name
- Manufacturer/Importer
- Drug class/therapeutic category
- Strength and dosage form
- Pack size
- Storage conditions
- Wholesale price (visible only when logged in)
- Maximum Retail Price (MRP) for compliance
- Available stock quantity (real-time)
- Product images (with automatic watermarking)
- Prescription vs OTC classification
- Barcode/SKU

### Product Categories & Organization
- Organize by therapeutic category/drug class
- Organize by dosage form (tablets, capsules, syrup, injection, cream, etc.)
- Organize by manufacturer
- Separate sections for:
  - Medicines
  - Surgical items
  - Medical equipment
  - **SPC (Special Category)** - Display note: "We only offer SPC items on bills above Rs 50,000. Please contact us on our hotline or WhatsApp to discuss directly."

### Search Functionality
- Search by generic name
- Search by brand name
- Search by manufacturer
- Search by therapeutic category
- Search by barcode/SKU
- Autocomplete suggestions
- Search result highlighting

### Filtering Options
- Filter by in-stock only
- Filter by prescription vs OTC
- Filter by drug class
- Filter by dosage form
- Filter by manufacturer

### Sorting Options
- Sort by name (A-Z, Z-A)
- Sort by price (low to high, high to low)
- Sort by newest added
- Sort by popularity/best-selling

---

## Product Images

### Image Management
- Support multiple images per product
- Automatic watermarking on all uploaded product images
- Watermark text: **"Lanka Chemist"**
- Image optimization for fast loading
- Zoom functionality on product detail page
- Thumbnail gallery view

---

## Shopping & Ordering

### Shopping Cart
- Add to cart functionality
- Update quantities in cart
- Remove items from cart
- Cart persistence (saved when logged in)
- Display subtotal, delivery fee, and total
- Stock validation before checkout

### Order Placement
- Review order summary before confirmation
- Select delivery method (store pickup, standard delivery, or express delivery)
- Delivery address selection/entry
- Add order notes/special instructions
- **Display notification to customers: "We may contact you by phone or WhatsApp for order confirmation"**
- Order confirmation page with order number

### Quick Reorder Features
- View past orders
- Repeat past order with single click

---

## Delivery & Pickup

### Delivery Options
- Store pickup (free)
- Standard delivery (calculated by distance)
- Express/urgent delivery - Display message: "Contact us for express delivery pricing"

### Delivery Fee Calculation
- Use Haversine formula for mathematical distance calculation
- Calculate at rate of Rs 25/km from store to delivery address
- **Display clear note: "Delivery fee is subject to change"**
- Cache calculations for repeated addresses

### Delivery Scheduling
- Allow customers to select preferred delivery date

---

## Payment Options

### Accepted Payment Methods
- Cash on delivery
- Bank transfer
- Display bank account details for transfers

### Payment Terms
- No online payment gateway
- No credit/debit card processing
- No minimum order requirements

---

## Invoicing & Documentation

### Invoice Generation
- Auto-generate professional invoices as PDF
- Include pharmacy NMRA license number
- Itemized product list with quantities and prices
- Customer details
- Payment terms and bank details for transfer
- Tax calculations (if applicable)
- PDF download option
- Email invoice to customer automatically

---

## Notifications

### Email Notifications (Free - using Resend or Amazon SES)
- Order confirmation with invoice PDF attached
- Order status updates (processing, packed, ready, dispatched, delivered)
- Account verification status (approved/rejected with reason)
- Dispatch notifications
- Payment receipt confirmation
- Back-in-stock alerts (optional customer subscription)
- New product announcements
- Special offers/promotions newsletter

### Admin Notifications
- Email notification when new order is placed
- Email notification when new customer registers for verification

---

## Admin Panel

### Dashboard Overview
- Today's orders count and revenue
- Pending orders count
- Low stock alerts
- Pending customer verifications count
- Quick access to common actions

### Product Management
- Add new products with all required fields
- Edit existing products
- Hide/show products (for out of stock items)
- Delete products
- Duplicate product function (for similar items)
- Bulk import via CSV
- Quick price updates (bulk edit capability)
- Stock adjustments with reason logging
- Image upload with automatic watermarking ("Lanka Chemist")

### Inventory Management
- View current stock levels
- Update stock quantities
- Low stock threshold alerts (configurable)
- Stock movement history
- Simple stock counting system

### Order Management
- View all orders with filters (by date, status, customer)
- Order status workflow: New → Confirmed → Packing → Ready → Dispatched → Delivered
- Update order status
- Print picking lists
- Print invoices
- Order history with search
- Cancel order functionality
- Refund/return handling notes

### Customer Management
- View all customers with search and filter
- Customer verification workflow (pending → approved/rejected)
- View uploaded verification documents (SLMC ID or NMRA License)
- Approve or reject customers with reason
- View order history per customer
- Add notes to customer accounts
- Block/suspend accounts
- Search and filter customers by status, name, type

### Reports
- Sales reports by period (daily, weekly, monthly, yearly)
- Best-selling products report
- Customer purchase analysis
- Inventory movement report
- Outstanding orders report
- Revenue summary
- Export reports to Excel

---

## Customer Account Features

### My Account Section
- View and edit profile information
- View order history
- Track current orders with status
- Saved addresses management
- Reorder from past orders

### Order Tracking
- Real-time order status updates
- Order history with full details

---

## Quality of Life Features

### Customer Experience
- Mobile-responsive design (works on phones and tablets)
- **Product alternatives suggestions:** Show same generic drug or similar therapeutic class when item is out of stock
- Recently viewed products section
- Price drop alerts (subscribe to product notifications)
- FAQ section for common questions

### Trust & Credibility
- About Us page with pharmacy license and history
- Display NMRA license number prominently
- SSL certificate (HTTPS) for security
- Physical store location and contact information
- WhatsApp contact link for inquiries

---

## Future Features (Phase 3)

### Mobile App
- Native mobile app (future consideration)

### Advanced Reporting
- Advanced analytics dashboard
- Customer segmentation
- Inventory forecasting

---

## Technical Requirements

### Hosting & Infrastructure
- VPS hosting (DigitalOcean, Hetzner, or similar) - approximately $6/month
- Supabase Free Tier for database (500MB PostgreSQL)
- Cloudflare R2 for image storage (free tier - 10GB)
- SSL certificate (Let's Encrypt - free)

### Technology Stack
- **Frontend:** Next.js with Tailwind CSS
- **Backend:** Node.js with Express OR Python with FastAPI
- **Database:** PostgreSQL (via Supabase)
- **Image Processing:** Sharp.js for automatic watermarking
- **Search:** PostgreSQL full-text search
- **Email:** Resend (3,000 free/month) or Amazon SES
- **Distance Calculation:** Haversine formula (free, no API costs)

### Domain
- .lk domain from Register.lk (approximately Rs 4,700/year)

### Estimated Monthly Costs
- Hosting: Rs 1,800 ($6)
- Database: Rs 0 (Supabase free tier)
- Image Storage: Rs 0 (Cloudflare R2 free tier)
- Email: Rs 0-300 (Resend free tier or Amazon SES)
- Domain: Rs 400 (annual cost divided by 12)
- **Total: approximately Rs 2,200-2,500/month**

---

## Development Phases

### Phase 1 - MVP (Minimum Viable Product)
1. Product catalog with search, filter, and sort
2. Customer registration and verification system
3. Basic ordering system with cart
4. Admin panel (products, orders, customers)
5. Email notifications
6. Automatic image watermarking
7. Invoice PDF generation

### Phase 2 - Enhancements
1. Distance-based delivery calculation (Haversine formula)
2. Quick reorder from past orders
3. Enhanced reporting (Excel exports)
4. Customer order history
5. Product alternatives suggestions

### Phase 3 - Future
1. Advanced analytics dashboard
2. Mobile app development

---

## Business Rules Summary

| Rule | Details |
|------|---------|
| Who can browse | Anyone (no login required) |
| Who can see prices | Logged in users only |
| Who can place orders | Logged in users with valid phone, photo, and address |
| Who can have orders confirmed | Manually approved accounts only |
| SPC products | Only on bills above Rs 50,000, contact required |
| Delivery fee | Rs 25/km, subject to change |
| Express delivery | Contact for pricing |
| Payment methods | Cash on delivery, bank transfer only |
| Minimum order | None |

---

## Key Messages to Display

| Location | Message |
|----------|---------|
| Order placement page | "We may contact you by phone or WhatsApp for order confirmation" |
| Delivery fee section | "Delivery fee is subject to change" |
| SPC category | "We only offer SPC items on bills above Rs 50,000. Please contact us on our hotline or WhatsApp to discuss directly." |
| New registration | "Your account is pending verification. You will receive an email once approved." |
| Express delivery option | "Contact us for express delivery pricing" |

---

## Contact Information to Include

- Store phone number / hotline
- WhatsApp number for inquiries
- Email address
- Physical store address
- Operating hours
- NMRA license number

---

