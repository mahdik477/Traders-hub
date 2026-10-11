import type { JSX, ReactNode } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BrokerReveal from "@/components/BrokerReveal";
import StickyVisitBar from "@/components/StickyVisitBar";
import ToolBackLink from "@/components/ToolBackLink";
import ToolLogo from "@/components/ToolLogo";
import VisitSiteLink from "@/components/VisitSiteLink";
import { InfoIcon, LayersIcon, MonitorIcon, TagIcon } from "@/components/icons";
import { TOOL_CATEGORY_LABELS, toolOutboundUrl, toolPriceLabel } from "@/lib/tool-types";
import { getTool, tools } from "@/lib/tools";

export const dynamicParams = false;

export function generateStaticParams() {
  return tools.map((tool) => ({ slug: tool.slug }));
}

export async function generateMetadata({ params }: PageProps<"/tools/[slug]">): Promise<Metadata> {
  const tool = getTool((await params).slug);
  if (!tool) return {};
  return {
    title: tool.name,
    description: tool.description,
  };
}

function SectionHeading({
  id,
  icon: Icon,
  children,
}: {
  id: string;
  icon: (p: { className?: string }) => JSX.Element;
  children: ReactNode;
}) {
  return (
    <h2 id={id} className="section-title flex items-center gap-2.5 scroll-mt-24">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent/12 text-accent">
        <Icon className="size-4" />
      </span>
      {children}
    </h2>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 bg-surface px-4 py-3 sm:px-5">
      <div className="eyebrow">{label}</div>
      <div className="mt-1 text-lg font-semibold tracking-tight text-foreground sm:text-xl">{value}</div>
    </div>
  );
}

export default async function ToolPage({ params }: PageProps<"/tools/[slug]">) {
  const tool = getTool((await params).slug);
  if (!tool) notFound();

  const visitHref = toolOutboundUrl(tool);
  const price = toolPriceLabel(tool);

  return (
    <>
      <ToolBackLink />

      <header className="detail-hero mt-5 overflow-hidden rounded-2xl border border-border bg-surface">
        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-start sm:p-6">
          <ToolLogo name={tool.name} logo={tool.logo} size="lg" priority />
          <div className="min-w-0 flex-1">
            <p className="pill">{TOOL_CATEGORY_LABELS[tool.category]}</p>
            <h1 className="page-title mt-3">{tool.name}</h1>
            <p className="mt-2 max-w-2xl text-base leading-relaxed text-muted">{tool.description}</p>
          </div>
          {visitHref && (
            <VisitSiteLink href={visitHref} firmName={tool.name} label="Visit tool" className="shrink-0 sm:self-start" />
          )}
        </div>

        <dl className="grid grid-cols-1 gap-px border-t border-border bg-border sm:grid-cols-3">
          <Stat label="Category" value={TOOL_CATEGORY_LABELS[tool.category]} />
          <Stat label="Price from" value={price ?? "Not listed"} />
          <Stat label="Platforms" value={tool.platforms.length ? String(tool.platforms.length) : "Not listed"} />
        </dl>
      </header>

      <BrokerReveal className="mt-10">
        <section aria-labelledby="about-heading" className="max-w-3xl">
          <SectionHeading id="about-heading" icon={InfoIcon}>
            About
          </SectionHeading>
          <p className="mt-3 leading-relaxed text-muted">{tool.description}</p>
        </section>
      </BrokerReveal>

      {tool.features.length > 0 && (
        <BrokerReveal className="mt-10">
          <section aria-labelledby="features-heading">
            <SectionHeading id="features-heading" icon={LayersIcon}>
              Key features
            </SectionHeading>
            <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {tool.features.map((feature) => (
                <li key={feature} className="rounded-xl border border-border bg-surface px-4 py-3 text-sm leading-relaxed">
                  {feature}
                </li>
              ))}
            </ul>
          </section>
        </BrokerReveal>
      )}

      <BrokerReveal className="mt-10">
        <section aria-labelledby="pricing-heading">
          <SectionHeading id="pricing-heading" icon={TagIcon}>
            Pricing
          </SectionHeading>
          {tool.plans.length === 0 ? (
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
              No price is listed here. We could not confirm a current figure on the official site.
            </p>
          ) : (
            <ul className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
              {tool.plans.map((plan) => (
                <li key={`${plan.name}-${plan.price}`} className="rounded-xl border border-border bg-surface p-4 sm:p-5">
                  <h3 className="text-sm font-semibold text-foreground">{plan.name}</h3>
                  <p className="mt-2 text-xl font-semibold tracking-tight text-foreground">{plan.price}</p>
                  {plan.detail && <p className="meta mt-2">{plan.detail}</p>}
                </li>
              ))}
            </ul>
          )}
          {tool.pricingNote && <p className="meta mt-4 max-w-3xl">{tool.pricingNote}</p>}
        </section>
      </BrokerReveal>

      {tool.platforms.length > 0 && (
        <BrokerReveal className="mt-10">
          <section aria-labelledby="platforms-heading">
            <SectionHeading id="platforms-heading" icon={MonitorIcon}>
              Platforms
            </SectionHeading>
            <ul className="mt-4 flex flex-wrap gap-2">
              {tool.platforms.map((platform) => (
                <li key={platform} className="pill">
                  {platform}
                </li>
              ))}
            </ul>
          </section>
        </BrokerReveal>
      )}

      <p className="meta mt-10 max-w-3xl">
        Prices, plan limits and offers change, and tax can be added at checkout. Confirm the current
        figures on {tool.name}&apos;s own site before you subscribe. This page does not score trading
        results.
      </p>

      {visitHref && (
        <div className="mt-12 rounded-xl border border-border bg-surface px-6 py-8 text-center">
          <h2 className="text-xl font-semibold tracking-tight">Open the tool&apos;s own site</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            Current pricing, trials and account signup stay on {tool.name}&apos;s website.
          </p>
          <VisitSiteLink href={visitHref} firmName={tool.name} label="Visit tool" className="mt-4" />
        </div>
      )}

      <StickyVisitBar
        courseName={tool.name}
        logo={tool.logo}
        price={price ? `From ${price}` : "Price not listed"}
        visitHref={visitHref}
        visitLabel="Visit tool"
      />
    </>
  );
}
