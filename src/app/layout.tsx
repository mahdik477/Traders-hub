import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { SITE_NAME } from "@/lib/sections";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: `${SITE_NAME} — Compare trading products`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "Discover and compare prop firms, brokers, courses, tools and signal groups. For information only — we do not verify trading performance.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <SiteHeader />
        {/* Every page sits in the same centred container as the header. */}
        <main className="container-page flex-1 py-10 sm:py-14">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
