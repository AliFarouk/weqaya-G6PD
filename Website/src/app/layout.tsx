import type { Metadata, Viewport } from 'next';
import { Cairo, Tajawal, Nunito } from 'next/font/google';
import '@/styles/globals.css';

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['500', '600', '700', '800', '900'],
  variable: '--font-cairo',
  display: 'swap',
});

const tajawal = Tajawal({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '700'],
  variable: '--font-tajawal',
  display: 'swap',
});

const nunito = Nunito({
  subsets: ['latin'],
  weight: ['800', '900'],
  variable: '--font-nunito',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'وقاية G6PD — دليلك السريع لأمان أكلات وأدوية أنيميا الفول',
  description: 'دليل رقمي مجتمعي لحظي لمرضى أنيميا الفول في مصر والوطن العربي بالأسماء التجارية المتداولة، مع نسب تكسير الدم وتصويت المرضى.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/brand/App Icon Favicon 512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/brand/App Icon Favicon 512x512.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/site.webmanifest',
  openGraph: {
    title: 'وقاية G6PD — دليلك السريع لأمان أكلات وأدوية أنيميا الفول',
    description: 'ابحث بالاسم التجاري وتأكد من نسب تكسير الدم مع مرضى أنيميا الفول وفق تجارب حقيقية موثقة.',
    url: '/',
    siteName: 'Weqaya G6PD - وقاية',
    locale: 'ar_EG',
    type: 'website',
    images: [
      {
        url: '/og-default.png',
        width: 1200,
        height: 630,
        alt: 'وقاية G6PD - دليل أمان أكلات وأدوية أنيميا الفول',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'وقاية G6PD — دليل أمان أكلات وأدوية أنيميا الفول',
    description: 'ابحث بالاسم التجاري وتأكد من تجارب ونسب تكسير الدم للأكلات والأدوية.',
    images: ['/og-default.png'],
  },
};

export const viewport: Viewport = {
  themeColor: '#5E72E4',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} ${tajawal.variable} ${nunito.variable}`} suppressHydrationWarning>
      <body className="antialiased min-h-screen flex flex-col" suppressHydrationWarning>
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                ${
                  process.env.NODE_ENV === 'production'
                    ? `window.addEventListener('load', function() {
                        navigator.serviceWorker.register('/sw.js').catch(function() {});
                      });`
                    : `navigator.serviceWorker.getRegistrations().then(function(registrations) {
                        for (var r of registrations) { r.unregister(); }
                      });`
                }
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
