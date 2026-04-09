import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Try 'turbo' (no pack) for the TypeScript type definition
  experimental: {
    turbo: {
      // This tells Next.js to respect your fallbacks in the Turbopack environment
      resolveAlias: {
        fs: false,
        path: false,
        crypto: false,
      },
    },
  },
  
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = { 
        ...config.resolve.fallback,
        fs: false, 
        path: false, 
        crypto: false 
      };
    }
    return config;
  },

  async headers() {
    return [
      {
        source: "/:path*.wasm",
        headers: [
          { key: "Content-Type", value: "application/wasm" },
        ],
      },
    ];
  },
};

export default nextConfig;