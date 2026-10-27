import type { Metadata } from "next";
import { Prompt } from "next/font/google";
import "./globals.css";
import GlobalNotification from "@/components/GlobalNotification";
import FloatingHeartsBackground from "@/components/FloatingHeartsBackground";

const promptFont = Prompt({
  weight: ["400", "500", "600", "700", "800"],
  subsets: ["thai", "latin"],
  variable: "--font-prompt",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://upmatch.tcmg.me";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "UPmatch — เว็บหาคู่ ม.พะเยา ฟรี สำหรับนิสิต",
    template: "%s | UPmatch",
  },
  description:
    "UPmatch แพลตฟอร์มหาคู่สำหรับนิสิตมหาวิทยาลัยพะเยา หาเพื่อน หาแฟน และหาคนคุย พร้อมดูคนที่กดไลก์และแมตช์กันได้ฟรี",
  applicationName: "UPmatch",
  authors: [{ name: "UPmatch Student Project" }],
  generator: "Next.js",
  keywords: [
    "UPmatch",
    "UP Match",
    "up-match",
    "เว็บหาคู่ ม.พะเยา",
    "หาคู่ ม.พะเยา",
    "หาแฟน ม.พะเยา",
    "หาคนคุย ม.พะเยา",
    "เว็บหาคู่ฟรี",
    "แพลตฟอร์มหาคู่สำหรับนิสิต",
    "เด็กพะเยา",
    "มหาวิทยาลัยพะเยา",
    "นิสิต ม.พะเยา",
    "UP dating",
  ],
  referrer: "origin-when-cross-origin",
  creator: "UPmatch Student Project",
  publisher: "UPmatch",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "UPmatch — เว็บหาคู่ ม.พะเยา ฟรี สำหรับนิสิต",
    description:
      "UPmatch แพลตฟอร์มหาคู่สำหรับนิสิตมหาวิทยาลัยพะเยา หาเพื่อน หาแฟน และหาคนคุย พร้อมดูคนที่กดไลก์และแมตช์กันได้ฟรี",
    url: siteUrl,
    siteName: "UPmatch",
    locale: "th_TH",
    type: "website",
    images: [
      {
        url: "/logo.png",
        width: 512,
        height: 512,
        alt: "UPmatch โลโก้แอปหาคู่ ม.พะเยา",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "UPmatch — เว็บหาคู่ ม.พะเยา ฟรี สำหรับนิสิต",
    description:
      "UPmatch แพลตฟอร์มหาคู่สำหรับนิสิตมหาวิทยาลัยพะเยา หาเพื่อน หาแฟน และหาคนคุย พร้อมดูคนที่กดไลก์และแมตช์กันได้ฟรี",
    images: ["/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/logo.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/logo.png", sizes: "180x180", type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: siteUrl,
        name: "UPmatch",
        alternateName: ["UP Match", "up-match", "UPmatch ม.พะเยา"],
        description:
          "UPmatch แพลตฟอร์มหาคู่สำหรับนิสิตมหาวิทยาลัยพะเยา หาเพื่อน หาแฟน และหาคนคุย พร้อมดูคนที่กดไลก์และแมตช์กันได้ฟรี",
        inLanguage: "th-TH",
      },
      {
        "@type": "WebApplication",
        "@id": `${siteUrl}/#webapp`,
        name: "UPmatch",
        url: siteUrl,
        applicationCategory: "SocialNetworkingApplication",
        operatingSystem: "All",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "THB",
        },
        description:
          "เว็บหาคู่ ม.พะเยา ฟรี สำหรับนิสิต ค้นหาเพื่อนใหม่ คนรู้ใจ และคอมมูนิตี้เด็ก มพ. ปลอดภัยด้วยอีเมล @up.ac.th",
      },
    ],
  };

  return (
    <html
      lang="th"
      className={`${promptFont.variable} min-h-full antialiased font-sans`}
      suppressHydrationWarning
    >
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#581c87" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="UPmatch" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                function updateDeviceMode() {
                  try {
                    var w = window.innerWidth;
                    var h = window.innerHeight;
                    var isLandscape = (w > h) || (window.matchMedia && window.matchMedia('(orientation: landscape)').matches);
                    var isDesktop = (w >= 1024 && isLandscape) || (w >= 1360);
                    
                    if (isDesktop) {
                      document.documentElement.classList.add('device-desktop');
                      document.documentElement.classList.remove('device-mobile');
                    } else {
                      document.documentElement.classList.add('device-mobile');
                      document.documentElement.classList.remove('device-desktop');
                    }
                  } catch(e) {}
                }
                updateDeviceMode();
                window.addEventListener('resize', updateDeviceMode);
                window.addEventListener('orientationchange', updateDeviceMode);
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 relative selection:bg-purple-200">
        <FloatingHeartsBackground />
        <GlobalNotification />
        {children}
      </body>
    </html>
  );
}
