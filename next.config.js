/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  async rewrites() {
    return [
      {
        source: '/igdb_api/:path*',
        destination: 'https://api.igdb.com/v4/:path*'
      },
      {
        source: '/igdb_image/:path*',
        destination: 'https://images.igdb.com/igdb/image/upload/:path*'
      }
    ]
  }
}

module.exports = nextConfig
