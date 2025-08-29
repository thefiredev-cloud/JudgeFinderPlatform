/**
 * Netlify Scheduled Function for Automated Data Sync
 * Runs daily to keep judge and court data fresh
 * 
 * Schedule: Daily at 2:00 AM PST
 * https://docs.netlify.com/functions/scheduled-functions/
 */

const { schedule } = require('@netlify/functions')

// Import sync services
const fetchJudges = async () => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/sync/judges`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.CRON_SECRET}`
      }
    })
    
    return await response.json()
  } catch (error) {
    console.error('Judge sync failed:', error)
    return { error: error.message }
  }
}

const fetchCourts = async () => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/sync/courts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.CRON_SECRET}`
      }
    })
    
    return await response.json()
  } catch (error) {
    console.error('Court sync failed:', error)
    return { error: error.message }
  }
}

const fetchDecisions = async () => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/sync/decisions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.CRON_SECRET}`
      }
    })
    
    return await response.json()
  } catch (error) {
    console.error('Decision sync failed:', error)
    return { error: error.message }
  }
}

const handler = async (event, context) => {
  console.log('🔄 Starting scheduled sync...')
  const startTime = Date.now()
  
  const results = {
    timestamp: new Date().toISOString(),
    success: false,
    judges: null,
    courts: null,
    decisions: null,
    duration: 0
  }
  
  try {
    // Run syncs in parallel for efficiency
    const [judgeResult, courtResult, decisionResult] = await Promise.allSettled([
      fetchJudges(),
      fetchCourts(),
      fetchDecisions()
    ])
    
    results.judges = judgeResult.status === 'fulfilled' ? judgeResult.value : { error: 'Failed' }
    results.courts = courtResult.status === 'fulfilled' ? courtResult.value : { error: 'Failed' }
    results.decisions = decisionResult.status === 'fulfilled' ? decisionResult.value : { error: 'Failed' }
    
    // Check if all syncs were successful
    results.success = 
      judgeResult.status === 'fulfilled' && !judgeResult.value.error &&
      courtResult.status === 'fulfilled' && !courtResult.value.error
    
    results.duration = Date.now() - startTime
    
    console.log('✅ Scheduled sync completed:', {
      success: results.success,
      duration: `${results.duration}ms`,
      judges: results.judges?.count || 0,
      courts: results.courts?.count || 0,
      decisions: results.decisions?.count || 0
    })
    
    return {
      statusCode: 200,
      body: JSON.stringify(results)
    }
    
  } catch (error) {
    console.error('❌ Scheduled sync failed:', error)
    
    results.error = error.message
    results.duration = Date.now() - startTime
    
    return {
      statusCode: 500,
      body: JSON.stringify(results)
    }
  }
}

// Schedule to run daily at 2:00 AM PST (10:00 AM UTC)
module.exports.handler = schedule('0 10 * * *', handler)