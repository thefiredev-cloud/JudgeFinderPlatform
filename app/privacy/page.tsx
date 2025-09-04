import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

export const metadata = {
  title: 'Privacy Policy - JudgeFinder.io',
  description: 'Privacy policy and data protection information for JudgeFinder.io'
}

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Privacy Policy</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-gray max-w-none">
          <p className="text-gray-600 mb-6">Last updated: January 2025</p>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Information We Collect</h2>
            <p>JudgeFinder.io collects minimal personal information:</p>
            <ul className="list-disc pl-6 mt-2">
              <li>Email address (when you create an account)</li>
              <li>Search queries and browsing history on our platform</li>
              <li>Usage analytics to improve our services</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. How We Use Your Information</h2>
            <p>We use collected information to:</p>
            <ul className="list-disc pl-6 mt-2">
              <li>Provide and maintain our judicial transparency services</li>
              <li>Improve user experience and platform functionality</li>
              <li>Send important service updates (with your consent)</li>
              <li>Ensure platform security and prevent abuse</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. Data Protection</h2>
            <p>We implement industry-standard security measures including:</p>
            <ul className="list-disc pl-6 mt-2">
              <li>Encrypted data transmission (HTTPS)</li>
              <li>Secure database storage with Supabase</li>
              <li>Regular security audits and updates</li>
              <li>Limited access to user data by authorized personnel only</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Public Court Data</h2>
            <p>JudgeFinder.io displays publicly available court data from official sources. This includes:</p>
            <ul className="list-disc pl-6 mt-2">
              <li>Judge profiles and court assignments</li>
              <li>Public case decisions and rulings</li>
              <li>Court statistics and performance metrics</li>
            </ul>
            <p className="mt-2">This public data is not considered personal information.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-6 mt-2">
              <li>Access your personal data</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your account and associated data</li>
              <li>Opt-out of marketing communications</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Cookies and Tracking</h2>
            <p>We use essential cookies and analytics to:</p>
            <ul className="list-disc pl-6 mt-2">
              <li>Maintain your login session</li>
              <li>Remember your preferences</li>
              <li>Analyze platform usage patterns</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Third-Party Services</h2>
            <p>We integrate with trusted third-party services:</p>
            <ul className="list-disc pl-6 mt-2">
              <li>Clerk for authentication</li>
              <li>Supabase for database services</li>
              <li>CourtListener for court data</li>
            </ul>
            <p className="mt-2">Each service has its own privacy policy.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Contact Us</h2>
            <p>For privacy concerns or data requests, contact us at:</p>
            <p className="mt-2">
              Email: privacy@judgefinder.io<br />
              Address: JudgeFinder.io, California, USA
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Changes to This Policy</h2>
            <p>We may update this privacy policy periodically. We will notify you of significant changes via email or platform notification.</p>
          </section>
        </CardContent>
      </Card>
    </div>
  )
}