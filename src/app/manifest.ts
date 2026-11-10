import type { MetadataRoute } from "next";
import { SITE_NAME } from "@/lib/sections";

// Web app manifest — lets phones offer "Add to home screen" and open the
// site as a standalone app. Icons are generated from the brand mark into
// public/icons (see the maskable one for Android's adaptive shapes).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME} — Trading, decoded`,
    short_name: SITE_NAME,
    description:
      "Compare prop firms, courses, brokers, tools and signal groups, and learn trading from the ground up. Discovery, not verification.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#070708",
    theme_color: "#070708",
    categories: ["finance", "education"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Funded accounts", url: "/funded-accounts", description: "Compare prop firms" },
      { name: "Find my firm", url: "/funded-accounts/find-my-firm" },
      { name: "Learn", url: "/learn" },
      { name: "My Hub", url: "/my-hub" },
    ],
  };
}
