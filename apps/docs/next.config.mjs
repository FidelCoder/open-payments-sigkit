/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true
  },
  transpilePackages: ['@open-payments-devkit/core', '@open-payments-devkit/fixtures']
}

export default nextConfig
