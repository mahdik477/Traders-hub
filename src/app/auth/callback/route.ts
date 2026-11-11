import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/supabase/config";

// Where Google and the email link send people back. Supabase hands us a
// one-time code; we swap it for a session (stored in cookies) and send the
// visitor on to the page they came from. Any problem lands on /sign-in with
// a short error key, never with the raw code or token in the address.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const next = safeNextPath(searchParams.get("next"));
  const supabase = await createSupabaseServer();

  if (!supabase) {
    return NextResponse.redirect(`${origin}/sign-in?error=not-configured`);
  }

  const code = searchParams.get("code");
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }

  const reason = searchParams.get("error_description") ?? searchParams.get("error");
  const key = reason && /expired|invalid/i.test(reason) ? "expired" : "link";
  return NextResponse.redirect(`${origin}/sign-in?error=${key}&next=${encodeURIComponent(next)}`);
}
