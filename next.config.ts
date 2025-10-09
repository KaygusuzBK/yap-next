import type { NextConfig } from "next";

const isTurbopack = process.env.TURBOPACK === '1'

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  transpilePackages: ["@supabase/supabase-js", "@supabase/realtime-js"],
  outputFileTracingRoot: __dirname,
};

// Only apply webpack customizations when NOT running Turbopack (e.g. production builds)
if (!isTurbopack) {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore - NextConfig is mutable before export
  nextConfig.webpack = (config) => {
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      {
        module: /@supabase\/realtime-js/,
        message: /Critical dependency: the request of a dependency is an expression/,
      },
    ]
    return config
  }
}

export default nextConfig;
