#!/usr/bin/env python3
"""Generates illustrative chart images for the Strategies section.

These are synthetic candlestick charts — fabricated OHLC data, never a real
market or a real historical trade — annotated to show what each strategy's
setup actually looks like. We generate these ourselves (rather than using
real screenshots) to avoid any copyright/hotlinking question and to keep a
consistent, on-brand look across all of them. Colours match the site's own
dark theme tokens (src/app/globals.css).

Run: python3 scripts/gen-strategy-charts.py
Output: public/strategies/<slug>.png
"""
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle, FancyArrowPatch
import os

# Site theme tokens (dark mode)
BG = "#101012"
PAGE_BG = "#070708"
BORDER = "#2a261f"
FG = "#f6f3ec"
MUTED = "#cfc6b8"
GOLD = "#e8c56a"
GOLD_BRIGHT = "#f5d76e"
SUCCESS = "#3dce86"
WARNING = "#e8a317"
DANGER = "#ef5b56"

OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "strategies")
os.makedirs(OUT_DIR, exist_ok=True)

rng = np.random.default_rng(42)


def synth_ohlc(n=80, start=100.0, drift=0.0, vol=1.2, seed=None):
    """Fabricated OHLC series — a simple random walk, never real market data."""
    r = np.random.default_rng(seed) if seed is not None else rng
    closes = [start]
    for _ in range(n - 1):
        closes.append(closes[-1] + r.normal(drift, vol))
    closes = np.array(closes)
    opens = np.concatenate([[closes[0]], closes[:-1]])
    highs = np.maximum(opens, closes) + np.abs(r.normal(0.4, 0.3, n))
    lows = np.minimum(opens, closes) - np.abs(r.normal(0.4, 0.3, n))
    return opens, highs, lows, closes


def new_fig(figsize=(12, 6.75)):
    fig, ax = plt.subplots(figsize=figsize, dpi=100)
    fig.patch.set_facecolor(PAGE_BG)
    ax.set_facecolor(BG)
    for spine in ax.spines.values():
        spine.set_color(BORDER)
    ax.tick_params(colors=MUTED, labelsize=9)
    ax.grid(True, color=BORDER, linewidth=0.5, alpha=0.5)
    return fig, ax


def plot_candles(ax, opens, highs, lows, closes, x=None):
    if x is None:
        x = np.arange(len(closes))
    for i in range(len(closes)):
        color = SUCCESS if closes[i] >= opens[i] else DANGER
        ax.plot([x[i], x[i]], [lows[i], highs[i]], color=color, linewidth=1, zorder=2)
        body_low, body_high = sorted([opens[i], closes[i]])
        height = max(body_high - body_low, 0.08)
        ax.add_patch(Rectangle((x[i] - 0.32, body_low), 0.64, height, facecolor=color, edgecolor=color, zorder=3))
    ax.set_xlim(-1, len(closes))


def finish(fig, ax, slug, caption_tag=True):
    ax.set_yticklabels([])
    ax.set_xticklabels([])
    if caption_tag:
        ax.text(
            0.99, 0.02, "Synthetic illustration — not real market data", transform=ax.transAxes,
            ha="right", va="bottom", fontsize=7.5, color=MUTED, alpha=0.85,
        )
    fig.tight_layout(pad=1.2)
    path = os.path.join(OUT_DIR, f"{slug}.png")
    fig.savefig(path, facecolor=fig.get_facecolor())
    plt.close(fig)
    print("wrote", path)


def ema(values, span):
    alpha = 2 / (span + 1)
    out = [values[0]]
    for v in values[1:]:
        out.append(alpha * v + (1 - alpha) * out[-1])
    return np.array(out)


# ---- Recipes, one per illustrated strategy ---------------------------------

