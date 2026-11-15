import type { SignalMarket } from "@/lib/signal-group-types";
import type { MarketQuote, PricePayload } from "@/lib/market-quote-types";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

const SERIES_MS = 15 * 60 * 1000;
const PRICE_MS = 10 * 1000;

type Period = { start: number; end: number };
type Series = { at: number; points: number[]; ago: number; period: Period | null; offset: number };

const seriesCache = new Map<string, Series>();
const priceCache = new Map<SignalMarket, { at: number; price: number }>();
const lastKnown = new Map<SignalMarket, MarketQuote>();
let bundleCache: { at: number; body: PricePayload } | null = null;

const YAHOO: Record<Exclude<SignalMarket, "crypto">, string[]> = {
  gold: ["XAUUSD=X", "GC=F"],
  "forex-majors": ["EURUSD=X"],
  "forex-minors": ["EURGBP=X"],
  indices: ["^NDX"],
  oil: ["CL=F"],
  "stocks-options": ["^GSPC"],
};

const OANDA: Record<Exclude<SignalMarket, "crypto">, string> = {
  gold: "XAU_USD",
  "forex-majors": "EUR_USD",
  "forex-minors": "EUR_GBP",
  indices: "NAS100_USD",
  oil: "WTICO_USD",
  "stocks-options": "SPX500_USD",
};

const MOCK_BASE: Record<SignalMarket, number> = {
  gold: 3886,
  "forex-majors": 1.1028,
  "forex-minors": 0.8343,
  indices: 27944,
  crypto: 64700,
  oil: 88.56,
  "stocks-options": 7562,
};

const FX = new Set<SignalMarket>(["gold", "forex-majors", "forex-minors"]);

export async function getMarketPrices(): Promise<PricePayload> {
  if (process.env.USE_MOCK_PRICES === "true") {
    return { source: "mock", quotes: mockQuotes(Date.now()) };
  }
  if (bundleCache && Date.now() - bundleCache.at < PRICE_MS) return bundleCache.body;

  const useOanda = Boolean(process.env.OANDA_API_KEY);
  const ids: SignalMarket[] = ["gold", "forex-majors", "forex-minors", "indices", "crypto", "oil", "stocks-options"];
  const quotes: PricePayload["quotes"] = {};
  await Promise.all(
    ids.map(async (id) => {
      try {
        const quote = await buildQuote(id, useOanda);
        lastKnown.set(id, quote);
        quotes[id] = quote;
      } catch {
        const previous = lastKnown.get(id);
        if (previous) quotes[id] = { ...previous, delayed: true };
      }
    }),
  );
  const body: PricePayload = { source: useOanda ? "oanda" : "yahoo", quotes };
  bundleCache = { at: Date.now(), body };
  return body;
}

async function buildQuote(id: SignalMarket, useOanda: boolean): Promise<MarketQuote> {
  const series = useOanda && id !== "crypto" ? await oandaSeries(id) : await yahooOrBinanceSeries(id);
  let price = series.points[series.points.length - 1];
  try {
    price = useOanda && id !== "crypto" ? await oandaLive(OANDA[id]) : await livePrice(id);
  } catch {
    /* keep the last candle if the fresh quote fails */
  }
  const points = series.points.length >= 2 ? series.points.slice() : [price, price];
  points[points.length - 1] = price;
  const ago = series.ago || points[0];
  const changePct = ago ? ((price - ago) / ago) * 100 : 0;
  const session = sessionState(id, Date.now(), series.period, series.offset);
  return {
    price,
    changePct,
    points,
    closed: session.closed,
    opensIn: session.opensIn,
    delayed: false,
  };
}

async function yahooOrBinanceSeries(id: SignalMarket): Promise<Series> {
  if (id === "crypto") return cryptoSeries();
  return yahooSeries(id);
}

async function yahooSeries(id: Exclude<SignalMarket, "crypto">): Promise<Series> {
  const key = `yahoo:${id}`;
  const hit = seriesCache.get(key);
  if (hit && Date.now() - hit.at < SERIES_MS) return hit;
  const symbol = await firstYahooSymbol(YAHOO[id]);
  if (id === "gold") {
    const daily = await yahooChart(symbol, "1mo", "1d");
    const hourly = await yahooChart(symbol, "5d", "1h");
    const points = takeLast(closes(daily), 30);
    const ago = priceNear(hourly, Date.now() - 24 * 60 * 60 * 1000) ?? metaPrevious(daily) ?? points[0];
    const series = { at: Date.now(), points, ago, period: periodOf(daily), offset: offsetOf(daily) };
    seriesCache.set(key, series);
    return series;
  }
  const chart = await yahooChart(symbol, "5d", "1h");
  const recent = since(chart, Date.now() - 24 * 60 * 60 * 1000);
  const points = recent.length >= 8 ? recent : takeLast(closes(chart), 24);
  const ago = points[0] ?? metaPrevious(chart) ?? 0;
  const series = { at: Date.now(), points, ago, period: periodOf(chart), offset: offsetOf(chart) };
  seriesCache.set(key, series);
  return series;
}

