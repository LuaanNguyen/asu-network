import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans, Sora } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import {
  metadataBase,
  siteDescription,
  siteHost,
  siteName,
  siteUrl,
} from "@/lib/site";

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

const ogImagePath = "/opengraph-image";
const twitterImagePath = "/twitter-image";

export const metadata: Metadata = {
  metadataBase,
  title: {
    default: `${siteName} | ${siteHost}`,
    template: "%s | asu network",
  },
  description: siteDescription,
  applicationName: "asu network",
  alternates: {
    canonical: "/",
  },
  keywords: [
    "asu network",
    "asu network website",
    "asu networking",
    "asu",
    "arizona state university",
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
    url: siteUrl,
    siteName,
    title: `${siteName} | ${siteHost}`,
    description:
      "discover and connect with arizona state university builders across engineering, product, design, and research.",
    locale: "en_US",
    images: [
      {
        url: ogImagePath,
        width: 1200,
        height: 630,
        alt: "asu network preview image",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteName} | ${siteHost}`,
    description:
      "discover and connect with arizona state university builders in one network.",
    images: [
      {
        url: twitterImagePath,
        alt: "asu network preview image",
      },
    ],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", type: "image/x-icon", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    shortcut: [{ url: "/favicon.ico", type: "image/x-icon" }],
    apple: [{ url: "/apple-icon.png", type: "image/png", sizes: "180x180" }],
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
  category: "education",
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
              "@graph": [
                {
                  "@type": "Organization",
                  "@id": `${siteUrl}#organization`,
                  name: "asu network",
                  url: siteUrl,
                  logo: `${siteUrl}/icon.svg`,
                  sameAs: ["https://github.com/LuaanNguyen/asu-network"],
                },
                {
                  "@type": "WebSite",
                  "@id": `${siteUrl}#website`,
                  name: "asu network",
                  alternateName: "asunetwork.com",
                  url: siteUrl,
                  description:
                    "a searchable talent directory and connection graph for arizona state university builders.",
                  publisher: {
                    "@id": `${siteUrl}#organization`,
                  },
                  potentialAction: {
                    "@type": "SearchAction",
                    target: {
                      "@type": "EntryPoint",
                      urlTemplate: `${siteUrl}/?q={search_term_string}`,
                    },
                    "query-input": "required name=search_term_string",
                  },
                },
              ],
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebPage",
              name: "asu network",
              url: siteUrl,
              isPartOf: {
                "@id": `${siteUrl}#website`,
              },
              about: {
                "@id": `${siteUrl}#organization`,
              },
            }),
          }}
        />
      </head>
      <body
        className={`${sora.variable} ${plexSans.variable} ${plexMono.variable} lowercase antialiased`}
      >
        <div className="mx-auto flex min-h-screen w-full max-w-[1800px] flex-col">
          <div className="flex-1">{children}</div>
          <footer className="px-4 pb-4 sm:px-6 lg:px-6 lg:pb-2 xl:px-8">
            <div className="shell flex flex-col gap-1.5 rounded-2xl border border-line/60 px-4 py-2.5 text-xs text-muted sm:flex-row sm:items-center sm:justify-between lg:px-5 lg:py-2">
              <p>
                check out the source code here:{" "}
                <a
                  href="https://github.com/LuaanNguyen/asu-network"
                  target="_blank"
                  rel="noreferrer"
                  className="text-accent-ink underline-offset-2 hover:underline"
                >
                  github.com/LuaanNguyen/asu-network
                </a>
              </p>
              <p className="sm:text-right">
                inspired by{" "}
                <a
                  href="https://uwaterloo.network"
                  target="_blank"
                  rel="noreferrer"
                  className="underline-offset-2 hover:underline"
                >
                  uwaterloo.network
                </a>
              </p>
            </div>
          </footer>
        </div>
        <Analytics />
      </body>
    </html>
  );
}