def chart_ma_crossover():
    o, h, l, c = synth_ohlc(90, 100, drift=0.12, vol=1.1, seed=1)
    fig, ax = new_fig()
    plot_candles(ax, o, h, l, c)
    fast = ema(c, 9)
    slow = ema(c, 26)
    ax.plot(fast, color=GOLD_BRIGHT, linewidth=1.8, label="Fast MA")
    ax.plot(slow, color=GOLD, linewidth=1.8, label="Slow MA")
    cross = np.where(np.diff(np.sign(fast - slow)))[0]
    for i in cross:
        if i > 5:
            ax.annotate("Crossover", (i, fast[i]), color=FG, fontsize=9, xytext=(i, fast[i] + 6),
                        ha="center", arrowprops=dict(arrowstyle="->", color=MUTED))
    ax.legend(facecolor=BG, edgecolor=BORDER, labelcolor=FG, fontsize=9, loc="upper left")
    finish(fig, ax, "moving-average-crossover")


def chart_support_resistance():
    o, h, l, c = synth_ohlc(90, 100, drift=0.0, vol=1.3, seed=2)
    fig, ax = new_fig()
    plot_candles(ax, o, h, l, c)
    res = np.percentile(h, 90)
    sup = np.percentile(l, 10)
    ax.axhline(res, color=DANGER, linewidth=1.4, linestyle="--")
    ax.axhline(sup, color=SUCCESS, linewidth=1.4, linestyle="--")
    ax.text(2, res + 0.6, "Resistance", color=DANGER, fontsize=9)
    ax.text(2, sup - 1.4, "Support", color=SUCCESS, fontsize=9)
    finish(fig, ax, "support-and-resistance")


def chart_trendline():
    o, h, l, c = synth_ohlc(90, 100, drift=0.1, vol=1.0, seed=3)
    fig, ax = new_fig()
    plot_candles(ax, o, h, l, c)
    lows_idx = [8, 35, 60, 82]
    xs = np.array(lows_idx)
    ys = l[xs] - 0.6
    m, b = np.polyfit(xs, ys, 1)
    xline = np.linspace(0, 89, 100)
    ax.plot(xline, m * xline + b, color=GOLD_BRIGHT, linewidth=1.8)
    for x in xs:
        ax.scatter([x], [l[x] - 0.6], color=GOLD, zorder=4, s=22)
    finish(fig, ax, "trendline-trading")


def chart_rsi(slug, title):
    o, h, l, c = synth_ohlc(90, 100, drift=0.0, vol=1.3, seed=4)
    fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(12, 7.5), dpi=100, gridspec_kw={"height_ratios": [3, 1]}, sharex=True)
    fig.patch.set_facecolor(PAGE_BG)
    for ax in (ax1, ax2):
        ax.set_facecolor(BG)
        for spine in ax.spines.values():
            spine.set_color(BORDER)
        ax.tick_params(colors=MUTED, labelsize=9)
        ax.grid(True, color=BORDER, linewidth=0.5, alpha=0.5)
    plot_candles(ax1, o, h, l, c)
    # fabricated RSI-like oscillator
    delta = np.diff(c, prepend=c[0])
    gain = np.clip(delta, 0, None)
    loss = np.clip(-delta, 0, None)
    avg_gain = ema(gain, 14)
    avg_loss = ema(loss, 14) + 1e-6
    rsi = 100 - 100 / (1 + avg_gain / avg_loss)
    ax2.plot(rsi, color=GOLD_BRIGHT, linewidth=1.6)
    ax2.axhline(70, color=DANGER, linewidth=1, linestyle="--")
    ax2.axhline(30, color=SUCCESS, linewidth=1, linestyle="--")
    ax2.set_ylim(0, 100)
    ax1.set_yticklabels([]); ax1.set_xticklabels([])
    ax2.set_yticklabels([]); ax2.set_xticklabels([])
    ax2.text(0.01, 0.82, "RSI(14)", transform=ax2.transAxes, color=MUTED, fontsize=8)
    ax1.text(0.99, 0.03, "Synthetic illustration — not real market data", transform=ax1.transAxes,
              ha="right", va="bottom", fontsize=7.5, color=MUTED, alpha=0.85)
    fig.tight_layout(pad=1.2)
    path = os.path.join(OUT_DIR, f"{slug}.png")
    fig.savefig(path, facecolor=fig.get_facecolor())
    plt.close(fig)
    print("wrote", path)


