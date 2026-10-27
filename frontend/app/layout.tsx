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

export const metadata: Metadata = {
  title: "UP Match - คอมมูนิตี้สำหรับนิสิต มหาวิทยาลัยพะเยา",
  description: "ค้นหาเพื่อนใหม่ คนรู้ใจ และคอมมูนิตี้เด็ก ม.พะเยา ปลอดภัยด้วยอีเมล @up.ac.th",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
