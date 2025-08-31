"use client";

import { useState } from 'react';
import type { ReactNode } from 'react';
import './globals.css';
import { AuthProvider } from '@/context/auth-context';
import { Toaster } from '@/components/ui/toaster';
import { LanguageProvider } from '@/context/language-context';
import type { Locale } from '@/lib/i18n';

// Metadata can't be exported from a client component.
// We can handle this differently if needed, but for now we remove it to proceed.
// export const metadata: Metadata = {
//   title: 'Fresh Hub Portal',
//   description: "Wholesale fresh produce for Chicago's latin businesses.",
// };

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const [locale, setLocale] = useState<Locale>('en');

  return (
    <html lang={locale}>
      <head>
        <title>Fresh Hub Portal</title>
        <meta name="description" content="Wholesale fresh produce for Chicago's latin businesses." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <LanguageProvider value={{ locale, setLocale }}>
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
