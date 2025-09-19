import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  serverExternalPackages: ['@supabase/realtime-js'],
  experimental: {
    serverComponentsExternalPackages: ['@supabase/realtime-js']
  }
};

export default nextConfig;
