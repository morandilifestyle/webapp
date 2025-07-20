import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { CartProvider } from '@/store/CartContext';
import Script from 'next/script';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Morandi Lifestyle - Sustainable Wellness Textiles',
  description: 'Premium sustainable wellness textiles for maternity, healthcare, home, and hospitality. Organic materials, elegant design, and exceptional quality.',
  keywords: 'sustainable textiles, organic baby products, healthcare textiles, home bedding, hospitality solutions, eco-friendly',
  authors: [{ name: 'Morandi Lifestyle' }],
  creator: 'Morandi Lifestyle',
  publisher: 'Morandi Lifestyle',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://morandi-lifestyle.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Morandi Lifestyle - Sustainable Wellness Textiles',
    description: 'Premium sustainable wellness textiles for maternity, healthcare, home, and hospitality.',
    url: 'https://morandi-lifestyle.com',
    siteName: 'Morandi Lifestyle',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Morandi Lifestyle - Sustainable Wellness Textiles',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Morandi Lifestyle - Sustainable Wellness Textiles',
    description: 'Premium sustainable wellness textiles for maternity, healthcare, home, and hospitality.',
    images: ['/og-image.jpg'],
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
  verification: {
    google: 'your-google-verification-code',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={inter.className}>
        <Script
          id="ld-json-website"
          type="application/ld+json"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Morandi Lifestyle",
              url: "https://morandi-lifestyle.com",
              potentialAction: {
                "@type": "SearchAction",
                target: "https://morandi-lifestyle.com/search?q={search_term_string}",
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
        <CartProvider>
          <div className="min-h-screen bg-gray-50">
            {children}
          </div>
        </CartProvider>
      </body>
    </html>
  );
} 