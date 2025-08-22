# JudgeFinder Platform

AI-powered judicial transparency platform providing comprehensive analytics and bias detection for California's court system.

## Overview

JudgeFinder delivers unprecedented insights into judicial patterns and decision-making through advanced AI analysis and real-time court data integration. The platform serves citizens, attorneys, and litigants with objective, data-driven judicial analytics.

### Key Features

- **AI-Powered Bias Detection**: Sophisticated analysis of judicial patterns using Google Gemini 1.5 Flash and GPT-4o
- **Comprehensive Coverage**: 1,810 California judges across 909 courts with 300,000+ cases analyzed
- **Judge Comparison Tool**: Side-by-side comparison of up to 3 judges with key metrics
- **Advanced Search**: Multi-filter search with jurisdiction, court type, and specialization options
- **Real-Time Updates**: Automated daily and weekly data synchronization from official sources
- **Analytics Dashboard**: Detailed judicial analytics including decision times, reversal rates, and case distributions

## Architecture & Tech Stack

### Frontend
- **Framework:** Next.js 14 with TypeScript
- **Styling:** Tailwind CSS
- **Components:** Custom UI components with responsive design
- **Performance:** Core Web Vitals monitoring implemented

### Backend
- **Database:** Supabase PostgreSQL with real-time subscriptions
- **Authentication:** Clerk authentication with role-based access
- **Cache:** Upstash Redis for rate limiting and caching
- **APIs:** RESTful APIs with comprehensive error handling

### AI & Data Integration
- **Primary AI:** Google Gemini 1.5 Flash for judicial analytics
- **Fallback AI:** GPT-4o-mini for backup processing
- **Data Source:** CourtListener API v4 for official court data
- **Error Monitoring:** Sentry for production error tracking

### Infrastructure
- **Hosting:** Vercel with edge runtime optimization
- **CDN:** Global edge distribution
- **Security:** Comprehensive CSP, HSTS, XSS protection
- **Performance:** Multi-layer caching and lazy loading

## Installation & Setup

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account
- Clerk account (authentication)
- API keys for data sources

### Environment Variables
```bash
# Database
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# AI Services
GOOGLE_GEMINI_API_KEY=your_gemini_api_key
OPENAI_API_KEY=your_openai_api_key

# Data Source
COURTLISTENER_API_TOKEN=your_courtlistener_token

# Cache & Rate Limiting
UPSTASH_REDIS_REST_URL=your_upstash_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_token

# Monitoring
SENTRY_DSN=your_sentry_dsn
```

### Quick Start
```bash
# Clone repository
git clone [repository-url]
cd judge-finder-platform

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# Run development server
npm run dev
```

The application will be available at `http://localhost:3005`

### Database Setup
```bash
# Initialize database schema
npm run db:push

# Sync initial data
npm run sync:courts
npm run sync:judges
npm run sync:decisions

# Generate AI analytics
npm run analytics:generate
```

## Project Structure

```
judge-finder-platform/
├── app/                     # Next.js 14 App Router
│   ├── api/                # API endpoints
│   │   ├── judges/         # Judge-related APIs
│   │   ├── courts/         # Court-related APIs
│   │   ├── admin/          # Administrative APIs
│   │   ├── analytics/      # Analytics endpoints
│   │   └── sync/           # Data synchronization
│   ├── judges/             # Judge profile pages
│   ├── courts/             # Court directory pages
│   ├── compare/            # Judge comparison tool
│   └── jurisdictions/      # County-specific pages
├── components/             # React components
│   ├── judges/            # Judge-specific components
│   ├── ui/                # Reusable UI components
│   └── security/          # Security components
├── lib/                   # Core utilities
│   ├── ai/                # AI integration
│   ├── supabase/          # Database client
│   ├── security/          # Security configurations
│   └── sync/              # Data sync utilities
├── scripts/               # Automation scripts
│   ├── sync-*.js          # Data synchronization
│   └── validate-*.js      # Data validation
└── types/                 # TypeScript definitions
```

## API Documentation

### Core APIs

#### Judge Endpoints
- `GET /api/judges/list` - List all judges with filtering
- `GET /api/judges/search` - Search judges by name or court
- `GET /api/judges/advanced-search` - Advanced multi-filter search
- `GET /api/judges/[id]/analytics` - Get judge analytics
- `GET /api/judges/[id]/bias-analysis` - AI bias analysis
- `GET /api/judges/[id]/case-outcomes` - Case outcome statistics
- `GET /api/judges/[id]/recent-cases` - Recent case activity

#### Court Endpoints
- `GET /api/courts` - List all courts
- `GET /api/courts/[id]/judges` - Get judges for a court
- `GET /api/courts/by-slug` - Get court by URL slug
- `GET /api/courts/top-by-cases` - Most active courts

#### Administrative Endpoints
- `GET /api/admin/stats` - Platform statistics
- `POST /api/admin/sync` - Trigger data synchronization
- `GET /api/admin/sync-status` - Check sync status
- `GET /api/health` - System health check

## Scripts & Commands

### Development
```bash
npm run dev              # Start development server (port 3005)
npm run build           # Build for production
npm run type-check      # TypeScript validation
npm run lint            # ESLint code quality check
```

### Data Management
```bash
npm run sync:courts     # Sync court data
npm run sync:judges     # Sync judge profiles
npm run sync:decisions  # Sync case decisions
npm run analytics:generate  # Generate AI analytics
npm run bias:analyze    # Run bias analysis
npm run integrity:check # Check data integrity
npm run integrity:full  # Full validation
```

### Database
```bash
npm run db:push         # Push schema to database
npm run db:pull         # Pull schema from database
npm run db:generate     # Generate Prisma client
```

## Deployment

### Vercel Deployment
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### Environment Setup
1. Create accounts for required services (Supabase, Clerk, etc.)
2. Copy environment variables to Vercel dashboard
3. Configure domain and SSL certificate
4. Set up webhook endpoints for data synchronization

## Performance Optimization

- **Caching**: Multi-layer caching with Redis for API responses
- **Database**: Optimized queries with proper indexing
- **Images**: Lazy loading and responsive image optimization
- **Code Splitting**: Automatic code splitting with Next.js
- **Edge Runtime**: Vercel edge functions for global performance

## Security Features

- **Authentication**: Clerk-based secure authentication
- **Authorization**: Role-based access control
- **Headers**: Comprehensive security headers (CSP, HSTS, etc.)
- **Rate Limiting**: API rate limiting with Redis
- **Input Validation**: Strict input validation on all endpoints
- **Error Handling**: Secure error messages without sensitive data

## Contributing

We welcome contributions! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is proprietary software. All rights reserved.

## Support

For support, please open an issue in the GitHub repository or contact the development team.

---

**Built with ❤️ for judicial transparency and accountability**