import type { MetadataRoute } from "next";
import { siteDescription, siteHost, siteName } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${siteName} — ${siteHost}`,
    short_name: "asu network",
    description: siteDescription,
    start_url: "/",
    display: "standalone",
    background_color: "#fff6ea",
    theme_color: "#8c1d40",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
