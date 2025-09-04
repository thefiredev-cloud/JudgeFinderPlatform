import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Mail, MessageSquare, FileText } from 'lucide-react'

export const metadata = {
  title: 'Contact Us - JudgeFinder.io',
  description: 'Get in touch with the JudgeFinder.io team'
}

export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Contact Us</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-8">
            We're here to help with any questions about JudgeFinder.io or the judicial information we provide.
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-xl font-semibold mb-4">Get in Touch</h2>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-blue-600 mt-1" />
                  <div>
                    <h3 className="font-semibold">Email</h3>
                    <p className="text-gray-600">support@judgefinder.io</p>
                    <p className="text-sm text-gray-500 mt-1">We respond within 24-48 hours</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MessageSquare className="h-5 w-5 text-blue-600 mt-1" />
                  <div>
                    <h3 className="font-semibold">Feedback</h3>
                    <p className="text-gray-600">Share your suggestions to improve our platform</p>
                    <p className="text-sm text-gray-500 mt-1">feedback@judgefinder.io</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-blue-600 mt-1" />
                  <div>
                    <h3 className="font-semibold">Data Corrections</h3>
                    <p className="text-gray-600">Report inaccurate information</p>
                    <p className="text-sm text-gray-500 mt-1">corrections@judgefinder.io</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">Common Inquiries</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-800">Data Sources</h3>
                  <p className="text-gray-600 text-sm mt-1">
                    Our data comes from public court records and official judicial databases.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-800">Coverage</h3>
                  <p className="text-gray-600 text-sm mt-1">
                    We currently cover all California state courts with plans to expand.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-800">Updates</h3>
                  <p className="text-gray-600 text-sm mt-1">
                    Court data is updated daily to ensure accuracy and completeness.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-800">Legal Advice</h3>
                  <p className="text-gray-600 text-sm mt-1">
                    JudgeFinder.io provides information only and cannot offer legal advice.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-2">For Attorneys & Legal Professionals</h3>
            <p className="text-gray-600 text-sm">
              Interested in advanced analytics or bulk data access? Contact us at{' '}
              <a href="mailto:professional@judgefinder.io" className="text-blue-600 hover:underline">
                professional@judgefinder.io
              </a>
            </p>
          </div>

          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-2">Media Inquiries</h3>
            <p className="text-gray-600 text-sm">
              For press and media requests, please contact{' '}
              <a href="mailto:media@judgefinder.io" className="text-blue-600 hover:underline">
                media@judgefinder.io
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}