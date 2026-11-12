"use client";

import { useEffect, useState } from "react";
import Picker from "@/components/Picker";
import { MapPin } from "lucide-react";
import { countryName, countryOptions, isCountryCode } from "@/lib/countries";

// "Available where I live" — a country picker that remembers itself in the
// browser (and in the address, so a filtered list can be shared). The
// directory uses the value to set aside firms whose own published list
// blocks that country. Reads only what the firms publish; we don't verify it.

const STORAGE_KEY = "tradox:country";
const QUERY_KEY = "country";

function readInitial(): string {
  try {
    const fromUrl = new URLSearchParams(window.location.search).get(QUERY_KEY);
    if (isCountryCode(fromUrl)) return fromUrl;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isCountryCode(stored)) return stored;
  } catch {
    // Storage blocked — the switch just starts empty.
  }
  return "";
}

/** The visitor's chosen country code ("" = not set), kept in localStorage
 *  and mirrored into ?country= without a reload. */
export function useCountry(): [string, (code: string) => void] {
  const [country, setCountryState] = useState("");

  useEffect(() => {
    // localStorage / the address only exist in the browser, so this is the
    // one unavoidable post-mount read (same pattern as StrategyWalkthrough).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCountryState(readInitial());
  }, []);

  function setCountry(code: string) {
    const next = isCountryCode(code) ? code : "";
    setCountryState(next);
    try {
      if (next) window.localStorage.setItem(STORAGE_KEY, next);
      else window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Fine — it just won't be remembered next visit.
    }
    const params = new URLSearchParams(window.location.search);
    if (next) params.set(QUERY_KEY, next);
    else params.delete(QUERY_KEY);
    const qs = params.toString();
    window.history.replaceState(null, "", window.location.pathname + (qs ? `?${qs}` : ""));
  }

  return [country, setCountry];
}

/** "AE" → 🇦🇪 (two regional-indicator letters). */
export function flagEmoji(code: string): string {
  if (!/^[A-Za-z]{2}$/.test(code)) return "🏳️";
  return String.fromCodePoint(...[...code.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}

export default function CountrySwitch({
  country,
  onChange,
  hiddenCount,
  unknownCount,
}: {
  country: string;
  onChange: (code: string) => void;
  hiddenCount: number;
  unknownCount: number;
}) {
  const [options, setOptions] = useState<{ code: string; name: string }[]>([]);
  useEffect(() => {
    // Country names come from the browser's own Intl tables.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOptions(countryOptions());
  }, []);

  return (
    <div
      className={`country-switch mb-3 flex flex-wrap items-center gap-3 rounded-xl border p-3 transition-colors ${
        country ? "border-accent/40 bg-accent/5" : "border-border bg-surface"
      }`}
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent/12 text-accent">
        <MapPin className="size-4" aria-hidden="true" />
      </span>
      <Picker
        className="min-w-0 flex-1 sm:max-w-xs"
        label="Available where I live"
        value={country}
        onChange={onChange}
        searchPlaceholder="Search countries"
        options={[
          { value: "", label: "Any country — show every firm", icon: MapPin },
          ...options.map((o) => ({ value: o.code, label: o.name, emoji: flagEmoji(o.code), keywords: o.code })),
        ]}
      />
      <p className="meta min-w-0 flex-1 basis-full sm:basis-auto" aria-live="polite">
        {country ? (
          <>
            Showing firms whose published country rules don&apos;t exclude{" "}
            <span className="font-semibold text-foreground">{countryName(country)}</span>.{" "}
            {hiddenCount > 0 && `${hiddenCount} set aside below. `}
            {unknownCount > 0 && `${unknownCount} haven't published a list — check with the firm. `}
            Lists change; always confirm before buying.
          </>
        ) : (
          "Pick your country to set aside firms whose own rules exclude it. Based only on what each firm publishes."
        )}
      </p>
      {country && (
        <button type="button" onClick={() => onChange("")} className="text-xs text-muted underline hover:text-foreground">
          Clear
        </button>
      )}
    </div>
  );
}
