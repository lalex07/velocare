/* ─────────────────────────────────────────────────────────────────────────────
   Outcome and tracking → display triad.

   INVARIANT 4 — colour never carries meaning alone. Every state that appears on
   screen returns a WORD and a SHAPE here, and `tone` is optional. A surface that
   renders `tone` without `word` and `shape` is a bug.

   Shapes are SVG kinds, not characters: Noto Sans TC does not cover the geometric
   glyphs this needs, and a missing-glyph box is not a shape.

   Tracking shapes (circles / square) are deliberately disjoint from outcome
   shapes (bars / triangle / diamond) so a facilitator never confuses "the machine
   is fine" with "the person finished".
   ───────────────────────────────────────────────────────────────────────────── */

import type { ShapeKind } from '../components/Shape'
import type { CameraSignal } from '../hooks/useCameraPreview'
import { strings } from '../i18n/strings'
import type { Outcome, SessionStatus, TrackingState } from './types'

/**
 * `neutral` means no colour at all.
 *
 * `accent` and `alert` describe THE MACHINE — tracking live, tracking lost. The
 * five `st-` tones describe A PERSON'S RECORDED OUTCOME, and exist because
 * twelve roster rows separated only by a small grey glyph cannot be scanned.
 *
 * The separation is deliberate and load-bearing: no outcome tone is red.
 * `alert` stays reserved for the machine failing, so a red row never says a
 * participant did badly. PRODUCT.md: "failure states are not failures."
 */
export type Tone =
  | 'neutral'
  | 'accent'
  | 'alert'
  | 'measured'
  | 'partial'
  | 'protocol'
  | 'unable'
  | 'discarded'

export interface Display {
  readonly word: string
  readonly shape: ShapeKind
  readonly tone: Tone
}

export function trackingDisplay(s: TrackingState): Display {
  switch (s) {
    case 'live':
      return { word: strings.tracking.live, shape: 'circle-filled', tone: 'accent' }
    case 'idle':
      return { word: strings.tracking.idle, shape: 'circle-hollow', tone: 'neutral' }
    case 'lost':
      return { word: strings.tracking.lost, shape: 'square-filled', tone: 'alert' }
  }
}

/**
 * Outcome display.
 *
 * `hand_contact` is NOT `alert`, and that is still load-bearing. PRODUCT.md:
 * "Failure states are not failures." A participant who used their hands did not
 * malfunction, and a red row would tell them they did. Only the machine failing
 * (`void`) earns the alarm hue.
 *
 * These tones distinguish CATEGORY, not quality. They sit in one narrow
 * lightness band so no row shouts, and they are rendered only on facilitator
 * surfaces — the roster, the result surface, the rail. `.field--locked` renders
 * no chip at all, so the participant field during a live trial is unaffected.
 */
export function outcomeDisplay(o: Outcome): Display {
  switch (o.kind) {
    case 'complete':
      return { word: strings.status.complete, shape: 'bar-filled', tone: 'measured' }
    case 'incomplete':
      return { word: strings.status.incomplete, shape: 'bar-hollow', tone: 'partial' }
    case 'hand_contact':
      return { word: strings.status.handContact, shape: 'triangle', tone: 'protocol' }
    case 'unable':
      return { word: strings.status.unable, shape: 'diamond', tone: 'unable' }
    case 'aborted':
      return { word: strings.status.aborted, shape: 'slash-circle', tone: 'discarded' }
    case 'void':
      return { word: strings.status.voided, shape: 'square-filled', tone: 'alert' }
  }
}

/**
 * 場次 status — 進行中 / 已結束.
 *
 * BOTH ARE `neutral`, deliberately. The two machine tones describe the machine
 * and the five `st-` tones describe a person's outcome; a session is neither,
 * and borrowing one of them would say something false — an open session is not
 * "live tracking" and a finished one is not "discarded". Scanning the session
 * list is done by GROUPING (進行中 above 已結束) rather than by hue, and the
 * word plus the bracket shape carry the state on their own.
 */
export function sessionStatusDisplay(s: SessionStatus): Display {
  return s === 'open'
    ? { word: strings.session.statusOpen, shape: 'span-open', tone: 'neutral' }
    : { word: strings.session.statusCompleted, shape: 'span-closed', tone: 'neutral' }
}

export const awaitingDisplay: Display = {
  word: strings.status.awaiting,
  shape: 'circle-hollow',
  tone: 'neutral',
}

/**
 * Camera SIGNAL — whether frames are still arriving. Not tracking confidence:
 * this build runs no pose estimation, so a confidence figure would be invented.
 *
 * `stalled` takes `alert` because a camera that has stopped delivering frames is
 * the machine failing, which is exactly what that hue is reserved for. `ended`
 * is neutral: a camera the facilitator switched off is not a fault.
 */
export function cameraSignalDisplay(s: CameraSignal): Display {
  switch (s) {
    case 'live':
      return { word: strings.camera.signalLive, shape: 'signal-full', tone: 'accent' }
    case 'stalled':
      return { word: strings.camera.signalStalled, shape: 'signal-weak', tone: 'alert' }
    case 'ended':
      return { word: strings.camera.signalEnded, shape: 'signal-none', tone: 'neutral' }
  }
}
