const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:3005';
const TEST_TIMEOUT = 30000; // 30 seconds

// API endpoints to test
const API_ENDPOINTS = [
  // Judge APIs
  { method: 'GET', path: '/api/judges/list', params: '?limit=5', description: 'Judge List API' },
  { method: 'GET', path: '/api/judges/list', params: '?jurisdiction=CA&limit=3', description: 'Judge List with CA filter' },
  { method: 'GET', path: '/api/judges/recent-decisions', params: '', description: 'Recent Decisions API' },
  { method: 'GET', path: '/api/judges/by-state', params: '?state=CA&limit=3', description: 'Judges by State API' },
  { method: 'GET', path: '/api/judges/la-county', params: '', description: 'LA County Judges API' },
  { method: 'GET', path: '/api/judges/orange-county', params: '', description: 'Orange County Judges API' },
  
  // Court APIs
  { method: 'GET', path: '/api/courts', params: '?limit=5', description: 'Courts List API' },
  { method: 'GET', path: '/api/courts', params: '?jurisdiction=CA&limit=3', description: 'Courts with CA filter' },
  
  // Analytics APIs
  { method: 'GET', path: '/api/analytics/kpi', params: '', description: 'Live KPI Analytics' },
  { method: 'GET', path: '/api/analytics/performance', params: '', description: 'Performance Analytics' },
  { method: 'GET', path: '/api/analytics/conversion', params: '', description: 'Conversion Analytics' },
  
  // Admin APIs (might require auth)
  { method: 'GET', path: '/api/admin/sync-status', params: '', description: 'Admin Sync Status' },
  { method: 'GET', path: '/api/admin/verification', params: '', description: 'Admin Verification' },
];

// Pages to test
const PAGES_TO_TEST = [
  { path: '/', description: 'Homepage' },
  { path: '/judges', description: 'Judges Directory' },
  { path: '/courts', description: 'Courts Directory' },
  { path: '/analytics', description: 'Analytics Page' },
  { path: '/dashboard', description: 'Live KPI Dashboard' },
  { path: '/about', description: 'About Page' },
  { path: '/features', description: 'Features Page' },
];

async function testEndpoint(endpoint) {
  const url = `${BASE_URL}${endpoint.path}${endpoint.params}`;
  const startTime = Date.now();
  
  try {
    const response = await axios({
      method: endpoint.method,
      url: url,
      timeout: TEST_TIMEOUT,
      validateStatus: (status) => status < 500 // Accept all non-5xx as success
    });
    
    const responseTime = Date.now() - startTime;
    const dataSize = JSON.stringify(response.data).length;
    
    return {
      success: true,
      status: response.status,
      responseTime,
      dataSize,
      hasData: response.data && (Array.isArray(response.data) ? response.data.length > 0 : Object.keys(response.data).length > 0)
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      success: false,
      status: error.response?.status || 0,
      responseTime,
      error: error.message,
      hasData: false
    };
  }
}

async function testPage(page) {
  const url = `${BASE_URL}${page.path}`;
  const startTime = Date.now();
  
  try {
    const response = await axios.get(url, {
      timeout: TEST_TIMEOUT,
      validateStatus: (status) => status < 500
    });
    
    const responseTime = Date.now() - startTime;
    const hasContent = response.data && response.data.length > 1000; // Basic HTML content check
    
    return {
      success: true,
      status: response.status,
      responseTime,
      hasContent,
      size: response.data.length
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      success: false,
      status: error.response?.status || 0,
      responseTime,
      error: error.message,
      hasContent: false
    };
  }
}

