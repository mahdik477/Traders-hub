import type { Metadata } from "next";
import SignInPanel from "@/components/auth/SignInPanel";
import { SITE_NAME } from "@/lib/sections";
import PageIntro from "@/components/PageIntro";

export const metadata: Metadata = {
  title: "Sign in",
  description: `Sign in to ${SITE_NAME} with Google or an email link to keep your saved listings, comparisons and learning progress across devices.`,
  robots: { index: false },
};

export default function SignInPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <PageIntro eyebrow="Account" title={<>Sign in</>} lede={<>Keep your saved firms, courses and comparisons, your learning progress and your alert preferences in one
        place — on any device. Free, and everything on the site still works without it.</>} />
      <SignInPanel />
    </div>
  );
}
