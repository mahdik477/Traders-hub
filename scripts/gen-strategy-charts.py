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


def two_panel_fig():
    """Price candles on top, an oscillator/line panel below — shared by every
    indicator that's read alongside price rather than overlaid on it."""
    fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(12, 7.5), dpi=100, gridspec_kw={"height_ratios": [3, 1]}, sharex=True)
    fig.patch.set_facecolor(PAGE_BG)
    for ax in (ax1, ax2):
        ax.set_facecolor(BG)
        for spine in ax.spines.values():
            spine.set_color(BORDER)
        ax.tick_params(colors=MUTED, labelsize=9)
        ax.grid(True, color=BORDER, linewidth=0.5, alpha=0.5)
    return fig, ax1, ax2


def finish_two_panel(fig, ax1, ax2, slug):
    ax1.set_yticklabels([]); ax1.set_xticklabels([])
    ax2.set_yticklabels([]); ax2.set_xticklabels([])
    ax1.text(0.99, 0.03, "Synthetic illustration — not real market data", transform=ax1.transAxes,
              ha="right", va="bottom", fontsize=7.5, color=MUTED, alpha=0.85)
    fig.tight_layout(pad=1.2)
    path = os.path.join(OUT_DIR, f"{slug}.png")
    fig.savefig(path, facecolor=fig.get_facecolor())
    plt.close(fig)
    print("wrote", path)


def rsi_like(c, length=14):
    """A fabricated RSI-shaped oscillator — same formula used in chart_rsi."""
    delta = np.diff(c, prepend=c[0])
    gain = np.clip(delta, 0, None)
    loss = np.clip(-delta, 0, None)
    avg_gain = ema(gain, length)
    avg_loss = ema(loss, length) + 1e-6
    return 100 - 100 / (1 + avg_gain / avg_loss)


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
    fig, ax1, ax2 = two_panel_fig()
    plot_candles(ax1, o, h, l, c)
    rsi = rsi_like(c)
    ax2.plot(rsi, color=GOLD_BRIGHT, linewidth=1.6)
    ax2.axhline(70, color=DANGER, linewidth=1, linestyle="--")
    ax2.axhline(30, color=SUCCESS, linewidth=1, linestyle="--")
    ax2.set_ylim(0, 100)
    ax2.text(0.01, 0.82, "RSI(14)", transform=ax2.transAxes, color=MUTED, fontsize=8)
    finish_two_panel(fig, ax1, ax2, slug)


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
    # Recompute wicks as a tight band around the shifted body (not the old,
    # now-stale low) — otherwise every post-breakout candle gets a wick
    # stretching all the way back down to its pre-shift price.
    h[60:] = np.maximum(o[60:], c[60:]) + np.abs(rng.normal(0.4, 0.2, 30))
    l[60:] = np.minimum(o[60:], c[60:]) - np.abs(rng.normal(0.4, 0.2, 30))
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
    h[69:] = np.maximum(o[69:], c[69:]) + np.abs(rng.normal(0.4, 0.2, 100 - 69))
    l[69:] = np.minimum(o[69:], c[69:]) - np.abs(rng.normal(0.4, 0.2, 100 - 69))
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
    n_tail = len(c) - sweep - 1
    h[sweep + 1:] = np.maximum(o[sweep + 1:], c[sweep + 1:]) + np.abs(rng.normal(0.4, 0.2, n_tail))
    l[sweep + 1:] = np.minimum(o[sweep + 1:], c[sweep + 1:]) - np.abs(rng.normal(0.4, 0.2, n_tail))
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
    o[21:] = c[20:-1]
    h[20:] = np.maximum(o[20:], c[20:]) + np.abs(rng.normal(0.4, 0.2, 40))
    l[20:] = np.minimum(o[20:], c[20:]) - np.abs(rng.normal(0.4, 0.2, 40))
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


