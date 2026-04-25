/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ensure Prisma works correctly on Vercel
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'bcryptjs'],
  },
};

module.exports = nextConfig;
