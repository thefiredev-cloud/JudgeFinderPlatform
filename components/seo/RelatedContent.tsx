/**
 * Related Content System for internal linking and content discovery
 * Enhances SEO through strategic internal linking and user engagement
 */

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Judge } from '@/types'

interface RelatedContentProps {
  currentJudge: Judge
  relatedJudges: Judge[]
  jurisdiction: string
  courtName: string
}

export function RelatedContent({ 
  currentJudge, 
  relatedJudges, 
  jurisdiction, 
  courtName 
}: RelatedContentProps) {
  const safeName = currentJudge.name || 'Unknown Judge'
  const cleanName = safeName.replace(/^(judge|justice|the honorable)\s+/i, '')
  
  return (
    <div className="space-y-8">
      {/* Related Judges Section */}
      {relatedJudges.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              Other Judges in {jurisdiction}
            </CardTitle>
            <p className="text-sm text-gray-600">
              Explore other judicial officers serving in {jurisdiction}
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {relatedJudges.slice(0, 5).map((judge) => {
                const relatedName = judge.name?.replace(/^(judge|justice|the honorable)\s+/i, '') || 'Unknown Judge'
                const slug = judge.slug || judge.name?.toLowerCase().replace(/\s+/g, '-') || 'unknown'
                
                return (
                  <Link 
                    key={judge.id} 
                    href={`/judges/${slug}`}
                    className="block p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-gray-900">
                          Judge {relatedName}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {judge.court_name || courtName}
                        </p>
                        {judge.appointed_date && (
                          <p className="text-xs text-gray-500">
                            Appointed {new Date(judge.appointed_date).getFullYear()}
                          </p>
                        )}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        View Profile
                      </Badge>
                    </div>
                  </Link>
                )
              })}
            </div>
            
            <div className="mt-4 pt-4 border-t">
              <Link 
                href={`/jurisdictions/${jurisdiction.toLowerCase().replace(/\s+/g, '-')}`}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                View All {jurisdiction} Judges →
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Court Information Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            {courtName}
          </CardTitle>
          <p className="text-sm text-gray-600">
            Learn more about Judge {cleanName}'s court
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="p-3 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Court Information</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Jurisdiction: {jurisdiction}</li>
                <li>• Court Type: {getCourtType(courtName)}</li>
                <li>• Service Area: {getServiceArea(jurisdiction)}</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <Link 
                href={`/courts/${courtName.toLowerCase().replace(/\s+/g, '-')}`}
                className="block p-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                View {courtName} Directory →
              </Link>
              <Link 
                href={`/jurisdictions/${jurisdiction.toLowerCase().replace(/\s+/g, '-')}`}
                className="block p-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Explore {jurisdiction} Legal System →
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Legal Resources Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            Legal Resources
          </CardTitle>
          <p className="text-sm text-gray-600">
            Additional resources for legal professionals and litigants
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-2">
              <Link 
                href={`/attorneys/${jurisdiction.toLowerCase().replace(/\s+/g, '-')}`}
                className="p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
              >
                <h4 className="font-medium text-gray-900">Attorney Directory</h4>
                <p className="text-sm text-gray-600">
                  Find experienced attorneys in {jurisdiction}
                </p>
              </Link>
              
              <Link 
                href={`/case-analytics/${jurisdiction.toLowerCase().replace(/\s+/g, '-')}`}
                className="p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
              >
                <h4 className="font-medium text-gray-900">Case Analytics</h4>
                <p className="text-sm text-gray-600">
                  Research case patterns and outcomes
                </p>
              </Link>
              
              <Link 
                href="/legal-research-tools"
                className="p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
              >
                <h4 className="font-medium text-gray-900">Research Tools</h4>
                <p className="text-sm text-gray-600">
                  Advanced legal research and analytics
                </p>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SEO-focused Content Links */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            Popular Searches
          </CardTitle>
          <p className="text-sm text-gray-600">
            Frequently searched judicial information
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-2 text-sm">
            <Link 
              href={`/judges?jurisdiction=${encodeURIComponent(jurisdiction)}`}
              className="text-blue-600 hover:text-blue-800 hover:underline"
            >
              All {jurisdiction} Judges
            </Link>
            <Link 
              href={`/judges?court=${encodeURIComponent(courtName)}`}
              className="text-blue-600 hover:text-blue-800 hover:underline"
            >
              {getCourtType(courtName)} Judges
            </Link>
            <Link 
              href="/judges?experience=veteran"
              className="text-blue-600 hover:text-blue-800 hover:underline"
            >
              Veteran Judges (15+ Years)
            </Link>
            <Link 
              href="/judges?recently-appointed=true"
              className="text-blue-600 hover:text-blue-800 hover:underline"
            >
              Recently Appointed Judges
            </Link>
            <Link 
              href="/judicial-analytics"
              className="text-blue-600 hover:text-blue-800 hover:underline"
            >
              Judicial Analytics Dashboard
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Helper function to determine court type
 */
function getCourtType(courtName: string): string {
  const name = courtName.toLowerCase()
  
  if (name.includes('superior')) return 'Superior Court'
  if (name.includes('appeal')) return 'Court of Appeal'
  if (name.includes('supreme')) return 'Supreme Court'
  if (name.includes('federal')) return 'Federal Court'
  if (name.includes('family')) return 'Family Court'
  if (name.includes('criminal')) return 'Criminal Court'
  if (name.includes('civil')) return 'Civil Court'
  
  return 'Court'
}

/**
 * Helper function to determine service area
 */
function getServiceArea(jurisdiction: string): string {
  const jurisdictionData: Record<string, string> = {
    'Orange County': '3.2M residents across 34 cities',
    'Los Angeles County': '10M residents across 88 cities',
    'San Francisco County': '875K residents in San Francisco',
    'San Diego County': '3.3M residents across 18 cities',
    'Sacramento County': '1.6M residents across 19 cities',
    'Alameda County': '1.7M residents across 14 cities',
    'Santa Clara County': '1.9M residents across 15 cities',
    'Riverside County': '2.4M residents across 28 cities',
    'San Bernardino County': '2.2M residents across 24 cities',
    'California': '39M residents statewide'
  }
  
  return jurisdictionData[jurisdiction] || `${jurisdiction} residents`
}