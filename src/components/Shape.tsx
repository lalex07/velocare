/* ─────────────────────────────────────────────────────────────────────────────
   State shapes, drawn as SVG rather than typed as Unicode geometric characters.

   Why: invariant 4 says colour never carries meaning alone, so the SHAPE is
   load-bearing. Noto Sans TC does not cover ▮ ▯ ◇ ⊘, and a missing-glyph box is
   not a shape. Same reasoning as the Digits primitive: if a state's legibility
   depends on font coverage, it is not guaranteed.

   `currentColor` throughout, so these work on the dark UI and on the printed
   sheet without a second implementation.
   ───────────────────────────────────────────────────────────────────────────── */

export type ShapeKind =
  | 'circle-filled' /* tracking live                  */
  | 'circle-hollow' /* tracking idle · awaiting        */
  | 'square-filled' /* tracking lost · void            */
  | 'bar-filled' /* complete                        */
  | 'bar-hollow' /* incomplete                      */
  | 'triangle' /* hand contact (protocol invalid)  */
  | 'diamond' /* unable to perform               */
  | 'slash-circle' /* aborted                         */
  /* Camera signal — a THIRD disjoint family. Tracking is circles and a square,
     outcomes are bars and polygons, camera signal is a stepped meter. A
     facilitator glancing at the rail must never confuse "the camera dropped out"
     with "the person finished". */
  | 'signal-full' /* camera delivering frames        */
  | 'signal-weak' /* camera stalled                  */
  | 'signal-none' /* camera off or ended             */
  /* 場次 status — a FOURTH disjoint family, and it has to be, because it appears
     on the same surfaces as the outcome marks. A session is an interval of time,
     so it is drawn as one: a bracket that is still open, and a bracket that has
     been closed. Neither is a circle, a bar, a polygon or a meter. */
  | 'span-open' /* 場次 進行中                     */
  | 'span-closed' /* 場次 已結束                     */

export function Shape({ kind, className }: { kind: ShapeKind; className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={className ? `shape ${className}` : 'shape'}
      aria-hidden="true"
      focusable="false"
    >
      {kind === 'circle-filled' && <circle cx="8" cy="8" r="5.5" fill="currentColor" />}

      {kind === 'circle-hollow' && (
        <circle cx="8" cy="8" r="5" fill="none" stroke="currentColor" strokeWidth="2" />
      )}

      {kind === 'square-filled' && <rect x="2.5" y="2.5" width="11" height="11" fill="currentColor" />}

      {kind === 'bar-filled' && <rect x="4" y="1.5" width="8" height="13" fill="currentColor" />}

      {kind === 'bar-hollow' && (
        <>
          {/* Half-filled: reads as "partial" next to bar-filled, which is exactly
              the relationship between complete and incomplete. */}
          <rect x="4" y="1.5" width="8" height="13" fill="none" stroke="currentColor" strokeWidth="2" />
          <rect x="5.5" y="8.5" width="5" height="4.5" fill="currentColor" />
        </>
      )}

      {kind === 'triangle' && (
        <path d="M8 2 L14.5 14 L1.5 14 Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      )}

      {kind === 'diamond' && (
        <path d="M8 1.5 L14.5 8 L8 14.5 L1.5 8 Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      )}

      {kind === 'slash-circle' && (
        <>
          <circle cx="8" cy="8" r="5.5" fill="none" stroke="currentColor" strokeWidth="2" />
          <line x1="4.2" y1="11.8" x2="11.8" y2="4.2" stroke="currentColor" strokeWidth="2" />
        </>
      )}

      {/* Stepped meter. How many steps are filled is the signal, so it reads at a
          glance and survives being printed in one colour. */}
      {kind === 'signal-full' && (
        <>
          <rect x="1.5" y="10" width="3.5" height="4.5" fill="currentColor" />
          <rect x="6.25" y="6.5" width="3.5" height="8" fill="currentColor" />
          <rect x="11" y="3" width="3.5" height="11.5" fill="currentColor" />
        </>
      )}

      {kind === 'signal-weak' && (
        <>
          <rect x="1.5" y="10" width="3.5" height="4.5" fill="currentColor" />
          <rect x="6.25" y="6.5" width="3.5" height="8" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <rect x="11" y="3" width="3.5" height="11.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </>
      )}

      {kind === 'signal-none' && (
        <>
          <rect x="1.5" y="10" width="3.5" height="4.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <rect x="6.25" y="6.5" width="3.5" height="8" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <rect x="11" y="3" width="3.5" height="11.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </>
      )}

      {/* An interval still running: one bracket, then an arrow onward. */}
      {kind === 'span-open' && (
        <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 2.5H2.5v11H5" />
          <path d="M7.5 8h6.5" />
          <path d="M11.5 5.5L14 8l-2.5 2.5" />
        </g>
      )}

      {/* An interval closed at both ends. */}
      {kind === 'span-closed' && (
        <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 2.5H2.5v11H5" />
          <path d="M11 2.5h2.5v11H11" />
          <path d="M6.75 8h2.5" />
        </g>
      )}
    </svg>
  )
}
