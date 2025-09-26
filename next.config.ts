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
  webpack: (config) => {
    // Silence known realtime-js dynamic require warning during prod build
    // without affecting runtime behavior.
    // This warning originates from optional server-side ws fallback.
    // We don't rely on Node ws in Vercel runtime.
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      {
        module: /@supabase\/realtime-js/,
        message: /Critical dependency: the request of a dependency is an expression/,
      },
    ]
    return config
  },
};

export default nextConfig;
