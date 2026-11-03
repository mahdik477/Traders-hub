import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Tab aliases. The pages themselves stay static. Next's redirect config
// keeps the original query, so ?type=cfd would redirect to itself.
const TAB_PATHS: Record<string, string> = {
  cfd: "/brokers",
  stocks: "/brokers/stocks",
  crypto: "/brokers/crypto",
};

export function proxy(request: NextRequest) {
  const url = request.nextUrl.clone();

  if (url.pathname === "/brokers/cfd") {
    url.pathname = "/brokers";
    return NextResponse.redirect(url);
  }

  if (url.pathname !== "/brokers") return NextResponse.next();

  const type = url.searchParams.get("type");
  const path = type ? TAB_PATHS[type] : undefined;
  if (!path) return NextResponse.next();

  url.pathname = path;
  url.searchParams.delete("type");
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/brokers", "/brokers/cfd"],
};
