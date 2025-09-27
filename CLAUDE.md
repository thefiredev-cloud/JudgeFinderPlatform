# JudgeFinder Platform - AI-Powered Judicial Transparency Tool

## Claude Code Environment Configuration

**Global MCP Tools Available:** Full-stack app development support with MCP integrations for:

- **Clerk Authentication** - User management and authentication
- **Stripe Payments** - Payment processing and subscription management  
- **Supabase Database** - Real-time database and storage
- **Netlify Deployment** - Continuous deployment and hosting
- **Convex** - Backend infrastructure
- **GitHub** - Version control and collaboration
- **Docker** - Containerization
- **Playwright/Puppeteer** - Browser automation and testing
- **File System** - Direct file access and manipulation
- **Sequential Thinking** - Complex problem solving

## Current Status: PRE-LAUNCH - 5 Days to Production

## 🚀 LAUNCH ACTION PLAN - Complete in 5 Days

### Phase 1: Data Population (Priority 1 - 2 days)

**Goal:** Ensure every active California judge has sufficient case coverage for analytics

1. **Sync Historical Case Data**

   ```bash
   npm run sync:judges          # Pull all CA judges
   npm run sync:decisions       # Ingest recent decisions for each judge
   npm run sync:courts          # Update court data
   ```

2. **Generate AI Analytics for All Judges**

   ```bash
   npm run analytics:generate   # Process bias analysis for each judge
   npm run bias:analyze        # Run comprehensive bias detection
   ```

3. **Populate Court Statistics**
   - Calculate annual filing counts per court
   - Generate court performance metrics
   - Update court-judge relationships

### Phase 2: Fix Critical Errors (Priority 2 - 1 day)

1. **Fix Build/Deployment Issues**
   - Add `export const dynamic = 'force-dynamic'` to dynamic routes
   - Configure real Clerk authentication keys
   - Update `.env.production` with actual values

2. **Create Missing Pages**
   - Fix admin page (currently 404)
   - Add authentication pages (login/signup)
   - Implement user dashboard

3. **Add Essential Tests**
   - Create basic test suite for APIs
   - Test judge search functionality
   - Test analytics generation

### Phase 3: Production Setup (Priority 3 - 1 day)

1. **Environment Configuration**
   - Generate production secrets
   - Set up Supabase production instance
   - Configure Upstash Redis for rate limiting
   - Set up Sentry error tracking

2. **Deploy to Netlify**

   ```bash
   netlify deploy --dir=.next    # Deploy to draft URL
   netlify deploy --prod         # Deploy to production
   ```

   - GitHub repository already connected for continuous deployment
   - Configure environment variables in Netlify dashboard
   - Custom domain configuration (judgefinder.io)
   - SSL certificate auto-enabled by Netlify

### Phase 4: Final Validation (Priority 4 - 1 day)

1. **Data Completeness Check**

   ```bash
   npm run integrity:full      # Verify all data relationships
   npm run validate:relationships  # Check court-judge assignments
   ```

2. **End-to-End Testing**
   - Test judge search (basic & advanced)
   - Test comparison tool with 3 judges
   - Verify bias analysis displays
   - Check all API endpoints

3. **Performance Testing**
   - Load test with 100 concurrent users
   - Verify <3 second page loads
   - Test rate limiting works
   - Monitor error rates

### ✅ Success Metrics

- [ ] Complete statewide judge coverage with healthy case volumes
- [ ] Analytics available for every active judge profile
- [ ] Court statistics generated for all tracked jurisdictions
- [ ] Zero build errors
- [ ] All pages accessible
- [ ] <3 second load times

### 🚀 Quick Start Commands

```bash
# Today's Priority - Data Population
npm run sync:judges && npm run sync:decisions && npm run analytics:generate

# Fix Authentication (Manual Steps Required)
# 1. Sign up for Clerk production account at https://clerk.com
# 2. Replace placeholder keys in .env.production
# 3. Configure OAuth providers

# Deploy to Netlify (already configured for continuous deployment)
# Production URL: https://olms-4375-tw501-x421.netlify.app/
netlify deploy --prod
```

### Platform Overview

Advanced judicial transparency and AI-powered bias detection platform for citizens, attorneys, and litigants researching judicial patterns across California's court system.

**Mission:** Promote judicial transparency through AI-powered bias detection and automated data analysis

### Key Platform Data

- **Statewide California Judges** - Comprehensive judicial directory with AI analytics
- **California Courts** - Broad coverage with relationship mapping
- **Extensive Case Library** - Continuously updated decision data feeding analytics

### Deployment URLs

- **Production (Netlify):** `https://olms-4375-tw501-x421.netlify.app/`
- **Local Development:** `http://localhost:3005`
- **Continuous Deployment:** GitHub → Netlify (automatic on push to main)
- **Testing:** Use Playwright to test deployed version via production URL

### Major Platform Features

#### AI-Powered Bias Analysis System

