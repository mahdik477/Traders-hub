"use client";

import WrittenQuiz, { type WrittenQuestion } from "@/components/WrittenQuiz";

// Dow Theory is a framework, not a chart pattern — there's no single
// signal to click, so this tests the actual tenets as written on this
// page instead of inventing a chart signal that isn't there.

const QUESTIONS: WrittenQuestion[] = [
  {
    prompt: "By Dow Theory's own definition, what confirms an uptrend?",
    options: [
      "Higher highs and higher lows",
      "Rising volume on its own",
      "A single new high",
      "Price above a moving average",
    ],
    correctIndex: 0,
    explanation:
      "The rule on this page is specific: an uptrend means higher highs AND higher lows together — not just one new high, and not volume on its own.",
  },
  {
    prompt: "When is a Dow Theory reversal actually confirmed?",
    options: [
      "The moment price dips below yesterday's close",
      "A lower high followed by a break of the prior low",
      "Three consecutive down days",
      "A single volume spike on a down day",
    ],
    correctIndex: 1,
    explanation: "The exit rule here is a lower high followed by a break of the prior low — both parts, not either alone.",
  },
  {
    prompt: "Dow Theory says the averages (e.g. different market indexes) must do what to confirm a trend?",
    options: [
      "Move in opposite directions",
      "Confirm each other",
      "Be weighted equally",
      "Hit new highs on the same day every time",
    ],
    correctIndex: 1,
    explanation: "One of the core tenets is that the averages must confirm each other — if they disagree, the trend isn't considered confirmed.",
  },
  {
    prompt: "What's the most commonly cited drawback of Dow Theory signals, per this page?",
    options: [
      "They're too aggressive",
      "They arrive late relative to the actual turn",
      "They ignore volume entirely",
      "They only work on daily charts",
    ],
    correctIndex: 1,
    explanation: "The failure mode listed is signals arriving late relative to the actual turn — confirmation takes time, and that costs you the early part of the move.",
  },
  {
    prompt: "Where does the stop go, by the rule stated on this page?",
    options: [
      "A fixed percentage below entry",
      "Below the most recent confirmed higher low",
      "At the prior day's low",
      "No stop is used",
    ],
    correctIndex: 1,
    explanation: "The stated stop rule is below the most recent confirmed higher low — not a fixed percentage or an arbitrary prior low.",
  },
];

export default function DowTheoryQuiz() {
  return <WrittenQuiz questions={QUESTIONS} />;
}
