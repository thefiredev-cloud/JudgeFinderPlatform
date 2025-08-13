# Judge Finder Platform

A comprehensive legal analytics platform that connects law firms with judge expertise through data-driven insights and targeted advertising opportunities.

![Judge Finder Homepage](./docs/homepage-preview.png)

## 🎯 Overview

Judge Finder provides a searchable database of 10,000+ judges with detailed profiles including:
- Judge background, education, and career history
- Ruling patterns and tendencies based on case analysis
- Expert attorney directory with targeted advertising
- Comprehensive legal analytics powered by AI

## 🛠 Technology Stack

- **Frontend**: Next.js 14+ with App Router, React, TypeScript
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **APIs**: CourtListener API, OpenAI API, Stripe API
- **Authentication**: Supabase Auth with BAR number verification
- **Styling**: Tailwind CSS with custom design system
- **Deployment**: Vercel (recommended)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm/yarn/pnpm
- Supabase account
- CourtListener API key
- OpenAI API key
- Stripe account (for payments)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Apex-ai-net/judge-finder-platform.git
   cd judge-finder-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env.local
   ```

   Fill in your environment variables:
   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

   # API Keys
   COURTLISTENER_API_KEY=your_courtlistener_api_key
   OPENAI_API_KEY=your_openai_api_key

   # Stripe Configuration
   STRIPE_SECRET_KEY=your_stripe_secret_key
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

   # Application Configuration
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Database Setup**
   
   Run the SQL schema in your Supabase project:
   ```sql
   -- Execute the contents of lib/database/schema.sql in your Supabase SQL editor
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
judge-finder-app/
├── app/                          # Next.js App Router
│   ├── (dashboard)/             # Law firm dashboard routes
│   ├── judges/                  # Judge profile pages
│   │   └── [slug]/             # Dynamic judge profiles
│   ├── api/                    # API routes
│   │   └── judges/
│   │       └── search/         # Judge search endpoint
│   ├── globals.css             # Global styles
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Homepage
├── components/                  # React components
│   ├── ui/                     # Reusable UI components
│   ├── judges/                 # Judge-specific components
│   └── dashboard/              # Dashboard components
├── lib/                        # Utility libraries
│   ├── supabase/              # Supabase configuration
│   ├── stripe/                # Stripe integration
│   ├── courtlistener/         # CourtListener API
│   ├── openai/                # OpenAI integration
│   └── database/              # Database schema
├── types/                      # TypeScript definitions
├── utils/                      # Utility functions
└── README.md
```

## 🔧 API Integration Setup

### CourtListener API
1. Sign up at [CourtListener.com](https://www.courtlistener.com/)
2. Obtain API key from your account settings
3. Add to environment variables

### OpenAI API
1. Create account at [OpenAI](https://platform.openai.com/)
2. Generate API key
3. Set up billing for GPT-4 access

### Stripe Integration
1. Create Stripe account
2. Get publishable and secret keys
3. Set up webhook endpoints for subscription management

## 🎨 Design System

The platform uses a custom design system built on Tailwind CSS:

- **Colors**: Judge-themed blue and slate color palette
- **Typography**: Inter font family for clean readability
- **Components**: Reusable UI components with consistent styling
- **Responsive**: Mobile-first responsive design

### Key Design Elements

- Dark theme optimized for legal professionals
- Accessible color contrasts and typography
- Smooth animations and micro-interactions
- Professional, trustworthy visual identity

## 🔍 Core Features

### 1. Judge Search & Profiles
- Full-text search across 10,000+ judges
- Detailed judge profiles with background information
- Ruling pattern analysis using AI
- Recent case decisions and summaries

### 2. Attorney Advertisement System
- Targeted advertising slots on judge pages
- Stripe-powered subscription billing
- BAR number verification for attorneys
- Performance analytics and ROI tracking

### 3. Legal Analytics
- AI-powered case analysis using OpenAI GPT-4
- Judicial ruling pattern recognition
- Statistical insights on judge tendencies
- Data-driven legal strategy recommendations

### 4. Law Firm Dashboard
- Subscription management
- Advertisement performance metrics
- Billing history and payments
- Profile and specialization management

## 🛡 Security & Compliance

- **Authentication**: Supabase Auth with BAR number verification
- **Data Privacy**: GDPR-compliant data handling
- **Legal Compliance**: Advertising disclosure requirements
- **Security**: Row-level security (RLS) policies
- **Professional Standards**: Attorney verification systems

## 🚀 Deployment

### Vercel Deployment (Recommended)

1. **Connect Repository**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Deploy
   vercel
   ```

2. **Environment Variables**
   - Add all environment variables in Vercel dashboard
   - Ensure Supabase URLs are production URLs

3. **Domain Configuration**
   - Set up custom domain
   - Configure DNS settings
   - Enable SSL certificates

### Database Migration

Run the database schema in your production Supabase:
```sql
-- Execute lib/database/schema.sql in production Supabase
```

## 📊 Analytics & Monitoring

- **User Analytics**: Google Analytics integration
- **Performance**: Vercel Analytics
- **Error Tracking**: Built-in error handling
- **Business Metrics**: Revenue and engagement tracking

## 🔄 Development Workflow

### Code Quality
- **TypeScript**: Full type safety
- **ESLint**: Code linting and formatting
- **Prettier**: Code formatting
- **Husky**: Pre-commit hooks

### Testing Strategy
- Unit tests for utility functions
- Integration tests for API routes
- E2E tests for critical user flows
- Performance testing for database queries

### Performance Optimization
- **Next.js ISR**: Incremental Static Regeneration for judge pages
- **Image Optimization**: Next.js Image component
- **Database Indexing**: Optimized queries and indexes
- **Caching**: API response caching with proper headers

## 📚 Documentation

### API Documentation
- RESTful API endpoints
- Request/response schemas
- Authentication requirements
- Rate limiting information

### Component Documentation
- Storybook for component library
- Props and usage examples
- Design system guidelines
- Accessibility requirements

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### Development Guidelines
- Follow TypeScript best practices
- Write descriptive commit messages
- Ensure all tests pass
- Update documentation as needed

## 📄 Legal & Compliance

### Important Disclaimers
- Judge Finder does not endorse attorneys
- All information is for educational purposes only
- Judicial data accuracy is not guaranteed
- Professional legal advice should be sought

### License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Getting Help
- Check the [Issues](https://github.com/Apex-ai-net/judge-finder-platform/issues) page
- Review the documentation
- Contact support at support@judgefinder.com

### Common Issues
1. **Environment Variables**: Ensure all required variables are set
2. **Database Connection**: Verify Supabase configuration
3. **API Keys**: Check API key permissions and limits
4. **Build Errors**: Clear `.next` cache and reinstall dependencies

## 🗺 Roadmap

### Phase 1: Foundation ✅
- Basic judge search functionality
- Judge profile pages
- Attorney advertisement system
- Stripe payment integration

### Phase 2: Enhancement 🚧
- Advanced search filters
- Mobile app development
- Enhanced analytics dashboard
- API rate limiting

### Phase 3: Scale 📋
- Multi-language support
- International court systems
- Machine learning recommendations
- Enterprise features

---

**Judge Finder Platform** - Connecting legal professionals with judicial intelligence.

For questions or support, contact us at [support@judgefinder.com](mailto:support@judgefinder.com)