const withNextra = require('nextra')({
  theme: 'nextra-theme-docs',
  themeConfig: './theme.config.jsx',
  staticImage: true
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['handshake'],
  typescript: {
    tsconfigPath: "./tsconfig.json"
  }
}

module.exports = withNextra(nextConfig)