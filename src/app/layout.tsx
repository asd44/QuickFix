import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from '@/contexts/AuthContext';
import { NotificationPrompt } from '@/components/NotificationPrompt';
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration';

import { BottomNav } from '@/components/BottomNav';
import { AuthGuard } from '@/components/AuthGuard';

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: "QuickFix - Home Services Marketplace",
  description: "Get trusted home services at your doorstep",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icon-192.png' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'QuickFix',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
};

export const viewport: Viewport = {
  themeColor: '#FF5722',
};

import { BackButtonHandler } from '@/components/BackButtonHandler';

// Force rebuild
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <ServiceWorkerRegistration />
        <AuthProvider>
          <BackButtonHandler />
          <AuthGuard>

            <NotificationPrompt />
            <main>
              {children}
            </main>
            <BottomNav />
          </AuthGuard>
        </AuthProvider>
      </body>
    </html>
  );
}
