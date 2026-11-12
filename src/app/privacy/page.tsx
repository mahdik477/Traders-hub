import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME } from "@/lib/sections";
import PageIntro from "@/components/PageIntro";

export const metadata: Metadata = { title: "Privacy Policy" };

// Draft wording — have this reviewed by a lawyer before launch, same as
// /disclaimer. Written to match what the site actually does today:
//   * optional accounts (Supabase Auth: Google, email link or an optional
//     password, hashed by Supabase) storing only a
//     user id, an email address and an 18+ confirmation time;
//   * saved listings, comparisons, recently viewed, learning progress,
//     "what I'm using" ticks and per-firm alert preferences, kept in the browser and — when signed in —
//     on the person's own account rows;
//   * no emails are sent yet; the alert tick is a recorded preference only.
// Update this page the day any of that changes (an email tool, analytics…).
export default function PrivacyPage() {
  return (
    <div className="max-w-3xl">
      <PageIntro eyebrow="Legal" title={<>Privacy Policy</>} />
      <p className="meta mt-3">Last updated: 12 November 2026.</p>
      <p className="mt-3 rounded-lg border border-dashed border-danger/60 px-3 py-2 text-xs text-danger">
        Team reminder (remove before launch): have a lawyer review this page — UAE PDPL and UK/EU GDPR
        — before the site goes fully live, and replace the placeholder contact address at the bottom.
      </p>

      <div className="mt-8 space-y-8 text-muted">
        <section>
          <h2 className="section-title text-foreground">The short version</h2>
          <p className="mt-2">
            You can use everything on {SITE_NAME} without an account and without giving us any personal
            data. If you choose to sign in, we store the minimum needed to run your account: a user id,
            your email address, and the time you confirmed you are 18 or over — plus the things you
            choose to save or tick on the site, and a password if you choose to set one. We don&apos;t ask for or use names, photos, phone numbers or
            payment details (see the note about Google below), we don&apos;t sell your data, and we
            don&apos;t send marketing email.
          </p>
        </section>

        <section>
          <h2 className="section-title text-foreground">What we collect, and when</h2>
          <h3 className="mt-3 font-semibold text-foreground">Without an account</h3>
          <p className="mt-2">
            Nothing is sent to us. The site remembers a few preferences in your own browser&apos;s local
            storage so they&apos;re there next visit: your light/dark theme, the country you picked on
            Funded Accounts, listings you&apos;ve saved, pages you&apos;ve viewed recently, Learn parts and
            quizzes you&apos;ve marked done, any price-alert boxes you&apos;ve ticked, and the firms, brokers,
            courses and tools you&apos;ve marked as ones you use (&ldquo;I use this&rdquo;). That data never
            leaves your device unless you sign in; clearing your browser&apos;s site data removes it.
          </p>
          <h3 className="mt-4 font-semibold text-foreground">With an account</h3>
          <p className="mt-2">
            If you sign in (with Google, with a link we email you, or with a password you&apos;ve set), our account provider creates a
            user id for you and we store:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>your email address (from Google, or the one you typed);</li>
            <li>the date and time you ticked &ldquo;I&apos;m 18 or over&rdquo;;</li>
            <li>
              the same preferences listed above — saved listings, saved comparisons, recently viewed
              pages, learning progress, which firms you&apos;ve asked for price or promo alerts about,
              and the firms, brokers, courses and tools you&apos;ve marked as ones you use — so they follow
              you to other devices. &ldquo;I use this&rdquo; is something you tick yourself; we don&apos;t
              check it, count it across people or show it to anyone else.
            </li>
            <li>
              if you choose to set one, your password. Our account provider stores it in hashed form (it
              can&apos;t be read back, including by us); we never see, store or log it ourselves. Setting a
              password is optional — you can always sign in with Google or an email link instead.
            </li>
          </ul>
          <p className="mt-2">
            When you sign in with Google, Google also sends your display name and profile picture. Our
            sign-in provider (Supabase) keeps them, along with sign-in timestamps, in its own sign-in
            record for your account.{" "}
            <strong className="font-semibold text-foreground">
              We never copy them into our own tables and never display them
            </strong>
            , and they are deleted with everything else when you delete your account. We use the email
            address only.
          </p>
          <p className="mt-2">
            We don&apos;t use analytics cookies, advertising cookies or tracking pixels. The only cookies
            set are the ones that keep you signed in, plus one that remembers you chose &ldquo;Skip for
            now&rdquo; on the choose-a-password screen, so we don&apos;t ask again on every sign-in.
          </p>
        </section>

        <section>
          <h2 className="section-title text-foreground">Why we collect it, and our legal basis</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              <strong className="font-semibold text-foreground">Running your account</strong> — the user
              id, email and (if you set one) your password are what let you sign in and keep your saved
              items, progress and &ldquo;I use this&rdquo; ticks in sync. Legal basis:
              performance of a contract with you (GDPR Article 6(1)(b)).
            </li>
            <li>
              <strong className="font-semibold text-foreground">The 18+ confirmation</strong> — the site
              is for adults and we keep a record that you told us so. Legal basis: our legitimate
              interest in not offering accounts to children (Article 6(1)(f)).
            </li>
            <li>
              <strong className="font-semibold text-foreground">Price and promo alerts</strong> — the
              tick box on a firm&apos;s page is <em>unticked by default</em> and only records that you
              asked. <strong className="font-semibold text-foreground">No alert emails are sent yet.</strong>{" "}
              If and when we start sending them, they will go only to people who ticked the box, every
              email will carry an unsubscribe link, and we&apos;ll update this page first. Legal basis:
              your consent (Article 6(1)(a)), which you can withdraw by unticking the box or deleting
              your account.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="section-title text-foreground">Who else sees it</h2>
          <p className="mt-2">
            We don&apos;t sell, rent or trade your data to anyone. Two service providers process it on our
            behalf, only to the extent needed to do their job:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              <strong className="font-semibold text-foreground">Supabase</strong> hosts our account
              database and handles sign-in, including sending the sign-in, sign-up confirmation and password-reset
              emails, and storing your password in hashed form if you set one.
            </li>
            <li>
              <strong className="font-semibold text-foreground">Google</strong>, if you choose
              &ldquo;Continue with Google&rdquo;, tells us your email address and that you signed in.
              Google&apos;s own privacy policy covers what Google itself records.
            </li>
          </ul>
          <p className="mt-2">
            If we add an email-sending tool for alerts, we&apos;ll name it here the day we do. Our hosting
            provider (Vercel) serves the pages and sees ordinary web server logs such as IP addresses,
            as any website host does.
          </p>
        </section>

        <section>
          <h2 className="section-title text-foreground">How long we keep it</h2>
          <p className="mt-2">
            For as long as your account exists. Delete your account (see below) and everything about you
            is removed from our database immediately — the deletion cascades through every table. If
            you simply stop using the site, we may delete accounts that have been inactive for a long
            time; we&apos;ll say so here before we start doing that.
          </p>
        </section>

        <section>
          <h2 className="section-title text-foreground">Deleting your account</h2>
          <p className="mt-2">
            Open{" "}
            <Link href="/my-hub" className="text-accent hover:underline">
              My Hub
            </Link>{" "}
            while signed in and choose &ldquo;Delete my account&rdquo;. It asks you to confirm, then
            removes your user id, email, confirmation time and every saved item, comparison, progress
            tick and alert preference, the firms, brokers, courses and tools you&apos;ve marked as ones you
            use, and your password if you set one. There&apos;s no waiting period and nothing is kept in an archive.
            Anything stored only in your browser stays until you clear that browser&apos;s site data.
          </p>
        </section>

        <section>
          <h2 className="section-title text-foreground">Your rights</h2>
          <p className="mt-2">
            Under GDPR (and the UAE&apos;s PDPL, which gives you similar rights), you can ask us to:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>tell you what data of yours we hold (almost all of it is visible in My Hub);</li>
            <li>correct it, if it&apos;s wrong;</li>
            <li>delete it entirely (&ldquo;the right to be forgotten&rdquo; — see above, it&apos;s self-service);</li>
            <li>stop using it, without deleting it, in some cases;</li>
            <li>give you a copy of it in a portable format, if you want to take it elsewhere; and</li>
            <li>object to us using it, or withdraw your consent, at any time.</li>
          </ul>
          <p className="mt-2">
            To exercise any of these, contact us using the details below. We&apos;ll respond within 30
            days. If you&apos;re not satisfied with how we&apos;ve handled your request, you also have the
            right to complain to your local data protection authority.
          </p>
        </section>

        <section>
          <h2 className="section-title text-foreground">Children&apos;s privacy</h2>
          <p className="mt-2">
            {SITE_NAME} isn&apos;t directed at children, and accounts are for people aged 18 or over —
            we ask you to confirm this the first time you sign in. Choosing &ldquo;I&apos;m under 18&rdquo;
            deletes the account that was just created, email address included. If we learn an account
            belongs to someone under 18 we&apos;ll delete it.
          </p>
        </section>

        <section>
          <h2 className="section-title text-foreground">Security</h2>
          <p className="mt-2">
            Your data sits in a database where every table is protected by row-level security: a
            signed-in person can read and change only their own rows, and nobody can read anyone
            else&apos;s — including through the public key the website itself uses. Passwords are optional. If
            you set one, our account provider (Supabase) stores it only in hashed form: it can&apos;t be read
            back, including by us, and we never see or log it. You can always sign in with Google or a
            one-time email link instead.
          </p>
        </section>

        <section>
          <h2 className="section-title text-foreground">Changes to this policy</h2>
          <p className="mt-2">
            If what we collect or how we use it changes — for example when we start sending alert
            emails, or add analytics — we&apos;ll update this page and change the &ldquo;last updated&rdquo;
            date at the top.
          </p>
        </section>

        <section>
          <h2 className="section-title text-foreground">Contact us</h2>
          <p className="mt-2">
            For any question about this policy, or to exercise any of the rights above, contact us at{" "}
            <a href="mailto:privacy@tradox.io" className="text-accent hover:underline">
              privacy@tradox.io
            </a>
            . (Placeholder address — replace with the real contact inbox before launch.)
          </p>
        </section>
      </div>
    </div>
  );
}
