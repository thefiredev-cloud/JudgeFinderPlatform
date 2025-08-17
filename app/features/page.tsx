import { Search, BarChart, FileText, Users, TrendingUp, Shield } from 'lucide-react'

export default function FeaturesPage() {
  const features = [
    {
      icon: Search,
      title: 'Advanced Search',
      description: 'Search judges by name, court, jurisdiction, case type, and more with our powerful search engine.'
    },
    {
      icon: BarChart,
      title: 'Ruling Analytics',
      description: 'Analyze ruling patterns, win rates, and decision trends with interactive visualizations.'
    },
    {
      icon: FileText,
      title: 'Case History',
      description: 'Access comprehensive case histories and outcomes for thousands of judges nationwide.'
    },
    {
      icon: Users,
      title: 'Attorney Directory',
      description: 'Connect with attorneys who have experience before specific judges in your jurisdiction.'
    },
    {
      icon: TrendingUp,
      title: 'Predictive Insights',
      description: 'Get data-driven predictions on case outcomes based on historical patterns and trends.'
    },
    {
      icon: Shield,
      title: 'Secure & Reliable',
      description: 'Enterprise-grade security with 99.9% uptime guarantee and daily data updates.'
    }
  ]

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-gradient-to-b from-blue-50 to-white px-4 py-16 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">Powerful Features for Legal Professionals</h1>
          <p className="mt-4 text-xl text-gray-600">Everything you need to research judges and make informed decisions</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <div key={feature.title} className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Icon className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
