'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const faqData = [
  {
    question: "What is JudgeFinder.io?",
    answer: "JudgeFinder.io is California's most comprehensive judicial analytics platform, providing free access to profiles of 1,810+ judges with AI-powered bias detection, ruling patterns, and case outcome analysis. We help attorneys, litigants, and citizens research judges before court appearances."
  },
  {
    question: "How do I find information about my judge?",
    answer: "Simply enter your judge's name in the search bar on our homepage. You can also browse by jurisdiction, court, or use our advanced search filters. Each judge profile includes comprehensive analytics, recent decisions, and ruling patterns."
  },
  {
    question: "Is JudgeFinder.io really free?",
    answer: "Yes, JudgeFinder.io is 100% free for all users. We believe in judicial transparency and making legal information accessible to everyone. No sign-up or payment is required to access our complete database of California judges."
  },
  {
    question: "What information is available for each judge?",
    answer: "Each judge profile includes: professional background, court assignments, appointment history, AI-powered bias analysis, ruling patterns, recent case decisions, reversal rates, case type specializations, and comparative analytics with other judges in the same jurisdiction."
  },
  {
    question: "How accurate is the AI bias detection?",
    answer: "Our AI bias detection system analyzes patterns across thousands of cases with 85-95% accuracy. We use advanced machine learning models to identify consistency patterns, decision speed, settlement preferences, and risk tolerance. All analytics are based on publicly available court records."
  },
  {
    question: "Can I compare multiple judges?",
    answer: "Yes! Our comparison tool allows you to analyze up to 3 judges side-by-side. Compare their ruling patterns, case outcomes, reversal rates, and bias indicators to make informed decisions about your legal strategy."
  },
  {
    question: "How often is the data updated?",
    answer: "Our database is updated weekly with new court decisions and judicial assignments. We continuously sync with official court records to ensure you have access to the most current information about California judges."
  },
  {
    question: "Is my search history private?",
    answer: "Absolutely. JudgeFinder.io prioritizes user privacy. We don't require sign-ups, don't track individual searches, and don't store personal information. All searches are anonymous and secure."
  },
  {
    question: "Which California courts are covered?",
    answer: "We cover all California courts including Superior Courts, Courts of Appeal, and the Supreme Court. Our database includes judges from all 58 California counties with comprehensive coverage of 909+ court locations."
  },
  {
    question: "Can attorneys use this for case preparation?",
    answer: "Yes, JudgeFinder.io is an essential tool for legal professionals. Attorneys use our platform to research judicial tendencies, prepare case strategies, understand ruling patterns, and identify potential biases that might affect their cases."
  }
]

export function HomepageFAQ() {
  const [openItems, setOpenItems] = useState<number[]>([0, 1]) // First two open by default

  const toggleItem = (index: number) => {
    setOpenItems(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    )
  }

  // Generate FAQ structured data for SEO
  const faqStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqData.map(item => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer
      }
    }))
  }

  return (
    <section className="py-16 px-4 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-black">
      <div className="max-w-4xl mx-auto">
        {/* FAQ Schema Markup */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(faqStructuredData)
          }}
        />
        
        {/* Section Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mb-4">
              <HelpCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Frequently Asked Questions</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Everything You Need to Know About JudgeFinder
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Get answers to common questions about using our judicial analytics platform
            </p>
          </motion.div>
        </div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {faqData.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
            >
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <button
                  onClick={() => toggleItem(index)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors"
                  aria-expanded={openItems.includes(index)}
                  aria-controls={`faq-answer-${index}`}
                >
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white pr-4">
                    {item.question}
                  </h3>
                  <motion.div
                    animate={{ rotate: openItems.includes(index) ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex-shrink-0"
                  >
                    <ChevronDown className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  </motion.div>
                </button>
                
                <AnimatePresence>
                  {openItems.includes(index) && (
                    <motion.div
                      id={`faq-answer-${index}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-4 text-gray-600 dark:text-gray-300 leading-relaxed">
                        {item.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-12 text-center"
        >
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Still have questions? We're here to help!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/contact"
              className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Contact Support
            </a>
            <a
              href="/judges"
              className="inline-flex items-center justify-center px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              Start Searching Judges
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  )
}