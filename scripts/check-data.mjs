#!/usr/bin/env node
// Checks every listing data file (propfirms-data-*.json, courses-data-*.json)
// for mistakes before they reach the live site.
//
//   npm run check:data            -> check all files, print a report
//   node scripts/check-data.mjs --hook
//                                 -> used by Claude Code after it edits a file.
//                                    Reads the edit from stdin and only runs when
//                                    a data file was touched.
//
// ERRORS block a release (wrong shape, banned wording, broken links).
// WARNINGS are things a human should look at (stale prices, missing fields).

import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT =
  process.env.CLAUDE_PROJECT_DIR ||
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const PROP_PATTERN = /^propfirms-data-.+\.json$/i;
const COURSE_PATTERN = /^courses-data-.+\.json$/i;
const STALE_AFTER_DAYS = 30;

// Wording we never publish (see CLAUDE.md "Non-negotiable constraints").
const BANNED = [
  [/guaranteed?\s+(profits?|returns?|income|payouts?|results?|funding)/i, "promises a guaranteed outcome"],
  [/\brisk[\s-]?free\b/i, "says trading is risk-free"],
  [/\bwin[\s-]?rate\b/i, "shows a win rate"],
  [/\bcan'?t\s+lose\b|\bno[\s-]?lose\b/i, "implies you can't lose"],
  [/\bget\s+rich\b/i, "get-rich wording"],
  [/\b\d{2,3}\s?%\s+accura(te|cy)\b/i, "claims an accuracy score"],
];
// Wording that is sometimes fine but needs a human look.
const REVIEW = [
  [/\bprofitable\b/i, "uses the word 'profitable'"],
  [/\bpassive income\b/i, "uses 'passive income'"],
  [/\bAlpha (Futures|Capital)\b/, "mentions Alpha Futures / Alpha Capital (we list Alpha Funded)"],
];
// Fields where quoting someone else is expected; banned wording here is a
// warning (we may be quoting the provider) rather than an error.
const QUOTE_FIELDS = new Set(["quote", "name_note"]);

const errors = [];
const warnings = [];
const err = (file, msg) => errors.push(`${file}: ${msg}`);
const warn = (file, msg) => warnings.push(`${file}: ${msg}`);

const isNum = (v) => typeof v === "number" && Number.isFinite(v);
const isNumOrNull = (v) => v === null || v === undefined || isNum(v);

function checkLink(file, field, url) {
  if (url === null || url === undefined || url === "") return;
  try {
    const u = new URL(url);
    if (u.protocol !== "https:") err(file, `${field} should start with https:// (got "${url}")`);
  } catch {
    err(file, `${field} is not a valid web address: "${url}"`);
  }
}

function checkCurrency(file, code) {
  try {
    new Intl.NumberFormat("en-US", { style: "currency", currency: code });
  } catch {
    err(file, `currency "${code}" is not a valid 3-letter currency code (e.g. USD, EUR)`);
  }
}

function checkVerified(file, notes) {
  const d = notes?.last_verified;
  if (!d) {
    warn(file, `no "_notes.last_verified" date - add the date you checked the provider's site`);
    return;
  }
  const age = (Date.now() - new Date(d).getTime()) / 86_400_000;
  if (Number.isNaN(age)) err(file, `"_notes.last_verified" is not a date (use YYYY-MM-DD)`);
  else if (age > STALE_AFTER_DAYS)
    warn(file, `prices last verified ${d} (${Math.floor(age)} days ago) - re-check the live pricing page`);
}

// Walk every string in the file and scan its wording.
function scanWording(file, value, trail = []) {
  if (typeof value === "string") {
    const field = trail[trail.length - 1];
    if (trail[0] === "_notes") return;
    for (const [re, why] of BANNED) {
      if (re.test(value)) {
        const where = trail.join(".");
        if (QUOTE_FIELDS.has(field)) warn(file, `${where} ${why} (quoted text - check it's clearly attributed): "${value}"`);
        else err(file, `${where} ${why}: "${value}"`);
      }
    }
    for (const [re, why] of REVIEW) {
      if (re.test(value) && field !== "name_note") warn(file, `${trail.join(".")} ${why}: "${value}"`);
    }
  } else if (Array.isArray(value)) {
    value.forEach((v, i) => scanWording(file, v, [...trail, String(i)]));
  } else if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) scanWording(file, v, [...trail, k]);
  }
}

