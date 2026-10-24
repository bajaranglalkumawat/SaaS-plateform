import type { Metadata, Viewport } from 'next';
import './globals.css';
import CapacitorMobileInit from '@/components/CapacitorMobileInit';

export const metadata: Metadata = {
  title: 'BillFlow - Commercial Multi-Tenant SaaS Billing Platform',
  description: 'Production-Ready SaaS Billing, Inventory Management, Expense Tracking and PDF Invoicing Platform for Business Sellers.',
  applicationName: 'BillFlow',
  appleWebApp: {
    capable: true,
    title: 'BillFlow',
    statusBarStyle: 'black-translucent',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#020617',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <CapacitorMobileInit />
        {children}
      </body>
    </html>
  );
}
