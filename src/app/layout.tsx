import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  display: "swap",
  weight: ["200", "300", "400", "500", "600", "700", "800", "900"],
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
    description: "سوق فون - سوق الموبايلات الأول في مصر لبيع وشراء الهواتف المستعملة والجديدة وتواصل مباشر مع البائعين بدون عمولات",
    url: "https://souqphone.com",
    siteName: "سوق فون",
    images: [
      {
        url: "/logo.png",
        width: 512,
        height: 512,
        alt: "سوق فون Logo",
      },
    ],
    locale: "ar_EG",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "سوق فون | المنصة الأولى لبيع وشراء الهواتف في مصر",
    description: "سوق فون - سوق الموبايلات الأول في مصر لبيع وشراء الهواتف المستعملة والجديدة وتواصل مباشر مع البائعين بدون عمولات",
    images: ["/logo.png"],
  },
  verification: {
    google: "YOUR_GOOGLE_VERIFICATION_ID", // استبدل هذا الكود بكود التحقق الخاص بك من Google Search Console لتأكيد ملكية الموقع
  },
};

const themeScript = `
  (function() {
    try {
      const theme = localStorage.getItem('theme');
      // Default to dark if no preference saved
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
      className={`${cairo.className} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 pb-16 md:pb-0 transition-colors duration-200">
        <Header />
        <div className="flex-1">
          {children}
        </div>
      </body>
    </html>
  );
}

