/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  // Optional: Change links `/me` -> `/me/` and emit `/me.html` -> `/me/index.html`
  trailingSlash: true,
  transpilePackages: ['graspit', 'echarts'],
  env: {
    NEXT_PY_PORT: process.env.NEXT_PY_PORT ?? '6969'
  },
  images: {
    unoptimized: true
  },
  distDir: process.env.EXPORT_DIR ?? "dist"
}

module.exports = nextConfig
