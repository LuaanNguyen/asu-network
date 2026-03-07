import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "asu.network — the network for people who build",
    short_name: "asu.network",
    description:
      "Discover ASU's top engineers, designers, creators, and researchers.",
    start_url: "/",
    display: "standalone",
    background_color: "#fff6ea",
    theme_color: "#8c1d40",
    icons: [
      {
        src: "/asu_network.png",
        sizes: "1536x1024",
        type: "image/png",
      },
    ],
  };
}
