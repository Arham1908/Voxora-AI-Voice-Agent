import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import Image from "next/image";
import LogoutButton from "@/components/Auth/LogoutButton";
import GAListener from "./ga";
import Script from "next/script";
const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Voxora AI - Intelligent Voice Solutions",
  description: "Modern Voice Agent & Restaurant Dashboard powered by Voxora AI",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Google Analytics */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          strategy="afterInteractive"
        />
        <Script id="ga-script" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', '${GA_ID}', {
              page_path: window.location.pathname,
            });
          `}
        </Script>
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <GAListener />
        <nav className="navbar-premium fixed top-0 z-50 w-full">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 py-3">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl overflow-hidden shadow-sm group-hover:shadow-md transition-shadow flex-shrink-0">
                <Image
                  src="/logo.svg"
                  alt="Voxora AI"
                  width={36}
                  height={36}
                  className="object-contain"
                />
              </div>
              <span className="text-base sm:text-lg font-bold tracking-tight text-sage-600 group-hover:text-sage-700 transition-colors">
                Voxora <span className="text-accent">AI</span>
              </span>
            </Link>
            <div className="flex items-center gap-0.5 sm:gap-1">
              <Link href="/agent" className="flex items-center gap-1.5 px-2.5 sm:px-4 py-2 rounded-xl text-sm font-medium text-sage-600 hover:bg-sage-50 hover:text-sage-700 transition-all" title="Voice Agent">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" x2="12" y1="19" y2="22" />
                </svg>
                <span className="hidden sm:inline">Voice Agent</span>
              </Link>
              <Link href="/dashboard" className="flex items-center gap-1.5 px-2.5 sm:px-4 py-2 rounded-xl text-sm font-medium text-sage-600 hover:bg-sage-50 hover:text-sage-700 transition-all" title="Dashboard">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                  <rect width="7" height="9" x="3" y="3" rx="1" />
                  <rect width="7" height="5" x="14" y="3" rx="1" />
                  <rect width="7" height="9" x="14" y="12" rx="1" />
                  <rect width="7" height="5" x="3" y="16" rx="1" />
                </svg>
                <span className="hidden sm:inline">Dashboard</span>
              </Link>
              <LogoutButton />
            </div>
          </div>
        </nav>
        <main className="pt-[68px] relative z-10">
          {children}
        </main>
      </body>
    </html>
  );
}
