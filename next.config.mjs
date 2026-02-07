/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  webpack: (config) => {
    config.externals = [...config.externals, 'pwa-asset-generator'];
    return config;
  }
};

export default nextConfig;