function checkPropFirm(file, data) {
  const f = data?.firm;
  if (!f) return err(file, `missing top-level "firm"`);
  if (!/^[a-z0-9-]+$/.test(f.id ?? "")) err(file, `firm.id must be lowercase letters, numbers and dashes (got "${f.id}")`);
  if (!f.name) err(file, `firm.name is missing`);
  if (!f.about) warn(file, `firm.about is empty - add a short description in our own words`);
  checkCurrency(file, f.currency);
  checkLink(file, "firm.website", f.website);
  checkLink(file, "firm.affiliate_link", f.affiliate_link);
  if (!f.affiliate_link) warn(file, `no affiliate_link yet - the "Visit site" button stays hidden`);
  if (f.platforms !== null && !Array.isArray(f.platforms)) err(file, `firm.platforms must be a list or null`);
  if (!Array.isArray(f.markets) || f.markets.length === 0) return err(file, `firm.markets must be a non-empty list`);

  f.markets.forEach((m, mi) => {
    const at = `markets[${mi}]`;
    if (m.market !== "forex" && m.market !== "futures") err(file, `${at}.market must be "forex" or "futures" (got "${m.market}")`);
    if (!Array.isArray(m.programs) || m.programs.length === 0) return err(file, `${at}.programs must be a non-empty list`);
    m.programs.forEach((p, pi) => {
      const pat = `${at}.programs[${pi}] (${p.program})`;
      if (!p.program) err(file, `${pat} has no "program" name`);
      (p.tiers ?? []).forEach((t, ti) => {
        const tat = `${pat}.tiers[${ti}] (${t.tier})`;
        const unit = t.rules?.unit;
        if (m.market === "forex" && unit !== "percent") err(file, `${tat}: forex rules must use "unit": "percent"`);
        if (m.market === "futures" && unit !== "usd") err(file, `${tat}: futures rules must use "unit": "usd"`);
        const split = t.rules?.profit_split_max;
        if (!isNumOrNull(split) || (isNum(split) && (split <= 0 || split > 100))) err(file, `${tat}: profit_split_max must be a number between 1 and 100`);
        if (unit === "percent") {
          for (const k of ["phase1_target", "phase2_target", "daily_loss", "max_loss"]) {
            const v = t.rules[k];
            if (!isNumOrNull(v)) err(file, `${tat}: ${k} must be a number or null`);
            else if (isNum(v) && (v <= 0 || v > 50)) err(file, `${tat}: ${k} = ${v}% looks wrong (forex rules are % of account size)`);
          }
        }
        if (!Array.isArray(t.accounts) || t.accounts.length === 0) return err(file, `${tat} has no accounts`);
        const seen = new Set();
        t.accounts.forEach((a) => {
          const aat = `${tat} $${a.size}`;
          if (!isNum(a.size) || a.size <= 0) err(file, `${tat}: account size must be a positive number`);
          if (seen.has(a.size)) err(file, `${aat} is listed twice`);
          seen.add(a.size);
          if (!isNumOrNull(a.promo) || !isNumOrNull(a.standard)) err(file, `${aat}: prices must be numbers (no currency symbols) or null`);
          if (a.promo == null && a.standard == null) warn(file, `${aat} has no price`);
          if (isNum(a.promo) && isNum(a.standard) && a.promo >= a.standard)
            err(file, `${aat}: promo price (${a.promo}) should be lower than the standard price (${a.standard})`);
          if (unit === "usd") {
            for (const k of ["profit_target", "daily_loss", "max_loss", "payout_cap"]) {
              if (isNum(a[k]) && a[k] >= a.size) err(file, `${aat}: ${k} (${a[k]}) is bigger than the account - futures rules are USD amounts`);
            }
          }
        });
      });
    });
  });
}

