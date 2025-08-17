#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs').promises
const path = require('path')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function runSEOAudit() {
  console.log('🔍 Starting comprehensive SEO audit for JudgeFinder...\n')

  const audit = {
    timestamp: new Date().toISOString(),
    scores: {},
    issues: [],
    recommendations: [],
    summary: {}
  }

  try {
    // 1. Database Content Audit
    console.log('📊 Auditing database content...')
    const { data: judges, error: judgesError } = await supabase
      .from('judges')
      .select('id, name, court_name, jurisdiction, bio, education, appointed_date')
      .limit(1000)

    const { data: courts, error: courtsError } = await supabase
      .from('courts')
      .select('id, name, type, jurisdiction, address, phone, website')
      .limit(200)

    if (judgesError || courtsError) {
      audit.issues.push('Database connection issues detected')
    }

    const judgeCount = judges?.length || 0
    const courtCount = courts?.length || 0

    audit.summary.totalJudges = judgeCount
    audit.summary.totalCourts = courtCount

    console.log(`   ✅ ${judgeCount} judges found`)
    console.log(`   ✅ ${courtCount} courts found`)

    // 2. Content Quality Analysis
    console.log('\n📝 Analyzing content quality...')
    
    const judgesWithBio = judges?.filter(j => j.bio && j.bio.length > 50) || []
    const judgesWithEducation = judges?.filter(j => j.education) || []
    const judgesWithAppointmentDate = judges?.filter(j => j.appointed_date) || []

    const contentScore = Math.round(
      ((judgesWithBio.length / judgeCount) * 30 +
       (judgesWithEducation.length / judgeCount) * 25 +
       (judgesWithAppointmentDate.length / judgeCount) * 20 +
       (judgeCount > 1000 ? 25 : (judgeCount / 1000) * 25)) * 100
    ) / 100

    audit.scores.contentQuality = contentScore
    audit.summary.judgesWithBio = judgesWithBio.length
    audit.summary.judgesWithEducation = judgesWithEducation.length
    audit.summary.judgesWithAppointmentDate = judgesWithAppointmentDate.length

    console.log(`   📊 Content Quality Score: ${(contentScore * 100).toFixed(1)}%`)
    console.log(`   📋 ${judgesWithBio.length} judges with detailed bios`)
    console.log(`   🎓 ${judgesWithEducation.length} judges with education data`)
    console.log(`   📅 ${judgesWithAppointmentDate.length} judges with appointment dates`)

    // 3. URL Structure Audit
    console.log('\n🔗 Auditing URL structure...')
    
    const urlIssues = []
    judges?.slice(0, 50).forEach(judge => {
      const slug = `judge-${judge.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`
      if (slug.length > 60) urlIssues.push(`Long URL: ${judge.name}`)
      if (slug.includes('--')) urlIssues.push(`Double hyphens: ${judge.name}`)
    })

    const urlScore = Math.max(0, 1 - (urlIssues.length / 50))
    audit.scores.urlStructure = urlScore
    audit.issues.push(...urlIssues.slice(0, 10))

    console.log(`   🔗 URL Structure Score: ${(urlScore * 100).toFixed(1)}%`)
    if (urlIssues.length > 0) {
      console.log(`   ⚠️  ${urlIssues.length} URL issues found`)
    }

    // 4. Local SEO Audit for Courts
    console.log('\n📍 Auditing local SEO for courts...')
    
    const courtsWithAddress = courts?.filter(c => c.address) || []
    const courtsWithPhone = courts?.filter(c => c.phone) || []
    const courtsWithWebsite = courts?.filter(c => c.website) || []

    const localSEOScore = (
      (courtsWithAddress.length / courtCount) * 0.4 +
      (courtsWithPhone.length / courtCount) * 0.3 +
      (courtsWithWebsite.length / courtCount) * 0.3
    )

    audit.scores.localSEO = localSEOScore
    audit.summary.courtsWithAddress = courtsWithAddress.length
    audit.summary.courtsWithPhone = courtsWithPhone.length
    audit.summary.courtsWithWebsite = courtsWithWebsite.length

    console.log(`   📍 Local SEO Score: ${(localSEOScore * 100).toFixed(1)}%`)
    console.log(`   📧 ${courtsWithAddress.length}/${courtCount} courts with addresses`)
    console.log(`   📞 ${courtsWithPhone.length}/${courtCount} courts with phone numbers`)
    console.log(`   🌐 ${courtsWithWebsite.length}/${courtCount} courts with websites`)

    // 5. Technical SEO File Audit
    console.log('\n⚙️  Auditing technical SEO files...')
    
    const technicalChecks = []
    
    try {
      const sitemapExists = await fs.access(path.join(process.cwd(), 'app/sitemap.ts')).then(() => true).catch(() => false)
      const robotsExists = await fs.access(path.join(process.cwd(), 'app/robots.txt')).then(() => true).catch(() => false)
      
      technicalChecks.push({ name: 'Dynamic sitemap', exists: sitemapExists })
      technicalChecks.push({ name: 'Robots.txt', exists: robotsExists })
      
      const technicalScore = technicalChecks.filter(c => c.exists).length / technicalChecks.length
      audit.scores.technical = technicalScore

      console.log(`   ⚙️  Technical SEO Score: ${(technicalScore * 100).toFixed(1)}%`)
      technicalChecks.forEach(check => {
        console.log(`   ${check.exists ? '✅' : '❌'} ${check.name}`)
      })
    } catch (error) {
      audit.issues.push('Technical file audit failed')
    }

    // 6. Generate Recommendations
    console.log('\n💡 Generating SEO recommendations...')
    
    if (contentScore < 0.7) {
      audit.recommendations.push({
        priority: 'High',
        area: 'Content Quality',
        issue: 'Many judge profiles lack detailed biographical information',
        solution: 'Enrich judge profiles with comprehensive bios, education, and career backgrounds from CourtListener data',
        impact: 'Higher search rankings for individual judge searches'
      })
    }

    if (localSEOScore < 0.8) {
      audit.recommendations.push({
        priority: 'Medium',
        area: 'Local SEO',
        issue: 'Court profiles missing contact information',
        solution: 'Complete address, phone, and website data for all court profiles',
        impact: 'Better rankings for "[Court Name] [City]" local searches'
      })
    }

    if (judgeCount < 1100) {
      audit.recommendations.push({
        priority: 'Medium',
        area: 'Content Scale',
        issue: 'Content inventory below target of 1,130 judges',
        solution: 'Complete data sync from CourtListener to reach full California coverage',
        impact: 'Broader keyword coverage and higher domain authority'
      })
    }

    // Always include revenue-focused recommendations
    audit.recommendations.push({
      priority: 'High',
      area: 'Revenue Optimization',
      issue: 'SEO improvements directly impact attorney slot revenue',
      solution: 'Focus on optimizing top 100 most-searched judges for maximum traffic to attorney slots',
      impact: `Each 10% traffic increase could generate $280K+ additional monthly revenue`
    })

    // 7. Calculate Overall SEO Score
    const overallScore = (
      (audit.scores.contentQuality || 0) * 0.35 +
      (audit.scores.urlStructure || 0) * 0.20 +
      (audit.scores.localSEO || 0) * 0.25 +
      (audit.scores.technical || 0) * 0.20
    )

    audit.scores.overall = overallScore

    // 8. Generate Report Summary
    console.log('\n📋 SEO Audit Summary')
    console.log('='.repeat(50))
    console.log(`Overall SEO Score: ${(overallScore * 100).toFixed(1)}%`)
    console.log(`Content Quality: ${(audit.scores.contentQuality * 100).toFixed(1)}%`)
    console.log(`URL Structure: ${(audit.scores.urlStructure * 100).toFixed(1)}%`)
    console.log(`Local SEO: ${(audit.scores.localSEO * 100).toFixed(1)}%`)
    console.log(`Technical SEO: ${(audit.scores.technical * 100).toFixed(1)}%`)
    console.log('='.repeat(50))

    console.log(`\n📈 Revenue Impact Analysis:`)
    console.log(`• Current scale: ${judgeCount} judge profiles`)
    console.log(`• Attorney slots: 5 slots × $500/mo × ${judgeCount} judges`)
    console.log(`• Revenue potential: $${((5 * 500 * judgeCount) / 1000).toFixed(0)}K monthly`)
    console.log(`• SEO improvement target: +25% organic traffic`)
    console.log(`• Revenue opportunity: $${((5 * 500 * judgeCount * 0.25) / 1000).toFixed(0)}K additional monthly`)

    // 9. Top Priority Actions
    console.log(`\n🎯 Top Priority SEO Actions:`)
    audit.recommendations.slice(0, 3).forEach((rec, i) => {
      console.log(`${i + 1}. [${rec.priority}] ${rec.area}: ${rec.solution}`)
    })

    // 10. Save Audit Report
    const reportPath = path.join(process.cwd(), `seo-audit-${Date.now()}.json`)
    await fs.writeFile(reportPath, JSON.stringify(audit, null, 2))
    console.log(`\n💾 Detailed audit saved to: ${reportPath}`)

    console.log(`\n✅ SEO audit completed successfully!`)
    
    // Exit with appropriate code based on score
    if (overallScore < 0.6) {
      console.log(`⚠️  SEO score below 60% - immediate attention required`)
      process.exit(1)
    } else if (overallScore < 0.8) {
      console.log(`📊 SEO score good but has room for improvement`)
      process.exit(0)
    } else {
      console.log(`🚀 Excellent SEO score - keep optimizing!`)
      process.exit(0)
    }

  } catch (error) {
    console.error('❌ SEO audit failed:', error.message)
    audit.issues.push(`Audit error: ${error.message}`)
    process.exit(1)
  }
}

if (require.main === module) {
  runSEOAudit()
}

module.exports = { runSEOAudit }
