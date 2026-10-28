// A small built-in glossary for the strategies section. Beginners land on
// pages full of technical analysis jargon, so any prose rendered through
// GlossaryText (see InteractiveStrategyPage.tsx) gets scanned against this
// list and matching words get a hoverable/tappable definition — see
// GlossaryTerm.tsx for the actual tooltip widget.
//
// Deliberately excludes everyday trading words a beginner already meets
// elsewhere on the site (trend, buy/sell, candlestick, support/resistance)
// — this is for the harder acronyms and named concepts, not the basics.

export type GlossaryEntry = {
  /** Canonical name shown as the tooltip's heading. */
  term: string;
  definition: string;
  /** Literal strings to look for in prose (matched case-insensitively by
   *  default, whole-word/phrase only). Usually just [term], but some
   *  concepts are written more than one way (an acronym and its spelled-out
   *  form). */
  match: string[];
  /** Set true for a plain English word that only means this concept when
   *  capitalised a specific way (e.g. "Spring" the Wyckoff term vs. "a
   *  coiled spring" the metaphor) — avoids tooltip-ing the ordinary word. */
  caseSensitive?: boolean;
};

export const GLOSSARY: GlossaryEntry[] = [
  {
    term: "RSI",
    definition:
      "A 0–100 momentum gauge. High readings (often above 70) suggest a market has moved up a lot recently; low readings (often below 30) suggest the opposite. On its own it doesn't predict direction — it just measures how far and fast price has moved.",
    match: ["RSI", "Relative Strength Index"],
  },
  {
    term: "MACD",
    definition:
      "Moving Average Convergence/Divergence. Two moving averages of price plotted as a difference, plus a slower \"signal line\" of that difference — traders watch the gap between the two for momentum and timing cues.",
    match: ["MACD"],
  },
  {
    term: "CCI",
    definition:
      "Commodity Channel Index — an oscillator that measures how far price has moved from its recent average, scaled so most readings fall between about -100 and +100. Used similarly to RSI, despite the \"commodity\" in the name — it works on any market.",
    match: ["CCI", "Commodity Channel Index"],
  },
  {
    term: "ADX",
    definition:
      "Average Directional Index — a 0–100 reading of how strongly a market is trending, regardless of direction. A rising ADX means the trend (up or down) is getting stronger; it says nothing about which way.",
    match: ["ADX", "Average Directional Index"],
  },
  {
    term: "DMI",
    definition:
      "Directional Movement Index — the pair of lines (+DI and -DI) that ADX is built from. They show whether buying or selling pressure currently has the upper hand.",
    match: ["DMI", "Directional Movement Index"],
  },
  {
    term: "ATR",
    definition:
      "Average True Range — the average size of a market's price swings over a recent period, in price units. It's a volatility measure, not a direction signal — often used to size stop-losses or position sizes.",
    match: ["ATR", "Average True Range"],
  },
  {
    term: "Bollinger Bands",
    definition:
      "A moving average with two bands plotted a set number of standard deviations above and below it. The bands widen when the market gets more volatile and narrow when it calms down.",
    match: ["Bollinger Band", "Bollinger Bands"],
  },
  {
    term: "Keltner Channel",
    definition:
      "Similar to Bollinger Bands, but the bands are set a multiple of ATR away from a moving average instead of standard deviations — a smoother volatility envelope.",
    match: ["Keltner Channel", "Keltner Channels"],
  },
  {
    term: "Moving average",
    definition:
      "The average price over a fixed number of past periods, recalculated as each new period closes. It smooths out noise so the underlying direction is easier to see.",
    match: ["moving average", "moving averages"],
  },
  {
    term: "SMA",
    definition: "Simple Moving Average — a moving average that weights every period in its window equally.",
    match: ["SMA", "Simple Moving Average"],
  },
  {
    term: "EMA",
    definition:
      "Exponential Moving Average — a moving average that weights recent periods more heavily than older ones, so it reacts to new price moves faster than a simple moving average.",
    match: ["EMA", "Exponential Moving Average"],
  },
  {
    term: "VWAP",
    definition:
      "Volume-Weighted Average Price — the average price a market has traded at, weighted by how much volume traded at each price. It's effectively \"the average price actually paid\", not just the average of the price line.",
    match: ["VWAP"],
  },
  {
    term: "OBV",
    definition:
      "On-Balance Volume — a running total that adds a bar's volume on an up day and subtracts it on a down day, meant to show whether volume is backing the recent price move.",
    match: ["OBV", "On-Balance Volume"],
  },
  {
    term: "Ichimoku",
    definition:
      "Ichimoku Kinko Hyo — a Japanese charting system that plots several lines, including a shaded \"cloud\", built from recent highs and lows, meant to show trend, support/resistance and momentum at a glance.",
    match: ["Ichimoku"],
  },
  {
    term: "Tenkan-sen",
    definition: "Ichimoku's faster line — the midpoint of the highest high and lowest low over a short lookback (9 periods by default).",
    match: ["Tenkan-sen", "Tenkan sen", "Tenkan"],
  },
  {
    term: "Kijun-sen",
    definition: "Ichimoku's slower line — the midpoint of the highest high and lowest low over a longer lookback (26 periods by default).",
    match: ["Kijun-sen", "Kijun sen", "Kijun"],
  },
  {
    term: "Senkou Span",
    definition:
      "Ichimoku's two \"leading span\" lines, which together form the shaded cloud — plotted ahead of price to show where future support/resistance may sit.",
    match: ["Senkou Span", "Senkou"],
  },
  {
    term: "Parabolic SAR",
    definition:
      "A dot that trails above or below price, flipping sides when the trend reverses. \"SAR\" stands for stop and reverse — it's designed to mark a trailing exit point.",
    match: ["Parabolic SAR"],
  },
  {
    term: "Supertrend",
    definition:
      "An indicator built from ATR that plots a single line above or below price, flipping sides (and usually changing colour) when the trend direction changes.",
    match: ["Supertrend"],
  },
  {
    term: "Heikin-Ashi",
    definition:
      "A candlestick style that averages each candle's prices with the previous one, producing smoother-looking candles that make trends easier to read — at the cost of hiding some real price detail.",
    match: ["Heikin-Ashi", "Heikin Ashi"],
  },
  {
    term: "Donchian Channel",
    definition:
      "A channel drawn from the highest high and lowest low over a set number of periods — the basis of \"buy the N-period high, sell the N-period low\" breakout systems like the original Turtle Traders used.",
    match: ["Donchian Channel", "Donchian"],
  },
  {
    term: "Pivot points",
    definition:
      "A set of price levels calculated from the previous period's high, low and close, used as reference support/resistance levels for the current period.",
    match: ["pivot point", "pivot points"],
  },
  {
    term: "Fibonacci retracement",
    definition:
      "Horizontal lines drawn at specific percentages (like 38.2%, 50%, 61.8%) between a recent high and low, based on the Fibonacci number sequence, used as possible support/resistance levels during a pullback.",
    match: ["Fibonacci retracement", "Fibonacci retracements"],
  },
  {
    term: "Fibonacci extension",
    definition:
      "Like a Fibonacci retracement, but the percentage levels project beyond the original high/low — used as possible price targets once a move continues past it.",
    match: ["Fibonacci extension", "Fibonacci extensions"],
  },
  {
    term: "Golden ratio",
    definition:
      "The number 0.618 (and its relatives 1.618, 0.382 and so on) that the Fibonacci number sequence converges toward — the basis for the specific percentages used in Fibonacci retracements, extensions and harmonic patterns.",
    match: ["golden ratio"],
  },
  {
    term: "Elliott Wave theory",
    definition:
      "A framework that reads price as five waves in the direction of the trend, followed by three corrective waves, repeated at different scales — a way of labelling market structure, not a mechanical signal.",
    match: ["Elliott Wave"],
  },
  {
    term: "Gann angle",
    definition:
      "A diagonal line drawn from a significant price point at a fixed rate of price change over time, used by Gann-method traders as a kind of diagonal support/resistance line.",
    match: ["Gann angle", "Gann angles"],
  },
  {
    term: "Square of Nine",
    definition:
      "A Gann-method tool that arranges numbers in a spiral grid, used to find price and time levels believed to carry extra significance — one of the more esoteric corners of technical analysis.",
    match: ["Square of Nine"],
  },
  {
    term: "Gartley pattern",
    definition:
      "A specific five-point price pattern (labelled X-A-B-C-D) where each leg retraces a defined Fibonacci percentage of the one before it — one of the most common harmonic patterns.",
    match: ["Gartley pattern", "Gartley"],
  },
  {
    term: "Harmonic pattern",
    definition:
      "A family of price patterns (Gartley, Bat, Butterfly, Crab and others) built from a sequence of swings that match specific Fibonacci ratios to each other.",
    match: ["harmonic pattern", "harmonic patterns"],
  },
  {
    term: "XABCD",
    definition: "The five labelled points (X, A, B, C, D) that a harmonic pattern is measured and described by.",
    match: ["XABCD"],
  },
  {
    term: "Potential Reversal Zone",
    definition:
      "In harmonic pattern trading, the price zone where a pattern's final point (D) is expected to complete and the market is expected to turn — often shortened to PRZ.",
    match: ["Potential Reversal Zone", "PRZ"],
  },
  {
    term: "Renko chart",
    definition:
      "A chart made of uniform \"bricks\" that only appear once price moves a fixed amount, ignoring time entirely — designed to filter out small back-and-forth noise.",
    match: ["Renko chart", "Renko charts", "Renko"],
  },
  {
    term: "Kagi chart",
    definition:
      "A chart made of a single line that only reverses direction once price moves a set amount against it, ignoring time — similar in spirit to Renko and Point-and-Figure.",
    match: ["Kagi chart", "Kagi charts", "Kagi"],
  },
  {
    term: "Point-and-Figure chart",
    definition:
      "A chart made of columns of X's and O's that only change when price moves a set amount, with no time axis at all — one of the oldest \"noise-filtering\" chart styles.",
    match: ["Point-and-Figure", "Point and Figure"],
  },
  {
    term: "Market Profile",
    definition:
      "A way of charting that groups trading activity by price level instead of by time, built on the idea that markets are an ongoing auction between buyers and sellers.",
    match: ["Market Profile"],
  },
  {
    term: "Volume Profile",
    definition:
      "A sideways histogram showing how much trading volume happened at each price level over a chosen period — not over time, over price.",
    match: ["Volume Profile"],
  },
  {
    term: "Auction market theory",
    definition:
      "The idea underlying Market Profile — that a market is a continuous two-way auction, constantly searching for the price where buyers and sellers are both willing to trade.",
    match: ["auction market theory"],
  },
  {
    term: "Point of Control",
    definition: "The single price level where the most volume traded during the period being measured — the \"busiest\" price on a volume or market profile.",
    match: ["Point of Control", "POC"],
  },
  {
    term: "Value Area",
    definition:
      "The price range (around the Point of Control) where a set percentage of a period's volume — commonly 70% — actually traded.",
    match: ["Value Area"],
  },
  {
    term: "High Volume Node",
    definition:
      "A price level on a volume profile where an unusually large amount of trading happened — often acts like a magnet or support/resistance.",
    match: ["High Volume Node", "HVN"],
  },
  {
    term: "Low Volume Node",
    definition:
      "A price level on a volume profile where very little trading happened — price tends to move through these quickly rather than stalling there.",
    match: ["Low Volume Node", "LVN"],
  },
  {
    term: "Order flow",
    definition:
      "Looking directly at individual buy and sell orders (or aggregated versions of them) rather than just the price chart, to see who's actually in control moment to moment.",
    match: ["order flow"],
  },
  {
    term: "Footprint chart",
    definition:
      "A chart that shows the volume traded at each price within every single bar, not just the bar's open/high/low/close — a detailed view of order flow.",
    match: ["footprint chart", "footprint charts", "footprint"],
  },
  {
    term: "Delta (order flow)",
    definition:
      "The difference between volume traded on the buy side and volume traded on the sell side, over a bar or as a running total — used as a read on who's more aggressive.",
    match: ["delta"],
  },
  {
    term: "Cumulative delta",
    definition:
      "A running total of order-flow delta over many bars, rather than just one — used to see whether buying or selling pressure has been building over a longer stretch.",
    match: ["cumulative delta"],
  },
  {
    term: "Absorption",
    definition:
      "When a large amount of buying or selling hits the market but price barely moves — read as the opposite side quietly \"absorbing\" the pressure without giving ground.",
    match: ["absorption"],
  },
  {
    term: "Wyckoff Method",
    definition:
      "A century-old framework for reading accumulation and distribution — the idea that large players quietly build or unload positions in a range before a trend starts, leaving clues in price and volume.",
    match: ["Wyckoff Method", "Wyckoff"],
  },
  {
    term: "Spring (Wyckoff)",
    definition:
      "A brief, sharp break below a trading range that quickly reverses back inside it — read as a shakeout that traps sellers before a move up.",
    match: ["Spring"],
    // Plain "spring" is also used as an ordinary word elsewhere (e.g. a
    // "coiled spring" volatility metaphor) — only the capitalised Wyckoff
    // term should get this definition.
    caseSensitive: true,
  },
  {
    term: "Upthrust",
    definition: "The bearish mirror of a spring — a brief break above a trading range that quickly reverses back inside it, trapping buyers before a move down.",
    match: ["upthrust"],
  },
  {
    term: "Accumulation",
    definition:
      "A period where a market trades sideways while, in Wyckoff-style reading, larger players are believed to be building a position before an eventual move up.",
    match: ["accumulation"],
  },
  {
    term: "Distribution",
    definition: "The mirror of accumulation — a sideways period read as larger players unloading a position before an eventual move down.",
    match: ["distribution"],
  },
  {
    term: "Volume Spread Analysis",
    definition:
      "A method (often shortened to VSA) that reads each candle's spread — its high-to-low range — together with its volume, to judge whether a move is backed by real buying/selling pressure or likely to fail.",
    match: ["Volume Spread Analysis", "VSA"],
  },
  {
    term: "Divergence",
    definition:
      "When price and an indicator disagree — for example price makes a new low but the indicator doesn't — often read as a sign the current move is losing strength.",
    match: ["divergence", "divergences"],
  },
  {
    term: "Overbought / oversold",
    definition:
      "Loose terms for \"an indicator reading suggests the market has moved unusually far, recently\" — overbought on the way up, oversold on the way down. It is not the same as \"about to reverse\".",
    match: ["overbought", "oversold"],
  },
  {
    term: "Crossover",
    definition: "When one line (often a moving average or oscillator) crosses above or below another — a common, simple trigger for entry or exit signals.",
    match: ["crossover", "crossovers"],
  },
  {
    term: "Breakout",
    definition: "When price moves decisively outside a prior range, level or pattern — the bet is that the move continues rather than snapping back.",
    match: ["breakout", "breakouts"],
  },
  {
    term: "Whipsaw",
    definition:
      "A false signal that reverses almost immediately — the market breaks a level or triggers a crossover, then snaps straight back, stopping out anyone who acted on it.",
    match: ["whipsaw", "whipsaws"],
  },
  {
    term: "Consolidation",
    definition: "A period where price moves sideways in a relatively tight range, instead of trending — often seen as the market \"resting\" between bigger moves.",
    match: ["consolidation"],
  },
  {
    term: "Liquidity",
    definition: "How easily an asset can be bought or sold without moving its price much. High liquidity means lots of buyers and sellers close to the current price.",
    match: ["liquidity"],
  },
  {
    term: "Liquidity sweep",
    definition:
      "A quick move that pushes price just past an obvious high or low (where stop-losses are expected to sit) before reversing — read as a deliberate grab for the orders sitting there.",
    match: ["liquidity sweep", "liquidity sweeps"],
  },
  {
    term: "Slippage",
    definition:
      "The difference between the price you expected to get on a trade and the price you actually got, usually because the market moved or there wasn't enough volume at your price.",
    match: ["slippage"],
  },
  {
    term: "Drawdown",
    definition: "How far an account (or strategy) has fallen from a previous peak, usually shown as a percentage — a core measure of how painful a losing streak can get.",
    match: ["drawdown", "drawdowns"],
  },
  {
    term: "Cointegration",
    definition:
      "A statistical relationship where two price series tend to drift back toward each other over time, even if each one wanders a lot on its own — the basis of many pairs-trading strategies.",
    match: ["cointegration", "cointegrated"],
  },
  {
    term: "Z-score",
    definition:
      "A way of expressing how far a value is from its average, in standard deviations — used in mean-reversion strategies to judge how \"stretched\" something currently is.",
    match: ["z-score", "z score"],
  },
  {
    term: "Pip",
    definition: "The smallest standard price move quoted in most forex pairs — usually the fourth decimal place (or second, for pairs involving the Japanese yen).",
    match: ["pip", "pips"],
  },
  {
    term: "Leverage",
    definition: "Trading with borrowed exposure so a given amount of capital controls a larger position — it magnifies both gains and losses.",
    match: ["leverage", "leveraged"],
  },
  {
    term: "Correlation",
    definition:
      "A measure of how closely two things move together, from -1 (always opposite) to +1 (always the same direction). High correlation doesn't mean one causes the other.",
    match: ["correlation", "correlated"],
  },
  {
    term: "Standard deviation",
    definition: "A statistical measure of how spread out a set of values is around its average — a common way to quantify volatility.",
    match: ["standard deviation", "standard deviations"],
  },
  {
    term: "Backtest",
    definition:
      "Running a trading rule against historical data to see how it would have performed — useful as a sanity check, but it can't prove a strategy will work going forward.",
    match: ["backtest", "backtests", "backtesting", "backtested"],
  },
  {
    term: "Overfitting",
    definition:
      "Tuning a strategy's rules so closely to past data that it matches historical noise rather than a real, repeatable edge — it tends to look great in a backtest and fail in live trading.",
    match: ["overfitting", "overfit", "curve fitting"],
  },
  {
    term: "Stop-loss",
    definition: "A standing order to close a losing position automatically once price hits a chosen level, meant to cap how much a single trade can lose.",
    match: ["stop-loss", "stop loss"],
  },
  {
    term: "Mean reversion",
    definition:
      "The idea that a price (or the gap between two prices) that has moved unusually far from its average tends to drift back toward it — the opposite assumption to trend-following.",
    match: ["mean reversion", "mean-reverting", "mean reverting"],
  },
  {
    term: "Order block",
    definition:
      "In ICT/smart money terminology, a candle or cluster of candles just before a strong move, read as the footprint of a large player's order and treated as a likely support/resistance zone later.",
    match: ["order block", "order blocks"],
  },
  {
    term: "Fair value gap",
    definition:
      "A gap left in the price range of three consecutive candles, where the middle candle's range doesn't overlap with the first and third — treated as an imbalance price may later return to fill.",
    match: ["fair value gap", "fair value gaps"],
  },
  {
    term: "Imbalance",
    definition:
      "A stretch of price where buying or selling was so one-sided that normal two-way trading didn't really happen — often shows up as a gap or a fair value gap.",
    match: ["imbalance", "imbalances"],
  },
  {
    term: "Inside bar",
    definition: "A candle whose entire range (high and low) sits inside the previous candle's range — often read as a pause or a coiling-up before the next move.",
    match: ["inside bar", "inside bars"],
  },
  {
    term: "Gap",
    definition: "A jump between one candle's close and the next candle's open, leaving a visible empty space on the chart where no trading happened.",
    match: ["price gap", "gap up", "gap down"],
  },
  {
    term: "Doji",
    definition: "A candle where the open and close are at (or very near) the same price, leaving little or no \"body\" — often read as indecision between buyers and sellers.",
    match: ["doji"],
  },
  {
    term: "Engulfing pattern",
    definition: "A two-candle pattern where the second candle's body completely covers the first candle's body — read as a sudden swing in control from one side to the other.",
    match: ["engulfing"],
  },
  {
    term: "Wick",
    definition: "The thin line above or below a candle's body, showing the high and low that were touched but not held by the close.",
    match: ["wick", "wicks"],
  },
  {
    term: "Trendline",
    definition: "A straight line drawn across a series of swing highs or swing lows, used as a simple, visual support/resistance line that follows the trend.",
    match: ["trendline", "trendlines", "trend line", "trend lines"],
  },
  {
    term: "Channel",
    definition: "Two parallel trendlines — one along the highs, one along the lows — that price has been bouncing between.",
    match: ["price channel", "trading channel"],
  },
  {
    term: "Momentum",
    definition: "How fast and strongly price is moving in its current direction — not the same as trend, which is about direction; momentum is about speed.",
    match: ["momentum"],
  },
  {
    term: "Volatility",
    definition: "How much and how fast a price moves around, regardless of direction. Higher volatility means bigger, faster swings.",
    match: ["volatility", "volatile"],
  },
  {
    term: "Timeframe",
    definition: "The period each candle or bar on a chart represents — a \"1-hour chart\" has one candle per hour, a \"daily chart\" one candle per day.",
    match: ["timeframe", "timeframes", "time frame", "time frames"],
  },
  {
    term: "Multi-timeframe analysis",
    definition: "Checking more than one timeframe before trading — commonly a bigger-picture chart for direction and a smaller one for timing the entry.",
    match: ["multi-timeframe", "multi timeframe"],
  },
  {
    term: "Relative strength",
    definition:
      "Comparing how one asset is performing against another (or against a benchmark), to see which is currently \"stronger\" — rather than looking at either in isolation.",
    match: ["relative strength"],
  },
  {
    term: "Swing high / swing low",
    definition:
      "A swing high is a local peak with lower prices on both sides of it; a swing low is a local trough with higher prices on both sides. These are the basic building blocks most chart patterns are described with.",
    match: ["swing high", "swing highs", "swing low", "swing lows"],
  },
  {
    term: "Equity curve",
    definition: "A line chart of an account's balance over time — the main way traders visualise whether a strategy is actually making or losing money over a stretch of trades.",
    match: ["equity curve"],
  },
  {
    term: "Position sizing",
    definition: "Deciding how much to risk on a single trade — usually a small, fixed percentage of account capital, rather than a fixed number of shares/contracts/lots.",
    match: ["position sizing", "position size"],
  },
  {
    term: "Risk-reward ratio",
    definition:
      "How much a trade stands to make if it works out, compared with how much it stands to lose if the stop-loss is hit — e.g. a 1:3 ratio risks $1 to potentially make $3.",
    match: ["risk-reward", "risk/reward", "risk reward"],
  },
  {
    term: "Carry trade",
    definition:
      "Borrowing (or going short) in a low-interest-rate currency to fund holding a higher-interest-rate one, aiming to profit from the interest-rate gap as well as any price move.",
    match: ["carry trade", "carry trades"],
  },
  {
    term: "Arbitrage",
    definition: "Trying to profit from a price difference for the same (or a very closely related) asset in two places at once, with little or no directional risk.",
    match: ["arbitrage"],
  },
  {
    term: "Pairs trading",
    definition:
      "Trading the price gap between two historically correlated assets — buying the one that's lagged and shorting the one that's run ahead — betting the gap closes back up. Also called statistical arbitrage.",
    match: ["pairs trading", "statistical arbitrage"],
  },
  {
    term: "Intermarket analysis",
    definition: "Looking at how different markets (stocks, bonds, commodities, currencies) move relative to each other, on the idea that they influence and confirm one another.",
    match: ["intermarket analysis", "intermarket"],
  },
  {
    term: "Hurst cycles / dominant cycle",
    definition:
      "An approach that looks for a repeating rhythm (a \"dominant cycle\") in how often a market's swings tend to form, then uses that rhythm to anticipate roughly when the next one is due.",
    match: ["Hurst cycle", "Hurst cycles", "dominant cycle"],
  },
  {
    term: "Confluence",
    definition: "When several separate signals or levels line up at roughly the same price or time — treated as a stronger case than any single signal alone.",
    match: ["confluence"],
  },
  {
    term: "Smart money concepts",
    definition:
      "A cluster of related ideas (order blocks, liquidity sweeps, fair value gaps and similar) built around trying to read where large, well-informed participants are likely positioned. Often shortened to ICT or SMC.",
    match: ["smart money concepts", "smart money"],
  },
  {
    term: "TTM Squeeze",
    definition: "A setup where Bollinger Bands tuck inside a Keltner Channel, read as volatility compressing before an eventual breakout in either direction.",
    match: ["TTM Squeeze"],
  },
  {
    term: "Connors RSI-2",
    definition:
      "A short-term mean-reversion system built around a 2-period RSI with very extreme thresholds (commonly below 10 or above 90), designed to catch sharp, short pullbacks rather than slow overbought/oversold swings.",
    match: ["Connors RSI", "RSI-2"],
  },
  {
    term: "Elder Triple Screen",
    definition:
      "A method, from trader Alexander Elder, that checks three different timeframes before a trade: a longer one for trend direction, a medium one for a pullback/oscillator reading, and a short one for the actual entry trigger.",
    match: ["Triple Screen"],
  },
  {
    term: "Time-series momentum",
    definition:
      "A trend-following approach that looks only at an asset's own past returns (not other assets), going long when recent returns are positive and short when they're negative.",
    match: ["time-series momentum", "time series momentum"],
  },
  {
    term: "Turtle Trading",
    definition:
      "A famous 1980s trend-following system built around Donchian Channel breakouts and strict, pre-defined position sizing — one of the first systematic approaches made widely public.",
    match: ["Turtle Trading", "Turtle Traders"],
  },
];

