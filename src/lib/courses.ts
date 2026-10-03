// Loads every `courses-data-*.json` file in the project root, the same way
// propfirms.ts loads prop firm files. To add a course, drop a new
// `courses-data-<name>.json` file next to the others and redeploy — no code
// changes needed.
//
// Files are read at build time, so the published page is static and the
// server never reads them at runtime (hence the turbopackIgnore hints below).

import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import type { CourseView } from "./course-types";

type RawFile = {
  course: {
    id: string;
    name: string;
    logo?: string | null;
    tagline?: string | null;
    about?: string | null;
    instructor?: { name: string; link?: string | null } | null;
    curriculum?: { title: string; module_count?: number | null; topics: string[] }[];
    formats?: { label: string; description: string }[];
    platforms?: string[];
    stats?: { label: string; value: string }[];
    broker_partnership?: { broker_name: string; description: string; url?: string | null } | null;
    pricing?: {
      name: string;
      price: string;
      billing_note?: string | null;
      highlight?: string | null;
      link?: string | null;
    }[];
    refund_policy?: string | null;
    trustpilot?: { rating: number; review_count?: number | null; url?: string | null } | null;
    testimonials?: { quote: string; author: string; source?: string | null }[];
    /** Overrides the default "sourced from the provider's own marketing" note
     *  — set this when testimonials are from somewhere else, e.g. independent
     *  Trustpilot reviews. */
    testimonials_note?: string | null;
    website?: string | null;
    affiliate_link?: string | null;
  };
};

const DATA_FILE_PATTERN = /^courses-data-.+\.json$/i;

const DEFAULT_TESTIMONIALS_NOTE =
  "These testimonials are quoted from the course provider's own website and marketing. We haven't independently verified them, and we don't verify trading performance or results.";

function loadCourses(): CourseView[] {
  const dir = process.cwd();
  const files = readdirSync(/*turbopackIgnore: true*/ dir)
    .filter((f) => DATA_FILE_PATTERN.test(f))
    .sort();

  const courses = files.map((file) => {
    let data: RawFile;
    try {
      data = JSON.parse(readFileSync(path.join(/*turbopackIgnore: true*/ dir, file), "utf-8"));
    } catch (err) {
      throw new Error(`Could not read course data file "${file}": ${err}`);
    }
    if (!data?.course?.id || !data.course.name) {
      throw new Error(`Course data file "${file}" is missing "course.id" or "course.name".`);
    }
    if (!/^[a-z0-9-]+$/.test(data.course.id)) {
      throw new Error(
        `Course data file "${file}": "id" must use only lowercase letters, numbers and dashes.`,
      );
    }
    return buildCourse(data.course);
  });

  const ids = courses.map((c) => c.id);
  const duplicate = ids.find((id, i) => ids.indexOf(id) !== i);
  if (duplicate) throw new Error(`Two course data files use the id "${duplicate}".`);
  return courses;
}

function buildCourse(c: RawFile["course"]): CourseView {
  return {
    id: c.id,
    name: c.name,
    logo: c.logo || null,
    tagline: c.tagline || null,
    about: c.about || null,
    instructor: c.instructor
      ? { name: c.instructor.name, link: safeLink(c.instructor.link) }
      : null,
    curriculum: (c.curriculum ?? []).map((m) => ({
      title: m.title,
      moduleCount: m.module_count ?? null,
      topics: m.topics,
    })),
    formats: c.formats ?? [],
    platforms: c.platforms ?? [],
    stats: c.stats ?? [],
    brokerPartnership: c.broker_partnership
      ? {
          brokerName: c.broker_partnership.broker_name,
          description: c.broker_partnership.description,
          url: safeLink(c.broker_partnership.url),
        }
      : null,
    pricing: (c.pricing ?? []).map((p) => ({
      name: p.name,
      price: p.price,
      billingNote: p.billing_note ?? null,
      highlight: p.highlight ?? null,
      link: safeLink(p.link),
    })),
    refundPolicy: c.refund_policy || null,
    trustpilot: c.trustpilot
      ? {
          rating: c.trustpilot.rating,
          reviewCount: c.trustpilot.review_count ?? null,
          url: safeLink(c.trustpilot.url),
        }
      : null,
    testimonials: (c.testimonials ?? []).map((t) => ({
      quote: t.quote,
      author: t.author,
      source: t.source ?? null,
    })),
    testimonialsNote: c.testimonials_note || DEFAULT_TESTIMONIALS_NOTE,
    website: safeLink(c.website),
    affiliateLink: safeLink(c.affiliate_link),
  };
}

// Only allow normal web links, so a typo in a data file can't produce a
// harmful link (e.g. "javascript:...") — same guard as propfirms.ts.
function safeLink(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    return u.protocol === "https:" || u.protocol === "http:" ? u.href : null;
  } catch {
    return null;
  }
}

// Read once when the module loads (build time for a static page).
export const courses: CourseView[] = loadCourses();

export function getCourse(id: string): CourseView | undefined {
  return courses.find((c) => c.id === id);
}
