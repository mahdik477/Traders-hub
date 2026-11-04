import type { JSX } from "react";
import {
  CompassIcon,
  TrendUpIcon,
  CandleIcon,
  ClockIcon,
  WaveStructureIcon,
  CalculatorIcon,
  ScaleIcon,
  BrainIcon,
  ReceiptIcon,
} from "@/components/icons";

// The fixed "Learn" curriculum — 9 topics, each its own hand-written page
// (not data-driven like strategies/courses, since this is a linear course,
// not a filterable list of third-party listings). This file is the single
// source of order, nav, icon and one-line summary — the hub page and every
// topic's own prev/next footer both read from it.
export type LearnTopic = {
  slug: string;
  title: string;
  shortTitle: string;
  summary: string;
  readMinutes: number;
  icon: (p: { className?: string }) => JSX.Element;
};

export const LEARN_TOPICS: LearnTopic[] = [
  {
    slug: "markets-and-instruments",
    title: "Markets & Instruments",
    shortTitle: "Markets",
    summary: "What you can actually trade — forex pairs, stocks, indices, commodities, crypto and futures — and the vocabulary that comes with each.",
    readMinutes: 7,
    icon: CompassIcon,
  },
  {
    slug: "orders-and-leverage",
    title: "Orders, Going Long & Short, and Leverage",
    shortTitle: "Orders & Leverage",
    summary: "How a trade actually gets placed — order types, buying vs. selling short, and what leverage and margin really mean.",
    readMinutes: 8,
    icon: TrendUpIcon,
  },
  {
    slug: "candlesticks-and-charts",
    title: "Reading Candlesticks & Charts",
    shortTitle: "Candlesticks",
    summary: "What a candlestick is actually showing you, the main chart types, and the handful of candle patterns worth knowing first.",
    readMinutes: 9,
    icon: CandleIcon,
  },
  {
    slug: "timeframes-and-styles",
    title: "Timeframes & Trading Styles",
    shortTitle: "Timeframes & Styles",
    summary: "Scalping, day trading, swing trading, position trading — what separates them, and why the timeframe you watch has to match the style you're using.",
    readMinutes: 7,
    icon: ClockIcon,
  },
  {
    slug: "technical-analysis-essentials",
    title: "Technical Analysis Essentials",
    shortTitle: "Technical Analysis",
    summary: "Trend, support and resistance, moving averages, and a map of the indicator families — with links to try each one live.",
    readMinutes: 9,
    icon: WaveStructureIcon,
  },
  {
    slug: "fundamental-analysis-and-metrics",
    title: "Fundamental Analysis & Key Metrics",
    shortTitle: "Fundamentals & Metrics",
    summary: "The company numbers people actually look at — P/E, EPS, market cap — plus the macro releases that move currencies.",
    readMinutes: 9,
    icon: CalculatorIcon,
  },
  {
    slug: "risk-management",
    title: "Risk Management",
    shortTitle: "Risk Management",
    summary: "Position sizing, stop-losses, and risk-to-reward — the unglamorous part that decides whether a trader lasts long enough to get good.",
    readMinutes: 8,
    icon: ScaleIcon,
  },
  {
    slug: "trading-psychology",
    title: "Trading Psychology",
    shortTitle: "Psychology",
    summary: "FOMO, revenge trading, overconfidence — the mental traps that break a perfectly good plan, and what actually helps.",
    readMinutes: 6,
    icon: BrainIcon,
  },
  {
    slug: "costs-fees-and-platforms",
    title: "Costs, Fees & Platforms",
    shortTitle: "Costs & Fees",
    summary: "Spreads, commissions, swap and slippage — the costs that quietly eat into every trade, and where to actually check them.",
    readMinutes: 7,
    icon: ReceiptIcon,
  },
];

export function getLearnTopic(slug: string): LearnTopic | undefined {
  return LEARN_TOPICS.find((t) => t.slug === slug);
}

export function learnTopicIndex(slug: string): number {
  return LEARN_TOPICS.findIndex((t) => t.slug === slug);
}
