const { PHASE_DEVELOPMENT_SERVER } = require('next/constants');

module.exports = (phase, { defaultConfig }) => {
    const is_dev = phase === PHASE_DEVELOPMENT_SERVER;

    let withBundleAnalyzer;

    if (process.env.ANALYZE === 'true')
        withBundleAnalyzer = require('@next/bundle-analyzer')({
            enabled: true,
        });

    /** @type {import('next').NextConfig} */
    const nextConfig = {
        reactStrictMode: true,
        output: is_dev ? 'standalone' : 'export',

        // Optional: Change links `/me` -> `/me/` and emit `/me.html` -> `/me/index.html`
        trailingSlash: true,
        transpilePackages: ['@uiw/react-markdown-preview'],
        env: {
            IS_DEV: is_dev ? 'yes' : '',
        },
        images: {
            unoptimized: true,
        },
        distDir: is_dev ? 'dist' : '../dashboard',
    };

    return withBundleAnalyzer ? withBundleAnalyzer(nextConfig) : nextConfig;
};
