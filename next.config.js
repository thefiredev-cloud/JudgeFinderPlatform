const { withSentryConfig } = require('@sentry/nextjs')

// Suppress console output in production and Netlify builds to prevent secrets exposure
if (process.env.NODE_ENV === 'production' || process.env.NETLIFY_BUILD === 'true' || process.env.NETLIFY === 'true') {
  console.log = () => {};
  console.info = () => {};
  console.warn = () => {};
  console.debug = () => {};
  // Keep console.error for critical errors only
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Performance optimizations for legal platform
  experimental: {
    optimizePackageImports: ['lucide-react', '@supabase/supabase-js'],
    // Windows-specific optimizations to prevent Jest worker errors
    workerThreads: false,
    cpus: 1,
    // Disable parallel compilation to prevent worker issues
    parallelServerCompiles: false,
    parallelServerBuildTraces: false,
  },
  
  // Disable SWC minification on Windows to prevent worker issues
  swcMinify: false,

  // Image optimization for judge profiles and court images
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'courtlistener.com',
      },
      {
        protocol: 'https',
        hostname: 'www.courtlistener.com',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 86400, // 24 hours cache for profile images
    dangerouslyAllowSVG: false,
  },

  // Enhanced security and performance headers
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NODE_ENV === 'production' 
              ? process.env.NEXT_PUBLIC_SITE_URL || 'https://judgefinder.io'
              : process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3005',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET,HEAD,POST,OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type,Authorization,X-Requested-With',
          },
          {
            key: 'X-RobotsTag',
            value: 'noindex, nofollow',
          },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), midi=()'
          },
          // Content Security Policy
          {
            key: 'Content-Security-Policy',
            value: process.env.NODE_ENV === 'production' 
              ? "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://www.clarity.ms; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' https://*.supabase.co https://www.google-analytics.com https://www.clarity.ms https://api.courtlistener.com; frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests"
              : "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; connect-src 'self' https: http:; frame-src 'none'; object-src 'none'"
          },
          // Production-only HSTS
          ...(process.env.NODE_ENV === 'production' ? [{
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          }] : [])
        ],
      },
      {
        source: '/judges/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=3600, stale-while-revalidate=86400'
          }
        ],
      },
      {
        source: '/courts/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=7200, stale-while-revalidate=86400'
          }
        ],
      },
      {
        source: '/(.*)\\.(css|js|ico|png|jpg|jpeg|gif|svg|woff|woff2)$',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ],
      }
    ]
  },

  // Optimize bundle for legal research platform
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      // Production optimizations
      config.resolve.alias = {
        ...config.resolve.alias,
        '@': require('path').resolve(__dirname),
      }
    }
    
    // Windows memory optimization to prevent worker process crashes
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        ...config.optimization?.splitChunks,
        maxInitialRequests: 20,
        maxAsyncRequests: 20,
      },
    }
    
    return config
  },

  // Enable static optimization for better SEO
  trailingSlash: false,
  generateEtags: true,
  poweredByHeader: false,

  // Optimize for deployment
  // output: undefined, // Let Next.js handle output automatically
}

// Sentry configuration options
const sentryWebpackPluginOptions = {
  // Additional config options for the Sentry Webpack plugin. Keep in mind that
  // the following options are set automatically, and overriding them is not
  // recommended:
  //   release, url, org, project, authToken, configFile, stripPrefix,
  //   urlPrefix, include, ignore

  silent: true, // Suppresses all logs
  
  // Upload source maps to Sentry only in production
  dryRun: process.env.NODE_ENV !== 'production',
}

// Only wrap with Sentry in production or when explicitly enabled
const shouldUseSentry = process.env.NODE_ENV === 'production' || process.env.SENTRY_DEBUG === 'true'

module.exports = shouldUseSentry 
  ? withSentryConfig(nextConfig, sentryWebpackPluginOptions)
  : nextConfig