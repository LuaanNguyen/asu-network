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
    default: "asu.network — the network for people who build",
    template: "%s | asu.network",
  },
  description:
    "discover ASU's top engineers, designers, creators, and researchers. a searchable talent directory and connection graph for Arizona State University builders.",
  applicationName: "asu.network",
  alternates: {
    canonical: "/",
  },
  keywords: [
    "asu",
    "arizona state university",
    "asu network",
    "asu talent",
    "asu engineers",
    "asu designers",
    "asu researchers",
    "asu startups",
    "student builders",
    "engineering network",
    "startup community",
    "talent graph",
    "asu directory",
    "asu people",
    "arizona state builders",
  ],
  openGraph: {
    type: "website",
    url: "/",
    siteName: "asu.network",
    title: "asu.network — the network for people who build",
    description:
      "discover ASU's top engineers, designers, creators, and researchers. explore profiles, projects, and connections across Arizona State University.",
    locale: "en_US",
    images: [
      {
        url: "/opengraph-image",
        width: 1536,
        height: 1024,
        alt: "asu.network — the network for people who build. A landing page showing a searchable talent directory for ASU builders.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "asu.network — the network for people who build",
    description:
      "discover ASU's top engineers, designers, creators, and researchers. a searchable talent directory for Arizona State University.",
    images: [
      {
        url: "/twitter-image",
        alt: "asu.network — the network for people who build",
      },
    ],
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
  other: {
    "theme-color": "#8c1d40",
    "msapplication-TileColor": "#8c1d40",
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "asu.network",
              url: siteUrl,
              description:
                "A searchable talent directory and connection graph for Arizona State University builders, engineers, designers, creators, and researchers.",
              publisher: {
                "@type": "Organization",
                name: "asu.network",
                url: siteUrl,
              },
              potentialAction: {
                "@type": "SearchAction",
                target: {
                  "@type": "EntryPoint",
                  urlTemplate: `${siteUrl}/?q={search_term_string}`,
                },
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
      </head>
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
