const withNextra = require('nextra')({
  theme: 'nextra-theme-docs',
  themeConfig: './theme.config.jsx'
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['graspit'],
  typescript: {
    tsconfigPath: "./tsconfig.json"
  }
}
 
module.exports = withNextra(nextConfig)