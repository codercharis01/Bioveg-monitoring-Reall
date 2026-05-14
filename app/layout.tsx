import type {Metadata} from 'next';
import { DM_Sans, DM_Mono } from 'next/font/google';
import './globals.css'; // Global styles

const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-sans' });
const dmMono = DM_Mono({ weight: ['400', '500'], subsets: ['latin'], variable: '--font-mono' });

export const metadata: Metadata = {
  title: 'Bioveg Monitoring',
  description: 'Ecological Field Survey Platform',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${dmSans.variable} ${dmMono.variable}`}>
      <body suppressHydrationWarning className="font-sans bg-cream text-charcoal">{children}</body>
    </html>
  );
}