def chart_rsi_divergence():
    o, h, l, c = synth_ohlc(80, 100, drift=0.0, vol=0.9, seed=20)
    p1, p2 = 28, 62
    c[p1] = c[p1 - 4] + 5.5
    c[p2] = c[p1] + 2.5  # price: higher high
    c[p1 + 4:p2] -= np.linspace(0, 2.5, p2 - p1 - 4)  # knock momentum down into the 2nd peak
    # the moves above only touched close — rebuild a consistent wick around
    # each touched bar's actual open/close so none of them end up with a
    # body taller than its own high/low.
    o[p1 + 1:p2 + 2] = c[p1:p2 + 1]
    span = slice(p1, p2 + 2)
    h[span] = np.maximum(o[span], c[span]) + np.abs(rng.normal(0.4, 0.2, p2 + 2 - p1))
    l[span] = np.minimum(o[span], c[span]) - np.abs(rng.normal(0.4, 0.2, p2 + 2 - p1))
    rsi = rsi_like(c)
    rsi[p2 - 2:p2 + 2] -= (rsi[p1] - rsi[p2 - 2] + 6)  # force RSI: lower high
    fig, ax1, ax2 = two_panel_fig()
    plot_candles(ax1, o, h, l, c)
    ax1.plot([p1, p2], [h[p1] + 1, h[p2] + 1], color=DANGER, linewidth=1.3, linestyle="--")
    ax1.text((p1 + p2) / 2, max(h[p1], h[p2]) + 2, "Price: higher high", color=DANGER, fontsize=8, ha="center")
    ax2.plot(rsi, color=GOLD_BRIGHT, linewidth=1.6)
    ax2.plot([p1, p2], [rsi[p1], rsi[p2]], color=SUCCESS, linewidth=1.3, linestyle="--")
    ax2.text((p1 + p2) / 2, min(rsi[p1], rsi[p2]) - 8, "RSI: lower high", color=SUCCESS, fontsize=8, ha="center")
    ax2.axhline(70, color=DANGER, linewidth=1, linestyle="--", alpha=0.5)
    ax2.axhline(30, color=SUCCESS, linewidth=1, linestyle="--", alpha=0.5)
    ax2.set_ylim(0, 100)
    ax2.text(0.01, 0.82, "RSI(14)", transform=ax2.transAxes, color=MUTED, fontsize=8)
    finish_two_panel(fig, ax1, ax2, "rsi-divergence")


def chart_macd_divergence():
    o, h, l, c = synth_ohlc(80, 100, drift=0.0, vol=0.9, seed=21)
    p1, p2 = 28, 62
    c[p1] = c[p1 - 4] + 5.5
    c[p2] = c[p1] + 2.5
    c[p1 + 4:p2] -= np.linspace(0, 2.5, p2 - p1 - 4)
    o[p1 + 1:p2 + 2] = c[p1:p2 + 1]
    span = slice(p1, p2 + 2)
    h[span] = np.maximum(o[span], c[span]) + np.abs(rng.normal(0.4, 0.2, p2 + 2 - p1))
    l[span] = np.minimum(o[span], c[span]) - np.abs(rng.normal(0.4, 0.2, p2 + 2 - p1))
    macd = ema(c, 12) - ema(c, 26)
    macd[p2 - 2:p2 + 2] -= (macd[p1] - macd[p2 - 2] + 1.2)
    fig, ax1, ax2 = two_panel_fig()
    plot_candles(ax1, o, h, l, c)
    ax1.plot([p1, p2], [h[p1] + 1, h[p2] + 1], color=DANGER, linewidth=1.3, linestyle="--")
    ax1.text((p1 + p2) / 2, max(h[p1], h[p2]) + 2, "Price: higher high", color=DANGER, fontsize=8, ha="center")
    ax2.bar(np.arange(len(macd)), macd, color=np.where(macd >= 0, SUCCESS, DANGER), width=0.7)
    ax2.plot([p1, p2], [macd[p1], macd[p2]], color=GOLD_BRIGHT, linewidth=1.3, linestyle="--")
    ax2.text((p1 + p2) / 2, min(macd[p1], macd[p2]) - 0.8, "MACD: lower high", color=GOLD_BRIGHT, fontsize=8, ha="center")
    ax2.axhline(0, color=BORDER, linewidth=1)
    ax2.text(0.01, 0.82, "MACD(12,26,9)", transform=ax2.transAxes, color=MUTED, fontsize=8)
    finish_two_panel(fig, ax1, ax2, "macd-divergence")


