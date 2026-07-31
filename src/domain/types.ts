/* ─────────────────────────────────────────────────────────────────────────────
   Domain types.

   INVARIANT 2 — no identity fields. There is no name, date of birth, or national
   ID field anywhere in this file, and there must never be one. A participant is a
   pseudonymous id plus a short staff-chosen display label. The mapping to a real
   person lives in the site's paper records, off-device.

   INVARIANT 3 (as amended) — no clinical output. Nothing here stores or derives a
   determination. `PROTOCOL_THRESHOLD_S` is deliberately absent: the instrument
   reports a measured time to a human, and the human applies the 14-second ICOPE
   threshold. Adding a `passed: boolean` to this file would cross the regulatory
   line the whole product is built to stay behind.

   Storage is APPEND-ONLY. A record is never mutated. A miscount is fixed by
   appending a CorrectionRecord that points at the original.
   ───────────────────────────────────────────────────────────────────────────── */

/** Pseudonymous participant id, e.g. `P-0042`. Never a real identifier. */
export type ParticipantId = string

export type RecordId = string
export type SessionId = string
export type BlockId = string
export type TrialId = string
export type SiteId = string

/** Which of the two mandated assessment points within a 期. */
export type Phase = 'pre' | 'post'

export interface Participant {
  readonly id: ParticipantId
  /** Short staff-chosen display label. Not a legal name. */
  readonly label: string
}

/** A 特約服務點. One per appliance in practice; a list so a multi-site store
    does not require an interface change later. */
export interface Site {
  readonly siteId: SiteId
  readonly name: string
}

/**
 * Minimum AVERAGE attendance per 期. Below it the site loses the entire
 * NT$36,000 for that 期 — not a proportion of it.
 *
 * This is an administrative funding threshold, not a clinical one, and the UI
 * renders it as a COUNT rather than a warning. The device reports how many
 * people are in today's session; it does not police the site, does not colour
 * the number red, and does not tell a 據點 what to do about it. Compare the
 * treatment of the 14-second ICOPE threshold, which this build refuses to apply
 * at all: that one is clinical, so it is absent entirely.
 */
export const FUNDED_ATTENDANCE_MIN = 10

/** A 期 — 12 weeks, 1 session/week, 2 hours, min average attendance 10. */
export interface Block {
  readonly blockId: BlockId
  readonly siteId: SiteId
  readonly siteName: string
  /** Display form of `year` + `cycle`, e.g. `115 年度第 3 期`. */
  readonly blockName: string
  /** 民國 year. Stored rather than parsed back out of `blockName`, because the
      setup screen has to decide whether the 期 a facilitator just configured is
      one that already exists — and a string comparison would be a guess. */
  readonly year: number
  /** 第 N 期. Max 3 per year per 特約服務點. */
  readonly cycle: number
  readonly startedIso: string
  /** Everyone ENROLLED in the 期. A superset of any one session's attendees. */
  readonly participants: readonly Participant[]
}

/**
 * A 場次 is either still being recorded into, or finished.
 *
 * Several 場次 are open on one device at the same time, so "which one am I
 * recording into" is a real question with a wrong answer. `completed` is what
 * lets the device refuse: a finished session takes no more trials until someone
 * deliberately reopens it. See `trialGate` in domain/sessions.ts.
 */
export type SessionStatus = 'open' | 'completed'

export interface AssessmentSession {
  readonly sessionId: SessionId
  readonly blockId: BlockId
  readonly phase: Phase
  readonly dateIso: string
  readonly status: SessionStatus
  /** Who is present TODAY. Attendance varies session to session, and the
      funding floor is an average across the 期, so this is per-session data
      rather than a property of the 期. */
  readonly attendeeIds: readonly ParticipantId[]
}

/** What the setup screen collects before a session opens. */
export interface SessionSetup {
  readonly siteId: SiteId
  /** 民國 year, e.g. 115. */
  readonly year: number
  /** 第 N 期. Max 3 per year per 特約服務點. */
  readonly cycle: number
  readonly phase: Phase
  readonly attendeeIds: readonly ParticipantId[]
}

/* ── Outcomes ─────────────────────────────────────────────────────────────────
   Every one of these is a VALID RECORDED OUTCOME, not an error. PRODUCT.md:
   "Failure states are not failures." The union is flat and total on purpose so
   the UI cannot forget a case.
   ───────────────────────────────────────────────────────────────────────────── */

export const PRESCRIBED_REPS = 5

export type OutcomeKind =
  /** All 5 reps, arms crossed throughout. Protocol-valid. */
  | 'complete'
  /** Fewer than 5 reps. The participant did what they could. Protocol-valid. */
  | 'incomplete'
  /** Hands used. Recorded in full, marked protocol-invalid for ICOPE. */
  | 'hand_contact'
  /** Cannot perform the protocol at all (walker, wheelchair). Still enrolled. */
  | 'unable'
  /** Facilitator discarded the trial. Carries a reason code. */
  | 'aborted'
  /** Tracking lost. Not an assessment result; feeds the void-rate field metric. */
  | 'void'

export type AbortReason =
  | 'wrong_participant'
  | 'interruption'
  | 'participant_declined'
  | 'equipment'
  | 'other'

