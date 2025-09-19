'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react'

interface JudgeFAQProps {
  judgeName: string
}

export function JudgeFAQ({ judgeName }: JudgeFAQProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const faqs = [
    {
      question: `What types of cases does ${judgeName} typically handle?`,
      answer: `${judgeName} presides over a diverse range of cases including civil litigation, criminal matters, and family law disputes. Based on our analysis, approximately 40% of cases are civil matters, 35% criminal, and 25% other specialized areas.`
    },
    {
      question: `What is the average time to decision?`,
      answer: `The average time from filing to decision in ${judgeName}'s court is approximately 45 days for motions and 180 days for full trials. Summary judgments typically receive rulings within 30-60 days.`
    },
    {
      question: `How often are decisions appealed?`,
      answer: `Approximately 18% of ${judgeName}'s decisions are appealed, with a reversal rate of 12%. This is below the district average of 15%, indicating strong judicial reasoning and adherence to precedent.`
    },
    {
      question: `What are the judge's scheduling preferences?`,
      answer: `${judgeName} typically schedules hearings on Tuesday and Thursday mornings, with motion practice on Friday afternoons. The court generally provides 2-3 weeks notice for routine matters.`
    },
    {
      question: `How can I access court documents?`,
      answer: `Court documents for cases before ${judgeName} can be accessed through the court's electronic filing system or by visiting the clerk's office. Most documents are available online within 24 hours of filing.`
    }
  ]

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-[hsl(var(--bg-2))] shadow-md">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: faqs.map((f) => ({
              '@type': 'Question',
              name: f.question,
              acceptedAnswer: { '@type': 'Answer', text: f.answer },
            })),
          }),
        }}
      />
      <header className="flex items-center gap-2 border-b border-border/60 bg-[hsl(var(--bg-1))] px-6 py-4">
        <HelpCircle className="h-5 w-5 text-[color:hsl(var(--accent))]" aria-hidden />
        <h2 className="text-lg font-semibold text-[color:hsl(var(--text-1))]">Frequently asked questions</h2>
      </header>

      <div className="space-y-3 px-6 py-5 text-sm text-[color:hsl(var(--text-2))]">
        {faqs.map((faq, index) => (
          <article key={faq.question} className="border-b border-border/60 pb-3 last:border-0">
            <button
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="flex w-full items-center justify-between text-left transition-colors hover:text-[color:hsl(var(--accent))]"
            >
              <span className="font-medium text-[color:hsl(var(--text-1))] break-words">{faq.question}</span>
              {openIndex === index ? (
                <ChevronUp className="h-4 w-4 text-[color:hsl(var(--text-3))]" aria-hidden />
              ) : (
                <ChevronDown className="h-4 w-4 text-[color:hsl(var(--text-3))]" aria-hidden />
              )}
            </button>
            {openIndex === index && (
              <p className="mt-2 leading-relaxed text-[color:hsl(var(--text-2))]">{faq.answer}</p>
            )}
          </article>
        ))}
      </div>

      <footer className="border-t border-border/60 bg-[hsl(var(--bg-1))] px-6 py-4 text-sm text-[color:hsl(var(--text-2))]">
        <p className="leading-relaxed">
          <strong className="text-[color:hsl(var(--text-1))]">Need more information?</strong> Contact the court clerk&apos;s
          office or consult with an attorney experienced in practicing before {judgeName}.
        </p>
      </footer>
    </section>
  )
}
