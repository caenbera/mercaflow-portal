import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale, localePrefix } from './i18n-config';

export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix,
});

export const config = {
  // Match only internationalized pathnames
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
};
