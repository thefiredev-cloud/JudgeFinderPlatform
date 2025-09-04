import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

export const metadata = {
  title: 'Terms of Service - JudgeFinder.io',
  description: 'Terms of service and usage agreement for JudgeFinder.io'
}

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Terms of Service</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-gray max-w-none">
          <p className="text-gray-600 mb-6">Effective Date: January 2025</p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
            <p>
              By accessing or using JudgeFinder.io ("the Service"), you agree to be bound by these Terms of Service. 
              If you do not agree to these terms, please do not use our Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
            <p>
              JudgeFinder.io provides public information about judges in California courts, including:
            </p>
            <ul className="list-disc pl-6 mt-2">
              <li>Biographical and professional information</li>
              <li>Court assignments and jurisdictions</li>
              <li>Case statistics and decision patterns</li>
              <li>AI-powered analysis of judicial tendencies</li>
            </ul>
            <p className="mt-4">
              This information is derived from public court records and official databases.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. Disclaimer of Legal Advice</h2>
            <p className="font-semibold">
              JudgeFinder.io does not provide legal advice. The information on this platform is for informational purposes only.
            </p>
            <p className="mt-2">
              Users should not rely on this information as a substitute for professional legal counsel. Always consult with 
              a qualified attorney for legal matters.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Acceptable Use</h2>
            <p>You agree to use JudgeFinder.io only for lawful purposes. You may not:</p>
            <ul className="list-disc pl-6 mt-2">
              <li>Use the Service to harass, defame, or intimidate any person</li>
              <li>Attempt to access restricted areas of the Service</li>
              <li>Interfere with the Service's operation or security</li>
              <li>Scrape or harvest data without written permission</li>
              <li>Use automated systems to access the Service excessively</li>
              <li>Misrepresent the information provided by the Service</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Accuracy of Information</h2>
            <p>
              While we strive to maintain accurate and up-to-date information, JudgeFinder.io makes no warranties about 
              the completeness, reliability, or accuracy of the information provided. The Service is provided "as is."
            </p>
            <p className="mt-2">
              Users should verify critical information through official court sources when necessary.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Intellectual Property</h2>
            <p>
              The Service's design, features, and content (excluding public court data) are owned by JudgeFinder.io 
              and protected by intellectual property laws. You may not:
            </p>
            <ul className="list-disc pl-6 mt-2">
              <li>Copy, modify, or distribute our proprietary content</li>
              <li>Use our trademarks without permission</li>
              <li>Reverse engineer our AI algorithms or analytics</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. User Accounts</h2>
            <p>
              If you create an account, you are responsible for:
            </p>
            <ul className="list-disc pl-6 mt-2">
              <li>Maintaining the confidentiality of your credentials</li>
              <li>All activities that occur under your account</li>
              <li>Notifying us of any unauthorized use</li>
            </ul>
            <p className="mt-2">
              We reserve the right to suspend or terminate accounts that violate these terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Limitation of Liability</h2>
            <p>
              To the fullest extent permitted by law, JudgeFinder.io shall not be liable for any indirect, incidental, 
              special, consequential, or punitive damages arising from your use of the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Indemnification</h2>
            <p>
              You agree to indemnify and hold harmless JudgeFinder.io from any claims, damages, or expenses arising 
              from your use of the Service or violation of these terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. Privacy</h2>
            <p>
              Your use of the Service is also governed by our Privacy Policy, which describes how we collect, use, 
              and protect your information.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">11. Modifications</h2>
            <p>
              We reserve the right to modify these terms at any time. Continued use of the Service after changes 
              constitutes acceptance of the modified terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">12. Termination</h2>
            <p>
              We may terminate or suspend your access to the Service at our discretion, without notice, for any 
              violation of these terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">13. Governing Law</h2>
            <p>
              These terms are governed by the laws of California, United States. Any disputes shall be resolved in 
              the courts of California.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">14. Contact Information</h2>
            <p>
              For questions about these Terms of Service, please contact us at:
            </p>
            <p className="mt-2">
              Email: legal@judgefinder.io<br />
              Address: JudgeFinder.io, California, USA
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  )
}