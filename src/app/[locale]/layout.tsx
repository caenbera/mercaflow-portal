import type { ReactNode } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import '../globals.css';
import { AuthProvider } from '@/context/auth-context';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import { NotificationProvider } from '@/context/notification-context';
import { routing } from '@/i18n/routing';
import type { Metadata } from 'next';

export async function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'Metadata' });
  const iconUrl = "https://i.postimg.cc/sxBVGnMp/icon.png?v=2";

  return {
    title: t('title'),
    description: t('description'),
    openGraph: {
      title: t('title'),
      description: t('description'),
      url: 'https://the-fresh-hub.com', // A placeholder URL is fine
      siteName: 'Fresh Hub Portal',
      images: [
        {
          url: iconUrl,
          width: 512,
          height: 512,
          alt: 'Fresh Hub Logo',
        },
      ],
      locale: locale === 'es' ? 'es_ES' : 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title: t('title'),
      description: t('description'),
      images: [iconUrl],
    },
  };
}


export default async function RootLayout({
  children,
  params: { locale },
}: Readonly<{
  children: ReactNode;
  params: { locale: string };
}>) {
  setRequestLocale(locale);
  const messages = await getMessages();
  const iconUrl = "https://i.postimg.cc/sxBVGnMp/icon.png?v=2";

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
        />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href={iconUrl} type="image/png" />
        <link rel="apple-touch-icon" href={iconUrl}></link>
        <meta name="theme-color" content="#27ae60" />
        <link rel="preconnect" href="https://fonts.googleapis.com  " />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com  "
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter  :wght@300;400;600;700&family=Poppins:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased" suppressHydrationWarning>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <AuthProvider>
            <NotificationProvider>
              <FirebaseErrorListener />
              {children}
              <Toaster />
            </NotificationProvider>
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
