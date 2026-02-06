# Deployment Checklist

Use this checklist to ensure you complete all deployment steps.

## Before Deployment

### 1. Database Setup (Supabase)
- [ ] Created Supabase project
- [ ] Noted down: NEXT_PUBLIC_SUPABASE_URL
- [ ] Noted down: NEXT_PUBLIC_SUPABASE_ANON_KEY
- [ ] Noted down: SUPABASE_SERVICE_ROLE_KEY
- [ ] Executed `database/schema.sql` in SQL Editor
- [ ] Executed `database/seeds/sample_data.sql` (optional)
- [ ] Executed `scripts/setup-store-settings.sql` and updated values

### 2. Image Storage (Cloudflare R2)
- [ ] Created R2 bucket: `lanka-chemist-images`
- [ ] Enabled public access on bucket
- [ ] Created R2 API token
- [ ] Noted down: R2_ACCOUNT_ID
- [ ] Noted down: R2_ACCESS_KEY_ID
- [ ] Noted down: R2_SECRET_ACCESS_KEY
- [ ] Noted down: R2_PUBLIC_URL (or set up custom domain)

### 3. Email Service (Resend)
- [ ] Created Resend account
- [ ] Added and verified domain
- [ ] Created API key
- [ ] Noted down: RESEND_API_KEY
- [ ] Confirmed: EMAIL_FROM address

### 4. Security Secrets
**Generated secrets (DO NOT COMMIT TO GIT):**
- [ ] JWT_SECRET: `b5d2820f50189b2035d26c363bebb4801231b6bf036dbd836eb473c4c7be0ec2`
- [ ] SESSION_SECRET: `b0538ecf5d14c147caa517e1ef4fa0a5a3e50b8e39fe836df8c5077f120236b5`

## Deployment to Vercel

### Option A: Deploy via CLI

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Login:**
   ```bash
   vercel login
   ```

3. **Initial deployment:**
   ```bash
   cd C:\Users\LC\lanka-chemist-wholesale
   vercel
   ```

4. **Add environment variables:**
   ```bash
   vercel env add NEXT_PUBLIC_SUPABASE_URL production
   # Enter value when prompted

   vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
   vercel env add SUPABASE_SERVICE_ROLE_KEY production
   vercel env add JWT_SECRET production
   vercel env add SESSION_SECRET production
   vercel env add RESEND_API_KEY production
   vercel env add EMAIL_FROM production
   vercel env add R2_ACCOUNT_ID production
   vercel env add R2_ACCESS_KEY_ID production
   vercel env add R2_SECRET_ACCESS_KEY production
   vercel env add R2_BUCKET_NAME production
   vercel env add R2_PUBLIC_URL production
   vercel env add NEXT_PUBLIC_APP_URL production
   vercel env add NODE_ENV production
   ```

5. **Production deployment:**
   ```bash
   vercel --prod
   ```

### Option B: Deploy via Vercel Dashboard

1. Go to https://vercel.com/new
2. Import Git repository
3. Add all environment variables in settings
4. Deploy

## After Deployment

### 1. Create First Admin
- [ ] Visit: `https://your-deployment-url.vercel.app/api/admin/setup`
- [ ] Use the `scripts/create-admin.js` helper OR
- [ ] POST request with admin credentials
- [ ] Verify admin login works

### 2. Configure Store Settings
- [ ] Login to Supabase
- [ ] Update store settings with actual values
- [ ] Test that delivery fee calculation works

### 3. Add Initial Products
- [ ] Login to admin panel
- [ ] Add products manually OR
- [ ] Use CSV import feature

### 4. Test Critical Paths

#### Customer Registration Flow
- [ ] Browse products (prices hidden)
- [ ] Register new customer account
- [ ] Upload SLMC/NMRA documents
- [ ] Receive "pending verification" message
- [ ] Admin sees pending registration
- [ ] Admin approves customer
- [ ] Customer receives approval email

#### Order Placement Flow
- [ ] Login as approved customer
- [ ] Add products to cart
- [ ] Proceed to checkout
- [ ] Select delivery method
- [ ] Enter/select delivery address
- [ ] Place order
- [ ] Receive order confirmation email
- [ ] View order in "My Orders"

#### Admin Order Processing
- [ ] Login to admin panel
- [ ] View new order in dashboard
- [ ] Update order status
- [ ] Generate and view invoice PDF
- [ ] Print picking list

### 5. Performance & Monitoring
- [ ] Check Vercel deployment logs for errors
- [ ] Verify all pages load correctly
- [ ] Test mobile responsiveness
- [ ] Check image uploads work
- [ ] Verify email delivery in Resend dashboard

## Optional: Custom Domain

- [ ] Add custom domain in Vercel dashboard
- [ ] Configure DNS records
- [ ] Update NEXT_PUBLIC_APP_URL environment variable
- [ ] Verify SSL certificate is active

## Production URLs

After deployment, note your URLs:

- **Production URL:** _______________________________
- **Admin Login:** https://your-url.vercel.app/admin/login
- **Customer Login:** https://your-url.vercel.app/auth/login
- **Admin Setup:** https://your-url.vercel.app/api/admin/setup

## Troubleshooting

If deployment fails:
1. Check Vercel deployment logs
2. Verify all environment variables are set
3. Test build locally: `npm run build`
4. Check database connectivity from Vercel
5. Verify R2 bucket permissions

## Security Reminders

- ✅ Never commit `.env.local` to git
- ✅ Use strong passwords for admin accounts
- ✅ Keep JWT_SECRET and SESSION_SECRET private
- ✅ Regularly monitor Vercel function logs
- ✅ Keep dependencies updated
