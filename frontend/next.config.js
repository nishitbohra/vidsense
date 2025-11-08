/** @type {import('next').NextConfig} */
const nextConfig = {
  // For development, use rewrites to proxy API requests
  async rewrites() {
    // Only apply rewrites in development
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          source: '/api/:path*',
          destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/:path*`,
        },
      ]
    }
    return []
  },
  // Increase timeout for long-running API requests
  experimental: {
    proxyTimeout: 300000, // 5 minutes
  },
  // For Render static site deployment - use export mode
  output: 'export',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
}

module.exports = nextConfig