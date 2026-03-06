import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans, Sora } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
});

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const defaultSiteUrl = "https://asu.network";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? defaultSiteUrl;
const metadataBase = (() => {
  try {
    return new URL(siteUrl);
  } catch {
    return new URL(defaultSiteUrl);
  }
})();

export const metadata: Metadata = {
  metadataBase,
  title: {
    default: "asu.network",
    template: "%s | asu.network",
  },
  description:
    "a one-page talent network for asu engineers, designers, creators, and researchers to discover and connect.",
  applicationName: "asu.network",
  alternates: {
    canonical: "/",
  },
  keywords: [
    "asu",
    "arizona state university",
    "student builders",
    "engineering network",
    "startup community",
    "talent graph",
  ],
  openGraph: {
    type: "website",
    url: "/",
    siteName: "asu.network",
    title: "asu.network",
    description:
      "find the people building things at asu. discover profiles, links, and connections in one place.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "asu.network social preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "asu.network",
    description: "find the people building things at asu.",
    images: ["/twitter-image"],
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${sora.variable} ${plexSans.variable} ${plexMono.variable} lowercase antialiased`}
      >
        <div className="mx-auto flex min-h-screen w-full max-w-[1800px] flex-col">
          <header className="sticky top-0 z-10 px-4 pt-4 sm:px-6 lg:px-8 lg:pt-6 xl:px-10">
            <nav className="shell flex items-center justify-between rounded-2xl border border-line/60 px-4 py-3 lg:px-6 lg:py-3.5">
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
              <a href="/" className="font-display text-xl leading-none">
                asu.network
              </a>
              <p className="font-mono text-[11px] tracking-[0.16em] text-muted max-sm:hidden">
                inspired by{" "}
                <a
                  href="https://uwaterloo.network"
                  target="_blank"
                  rel="noreferrer"
                  className="underline-offset-2 hover:underline "
                >
                  uwaterloo.network
                </a>
              </p>
            </nav>
          </header>
          <div className="flex-1">{children}</div>
          <footer className="px-4 pb-4 sm:px-6 lg:px-8 lg:pb-6 xl:px-10">
            <div className="shell rounded-2xl border border-line/60 px-4 py-2.5 text-xs text-muted lg:px-6 lg:py-3">
              check out the source code here:{" "}
              <a
                href="https://github.com/LuaanNguyen/asu-network"
                target="_blank"
                rel="noreferrer"
                className="text-accent-ink underline-offset-2 hover:underline"
              >
                github.com/LuaanNguyen/asu-network
              </a>
            </div>
          </footer>
        </div>
      </body>
      <Analytics />
    </html>
  );
}
