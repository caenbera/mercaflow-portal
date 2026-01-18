import {getRequestConfig} from 'next-intl/server';
import {notFound} from 'next/navigation';
import {locales} from './i18n-config';

// Statically import the messages to prevent dynamic import issues.
import enMessages from './messages/en.json';
import esMessages from './messages/es.json';

export default getRequestConfig(async ({locale}) => {
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as any)) {
    notFound();
  }

  let messages;
  switch (locale) {
    case 'en':
      messages = enMessages;
      break;
    case 'es':
      messages = esMessages;
      break;
    default:
      // This should not be reached given the check above, but it's a safeguard.
      notFound();
  }
 
  return {
    locale,
    messages
  };
});
