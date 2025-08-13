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
          // Basic CSP; consider tightening with hashes/nonces for inline content
          { key: 'Content-Security-Policy', value: "default-src 'self'; base-uri 'self'; object-src 'none'; img-src 'self' data: https:; media-src 'self' https:; font-src 'self' https: data:; script-src 'self' https: 'strict-dynamic'; style-src 'self' 'unsafe-inline' https:; connect-src 'self' https: wss:; frame-ancestors 'self'; form-action 'self'; upgrade-insecure-requests;" },
        ],
      },
    ]
  },
};

export default nextConfig;
