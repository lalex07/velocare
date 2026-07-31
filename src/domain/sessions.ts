/* ─────────────────────────────────────────────────────────────────────────────
   Several 場次 open at once — and the one failure mode that creates.

   With a single implicit session it was impossible to record a trial into the
   wrong place. With several it is not, and a trial recorded against the wrong 期
   or the wrong 階段 would surface weeks later as a wrong number in a 成果報告,
   with nothing on the printed sheet to reveal it. Nobody would ever find it.

   So this module holds the refusal, not the UI. The posture is the same one the
   product already takes with 不可比較 on the sheet: PREFER REFUSING OVER
   RECORDING INTO A GUESS. A trial cannot begin unless the active session is
   unambiguous — present, resolvable to a 期, still open, and actually containing
   the person about to be measured.

   `trialGate` returns a REASON rather than a boolean, because every refusal has
   to be said out loud on screen. A control that is simply disabled tells a
   standing facilitator nothing about what to do next.
   ───────────────────────────────────────────────────────────────────────────── */

import type { ResolvedTrial } from './records'
import { currentTrialFor } from './records'
import type {
  AssessmentSession,
  Block,
  Participant,
  ParticipantId,
  SessionId,
} from './types'

export type RefusalReason =
  /** Nothing is selected. The device does not pick one for you. */
  | 'no_session'
  /** The selected session no longer resolves — a stale id, or a missing 期. */
  | 'unresolved'
  /** The session is finished. Reopening it is a deliberate, separate act. */
  | 'completed'
  /** The session has nobody on it, so there is no-one a trial could belong to. */
  | 'no_attendees'
  /** This person is not on this session's attendance list. */
  | 'not_attending'

export type TrialGate = { readonly ok: true } | { readonly ok: false; readonly reason: RefusalReason }

const allow: TrialGate = { ok: true }
const refuse = (reason: RefusalReason): TrialGate => ({ ok: false, reason })

/**
 * May a trial be started right now?
 *
 * Called with the participant when there is one, and without when the question
 * is only "is this surface allowed to offer 開始量測 at all".
 */
export function trialGate(
  session: AssessmentSession | null,
  block: Block | null,
  participantId?: ParticipantId,
): TrialGate {
  if (!session) return refuse('no_session')
  if (!block || block.blockId !== session.blockId) return refuse('unresolved')
  if (session.status !== 'open') return refuse('completed')
  if (session.attendeeIds.length === 0) return refuse('no_attendees')
  if (participantId !== undefined && !session.attendeeIds.includes(participantId)) {
    return refuse('not_attending')
  }
  return allow
}

/** The 期 a session belongs to, or `null` when the pair does not resolve. */
export function blockOf(
  blocks: readonly Block[],
  session: AssessmentSession | null,
): Block | null {
  if (!session) return null
  return blocks.find((b) => b.blockId === session.blockId) ?? null
}

/**
 * Who is on this session, in the 期's roster order.
 *
 * Attendance is per-session; enrolment in the 期 is not. Deriving the roster
 * from `attendeeIds` rather than from `block.participants` is what stops a
 * second session in the same 期 from silently inheriting the first one's list.
 */
export function attendeesOf(
  session: AssessmentSession | null,
  block: Block | null,
): readonly Participant[] {
  if (!session || !block) return []
  const present = new Set(session.attendeeIds)
  return block.participants.filter((p) => present.has(p.id))
}

/** Every session belonging to one 期, 前測 first. */
export function sessionsOfBlock(
  sessions: readonly AssessmentSession[],
  blockId: string,
): readonly AssessmentSession[] {
  return sessions
    .filter((s) => s.blockId === blockId)
    .slice()
    .sort((a, b) => (a.phase === b.phase ? 0 : a.phase === 'pre' ? -1 : 1))
}

export interface SessionProgress {
  readonly done: number
  readonly total: number
}

/** How far through the rotation this session is. Counts assessed people only. */
export function progressOf(
  session: AssessmentSession | null,
  block: Block | null,
  resolved: readonly ResolvedTrial[],
): SessionProgress {
  const people = attendeesOf(session, block)
  const done = people.filter((p) => currentTrialFor(resolved, p.id) !== null).length
  return { done, total: people.length }
}

/**
 * Session list order: open before completed, then most recent first.
 *
 * Open sessions are what a facilitator arriving at the device is looking for,
 * and the newest of them is almost always the one they mean — but "almost
 * always" is not "always", which is why nothing here selects one automatically.
 */
export function listOrder(
  sessions: readonly AssessmentSession[],
): readonly AssessmentSession[] {
  return sessions.slice().sort((a, b) => {
    if (a.status !== b.status) return a.status === 'open' ? -1 : 1
    if (a.dateIso !== b.dateIso) return a.dateIso < b.dateIso ? 1 : -1
    return a.phase === b.phase ? 0 : a.phase === 'pre' ? -1 : 1
  })
}

/** Identity of a session as three plain facts. What the context band renders. */
export interface SessionIdentity {
  readonly siteName: string
  readonly blockName: string
  readonly phase: 'pre' | 'post'
  readonly dateIso: string
  readonly status: AssessmentSession['status']
  readonly sessionId: SessionId
}

export function identityOf(
  session: AssessmentSession,
  block: Block,
): SessionIdentity {
  return {
    siteName: block.siteName,
    blockName: block.blockName,
    phase: session.phase,
    dateIso: session.dateIso,
    status: session.status,
    sessionId: session.sessionId,
  }
}
