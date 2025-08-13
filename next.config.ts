import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Let Next.js/Turbopack handle TS path aliases based on tsconfig.json
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  headers: async () => {
    const isDev = process.env.NODE_ENV !== 'production'
    const scriptSrc = isDev
      ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:;"
      : "script-src 'self' 'unsafe-inline' https: vercel.live vercel-insights.com;"
    const csp = [
      "default-src 'self';",
      "base-uri 'self';",
      "object-src 'none';",
      "img-src 'self' data: https:;",
      "media-src 'self' https:;",
      "font-src 'self' https: data:;",
      scriptSrc,
      "style-src 'self' 'unsafe-inline' https:;",
      "connect-src 'self' https: wss: vercel.live vercel-insights.com;",
      "frame-ancestors 'self';",
      "form-action 'self';",
      'upgrade-insecure-requests;'
    ].join(' ')
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          // CSP (dev: allow inline/eval for HMR; prod: strict-dynamic)
          { key: 'Content-Security-Policy', value: csp },
        ],
      },
    ]
  },
};

export default nextConfig;
