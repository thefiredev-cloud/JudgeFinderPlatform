export default function CaseStudiesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900">Case Studies</h1>
          <p className="mt-2 text-gray-600">See how legal professionals use JudgeFinder to win cases</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          <div className="bg-white rounded-lg shadow p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Smith & Associates</h2>
            <p className="text-lg text-blue-600 mb-4">Increased win rate by 23% using judicial analytics</p>
            <p className="text-gray-600 mb-6">
              "JudgeFinder's insights into Judge Martinez's ruling patterns helped us adjust our strategy 
              and present our case more effectively. The data on similar cases was invaluable."
            </p>
            <p className="text-sm text-gray-500">- John Smith, Managing Partner</p>
          </div>

          <div className="bg-white rounded-lg shadow p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Rodriguez Law Firm</h2>
            <p className="text-lg text-blue-600 mb-4">Saved 40+ hours per month on legal research</p>
            <p className="text-gray-600 mb-6">
              "The ability to quickly find relevant precedents and understand judicial tendencies has 
              transformed how we prepare cases. It's like having a research team at our fingertips."
            </p>
            <p className="text-sm text-gray-500">- Maria Rodriguez, Senior Attorney</p>
          </div>

          <div className="bg-white rounded-lg shadow p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Corporate Legal Department</h2>
            <p className="text-lg text-blue-600 mb-4">Reduced litigation costs by 35%</p>
            <p className="text-gray-600 mb-6">
              "Understanding judges' settlement tendencies and ruling patterns helped us make better 
              decisions about which cases to litigate and which to settle early."
            </p>
            <p className="text-sm text-gray-500">- David Chen, General Counsel</p>
          </div>
        </div>
      </div>
    </div>
  )
}