export type GlossarySegment = { text: string; entry?: GlossaryEntry };

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

type Compiled = {
  ci: RegExp | null;
  cs: RegExp | null;
  ciLookup: Map<string, GlossaryEntry>;
  csLookup: Map<string, GlossaryEntry>;
};

let compiled: Compiled | null = null;

function compile(): Compiled {
  if (compiled) return compiled;
  const ciLookup = new Map<string, GlossaryEntry>();
  const csLookup = new Map<string, GlossaryEntry>();
  const ciPatterns: string[] = [];
  const csPatterns: string[] = [];
  for (const entry of GLOSSARY) {
    for (const m of entry.match) {
      if (entry.caseSensitive) {
        csLookup.set(m, entry);
        csPatterns.push(m);
      } else {
        ciLookup.set(m.toLowerCase(), entry);
        ciPatterns.push(m);
      }
    }
  }
  // Longest-first so overlapping phrases (e.g. "fair value gap" vs a
  // shorter overlapping match) prefer the longer, more specific one.
  ciPatterns.sort((a, b) => b.length - a.length);
  csPatterns.sort((a, b) => b.length - a.length);
  const ci = ciPatterns.length ? new RegExp(`\\b(?:${ciPatterns.map(escapeRegExp).join("|")})\\b`, "gi") : null;
  const cs = csPatterns.length ? new RegExp(`\\b(?:${csPatterns.map(escapeRegExp).join("|")})\\b`, "g") : null;
  compiled = { ci, cs, ciLookup, csLookup };
  return compiled;
}

