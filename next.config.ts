import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  transpilePackages: ["@supabase/supabase-js", "@supabase/realtime-js"],
  outputFileTracingRoot: __dirname,
};

export default nextConfig;
