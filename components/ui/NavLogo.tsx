'use client'

import React from 'react'
import Link from 'next/link'

interface NavLogoProps {
  className?: string
  variant?: 'default' | 'dark' | 'monochrome'
  showText?: boolean
}

const NavLogo: React.FC<NavLogoProps> = ({ 
  className = "", 
  variant = 'default',
  showText = true 
}) => {
  return (
    <Link href="/" className={className}>
      <div className="flex items-center gap-2.5 group">
        {/* Logo Icon */}
        <div className="w-10 h-10 flex items-center justify-center">
          <svg 
            viewBox="0 0 52 52" 
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full transition-transform duration-200 group-hover:scale-105"
          >
            {/* Gradient definitions */}
            <defs>
              <linearGradient id="enterpriseGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#2563eb', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#1e40af', stopOpacity: 1 }} />
              </linearGradient>
              <linearGradient id="enterpriseAccent" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style={{ stopColor: '#3b82f6', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#2563eb', stopOpacity: 1 }} />
              </linearGradient>
              <linearGradient id="lightGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#60a5fa', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#3b82f6', stopOpacity: 1 }} />
              </linearGradient>
            </defs>
            
            {/* Logo shape based on variant */}
            <g>
              {/* Main J structure */}
              <path 
                d="M 22 6 L 38 6 Q 42 6 42 10 L 42 14 Q 42 18 38 18 L 30 18 L 30 32 Q 30 40 22 40 L 14 40 Q 6 40 6 32 L 6 26 L 14 26 L 14 32 L 22 32 L 22 10 Q 22 6 22 6 Z" 
                fill={
                  variant === 'dark' 
                    ? 'url(#lightGradient)' 
                    : variant === 'monochrome'
                    ? '#0f172a'
                    : 'url(#enterpriseGradient)'
                }
                className="transition-all duration-200"
              />
              
              {/* Top accent bar */}
              <rect 
                x="34" 
                y="10" 
                width="6" 
                height="6" 
                rx="1" 
                fill={
                  variant === 'dark'
                    ? '#93c5fd'
                    : variant === 'monochrome'
                    ? '#475569'
                    : 'url(#enterpriseAccent)'
                }
                className="transition-all duration-200"
              />
              
              {/* Bottom accent - scales of justice reference */}
              <g opacity={variant === 'dark' ? 0.9 : 0.8}>
                <rect 
                  x="36" 
                  y="38" 
                  width="8" 
                  height="2" 
                  rx="1" 
                  fill={
                    variant === 'dark'
                      ? '#60a5fa'
                      : variant === 'monochrome'
                      ? '#0f172a'
                      : '#2563eb'
                  }
                />
                <rect 
                  x="38" 
                  y="34" 
                  width="2" 
                  height="6" 
                  rx="1" 
                  fill={
                    variant === 'dark'
                      ? '#60a5fa'
                      : variant === 'monochrome'
                      ? '#0f172a'
                      : '#2563eb'
                  }
                />
                <rect 
                  x="40" 
                  y="34" 
                  width="2" 
                  height="6" 
                  rx="1" 
                  fill={
                    variant === 'dark'
                      ? '#60a5fa'
                      : variant === 'monochrome'
                      ? '#0f172a'
                      : '#2563eb'
                  }
                />
              </g>
            </g>
          </svg>
        </div>
        
        {/* Logo Text */}
        {showText && (
          <div className="flex items-baseline">
            <span className={`text-xl font-semibold transition-colors duration-200 ${
              variant === 'dark' 
                ? 'text-white' 
                : variant === 'monochrome'
                ? 'text-enterprise-slate-black'
                : 'text-enterprise-slate-black dark:text-white'
            }`}>
              JudgeFinder
            </span>
            <span className={`text-xl font-normal transition-colors duration-200 ${
              variant === 'dark'
                ? 'text-enterprise-light'
                : variant === 'monochrome'
                ? 'text-gray-500'
                : 'text-enterprise-accent dark:text-enterprise-light'
            }`}>
              .io
            </span>
          </div>
        )}
      </div>
    </Link>
  )
}

export default NavLogo