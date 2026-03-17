const defaultSiteUrl = "https://asunetwork.com";

function parseSiteUrl(url: string | undefined): URL | null {
  if (!url) {
    return null;
  }

  try {
    return new URL(url);
  } catch {
    return null;
  }
}

const resolvedSiteUrl = parseSiteUrl(process.env.NEXT_PUBLIC_SITE_URL) ?? new URL(defaultSiteUrl);

export const siteName = "asu network";
export const siteHost = "asunetwork.com";
export const siteUrl = resolvedSiteUrl.origin;
export const metadataBase = new URL(siteUrl);
export const siteDescription =
  "asu network is a searchable directory and connection graph for arizona state university builders, engineers, creators, and researchers.";
