import Link from 'next/link'
import { Users, Phone, Mail, MapPin } from 'lucide-react'

interface AttorneyDirectoryBannerProps {
  jurisdiction: string
}

export function AttorneyDirectoryBanner({ jurisdiction }: AttorneyDirectoryBannerProps) {
  return (
    <div className="bg-gradient-to-r from-enterprise-primary to-enterprise-deep text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-white/20 rounded-lg">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">
                Find Experienced Attorneys in {jurisdiction}
              </h3>
              <p className="text-blue-100">
                Connect with qualified legal professionals who know this court
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="hidden sm:flex items-center space-x-6 text-sm">
              <div className="flex items-center space-x-1">
                <Phone className="h-4 w-4" />
                <span>Free Consultation</span>
              </div>
              <div className="flex items-center space-x-1">
                <Mail className="h-4 w-4" />
                <span>Verified Reviews</span>
              </div>
              <div className="flex items-center space-x-1">
                <MapPin className="h-4 w-4" />
                <span>Local Experts</span>
              </div>
            </div>
            
            <Link 
              href="/attorneys"
              className="px-6 py-2 rounded-lg font-medium bg-white/15 text-white border border-white/30 transition-colors hover:bg-white/25"
            >
              Browse Attorneys
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
