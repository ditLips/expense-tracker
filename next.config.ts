import type { NextConfig } from 'next';
import withPWAInit from 'next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Force Webpack because next-pwa doesn’t work under Turbopack
  webpack: (config) => {
    return config;
  },
};

export default withPWA(nextConfig);