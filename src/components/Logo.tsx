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

import mark from '../assets/mark.json'
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
    /* Geometry comes from `src/assets/mark.json`, which is ALSO what
       `scripts/build-icons.mjs` reads to emit the favicon and the PNGs. One
       source, so the tab icon cannot drift away from the header mark — which is
       exactly what happened when the favicon held its own copy of the path. */
    <svg
      viewBox={mark.viewBox}
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <g
        fill="none"
        stroke="currentColor"
        strokeLinecap={mark.strokeLinecap as 'round'}
        strokeLinejoin={mark.strokeLinejoin as 'round'}
      >
        {mark.paths.map((p) => (
          <path key={p.d} d={p.d} strokeWidth={p.strokeWidth} />
        ))}
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