def chart_macd():
    chart_rsi("macd-signal-line-crossover", "MACD")  # reuse oscillator-panel layout


def chart_bollinger():
    o, h, l, c = synth_ohlc(90, 100, drift=0.0, vol=1.4, seed=6)
    fig, ax = new_fig()
    plot_candles(ax, o, h, l, c)
    mid = ema(c, 20)
    roll_std = np.array([c[max(0, i - 20):i + 1].std() for i in range(len(c))])
    upper = mid + 2 * roll_std
    lower = mid - 2 * roll_std
    ax.plot(mid, color=GOLD, linewidth=1.3)
    ax.plot(upper, color=MUTED, linewidth=1.1, linestyle="--")
    ax.plot(lower, color=MUTED, linewidth=1.1, linestyle="--")
    ax.fill_between(np.arange(len(c)), lower, upper, color=GOLD, alpha=0.06)
    finish(fig, ax, "bollinger-band-basics")


def chart_range_breakout():
    o, h, l, c = synth_ohlc(90, 100, drift=0.0, vol=0.6, seed=7)
    c[60:] += np.cumsum(rng.normal(0.6, 0.3, 30))
    o[61:] = c[60:-1]
    h[60:] = np.maximum(h[60:], c[60:] + 0.3)
    fig, ax = new_fig()
    plot_candles(ax, o, h, l, c)
    box_top = h[:58].max()
    box_bot = l[:58].min()
    ax.add_patch(Rectangle((0, box_bot), 58, box_top - box_bot, facecolor=GOLD, alpha=0.08, edgecolor=GOLD, linewidth=1))
    ax.annotate("Breakout", (62, c[62]), color=FG, fontsize=9, xytext=(70, c[62] + 5),
                arrowprops=dict(arrowstyle="->", color=MUTED))
    finish(fig, ax, "range-breakout")


def chart_candlestick_reversal():
    o, h, l, c = synth_ohlc(40, 100, drift=-0.15, vol=1.0, seed=8)
    # force a bullish engulfing near the end
    i = 32
    o[i] = c[i - 1] + 0.3
    c[i] = o[i - 1] - 0.8
    l[i] = min(l[i], c[i] - 0.3)
    h[i] = max(h[i], o[i] + 0.3)
    fig, ax = new_fig()
    plot_candles(ax, o, h, l, c)
    ax.annotate("Bullish engulfing", (i, l[i] - 0.5), color=FG, fontsize=9, xytext=(i, l[i] - 4.5),
                ha="center", arrowprops=dict(arrowstyle="->", color=MUTED))
    finish(fig, ax, "candlestick-reversal-basics")


def chart_fibonacci():
    o, h, l, c = synth_ohlc(70, 100, drift=0.18, vol=1.0, seed=9)
    fig, ax = new_fig()
    plot_candles(ax, o, h, l, c)
    swing_low, swing_high = l.min(), h.max()
    for ratio, color in [(0.236, MUTED), (0.382, GOLD), (0.5, GOLD_BRIGHT), (0.618, GOLD), (0.786, MUTED)]:
        level = swing_high - ratio * (swing_high - swing_low)
        ax.axhline(level, color=color, linewidth=1, linestyle="--", alpha=0.8)
        ax.text(68, level + 0.3, f"{ratio*100:.1f}%", color=color, fontsize=8)
    finish(fig, ax, "fibonacci-retracement-basics")


