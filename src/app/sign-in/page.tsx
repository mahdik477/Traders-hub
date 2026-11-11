import type { Metadata } from "next";
import SignInPanel from "@/components/auth/SignInPanel";
import { SITE_NAME } from "@/lib/sections";

export const metadata: Metadata = {
  title: "Sign in",
  description: `Sign in to ${SITE_NAME} with Google or an email link to keep your saved listings, comparisons and learning progress across devices.`,
  robots: { index: false },
};

export default function SignInPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="title-rule page-title">Sign in</h1>
      <p className="mt-3 text-lg text-muted">
        Keep your saved firms, courses and comparisons, your learning progress and your alert preferences in one
        place — on any device. Free, and everything on the site still works without it.
      </p>
      <SignInPanel />
    </div>
  );
}
