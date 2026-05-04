import type { NextConfig } from 'next';
import path from 'path';

const isProd = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  output: 'export',
  basePath: isProd ? '/selleramp-killer' : '',
  images: {
    unoptimized: true,
  },
  webpack: (config) => {
    config.resolve = config.resolve ?? {};
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      '@shared': path.resolve(__dirname, '../src/shared'),
    };
    return config;
  },
};

export default nextConfig;