"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Bell, Bookmark, Briefcase, Clock, Columns3, GraduationCap, KeyRound, LineChart, LogOut, ShieldCheck } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import PasswordForm from "@/components/auth/PasswordForm";
import { loadCatalog, getCachedCatalog } from "@/lib/catalog-client";
import { CATALOG_KIND_LABELS, CATALOG_KIND_ORDER, type CatalogItem, type CatalogKind } from "@/lib/catalog-types";
import {
  COMPARISON_PATHS,
  alertsStore,
  comparisonsStore,
  recentsStore,
  savedStore,
  setAlertPref,
  stackStore,
  toggleComparison,
  toggleSaved,
  toggleStack,
  type SavedKind,
  type StackKind,
} from "@/lib/local-store";
import { useProgress } from "@/lib/progress-store";
import { LEARN_TOPICS } from "@/lib/learn-topics";
import { CheckIcon, ChevronRightIcon } from "@/components/icons";

// My Hub: a person's own dashboard — who they're signed in as, where they
// are in the Learn course, which strategies they're learning, what they use
// (firms, brokers, courses, tools they ticked themselves), and everything
// they've saved or looked at. Works with no account (browser data) and shows
// the same data synced when signed in. Names and links come from the static
// catalogue so the page itself carries no listing data.

const STACK_GROUPS: { kind: StackKind; title: string; empty: string; browse: string }[] = [
  { kind: "firm", title: "Funded accounts", empty: "No prop firms yet", browse: "/funded-accounts" },
  { kind: "broker", title: "Brokers", empty: "No brokers yet", browse: "/brokers" },
  { kind: "course", title: "Courses", empty: "No courses yet", browse: "/courses" },
  { kind: "tool", title: "Tools", empty: "No tools yet", browse: "/tools" },
];

