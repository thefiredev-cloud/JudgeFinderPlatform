export default function IntegrationsPage() {
  const integrations = [
    { name: 'Clio', description: 'Sync judge data with your practice management software', logo: '🔗' },
    { name: 'LexisNexis', description: 'Enhanced research with judicial analytics', logo: '📚' },
    { name: 'Westlaw', description: 'Seamless integration with legal research', logo: '⚖️' },
    { name: 'Microsoft Office', description: 'Export reports directly to Word and Excel', logo: '📊' },
    { name: 'Google Workspace', description: 'Share insights with your team', logo: '☁️' },
    { name: 'Slack', description: 'Get notifications about judge updates', logo: '💬' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900">Integrations</h1>
          <p className="mt-2 text-gray-600">Connect JudgeFinder with your favorite legal tools</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {integrations.map((integration) => (
            <div key={integration.name} className="bg-white rounded-lg shadow p-6">
              <div className="text-4xl mb-4">{integration.logo}</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{integration.name}</h3>
              <p className="text-gray-600 mb-4">{integration.description}</p>
              <button className="text-blue-600 hover:text-blue-700 font-medium">
                Learn more →
              </button>
            </div>
          ))}
        </div>

        <div className="mt-12 bg-blue-50 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Don't see your tool?</h2>
          <p className="text-gray-600 mb-6">
            We're constantly adding new integrations. Let us know what you need.
          </p>
          <button className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 font-medium">
            Request Integration
          </button>
        </div>
      </div>
    </div>
  )
}
