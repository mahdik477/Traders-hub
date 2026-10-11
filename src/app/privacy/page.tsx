import type { Metadata } from "next";
import { SITE_NAME } from "@/lib/sections";

export const metadata: Metadata = { title: "Privacy Policy" };

// Draft wording — have this reviewed by a lawyer before launch, same as
// /disclaimer. Written to match what the site actually does: we don't have
// any live signup form yet, so this describes the policy that will govern
// email collection once one exists, per CLAUDE.md ("email addresses only
// for now, unticked opt-in, every marketing email needs an unsubscribe
// link — UAE PDPL + GDPR"). Update this page the day a real form ships.
export default function PrivacyPage() {
  return (
    <div className="max-w-3xl">
      <h1 className="title-rule page-title">Privacy Policy</h1>
      <p className="meta mt-3">Last updated: 11 October 2026.</p>

      <div className="mt-8 space-y-8 text-muted">
        <section>
          <h2 className="section-title text-foreground">The short version</h2>
          <p className="mt-2">
            The only personal data {SITE_NAME} collects is your email
            address, and only if you choose to give it to us — for example
            by signing up to a newsletter or alert list, if and when we
            offer one. We don&apos;t collect names, phone numbers, payment
            details or any other personal information. We don&apos;t sell
            your email address, and we don&apos;t share it with anyone
            except a service we use to send emails on our behalf (see
            &ldquo;Who else sees it&rdquo; below).
          </p>
        </section>

        <section>
          <h2 className="section-title text-foreground">What we collect</h2>
          <p className="mt-2">
            Email address, and only when you type it into a form on this
            site and submit it yourself. We don&apos;t use tracking
            pixels, analytics cookies or any other method to collect your
            email without you giving it to us directly.
          </p>
          <p className="mt-2">
            The only thing we store automatically, without you submitting
            anything, is your light/dark theme preference, saved in your
            browser&apos;s local storage so the site remembers it next
            time you visit. That preference never leaves your device and
            we never see it.
          </p>
        </section>

        <section>
          <h2 className="section-title text-foreground">
            Why we collect it, and our legal basis
          </h2>
          <p className="mt-2">
            We use your email address only for what you signed up for —
            for example, to send you updates about new listings or
            trading-education content. Any signup form will have an
            unticked opt-in checkbox and will say clearly what you&apos;re
            signing up for before you submit it. Under UK/EU GDPR, our
            legal basis for this is your consent (Article 6(1)(a)). You
            can withdraw that consent at any time — see &ldquo;Your
            rights&rdquo; below.
          </p>
        </section>

        <section>
          <h2 className="section-title text-foreground">
            Who else sees it
          </h2>
          <p className="mt-2">
            We don&apos;t sell, rent or trade your email address to
            anyone. If we send marketing emails, we&apos;ll use a
            third-party email delivery service to do it — that&apos;s the
            only party your email address is shared with, and only to the
            extent needed to send you the email. We haven&apos;t set up an
            email tool yet; we&apos;ll name the provider here the day we
            do.
          </p>
        </section>

        <section>
          <h2 className="section-title text-foreground">
            How long we keep it
          </h2>
          <p className="mt-2">
            We keep your email address for as long as you stay subscribed.
            If you unsubscribe or ask us to delete it, we&apos;ll remove
            it from our active list within 30 days, except where we&apos;re
            required to keep a record of the unsubscribe itself to prove
            we honoured it.
          </p>
        </section>

        <section>
          <h2 className="section-title text-foreground">
            Unsubscribing
          </h2>
          <p className="mt-2">
            Every marketing email we send will include an unsubscribe
            link. Clicking it removes you from that list immediately — no
            need to contact us, though you&apos;re welcome to.
          </p>
        </section>

        <section>
          <h2 className="section-title text-foreground">Your rights</h2>
          <p className="mt-2">
            Under GDPR (and the UAE&apos;s PDPL, which gives you similar
            rights), you can ask us to:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>tell you what email address of yours we hold;</li>
            <li>correct it, if it&apos;s wrong;</li>
            <li>
              delete it entirely (&ldquo;the right to be forgotten&rdquo;);
            </li>
            <li>stop using it, without deleting it, in some cases;</li>
            <li>
              give you a copy of it in a portable format, if you want to
              take it elsewhere; and
            </li>
            <li>
              let you object to us using it, or withdraw your consent,
              at any time.
            </li>
          </ul>
          <p className="mt-2">
            To exercise any of these, contact us using the details below.
            We&apos;ll respond within 30 days. If you&apos;re not satisfied
            with how we&apos;ve handled your request, you also have the
            right to complain to your local data protection authority.
          </p>
        </section>

        <section>
          <h2 className="section-title text-foreground">
            Children&apos;s privacy
          </h2>
          <p className="mt-2">
            {SITE_NAME} isn&apos;t directed at children, and we don&apos;t
            knowingly collect data from anyone under 18.
          </p>
        </section>

        <section>
          <h2 className="section-title text-foreground">
            Changes to this policy
          </h2>
          <p className="mt-2">
            If what we collect or how we use it changes — for example,
            once we actually set up a newsletter tool — we&apos;ll update
            this page and change the &ldquo;last updated&rdquo; date at
            the top.
          </p>
        </section>

        <section>
          <h2 className="section-title text-foreground">Contact us</h2>
          <p className="mt-2">
            For any question about this policy, or to exercise any of the
            rights above, contact us at{" "}
            <a
              href="mailto:privacy@tradox.io"
              className="text-accent hover:underline"
            >
              privacy@tradox.io
            </a>
            . (Placeholder address — replace with the real contact inbox
            before launch.)
          </p>
        </section>
      </div>
    </div>
  );
}
