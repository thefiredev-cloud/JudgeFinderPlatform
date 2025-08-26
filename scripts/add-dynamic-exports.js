const fs = require('fs');
const path = require('path');

// List of all API route files that need the dynamic export
const apiRoutes = [
  'app/api/webhooks/stripe/route.ts',
  'app/api/advertising/subscriptions/route.ts',
  'app/api/advertising/spots/available/route.ts',
  'app/api/advertising/portal/route.ts',
  'app/api/advertising/spots/book/route.ts',
  'app/api/advertising/spots/pricing/route.ts',
  'app/api/advertising/advertiser/create/route.ts',
  'app/api/stats/judges/route.ts',
  'app/api/stats/platform/route.ts',
  'app/api/stats/courts/route.ts',
  'app/api/analytics/chat-funnel/route.ts',
  'app/api/analytics/performance/route.ts',
  'app/api/analytics/revenue/route.ts',
  'app/api/analytics/conversion/route.ts',
  'app/api/analytics/revenue/county/route.ts',
  'app/api/judges/chat-search/route.ts',
  'app/api/judges/search/route.ts',
  'app/api/judges/[id]/slots/route.ts',
  'app/api/judges/[id]/case-outcomes/route.ts',
  'app/api/judges/[id]/recent-cases/route.ts',
  'app/api/judges/[id]/bias-analysis/route.ts',
  'app/api/judges/[id]/assignments/route.ts',
  'app/api/judges/[id]/analytics/route.ts',
  'app/api/judges/redirect/route.ts',
  'app/api/judges/related/route.ts',
  'app/api/judges/by-state/route.ts',
  'app/api/judges/la-county/route.ts',
  'app/api/judges/list/route.ts',
  'app/api/judges/orange-county/route.ts',
  'app/api/judges/recent-decisions/route.ts',
  'app/api/judges/by-slug/route.ts',
  'app/api/judges/advanced-search/route.ts',
  'app/api/courts/top-by-cases/route.ts',
  'app/api/courts/[id]/judges/route.ts',
  'app/api/courts/route.ts',
  'app/api/courts/by-slug/route.ts',
  'app/api/chat/route.ts',
  'app/api/admin/bias-analytics/route.ts',
  'app/api/admin/verification/route.ts',
  'app/api/admin/migrate/route.ts',
  'app/api/health/route.ts',
  'app/api/search/route.ts',
  'app/api/user/stats/route.ts',
  'app/api/pricing/resolve/route.ts',
  'app/api/auth/callback/route.ts'
];

const dynamicExport = "export const dynamic = 'force-dynamic'\n";

function addDynamicExport(filePath) {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    
    // Check if file exists
    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return false;
    }
    
    // Read the file
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Check if dynamic export already exists
    if (content.includes("export const dynamic = 'force-dynamic'")) {
      console.log(`✓ Already has dynamic export: ${filePath}`);
      return true;
    }
    
    // Find the position after imports
    const importRegex = /^import\s+.*$/gm;
    let lastImportMatch = null;
    let match;
    
    while ((match = importRegex.exec(content)) !== null) {
      lastImportMatch = match;
    }
    
    if (lastImportMatch) {
      // Insert after the last import
      const insertPosition = lastImportMatch.index + lastImportMatch[0].length;
      content = content.slice(0, insertPosition) + '\n\n' + dynamicExport + content.slice(insertPosition);
    } else {
      // No imports found, add at the beginning
      content = dynamicExport + '\n' + content;
    }
    
    // Write the updated content back
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✓ Added dynamic export to: ${filePath}`);
    return true;
  } catch (error) {
    console.error(`✗ Error processing ${filePath}:`, error.message);
    return false;
  }
}

console.log('Adding dynamic exports to API routes...\n');

let successCount = 0;
let failureCount = 0;

for (const route of apiRoutes) {
  if (addDynamicExport(route)) {
    successCount++;
  } else {
    failureCount++;
  }
}

console.log('\n' + '='.repeat(50));
console.log(`✓ Successfully updated: ${successCount} files`);
if (failureCount > 0) {
  console.log(`✗ Failed to update: ${failureCount} files`);
}
console.log('='.repeat(50));

process.exit(failureCount > 0 ? 1 : 0);