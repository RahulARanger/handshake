const { PHASE_DEVELOPMENT_SERVER } = require("next/constants");
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = (phase, { defaultConfig }) => {
  const is_dev = phase === PHASE_DEVELOPMENT_SERVER;

  /** @type {import('next').NextConfig} */
  const nextConfig = {
    reactStrictMode: true,
    output: is_dev ? 'standalone' : 'export',

    // Optional: Change links `/me` -> `/me/` and emit `/me.html` -> `/me/index.html`
    trailingSlash: true,
    transpilePackages: ['handshake-dashboard', 'echarts', 'zrender'],
    env: {
      NEXT_PY_PORT: process.env.NEXT_PY_PORT ?? '6969'
    },
    images: {
      unoptimized: true
    },
    distDir: process.env.EXPORT_DIR ?? "dist",
    typescript: { ignoreBuildErrors: !is_dev }
  }
  return withBundleAnalyzer(nextConfig)
}