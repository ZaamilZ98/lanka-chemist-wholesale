# Lanka Chemist Wholesale

A B2B wholesale pharmacy e-commerce platform for SLMC registered medical practitioners, pharmacies, clinics, and other authorized entities in Sri Lanka.

## Features

### Customer Features
- Browse products without login (prices visible after authentication)
- Customer registration with SLMC ID / NMRA License verification
- Shopping cart with real-time stock validation
- Order placement with delivery options (pickup, standard, express)
- Order tracking and history
- Quick reorder from past orders
- Profile and saved addresses management
- Product alternatives suggestions when items are out of stock
- Recently viewed products

### Admin Features
- Complete dashboard with sales overview and alerts
- Product management (CRUD, bulk import, price updates, stock tracking)
- Order management with status workflow
- Customer verification system
- Comprehensive reports (sales, inventory, customer analysis)
- Invoice generation (PDF with automatic email)
- Image management with automatic watermarking

### Technical Features
- Next.js 15 with App Router
- TypeScript for type safety
- Tailwind CSS for styling
- PostgreSQL database via Supabase
- Cloudflare R2 for image storage
- Automated email notifications via Resend
- Distance-based delivery fee calculation
- Secure authentication with JWT

## Quick Start (Development)

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Copy `.env.example` to `.env.local` and fill in your credentials

3. **Run database migrations:**
   - Create a Supabase project
   - Run `database/schema.sql` in SQL Editor
   - Run `database/seeds/sample_data.sql` for sample data

4. **Start development server:**
   ```bash
   npm run dev
   ```

5. **Create first admin account:**
   Visit `http://localhost:3000/api/admin/setup` and POST:
   ```json
   {
     "email": "admin@example.com",
     "password": "SecurePassword123!",
     "name": "Admin User"
   }
   ```

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete deployment instructions to Vercel.

### Quick Deploy to Vercel

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Deploy:
   ```bash
   vercel
   ```

3. Add environment variables and redeploy:
   ```bash
   vercel --prod
   ```

## Project Structure

```
lanka-chemist-wholesale/
├── src/
│   ├── app/              # Next.js pages and API routes
│   ├── components/       # React components
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utility functions
│   └── types/           # TypeScript types
├── database/            # SQL schema and seeds
├── public/              # Static assets
└── scripts/             # Helper scripts
```

## Environment Variables

Required environment variables:

- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `JWT_SECRET` - Secret for JWT tokens (min 32 chars)
- `SESSION_SECRET` - Secret for sessions (min 32 chars)
- `RESEND_API_KEY` - Resend email API key
- `EMAIL_FROM` - From email address
- `R2_ACCOUNT_ID` - Cloudflare R2 account ID
- `R2_ACCESS_KEY_ID` - R2 access key
- `R2_SECRET_ACCESS_KEY` - R2 secret key
- `R2_BUCKET_NAME` - R2 bucket name
- `R2_PUBLIC_URL` - Public URL for R2 bucket
- `NEXT_PUBLIC_APP_URL` - Application URL

## Documentation

- [PROJECT_SPEC.md](./PROJECT_SPEC.md) - Complete feature specification
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment guide
- [CLAUDE.md](./CLAUDE.md) - Development guidelines

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript 5, React 19
- **Styling:** Tailwind CSS 4
- **Database:** PostgreSQL (Supabase)
- **Storage:** Cloudflare R2
- **Email:** Resend
- **Auth:** bcryptjs + jsonwebtoken

## Security

This application handles sensitive medical practitioner data. Key security features:

- Password hashing with bcryptjs
- JWT-based authentication
- Rate limiting on login attempts
- Input sanitization and validation
- Parameterized database queries
- File upload validation
- Secure HTTP headers

## Support

For technical documentation, see:
- `DEPLOYMENT.md` - Production deployment guide
- `CLAUDE.md` - Development guidelines and progress tracking

## License

Private - All rights reserved