- **Primary Agent:** Google Gemini 1.5 Flash for comprehensive judicial analytics
- **Fallback Agent:** GPT-4o-mini for backup processing
- **Analytics Engine:** `/api/judges/[id]/bias-analysis` - 5-metric scoring system
- **Real-time Processing:** Live bias pattern analysis and visualization
- **Bias Indicators:** Consistency, Speed, Settlement Preference, Risk Tolerance, Predictability

#### Judge Comparison Tool

- **Location:** `/compare` page with side-by-side analysis
- **Features:** Compare up to 3 judges simultaneously with key metrics
- **Analytics Integration:** Decision times, reversal rates, case type distributions
- **Interactive Search:** Real-time judge search and selection
- **Summary Analysis:** Automated comparison insights and recommendations

#### Advanced Search & Discovery

- **Enhanced Search:** `/api/judges/advanced-search` with multiple filters
- **Smart Filtering:** Jurisdiction, court type, experience, case specialization
- **County-Specific Pages:** `/jurisdictions/[county]` for localized browsing
- **Intelligent Suggestions:** AI-powered search recommendations

#### Production Security Infrastructure

- **Security Headers:** Comprehensive CSP, HSTS, XSS protection via `lib/security/headers.ts`
- **Content Security Policy:** Environment-specific CSP with external service integration
- **Rate Limiting:** Redis-powered rate limiting with Upstash integration
- **CORS Protection:** Secure cross-origin handling for API endpoints
- **Error Monitoring:** Sentry integration for production error tracking

### Comprehensive API Architecture

#### Judge APIs (25 endpoints)

```text
/api/judges/
├── list - Complete directory with pagination
├── search - Real-time search functionality  
├── advanced-search - Multi-filter advanced search
├── recent-decisions - Batch decision counts
├── [id]/
│   ├── analytics - Comprehensive judicial analytics
│   ├── assignments - Court assignment history
│   ├── bias-analysis - AI-powered bias detection
│   ├── case-outcomes - Outcome analysis
│   ├── recent-cases - Latest case activity
│   └── slots - Attorney slot management
├── by-slug - SEO-friendly URLs
├── by-state - State-based filtering
├── orange-county - County-specific endpoints
├── la-county - LA-specific endpoints
├── redirect - URL redirection handling
└── related - Related judge suggestions
```

#### Court APIs (5 endpoints)

```text
/api/courts/
├── route.ts - Court directory with filtering
├── [id]/judges - Judges assigned to specific court
├── by-slug - SEO-friendly court URLs
└── top-by-cases - Most active courts
```

#### Administrative APIs (6 endpoints)

```text
/api/admin/
├── bias-analytics - Platform-wide bias analytics
├── migrate - Database migration tools
├── stats - Administrative statistics
├── sync-status - Sync operation monitoring
├── sync - Manual sync triggers
└── verification - Data integrity checks
```

#### Automation & Cron APIs (12 endpoints)

```text
/api/cron/
├── daily-sync - Automated daily updates
└── weekly-sync - Comprehensive weekly sync

/api/sync/
├── courts - Court data synchronization
├── decisions - Decision document sync
└── judges - Judge profile updates

/api/webhooks/
└── courtlistener - CourtListener integration
```

#### Security & Monitoring APIs (8 endpoints)

```text
/api/security/
├── csp-report - Content Security Policy reporting
└── ct-report - Certificate Transparency reporting

/api/health/ - System health monitoring

/api/analytics/
├── conversion - Conversion tracking
├── kpi - Key performance indicators
├── performance - Performance metrics
└── revenue/ - Revenue analytics (inactive)
```

#### User & Authentication APIs (12 endpoints)

```text
/api/auth/
├── callback - Authentication callbacks
└── test - Authentication testing

/api/user/
├── activity - User activity tracking
├── bookmarks - Bookmark management
├── preferences - User preferences
└── stats - User statistics
```

### AI Automation Systems

#### Scheduled Automation

- **Daily Sync:** Court and judge data updates (2:00 AM, 2:00 PM)
- **Weekly Sync:** Comprehensive data refresh (Sundays 3:00 AM)
- **Decision Updates:** Real-time judicial decision monitoring
- **Assignment Tracking:** Automated judge-court assignment monitoring

#### AI Analytics Pipeline

- **Bias Detection:** 50+ case document analysis per judge
- **Pattern Recognition:** 6-category judicial tendency analysis
- **Confidence Scoring:** 60-95% accuracy ratings with fallback systems
- **Cost Optimization:** Token usage tracking and caching strategies

#### Data Quality Systems

- **Integrity Validation:** Automated relationship verification
- **Error Recovery:** Continuous processing despite failures
- **Performance Monitoring:** Real-time sync operation tracking
- **Cache Management:** Redis-based analytics caching

### Technical Infrastructure

#### Database Architecture

- **Complete Judicial Database:** Courts, judges, cases, decisions
- **Relationship Mapping:** Court-judge assignments with history
- **Geographic Coverage:** All California jurisdictions
- **Performance Optimization:** Proper indexing and query optimization