function checkCourse(file, data) {
  const c = data?.course;
  if (!c) return err(file, `missing top-level "course"`);
  if (!/^[a-z0-9-]+$/.test(c.id ?? "")) err(file, `course.id must be lowercase letters, numbers and dashes (got "${c.id}")`);
  if (!c.name) err(file, `course.name is missing`);
  if (!c.about) warn(file, `course.about is empty`);
  if (c.logo) {
    if (!c.logo.startsWith("/")) err(file, `course.logo should be a path under /public, e.g. "/courses/name-logo.webp"`);
    else if (!existsSync(path.join(ROOT, "public", c.logo))) err(file, `course.logo file not found: public${c.logo}`);
  }
  checkLink(file, "course.website", c.website);
  checkLink(file, "course.affiliate_link", c.affiliate_link);
  checkLink(file, "course.instructor.link", c.instructor?.link);
  checkLink(file, "course.trustpilot.url", c.trustpilot?.url);
  if (c.trustpilot && (!isNum(c.trustpilot.rating) || c.trustpilot.rating < 0 || c.trustpilot.rating > 5))
    err(file, `course.trustpilot.rating must be between 0 and 5`);
  (c.testimonials ?? []).forEach((t, i) => {
    if (!t.source) err(file, `testimonials[${i}] has no "source" - every quote must say where it came from`);
  });
  if (!Array.isArray(c.pricing) || c.pricing.length === 0) warn(file, `no pricing listed`);
}

function checkAll() {
  const files = readdirSync(ROOT).filter((f) => PROP_PATTERN.test(f) || COURSE_PATTERN.test(f)).sort();
  const ids = new Map();
  for (const file of files) {
    let data;
    try {
      data = JSON.parse(readFileSync(path.join(ROOT, file), "utf-8"));
    } catch (e) {
      err(file, `is not valid JSON - ${e.message}`);
      continue;
    }
    const isProp = PROP_PATTERN.test(file);
    if (isProp) checkPropFirm(file, data);
    else checkCourse(file, data);
    checkVerified(file, data._notes);
    scanWording(file, isProp ? data.firm : data.course);
    const id = `${isProp ? "firm" : "course"}:${(isProp ? data.firm : data.course)?.id}`;
    if (ids.has(id)) err(file, `uses the same id as ${ids.get(id)}`);
    ids.set(id, file);
  }
  return files.length;
}

function report(count) {
  const out = [];
  if (errors.length) out.push(`ERRORS (must fix):\n${errors.map((e) => `  - ${e}`).join("\n")}`);
  if (warnings.length) out.push(`WARNINGS (review):\n${warnings.map((w) => `  - ${w}`).join("\n")}`);
  out.push(`Checked ${count} data file(s): ${errors.length} error(s), ${warnings.length} warning(s).`);
  return out.join("\n\n");
}

async function main() {
  if (process.argv.includes("--hook")) {
    let raw = "";
    for await (const chunk of process.stdin) raw += chunk;
    let filePath = "";
    try {
      filePath = JSON.parse(raw)?.tool_input?.file_path ?? "";
    } catch {
      process.exit(0);
    }
    const name = path.basename(filePath);
    if (!PROP_PATTERN.test(name) && !COURSE_PATTERN.test(name)) process.exit(0);
    const count = checkAll();
    // Only interrupt Claude for real errors; warnings show up in npm run check.
    if (errors.length) {
      console.error(`Data check failed after editing ${name}. Fix these before continuing:\n\n${report(count)}`);
      process.exit(2);
    }
    process.exit(0);
  }

  const count = checkAll();
  console.log(report(count));
  process.exit(errors.length ? 1 : 0);
}

main();
