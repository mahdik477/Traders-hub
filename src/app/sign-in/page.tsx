import type { Metadata } from "next";
import SignInPanel from "@/components/auth/SignInPanel";
import { SITE_NAME } from "@/lib/sections";
import PageIntro from "@/components/PageIntro";

export const metadata: Metadata = {
  title: "Sign in",
  description: `Sign in to ${SITE_NAME} with Google, an email link or a password to keep your saved listings, comparisons and learning progress across devices.`,
  robots: { index: false },
};

export default function SignInPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <PageIntro
        eyebrow="Account"
        title={<>Sign in to {SITE_NAME}</>}
        lede={<>Your saved listings, your learning progress and what you&apos;re using — in one place, on any device.</>}
      />
      <SignInPanel />
    </div>
  );
}
