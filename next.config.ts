import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // docusign-esign uses AMD-style define() calls that webpack cannot resolve.
  // Marking it as a server external causes Next.js to require() it natively
  // instead of bundling it, which is correct since it's only used in API routes.
  serverExternalPackages: ['docusign-esign'],
};

export default nextConfig;
