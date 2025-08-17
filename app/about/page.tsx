import { Scale, Users, TrendingUp, Shield, Gavel, Award } from 'lucide-react'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-blue-50 to-white px-4 py-16 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">
            About JudgeFinder.io
          </h1>
          <p className="mt-4 text-xl text-gray-600">
            Free judicial research to discover judicial patterns and biases
          </p>
        </div>
      </div>

      {/* Mission Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="lg:grid lg:grid-cols-2 lg:gap-8 items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Our Mission</h2>
            <p className="mt-4 text-lg text-gray-600">
              JudgeFinder.io democratizes access to judicial information by providing comprehensive, free research 
              tools for discovering judicial patterns and potential biases. Our platform serves attorneys 
              preparing for court appearances, litigants researching their assigned judges, and anyone 
              seeking transparency in judicial decision-making.
            </p>
            <p className="mt-4 text-lg text-gray-600">
              We believe that transparency in the judicial system strengthens democracy. By making judge 
              information freely accessible, we empower citizens to identify potential judicial biases 
              and make better-informed decisions about their legal representation and case strategies.
            </p>
          </div>
          <div className="mt-10 lg:mt-0">
            <div className="grid grid-cols-2 gap-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600">1,130</div>
                <div className="mt-2 text-sm text-gray-600">CA Judges Tracked</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600">167</div>
                <div className="mt-2 text-sm text-gray-600">Courts Covered</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600">100%</div>
                <div className="mt-2 text-sm text-gray-600">Free for Users</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600">852</div>
                <div className="mt-2 text-sm text-gray-600">Total Courts</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">How Our Freemium Model Works</h2>
            <p className="mt-4 text-xl text-gray-600">Free research for everyone, sustainable through attorney advertising</p>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div className="text-center">
              <div className="flex justify-center">
                <Scale className="h-12 w-12 text-blue-600" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">Free Research</h3>
              <p className="mt-2 text-gray-600">
                Complete judge profiles, analytics, and case history available to everyone at no cost
              </p>
            </div>
            <div className="text-center">
              <div className="flex justify-center">
                <Gavel className="h-12 w-12 text-blue-600" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">Judicial Appointments</h3>
              <p className="mt-2 text-gray-600">
                Empowering qualified candidates to research and prepare for judicial appointment opportunities
              </p>
            </div>
            <div className="text-center">
              <div className="flex justify-center">
                <Users className="h-12 w-12 text-blue-600" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">Attorney Advertising</h3>
              <p className="mt-2 text-gray-600">
                Law firms advertise their expertise to potential clients researching specific judges
              </p>
            </div>
            <div className="text-center">
              <div className="flex justify-center">
                <Award className="h-12 w-12 text-blue-600" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">Sustainable Platform</h3>
              <p className="mt-2 text-gray-600">
                Attorney advertising revenue keeps the platform free and continuously improving
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Our Impact Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Our Impact</h2>
          <p className="mt-4 text-xl text-gray-600">
            Supporting judicial excellence through transparency and accessibility
          </p>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-blue-600">For Aspiring Judges</h3>
              <p className="mt-4 text-gray-600">
                Research judicial patterns, understand court dynamics, and prepare comprehensively 
                for appointment interviews with complete transparency into the role you're seeking.
              </p>
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-bold text-blue-600">For Attorneys</h3>
              <p className="mt-4 text-gray-600">
                Connect with potential clients who are researching judges you practice before. 
                Premium advertising spots put your expertise in front of engaged prospects.
              </p>
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-bold text-blue-600">For the Public</h3>
              <p className="mt-4 text-gray-600">
                Access comprehensive judicial information that promotes transparency, 
                accountability, and public understanding of our court system.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
