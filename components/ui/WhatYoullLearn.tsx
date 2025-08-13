import { BookOpen, TrendingUp, Clock, Users, Scale, FileText } from 'lucide-react'

export function WhatYoullLearn() {
  const features = [
    {
      icon: TrendingUp,
      title: 'Ruling Patterns',
      description: 'Analyze historical ruling patterns and decision trends across different case types'
    },
    {
      icon: Clock,
      title: 'Decision Timeline',
      description: 'Track average decision times and identify factors that influence case duration'
    },
    {
      icon: Scale,
      title: 'Reversal Rates',
      description: 'View appellate reversal rates and understand judicial decision stability'
    },
    {
      icon: Users,
      title: 'Attorney Success',
      description: 'See which attorneys have the highest success rates before specific judges'
    },
    {
      icon: FileText,
      title: 'Case Precedents',
      description: 'Access relevant case precedents and citations frequently used by judges'
    },
    {
      icon: BookOpen,
      title: 'Legal Preferences',
      description: 'Understand judges\' legal philosophies and interpretation preferences'
    }
  ]

  return (
    <div>
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-4">What You'll Learn About Each Judge</h2>
        <p className="text-lg text-gray-400 max-w-2xl mx-auto">
          Gain comprehensive insights into judicial behavior and decision-making patterns
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {features.map((feature, index) => {
          const Icon = feature.icon
          return (
            <div
              key={index}
              className="group rounded-lg border border-gray-800 bg-gray-900/50 p-6 transition-all hover:border-blue-600/50 hover:bg-gray-900"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600/10 text-blue-400 group-hover:bg-blue-600/20">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
              <p className="text-sm text-gray-400">{feature.description}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}