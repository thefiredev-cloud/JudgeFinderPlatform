export default function CompliancePage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Compliance & Legal</h1>
        
        <div className="prose prose-gray max-w-none">
          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Data Protection</h2>
          <p className="text-gray-600 mb-4">
            JudgeFinder.io is committed to protecting user data and maintaining compliance with 
            all applicable data protection regulations including GDPR, CCPA, and other privacy laws.
          </p>
          
          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Legal Disclaimer</h2>
          <p className="text-gray-600 mb-4">
            The information provided on JudgeFinder.io is for general informational purposes only. 
            It should not be construed as legal advice or legal opinion on any specific facts or circumstances.
          </p>
          
          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Data Sources</h2>
          <p className="text-gray-600 mb-4">
            All data presented on JudgeFinder.io is sourced from publicly available court records 
            and official judicial databases. We ensure accuracy through regular updates and verification processes.
          </p>
          
          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Ethical Use</h2>
          <p className="text-gray-600 mb-4">
            Users of JudgeFinder.io agree to use the platform and its data in accordance with 
            applicable laws, professional ethics rules, and for legitimate legal research purposes only.
          </p>
          
          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Contact</h2>
          <p className="text-gray-600 mb-4">
            For compliance-related inquiries, please contact our legal team at compliance@judgefinder.io
          </p>
        </div>
      </div>
    </div>
  )
}