def chart_stochastic():
    o, h, l, c = synth_ohlc(80, 100, drift=0.0, vol=1.1, seed=22)
    n = 14
    k = np.array([100 * (c[i] - l[max(0, i - n):i + 1].min()) / max(h[max(0, i - n):i + 1].max() - l[max(0, i - n):i + 1].min(), 1e-6) for i in range(len(c))])
    d = ema(k, 3)
    fig, ax1, ax2 = two_panel_fig()
    plot_candles(ax1, o, h, l, c)
    ax2.plot(k, color=GOLD_BRIGHT, linewidth=1.4, label="%K")
    ax2.plot(d, color=GOLD, linewidth=1.4, label="%D")
    ax2.axhline(80, color=DANGER, linewidth=1, linestyle="--")
    ax2.axhline(20, color=SUCCESS, linewidth=1, linestyle="--")
    ax2.set_ylim(0, 100)
    ax2.legend(facecolor=BG, edgecolor=BORDER, labelcolor=FG, fontsize=7, loc="upper left")
    ax2.text(0.99, 0.93, "Stochastic(14,3)", transform=ax2.transAxes, color=MUTED, fontsize=8, ha="right")
    finish_two_panel(fig, ax1, ax2, "stochastic-oscillator")


def chart_cci():
    o, h, l, c = synth_ohlc(80, 100, drift=0.05, vol=1.1, seed=23)
    tp = (h + l + c) / 3
    sma = ema(tp, 20)
    mad = np.array([np.mean(np.abs(tp[max(0, i - 20):i + 1] - sma[i])) for i in range(len(tp))]) + 1e-6
    cci = (tp - sma) / (0.015 * mad)
    fig, ax1, ax2 = two_panel_fig()
    plot_candles(ax1, o, h, l, c)
    ax2.plot(cci, color=GOLD_BRIGHT, linewidth=1.5)
    ax2.axhline(100, color=DANGER, linewidth=1, linestyle="--")
    ax2.axhline(-100, color=SUCCESS, linewidth=1, linestyle="--")
    ax2.axhline(0, color=BORDER, linewidth=1)
    ax2.text(0.01, 0.82, "CCI(20)", transform=ax2.transAxes, color=MUTED, fontsize=8)
    finish_two_panel(fig, ax1, ax2, "cci-strategies")


def chart_williams_r():
    o, h, l, c = synth_ohlc(80, 100, drift=0.0, vol=1.1, seed=24)
    n = 14
    wr = np.array([-100 * (h[max(0, i - n):i + 1].max() - c[i]) / max(h[max(0, i - n):i + 1].max() - l[max(0, i - n):i + 1].min(), 1e-6) for i in range(len(c))])
    fig, ax1, ax2 = two_panel_fig()
    plot_candles(ax1, o, h, l, c)
    ax2.plot(wr, color=GOLD_BRIGHT, linewidth=1.5)
    ax2.axhline(-20, color=DANGER, linewidth=1, linestyle="--")
    ax2.axhline(-80, color=SUCCESS, linewidth=1, linestyle="--")
    ax2.set_ylim(-100, 0)
    ax2.text(0.01, 0.82, "Williams %R(14)", transform=ax2.transAxes, color=MUTED, fontsize=8)
    finish_two_panel(fig, ax1, ax2, "williams-percent-r")


def chart_roc():
    o, h, l, c = synth_ohlc(80, 100, drift=0.1, vol=1.0, seed=25)
    n = 12
    roc = np.zeros(len(c))
    roc[n:] = (c[n:] - c[:-n]) / c[:-n] * 100
    fig, ax1, ax2 = two_panel_fig()
    plot_candles(ax1, o, h, l, c)
    ax2.plot(roc, color=GOLD_BRIGHT, linewidth=1.5)
    ax2.axhline(0, color=BORDER, linewidth=1)
    ax2.fill_between(np.arange(len(roc)), 0, roc, where=roc >= 0, color=SUCCESS, alpha=0.15)
    ax2.fill_between(np.arange(len(roc)), 0, roc, where=roc < 0, color=DANGER, alpha=0.15)
    ax2.text(0.01, 0.82, "ROC(12)", transform=ax2.transAxes, color=MUTED, fontsize=8)
    finish_two_panel(fig, ax1, ax2, "momentum-rate-of-change")


