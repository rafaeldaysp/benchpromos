/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/promocao/:slug/:id',
        destination: '/sale/:slug/:id',
      },
      {
        source: '/usuario',
        destination: '/user',
      },
      {
        source: '/usuario/perfil',
        destination: '/user/profile',
      },
      {
        source: '/usuario/alertas',
        destination: '/user/alerts',
      },
      {
        source: '/politica-de-privacidade',
        destination: '/privacy-policy',
      },
    ]
  },
  output: 'standalone',
}

module.exports = nextConfig
