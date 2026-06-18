import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  distDir: 'dist',
  assetPrefix: '/vanderbot-mobile',
  basePath: '/vanderbot-mobile',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
