import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Let Next.js/Turbopack handle TS path aliases based on tsconfig.json
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  outputFileTracingRoot: __dirname,
  serverExternalPackages: ['@supabase/realtime-js']
};

export default nextConfig;
