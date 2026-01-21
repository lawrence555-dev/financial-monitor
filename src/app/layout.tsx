import type { Metadata } from "next";
import { IBM_Plex_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const plex = IBM_Plex_Sans({
  variable: "--font-plex",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FHC-Elite | 金控價值導航系統",
  description: "專業金控存股族價值分析平台",
};

import { ToastProvider } from "@/components/Toast";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <body className={`${plex.variable} ${jetbrainsMono.variable} antialiased bg-[#020617]`}>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
