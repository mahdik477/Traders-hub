import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/supabase/config";

// Kept in step with WelcomePassword.tsx (a client file, so not imported here).
const PW_SKIP_COOKIE = "tradox_pw_skip";

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
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // First time in and no password yet → offer one straight away
      // (optional; "Skip for now" sets a cookie so we stop asking). A
      // password-reset link already points at /welcome/password itself.
      const hasPassword = data.user?.user_metadata?.has_password === true;
      const skipped = request.cookies.get(PW_SKIP_COOKIE)?.value === "1";
      if (!hasPassword && !skipped && !next.startsWith("/welcome/password")) {
        return NextResponse.redirect(`${origin}/welcome/password?next=${encodeURIComponent(next)}`);
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  const reason = searchParams.get("error_description") ?? searchParams.get("error");
  const key = reason && /expired|invalid/i.test(reason) ? "expired" : "link";
  return NextResponse.redirect(`${origin}/sign-in?error=${key}&next=${encodeURIComponent(next)}`);
}
