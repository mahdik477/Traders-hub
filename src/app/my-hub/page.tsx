import type { Metadata } from "next";
import MyHub from "@/components/MyHub";
import { propFirms } from "@/lib/propfirms";
import { strategies } from "@/lib/strategies";
import { SITE_NAME } from "@/lib/sections";
import PageIntro from "@/components/PageIntro";

export const metadata: Metadata = {
  title: "My Hub",
  description: `Your saved listings, comparisons, recently viewed pages and learning progress on ${SITE_NAME}.`,
  robots: { index: false },
};

// Strategies with an interactive quiz — only those count towards "quizzes
// done". Mirrors INTERACTIVE_SLUGS in the strategy route by checking which
// strategies have a literal page folder would need the filesystem, so we
// use the same rule the directory badge uses: every strategy has a quiz
// slot today (all 58 have interactive pages).
export default function MyHubPage() {
  const firmNames = Object.fromEntries(propFirms.map((f) => [f.id, f.name]));
  return (
    <>
      <PageIntro eyebrow="Your things" title={<>My Hub</>} lede={<>Everything you&apos;ve saved, compared, ticked off or looked at recently — in one place. It works
        without an account; sign in to keep it across devices.</>} />
      <MyHub quizCount={strategies.length} firmNames={firmNames} />
    </>
  );
}
