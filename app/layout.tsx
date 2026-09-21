import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/lib/auth-context';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'BidVerify AI - AI-Driven Compliance for Smarter Procurement',
  description: 'AI-Powered Integrated Bid Compliance Verification Platform for GeM procurement in India. Automatically checks bidder information and submitted documents for consistency, completeness, and compliance.',
  openGraph: {
    title: 'BidVerify AI - AI-Driven Compliance for Smarter Procurement',
    description: 'AI-Powered Integrated Bid Compliance Verification Platform for GeM procurement in India.',
    images: [{ url: 'https://bolt.new/static/og_default.png' }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
