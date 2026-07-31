/* ─────────────────────────────────────────────────────────────────────────────
   The mark.

   WHAT IT DRAWS: the hip-height trace of one sit-to-stand — flat at the seated
   height, an S-curve up, flat at the standing height — with a caliper end-stop
   at each of the two heights. It is a DIMENSIONED MEASUREMENT, not a motion
   swoosh. That distinction is the whole idea and the thing to protect if this is
   ever redrawn: the end-stops are what turn a curve into a measured quantity,
   and a measured quantity is what this product is. A swoosh would put it in the
   consumer-fitness family the anti-references rule out. See DESIGN.md.

   `currentColor` throughout, and no fill anywhere, so one file serves every
   context: accent blue on cream in the header, pure black on the printed sheet
   (which is what keeps the print chroma-0 rule true without a second drawing),
   and reversed on a dark ground if that ever exists. Nothing here may take a
   literal colour — the moment it does, the print rule needs an exception.

   SIZE IS CAPPED AT THE WORDMARK'S CAP HEIGHT, in `em`, so the cap follows the
   type rather than being re-tuned per surface. It is an identifier, not a
   feature. See `.logo__mark` in app.css for the measured ratio.
   ───────────────────────────────────────────────────────────────────────────── */

import { strings } from '../i18n/strings'

/**
 * The mark alone. Takes a class so each surface can size it against the type it
 * sits beside; carries no colour, no fill and no size of its own.
 *
 * `aria-hidden` here: every call site pairs it with the wordmark or a title that
 * already names the product, so announcing it again would only add noise.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 92 92"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        {/* The trace: seated height, rise, standing height. */}
        <path d="M10 74 L26 74 C46 74 46 18 66 18 L82 18" strokeWidth="9" />
        {/* The two caliper end-stops. Thinner than the trace, as a dimension
            line's ticks are thinner than the thing being dimensioned. */}
        <path d="M10 62 L10 86 M82 6 L82 30" strokeWidth="6.5" />
      </g>
    </svg>
  )
}

export function Logo() {
  return (
    <span className="logo" aria-label={strings.app.name}>
      <LogoMark className="logo__mark" />
      <span className="logo__word">{strings.app.name}</span>
    </span>
  )
}