export default function MyHub({ quizCount, firmNames }: { quizCount: number; firmNames: Record<string, string> }) {
  const { status, user, supabase, signOut } = useAuth();
  const saved = savedStore.use();
  const recents = recentsStore.use();
  const comparisons = comparisonsStore.use();
  const alerts = alertsStore.use();
  const stack = stackStore.use();
  const progress = useProgress();
  const [catalog, setCatalog] = useState<CatalogItem[] | null>(getCachedCatalog());
  const [catalogFailed, setCatalogFailed] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (!getCachedCatalog()) loadCatalog().then(setCatalog, () => setCatalogFailed(true));
  }, []);

  const lookup = useMemo(() => new Map((catalog ?? []).map((c) => [`${c.kind}:${c.id}`, c])), [catalog]);
  const resolve = (kind: string, id: string) => lookup.get(`${kind}:${id}`) ?? null;
  const loading = !catalog && !catalogFailed;

  const savedByKind = CATALOG_KIND_ORDER.map((kind) => ({ kind, items: saved.filter((s) => s.kind === kind) })).filter(
    (g) => g.items.length > 0,
  );

  const learnDoneSet = new Set(progress.filter((p) => p.kind === "learn").map((p) => p.id));
  const learnDone = LEARN_TOPICS.filter((t) => learnDoneSet.has(t.slug)).length;
  const nextTopicIndex = LEARN_TOPICS.findIndex((t) => !learnDoneSet.has(t.slug));
  const quizDoneSet = new Set(progress.filter((p) => p.kind === "quiz").map((p) => p.id));

  // "Strategies you're learning": any strategy whose quiz is done or that was
  // opened recently, newest first.
  const strategyIds = useMemo(() => {
    const ids: string[] = [];
    for (const r of recents) if (r.kind === "strategy" && !ids.includes(r.id)) ids.push(r.id);
    for (const p of progress) if (p.kind === "quiz" && !ids.includes(p.id)) ids.push(p.id);
    return ids;
  }, [recents, progress]);

  const optedIn = alerts.filter((a) => a.optedIn);

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

  const signedIn = status === "signed-in" && user;

  return (
    <div className="mt-6 space-y-8">
      {/* ---- Profile ---------------------------------------------------- */}
      <section aria-label="Your account" className="kit-panel p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-4">
          <span aria-hidden="true" className="avatar-gold size-12 text-xl sm:size-16 sm:text-2xl">
            {signedIn ? (user.email ?? "?").charAt(0).toUpperCase() : "?"}
          </span>
          <div className="min-w-[11rem] flex-1">
            {status === "loading" ? (
              <div className="skeleton h-12 w-64 rounded-lg" />
            ) : signedIn ? (
              <>
                <p className="readout">Signed in</p>
                <p className="truncate text-xl font-semibold text-foreground sm:text-2xl" title={user.email ?? undefined}>
                  {user.email}
                </p>
                <p className="meta mt-0.5">
                  {user.provider === "google" ? "Google account" : "Email account"}
                  {user.hasPassword && " · password set"}
                  {user.createdAt && ` · member since ${new Date(user.createdAt).toLocaleDateString("en-GB", { month: "long", year: "numeric" })}`}
                </p>
              </>
            ) : (
              <>
                <p className="readout">{status === "disabled" ? "Accounts off" : "Not signed in"}</p>
                <p className="text-xl font-semibold text-foreground">Browsing without an account</p>
                <p className="meta mt-0.5">
                  {status === "disabled"
                    ? "Everything here is stored in this browser only."
                    : "Everything here lives in this browser. Sign in to keep it on any device."}
                </p>
              </>
            )}
          </div>
          {signedIn ? (
            <button type="button" onClick={() => signOut()} className="btn btn-outline w-full sm:w-auto">
              <LogOut className="size-4" aria-hidden="true" />
              Sign out
            </button>
          ) : (
            status === "signed-out" && (
              <Link href="/sign-in?next=/my-hub" className="btn btn-primary w-full sm:w-auto">
                Sign in
              </Link>
            )
          )}
        </div>

        <dl className="stat-strip mt-5 grid-cols-2 sm:grid-cols-4">
          <Stat label="Learn" value={`${learnDone} / ${LEARN_TOPICS.length}`} />
          <Stat label="Quizzes done" value={`${quizDoneSet.size} / ${quizCount}`} />
          <Stat label="Saved" value={String(saved.length)} />
          <Stat label="Using" value={String(stack.length)} />
        </dl>
      </section>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-8">
          {/* ---- Learn: the 9 parts ------------------------------------- */}
          <Section icon={GraduationCap} title="Learn to trade — the 9 parts" count={`${learnDone}/${LEARN_TOPICS.length}`}>
            <ol className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {LEARN_TOPICS.map((t, i) => {
                const done = learnDoneSet.has(t.slug);
                const isNext = i === nextTopicIndex;
                return (
                  <li key={t.slug}>
                    <Link
                      href={`/learn/${t.slug}`}
                      className={`learn-step ${done ? "is-done" : ""} ${isNext ? "is-next" : ""}`}
                      aria-label={`Part ${i + 1}: ${t.title}${done ? " (done)" : isNext ? " (up next)" : ""}`}
                    >
                      <span className="learn-step-dot" aria-hidden="true">
                        {done ? <CheckIcon className="size-3.5" /> : i + 1}
                      </span>
                      <span className="min-w-0 truncate text-sm font-medium">{t.shortTitle}</span>
                    </Link>
                  </li>
                );
              })}
            </ol>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              {nextTopicIndex >= 0 ? (
                <Link href={`/learn/${LEARN_TOPICS[nextTopicIndex].slug}`} className="btn btn-primary">
                  {learnDone === 0 ? "Start with part 1" : `Continue with part ${nextTopicIndex + 1}`}
                  <ChevronRightIcon className="size-4" />
                </Link>
              ) : (
                <p className="badge badge-success">All 9 parts done</p>
              )}
              <span className="meta">
                {nextTopicIndex >= 0 ? `Up next: ${LEARN_TOPICS[nextTopicIndex].title} · ${LEARN_TOPICS[nextTopicIndex].readMinutes} min` : "Revisit any part from the list above."}
              </span>
            </div>
          </Section>

          {/* ---- Strategies ---------------------------------------------- */}
          <Section icon={LineChart} title="Strategies you're learning" count={strategyIds.length || undefined}>
            {strategyIds.length === 0 ? (
              <Empty text="Open any strategy to start — each has a live chart and a short quiz." href="/strategies" action="Browse strategies" />
            ) : (
              <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border">
                {strategyIds.slice(0, 10).map((id) => (
                  <ItemRow
                    key={id}
                    item={resolve("strategy", id)}
                    fallback={{ kind: "strategy", id }}
                    loading={loading}
                    action={
                      quizDoneSet.has(id) ? (
                        <span className="badge badge-success inline-flex items-center gap-1 whitespace-nowrap">
                          <CheckIcon className="size-3" />
                          Quiz done
                        </span>
                      ) : (
                        <span className="meta whitespace-nowrap">In progress</span>
                      )
                    }
                  />
                ))}
              </ul>
            )}
          </Section>

          {/* ---- What I'm using ------------------------------------------ */}
          <Section icon={Briefcase} title="What I'm using" count={stack.length || undefined}>
            <p className="meta mb-3">
              Firms, brokers, courses and tools you&apos;ve ticked on their pages. Only you see this — we don&apos;t check it
              or share it.
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {STACK_GROUPS.map((g) => {
                const items = stack.filter((s) => s.kind === g.kind);
                return (
                  <div key={g.kind} className="kit-panel p-4">
                    <p className="eyebrow">{g.title}</p>
                    {items.length === 0 ? (
                      <p className="mt-2 text-sm text-muted">
                        {g.empty}.{" "}
                        <Link href={g.browse} className="text-accent underline">
                          Browse
                        </Link>
                      </p>
                    ) : (
                      <ul className="mt-2 divide-y divide-border">
                        {items.map((s) => (
                          <ItemRow
                            key={s.id}
                            compact
                            item={resolve(s.kind, s.id)}
                            fallback={{ kind: s.kind, id: s.id, title: s.kind === "firm" ? firmNames[s.id] : undefined }}
                            loading={loading}
                            action={
                              <button
                                type="button"
                                onClick={() => toggleStack(s.kind, s.id)}
                                className="inline-flex min-h-11 items-center text-xs text-muted underline hover:text-foreground"
                              >
                                Remove
                              </button>
                            }
                          />
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </Section>

          {/* ---- Saved listings ------------------------------------------ */}
          <Section icon={Bookmark} title="Saved listings" count={saved.length || undefined}>
            {saved.length === 0 ? (
              <Empty text="Tap the bookmark on any firm, course, broker, tool, signal group or strategy to save it here." href="/funded-accounts" action="Browse prop firms" />
            ) : (
              <>
                {catalogFailed && <p className="meta mb-2">Couldn&apos;t load listing names — links still work.</p>}
                <div className="space-y-5">
                  {savedByKind.map((g) => (
                    <div key={g.kind}>
                      <p className="eyebrow mb-2">{CATALOG_KIND_LABELS[g.kind]}</p>
                      <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border">
                        {g.items.map((s) => (
                          <ItemRow
                            key={`${s.kind}:${s.id}`}
                            item={resolve(s.kind, s.id)}
                            fallback={{ kind: s.kind, id: s.id }}
                            loading={loading}
                            action={
                              <button
                                type="button"
                                onClick={() => toggleSaved(s.kind as SavedKind, s.id)}
                                className="inline-flex min-h-11 items-center text-xs text-muted underline hover:text-foreground"
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
              </>
            )}
          </Section>

          {/* ---- Saved comparisons --------------------------------------- */}
          {comparisons.length > 0 && (
            <Section icon={Columns3} title="Saved comparisons" count={comparisons.length}>
              <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border">
                {comparisons.map((c) => (
                  <li key={`${c.kind}:${c.query}`} className="flex items-center gap-3 p-3">
                    <Link href={`${COMPARISON_PATHS[c.kind]}${c.query}`} className="min-w-0 flex-1 hover:text-accent">
                      <span className="block truncate font-semibold">{c.title || "Comparison"}</span>
                      <span className="meta block capitalize">{c.kind}</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => toggleComparison(c.kind, c.query, c.title)}
                      className="inline-flex min-h-11 items-center text-xs text-muted underline hover:text-foreground"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {/* ---- Alerts --------------------------------------------------- */}
          {optedIn.length > 0 && (
            <Section icon={Bell} title="Price & promo alerts" count={optedIn.length}>
              <p className="meta mb-3">
                Firms you&apos;ve asked to hear about. No emails go out yet — this is the consented list for when alerts
                launch.
              </p>
              <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border">
                {optedIn.map((a) => (
                  <ItemRow
                    key={a.firmId}
                    item={resolve("firm", a.firmId)}
                    fallback={{ kind: "firm", id: a.firmId, title: firmNames[a.firmId] }}
                    loading={loading}
                    action={
                      <button
                        type="button"
                        onClick={() => setAlertPref(a.firmId, false)}
                        className="inline-flex min-h-11 items-center text-xs text-muted underline hover:text-foreground"
                      >
                        Turn off
                      </button>
                    }
                  />
                ))}
              </ul>
            </Section>
          )}

          {/* ---- Recently viewed ------------------------------------------ */}
          {recents.length > 0 && (
            <Section icon={Clock} title="Recently viewed" count={recents.length}>
              <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border">
                {recents.slice(0, 12).map((r) => (
                  <ItemRow
                    key={`${r.kind}:${r.id}`}
                    item={resolve(r.kind, r.id)}
                    fallback={{ kind: r.kind, id: r.id }}
                    loading={loading}
                    action={<span className="meta whitespace-nowrap">{relativeTime(r.viewedAt)}</span>}
                  />
                ))}
              </ul>
              <button type="button" onClick={() => recentsStore.set([])} className="mt-3 inline-flex min-h-11 items-center text-xs text-muted underline hover:text-foreground">
                Clear history
              </button>
            </Section>
          )}
        </div>

        {/* ---- Account column ------------------------------------------- */}
        <aside className="space-y-4 lg:sticky lg:top-28 lg:self-start">
          {signedIn && (
            <div className="kit-panel p-5">
              <p className="flex items-center gap-2 font-semibold text-foreground">
                <KeyRound className="size-4 text-accent" aria-hidden="true" />
                Password
              </p>
              {user.hasPassword && !changingPassword ? (
                <>
                  <p className="meta mt-2">Set. You can sign in with your email and password, Google or an email link.</p>
                  <button type="button" onClick={() => setChangingPassword(true)} className="btn btn-outline mt-3 w-full">
                    Change password
                  </button>
                </>
              ) : (
                <>
                  <p className="meta mt-2 mb-3">
                    {user.hasPassword
                      ? "Choose a new password."
                      : "Optional. Add one to sign in without waiting for an email."}
                  </p>
                  <PasswordForm submitLabel={user.hasPassword ? "Save new password" : "Add password"} />
                  {changingPassword && (
                    <button type="button" onClick={() => setChangingPassword(false)} className="mt-2 inline-flex min-h-11 items-center text-xs text-muted underline">
                      Cancel
                    </button>
                  )}
                </>
              )}
            </div>
          )}

          <div className="kit-panel p-5">
            <p className="flex items-center gap-2 font-semibold text-foreground">
              <ShieldCheck className="size-4 text-accent" aria-hidden="true" />
              Your data
            </p>
            {signedIn ? (
              <>
                <p className="meta mt-2">
                  We hold your user id, email, the time you confirmed you&apos;re 18+, and what&apos;s on this page. If you set
                  a password, our account provider stores it hashed — we never see it. Deleting your account removes all of
                  it, permanently.
                </p>
                {!confirmDelete ? (
                  <button type="button" onClick={() => setConfirmDelete(true)} className="mt-3 inline-flex min-h-11 items-center text-xs text-danger underline">
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
              </>
            ) : (
              <p className="meta mt-2">Everything on this page is stored in this browser only. Clearing site data removes it.</p>
            )}
            <p className="meta mt-4">
              <Link href="/privacy" className="text-accent underline">
                Privacy policy
              </Link>
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat-cell">
      <dt className="eyebrow">{label}</dt>
      <dd className="stat-value">{value}</dd>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  count,
  children,
}: {
  icon: (p: { className?: string }) => ReactNode;
  title: string;
  count?: number | string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2 className="section-title flex items-center gap-2.5">
        <span className="icon-chip" aria-hidden="true">
          <Icon className="size-4" />
        </span>
        {title}
        {count != null && <span className="pill ml-1 font-mono">{count}</span>}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Empty({ text, href, action }: { text: string; href: string; action: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border-strong p-5">
      <p className="text-sm text-muted">{text}</p>
      <Link href={href} className="btn btn-outline mt-3">
        {action}
      </Link>
    </div>
  );
}

function ItemRow({
  item,
  fallback,
  loading,
  action,
  compact = false,
}: {
  item: CatalogItem | null;
  fallback: { kind: string; id: string; title?: string };
  loading: boolean;
  action: ReactNode;
  compact?: boolean;
}) {
  const href = item?.href ?? fallbackHref(fallback.kind, fallback.id);
  const title = item?.title ?? fallback.title ?? fallback.id;
  return (
    <li className={`flex items-center gap-3 ${compact ? "py-1.5" : "p-3"}`}>
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
            {item?.subtitle && !compact && <span className="meta block truncate">{item.subtitle}</span>}
          </>
        )}
      </Link>
      {action}
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
