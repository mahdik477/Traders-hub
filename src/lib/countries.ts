// ISO 3166-1 alpha-2 country codes. The display names come from the
// browser's own Intl.DisplayNames (so there's no 250-line name table to keep
// in sync); a code the runtime doesn't know falls back to the code itself.
// Used by the "Available where I live" switch and the Find-my-firm matcher,
// which compare a visitor's country against each firm's published list
// (firm.countries in the data files — see propfirm-types.ts).

export const COUNTRY_CODES: string[] = [
  "AD","AE","AF","AG","AI","AL","AM","AO","AQ","AR","AS","AT","AU","AW","AX","AZ",
  "BA","BB","BD","BE","BF","BG","BH","BI","BJ","BL","BM","BN","BO","BQ","BR","BS","BT","BV","BW","BY","BZ",
  "CA","CC","CD","CF","CG","CH","CI","CK","CL","CM","CN","CO","CR","CU","CV","CW","CX","CY","CZ",
  "DE","DJ","DK","DM","DO","DZ",
  "EC","EE","EG","EH","ER","ES","ET",
  "FI","FJ","FK","FM","FO","FR",
  "GA","GB","GD","GE","GF","GG","GH","GI","GL","GM","GN","GP","GQ","GR","GS","GT","GU","GW","GY",
  "HK","HM","HN","HR","HT","HU",
  "ID","IE","IL","IM","IN","IO","IQ","IR","IS","IT",
  "JE","JM","JO","JP",
  "KE","KG","KH","KI","KM","KN","KP","KR","KW","KY","KZ",
  "LA","LB","LC","LI","LK","LR","LS","LT","LU","LV","LY",
  "MA","MC","MD","ME","MF","MG","MH","MK","ML","MM","MN","MO","MP","MQ","MR","MS","MT","MU","MV","MW","MX","MY","MZ",
  "NA","NC","NE","NF","NG","NI","NL","NO","NP","NR","NU","NZ",
  "OM",
  "PA","PE","PF","PG","PH","PK","PL","PM","PN","PR","PS","PT","PW","PY",
  "QA",
  "RE","RO","RS","RU","RW",
  "SA","SB","SC","SD","SE","SG","SH","SI","SJ","SK","SL","SM","SN","SO","SR","SS","ST","SV","SX","SY","SZ",
  "TC","TD","TF","TG","TH","TJ","TK","TL","TM","TN","TO","TR","TT","TV","TW","TZ",
  "UA","UG","UM","US","UY","UZ",
  "VA","VC","VE","VG","VI","VN","VU",
  "WF","WS",
  "XK",
  "YE","YT",
  "ZA","ZM","ZW",
];

let displayNames: Intl.DisplayNames | null | undefined;

/** "AE" → "United Arab Emirates". Falls back to the code. */
export function countryName(code: string): string {
  if (code === "XK") return "Kosovo"; // user-assigned code, not in every runtime's table
  if (displayNames === undefined) {
    try {
      displayNames = new Intl.DisplayNames(["en"], { type: "region" });
    } catch {
      displayNames = null;
    }
  }
  try {
    return displayNames?.of(code) ?? code;
  } catch {
    return code;
  }
}

/** Every code with its name, sorted by name — for a <select>. */
export function countryOptions(): { code: string; name: string }[] {
  return COUNTRY_CODES.map((code) => ({ code, name: countryName(code) })).sort((a, b) =>
    a.name.localeCompare(b.name),
  );
}

export function isCountryCode(value: string | null | undefined): value is string {
  return !!value && COUNTRY_CODES.includes(value);
}

export type Availability =
  | { status: "available"; reason: string }
  | { status: "restricted"; reason: string }
  | { status: "unknown"; reason: string };

/** Whether a firm says it accepts traders from `code`, based only on the
 *  list the firm itself publishes. We index these lists; we don't verify
 *  them, and a firm can change its list at any time. */
export function firmAvailability(
  countries: { restricted: string[] | null; allowedOnly: string[] | null } | null,
  code: string,
): Availability {
  const name = countryName(code);
  if (!countries || (countries.restricted == null && countries.allowedOnly == null)) {
    return { status: "unknown", reason: "This firm hasn't published a country list we could find — check with the firm." };
  }
  if (countries.allowedOnly && !countries.allowedOnly.includes(code)) {
    return { status: "restricted", reason: `${name} isn't on the list of countries this firm says it serves.` };
  }
  if (countries.restricted?.includes(code)) {
    return { status: "restricted", reason: `The firm lists ${name} as a restricted country.` };
  }
  return { status: "available", reason: `${name} isn't on the firm's published restricted list.` };
}
