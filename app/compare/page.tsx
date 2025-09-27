import Link from 'next/link'
import { Scale, ArrowLeft } from 'lucide-react'
import { motion } from 'framer-motion'
import { ComparisonContent } from '@/components/compare/ComparisonContent'

export const dynamic = 'force-dynamic'

export default function ComparePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Link 
              href="/judges" 
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Judges
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div 
            className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4"
            whileHover={{ scale: 1.05 }}
          >
            <Scale className="h-8 w-8 text-primary" />
          </motion.div>
          <h1 className="text-4xl font-bold mb-4">Judge Comparison Tool</h1>
          <p className="text-xl text-muted-foreground">
            Compare judicial profiles, decision patterns, and analytics side-by-side
          </p>
        </motion.div>

        {/* Comparison Tool */}
        <ComparisonContent />
      </div>
    </div>
  )
}