def chart_double_top():
    o, h, l, c = synth_ohlc(70, 100, drift=0.0, vol=0.7, seed=10)
    peak = 25
    peak2 = 50
    for p in (peak, peak2):
        c[p] = c[p - 3] + 4
        h[p] = c[p] + 0.6
    neckline = min(c[peak:peak2].min(), 100)
    fig, ax = new_fig()
    plot_candles(ax, o, h, l, c)
    ax.axhline(neckline, color=DANGER, linewidth=1.3, linestyle="--")
    ax.text(2, neckline - 1.4, "Neckline", color=DANGER, fontsize=9)
    ax.scatter([peak, peak2], [h[peak] + 0.3, h[peak2] + 0.3], color=GOLD_BRIGHT, zorder=4, s=28)
    finish(fig, ax, "basic-chart-patterns")


def chart_wyckoff():
    o, h, l, c = synth_ohlc(100, 100, drift=0.0, vol=0.8, seed=11)
    # carve a spring near x=70: dip below range then reclaim
    c[68] = l[:65].min() - 1.5
    l[68] = c[68] - 0.4
    o[68] = c[67]
    c[69:] += np.linspace(0.3, 3.5, 100 - 69)
    fig, ax = new_fig()
    plot_candles(ax, o, h, l, c)
    range_top = np.percentile(h[:65], 85)
    range_bot = np.percentile(l[:65], 15)
    ax.axhline(range_top, color=MUTED, linewidth=1, linestyle="--", alpha=0.7)
    ax.axhline(range_bot, color=MUTED, linewidth=1, linestyle="--", alpha=0.7)
    ax.annotate("Spring", (68, l[68]), color=FG, fontsize=9, xytext=(68, l[68] - 4),
                ha="center", arrowprops=dict(arrowstyle="->", color=GOLD_BRIGHT))
    ax.text(5, range_top + 0.4, "Trading range", color=MUTED, fontsize=8)
    finish(fig, ax, "wyckoff-method")


def chart_ict_smc():
    o, h, l, c = synth_ohlc(90, 100, drift=0.0, vol=1.0, seed=12)
    sweep = 55
    l[sweep] = l[:sweep].min() - 1.2
    o[sweep] = c[sweep - 1]
    c[sweep] = o[sweep] - 0.2
    c[sweep + 1:] += np.linspace(0.3, 4, len(c) - sweep - 1)
    fig, ax = new_fig()
    plot_candles(ax, o, h, l, c)
    prior_low = l[:sweep].min()
    ax.axhline(prior_low, color=MUTED, linewidth=1, linestyle="--", alpha=0.7)
    ax.annotate("Liquidity sweep", (sweep, l[sweep]), color=FG, fontsize=9, xytext=(sweep, l[sweep] - 4),
                ha="center", arrowprops=dict(arrowstyle="->", color=GOLD_BRIGHT))
    ax.text(2, prior_low + 0.3, "Prior swing low", color=MUTED, fontsize=8)
    finish(fig, ax, "ict-smart-money-concepts")


def chart_elliott_wave():
    xs = np.array([0, 10, 18, 28, 34, 46, 52])
    ys = np.array([100, 108, 104, 118, 110, 128, 120])
    fig, ax = new_fig()
    ax.plot(xs, ys, color=GOLD_BRIGHT, linewidth=2, marker="o", markersize=5, markerfacecolor=GOLD)
    labels = ["0", "1", "2", "3", "4", "5", "C"]
    for x, y, lab in zip(xs, ys, labels):
        ax.annotate(lab, (x, y), color=FG, fontsize=11, fontweight="bold", xytext=(x, y + 2.5), ha="center")
    ax.set_xlim(-3, 56)
    finish(fig, ax, "elliott-wave-theory")


def chart_vwap():
    o, h, l, c = synth_ohlc(90, 100, drift=0.08, vol=1.0, seed=13)
    weights = np.abs(rng.normal(1, 0.3, 90))
    vwap = np.cumsum(c * weights) / np.cumsum(weights)
    fig, ax = new_fig()
    plot_candles(ax, o, h, l, c)
    ax.plot(vwap, color=GOLD_BRIGHT, linewidth=2)
    ax.text(2, vwap[2] + 1.2, "Anchored VWAP", color=GOLD_BRIGHT, fontsize=9)
    finish(fig, ax, "anchored-vwap")


