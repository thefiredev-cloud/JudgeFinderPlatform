import Link from 'next/link'
import { CheckCircle, Building, Users, FileText, BarChart3, Shield, Zap, HeadphonesIcon } from 'lucide-react'

export default function ProfessionalPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      {/* Hero Section */}
      <section className="relative px-4 py-20 md:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <div className="mb-4 inline-block rounded-full bg-blue-600/10 px-4 py-2 text-sm font-medium text-enterprise-primary border border-enterprise-primary/20">
              For Legal Professionals Only
            </div>
            <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl">
              Professional Access to
              <span className="bg-gradient-to-r from-enterprise-primary to-enterprise-deep bg-clip-text text-transparent">
                {" "}Advanced Analytics
              </span>
            </h1>
            <p className="mx-auto mb-12 max-w-3xl text-lg text-gray-300 md:text-xl">
              While basic judge analytics are free for everyone, legal professionals gain access to powerful 
              tools, export capabilities, and team collaboration features designed for law firms.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Link 
                href="/sign-up" 
                className="rounded-lg bg-gradient-to-r from-enterprise-primary to-enterprise-deep px-8 py-4 font-semibold text-white transition hover:shadow-xl hover:shadow-enterprise-deep/25 text-center"
              >
                Start Professional Registration
              </Link>
              <Link 
                href="/judges" 
                className="rounded-lg border border-gray-600 px-8 py-4 font-semibold text-white transition hover:bg-gray-800 text-center"
              >
                Browse Free Analytics
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-4 py-16 bg-gray-900/50">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-3xl font-bold text-center mb-12">
            Professional Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Export Reports */}
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 hover:border-enterprise-primary/50 transition">
              <FileText className="w-10 h-10 text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Export Reports</h3>
              <p className="text-gray-400">
                Download comprehensive judicial analytics reports in PDF or Excel format for client presentations and case preparation.
              </p>
            </div>

            {/* Team Collaboration */}
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 hover:border-purple-600/50 transition">
              <Users className="w-10 h-10 text-purple-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Team Collaboration</h3>
              <p className="text-gray-400">
                Share insights, add case notes, and collaborate with your entire legal team on judge research and strategy.
              </p>
            </div>

            {/* API Access */}
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 hover:border-green-500/50 transition">
              <Zap className="w-10 h-10 text-green-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">API Integration</h3>
              <p className="text-gray-400">
                Integrate judicial analytics directly into your firm's case management system with our professional API.
              </p>
            </div>

            {/* Advanced Analytics */}
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 hover:border-orange-500/50 transition">
              <BarChart3 className="w-10 h-10 text-orange-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Advanced Analytics</h3>
              <p className="text-gray-400">
                Access deeper insights with trend analysis, predictive modeling, and custom analytics dashboards.
              </p>
            </div>

            {/* Priority Support */}
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 hover:border-pink-500/50 transition">
              <HeadphonesIcon className="w-10 h-10 text-pink-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Priority Support</h3>
              <p className="text-gray-400">
                Get dedicated support from our legal analytics experts with guaranteed response times and personalized assistance.
              </p>
            </div>

            {/* Security & Compliance */}
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 hover:border-cyan-500/50 transition">
              <Shield className="w-10 h-10 text-cyan-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Enterprise Security</h3>
              <p className="text-gray-400">
                Bank-level encryption, SOC 2 compliance, and dedicated security features for sensitive legal data.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold text-center mb-12">
            Compare Access Levels
          </h2>
          <div className="bg-gray-800/30 rounded-xl overflow-hidden border border-gray-700">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left p-6">Feature</th>
                  <th className="text-center p-6">
                    <div className="text-gray-400">Public Access</div>
                    <div className="text-sm text-gray-500">Free</div>
                  </th>
                  <th className="text-center p-6">
                    <div className="text-blue-600">Professional</div>
                    <div className="text-sm text-gray-500">Law Firms</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-700/50">
                  <td className="p-6">View Judge Profiles</td>
                  <td className="text-center p-6">
                    <CheckCircle className="w-5 h-5 text-green-400 mx-auto" />
                  </td>
                  <td className="text-center p-6">
                    <CheckCircle className="w-5 h-5 text-green-400 mx-auto" />
                  </td>
                </tr>
                <tr className="border-b border-gray-700/50">
                  <td className="p-6">Basic Analytics</td>
                  <td className="text-center p-6">
                    <CheckCircle className="w-5 h-5 text-green-400 mx-auto" />
                  </td>
                  <td className="text-center p-6">
                    <CheckCircle className="w-5 h-5 text-green-400 mx-auto" />
                  </td>
                </tr>
                <tr className="border-b border-gray-700/50">
                  <td className="p-6">Search Judges</td>
                  <td className="text-center p-6">
                    <CheckCircle className="w-5 h-5 text-green-400 mx-auto" />
                  </td>
                  <td className="text-center p-6">
                    <CheckCircle className="w-5 h-5 text-green-400 mx-auto" />
                  </td>
                </tr>
                <tr className="border-b border-gray-700/50">
                  <td className="p-6">Export Reports</td>
                  <td className="text-center p-6">
                    <span className="text-gray-500">—</span>
                  </td>
                  <td className="text-center p-6">
                    <CheckCircle className="w-5 h-5 text-green-400 mx-auto" />
                  </td>
                </tr>
                <tr className="border-b border-gray-700/50">
                  <td className="p-6">Save & Bookmark</td>
                  <td className="text-center p-6">
                    <span className="text-gray-500">—</span>
                  </td>
                  <td className="text-center p-6">
                    <CheckCircle className="w-5 h-5 text-green-400 mx-auto" />
                  </td>
                </tr>
                <tr className="border-b border-gray-700/50">
                  <td className="p-6">Team Collaboration</td>
                  <td className="text-center p-6">
                    <span className="text-gray-500">—</span>
                  </td>
                  <td className="text-center p-6">
                    <CheckCircle className="w-5 h-5 text-green-400 mx-auto" />
                  </td>
                </tr>
                <tr className="border-b border-gray-700/50">
                  <td className="p-6">API Access</td>
                  <td className="text-center p-6">
                    <span className="text-gray-500">—</span>
                  </td>
                  <td className="text-center p-6">
                    <CheckCircle className="w-5 h-5 text-green-400 mx-auto" />
                  </td>
                </tr>
                <tr>
                  <td className="p-6">Priority Support</td>
                  <td className="text-center p-6">
                    <span className="text-gray-500">—</span>
                  </td>
                  <td className="text-center p-6">
                    <CheckCircle className="w-5 h-5 text-green-400 mx-auto" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Who This Is For */}
      <section className="px-4 py-16 bg-gray-900/50">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold text-center mb-12">
            Who Should Register?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-blue-900/20 rounded-xl p-8 border border-blue-700/50">
              <Building className="w-12 h-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold mb-4">Law Firms</h3>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Multi-attorney firms needing team collaboration</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Litigation teams requiring detailed reports</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Firms wanting API integration with case management</span>
                </li>
              </ul>
            </div>
            <div className="bg-purple-900/20 rounded-xl p-8 border border-purple-700/50">
              <Users className="w-12 h-12 text-purple-600 mb-4" />
              <h3 className="text-xl font-semibold mb-4">Legal Professionals</h3>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Solo practitioners needing professional tools</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Attorneys requiring export capabilities</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Legal consultants and expert witnesses</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-20 border-t border-gray-800">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">
            Ready to Unlock Professional Features?
          </h2>
          <p className="mb-8 text-lg text-gray-300">
            Join law firms across California using advanced judicial analytics to win cases.
          </p>
          <Link 
            href="/sign-up" 
            className="inline-block rounded-lg bg-gradient-to-r from-enterprise-primary to-enterprise-deep px-10 py-4 font-semibold text-white transition hover:shadow-xl hover:shadow-enterprise-deep/25"
          >
            Start Professional Registration
          </Link>
          <p className="mt-6 text-sm text-gray-400">
            Professional verification required • Bar number or firm credentials needed
          </p>
        </div>
      </section>
    </div>
  )
}