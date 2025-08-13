export function WhyJudgeResearch() {
  const benefits = [
    {
      number: '73%',
      title: 'Higher Success Rate',
      description: 'Attorneys using judge analytics report significantly higher case success rates'
    },
    {
      number: '2.5x',
      title: 'Faster Preparation',
      description: 'Reduce case preparation time with instant access to judicial insights'
    },
    {
      number: '89%',
      title: 'Client Satisfaction',
      description: 'Improved client confidence through data-driven legal strategies'
    },
    {
      number: '$2.3M',
      title: 'Average Case Value',
      description: 'Higher settlement values achieved through strategic judge selection'
    }
  ]

  return (
    <div>
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-4">Why Judge Research Matters</h2>
        <p className="text-lg text-gray-400 max-w-2xl mx-auto">
          Data-driven insights that transform legal strategy and improve case outcomes
        </p>
      </div>

      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {benefits.map((benefit, index) => (
          <div key={index} className="text-center">
            <div className="mb-2 text-4xl font-bold text-blue-400">{benefit.number}</div>
            <h3 className="mb-2 text-lg font-semibold">{benefit.title}</h3>
            <p className="text-sm text-gray-400">{benefit.description}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 rounded-lg bg-gradient-to-r from-blue-600/20 to-purple-600/20 p-8">
        <blockquote className="text-center">
          <p className="mb-4 text-lg italic">
            "JudgeFinder transformed how we approach litigation. Having detailed insights into judicial 
            patterns has given us a significant competitive advantage in the courtroom."
          </p>
          <footer className="text-sm text-gray-400">
            — Sarah Mitchell, Senior Partner at Mitchell & Associates
          </footer>
        </blockquote>
      </div>
    </div>
  )
}