export type VoidReason = 'roi_multiple_people' | 'tracking_lost' | 'out_of_frame'

interface OutcomeBase {
  readonly kind: OutcomeKind
}

export interface CompleteOutcome extends OutcomeBase {
  readonly kind: 'complete'
  readonly repsCompleted: 5
  readonly repTimesMs: readonly number[]
  readonly totalMs: number
}

export interface IncompleteOutcome extends OutcomeBase {
  readonly kind: 'incomplete'
  readonly repsCompleted: number
  readonly repTimesMs: readonly number[]
  readonly elapsedMs: number
}

export interface HandContactOutcome extends OutcomeBase {
  readonly kind: 'hand_contact'
  readonly repsCompleted: number
  readonly repTimesMs: readonly number[]
  readonly elapsedMs: number
  /** 1-based rep on which contact was first detected. */
  readonly firstContactRep: number
  /** Always true. Present so the flag is explicit at every read site. */
  readonly protocolInvalid: true
}

export interface UnableOutcome extends OutcomeBase {
  readonly kind: 'unable'
}

export interface AbortedOutcome extends OutcomeBase {
  readonly kind: 'aborted'
  readonly reason: AbortReason
  readonly repsCompleted: number
  readonly elapsedMs: number
}

export interface VoidOutcome extends OutcomeBase {
  readonly kind: 'void'
  readonly reason: VoidReason
  readonly repsCompleted: number
}

export type Outcome =
  | CompleteOutcome
  | IncompleteOutcome
  | HandContactOutcome
  | UnableOutcome
  | AbortedOutcome
  | VoidOutcome

/** Outcomes that count as a completed assessment for roster progress. */
export function isAssessed(o: Outcome): boolean {
  return o.kind === 'complete' || o.kind === 'incomplete' || o.kind === 'hand_contact' || o.kind === 'unable'
}

/** Outcomes ICOPE can use as-is. `hand_contact` is recorded but not valid. */
export function isProtocolValid(o: Outcome): boolean {
  return o.kind === 'complete' || o.kind === 'incomplete'
}

/** Elapsed time where the outcome has one. `null` is not zero. */
export function elapsedMsOf(o: Outcome): number | null {
  switch (o.kind) {
    case 'complete':
      return o.totalMs
    case 'incomplete':
    case 'hand_contact':
    case 'aborted':
      return o.elapsedMs
    case 'unable':
    case 'void':
      return null
  }
}

export function repsOf(o: Outcome): number {
  switch (o.kind) {
    case 'complete':
    case 'incomplete':
    case 'hand_contact':
    case 'aborted':
    case 'void':
      return o.repsCompleted
    case 'unable':
      return 0
  }
}

/* ── Records — append-only ────────────────────────────────────────────────── */

export interface TrialRecord {
  readonly recordId: RecordId
  readonly kind: 'trial'
  readonly sessionId: SessionId
  readonly participantId: ParticipantId
  readonly outcome: Outcome
  readonly startedIso: string
  /** Seat height read from the ArUco tag, never staff-entered. cm. */
  readonly seatHeightCm: number | null
}

/**
 * A correction. Never an edit. PRODUCT.md principle 5: a facilitator who cannot
 * fix the machine will either stop using it or start gaming it, so correcting
 * must feel ordinary. The original record stays in the log forever.
 */
export interface CorrectionRecord {
  readonly recordId: RecordId
  readonly kind: 'correction'
  readonly sessionId: SessionId
  readonly participantId: ParticipantId
  readonly correctsRecordId: RecordId
  readonly outcome: Outcome
  readonly note: CorrectionNote
  readonly atIso: string
}

export type CorrectionNote = 'rep_miscount' | 'wrong_participant' | 'hand_contact_missed' | 'other'

export type AnyRecord = TrialRecord | CorrectionRecord

/* ── Live trial events ────────────────────────────────────────────────────────
   In October these arrive from the Python pose pipeline over localhost. Today
   the fixture source emits the identical shapes. No UI code may know which.
   ───────────────────────────────────────────────────────────────────────────── */

export type TrackingState = 'idle' | 'live' | 'lost'

export type TrialEvent =
  | { readonly type: 'tracking'; readonly state: TrackingState }
  /** 1-based rep index. `repMs` is that rep alone; `elapsedMs` is since cue. */
  | { readonly type: 'rep'; readonly index: number; readonly repMs: number; readonly elapsedMs: number }
  | { readonly type: 'hand_contact'; readonly repIndex: number }
  | { readonly type: 'void'; readonly reason: VoidReason }
  | { readonly type: 'settled'; readonly outcome: Outcome }

/* ── Formatting ───────────────────────────────────────────────────────────── */

/** Seconds to one decimal. Never rounds to a threshold, never renders a verdict. */
export function formatSeconds(ms: number): string {
  return (ms / 1000).toFixed(1)
}

/** Signed delta for the sheet. Negative means faster, which is an improvement. */
export function formatDelta(preMs: number, postMs: number): string {
  const d = (postMs - preMs) / 1000
  const sign = d > 0 ? '+' : d < 0 ? '−' : '±'
  return `${sign}${Math.abs(d).toFixed(1)}`
}
