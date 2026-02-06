# Step 2: Authentication & Customer Registration — Implementation Plan

## Implementation Order (22 files)

### Phase A: Core Utilities
1. `src/lib/auth.ts` — Password hashing (bcrypt), JWT sign/verify, cookie helpers
2. `src/lib/validate.ts` — Input validation, file magic-byte checking, registration validator
3. `src/lib/rate-limit.ts` — In-memory rate limiter (5 attempts, 15-min lockout)

### Phase B: API Routes
4. `src/app/api/upload/route.ts` — File upload to R2 (validation + UUID rename)
5. `src/app/api/auth/register/route.ts` — Create customer + address + document
6. `src/app/api/auth/login/route.ts` — Authenticate + rate limit + set cookie
7. `src/app/api/auth/logout/route.ts` — Clear cookie
8. `src/app/api/auth/me/route.ts` — Return current user from JWT

### Phase C: Middleware
9. `src/middleware.ts` — Cookie-presence check only (no JWT verify on Edge)

### Phase D: UI Foundation
10. `src/app/globals.css` — Brand colors, typography (update)
11. `src/components/ui/Button.tsx` — Reusable button with variants
12. `src/components/ui/Input.tsx` — Reusable form input with error/hint
13. `src/components/ui/Select.tsx` — Reusable select dropdown
14. `src/components/ui/Alert.tsx` — Success/error/warning/info messages
15. `src/components/ui/FileUpload.tsx` — Drag-drop upload with preview

### Phase E: Auth Context & Layout
16. `src/hooks/useAuth.tsx` — AuthProvider + useAuth hook (React Context)
17. `src/components/layout/Header.tsx` — Site header with auth state
18. `src/app/layout.tsx` — Wrap with AuthProvider + Header (update)

### Phase F: Auth Pages
19. `src/components/auth/LoginForm.tsx` — Login form component
20. `src/app/auth/login/page.tsx` — Login page
21. `src/components/auth/RegisterForm.tsx` — Multi-step registration wizard
22. `src/app/auth/register/page.tsx` — Registration page
23. `src/app/auth/pending/page.tsx` — Pending verification page

## Key Architecture Decisions
- JWT in httpOnly secure cookie (7d customer, 8h admin)
- Custom auth (NOT Supabase Auth) — own customers table
- Middleware checks cookie presence only (Edge runtime limitation)
- File upload allowed without auth (needed for registration flow)
- Rate limiting: in-memory Map keyed by ip:email
- Multi-step registration: type → details → document upload → address

## Design Direction
- Professional pharmaceutical green (#0d7c5f) + deep blue (#1a5276)
- System font stack (no Inter/Roboto)
- Clean, sharp design suitable for medical professionals
- Mobile-first responsive
