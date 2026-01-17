import createMiddleware from 'next-intl/middleware';
import { locales, localePrefix, defaultLocale } from './i18n-config';

export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix,
});

export const config = {
  // Matcher ignoring `/_next/` and `/api/`
  matcher: [
    // Enable a redirect to a matching locale at the root
    '/',
    // Set a cookie to remember the previous locale for
    // all requests that have a locale prefix
    '/(es|en)/:path*',
    // Enable redirects that add a locale prefix
    '/((?!_next|.*\\..*).*)',
  ],
};
