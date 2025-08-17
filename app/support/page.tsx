import { Mail, MessageSquare, Phone, Clock } from 'lucide-react'

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900">Support Center</h1>
          <p className="mt-2 text-gray-600">We're here to help you succeed</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <Mail className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Email Support</h3>
            <p className="text-gray-600 mb-4">Get help via email within 24 hours</p>
            <a href="mailto:support@judgefinder.io" className="text-blue-600 hover:text-blue-700 font-medium">
              support@judgefinder.io
            </a>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <MessageSquare className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Live Chat</h3>
            <p className="text-gray-600 mb-4">Chat with our team in real-time</p>
            <button className="text-blue-600 hover:text-blue-700 font-medium">
              Start Chat
            </button>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <Phone className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Phone Support</h3>
            <p className="text-gray-600 mb-4">Enterprise customers only</p>
            <p className="text-blue-600 font-medium">1-800-JUDGE-FI</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">How do I search for a specific judge?</h3>
              <p className="text-gray-600">Use our search bar on the homepage or browse judges page. You can search by name, court, or jurisdiction.</p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">What data sources do you use?</h3>
              <p className="text-gray-600">We aggregate data from public court records, including federal PACER system and state court databases.</p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">How often is data updated?</h3>
              <p className="text-gray-600">Our database is updated daily with new cases and decisions from courts across the country.</p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Can I export data?</h3>
              <p className="text-gray-600">Yes, Professional and Enterprise plans include data export features in PDF and Excel formats.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
