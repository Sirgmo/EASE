import type { Metadata, Viewport } from 'next';
import { Inter, Outfit } from 'next/font/google';
import '@/styles/globals.css';

// Primary font for body text
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

// Display font for headings
const outfit = Outfit({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-outfit',
});

export const metadata: Metadata = {
  title: {
    default: 'EASE | AI-First Real Estate Transactions',
    template: '%s | EASE',
  },
  description:
    'EASE revolutionizes real estate transactions with AI-powered transparency. See total costs, risks, and timelines upfront. No hidden fees, no surprises.',
  keywords: [
    'real estate',
    'AI',
    'property',
    'home buying',
    'transparency',
    'transaction',
    'closing costs',
  ],
  authors: [{ name: 'EASE Team' }],
  creator: 'EASE',
  publisher: 'EASE',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'EASE',
    title: 'EASE | AI-First Real Estate Transactions',
    description:
      'Revolutionizing real estate with AI-powered transparency. See total costs, risks, and timelines upfront.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EASE | AI-First Real Estate Transactions',
    description:
      'Revolutionizing real estate with AI-powered transparency. See total costs, risks, and timelines upfront.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`} suppressHydrationWarning>
      <body className="min-h-screen bg-gradient-to-b from-secondary-50 to-white font-sans antialiased">
        {/* Skip to main content for accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary-600 focus:px-4 focus:py-2 focus:text-white"
        >
          Skip to main content
        </a>

        {/* Main app wrapper */}
        <div className="relative flex min-h-screen flex-col">
          <main id="main-content" className="flex-1">
            {children}
          </main>
        </div>

        {/* Toast/notification container - will be used by toast library */}
        <div id="toast-container" />
      </body>
    </html>
  );
}