def chart_turtle():
    o, h, l, c = synth_ohlc(90, 100, drift=0.05, vol=1.0, seed=14)
    donchian_high = np.array([h[max(0, i - 20):i + 1].max() for i in range(len(h))])
    donchian_low = np.array([l[max(0, i - 20):i + 1].min() for i in range(len(l))])
    fig, ax = new_fig()
    plot_candles(ax, o, h, l, c)
    ax.plot(donchian_high, color=DANGER, linewidth=1.2, alpha=0.8)
    ax.plot(donchian_low, color=SUCCESS, linewidth=1.2, alpha=0.8)
    finish(fig, ax, "turtle-trading-donchian")


def chart_orb():
    o, h, l, c = synth_ohlc(60, 100, drift=0.0, vol=0.5, seed=15)
    or_high = h[:6].max()
    or_low = l[:6].min()
    c[20:] += np.linspace(0.5, 5, 40)
    fig, ax = new_fig()
    plot_candles(ax, o, h, l, c)
    ax.add_patch(Rectangle((0, or_low), 6, or_high - or_low, facecolor=GOLD, alpha=0.15, edgecolor=GOLD))
    ax.axhline(or_high, color=GOLD_BRIGHT, linewidth=1, linestyle="--")
    ax.text(7, or_high + 0.3, "Opening range high", color=GOLD_BRIGHT, fontsize=8)
    finish(fig, ax, "opening-range-breakout")


def chart_head_shoulders():
    xs = np.array([0, 8, 16, 24, 32, 40, 48])
    ys = np.array([100, 108, 101, 115, 101, 107, 95])
    fig, ax = new_fig()
    ax.plot(xs, ys, color=GOLD_BRIGHT, linewidth=2, marker="o", markersize=5, markerfacecolor=GOLD)
    ax.axhline(101, color=DANGER, linewidth=1.3, linestyle="--")
    ax.text(1, 99.3, "Neckline", color=DANGER, fontsize=9)
    ax.annotate("Head", (24, 115), color=FG, fontsize=9, xytext=(24, 119), ha="center")
    ax.annotate("L Shoulder", (8, 108), color=MUTED, fontsize=8, xytext=(8, 111), ha="center")
    ax.annotate("R Shoulder", (40, 107), color=MUTED, fontsize=8, xytext=(40, 111), ha="center")
    finish(fig, ax, "head-and-shoulders")


def chart_supertrend():
    o, h, l, c = synth_ohlc(90, 100, drift=0.1, vol=1.1, seed=16)
    atr = np.array([ (h[max(0,i-10):i+1]-l[max(0,i-10):i+1]).mean() for i in range(len(c))])
    mid = (h + l) / 2
    upper = mid + 3 * atr
    lower = mid - 3 * atr
    line = np.where(c > ema(c, 15), lower, upper)
    fig, ax = new_fig()
    plot_candles(ax, o, h, l, c)
    colors = np.where(c > ema(c, 15), SUCCESS, DANGER)
    for i in range(1, len(line)):
        ax.plot([i - 1, i], [line[i - 1], line[i]], color=colors[i], linewidth=1.8)
    finish(fig, ax, "supertrend")


CHARTS = [
    chart_ma_crossover,
    chart_support_resistance,
    chart_trendline,
    lambda: chart_rsi("rsi-overbought-oversold", "RSI"),
    chart_macd,
    chart_bollinger,
    chart_range_breakout,
    chart_candlestick_reversal,
    chart_fibonacci,
    chart_double_top,
    chart_wyckoff,
    chart_ict_smc,
    chart_elliott_wave,
    chart_vwap,
    chart_turtle,
    chart_orb,
    chart_head_shoulders,
    chart_supertrend,
]

if __name__ == "__main__":
    for fn in CHARTS:
        fn()
    print(f"Done: {len(CHARTS)} charts written to {OUT_DIR}")
