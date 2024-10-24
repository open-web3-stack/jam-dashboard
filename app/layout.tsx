import { Suspense } from "react";
import type { Metadata } from "next";
import localFont from "next/font/local";
import Link from "next/link";
import Image from "next/image";
import { ThemeProvider } from "@/components/theme-provider";
import { ModeToggle } from "@/components/mode-toggle";
import { Toaster } from "@/components/ui/sonner";
import { DynamicBreadcrumb } from "@/components/dynamic-breadcrumb";
import { Loader } from "lucide-react";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "JAM Dashboard",
  description: "UI for monitoring, testing and interacting with JAM Nodes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 items-center">
              <Link href="/" className="flex items-center space-x-2">
                <span className="font-bold">JAM Dashboard</span>
              </Link>
              <div className="flex flex-1 items-center justify-end space-x-4">
                <nav className="flex items-center space-x-2">
                  <ModeToggle />
                </nav>
              </div>
            </div>
          </header>

          <div className="container py-4">
            <DynamicBreadcrumb />
          </div>

          <main>
            <Suspense
              fallback={
                <div className="flex justify-center items-center h-64">
                  <Loader className="w-12 h-12 animate-spin text-gray-600" />
                </div>
              }
            >
              {children}
            </Suspense>
          </main>

          <Toaster richColors />

          <footer className="border-t">
            <div className="container flex items-center justify-center h-14">
              <a
                className="flex items-center gap-2 hover:underline hover:underline-offset-4"
                href="https://github.com/open-web3-stack/jam-dashboard"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Image
                  src="https://nextjs.org/icons/globe.svg"
                  alt="Globe icon"
                  width={16}
                  height={16}
                />
                Go to source code →
              </a>
            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
