/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Performance optimizations for legal platform
  experimental: {
    optimizePackageImports: ['lucide-react', '@supabase/supabase-js'],
    // Windows-specific optimizations to prevent Jest worker errors
    workerThreads: false,
    cpus: 2,
  },

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

  // Compression and performance headers
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NEXT_PUBLIC_APP_URL || '*',
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
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          }
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

  // Optimize for static export if needed
  output: process.env.BUILD_STANDALONE === 'true' ? 'standalone' : undefined,
}

module.exports = nextConfig