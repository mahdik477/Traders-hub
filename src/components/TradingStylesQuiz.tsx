"use client";

import WrittenQuiz, { type WrittenQuestion } from "@/components/WrittenQuiz";

// Comparing holding periods isn't a chart pattern — there's no signal to
// click, so this tests the actual facts stated on this page.

const QUESTIONS: WrittenQuestion[] = [
  {
    prompt: "Which style typically holds a position for seconds to minutes?",
    options: ["Position trading", "Swing trading", "Scalping", "Day trading"],
    correctIndex: 2,
    explanation: "Scalping is the seconds-to-minutes end of the spectrum, where costs dominate and execution quality matters most.",
  },
  {
    prompt: "What do the Brazilian day-trading statistics quoted on this page actually say?",
    options: [
      "Most day traders profit within a year",
      "97% of those who persisted for 300+ days lost money",
      "Day trading beats buy-and-hold on average",
      "Base rates improve significantly with more screen time",
    ],
    correctIndex: 1,
    explanation: "97% of persistent Brazilian day traders — people who kept at it for 300+ days — lost money, with no evidence of learning over time.",
  },
  {
    prompt: "Which style is closest to the documented trend-following evidence, per this page?",
    options: ["Scalping", "Day trading", "Swing trading", "Position trading"],
    correctIndex: 3,
    explanation: "Position trading — fewer trades, larger drawdowns — is named as the closest of the four to the actual trend-following evidence.",
  },
  {
    prompt: "What risk does swing trading carry that day trading specifically avoids?",
    options: ["Execution-cost drag", "Overnight and gap risk", "Pattern-day-trader rules", "High-frequency competition"],
    correctIndex: 1,
    explanation: "Day trading closes positions before the close, so it avoids the overnight and weekend gap risk that swing trading takes on.",
  },
  {
    prompt: "What does this page say should actually drive picking a trading style?",
    options: [
      "Excitement and bragging rights",
      "Matching the style to time, costs and temperament",
      "Whichever style is trending online",
      "Account size alone",
    ],
    correctIndex: 1,
    explanation: "The stated pitfall is choosing a style based on excitement rather than your actual available time, costs and temperament.",
  },
];

export default function TradingStylesQuiz() {
  return <WrittenQuiz questions={QUESTIONS} />;
}
