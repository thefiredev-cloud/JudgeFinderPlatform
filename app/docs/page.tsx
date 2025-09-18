import { Book, Code, Database, Shield } from 'lucide-react'
import Link from 'next/link'

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900">Documentation</h1>
          <p className="mt-2 text-gray-600">Everything you need to know about using JudgeFinder.io</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <Book className="h-8 w-8 text-blue-600 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Getting Started</h2>
            <p className="text-gray-600 mb-4">Learn the basics of searching and analyzing judicial data</p>
            <Link href="/help" className="text-blue-600 hover:text-blue-700 font-medium">Read more →</Link>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <Code className="h-8 w-8 text-blue-600 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">API Reference</h2>
            <p className="text-gray-600 mb-4">Integrate JudgeFinder data into your applications</p>
            <div className="flex flex-col gap-2">
              <Link href="/api/openapi" className="text-blue-600 hover:text-blue-700 font-medium">OpenAPI (JSON) →</Link>
              <div className="text-sm text-gray-600">
                <div className="font-mono bg-gray-100 rounded p-2 overflow-x-auto">
                  curl -s https://your-site/api/stats/judges | jq
                </div>
                <div className="font-mono bg-gray-100 rounded p-2 overflow-x-auto mt-2">
                  curl -s https://your-site/api/stats/courts | jq
                </div>
                <div className="font-mono bg-gray-100 rounded p-2 overflow-x-auto mt-2">
                  curl -s https://your-site/api/stats/cases | jq
                </div>
                <div className="font-mono bg-gray-100 rounded p-2 overflow-x-auto mt-2">
                  curl -s -H "x-api-key: $API_KEY" "https://your-site/api/v1/judges/search?q=smith" | jq
                </div>
                <div className="font-mono bg-gray-100 rounded p-2 overflow-x-auto mt-2">
                  curl -s -H "x-api-key: $API_KEY" "https://your-site/api/v1/judges/{$JUDGE_ID}" | jq
                </div>
                <div className="font-mono bg-gray-100 rounded p-2 overflow-x-auto mt-2">
                  curl -s -H "x-api-key: $API_KEY" "https://your-site/api/v1/judges/export?per_page=1000" > judges.csv
                </div>
                <div className="font-mono bg-gray-100 rounded p-2 overflow-x-auto mt-2">
                  curl -s -H "x-api-key: $API_KEY" "https://your-site/api/v1/judges/{$JUDGE_ID}/analytics/motions?since=2024-01-01&format=csv" > motions.csv
                </div>
                <div className="font-mono bg-gray-100 rounded p-2 overflow-x-auto mt-2">
                  curl -s -H "x-api-key: $API_KEY" "https://your-site/api/v1/analytics/time_to_ruling?judge_id={$JUDGE_ID}&format=csv" > ttr.csv
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <Database className="h-8 w-8 text-blue-600 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Architecture</h2>
            <p className="text-gray-600 mb-4">Understand the system design and data flows</p>
            <Link href="/docs/ARCHITECTURE" className="text-blue-600 hover:text-blue-700 font-medium">Read architecture →</Link>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <Shield className="h-8 w-8 text-blue-600 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Operations</h2>
            <p className="text-gray-600 mb-4">Deployments, runbooks, and environment setup</p>
            <div className="flex gap-4">
              <Link href="/docs/RUNBOOKS" className="text-blue-600 hover:text-blue-700 font-medium">Runbooks →</Link>
              <Link href="/docs/NETLIFY_ENV_SETUP" className="text-blue-600 hover:text-blue-700 font-medium">Netlify Setup →</Link>
              <Link href="/evaluation" className="text-blue-600 hover:text-blue-700 font-medium">Evaluation →</Link>
              <Link href="/trust" className="text-blue-600 hover:text-blue-700 font-medium">Trust →</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
