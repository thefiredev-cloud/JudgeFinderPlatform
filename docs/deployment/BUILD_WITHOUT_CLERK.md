# Building Without Clerk Keys

The application requires valid Clerk authentication keys to build. Until you set up Clerk:

## Option 1: Skip Build Checks (Quickest)
```bash
# For development
npm run dev

# The app will run but authentication won't work
```

## Option 2: Get Free Clerk Dev Keys
1. Go to https://clerk.com
2. Sign up for free account
3. Create new application
4. Copy development keys
5. Update `.env.local`:
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_YOUR_ACTUAL_KEY
CLERK_SECRET_KEY=sk_test_YOUR_ACTUAL_SECRET
```

## Option 3: Disable Clerk Temporarily
Comment out the ClerkProvider in `app/layout.tsx` for building without keys.

## For Production Deployment
You MUST have valid Clerk production keys. See `CLERK_SETUP_GUIDE.md` for details.