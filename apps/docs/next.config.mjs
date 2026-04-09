import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true
  },
  outputFileTracingRoot: path.join(__dirname, '../..'),
  transpilePackages: ['@open-payments-devkit/core', '@open-payments-devkit/fixtures']
}

export default nextConfig
