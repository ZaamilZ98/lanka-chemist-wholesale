# Vercel Environment Variables Setup

Your app is deployed! Now add environment variables for production.

## Your Deployment URLs:
- **Preview:** https://lanka-chemist-wholesale-cjcr0z48j-zaamzs-projects.vercel.app
- **Production (after env setup):** https://lanka-chemist-wholesale.vercel.app

## Generated Secrets (Save These Securely):

```
JWT_SECRET=b5d2820f50189b2035d26c363bebb4801231b6bf036dbd836eb473c4c7be0ec2
SESSION_SECRET=b0538ecf5d14c147caa517e1ef4fa0a5a3e50b8e39fe836df8c5077f120236b5
```

## Option 1: Add Variables via Vercel Dashboard (Easiest)

1. Go to: https://vercel.com/zaamzs-projects/lanka-chemist-wholesale/settings/environment-variables

2. Add each variable for **Production** environment:

| Variable Name | Value | Where to Get It |
|---------------|-------|-----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJxxx...` | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJxxx...` | Supabase Dashboard → Settings → API |
| `JWT_SECRET` | `b5d2820f50189b2035d26c363bebb4801231b6bf036dbd836eb473c4c7be0ec2` | Use generated value above |
| `SESSION_SECRET` | `b0538ecf5d14c147caa517e1ef4fa0a5a3e50b8e39fe836df8c5077f120236b5` | Use generated value above |
| `RESEND_API_KEY` | `re_xxx...` | Resend Dashboard → API Keys |
| `EMAIL_FROM` | `noreply@lankachemist.lk` | Your verified email domain |
| `R2_ACCOUNT_ID` | `xxx...` | Cloudflare Dashboard → R2 |
| `R2_ACCESS_KEY_ID` | `xxx...` | Cloudflare Dashboard → R2 → API Tokens |
| `R2_SECRET_ACCESS_KEY` | `xxx...` | Cloudflare Dashboard → R2 → API Tokens |
| `R2_BUCKET_NAME` | `lanka-chemist-images` | Your R2 bucket name |
| `R2_PUBLIC_URL` | `https://xxx.r2.dev` | Your R2 public URL or custom domain |
| `NEXT_PUBLIC_APP_URL` | `https://lanka-chemist-wholesale.vercel.app` | Your production URL |
| `NODE_ENV` | `production` | Use this value |

3. After adding all variables, redeploy:
   ```bash
   cd C:\Users\LC\lanka-chemist-wholesale
   vercel --prod
   ```

## Option 2: Add Variables via CLI

Run these commands one by one (you'll be prompted for values):

```bash
cd C:\Users\LC\lanka-chemist-wholesale

# Database
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production

# Auth Secrets
vercel env add JWT_SECRET production
# When prompted, paste: b5d2820f50189b2035d26c363bebb4801231b6bf036dbd836eb473c4c7be0ec2

vercel env add SESSION_SECRET production
# When prompted, paste: b0538ecf5d14c147caa517e1ef4fa0a5a3e50b8e39fe836df8c5077f120236b5

# Email
vercel env add RESEND_API_KEY production
vercel env add EMAIL_FROM production

# Image Storage
vercel env add R2_ACCOUNT_ID production
vercel env add R2_ACCESS_KEY_ID production
vercel env add R2_SECRET_ACCESS_KEY production
vercel env add R2_BUCKET_NAME production
vercel env add R2_PUBLIC_URL production

# App Configuration
vercel env add NEXT_PUBLIC_APP_URL production
# When prompted, enter: https://lanka-chemist-wholesale.vercel.app

vercel env add NODE_ENV production
# When prompted, enter: production

# Deploy to production
vercel --prod
```

## After Production Deployment

1. **Create First Admin Account:**
   ```bash
   node scripts/create-admin.js
   # Or visit: https://lanka-chemist-wholesale.vercel.app/api/admin/setup
   ```

2. **Test the Application:**
   - Visit: https://lanka-chemist-wholesale.vercel.app
   - Admin login: https://lanka-chemist-wholesale.vercel.app/admin/login

3. **Set Up Database:**
   - Go to Supabase SQL Editor
   - Run `database/schema.sql`
   - Run `database/seeds/sample_data.sql`
   - Run `scripts/setup-store-settings.sql`

## Troubleshooting

**If build fails:**
```bash
# Check logs
vercel logs

# Or in dashboard:
https://vercel.com/zaamzs-projects/lanka-chemist-wholesale
```

**If environment variables are missing:**
```bash
# List all environment variables
vercel env ls

# Pull environment variables to local
vercel env pull
```

## Next Steps Checklist

- [ ] Add all environment variables (Option 1 or 2)
- [ ] Deploy to production: `vercel --prod`
- [ ] Set up Supabase database (run SQL scripts)
- [ ] Create first admin account
- [ ] Test customer registration flow
- [ ] Test order placement
- [ ] Configure store settings in database

## Need Help?

- Vercel Documentation: https://vercel.com/docs
- Check deployment logs in Vercel dashboard
- Review DEPLOYMENT.md for detailed instructions
