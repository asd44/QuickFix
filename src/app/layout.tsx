import { Inter } from "next/font/google";
import "./globals.css";
import { MobileSidebar } from '@/components/MobileSidebar';
import { AuthProvider } from '@/contexts/AuthContext';
import { NotificationPrompt } from '@/components/NotificationPrompt';
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration';

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata = {
  title: "QuickFix - Home Services Marketplace",
  description: "Get trusted home services at your doorstep",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#FF5722" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="QuickFix" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icon-512.png" />
      </head>
      <body>
        <ServiceWorkerRegistration />
        <AuthProvider>
          <NotificationPrompt />
          <MobileSidebar />
          <main>
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
