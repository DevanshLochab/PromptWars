import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ProfileProvider } from '@/lib/store/ProfileProvider';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { ServiceWorkerRegister } from '@/components/layout/ServiceWorkerRegister';

export const metadata: Metadata = {
  title: 'Saans — Air Quality Coach',
  description:
    'Evidence-based hyper-local air quality decision engine and daily respiratory coach.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Saans',
  },
};

export const viewport: Viewport = {
  themeColor: '#0284c7',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen flex flex-col font-sans selection:bg-sky-500 selection:text-white">
        <ProfileProvider>
          <ServiceWorkerRegister />
          <div className="flex-1 flex flex-col max-w-md mx-auto w-full min-h-screen shadow-xs bg-white dark:bg-slate-900 pb-20">
            <Header />
            <main className="flex-1 p-4 overflow-y-auto">{children}</main>
            <BottomNav />
          </div>
        </ProfileProvider>
      </body>
    </html>
  );
}
