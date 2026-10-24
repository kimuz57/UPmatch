import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import GlobalNotification from "@/components/GlobalNotification";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "UP Match - แอปหาเพื่อน มหาวิทยาลัยพะเยา",
  description: "ค้นหาเพื่อนใหม่ คนรู้ใจ และคอมมูนิตี้เด็ก มพ.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="th"
      className={`${geistSans.variable} ${geistMono.variable} min-h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#9333ea" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="UP Match" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                function updateDeviceMode() {
                  try {
                    var w = window.innerWidth;
                    var h = window.innerHeight;
                    // แนวนอนเมื่อความกว้างมากกว่าความสูง (หรือ orientation landscape)
                    var isLandscape = (w > h) || (window.matchMedia && window.matchMedia('(orientation: landscape)').matches);
                    
                    // คอมพิวเตอร์ หรือ iPad แนวนอน: กว้าง >= 1024px และเป็นแนวนอน (หรือจอใหญ่ >= 1360px)
                    // มือถือ หรือ iPad แนวตั้ง: กว้าง < 1200px ในแนวตั้ง (w <= h)
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
      <body className="min-h-full flex flex-col">
        <GlobalNotification />
        {children}
      </body>
    </html>
  );
}
