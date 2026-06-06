import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  logging: {
    incomingRequests: false,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "20mb",
    },
  },
};

export default nextConfig;
