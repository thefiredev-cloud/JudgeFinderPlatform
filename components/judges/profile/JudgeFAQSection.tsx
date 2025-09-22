'use client'

import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react'
import { useState } from 'react'

interface JudgeFAQSectionProps {
  judgeName: string
  courtName: string
  jurisdiction: string
}

interface FAQItem {
  question: string
  answer: string
}

export function JudgeFAQSection({ judgeName, courtName, jurisdiction }: JudgeFAQSectionProps) {
  const [openItems, setOpenItems] = useState<Set<number>>(new Set())
  
  const nameWithoutTitle = judgeName.replace(/^(judge|justice|the honorable)\s+/i, '').trim()
  
  const faqItems: FAQItem[] = [
    {
      question: `Who is Judge ${nameWithoutTitle}?`,
      answer: `Judge ${nameWithoutTitle} is a judicial officer serving at ${courtName} in ${jurisdiction}. Our comprehensive profile includes judicial analytics, ruling patterns, case history, and professional background to assist attorneys and litigants in legal research and case strategy development.`
    },
    {
      question: `What court does Judge ${nameWithoutTitle} serve in?`,
      answer: `Judge ${nameWithoutTitle} serves at ${courtName}, located in ${jurisdiction}. This court handles various types of legal matters and proceedings within its jurisdiction.`
    },
    {
      question: `How can I research Judge ${nameWithoutTitle}'s ruling patterns?`,
      answer: `JudgeFinder provides comprehensive analytics on Judge ${nameWithoutTitle}'s judicial patterns including case types, ruling tendencies, and decision timelines. Our platform analyzes court records and provides insights to help attorneys develop effective case strategies.`
    },
    {
      question: `What types of cases does Judge ${nameWithoutTitle} handle?`,
      answer: `Based on court assignment and jurisdiction, Judge ${nameWithoutTitle} may handle various case types including civil litigation, criminal matters, family law, contract disputes, and other legal proceedings within the court's jurisdiction.`
    },
    {
      question: `How often is Judge ${nameWithoutTitle}'s information updated?`,
      answer: `Judge ${nameWithoutTitle}'s profile is updated regularly with the latest case information, judicial decisions, and court assignments. We maintain current data to ensure accuracy for legal professionals and researchers.`
    },
    {
      question: `Can I find Judge ${nameWithoutTitle}'s contact information?`,
      answer: `Official contact information for Judge ${nameWithoutTitle} can be found through ${courtName}. For court-related matters, contact the court clerk's office for proper procedures and scheduling.`
    },
    {
      question: `How can attorneys use Judge ${nameWithoutTitle}'s profile for case preparation?`,
      answer: `Attorneys can review Judge ${nameWithoutTitle}'s analytics to understand judicial preferences, typical case timelines, ruling patterns, and procedural tendencies. This information helps in developing case strategy, timing filings, and preparing for court appearances.`
    },
    {
      question: `Is the information about Judge ${nameWithoutTitle} publicly available?`,
      answer: `Yes, judicial information is derived from public court records and official sources. Our platform aggregates and analyzes publicly available data to provide comprehensive judicial profiles while maintaining transparency and accuracy.`
    }
  ]
  
  const toggleItem = (index: number) => {
    const newOpenItems = new Set(openItems)
    if (newOpenItems.has(index)) {
      newOpenItems.delete(index)
    } else {
      newOpenItems.add(index)
    }
    setOpenItems(newOpenItems)
  }
  
  return (
    <div className="rounded-lg border border-border bg-card shadow-sm p-6">
      <h3 className="text-2xl font-bold text-foreground mb-6">
        Frequently Asked Questions about Judge {nameWithoutTitle}
      </h3>
      
      <div className="space-y-4">
        {faqItems.map((item, index) => (
          <div key={index} className="border border-border/60 rounded-lg">
            <button
              className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-accent/15 transition-colors"
              onClick={() => toggleItem(index)}
            >
              <h4 className="font-semibold text-foreground pr-4">
                {item.question}
              </h4>
              {openItems.has(index) ? (
                <ChevronUpIcon className="h-5 w-5 text-muted-foreground/70 flex-shrink-0" />
              ) : (
                <ChevronDownIcon className="h-5 w-5 text-muted-foreground/70 flex-shrink-0" />
              )}
            </button>
            
            {openItems.has(index) && (
              <div className="px-6 pb-4">
                <p className="text-muted-foreground leading-relaxed">
                  {item.answer}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="mt-8 p-4 rounded-lg border border-primary/30 bg-primary/10">
        <p className="text-sm text-primary">
          <strong>Need more information?</strong> Our judicial research platform provides 
          comprehensive analytics and insights for legal professionals. Contact our research 
          team for specialized judicial intelligence and case strategy consulting.
        </p>
      </div>
    </div>
  )
}
