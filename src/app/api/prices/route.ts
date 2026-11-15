import { getMarketPrices } from "@/lib/market-quotes";

export const dynamic = "force-dynamic";

export async function GET() {
  const body = await getMarketPrices();
  return Response.json(body, {
    headers: {
      "Cache-Control": "public, s-maxage=10, stale-while-revalidate=30",
    },
  });
}