#### Security Implementation

- **Production Headers:** HSTS, CSP, XSS, CSRF protection
- **API Authentication:** Secure cron job authentication
- **Rate Limiting:** Request throttling with Redis
- **Monitoring:** Comprehensive error tracking and alerting

#### Performance Features

- **Caching Strategy:** Multi-layer caching for analytics and API responses
- **Lazy Loading:** Efficient data loading with pagination
- **Background Processing:** Async operations for heavy computations
- **CDN Integration:** Optimized asset delivery

### Platform Architecture

#### Frontend Components

```text
app/
├── compare/page.tsx - Judge comparison tool
├── judges/page.tsx - Enhanced judge directory
├── courts/page.tsx - Court directory
├── jurisdictions/[county]/page.tsx - County-specific pages
└── health/ - System monitoring dashboard

components/
├── judges/
│   ├── SearchSection.tsx - Advanced search interface
│   ├── BiasPatternAnalysis.tsx - AI bias visualization
│   └── ComparisonGrid.tsx - Side-by-side comparison
├── ui/ - Reusable UI components
└── security/ - Security components
```

#### Backend Systems

```text
lib/
├── ai/judicial-analytics.js - AI analysis engine
├── sync/ - Data synchronization systems
├── security/headers.ts - Security configuration
├── rate-limit.ts - Request throttling
└── supabase/ - Database integration

scripts/
├── automated-assignment-updater.js - Assignment monitoring
├── batch-generate-analytics.js - AI analytics generation
├── comprehensive-validation.js - Data integrity
└── sync-*.js - Various sync operations
```

#### Configuration Files

```text
├── instrumentation.ts - Sentry error monitoring
├── middleware.ts - Request processing and security
├── next.config.js - Next.js configuration
├── sentry.client.config.ts - Client-side error tracking
├── agents.md - AI automation documentation
└── CLAUDE.md - This file
```

### Revenue System (Built but Inactive)

Complete $78.5K/month revenue pipeline built but platform operates as free public service:

- 10 revenue tracking database tables implemented
- Email automation sequences configured
- Analytics dashboard operational
- 127 Orange County law firm prospects identified
- All systems ready but not activated due to transparency mission

### Development Workflow

#### Essential Commands

```bash
# Development
npx next dev -p 3005                    # Start development server (keep running for Claude Code)
npm run type-check                      # TypeScript validation
npm run lint                           # Code quality checks

# Important: Keep dev server running
# Claude Code should maintain the dev server at port 3005 for testing

# AI & Analytics
npm run analytics:generate              # Generate AI analytics
npm run bias:analyze                   # Run bias analysis

# Data Management
npm run sync:courts                    # Sync court data
npm run sync:judges                    # Sync judge data
npm run integrity:full                 # Complete data validation

# Automation
npm run assignments:update             # Update assignments
npm run cron:daily                     # Manual daily sync
npm run cron:weekly                    # Manual weekly sync

# Netlify Deployment
netlify deploy --dir=.next            # Deploy draft
netlify deploy --prod                 # Deploy to production
netlify open                          # Open Netlify dashboard

# Test Deployed Version
# Use Playwright with https://olms-4375-tw501-x421.netlify.app/
```

#### Quality Assurance

- **Automated Testing:** Comprehensive endpoint testing
- **Data Validation:** Multi-layer integrity checks
- **Performance Monitoring:** Real-time metrics tracking
- **Security Scanning:** Continuous vulnerability assessment

### Platform Positioning

- **For Citizens:** Research judges handling your case with AI-powered insights
- **For Attorneys:** Advanced judicial analytics for case strategy optimization
- **For Litigants:** Transparent access to judicial patterns and bias analysis
- **For Researchers:** Comprehensive California judicial data with AI analysis
- **For Transparency Organizations:** Free access to judicial accountability data

### Monitoring & Health

- **Health Endpoints:** `/api/health` - System status monitoring
- **Admin Dashboard:** Real-time platform statistics and sync status
- **Error Tracking:** Sentry integration for production monitoring
- **Performance Metrics:** Response times, success rates, cache efficiency

### External Integrations

- **CourtListener API:** Official court data synchronization
- **OpenAI API:** AI analytics generation (fallback)
- **Google Gemini:** Primary AI analytics engine
- **Supabase:** Database and authentication
- **Upstash Redis:** Rate limiting and caching
- **Sentry:** Error monitoring and performance tracking

**Platform Status:** Live production deployment on Netlify with continuous integration from GitHub. AI-powered judicial transparency platform with comprehensive California coverage, advanced bias detection, and automated data processing capabilities. The platform represents the most advanced judicial transparency tool available, combining real-time data updates with sophisticated AI analysis for unprecedented insight into judicial patterns and potential bias indicators.

**Live Production URL:** `https://olms-4375-tw501-x421.netlify.app/`
**Deployment Method:** Continuous deployment via GitHub → Netlify pipeline

For detailed information about AI agents and automation systems, see `agents.md`.
