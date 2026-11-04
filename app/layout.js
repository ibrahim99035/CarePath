import "leaflet/dist/leaflet.css";
import "./fonts.css";
import "./globals.css";
import "./map.css";
import BottomNav from "@/components/BottomNav";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

export const metadata = {
  title: {
    default: "دليلتي الصحية | CarePath",
    template: "%s | دليلتي الصحية",
  },
  description:
    "تطبيق التوجيه الصحي لأهالي الفيوم: أجب عن أسئلة بسيطة لتعرف مستوى الرعاية المناسب وأقرب المنشآت الصحية، ويعمل دون إنترنت.",
  applicationName: "دليلتي الصحية",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "دليلتي الصحية",
  },
  icons: {
    icon: [
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
  formatDetection: { telephone: true },
};

export const viewport = {
  themeColor: "#0f766e",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <a className="skip-link" href="#main">
          تخطي إلى المحتوى
        </a>
        <main id="main" className="app-main">
          {children}
        </main>
        <BottomNav />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
