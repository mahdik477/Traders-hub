import { notFound } from "next/navigation";
import { courses, getCourse } from "@/lib/courses";
import { getProvider, providers } from "@/lib/providers";
import { MARKET_LABELS } from "@/lib/course-types";
import { logoDataUrl, ogCard } from "@/lib/og";

// Share image for /courses/<id> — a standalone course or a multi-course
// provider. Built at build time for every listing.
export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return [...courses.map((c) => ({ id: c.id })), ...providers.map((p) => ({ id: p.id }))];
}

export async function GET(_req: Request, ctx: RouteContext<"/api/og/course/[id]">) {
  const { id } = await ctx.params;
  const course = getCourse(id);
  if (course) {
    const facts = [
      course.pricing[0]?.price ? `From ${course.pricing[0].price}` : null,
      course.markets.length ? course.markets.slice(0, 2).map((m) => MARKET_LABELS[m]).join(", ") : null,
      course.trustpilot ? `Trustpilot ${course.trustpilot.rating.toFixed(1)}` : null,
    ].filter((x): x is string => !!x);
    return ogCard({
      eyebrow: "Trading course",
      title: course.name,
      subtitle: course.tagline,
      facts,
      logo: logoDataUrl(course.logo),
      logoBg: course.logoBg,
      name: course.name,
      footer: "Ratings are Trustpilot's, not ours · we don't verify results",
    });
  }
  const provider = getProvider(id);
  if (!provider) notFound();
  return ogCard({
    eyebrow: "Course provider",
    title: provider.name,
    subtitle: provider.tagline,
    facts: [`${provider.courses.length} courses`],
    logo: logoDataUrl(provider.logo),
    logoBg: provider.logoBg,
    name: provider.name,
    footer: "Ratings are Trustpilot's, not ours · we don't verify results",
  });
}