def chart_relative_strength_rotation():
    n = 90
    bench = np.cumsum(rng.normal(0.08, 1.0, n)) + 100
    leader = bench + np.cumsum(rng.normal(0.12, 0.6, n))
    laggard = bench - np.cumsum(rng.normal(0.10, 0.6, n))
    fig, ax = new_fig()
    ax.plot(leader, color=SUCCESS, linewidth=2, label="Leading sector")
    ax.plot(bench, color=MUTED, linewidth=1.6, linestyle="--", label="Benchmark")
    ax.plot(laggard, color=DANGER, linewidth=2, label="Lagging sector")
    ax.legend(facecolor=BG, edgecolor=BORDER, labelcolor=FG, fontsize=9, loc="upper left")
    finish(fig, ax, "relative-strength-rotation")


def chart_obv():
    o, h, l, c = synth_ohlc(80, 100, drift=0.0, vol=0.9, seed=26)
    p1, p2 = 26, 58
    c[p1] = c[p1 - 4] - 4; l[p1] = c[p1] - 0.6
    c[p2] = c[p1] - 2; l[p2] = c[p2] - 0.6  # price: lower low
    volume = np.abs(rng.normal(1, 0.3, 80))
    volume[p1 - 3:p1 + 3] *= 1.8
    direction = np.sign(np.diff(c, prepend=c[0]))
    obv = np.cumsum(direction * volume)
    obv[p2 - 3:p2 + 3] += (obv[p1] - obv[p2 - 3] + 6)  # force OBV: higher low
    fig, ax1, ax2 = two_panel_fig()
    plot_candles(ax1, o, h, l, c)
    ax1.plot([p1, p2], [l[p1] - 1, l[p2] - 1], color=DANGER, linewidth=1.3, linestyle="--")
    ax1.text((p1 + p2) / 2, min(l[p1], l[p2]) - 2.6, "Price: lower low", color=DANGER, fontsize=8, ha="center")
    ax2.plot(obv, color=GOLD_BRIGHT, linewidth=1.6)
    ax2.plot([p1, p2], [obv[p1], obv[p2]], color=SUCCESS, linewidth=1.3, linestyle="--")
    ax2.text((p1 + p2) / 2, max(obv[p1], obv[p2]) + 3, "OBV: higher low", color=SUCCESS, fontsize=8, ha="center")
    ax2.text(0.01, 0.82, "OBV", transform=ax2.transAxes, color=MUTED, fontsize=8)
    finish_two_panel(fig, ax1, ax2, "on-balance-volume")


def chart_adx_dmi():
    o, h, l, c = synth_ohlc(80, 100, drift=0.12, vol=1.0, seed=27)
    up_move = np.clip(np.diff(h, prepend=h[0]), 0, None)
    down_move = np.clip(-np.diff(l, prepend=l[0]), 0, None)
    plus_di = ema(up_move, 14) / (ema(up_move, 14) + ema(down_move, 14) + 1e-6) * 60
    minus_di = 60 - plus_di
    adx = ema(np.abs(plus_di - minus_di), 14)
    fig, ax1, ax2 = two_panel_fig()
    plot_candles(ax1, o, h, l, c)
    ax2.plot(plus_di, color=SUCCESS, linewidth=1.4, label="+DI")
    ax2.plot(minus_di, color=DANGER, linewidth=1.4, label="−DI")
    ax2.plot(adx, color=GOLD_BRIGHT, linewidth=1.8, label="ADX")
    ax2.axhline(25, color=MUTED, linewidth=1, linestyle="--")
    ax2.legend(facecolor=BG, edgecolor=BORDER, labelcolor=FG, fontsize=7, loc="upper left")
    ax2.text(0.99, 0.82, "ADX/DMI(14)", transform=ax2.transAxes, color=MUTED, fontsize=8, ha="right")
    finish_two_panel(fig, ax1, ax2, "adx-dmi-trend-strength")


