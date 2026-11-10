"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Bell, Bookmark, Clock, GraduationCap, LogOut, Columns3 } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { loadCatalog, getCachedCatalog } from "@/lib/catalog-client";
import { CATALOG_KIND_LABELS, CATALOG_KIND_ORDER, type CatalogItem, type CatalogKind } from "@/lib/catalog-types";
import {
  COMPARISON_PATHS,
  alertsStore,
  comparisonsStore,
  recentsStore,
  savedStore,
  setAlertPref,
  toggleComparison,
  toggleSaved,
  type SavedKind,
} from "@/lib/local-store";
import { useProgress } from "@/lib/progress-store";
import { LEARN_TOPICS } from "@/lib/learn-topics";
import { CheckIcon, ChevronRightIcon } from "@/components/icons";

// My Hub: everything a visitor has saved, compared, viewed or ticked off, in
// one place. Works with no account (browser data) and shows the same data
// synced when signed in. Names and links come from the static catalogue so
// the page itself carries no listing data.

const SECTION_ICON = {
  saved: Bookmark,
  comparisons: Columns3,
  recent: Clock,
  progress: GraduationCap,
  alerts: Bell,
} as const;

export default function MyHub({ quizCount, firmNames }: { quizCount: number; firmNames: Record<string, string> }) {
  const { status, user, supabase, signOut } = useAuth();
  const saved = savedStore.use();
  const recents = recentsStore.use();
  const comparisons = comparisonsStore.use();
  const alerts = alertsStore.use();
  const progress = useProgress();
  const [catalog, setCatalog] = useState<CatalogItem[] | null>(getCachedCatalog());
  const [catalogFailed, setCatalogFailed] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (!getCachedCatalog()) loadCatalog().then(setCatalog, () => setCatalogFailed(true));
  }, []);

  const lookup = useMemo(() => new Map((catalog ?? []).map((c) => [`${c.kind}:${c.id}`, c])), [catalog]);
  const resolve = (kind: string, id: string) => lookup.get(`${kind}:${id}`) ?? null;

  const savedByKind = CATALOG_KIND_ORDER.map((kind) => ({
    kind,
    items: saved.filter((s) => s.kind === kind),
  })).filter((g) => g.items.length > 0);

  const learnDone = LEARN_TOPICS.filter((t) => progress.some((p) => p.kind === "learn" && p.id === t.slug)).length;
  const quizDone = progress.filter((p) => p.kind === "quiz").length;
  const optedIn = alerts.filter((a) => a.optedIn);
  const isEmpty = saved.length === 0 && recents.length === 0 && comparisons.length === 0 && progress.length === 0 && optedIn.length === 0;

  async function deleteAccount() {
    if (!supabase) return;
    setDeleting(true);
    setDeleteError(null);
    const { error } = await supabase.rpc("delete_my_account");
    if (error) {
      setDeleteError("We couldn't delete the account just now. Try again, or email us (see the privacy policy).");
      setDeleting(false);
      return;
    }
    await signOut();
    setDeleting(false);
    setConfirmDelete(false);
  }

  return (
    <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_20rem]">
      <div className="space-y-8">
        {isEmpty && (
          <div className="rounded-2xl border border-dashed border-border-strong p-8 text-center">
            <p className="text-lg font-semibold text-foreground">Nothing here yet</p>
            <p className="mt-2 text-muted">
              Tap the bookmark on any firm, course, broker, tool, signal group or strategy to save it. Mark Learn
              parts and quizzes done and they&apos;ll show up here too.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <Link href="/funded-accounts" className="btn btn-primary">
                Browse prop firms
              </Link>
              <Link href="/start-here" className="btn btn-outline">
                Start the guided path
              </Link>
            </div>
          </div>
        )}

        {/* Saved listings */}
        {saved.length > 0 && (
          <Section icon={SECTION_ICON.saved} title="Saved listings" count={saved.length}>
            {catalogFailed && <p className="meta">Couldn&apos;t load listing names — links still work.</p>}
            <div className="space-y-5">
              {savedByKind.map((g) => (
                <div key={g.kind}>
                  <p className="eyebrow mb-2">{CATALOG_KIND_LABELS[g.kind]}</p>
                  <ul className="divide-y divide-border rounded-xl border border-border">
                    {g.items.map((s) => (
                      <ItemRow
                        key={`${s.kind}:${s.id}`}
                        item={resolve(s.kind, s.id)}
                        fallback={{ kind: s.kind, id: s.id }}
                        loading={!catalog && !catalogFailed}
                        action={
                          <button
                            type="button"
                            onClick={() => toggleSaved(s.kind as SavedKind, s.id)}
                            className="text-xs text-muted underline hover:text-foreground"
                          >
                            Remove
                          </button>
                        }
                      />
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Saved comparisons */}
        {comparisons.length > 0 && (
          <Section icon={SECTION_ICON.comparisons} title="Saved comparisons" count={comparisons.length}>
            <ul className="divide-y divide-border rounded-xl border border-border">
              {comparisons.map((c) => (
                <li key={`${c.kind}:${c.query}`} className="flex items-center gap-3 p-3">
                  <Link href={`${COMPARISON_PATHS[c.kind]}${c.query}`} className="min-w-0 flex-1 hover:text-accent">
                    <span className="block truncate font-semibold">{c.title || "Comparison"}</span>
                    <span className="meta block capitalize">{c.kind}</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => toggleComparison(c.kind, c.query, c.title)}
                    className="text-xs text-muted underline hover:text-foreground"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Learning progress */}
        {progress.length > 0 && (
          <Section icon={SECTION_ICON.progress} title="Learning progress">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <ProgressCard
                label="Learn"
                done={learnDone}
                total={LEARN_TOPICS.length}
                noun="parts"
                href="/learn"
              />
              <ProgressCard label="Strategy quizzes" done={quizDone} total={quizCount} noun="quizzes" href="/strategies" />
            </div>
            <ul className="mt-4 flex flex-wrap gap-2">
              {progress
                .slice()
                .sort((a, b) => b.doneAt.localeCompare(a.doneAt))
                .slice(0, 12)
                .map((p) => {
                  const item = resolve(p.kind === "learn" ? "learn" : "strategy", p.id);
                  return (
                    <li key={`${p.kind}:${p.id}`}>
                      <Link
                        href={item?.href ?? (p.kind === "learn" ? `/learn/${p.id}` : `/strategies/${p.id}`)}
                        className="badge badge-success inline-flex items-center gap-1 hover:underline"
                      >
                        <CheckIcon className="size-3" />
                        {item?.title ?? p.id}
                      </Link>
                    </li>
                  );
                })}
            </ul>
          </Section>
        )}

        {/* Alerts */}
        {optedIn.length > 0 && (
          <Section icon={SECTION_ICON.alerts} title="Price & promo alerts" count={optedIn.length}>
            <p className="meta mb-3">
              Firms you&apos;ve asked to hear about. No emails go out yet — this is the consented list for when
              alerts launch.
            </p>
            <ul className="divide-y divide-border rounded-xl border border-border">
              {optedIn.map((a) => (
                <ItemRow
                  key={a.firmId}
                  item={resolve("firm", a.firmId)}
                  fallback={{ kind: "firm", id: a.firmId, title: firmNames[a.firmId] }}
                  loading={!catalog && !catalogFailed}
                  action={
                    <button type="button" onClick={() => setAlertPref(a.firmId, false)} className="text-xs text-muted underline hover:text-foreground">
                      Turn off
                    </button>
                  }
                />
              ))}
            </ul>
          </Section>
        )}

        {/* Recently viewed */}
        {recents.length > 0 && (
          <Section icon={SECTION_ICON.recent} title="Recently viewed" count={recents.length}>
            <ul className="divide-y divide-border rounded-xl border border-border">
              {recents.slice(0, 12).map((r) => (
                <ItemRow
                  key={`${r.kind}:${r.id}`}
                  item={resolve(r.kind, r.id)}
                  fallback={{ kind: r.kind, id: r.id }}
                  loading={!catalog && !catalogFailed}
                  action={<span className="meta whitespace-nowrap">{relativeTime(r.viewedAt)}</span>}
                />
              ))}
            </ul>
            <button type="button" onClick={() => recentsStore.set([])} className="mt-3 text-xs text-muted underline hover:text-foreground">
              Clear history
            </button>
          </Section>
        )}
      </div>

      {/* Account column */}
      <aside className="lg:sticky lg:top-28 lg:self-start">
        <div className="rounded-2xl border border-border bg-surface p-5">
          <p className="eyebrow">Account</p>
          {status === "disabled" && (
            <>
              <p className="mt-2 text-sm text-foreground">Accounts aren&apos;t switched on yet.</p>
              <p className="meta mt-2">Everything on this page is stored in this browser only. Clearing site data removes it.</p>
            </>
          )}
          {status === "loading" && <div className="skeleton mt-3 h-10 rounded-lg" />}
          {status === "signed-out" && (
            <>
              <p className="mt-2 text-sm text-foreground">You&apos;re browsing without an account.</p>
              <p className="meta mt-2">
                Everything here lives in this browser. Sign in and it&apos;s kept on your account too, so it follows
                you to your phone.
              </p>
              <Link href="/sign-in?next=/my-hub" className="btn btn-primary mt-4 w-full">
                Sign in
              </Link>
            </>
          )}
          {status === "signed-in" && user && (
            <>
              <p className="mt-2 truncate text-sm font-semibold text-foreground" title={user.email ?? undefined}>
                {user.email}
              </p>
              <p className="meta mt-1">Saved items, progress and preferences sync to this account.</p>
              <button type="button" onClick={() => signOut()} className="btn btn-outline mt-4 w-full">
                <LogOut className="size-4" aria-hidden="true" />
                Sign out
              </button>

              <div className="mt-6 border-t border-border pt-4">
                <p className="eyebrow">Your data</p>
                <p className="meta mt-2">
                  We hold your user id, email, the time you confirmed you&apos;re 18+, and what&apos;s on this page.
                  Deleting your account removes all of it, permanently.
                </p>
                {!confirmDelete ? (
                  <button type="button" onClick={() => setConfirmDelete(true)} className="mt-3 text-xs text-danger underline">
                    Delete my account
                  </button>
                ) : (
                  <div className="mt-3 rounded-lg border border-danger/40 bg-danger/10 p-3">
                    <p className="text-sm font-semibold text-foreground">Delete everything? This can&apos;t be undone.</p>
                    <p className="meta mt-1">Your browser copy of saved items stays until you clear site data.</p>
                    {deleteError && (
                      <p role="alert" className="mt-2 text-xs text-danger">
                        {deleteError}
                      </p>
                    )}
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        disabled={deleting}
                        onClick={deleteAccount}
                        className="btn min-h-10 flex-1 border-danger bg-danger text-white hover:bg-danger/90 disabled:opacity-60"
                      >
                        {deleting ? "Deleting…" : "Yes, delete"}
                      </button>
                      <button type="button" disabled={deleting} onClick={() => setConfirmDelete(false)} className="btn btn-outline min-h-10 flex-1">
                        Keep it
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
          <p className="meta mt-4">
            <Link href="/privacy" className="text-accent underline">
              Privacy policy
            </Link>
          </p>
        </div>
      </aside>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  count,
  children,
}: {
  icon: (p: { className?: string }) => React.ReactNode;
  title: string;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="section-title flex items-center gap-2.5">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent/12 text-accent">
          <Icon className="size-4" />
        </span>
        {title}
        {count != null && <span className="pill ml-1">{count}</span>}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function ItemRow({
  item,
  fallback,
  loading,
  action,
}: {
  item: CatalogItem | null;
  fallback: { kind: string; id: string; title?: string };
  loading: boolean;
  action: React.ReactNode;
}) {
  const href = item?.href ?? fallbackHref(fallback.kind, fallback.id);
  const title = item?.title ?? fallback.title ?? fallback.id;
  return (
    <li className="flex items-center gap-3 p-3">
      {item?.logo ? (
        <span className={`flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border p-1 ${item.logoBg === "dark" ? "bg-black" : "bg-white"}`}>
          <Image src={item.logo} alt="" width={40} height={40} className="size-full object-contain" />
        </span>
      ) : (
        <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-xs font-bold uppercase text-muted">
          {loading ? "" : title.slice(0, 2)}
        </span>
      )}
      <Link href={href} className="group min-w-0 flex-1 hover:text-accent">
        {loading && !item ? (
          <span className="skeleton block h-4 w-40 rounded" />
        ) : (
          <>
            <span className="block truncate font-semibold">{title}</span>
            {item?.subtitle && <span className="meta block truncate">{item.subtitle}</span>}
          </>
        )}
      </Link>
      {action}
      <ChevronRightIcon className="size-4 shrink-0 text-subtle" />
    </li>
  );
}

function fallbackHref(kind: string, id: string): string {
  const base: Record<string, string> = {
    firm: "/funded-accounts",
    course: "/courses",
    broker: "/brokers",
    tool: "/tools",
    signal: "/signal-groups",
    strategy: "/strategies",
    learn: "/learn",
  };
  return `${base[kind as CatalogKind] ?? ""}/${id}`;
}

function ProgressCard({ label, done, total, noun, href }: { label: string; done: number; total: number; noun: string; href: string }) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  return (
    <Link href={href} className="lift-card block rounded-xl border border-border bg-surface p-4">
      <p className="eyebrow">{label}</p>
      <p className="mt-1 text-lg font-semibold text-foreground">
        {done} of {total} {noun}
      </p>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-2" aria-hidden="true">
        <div className="path-progress h-full rounded-full bg-success" style={{ width: `${pct}%` }} />
      </div>
    </Link>
  );
}

function relativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.round(ms / 60_000);
  if (mins < 2) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return days === 1 ? "yesterday" : `${days} days ago`;
}
