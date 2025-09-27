'use client'

import { useState, useEffect } from 'react'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import {
  Scale, Shield, Clock, Search, Users, TrendingUp,
  FileText, Award, CheckCircle, AlertCircle, BarChart3,
  Gavel, BookOpen, Heart, Target, Eye, Sparkles
} from 'lucide-react'
import HeroSection from '@/components/about/HeroSection'
import OfferGrid from '@/components/about/OfferGrid'
import UserTypes from '@/components/about/UserTypes'
import FeaturesShowcase from '@/components/about/FeaturesShowcase'
import WhyItMatters from '@/components/about/WhyItMatters'
import TrustIndicators from '@/components/about/TrustIndicators'
import CTASection from '@/components/about/CTASection'

export const dynamic = 'force-dynamic'

interface PlatformStats {
  monthlySearches: string
  yearsOfData: number | null
  availability: string
  dataBreaches: number | null
}

export default function AboutPage(): JSX.Element {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      <HeroSection />
      <OfferGrid />
      <UserTypes />
      <FeaturesShowcase />
      <WhyItMatters />
      <TrustIndicators />
      <CTASection />
    </div>
  )
}