async function cryptoSeries(): Promise<Series> {
  const key = "binance:BTCUSDT";
  const hit = seriesCache.get(key);
  if (hit && Date.now() - hit.at < SERIES_MS) return hit;
  try {
    const points = await binanceKlines("1h", 24);
    const series = { at: Date.now(), points, ago: points[0] ?? 0, period: null, offset: 0 };
    seriesCache.set(key, series);
    return series;
  } catch {
    const chart = await yahooChart("BTC-USD", "5d", "1h");
    const recent = since(chart, Date.now() - 24 * 60 * 60 * 1000);
    const points = recent.length >= 8 ? recent : takeLast(closes(chart), 24);
    const series = { at: Date.now(), points, ago: points[0] ?? 0, period: null, offset: 0 };
    seriesCache.set(key, series);
    return series;
  }
}

async function livePrice(id: SignalMarket): Promise<number> {
  const hit = priceCache.get(id);
  if (hit && Date.now() - hit.at < PRICE_MS) return hit.price;
  let price: number;
  if (id === "crypto") price = await cryptoLive();
  else {
    const symbol = await firstYahooSymbol(YAHOO[id]);
    const chart = await yahooChart(symbol, "1d", "1d");
    price = Number(chart.meta?.regularMarketPrice);
  }
  if (!Number.isFinite(price)) throw new Error("price");
  priceCache.set(id, { at: Date.now(), price });
  return price;
}

async function cryptoLive(): Promise<number> {
  try {
    const data = await getJson("https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT");
    const price = Number(data?.price);
    if (Number.isFinite(price)) return price;
  } catch {
    /* Binance is blocked in some regions. Yahoo is the keyless fallback. */
  }
  const chart = await yahooChart("BTC-USD", "1d", "1d");
  return Number(chart.meta?.regularMarketPrice);
}

async function binanceKlines(interval: string, limit: number): Promise<number[]> {
  const data = await getJson(
    `https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=${interval}&limit=${limit}`,
  );
  if (!Array.isArray(data)) throw new Error("klines");
  const points = data.map((row: unknown[]) => Number(row[4])).filter((value: number) => Number.isFinite(value));
  if (points.length < 2) throw new Error("klines");
  return points;
}

async function oandaSeries(id: Exclude<SignalMarket, "crypto">): Promise<Series> {
  const key = `oanda:${id}`;
  const hit = seriesCache.get(key);
  if (hit && Date.now() - hit.at < SERIES_MS) return hit;
  const instrument = OANDA[id];
  if (id === "gold") {
    const daily = await oandaCandles(instrument, "D", 30);
    const hourly = await oandaCandles(instrument, "H1", 30);
    const series = { at: Date.now(), points: daily, ago: hourly[0] ?? daily[0], period: null, offset: 0 };
    seriesCache.set(key, series);
    return series;
  }
  const hourly = await oandaCandles(instrument, "H1", 24);
  const series = { at: Date.now(), points: hourly, ago: hourly[0] ?? 0, period: null, offset: 0 };
  seriesCache.set(key, series);
  return series;
}

async function oandaLive(instrument: string): Promise<number> {
  const account = process.env.OANDA_ACCOUNT_ID;
  if (account) {
    const data = await oandaGet(`/v3/accounts/${account}/pricing?instruments=${instrument}`);
    const row = data?.prices?.[0];
    const bid = Number(row?.bids?.[0]?.price);
    const ask = Number(row?.asks?.[0]?.price);
    if (Number.isFinite(bid) && Number.isFinite(ask)) return (bid + ask) / 2;
  }
  const candles = await oandaCandles(instrument, "M1", 1);
  return candles[candles.length - 1];
}

