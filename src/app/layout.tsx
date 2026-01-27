import type { Metadata } from 'next';
import { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Fresh Hub Portal',
  description: "Wholesale fresh produce for Chicago's latin businesses.",
};

/**
 * This is the root layout. However, since we are using internationalization,
 * the main layout that defines the <html> and <body> tags is located in
 * `src/app/[locale]/layout.tsx`. This root layout simply acts as a
 * passthrough for its children. The <html> and <body> tags are defined
 * in the locale-specific layout.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  // We return children directly because the actual HTML document structure
  // is handled by src/app/[locale]/layout.tsx
  return children;
}
