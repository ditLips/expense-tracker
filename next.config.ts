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
  // disable turbopack entirely and keep Webpack
  webpack: (config) => config,
  turbopack: {}, // empty config silences warnings if Turbopack gets auto-detected
};

export default withPWA(nextConfig);