async function oandaCandles(instrument: string, granularity: string, count: number): Promise<number[]> {
  const data = await oandaGet(
    `/v3/instruments/${instrument}/candles?price=M&granularity=${granularity}&count=${count}`,
  );
  const points = (data?.candles ?? [])
    .map((candle: { mid?: { c?: string } }) => Number(candle?.mid?.c))
    .filter((value: number) => Number.isFinite(value));
  if (points.length < 1) throw new Error("oanda candles");
  return points;
}

async function oandaGet(path: string) {
  const host = process.env.OANDA_ENV === "live" ? "https://api-fxtrade.oanda.com" : "https://api-fxpractice.oanda.com";
  const response = await fetch(`${host}${path}`, {
    headers: { Authorization: `Bearer ${process.env.OANDA_API_KEY}`, Accept: "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error(`oanda ${response.status}`);
  return response.json();
}

const resolvedSymbol = new Map<string, string>();

async function firstYahooSymbol(symbols: string[]): Promise<string> {
  const key = symbols.join(",");
  const cached = resolvedSymbol.get(key);
  if (cached) return cached;
  let lastError: unknown;
  for (const symbol of symbols) {
    try {
      await yahooChart(symbol, "5d", "1d");
      resolvedSymbol.set(key, symbol);
      return symbol;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("symbol");
}

async function yahooChart(symbol: string, range: string, interval: string): Promise<YahooChart> {
  const hosts = ["query1", "query2"];
  let lastError: unknown;
  for (const host of hosts) {
    try {
      const url = `https://${host}.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}`;
      const data = await getJson(url, { "User-Agent": UA, Accept: "application/json" });
      const result = data?.chart?.result?.[0];
      if (result?.meta && Number.isFinite(Number(result.meta.regularMarketPrice))) return result;
      lastError = new Error("yahoo empty");
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("yahoo");
}

async function getJson(url: string, headers: Record<string, string> = { Accept: "application/json" }) {
  const response = await fetch(url, { headers, cache: "no-store", signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  return response.json();
}

type YahooClose = number | null;
type YahooChart = {
  timestamp?: number[];
  indicators?: { quote?: Array<{ close?: YahooClose[] }> };
  meta?: {
    regularMarketPrice?: number;
    previousClose?: number;
    chartPreviousClose?: number;
    gmtoffset?: number;
    currentTradingPeriod?: { regular?: Period };
  };
};

function closes(chart: YahooChart): number[] {
  const times = chart.timestamp ?? [];
  const values = chart.indicators?.quote?.[0]?.close ?? [];
  const points: number[] = [];
  for (let index = 0; index < times.length; index += 1) {
    const value = values[index];
    if (typeof value === "number" && Number.isFinite(value)) points.push(value);
  }
  return points;
}

function since(chart: YahooChart, fromMs: number): number[] {
  const times = chart.timestamp ?? [];
  const values = chart.indicators?.quote?.[0]?.close ?? [];
  const points: number[] = [];
  for (let index = 0; index < times.length; index += 1) {
    const value = values[index];
    if (times[index] * 1000 >= fromMs && typeof value === "number" && Number.isFinite(value)) points.push(value);
  }
  return points;
}

function priceNear(chart: YahooChart, atMs: number): number | null {
  const times = chart.timestamp ?? [];
  const values = chart.indicators?.quote?.[0]?.close ?? [];
  let best: number | null = null;
  let bestGap = Number.POSITIVE_INFINITY;
  for (let index = 0; index < times.length; index += 1) {
    const value = values[index];
    if (typeof value !== "number") continue;
    const gap = Math.abs(times[index] * 1000 - atMs);
    if (gap < bestGap) {
      bestGap = gap;
      best = value;
    }
  }
  return best;
}

function takeLast(values: number[], count: number): number[] {
  return values.slice(-count);
}

function metaPrevious(chart: YahooChart): number | null {
  const value = Number(chart.meta?.previousClose ?? chart.meta?.chartPreviousClose);
  return Number.isFinite(value) ? value : null;
}

function periodOf(chart: YahooChart): Period | null {
  const regular = chart.meta?.currentTradingPeriod?.regular;
  if (!regular || !Number.isFinite(regular.start) || !Number.isFinite(regular.end)) return null;
  return { start: regular.start, end: regular.end };
}

function offsetOf(chart: YahooChart): number {
  const offset = Number(chart.meta?.gmtoffset);
  return Number.isFinite(offset) ? offset : -18000;
}

function sessionState(id: SignalMarket, nowMs: number, period: Period | null, offset: number) {
  if (id === "crypto") return { closed: false, opensIn: null };
  const nowSec = nowMs / 1000;
  if (FX.has(id)) {
    if (fxOpen(nowMs)) return { closed: false, opensIn: null };
    return { closed: true, opensIn: formatWait(nextFxOpen(nowMs) - nowMs) };
  }
  if (period && nowSec >= period.start && nowSec < period.end) return { closed: false, opensIn: null };
  if (period && nowSec < period.start && period.start * 1000 - nowMs < 4 * 24 * 60 * 60 * 1000) {
    return { closed: true, opensIn: formatWait(period.start * 1000 - nowMs) };
  }
  if (id === "oil") {
    if (oilOpen(nowMs)) return { closed: false, opensIn: null };
    return { closed: true, opensIn: formatWait(nextOilOpen(nowMs) - nowMs) };
  }
  if (usCashOpen(nowMs, offset)) return { closed: false, opensIn: null };
  return { closed: true, opensIn: formatWait(nextUsOpen(nowMs, offset) - nowMs) };
}

function fxOpen(nowMs: number): boolean {
  const date = new Date(nowMs);
  const day = date.getUTCDay();
  const hour = date.getUTCHours();
  if (day === 6) return false;
  if (day === 0 && hour < 22) return false;
  if (day === 5 && hour >= 22) return false;
  return true;
}

function nextFxOpen(nowMs: number): number {
  const date = new Date(nowMs);
  const day = date.getUTCDay();
  const result = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 22, 0, 0));
  const add = day === 0 ? 0 : day === 6 ? 1 : 7 - day;
  result.setUTCDate(result.getUTCDate() + add);
  if (result.getTime() <= nowMs) result.setUTCDate(result.getUTCDate() + 7);
  return result.getTime();
}

function oilOpen(nowMs: number): boolean {
  const date = new Date(nowMs);
  const day = date.getUTCDay();
  const hour = date.getUTCHours();
  if (day === 6) return false;
  if (day === 0 && hour < 23) return false;
  if (day === 5 && hour >= 22) return false;
  return true;
}

function nextOilOpen(nowMs: number): number {
  const date = new Date(nowMs);
  const result = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 0, 0));
  const day = date.getUTCDay();
  const add = day === 0 ? 0 : day === 6 ? 1 : 7 - day;
  result.setUTCDate(result.getUTCDate() + add);
  if (result.getTime() <= nowMs) result.setUTCDate(result.getUTCDate() + 7);
  return result.getTime();
}

function usCashOpen(nowMs: number, offsetSec: number): boolean {
  const local = new Date(nowMs + offsetSec * 1000);
  const day = local.getUTCDay();
  if (day === 0 || day === 6) return false;
  const minutes = local.getUTCHours() * 60 + local.getUTCMinutes();
  return minutes >= 9 * 60 + 30 && minutes < 16 * 60;
}

function nextUsOpen(nowMs: number, offsetSec: number): number {
  const local = new Date(nowMs + offsetSec * 1000);
  for (let add = 0; add < 8; add += 1) {
    const day = new Date(local.getTime() + add * 24 * 60 * 60 * 1000);
    const weekday = day.getUTCDay();
    if (weekday === 0 || weekday === 6) continue;
    const openLocal = Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), 9, 30, 0);
    const openUtc = openLocal - offsetSec * 1000;
    if (openUtc > nowMs) return openUtc;
  }
  return nowMs + 24 * 60 * 60 * 1000;
}

function formatWait(ms: number): string {
  const hours = Math.max(1, Math.round(ms / (60 * 60 * 1000)));
  if (hours < 48) return `${hours}h`;
  return `${Math.max(1, Math.round(hours / 24))}d`;
}

function mockQuotes(now: number): PricePayload["quotes"] {
  const quotes: PricePayload["quotes"] = {};
  (Object.keys(MOCK_BASE) as SignalMarket[]).forEach((id, index) => {
    const count = id === "gold" ? 30 : 24;
    const base = MOCK_BASE[id];
    const points: number[] = [];
    for (let step = 0; step < count; step += 1) {
      points.push(base * (1 + Math.sin(step / 3 + index) * 0.012));
    }
    const price = base * (1 + Math.sin(now / 60000 + index) * 0.0015);
    points[points.length - 1] = price;
    const ago = points[0];
    const session = sessionState(id, now, null, -18000);
    quotes[id] = {
      price,
      changePct: ((price - ago) / ago) * 100,
      points,
      closed: session.closed,
      opensIn: session.opensIn,
      delayed: false,
    };
  });
  return quotes;
}
