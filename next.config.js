/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['nodemailer', 'googleapis'],
  },
}

module.exports = nextConfig
