import type { Metadata } from "next";
import { Cairo, Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-cairo",
});

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://souqphone.com"),
  title: "سوق فون | المنصة الأولى لبيع وشراء الهواتف في مصر",
  description: "سوق فون - سوق الموبايلات الأول في مصر لبيع وشراء الهواتف المستعملة والجديدة وتواصل مباشر مع البائعين بدون عمولات",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    title: "سوق فون | المنصة الأولى لبيع وشراء الهواتف في مصر",
    description: "سوق فون - سوق الموبايلات الأول في مصر",
    url: "https://souqphone.com",
    siteName: "سوق فون",
    images: [{ url: "/logo.png", width: 512, height: 512, alt: "سوق فون" }],
    locale: "ar_EG",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "سوق فون | المنصة الأولى لبيع وشراء الهواتف في مصر",
    description: "سوق فون - سوق الموبايلات الأول في مصر",
    images: ["/logo.png"],
  },
};

const themeScript = `
  (function() {
    try {
      const theme = localStorage.getItem('theme');
      const activeTheme = theme || 'dark';
      if (activeTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (e) {
      document.documentElement.classList.add('dark');
    }
  })();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${cairo.variable} ${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col bg-slate-50 dark:bg-[#0a0e17] text-slate-800 dark:text-slate-100 pb-16 md:pb-0 transition-colors duration-200 font-[var(--font-cairo)]" style={{ fontFamily: "'Cairo', 'Inter', sans-serif" }}>
        <Header />
        <div className="flex-1">
          {children}
        </div>
        <div className="hidden md:block">
          <Footer />
        </div>
      </body>
    </html>
  );
}