def chart_parabolic_sar():
    o, h, l, c = synth_ohlc(80, 100, drift=0.1, vol=1.1, seed=28)
    trend_up = c > ema(c, 20)
    sar = np.where(trend_up, l - 1.4, h + 1.4)
    fig, ax = new_fig()
    plot_candles(ax, o, h, l, c)
    ax.scatter(np.arange(len(sar)), sar, color=np.where(trend_up, SUCCESS, DANGER), s=10, zorder=4)
    finish(fig, ax, "parabolic-sar")


def chart_heikin_ashi():
    o, h, l, c = synth_ohlc(80, 100, drift=0.1, vol=1.2, seed=29)
    ha_close = (o + h + l + c) / 4
    ha_open = np.zeros_like(o)
    ha_open[0] = (o[0] + c[0]) / 2
    for i in range(1, len(o)):
        ha_open[i] = (ha_open[i - 1] + ha_close[i - 1]) / 2
    ha_high = np.maximum.reduce([h, ha_open, ha_close])
    ha_low = np.minimum.reduce([l, ha_open, ha_close])
    fig, ax = new_fig()
    plot_candles(ax, ha_open, ha_high, ha_low, ha_close)
    finish(fig, ax, "heikin-ashi-trend")


def chart_atr_breakout():
    o, h, l, c = synth_ohlc(80, 100, drift=0.0, vol=0.7, seed=30)
    atr = np.array([(h[max(0, i - 14):i + 1] - l[max(0, i - 14):i + 1]).mean() for i in range(len(c))])
    brk = 55
    c[brk:] += np.cumsum(rng.normal(0.7, 0.3, len(c) - brk))
    o[brk + 1:] = c[brk:-1]
    n_shift = len(c) - brk
    h[brk:] = np.maximum(o[brk:], c[brk:]) + np.abs(rng.normal(0.4, 0.2, n_shift))
    l[brk:] = np.minimum(o[brk:], c[brk:]) - np.abs(rng.normal(0.4, 0.2, n_shift))
    fig, ax = new_fig()
    plot_candles(ax, o, h, l, c)
    trigger = o[brk] + 1.5 * atr[brk]
    ax.axhline(trigger, color=GOLD_BRIGHT, linewidth=1.2, linestyle="--")
    ax.text(2, trigger + 0.4, "Open + 1.5×ATR trigger", color=GOLD_BRIGHT, fontsize=8)
    ax.annotate("Breakout", (brk + 5, c[brk + 5]), color=FG, fontsize=9, xytext=(brk + 12, c[brk + 5] + 5),
                arrowprops=dict(arrowstyle="->", color=MUTED))
    finish(fig, ax, "atr-volatility-breakout")


def chart_keltner():
    o, h, l, c = synth_ohlc(90, 100, drift=0.1, vol=1.1, seed=31)
    mid = ema(c, 20)
    atr = np.array([(h[max(0, i - 14):i + 1] - l[max(0, i - 14):i + 1]).mean() for i in range(len(c))])
    upper = mid + 2 * atr
    lower = mid - 2 * atr
    fig, ax = new_fig()
    plot_candles(ax, o, h, l, c)
    ax.plot(mid, color=GOLD, linewidth=1.3)
    ax.plot(upper, color=MUTED, linewidth=1.1, linestyle="--")
    ax.plot(lower, color=MUTED, linewidth=1.1, linestyle="--")
    ax.fill_between(np.arange(len(c)), lower, upper, color=GOLD, alpha=0.06)
    finish(fig, ax, "keltner-channel-pullback")


def chart_ma_pullback():
    o, h, l, c = synth_ohlc(90, 100, drift=0.12, vol=1.0, seed=32)
    ma = ema(c, 20)
    pb = 60
    c[pb] = ma[pb] + 0.3; l[pb] = ma[pb] - 0.4; o[pb] = c[pb - 1]
    fig, ax = new_fig()
    plot_candles(ax, o, h, l, c)
    ax.plot(ma, color=GOLD_BRIGHT, linewidth=1.8)
    ax.annotate("Pullback to 20 EMA", (pb, l[pb]), color=FG, fontsize=9, xytext=(pb, l[pb] - 5),
                ha="center", arrowprops=dict(arrowstyle="->", color=SUCCESS))
    finish(fig, ax, "ma-pullback-continuation")


