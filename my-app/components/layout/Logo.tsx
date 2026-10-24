/**
 * Town² wordmark, rebuilt in type from the brand logo so it stays crisp at any
 * size and adapts to light/dark mode ("Town" follows the text color; the
 * superscript keeps the brand green). Size it with a font-size class.
 *
 * Proportions measured from the source logo: the "2" is bold at ~0.6× size,
 * its baseline raised ~0.4em, so its top sits just above the cap height.
 */
export const BRAND_GREEN = "#30a77f";

export default function Logo({ className = "" }: { className?: string }) {
  return (
    <span
      role="img"
      aria-label="Town²"
      className={`inline-block whitespace-nowrap font-normal leading-none tracking-[-0.01em] text-zinc-900 dark:text-white ${className}`}
      style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
    >
      <span aria-hidden="true">Town</span>
      <span
        aria-hidden="true"
        className="relative -top-[0.675em] ml-[0.04em] text-[0.6em] font-bold"
        style={{ color: BRAND_GREEN }}
      >
        2
      </span>
    </span>
  );
}
