import type { Metadata, Viewport } from "next";
import { Cairo, Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import JsonLd from "@/components/JsonLd";
import { SITE_NAME, SITE_URL } from "@/lib/seo";

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
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  title: {
    default: "سوق فون مصر | بيع وشراء الموبايلات والإلكترونيات",
    template: "%s | سوق فون",
  },
  description: "سوق فون مصر لبيع وشراء الموبايلات الجديدة والمستعملة والإلكترونيات. إعلانات حقيقية وتواصل مباشر وآمن بدون عمولة داخل مصر.",
  keywords: ["سوق فون", "موبايلات للبيع", "هواتف مستعملة", "موبايلات مستعملة", "بيع موبايل", "شراء موبايل", "سوق موبايلات مصر", "إلكترونيات مستعملة"],
  category: "marketplace",
  creator: SITE_NAME,
  publisher: SITE_NAME,
  referrer: "origin-when-cross-origin",
  formatDetection: { email: false, address: false, telephone: false },
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    title: "سوق فون | كل السوق في إيدك",
    description: "سوق الموبايلات والإلكترونيات الجديدة والمستعملة في مصر.",
    url: SITE_URL,
    siteName: SITE_NAME,
    images: [{ url: "/og.png", width: 1733, height: 909, alt: "سوق فون - كل السوق في إيدك" }],
    locale: "ar_EG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "سوق فون | كل السوق في إيدك",
    description: "بيع واشتري الموبايلات والإلكترونيات وتواصل مباشرة مع البائع.",
    images: ["/og.png"],
  },
  verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
    : undefined,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#078b43" },
    { media: "(prefers-color-scheme: dark)", color: "#0d0d0d" },
  ],
  colorScheme: "light dark",
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      alternateName: "Souq Phone",
      url: SITE_URL,
      logo: { "@type": "ImageObject", url: `${SITE_URL}/logo.png`, width: 512, height: 512 },
      image: `${SITE_URL}/og.png`,
      description: "منصة عربية لبيع وشراء الموبايلات والإلكترونيات الجديدة والمستعملة.",
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      alternateName: "Souq Phone",
      inLanguage: "ar",
      publisher: { "@id": `${SITE_URL}/#organization` },
      potentialAction: {
        "@type": "SearchAction",
        target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/mobiles?q={search_term_string}` },
        "query-input": "required name=search_term_string",
      },
    },
  ],
};

const themeScript = `
  (function() {
    try {
      const theme = localStorage.getItem('theme');
      const activeTheme = theme || 'light';
      if (activeTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (e) {
      document.documentElement.classList.remove('dark');
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
      <body className="min-h-full flex flex-col bg-[#f7f8f8] dark:bg-[#0d0d0d] text-[#202124] dark:text-[#f1f1f1] pb-20 md:pb-0 transition-colors duration-200 font-[var(--font-cairo)]" style={{ fontFamily: "'Cairo', 'Inter', sans-serif" }}>
        <GoogleAnalytics />
        <JsonLd data={websiteJsonLd} />
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
