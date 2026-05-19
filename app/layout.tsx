import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/react';
import '../styles/globals.css';

export const metadata: Metadata = {
  title: '@i.think.i.left.the.stove.on — Film Gallery',
  description: 'ソウル在住のアマチュアフィルム写真家によるフィルム別作例ギャラリー。Vision3・Kodak・Ilfordなど多種のフィルムを掲載。',
  openGraph: {
    type: 'website',
    title: '@i.think.i.left.the.stove.on — Film Gallery',
    description: 'ソウル在住のアマチュアフィルム写真家によるフィルム別作例ギャラリー。',
    locale: 'ja_JP',
  },
  twitter: {
    card: 'summary',
    title: '@i.think.i.left.the.stove.on — Film Gallery',
    description: 'フィルム別作例ギャラリー | Seoul Film Photographer',
  },
  icons: {
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='6' fill='%23C2613A'/%3E%3Crect x='4' y='9' width='24' height='14' rx='2' fill='none' stroke='%23fff' stroke-width='2'/%3E%3Crect x='2' y='12' width='4' height='3' rx='1' fill='%23fff'/%3E%3Crect x='2' y='17' width='4' height='3' rx='1' fill='%23fff'/%3E%3Crect x='26' y='12' width='4' height='3' rx='1' fill='%23fff'/%3E%3Crect x='26' y='17' width='4' height='3' rx='1' fill='%23fff'/%3E%3Ccircle cx='16' cy='16' r='4' fill='%23fff' opacity='.85'/%3E%3C/svg%3E",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" id="html-root">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
