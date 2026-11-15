"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import PriceChart from "@/components/PriceChart";
import type { SignalMarket } from "@/lib/signal-group-types";
import type { MarketQuote, PricePayload } from "@/lib/market-quote-types";

const PLACEHOLDER = [42, 44, 43, 46, 45, 47, 46, 49, 48, 50, 49, 51, 50, 52];

const TICKER: Record<SignalMarket, string> = {
  gold: "XAU/USD",
  "forex-majors": "EUR/USD",
  "forex-minors": "EUR/GBP",
  indices: "NAS100",
  crypto: "BTC/USD",
  oil: "WTI",
  "stocks-options": "SPX500",
};

export function useMarketQuotes(enabled: boolean): PricePayload | null {
  const [payload, setPayload] = useState<PricePayload | null>(null);
  useEffect(() => {
    if (!enabled) return;
    let ignore = false;
    async function pull() {
      if (document.hidden) return;
      try {
        const response = await fetch("/api/prices", { cache: "no-store" });
        if (!response.ok) return;
        const next = (await response.json()) as PricePayload;
        if (!ignore) setPayload(next);
      } catch {
        /* Keep the last payload. The card never drops its chart. */
      }
    }
    pull();
    const timer = window.setInterval(pull, 10000);
    const onShow = () => {
      if (!document.hidden) pull();
    };
    document.addEventListener("visibilitychange", onShow);
    return () => {
      ignore = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onShow);
    };
  }, [enabled]);
  return payload;
}

export function QuoteLine({ id, quote, variant }: { id: SignalMarket; quote: MarketQuote | undefined; variant: "hero" | "small" }) {
  const [flash, setFlash] = useState<"up" | "down" | null>(null);
  const previous = useRef<number | null>(null);
  useEffect(() => {
    if (!quote) return;
    const last = previous.current;
    previous.current = quote.price;
    if (last == null || last === quote.price) return;
    const direction = quote.price > last ? "up" : "down";
    const frame = requestAnimationFrame(() => setFlash(direction));
    const timer = window.setTimeout(() => setFlash(null), 600);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [quote]);

  const closed = Boolean(quote?.closed);
  return (
    <span className={`sg-quote${variant === "hero" ? " is-hero" : ""}`}>
      {quote ? (
        <>
          <span className="sg-quote-main">
            <span className="sg-ticker">{TICKER[id]}</span>
            <span className={`sg-quote-price${flash ? ` is-${flash}` : ""}`}>{formatPrice(id, quote.price)}</span>
            <span className={`sg-change ${changeClass(quote.changePct)}`}>{formatChange(quote.changePct)}</span>
          </span>
          <span className="sr-only">
            {`${TICKER[id]}. ${quote.changePct < 0 ? "Down" : "Up"} ${Math.abs(quote.changePct).toFixed(2)} percent in 24 hours.`}
            {closed ? " Market closed." : ""}
            {quote.delayed ? " Price delayed." : ""}
          </span>
        </>
      ) : (
        <span className="sg-quote-hold">Price loading</span>
      )}
      {quote?.delayed && <span className="sg-quote-note">Delayed</span>}
      {closed && (
        <span className="sg-quote-note">{quote?.opensIn ? `Market closed · opens in ${quote.opensIn}` : "Market closed"}</span>
      )}
    </span>
  );
}

export function TileChart({
  quote,
  color,
  variant,
  children,
}: {
  quote: MarketQuote | undefined;
  color: string;
  variant: "hero" | "small";
  children: ReactNode;
}) {
  const live = Boolean(quote) && !quote?.closed && !quote?.delayed;
  return (
    <span className={`sg-tile-chart${variant === "hero" ? " is-hero" : ""}`}>
      <PriceChart data={quote?.points ?? PLACEHOLDER} color={color} variant={variant} live={live} placeholder={!quote} />
      {children}
    </span>
  );
}

function formatPrice(id: SignalMarket, price: number): string {
  if (id === "forex-majors" || id === "forex-minors") return price.toFixed(4);
  return `$${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function changeClass(changePct: number): string {
  if (changePct <= -0.005) return "is-down";
  if (changePct >= 0.005) return "is-up";
  return "is-flat";
}

function formatChange(changePct: number): string {
  if (Math.abs(changePct) < 0.005) return "0.00%";
  const arrow = changePct < 0 ? "▼" : "▲";
  const sign = changePct < 0 ? "−" : "+";
  return `${sign}${Math.abs(changePct).toFixed(2)}% ${arrow}`;
}
