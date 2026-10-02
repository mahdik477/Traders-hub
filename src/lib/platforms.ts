// Reference info for trading platforms mentioned on course/firm pages — one
// shared lookup so every listing gets the same description and a link to
// the platform's own site, instead of repeating this in every data file.
// A platform name not listed here just renders as a plain pill, no popover.

export type PlatformInfo = { description: string; url: string };

export const PLATFORMS: Record<string, PlatformInfo> = {
  "MetaTrader 4": {
    description:
      "A widely used desktop and mobile platform for forex and CFD trading, known for its charting tools and automated trading (Expert Advisors).",
    url: "https://www.metatrader4.com/",
  },
  "MetaTrader 5": {
    description:
      "MetaQuotes' successor to MetaTrader 4, adding more order types, timeframes and asset classes alongside automated trading support.",
    url: "https://www.metatrader5.com/",
  },
  eSignal: {
    description:
      "A professional market data and charting platform popular with active traders for its real-time feeds and technical analysis tools.",
    url: "https://www.esignal.com/",
  },
  NinjaTrader: {
    description:
      "A platform popular for futures and forex trading, offering advanced charting, strategy backtesting and automated trading.",
    url: "https://ninjatrader.com/",
  },
  TradingView: {
    description:
      "A browser-based charting and social trading platform, popular for its large community of traders sharing ideas and scripts.",
    url: "https://www.tradingview.com/",
  },
  thinkorswim: {
    description:
      "Charles Schwab's trading platform for self-directed stock, options and futures traders, with advanced charting and paper trading.",
    url: "https://www.schwab.com/trading/thinkorswim",
  },
  "Interactive Brokers": {
    description:
      "A large global brokerage offering direct market access across stocks, options, futures and more, popular with active traders.",
    url: "https://www.interactivebrokers.com/",
  },
  TC2000: {
    description:
      "A charting and stock-screening platform popular with swing and technical traders, combining a built-in brokerage with pattern and scanner tools.",
    url: "https://www.tc2000.com/",
  },
};
