# MCP (Model Context Protocol) Setup Guide

## Overview
MCPs (Model Context Protocol servers) provide Claude with direct access to external services and APIs. This enables seamless integration, automated configuration, and clear execution of tasks.

## ✅ Configured MCPs

### 1. **Supabase MCP** ✅ Ready
- **Purpose**: Database management, authentication, real-time subscriptions
- **Status**: Already configured with access token
- **Available Operations**: 
  - Database queries
  - Table management
  - Authentication operations
  - Real-time subscriptions

### 2. **Clerk MCP** ✅ Ready
- **Purpose**: User authentication and management
- **Status**: Configured with test secret key
- **Available Operations**:
  - User management (create, update, delete)
  - Organization management
  - Metadata updates
  - Invitation management
  - Session management

### 3. **Convex MCP** ⚠️ Needs Configuration
- **Purpose**: Real-time backend, database, and serverless functions
- **Required Setup**:
  1. Create a Convex account at https://convex.dev
  2. Create a new project or use existing
  3. Get deployment URL from Dashboard
  4. Generate auth token from Settings > Deploy Keys
  5. Update `.env.mcp` with:
     ```
     CONVEX_DEPLOYMENT=https://YOUR_DEPLOYMENT.convex.cloud
     CONVEX_AUTH_TOKEN=YOUR_AUTH_TOKEN
     ```

### 4. **Stripe MCP** ⚠️ Needs Configuration
- **Purpose**: Payment processing and subscription management
- **Required Setup**:
  1. Sign up/login at https://dashboard.stripe.com
  2. Get your secret key from API Keys section
  3. Use test key for development (starts with `sk_test_`)
  4. Update `.env.mcp` with:
     ```
     STRIPE_SECRET_KEY=sk_test_YOUR_KEY
     ```
- **Available Operations**:
  - Customer management
  - Product and price creation
  - Payment link generation
  - Invoice management
  - Subscription handling
  - Refund processing

### 5. **Google Console MCP** ⚠️ Needs Configuration
- **Purpose**: Google Cloud services (Maps, Analytics, AI, etc.)
- **Required Setup**:
  1. Go to https://console.cloud.google.com
  2. Create/select a project
  3. Enable required APIs (Maps, Analytics, etc.)
  4. Create service account:
     - IAM & Admin > Service Accounts > Create
     - Download JSON key file
     - Save as `google-service-account.json` in project root
  5. Update `.env.mcp` with API keys and path to JSON file

### 6. **GitHub MCP** ✅ Ready
- **Purpose**: GitHub repository and code management
- **Status**: Already configured with personal access token
- **Available Operations**:
  - Repository management
  - Issue and PR creation/management
  - Code search
  - File operations

### 7. **Netlify MCP** ⚠️ Needs Configuration
- **Purpose**: Deployment management and site configuration
- **Required Setup**:
  1. Sign up/login at https://app.netlify.com
  2. Go to User Settings > Applications
  3. Create a new Personal Access Token
  4. Copy the token (save it securely, won't be shown again)
  5. Get your Site ID from site settings
  6. Update `.env.mcp` with:
     ```
     NETLIFY_AUTH_TOKEN=YOUR_TOKEN
     NETLIFY_SITE_ID=YOUR_SITE_ID
     ```
- **Available Operations**:
  - Deploy site from local build
  - Manage environment variables
  - Monitor deployments
  - Configure site settings
  - Manage custom domains
  - View build logs
  - Rollback deployments

### 8. **Additional MCPs** ✅ Ready
- **Memory Palace**: Knowledge management system
- **Sequential Thinking**: Complex problem solving
- **Hyperbrowser**: Web scraping and automation

## 🔧 Configuration Steps

### Step 1: Update Environment Variables
Fill in the missing values in `.env.mcp`:

```env
# Replace placeholders with actual values
STRIPE_SECRET_KEY=sk_test_YOUR_ACTUAL_KEY
CONVEX_DEPLOYMENT=https://YOUR_PROJECT.convex.cloud
CONVEX_AUTH_TOKEN=YOUR_ACTUAL_TOKEN
GOOGLE_APPLICATION_CREDENTIALS=./google-service-account.json
```

### Step 2: Restart Claude
After updating configurations:
1. Close Claude/Cursor
2. Reopen to load new MCP configurations
3. MCPs will be automatically available

### Step 3: Test Connections
Quick tests for each MCP:

```bash
# Test commands (Claude will execute these via MCPs)
# Clerk: Get current user
# Stripe: Retrieve balance
# Convex: Check deployment status
# Supabase: List tables
# Google: Verify API connectivity
```

## 📚 MCP Usage Examples

### Clerk Operations
```javascript
// Claude can now directly:
- Create users
- Update user metadata
- Manage organizations
- Handle invitations
```

### Stripe Operations
```javascript
// Claude can now directly:
- Create customers and products
- Generate payment links
- Manage subscriptions
- Process refunds
```

### Convex Operations
```javascript
// Claude can now directly:
- Query database
- Run functions
- Manage real-time subscriptions
- Deploy schema changes
```

### Supabase Operations
```javascript
// Claude can now directly:
- Execute SQL queries
- Manage tables
- Handle authentication
- Work with real-time data
```

### Netlify Operations
```javascript
// Claude can now directly:
- Deploy sites to production
- Update environment variables
- Monitor deployment status
- Rollback failed deployments
- Configure domain settings
```

## 🔐 Security Notes

1. **Never commit API keys**: All sensitive files are in `.gitignore`
2. **Use test keys in development**: Always use test/development keys locally
3. **Rotate keys regularly**: Update keys periodically for security
4. **Limit permissions**: Use minimal required permissions for service accounts

## 🚀 Benefits

- **Direct API Access**: Claude can directly interact with services
- **No Manual Configuration**: Automated setup and execution
- **Clear Communication**: Better understanding of operations
- **Error Handling**: Improved error messages and debugging
- **Faster Development**: Reduced context switching and manual work

## 📝 Next Steps

1. **Configure Missing Services**:
   - [ ] Set up Stripe account and add secret key
   - [ ] Create Convex project and add credentials
   - [ ] Set up Google Cloud project and service account
   - [ ] Generate Netlify personal access token

2. **Test Each MCP**:
   - [ ] Verify Clerk user operations
   - [ ] Test Stripe payment creation
   - [ ] Check Convex database access
   - [ ] Confirm Supabase connectivity
   - [ ] Test Google API calls
   - [ ] Verify Netlify deployment capabilities

3. **Production Setup**:
   - Use production keys in `.env.production`
   - Configure MCPs in production environment
   - Set up proper key rotation

## 🆘 Troubleshooting

### MCP Not Working?
1. Check if environment variables are set correctly
2. Restart Claude/Cursor after configuration changes
3. Verify API keys are valid and have proper permissions
4. Check network connectivity

### Common Issues:
- **"MCP not found"**: Restart editor after configuration
- **"Invalid API key"**: Verify key is correct and active
- **"Permission denied"**: Check API key permissions
- **"Connection failed"**: Verify network and service status

## 📖 Resources

- [Clerk Dashboard](https://dashboard.clerk.com)
- [Stripe Dashboard](https://dashboard.stripe.com)
- [Convex Dashboard](https://dashboard.convex.dev)
- [Supabase Dashboard](https://app.supabase.com)
- [Google Cloud Console](https://console.cloud.google.com)
- [Netlify Dashboard](https://app.netlify.com)

---

**Note**: This configuration enables Claude to have direct, programmatic access to all your development services, significantly improving development efficiency and reducing manual configuration work.