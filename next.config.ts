import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Evidence uploads (drawing packages, photo sets) arrive through server
  // actions; the default 1 MB body limit is far too small.
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
};

export default nextConfig;
