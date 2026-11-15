import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { PW_OWNER_COOKIE, safeNextPath } from "@/lib/supabase/config";

// Kept in step with WelcomePassword.tsx (a client file, so not imported here).
const PW_SKIP_COOKIE = "tradox_pw_skip";

// A code from Supabase is only valid for five minutes, so "the email was
// confirmed less than this long before the sign-in" means "this is the very
// first time this address has been confirmed".
const FIRST_CONFIRMATION_MS = 5 * 60 * 1000;

/** A long random password nobody knows — used to cancel an untrusted one. */
function unknowablePassword(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return `${Buffer.from(bytes).toString("base64url")}aA1!`;
}

// Where Google and the email link send people back. Supabase hands us a
// one-time code; we swap it for a session (stored in cookies) and send the
// visitor on to the page they came from. Any problem lands on /sign-in with
// a short error key, never with the raw code or token in the address.
//
// SECURITY — don't remove the "untrusted password" step below.
// Anyone can type someone else's address on /sign-up together with a
// password of their own, and never open the email. Supabase keeps that
// password on the unconfirmed account. If the real owner later signs up and
// opens their confirmation email, the stranger's password would still work.
// So: the first time an address is confirmed, we only keep the password if
// it was typed in this same browser a moment ago (the PW_OWNER_COOKIE,
// which holds that account's id). Otherwise the password is replaced with a
// random one nobody knows, and the person is offered "Choose a password".
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
      const user = data.user;
      let hasPassword = user?.user_metadata?.has_password === true;

      const confirmedAt = Date.parse(user?.email_confirmed_at ?? "");
      const signedInAt = Date.parse(user?.last_sign_in_at ?? "");
      const firstConfirmation =
        Number.isFinite(confirmedAt) && Number.isFinite(signedInAt) && Math.abs(signedInAt - confirmedAt) < FIRST_CONFIRMATION_MS;
      const typedHere = !!user && request.cookies.get(PW_OWNER_COOKIE)?.value === user.id;

      if (user && firstConfirmation && !typedHere) {
        const { error: cancelError } = await supabase.auth.updateUser({
          password: unknowablePassword(),
          data: { has_password: false },
        });
        if (cancelError) {
          // Couldn't cancel it — make choosing a new password the next step
          // (no "Skip"), which replaces whatever was there.
          return NextResponse.redirect(`${origin}/welcome/password?reset=1&next=${encodeURIComponent(next)}`);
        }
        hasPassword = false;
        // From here on this browser is the one that owns the password, so
        // a second sign-in in the next few minutes doesn't cancel a password
        // the person has just chosen.
        (await cookies()).set(PW_OWNER_COOKIE, user.id, { maxAge: 3600, path: "/", sameSite: "lax" });
      }

      // First time in and no password yet → offer one straight away
      // (optional; "Skip for now" sets a cookie so we stop asking). A
      // password-reset link already points at /welcome/password itself.
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
