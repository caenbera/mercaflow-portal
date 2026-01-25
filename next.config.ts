import type {NextConfig} from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import withPWAInit from '@ducanh2912/next-pwa';

const withNextIntl = createNextIntlPlugin('./src/i18n.ts');

const withPWA = withPWAInit({
  dest: 'public',
  register: true,
  skipWaiting: true,
  swSrc: 'src/app/sw.ts', // Use our custom service worker
  disable: process.env.NODE_ENV === 'development',
  manifest: {
    name: 'Fresh Hub Portal',
    short_name: 'Fresh Hub',
    description: "Wholesale fresh produce for Chicago's latin businesses.",
    background_color: '#ffffff',
    theme_color: '#27ae60',
    icons: [
      {
        src: 'https://i.postimg.cc/sxBVGnMp/icon.png?v=2',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: 'https://i.postimg.cc/sxBVGnMp/icon.png?v=2',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  },
});


const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.postimg.cc',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'ui-avatars.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/**',
      }
    ],
  },
};

export default withPWA(withNextIntl(nextConfig));
