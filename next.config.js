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
      // Security headers are handled by middleware.ts to avoid conflicts
      // This prevents header duplication and ensures consistent security policy
      // Only cache-control headers are set here for specific routes
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
  // Let Netlify plugin handle output configuration
  // output: undefined, // Automatically handled by @netlify/plugin-nextjs
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