def chart_pivot_points():
    o, h, l, c = synth_ohlc(60, 100, drift=0.02, vol=1.0, seed=33)
    prior_h, prior_l, prior_c = h[:1].max() + 3, l[:1].min() - 3, c[0]
    p = (prior_h + prior_l + prior_c) / 3
    r1, s1 = 2 * p - prior_l, 2 * p - prior_h
    r2, s2 = p + (prior_h - prior_l), p - (prior_h - prior_l)
    fig, ax = new_fig()
    plot_candles(ax, o, h, l, c)
    for level, label, color in [(r2, "R2", DANGER), (r1, "R1", DANGER), (p, "P", GOLD_BRIGHT), (s1, "S1", SUCCESS), (s2, "S2", SUCCESS)]:
        ax.axhline(level, color=color, linewidth=1, linestyle="--", alpha=0.8)
        ax.text(57, level + 0.3, label, color=color, fontsize=8)
    finish(fig, ax, "pivot-points")


def chart_vwap_reversion():
    o, h, l, c = synth_ohlc(80, 100, drift=0.0, vol=1.0, seed=34)
    weights = np.abs(rng.normal(1, 0.3, 80))
    vwap = np.cumsum(c * weights) / np.cumsum(weights)
    std = np.array([c[max(0, i - 20):i + 1].std() for i in range(len(c))])
    upper = vwap + 2 * std
    lower = vwap - 2 * std
    tag = 55
    c[tag] = upper[tag] + 0.3; h[tag] = c[tag] + 0.4; o[tag] = c[tag - 1]
    fig, ax = new_fig()
    plot_candles(ax, o, h, l, c)
    ax.plot(vwap, color=GOLD_BRIGHT, linewidth=1.8)
    ax.plot(upper, color=MUTED, linewidth=1, linestyle="--")
    ax.plot(lower, color=MUTED, linewidth=1, linestyle="--")
    ax.text(2, vwap[2] + 0.6, "VWAP", color=GOLD_BRIGHT, fontsize=8)
    ax.annotate("Fade back to VWAP", (tag, h[tag]), color=FG, fontsize=9, xytext=(tag, h[tag] + 5),
                ha="center", arrowprops=dict(arrowstyle="->", color=MUTED))
    finish(fig, ax, "vwap-reversion-trend")


def chart_gap():
    o, h, l, c = synth_ohlc(50, 100, drift=0.0, vol=0.8, seed=35)
    gap_i = 28
    prior_close = c[gap_i - 1]
    o[gap_i] = prior_close + 4.5
    c[gap_i:] += 4.5
    h[gap_i:] = np.maximum(h[gap_i:], np.maximum(o[gap_i:], c[gap_i:]) + 0.3)
    l[gap_i:] = np.minimum(l[gap_i:], np.minimum(o[gap_i:], c[gap_i:]) - 0.3)
    fig, ax = new_fig()
    plot_candles(ax, o, h, l, c)
    ax.axhline(prior_close, color=MUTED, linewidth=1.2, linestyle="--")
    ax.text(2, prior_close + 0.4, "Prior close (the \"fill\" level)", color=MUTED, fontsize=8)
    ax.annotate("Gap up", (gap_i, o[gap_i]), color=FG, fontsize=9, xytext=(gap_i + 6, o[gap_i] + 2),
                arrowprops=dict(arrowstyle="->", color=GOLD_BRIGHT))
    finish(fig, ax, "gap-fill-gap-and-go")


