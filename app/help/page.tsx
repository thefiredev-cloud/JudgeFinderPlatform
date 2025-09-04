'use client'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'

const faqs = [
  {
    question: "What is JudgeFinder.io?",
    answer: "JudgeFinder.io is a free judicial transparency platform that provides information about California judges, including their backgrounds, case statistics, and AI-powered analysis of judicial patterns."
  },
  {
    question: "How do I search for a judge?",
    answer: "Use the search bar on the homepage to enter a judge's name, court, or jurisdiction. You can also browse by county or use our advanced search filters to find judges by specific criteria."
  },
  {
    question: "What information is available for each judge?",
    answer: "Each judge profile includes biographical information, current court assignment, case statistics, decision patterns, reversal rates, and AI-generated insights about their judicial tendencies."
  },
  {
    question: "Is the information on JudgeFinder.io accurate?",
    answer: "Yes, our data comes from official court records and public databases. We update our information daily and use multiple sources to ensure accuracy. However, if you find any errors, please report them to corrections@judgefinder.io."
  },
  {
    question: "What is the AI bias analysis?",
    answer: "Our AI analyzes patterns in judicial decisions to identify potential biases or tendencies. This includes metrics like consistency, decision speed, settlement preferences, and case outcome patterns. The analysis is based on public court records and uses advanced machine learning algorithms."
  },
  {
    question: "Can I compare multiple judges?",
    answer: "Yes! Our comparison tool allows you to compare up to 3 judges side-by-side. This is useful for understanding differences in judicial approaches and decision patterns."
  },
  {
    question: "Is JudgeFinder.io free to use?",
    answer: "Yes, JudgeFinder.io is completely free for public use. We believe judicial transparency should be accessible to everyone."
  },
  {
    question: "How often is the data updated?",
    answer: "Court data is synchronized daily at 2:00 AM and 2:00 PM PST. Comprehensive updates including new case decisions and analytics are processed weekly."
  },
  {
    question: "Can JudgeFinder.io provide legal advice?",
    answer: "No, JudgeFinder.io is an information platform only. We provide data and analysis about judges but cannot offer legal advice. Please consult with a licensed attorney for legal guidance."
  },
  {
    question: "Which courts are covered?",
    answer: "We currently cover all California state courts, including Superior Courts, Courts of Appeal, and the California Supreme Court. We have information on over 1,800 judges across 104 court locations."
  },
  {
    question: "How can I report incorrect information?",
    answer: "If you find any inaccuracies, please email corrections@judgefinder.io with details about the error and any supporting documentation. We review all reports promptly."
  },
  {
    question: "Can attorneys use this for case preparation?",
    answer: "Yes, many attorneys use JudgeFinder.io to understand judicial tendencies and prepare more effectively for court appearances. The platform provides valuable insights for case strategy."
  }
]

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="border-b border-gray-200 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-4 px-2 flex justify-between items-start text-left hover:bg-gray-50 transition-colors"
      >
        <span className="font-semibold text-gray-800 pr-4">{question}</span>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 text-gray-500 flex-shrink-0" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-500 flex-shrink-0" />
        )}
      </button>
      {isOpen && (
        <div className="px-2 pb-4">
          <p className="text-gray-600">{answer}</p>
        </div>
      )}
    </div>
  )
}

export default function HelpPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Help & FAQ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Frequently Asked Questions</h2>
            <div className="bg-white rounded-lg">
              {faqs.map((faq, index) => (
                <FAQItem key={index} question={faq.question} answer={faq.answer} />
              ))}
            </div>
          </div>

          <div className="mt-8 grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Start Guide</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="list-decimal list-inside space-y-2 text-gray-600">
                  <li>Enter a judge's name in the search bar</li>
                  <li>Select the correct judge from search results</li>
                  <li>Review their profile and statistics</li>
                  <li>Check the AI bias analysis for insights</li>
                  <li>Compare with other judges if needed</li>
                </ol>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Need More Help?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Can't find what you're looking for? We're here to help.
                </p>
                <div className="space-y-2 text-sm">
                  <p>
                    <strong>Email:</strong>{' '}
                    <a href="mailto:support@judgefinder.io" className="text-blue-600 hover:underline">
                      support@judgefinder.io
                    </a>
                  </p>
                  <p>
                    <strong>Response Time:</strong> 24-48 hours
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-2">Understanding the Data</h3>
            <p className="text-gray-600 text-sm">
              All information on JudgeFinder.io comes from public court records. We use AI to analyze patterns
              and provide insights, but these should be considered alongside other factors when evaluating judges.
              Always consult with a qualified attorney for legal matters.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}