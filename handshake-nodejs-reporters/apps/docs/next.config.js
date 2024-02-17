const withNextra = require('nextra')({
  theme: 'nextra-theme-docs',
  themeConfig: './theme.config.tsx',
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    tsconfigPath: "./tsconfig.json"
  },
  output: "export",
  env: {
    NEXT_PY_PORT: process.env.NEXT_PY_PORT ?? '6969'
  },
  transpilePackages: ['handshake-dashboard', 'echarts', 'zrender']
}

module.exports = withNextra(nextConfig);