def chart_inside_bar():
    o, h, l, c = synth_ohlc(50, 100, drift=0.0, vol=1.2, seed=36)
    wide = 24
    narrow = 25
    h[narrow] = (h[wide] + l[wide]) / 2 + 0.6
    l[narrow] = (h[wide] + l[wide]) / 2 - 0.6
    o[narrow] = (h[narrow] + l[narrow]) / 2
    c[narrow] = o[narrow] + 0.2
    c[narrow + 1:] += np.linspace(0.5, 5, 50 - narrow - 1)
    o[narrow + 1:] = np.concatenate([[c[narrow]], c[narrow + 1:-1]])
    h[narrow + 1:] = np.maximum(h[narrow + 1:], np.maximum(o[narrow + 1:], c[narrow + 1:]) + 0.3)
    l[narrow + 1:] = np.minimum(l[narrow + 1:], np.minimum(o[narrow + 1:], c[narrow + 1:]) - 0.3)
    fig, ax = new_fig()
    plot_candles(ax, o, h, l, c)
    ax.annotate("Inside bar / NR7", (narrow, h[narrow] + 0.3), color=FG, fontsize=9, xytext=(narrow, h[narrow] + 4.5),
                ha="center", arrowprops=dict(arrowstyle="->", color=GOLD_BRIGHT))
    ax.axhline(h[narrow], color=MUTED, linewidth=1, linestyle="--", alpha=0.6)
    ax.axhline(l[narrow], color=MUTED, linewidth=1, linestyle="--", alpha=0.6)
    finish(fig, ax, "inside-bar-nr7")


def chart_dow_theory():
    xs = np.array([0, 10, 18, 28, 36, 48, 56, 68])
    ys = np.array([100, 112, 106, 120, 114, 128, 122, 136])
    fig, ax = new_fig()
    ax.plot(xs, ys, color=GOLD_BRIGHT, linewidth=2, marker="o", markersize=5, markerfacecolor=GOLD)
    for i in range(0, len(xs) - 2, 2):
        ax.annotate("Higher high", (xs[i], ys[i]), color=SUCCESS, fontsize=7.5, xytext=(xs[i], ys[i] + 3), ha="center")
    for i in range(1, len(xs) - 1, 2):
        ax.annotate("Secondary\nreaction", (xs[i], ys[i]), color=MUTED, fontsize=7, xytext=(xs[i], ys[i] - 6), ha="center")
    ax.set_xlim(-3, 72)
    finish(fig, ax, "dow-theory")


def chart_supply_demand():
    o, h, l, c = synth_ohlc(70, 100, drift=0.0, vol=0.8, seed=37)
    base_lo, base_hi = 20, 26
    zone_top = h[base_lo:base_hi].max()
    zone_bot = l[base_lo:base_hi].min()
    c[base_hi:base_hi + 15] += np.cumsum(rng.normal(0.6, 0.3, 15))
    o[base_hi + 1:base_hi + 15] = c[base_hi:base_hi + 14]
    h[base_hi:base_hi + 15] = np.maximum(o[base_hi:base_hi + 15], c[base_hi:base_hi + 15]) + np.abs(rng.normal(0.4, 0.2, 15))
    l[base_hi:base_hi + 15] = np.minimum(o[base_hi:base_hi + 15], c[base_hi:base_hi + 15]) - np.abs(rng.normal(0.4, 0.2, 15))
    retest = 55
    c[retest] = zone_top - 0.2; o[retest] = zone_top + 0.5
    h[retest] = max(zone_top + 0.5, o[retest], c[retest]) + 0.2
    l[retest] = min(zone_bot + 0.1, o[retest], c[retest]) - 0.1
    fig, ax = new_fig()
    plot_candles(ax, o, h, l, c)
    ax.add_patch(Rectangle((base_lo, zone_bot), 50, zone_top - zone_bot, facecolor=SUCCESS, alpha=0.1, edgecolor=SUCCESS, linewidth=1))
    ax.text(base_lo, zone_top + 0.5, "Demand zone", color=SUCCESS, fontsize=8)
    ax.annotate("Return to zone", (retest, l[retest]), color=FG, fontsize=9, xytext=(retest, l[retest] - 4.5),
                ha="center", arrowprops=dict(arrowstyle="->", color=MUTED))
    finish(fig, ax, "supply-and-demand-zones")


