# Lanka Chemist Wholesale - Deployment Guide

## Pre-Deployment Checklist

### 1. Database Setup (Supabase)

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note down your project URL and keys (Settings → API)
3. Run the database schema:
   - Go to SQL Editor in Supabase dashboard
   - Copy contents of `database/schema.sql`
   - Execute the SQL
4. Run the seed data (optional for initial products):
   - Copy contents of `database/seeds/sample_data.sql`
   - Execute the SQL

### 2. Image Storage Setup (Cloudflare R2)

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → R2
2. Create a new bucket: `lanka-chemist-images`
3. Enable public access for the bucket
4. Create R2 API tokens:
   - Go to R2 → Manage R2 API Tokens
   - Create API token with read/write permissions
   - Note down: Account ID, Access Key ID, Secret Access Key
5. Set up custom domain (optional):
   - Connect a domain to your R2 bucket for public URLs
   - Or use Cloudflare's default R2.dev domain

### 3. Email Service Setup (Resend)

1. Go to [resend.com](https://resend.com) and sign up
2. Add your domain and verify DNS records
3. Create an API key
4. Set your "From" email address (e.g., noreply@lankachemist.lk)

### 4. Generate Secure Secrets

Run these commands to generate secure random secrets:

**For JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**For SESSION_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Save these secrets - you'll need them for environment variables.

## Deploying to Vercel

### Option 1: Deploy via Vercel CLI (Recommended)

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy from project directory:**
   ```bash
   cd C:\Users\LC\lanka-chemist-wholesale
   vercel
   ```

4. **Follow the prompts:**
   - Set up and deploy? Yes
   - Which scope? Your account
   - Link to existing project? No
   - Project name? lanka-chemist-wholesale
   - Directory? ./
   - Override settings? No

5. **Add environment variables:**
   After initial deployment, add environment variables:
   ```bash
   vercel env add NEXT_PUBLIC_SUPABASE_URL production
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
   ```

6. **Redeploy with environment variables:**
   ```bash
   vercel --prod
   ```

### Option 2: Deploy via GitHub (Alternative)

1. **Push code to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit - ready for deployment"
   git remote add origin https://github.com/yourusername/lanka-chemist-wholesale.git
   git push -u origin main
   ```

2. **Connect to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository
   - Add environment variables in the Vercel dashboard
   - Deploy

## Post-Deployment Setup

### 1. Create First Admin Account

Visit: `https://your-domain.vercel.app/api/admin/setup`

Send a POST request with:
```json
{
  "email": "admin@lankachemist.lk",
  "password": "YourSecurePassword123!",
  "name": "Admin User"
}
```

Use a tool like Postman, curl, or create a simple form.

**Example with curl:**
```bash
curl -X POST https://your-domain.vercel.app/api/admin/setup \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@lankachemist.lk","password":"YourSecurePassword123!","name":"Admin User"}'
```

### 2. Add Initial Products

1. Login to admin panel: `https://your-domain.vercel.app/admin/login`
2. Go to Products → Add New Product
3. Or use CSV import for bulk upload

### 3. Configure Store Settings

Add these to your Supabase `store_settings` table:

```sql
INSERT INTO store_settings (key, value) VALUES
('store_latitude', '6.9271'),  -- Colombo coordinates
('store_longitude', '79.8612'),
('store_name', 'Lanka Chemist'),
('store_address', 'Your Store Address'),
('store_phone', '+94 XX XXX XXXX'),
('store_whatsapp', '+94 XX XXX XXXX'),
('nmra_license_number', 'Your NMRA License Number');
```

### 4. Test the Application

1. **Customer Flow:**
   - Browse products without login
   - Register a new account
   - Verify admin can see pending registration
   - Admin approves account
   - Customer receives approval email
   - Customer can place orders

2. **Admin Flow:**
   - Login to admin panel
   - View dashboard stats
   - Manage products
   - Process orders
   - View reports

## Custom Domain Setup (Optional)

1. In Vercel dashboard, go to your project → Settings → Domains
2. Add your custom domain (e.g., lankachemist.lk)
3. Update DNS records as instructed by Vercel
4. Update `NEXT_PUBLIC_APP_URL` environment variable to your custom domain

## Monitoring and Maintenance

### Check Application Health
- Monitor Vercel deployment logs
- Check Supabase database performance
- Monitor R2 storage usage
- Review Resend email delivery logs

### Regular Maintenance
- Update product inventory regularly
- Process customer orders promptly
- Respond to customer verification requests
- Review and export reports monthly

## Troubleshooting

### Build Fails
- Check Vercel logs for specific errors
- Verify all environment variables are set correctly
- Test build locally: `npm run build`

### Database Connection Issues
- Verify Supabase URL and keys
- Check if service role key has correct permissions
- Ensure database is not paused (free tier limitation)

### Image Upload Issues
- Verify R2 credentials
- Check bucket permissions
- Ensure R2_PUBLIC_URL is correct

### Email Not Sending
- Verify Resend API key
- Check domain verification status
- Review Resend logs for delivery issues

## Support

For technical issues:
1. Check Vercel deployment logs
2. Review Supabase database logs
3. Check browser console for frontend errors
4. Review API route errors in Vercel function logs
