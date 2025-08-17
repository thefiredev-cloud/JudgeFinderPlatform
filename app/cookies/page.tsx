export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Cookie Policy</h1>
        
        <div className="prose prose-gray max-w-none">
          <p className="text-gray-600 mb-6">Last updated: January 2024</p>
          
          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">What Are Cookies</h2>
          <p className="text-gray-600 mb-4">
            Cookies are small pieces of text sent to your browser by a website you visit. 
            They help that website remember information about your visit.
          </p>
          
          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">How We Use Cookies</h2>
          <p className="text-gray-600 mb-4">
            We use cookies to understand how you use our site and to improve your experience. 
            This includes personalizing content and advertising.
          </p>
          
          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Types of Cookies We Use</h2>
          <ul className="list-disc pl-6 text-gray-600 mb-4">
            <li>Essential cookies: Required for the website to function properly</li>
            <li>Analytics cookies: Help us understand how visitors use our site</li>
            <li>Preference cookies: Remember your settings and preferences</li>
          </ul>
          
          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Managing Cookies</h2>
          <p className="text-gray-600 mb-4">
            You can control and/or delete cookies as you wish. You can delete all cookies 
            that are already on your computer and you can set most browsers to prevent them 
            from being placed.
          </p>
        </div>
      </div>
    </div>
  )
}
