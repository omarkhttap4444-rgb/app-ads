import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "سوق فون | المنصة الأولى لبيع وشراء الهواتف",
  description: "سوق فون - سوق الموبايلات الأول في مصر لبيع وشراء الهواتف المستعملة والجديدة وتواصل مباشر مع البائعين",
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
      className="h-full antialiased"
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

