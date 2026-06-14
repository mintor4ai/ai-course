/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ['nodemailer', 'googleapis'],
  },
}

module.exports = nextConfig
