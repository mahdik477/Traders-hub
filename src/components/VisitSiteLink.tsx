// "Visit site" button for a firm. Only rendered when the firm's data file has
// an affiliate_link, so it can be swapped without touching code.
// rel="sponsored" is the web standard for paid/affiliate links.
export default function VisitSiteLink({
  href,
  firmName,
  variant = "primary",
  className = "",
}: {
  href: string;
  firmName: string;
  variant?: "primary" | "outline";
  className?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener sponsored"
      className={`btn ${variant === "primary" ? "btn-primary" : "btn-outline"} ${className}`}
    >
      Visit site
      <span className="sr-only">
        {" "}
        — {firmName} (opens in a new tab)
      </span>
      <span aria-hidden="true">↗</span>
    </a>
  );
}
