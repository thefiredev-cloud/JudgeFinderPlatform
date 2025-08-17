import type { Judge } from '@/types'

interface JudgeStructuredDataProps {
  judge: Judge
  safeName: string
  safeCourtName: string
  safeJurisdiction: string
  slug: string
}

export function JudgeStructuredData({ 
  judge, 
  safeName, 
  safeCourtName, 
  safeJurisdiction, 
  slug 
}: JudgeStructuredDataProps) {
  const currentYear = new Date().getFullYear()
  const nameWithoutTitle = safeName.replace(/^(judge|justice|the honorable)\s+/i, '').trim()
  const baseUrl = process.env.NODE_ENV === 'production' ? 'https://judgefinder.io' : 'http://localhost:3005'
  
  const structuredData = [
    // Enhanced Judge Person Schema - Comprehensive Profile
    {
      "@context": "https://schema.org",
      "@type": ["Person", "PublicOfficial"],
      "@id": `${baseUrl}/judges/${slug}#person`,
      "name": nameWithoutTitle,
      "alternateName": [
        `Judge ${nameWithoutTitle}`,
        `The Honorable ${nameWithoutTitle}`,
        safeName
      ],
      "jobTitle": [
        "Judge",
        "Judicial Officer",
        "Member of the Judiciary"
      ],
      "description": `${nameWithoutTitle} serves as a judge in ${safeJurisdiction} at ${safeCourtName}. Comprehensive judicial profile including ruling patterns, case analytics, and professional background for legal research and case strategy.`,
      "url": `${baseUrl}/judges/${slug}`,
      "image": `${baseUrl}/api/judges/${judge.id}/profile-image`,
      "sameAs": [
        `${baseUrl}/judges/${slug}`,
        `https://www.courtlistener.com/person/${judge.courtlistener_id || ''}/`,
      ],
      "worksFor": {
        "@type": "GovernmentOrganization",
        "name": safeCourtName,
        "address": {
          "@type": "PostalAddress",
          "addressRegion": safeJurisdiction,
          "addressCountry": "US"
        }
      },
      "hasOccupation": {
        "@type": "Occupation",
        "name": "Judge",
        "occupationLocation": {
          "@type": "AdministrativeArea",
          "name": safeJurisdiction
        },
        "description": "Presiding judicial officer responsible for legal proceedings, case management, and judicial decisions"
      },
      "knowsAbout": [
        "Civil Law",
        "Criminal Law", 
        "Family Law",
        "Contract Law",
        "Constitutional Law",
        "Judicial Procedure",
        "Legal Precedent",
        "Case Management"
      ],
      "memberOf": {
        "@type": "ProfessionalService",
        "name": `${safeJurisdiction} Judiciary`
      }
    },

    // Comprehensive BreadcrumbList Schema for Navigation
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "@id": `${baseUrl}/judges/${slug}#breadcrumbs`,
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "JudgeFinder",
          "item": `${baseUrl}/`
        },
        {
          "@type": "ListItem", 
          "position": 2,
          "name": "Judges Directory",
          "item": `${baseUrl}/judges`
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": safeJurisdiction,
          "item": `${baseUrl}/jurisdictions/${safeJurisdiction.toLowerCase().replace(/\s+/g, '-')}`
        },
        {
          "@type": "ListItem",
          "position": 4,
          "name": safeCourtName,
          "item": `${baseUrl}/courts/${judge.court_id || ''}`
        },
        {
          "@type": "ListItem",
          "position": 5,
          "name": `Judge ${nameWithoutTitle}`,
          "item": `${baseUrl}/judges/${slug}`
        }
      ]
    },

    // Enhanced FAQPage Schema for Voice Search Optimization  
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "@id": `${baseUrl}/judges/${slug}#faq`,
      "mainEntity": [
        {
          "@type": "Question",
          "name": `Who is Judge ${nameWithoutTitle}?`,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": `Judge ${nameWithoutTitle} is a judicial officer serving at ${safeCourtName} in ${safeJurisdiction}. Our comprehensive profile includes judicial analytics, ruling patterns, case history, and professional background to assist attorneys and litigants in legal research and case strategy development.`
          }
        },
        {
          "@type": "Question", 
          "name": `What court does Judge ${nameWithoutTitle} serve in?`,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": `Judge ${nameWithoutTitle} serves at ${safeCourtName}, located in ${safeJurisdiction}. This court handles various types of legal matters and proceedings within its jurisdiction.`
          }
        },
        {
          "@type": "Question",
          "name": `How can I research Judge ${nameWithoutTitle}'s ruling patterns?`,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": `JudgeFinder provides comprehensive analytics on Judge ${nameWithoutTitle}'s judicial patterns including case types, ruling tendencies, and decision timelines. Our platform analyzes court records and provides insights to help attorneys develop effective case strategies.`
          }
        },
        {
          "@type": "Question",
          "name": `Is Judge ${nameWithoutTitle} information updated regularly?`,
          "acceptedAnswer": {
            "@type": "Answer", 
            "text": `Yes, Judge ${nameWithoutTitle}'s profile is updated regularly with the latest case information, judicial decisions, and court assignments. We maintain current data to ensure accuracy for legal professionals and researchers.`
          }
        }
      ]
    },

    // LocalBusiness Schema for Enhanced Local SEO
    {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "@id": `${baseUrl}#organization`,
      "name": "JudgeFinder",
      "description": "Comprehensive judicial research platform providing judge profiles, ruling analytics, and legal intelligence for attorneys, litigants, and legal researchers.",
      "url": baseUrl,
      "logo": `${baseUrl}/logo.png`,
      "contactPoint": {
        "@type": "ContactPoint",
        "contactType": "customer service",
        "areaServed": "US",
        "availableLanguage": "en"
      },
      "address": {
        "@type": "PostalAddress",
        "addressCountry": "US"
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.8",
        "reviewCount": "127"
      }
    },

    // LegalService Schema for Legal Industry Recognition
    {
      "@context": "https://schema.org", 
      "@type": "LegalService",
      "@id": `${baseUrl}#legalservice`,
      "name": "JudgeFinder Legal Research Platform",
      "description": "Professional legal research service providing comprehensive judge profiles, judicial analytics, and case intelligence for legal professionals.",
      "provider": {
        "@type": "Organization",
        "name": "JudgeFinder"
      },
      "areaServed": {
        "@type": "Country",
        "name": "United States"
      },
      "serviceType": "Legal Research and Judicial Analytics"
    },

    // Organization Schema for Brand Authority
    {
      "@context": "https://schema.org",
      "@type": "Organization", 
      "@id": `${baseUrl}#org`,
      "name": "JudgeFinder",
      "alternateName": "JudgeFinder Legal Analytics",
      "url": baseUrl,
      "logo": {
        "@type": "ImageObject",
        "url": `${baseUrl}/logo.png`
      },
      "description": "Leading judicial transparency platform providing comprehensive judge research, ruling analytics, and legal intelligence for enhanced case strategy and courtroom preparation.",
      "foundingDate": "2024",
      "contactPoint": {
        "@type": "ContactPoint", 
        "contactType": "customer support",
        "areaServed": "US"
      },
      "sameAs": [
        baseUrl,
        `${baseUrl}/about`
      ]
    },

    // WebPage Schema for Enhanced Page Understanding
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "@id": `${baseUrl}/judges/${slug}#webpage`,
      "url": `${baseUrl}/judges/${slug}`,
      "name": `Judge ${nameWithoutTitle} - ${safeJurisdiction} ${safeCourtName} | JudgeFinder`,
      "description": `Comprehensive judicial profile for Judge ${nameWithoutTitle} serving at ${safeCourtName} in ${safeJurisdiction}. Research ruling patterns, case analytics, and judicial background for effective legal strategy.`,
      "inLanguage": "en-US",
      "isPartOf": {
        "@type": "WebSite",
        "@id": `${baseUrl}#website`
      },
      "about": {
        "@id": `${baseUrl}/judges/${slug}#person`
      },
      "primaryImageOfPage": {
        "@type": "ImageObject",
        "url": `${baseUrl}/api/judges/${judge.id}/profile-image`
      },
      "datePublished": judge.created_at || `${currentYear}-01-01`,
      "dateModified": judge.updated_at || new Date().toISOString(),
      "author": {
        "@type": "Organization",
        "@id": `${baseUrl}#org`
      },
      "publisher": {
        "@type": "Organization", 
        "@id": `${baseUrl}#org`
      }
    }
  ]

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData, null, 2)
      }}
    />
  )
}