import {getRequestConfig} from 'next-intl/server';
import {notFound} from 'next/navigation';
import { locales } from './i18n-config';

async function loadMessages(locale: string) {
  switch (locale) {
    case 'en':
      return {
        Dashboard: (await import('../messages/en/Dashboard.json')).default,
        Auth: (await import('../messages/en/Auth.json')).default,
        Landing: (await import('../messages/en.json')).default.Landing,
      };
    case 'es':
      return {
        Dashboard: (await import('../messages/es/Dashboard.json')).default,
        Auth: (await import('../messages/es/Auth.json')).default,
        Landing: (await import('../messages/es.json')).default.Landing,
      };
    default:
      return {};
  }
}
 
export default getRequestConfig(async ({locale}) => {
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as any)) notFound();
 
  return {
    messages: await loadMessages(locale)
  };
});
