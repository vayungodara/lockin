/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'muhklpbzdecfscrrwhdr.supabase.co'
      },
      {
        protocol: 'https',
        hostname: '**.googleusercontent.com'
      }
    ]
  },
  async redirects() {
    return [
      {
        source: '/login',
        destination: '/',
        permanent: false,
      },
      {
        source: '/pacts',
        destination: '/dashboard/pacts',
        permanent: false,
      },
      {
        source: '/groups',
        destination: '/dashboard/groups',
        permanent: false,
      },
      {
        source: '/focus',
        destination: '/dashboard/focus',
        permanent: false,
      },
      {
        source: '/stats',
        destination: '/dashboard/stats',
        permanent: false,
      },
      {
        source: '/settings',
        destination: '/dashboard/settings',
        permanent: false,
      },
    ];
  },
  async headers() {
    const isDev = process.env.NODE_ENV === 'development';
    const scriptSrc = isDev
      ? "'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com https://*.vercel-scripts.com https://vercel.live https://accounts.google.com"
      : "'self' 'unsafe-inline' https://va.vercel-scripts.com https://*.vercel-scripts.com https://vercel.live https://accounts.google.com";

    const csp = [
      "default-src 'self'",
      `script-src ${scriptSrc}`,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https://*.supabase.co https://*.googleusercontent.com",
      "font-src 'self' data: https://fonts.gstatic.com",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://va.vercel-scripts.com https://vitals.vercel-insights.com https://vercel.live wss://*.vercel.live",
      "frame-src 'self' https://vercel.live https://accounts.google.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self' https://accounts.google.com",
    ].join('; ');

    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Content-Security-Policy', value: csp },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
        ],
      },
    ];
  },
};

export default nextConfig;
