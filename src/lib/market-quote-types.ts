import type { SignalMarket } from "@/lib/signal-group-types";

/** A live instrument quote for one market tile. Not a signal-group result. */
export type MarketQuote = {
  price: number;
  /** Percent change versus about 24 hours ago. */
  changePct: number;
  /** Chart points. The last value is the current price. */
  points: number[];
  closed: boolean;
  /** Short wait such as "6h", when the market is closed. */
  opensIn: string | null;
  delayed: boolean;
};

export type PriceSource = "oanda" | "yahoo" | "mock";

export type PricePayload = {
  source: PriceSource;
  quotes: Partial<Record<SignalMarket, MarketQuote>>;
};