/** Splits prose into plain-text and glossary-term segments. Matches are
 *  whole-word/phrase only, case-insensitive unless an entry opts into exact
 *  casing, and non-overlapping — when two candidate matches overlap, the
 *  one that starts first (and is longest at that start) wins. */
export function matchGlossaryTerms(text: string): GlossarySegment[] {
  const { ci, cs, ciLookup, csLookup } = compile();
  const candidates: { start: number; end: number; entry: GlossaryEntry; text: string }[] = [];

  if (ci) {
    ci.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = ci.exec(text))) {
      const entry = ciLookup.get(m[0].toLowerCase());
      if (entry) candidates.push({ start: m.index, end: m.index + m[0].length, entry, text: m[0] });
      if (m[0].length === 0) ci.lastIndex++; // guard against zero-length matches
    }
  }
  if (cs) {
    cs.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = cs.exec(text))) {
      const entry = csLookup.get(m[0]);
      if (entry) candidates.push({ start: m.index, end: m.index + m[0].length, entry, text: m[0] });
      if (m[0].length === 0) cs.lastIndex++;
    }
  }

  // Sort by start ascending, then longest-at-that-start first, so the
  // accept loop below prefers the longer/more specific overlapping match.
  candidates.sort((a, b) => a.start - b.start || b.end - b.start - (a.end - a.start));

  const accepted: typeof candidates = [];
  let lastEnd = 0;
  for (const c of candidates) {
    if (c.start >= lastEnd) {
      accepted.push(c);
      lastEnd = c.end;
    }
  }

  if (accepted.length === 0) return [{ text }];

  const segments: GlossarySegment[] = [];
  let cursor = 0;
  for (const c of accepted) {
    if (c.start > cursor) segments.push({ text: text.slice(cursor, c.start) });
    segments.push({ text: c.text, entry: c.entry });
    cursor = c.end;
  }
  if (cursor < text.length) segments.push({ text: text.slice(cursor) });
  return segments;
}