def chart_flags_pennants():
    o, h, l, c = synth_ohlc(60, 100, drift=0.0, vol=0.5, seed=38)
    pole_end = 20
    c[:pole_end] = 100 + np.cumsum(np.full(pole_end, 0.6))
    o[1:pole_end] = c[:pole_end - 1]
    flag_end = 38
    c[pole_end:flag_end] = c[pole_end - 1] - np.linspace(0, 2.5, flag_end - pole_end)
    o[pole_end + 1:flag_end] = c[pole_end:flag_end - 1]
    c[flag_end:] = c[flag_end - 1] + np.cumsum(np.full(60 - flag_end, 0.6))
    o[flag_end + 1:] = c[flag_end:-1]
    h[:] = np.maximum(h, np.maximum(o, c) + 0.2)
    l[:] = np.minimum(l, np.minimum(o, c) - 0.2)
    fig, ax = new_fig()
    plot_candles(ax, o, h, l, c)
    ax.plot([0, pole_end], [100, c[pole_end - 1]], color=MUTED, linewidth=1, alpha=0.4)
    ax.text(5, 103, "Pole", color=MUTED, fontsize=8)
    ax.add_patch(Rectangle((pole_end, c[flag_end - 1] - 0.5), flag_end - pole_end, c[pole_end - 1] - c[flag_end - 1] + 1,
                            facecolor=GOLD, alpha=0.08, edgecolor=GOLD, linewidth=1))
    ax.text(pole_end + 1, c[pole_end - 1] + 1, "Flag", color=GOLD_BRIGHT, fontsize=8)
    ax.annotate("Breakout", (flag_end + 4, c[flag_end + 4]), color=FG, fontsize=9, xytext=(flag_end + 10, c[flag_end + 4] + 4),
                arrowprops=dict(arrowstyle="->", color=MUTED))
    finish(fig, ax, "flags-pennants-wedges")


def chart_cup_handle():
    n = 70
    rim = 100.0
    # a proper U: starts at the rim, dips to a rounded bottom, recovers to the rim
    cup = rim - 7 * np.sin(np.linspace(0, np.pi, 50)) + rng.normal(0, 0.15, 50)
    handle = cup[-1] - np.linspace(0, 2.2, 12) + rng.normal(0, 0.1, 12)
    breakout = handle[-1] + np.cumsum(np.full(n - 62, 0.7))
    c = np.concatenate([cup, handle, breakout])
    o = np.concatenate([[c[0]], c[:-1]])
    h = np.maximum(o, c) + 0.3
    l = np.minimum(o, c) - 0.3
    fig, ax = new_fig()
    plot_candles(ax, o, h, l, c)
    ax.axhline(rim, color=GOLD_BRIGHT, linewidth=1, linestyle="--", alpha=0.7)
    ax.text(2, rim + 1, "Cup rim / breakout level", color=GOLD_BRIGHT, fontsize=8)
    ax.text(20, cup.min() - 2, "Cup", color=MUTED, fontsize=9, ha="center")
    ax.text(56, handle.min() - 2, "Handle", color=MUTED, fontsize=9, ha="center")
    ax.annotate("Breakout", (65, c[65]), color=FG, fontsize=9, xytext=(65, c[65] + 4),
                ha="center", arrowprops=dict(arrowstyle="->", color=MUTED))
    finish(fig, ax, "cup-and-handle")


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
    chart_rsi_divergence,
    chart_macd_divergence,
    chart_stochastic,
    chart_cci,
    chart_williams_r,
    chart_roc,
    chart_relative_strength_rotation,
    chart_obv,
    chart_adx_dmi,
    chart_parabolic_sar,
    chart_heikin_ashi,
    chart_atr_breakout,
    chart_keltner,
    chart_ma_pullback,
    chart_pivot_points,
    chart_vwap_reversion,
    chart_gap,
    chart_inside_bar,
    chart_dow_theory,
    chart_supply_demand,
    chart_flags_pennants,
    chart_cup_handle,
]

if __name__ == "__main__":
    for fn in CHARTS:
        fn()
    print(f"Done: {len(CHARTS)} charts written to {OUT_DIR}")
