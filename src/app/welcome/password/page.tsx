import type { Metadata } from "next";
import WelcomePassword from "@/components/auth/WelcomePassword";

export const metadata: Metadata = {
  title: "Choose a password",
  robots: { index: false },
};

// Shown straight after someone opens their email sign-in link for the first
// time (see /auth/callback), and after a "Forgot password?" reset link.
export default function WelcomePasswordPage() {
  return <WelcomePassword />;
}
