import { Book, Code, Database, Shield } from 'lucide-react'

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
            <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">Read more →</a>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <Code className="h-8 w-8 text-blue-600 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">API Reference</h2>
            <p className="text-gray-600 mb-4">Integrate JudgeFinder data into your applications</p>
            <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">View API docs →</a>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <Database className="h-8 w-8 text-blue-600 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Data Sources</h2>
            <p className="text-gray-600 mb-4">Understand where our data comes from and how it's processed</p>
            <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">Learn more →</a>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <Shield className="h-8 w-8 text-blue-600 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Best Practices</h2>
            <p className="text-gray-600 mb-4">Tips for getting the most out of judicial analytics</p>
            <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">Read guide →</a>
          </div>
        </div>
      </div>
    </div>
  )
}