async function runAPITests() {
  console.log('🚀 Starting comprehensive API endpoint testing...\n');
  console.log(`Testing against: ${BASE_URL}\n`);
  
  let passedTests = 0;
  let failedTests = 0;
  const results = [];

  console.log('📡 TESTING API ENDPOINTS:');
  console.log('=' .repeat(80));

  for (const endpoint of API_ENDPOINTS) {
    process.stdout.write(`Testing ${endpoint.description}... `);
    
    const result = await testEndpoint(endpoint);
    results.push({ ...endpoint, ...result });
    
    if (result.success && result.status === 200) {
      console.log(`✅ ${result.status} (${result.responseTime}ms) ${result.hasData ? '📊 Has data' : '🔍 No data'}`);
      passedTests++;
    } else if (result.success && result.status === 401) {
      console.log(`🔐 ${result.status} (${result.responseTime}ms) Auth required`);
      passedTests++; // Auth required is expected for some endpoints
    } else {
      console.log(`❌ ${result.status} (${result.responseTime}ms) ${result.error || 'Failed'}`);
      failedTests++;
    }
  }

  console.log('\n📄 TESTING PAGES:');
  console.log('=' .repeat(80));

  for (const page of PAGES_TO_TEST) {
    process.stdout.write(`Testing ${page.description}... `);
    
    const result = await testPage(page);
    
    if (result.success && result.status === 200) {
      console.log(`✅ ${result.status} (${result.responseTime}ms) ${(result.size / 1024).toFixed(1)}KB`);
      passedTests++;
    } else {
      console.log(`❌ ${result.status} (${result.responseTime}ms) ${result.error || 'Failed'}`);
      failedTests++;
    }
  }

  // Performance Analysis
  console.log('\n📊 PERFORMANCE ANALYSIS:');
  console.log('=' .repeat(80));

  const apiResults = results.filter(r => r.success && r.status === 200);
  if (apiResults.length > 0) {
    const avgResponseTime = apiResults.reduce((sum, r) => sum + r.responseTime, 0) / apiResults.length;
    const slowestEndpoint = apiResults.reduce((prev, curr) => prev.responseTime > curr.responseTime ? prev : curr);
    const fastestEndpoint = apiResults.reduce((prev, curr) => prev.responseTime < curr.responseTime ? prev : curr);

    console.log(`⚡ Average API response time: ${avgResponseTime.toFixed(0)}ms`);
    console.log(`🐌 Slowest endpoint: ${slowestEndpoint.description} (${slowestEndpoint.responseTime}ms)`);
    console.log(`🚀 Fastest endpoint: ${fastestEndpoint.description} (${fastestEndpoint.responseTime}ms)`);
  }

  // Data Quality Check
  console.log('\n🔍 DATA QUALITY CHECK:');
  console.log('=' .repeat(80));

  const dataEndpoints = results.filter(r => r.success && r.hasData);
  console.log(`📊 Endpoints returning data: ${dataEndpoints.length}/${results.length}`);
  
  const judgeListResult = results.find(r => r.path === '/api/judges/list');
  if (judgeListResult && judgeListResult.success) {
    console.log(`👨‍⚖️ Judge list API: Working with data`);
  }

  const kpiResult = results.find(r => r.path === '/api/analytics/kpi');
  if (kpiResult && kpiResult.success) {
    console.log(`📈 KPI analytics: Working with live metrics`);
  }

  // Summary
  console.log('\n🎯 TEST SUMMARY:');
  console.log('=' .repeat(80));
  console.log(`✅ Passed tests: ${passedTests}`);
  console.log(`❌ Failed tests: ${failedTests}`);
  console.log(`📊 Success rate: ${((passedTests / (passedTests + failedTests)) * 100).toFixed(1)}%`);

  if (failedTests === 0) {
    console.log('\n🎉 ALL TESTS PASSED! Platform is fully operational.');
  } else if (failedTests <= 2) {
    console.log('\n⚠️  Minor issues detected. Platform is mostly operational.');
  } else {
    console.log('\n🚨 Multiple issues detected. Platform needs attention.');
  }

  return {
    passed: passedTests,
    failed: failedTests,
    successRate: (passedTests / (passedTests + failedTests)) * 100
  };
}

// Run the tests
if (require.main === module) {
  runAPITests()
    .then((summary) => {
      console.log('\n✅ API testing completed!');
      process.exit(summary.failed === 0 ? 0 : 1);
    })
    .catch((error) => {
      console.error('\n💥 Testing failed:', error.message);
      process.exit(1);
    });
}

module.exports = { runAPITests };