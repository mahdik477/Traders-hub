// The "New to trading? Start here" guided path: Learn → Strategies → Funded
// Accounts. One ordered list, read by the /start-here page and the homepage
// band, so the two never drift apart. Browser-safe.
//
// Steps that map onto something a visitor can mark as done (a Learn topic,
// a strategy quiz) carry a progress key; the rest are "go and look" steps.

import { LEARN_TOPICS } from "./learn-topics";
import type { ProgressKind } from "./progress-store";

export type PathStep = {
  title: string;
  detail: string;
  href: string;
  /** When set, the step shows a tick once this is marked done. */
  progress?: { kind: ProgressKind; id: string };
};

export type PathStage = {
  id: "learn" | "practice" | "funded";
  eyebrow: string;
  title: string;
  blurb: string;
  href: string;
  steps: PathStep[];
};

// Three free strategies with simulators and quizzes — the gentlest way in.
const FIRST_STRATEGIES = [
  { slug: "support-and-resistance", title: "Support and resistance", detail: "Where price has stopped before — the idea almost every other method builds on." },
  { slug: "moving-average-crossover", title: "Moving average crossover", detail: "The classic trend-following signal. Simple rules, easy to see on the chart." },
  { slug: "range-breakout", title: "Range breakout", detail: "What a breakout actually looks like, and how often it fails." },
];

export const START_HERE_PATH: PathStage[] = [
  {
    id: "learn",
    eyebrow: "Stage 1 · Learn the basics",
    title: "Nine short reads, no jargon",
    blurb: "Markets, orders, charts, risk and the costs nobody mentions. Free, no account. Mark each part done as you go.",
    href: "/learn",
    steps: LEARN_TOPICS.map((t) => ({
      title: t.title,
      detail: `${t.readMinutes} min · ${t.summary}`,
      href: `/learn/${t.slug}`,
      progress: { kind: "learn" as const, id: t.slug },
    })),
  },
  {
    id: "practice",
    eyebrow: "Stage 2 · Practise on a chart",
    title: "Three free strategies with live simulators",
    blurb: "See a setup happen on made-up data, then pass the quiz. Nothing here promises results — it's about recognising what you're looking at.",
    href: "/strategies?tier=free",
    steps: FIRST_STRATEGIES.map((s) => ({
      title: s.title,
      detail: s.detail,
      href: `/strategies/${s.slug}`,
      progress: { kind: "quiz" as const, id: s.slug },
    })),
  },
  {
    id: "funded",
    eyebrow: "Stage 3 · Understand funded accounts",
    title: "Know the rules before you pay a fee",
    blurb: "Prop firms sell evaluations. The rules, not the headline price, decide whether that fee is money well spent.",
    href: "/funded-accounts",
    steps: [
      {
        title: "Drawdown, explained on a chart",
        detail: "Static vs trailing — the rule that catches most beginners out.",
        href: "/funded-accounts/drawdown-explained",
      },
      {
        title: "Find firms whose plans fit you",
        detail: "Five questions; every match explained from the firm's own data.",
        href: "/funded-accounts/find-my-firm",
      },
      {
        title: "Add up the real cost",
        detail: "Fee, resets, activation and extras — before any trading happens.",
        href: "/funded-accounts/cost-calculator",
      },
    ],
  },
];

export const START_HERE_TRACKED = START_HERE_PATH.flatMap((s) => s.steps.filter((st) => st.progress));
