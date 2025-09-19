import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  serverExternalPackages: ['@supabase/realtime-js'],
  outputFileTracingRoot: __dirname,
};

export default nextConfig;
