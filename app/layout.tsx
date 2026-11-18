import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ProfileProvider } from '@/lib/store/ProfileProvider';
import Header from '@/components/layout/Header';
import BottomNav from '@/components/layout/BottomNav';
import SidebarNav from '@/components/layout/SidebarNav';
import RightRail from '@/components/layout/RightRail';
import ServiceWorkerRegister from '@/components/layout/ServiceWorkerRegister';
import SettingsDrawer from '@/components/layout/SettingsDrawer';

export const metadata: Metadata = {
  title: 'Saans – Air Coach',
  description: "Your family's personal air quality coach. Know your air. Act on it.",
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F6F4EF' },
    { media: '(prefers-color-scheme: dark)', color: '#0F1514' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Noto+Sans+Devanagari:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('saans-theme')||localStorage.getItem('saans_theme_preference');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme:dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}`,
          }}
        />
      </head>
      <body suppressHydrationWarning className="bg-[var(--bg)] text-[var(--text)] antialiased">
        <ProfileProvider>
          <ServiceWorkerRegister />
          <SettingsDrawer />

          {/* Unified responsive layout: exactly one <main> landmark and single {children} render */}
          <div className="min-h-dvh flex flex-col lg:flex-row">
            {/* Desktop Sidebar (hidden on mobile) */}
            <div className="hidden lg:block shrink-0">
              <SidebarNav />
            </div>

            {/* Mobile Header (hidden on desktop) */}
            <div className="lg:hidden shrink-0">
              <Header />
            </div>

            {/* Single Unified Main Landmark */}
            <div className="flex-1 flex justify-center w-full min-w-0">
              <main
                id="main-content"
                className="w-full max-w-[720px] px-4 pt-2 pb-[calc(var(--nav-h)+env(safe-area-inset-bottom,0px)+1rem)] lg:px-6 lg:py-6 lg:pb-6 overflow-y-auto"
              >
                {children}
              </main>
            </div>

            {/* Desktop Right Rail (hidden on mobile) */}
            <div className="hidden lg:block shrink-0">
              <RightRail />
            </div>

            {/* Mobile Bottom Nav (hidden on desktop) */}
            <div className="lg:hidden shrink-0">
              <BottomNav />
            </div>
          </div>
        </ProfileProvider>
      </body>
    </html>
  );
}
