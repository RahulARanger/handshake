/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "export",
  env: {
    NEXT_PY_PORT: process.env.NEXT_PY_PORT
  },
  distDir: "dist"
}

module.exports = nextConfig
