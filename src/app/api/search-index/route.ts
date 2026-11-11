import { catalog } from "@/lib/catalog";

// The site-wide search index as one static JSON file, generated at build
// time from the same data the pages use. The search dialog fetches it the
// first time it opens, so no page has to carry ~600 entries in its own HTML.
export const dynamic = "force-static";

export function GET() {
  return Response.json(catalog, {
    headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400" },
  });
}
