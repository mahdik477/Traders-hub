import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Space_Grotesk, Fraunces } from "next/font/google";
import AuthProvider from "@/components/auth/AuthProvider";
import BottomNav from "@/components/BottomNav";
import PageTransition from "@/components/PageTransition";
import RegisterServiceWorker from "@/components/RegisterServiceWorker";
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

// Headings only (page-title, section-title, figure — see globals.css). Body
// text stays Geist Sans. A distinct display face for headings, rather than
// the same font for everything, is most of what keeps a page from reading
// as an unstyled default.
const spaceGrotesk = Space_Grotesk({
  variable: "--font-heading",
  subsets: ["latin"],
});

// Homepage only. A display serif with real character, used nowhere else on
// the site — pages other than / keep Space Grotesk untouched. The homepage
// locally reassigns --font-heading to this variable for its own subtree
// (see the wrapper div in src/app/page.tsx), so this never changes any
// other page's type.
const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  axes: ["opsz", "SOFT", "WONK"],
});

// Browser chrome colour for the installed app / mobile address bar.
export const viewport: Viewport = {
  themeColor: "#070708",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

// Absolute URL base for share images and canonical links. Vercel fills
// VERCEL_PROJECT_PRODUCTION_URL in production; set NEXT_PUBLIC_SITE_URL to
// override (e.g. once a custom domain is live).
function siteUrl(): URL {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return new URL(explicit);
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return new URL(`https://${vercel}`);
  return new URL("http://localhost:3000");
}

export const metadata: Metadata = {
  metadataBase: siteUrl(),
  applicationName: SITE_NAME,
  appleWebApp: { capable: true, title: SITE_NAME, statusBarStyle: "black-translucent" },
  title: {
    default: `${SITE_NAME} | Compare trading products`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "Discover and compare prop firms, brokers, courses, tools and signal groups. For information only — we do not verify trading performance.",
};

// Sets data-theme before hydration so the page never flashes the wrong
// theme. Defaults to dark (the product default) unless the visitor
// previously chose light mode.
const themeInitScript = `
  try {
    var theme = localStorage.getItem('theme');
    document.documentElement.setAttribute('data-theme', theme === 'light' ? 'light' : 'dark');
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-theme="dark"
      className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} ${fraunces.variable} h-full antialiased`}
    >
      <head>
        {/* Impact reads `value` on this tag. The metadata API would emit `content` instead. */}
        <meta
          name="impact-site-verification"
          {...({
            value: "3f9050cb-b5d8-4655-b9b5-b2472e7da4e8",
          } as React.MetaHTMLAttributes<HTMLMetaElement>)}
        />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="flex min-h-full flex-col">
        {/* Accounts are optional: with no Supabase variables set, this
            provider stays inert and every sign-in control hides itself. */}
        <AuthProvider>
          <SiteHeader />
          {/* Every page sits in the same centred container as the header. */}
          <main className="container-page flex-1 py-10 sm:py-14">
            <PageTransition>{children}</PageTransition>
          </main>
          <SiteFooter />
          <BottomNav />
          <RegisterServiceWorker />
        </AuthProvider>
      </body>
    </html>
  );
}
