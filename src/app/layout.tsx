import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans, Sora } from "next/font/google";
import "./globals.css";

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

export const metadata: Metadata = {
  title: "asu.network",
  description:
    "A talent network for ASU engineers, builders, operators, and ambitious students to discover and connect.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${sora.variable} ${plexSans.variable} ${plexMono.variable} antialiased`}>
        <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col">
          <header className="sticky top-0 z-10 px-5 pt-5 sm:px-7">
            <nav className="shell flex items-center justify-between rounded-2xl border border-line/60 px-4 py-3">
              <a href="#top" className="font-display text-xl leading-none">
                asu.network
              </a>
              <ul className="flex items-center gap-4 text-sm text-muted">
                <li>
                  <a href="#people" className="transition hover:text-foreground">
                    People
                  </a>
                </li>
                <li>
                  <a href="#graph" className="transition hover:text-foreground">
                    Graph
                  </a>
                </li>
                <li>
                  <a href="#join" className="transition hover:text-foreground">
                    Join
                  </a>
                </li>
              </ul>
            </nav>
          </header>
          <div className="flex-1">{children}</div>
        </div>
      </body>
    </html>
  );
}
