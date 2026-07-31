/* ─────────────────────────────────────────────────────────────────────────────
   Fixture data source. Implements SessionDataSource with simulated data.

   In October a LocalhostDataSource implements the identical interface against
   the Python pose pipeline. No UI code imports this file directly.

   SEVERAL 場次 ARE SEEDED OPEN AT ONCE, because that is the state the product
   now has to survive and a fixture set with one session would not demonstrate
   it. Five sessions across three 期 across two 據點:

     115 年度第 3 期 · 示範社區照顧關懷據點
       前測  2026-05-04   已結束    12 人, all assessed
       後測  2026-07-27   進行中    12 人, 7 assessed — every edge case lives here
     115 年度第 1 期 · 示範第二關懷據點
       前測  2026-07-30   進行中    10 人, 5 assessed
     114 年度第 3 期 · 示範社區照顧關懷據點
       前測  2025-10-06   已結束    10 人, all assessed
       後測  2025-12-29   已結束     9 人 — one absent, so the sheet shows 未記錄

   Two of them are open, mid-progress, at different 據點 and different 階段: the
   exact configuration in which a trial could be recorded into the wrong place.
   NOTHING IS ACTIVE ON BOOT. The device does not guess which one you meant.
   ───────────────────────────────────────────────────────────────────────────── */

import {
  type AbortReason,
  type AnyRecord,
  type AssessmentSession,
  type Block,
  type CorrectionNote,
  type Outcome,
  type Participant,
  type ParticipantId,
  type RecordId,
  type SessionId,
  type SessionSetup,
  type Site,
  type SiteId,
  type TrackingState,
  type TrialEvent,
  PRESCRIBED_REPS,
} from '../domain/types'
import type { SessionDataSource, TrialId, Unsubscribe } from './SessionDataSource'

/* ── 據點 and enrolment ────────────────────────────────────────────────────── */

const SITES: readonly Site[] = [
  { siteId: 'SITE-01', name: '示範社區照顧關懷據點' },
  { siteId: 'SITE-02', name: '示範第二關懷據點' },
]

/* Enrolment is site-level and outlives any one 期, so it is deliberately LARGER
   than any single 期's roster: the setup screen has something real to select
   from, and the ">= 10" count can be moved above and below the funding floor by
   picking people. */
const ENROLLED_01: readonly Participant[] = [
  { id: 'P-0041', label: '王阿姨' },
  { id: 'P-0042', label: '陳媽' },
  { id: 'P-0043', label: '林伯' },
  { id: 'P-0044', label: '張姐' },
  { id: 'P-0045', label: '李伯' },
  { id: 'P-0046', label: '黃阿姨' },
  { id: 'P-0047', label: '吳媽' },
  { id: 'P-0048', label: '蔡伯' },
  { id: 'P-0049', label: '鄭姐' },
  { id: 'P-0050', label: '許阿姨' },
  { id: 'P-0051', label: '曾伯' },
  { id: 'P-0052', label: '何媽' },
  { id: 'P-0053', label: '周伯' },
  { id: 'P-0054', label: '劉阿姨' },
  { id: 'P-0055', label: '邱媽' },
]

const ENROLLED_02: readonly Participant[] = [
  { id: 'P-0061', label: '簡阿姨' },
  { id: 'P-0062', label: '柯伯' },
  { id: 'P-0063', label: '洪媽' },
  { id: 'P-0064', label: '莊姐' },
  { id: 'P-0065', label: '沈伯' },
  { id: 'P-0066', label: '呂阿姨' },
  { id: 'P-0067', label: '施媽' },
  { id: 'P-0068', label: '賴伯' },
  { id: 'P-0069', label: '謝姐' },
  { id: 'P-0070', label: '范阿姨' },
  { id: 'P-0071', label: '廖伯' },
  { id: 'P-0072', label: '潘媽' },
]

const pick = (from: readonly Participant[], ids: readonly ParticipantId[]) =>
  from.filter((p) => ids.includes(p.id))

const idsOf = (ps: readonly Participant[]) => ps.map((p) => p.id)

/* ── The 期 ───────────────────────────────────────────────────────────────── */

const B_115_3_PEOPLE = ENROLLED_01.slice(0, 12) // P-0041 … P-0052
const B_114_3_PEOPLE = ENROLLED_01.slice(0, 10) // P-0041 … P-0050
const B_115_1_PEOPLE = ENROLLED_02.slice(0, 10) // P-0061 … P-0070

const BLOCK_115_3: Block = {
  blockId: 'B-SITE-01-115-3',
  siteId: 'SITE-01',
  siteName: '示範社區照顧關懷據點',
  blockName: '115 年度第 3 期',
  year: 115,
  cycle: 3,
  startedIso: '2026-05-04',
  participants: B_115_3_PEOPLE,
}

const BLOCK_115_1: Block = {
  blockId: 'B-SITE-02-115-1',
  siteId: 'SITE-02',
  siteName: '示範第二關懷據點',
  blockName: '115 年度第 1 期',
  year: 115,
  cycle: 1,
  startedIso: '2026-07-30',
  participants: B_115_1_PEOPLE,
}

const BLOCK_114_3: Block = {
  blockId: 'B-SITE-01-114-3',
  siteId: 'SITE-01',
  siteName: '示範社區照顧關懷據點',
  blockName: '114 年度第 3 期',
  year: 114,
  cycle: 3,
  startedIso: '2025-10-06',
  participants: B_114_3_PEOPLE,
}

const BLOCKS: readonly Block[] = [BLOCK_115_3, BLOCK_115_1, BLOCK_114_3]

/* ── The 場次 ─────────────────────────────────────────────────────────────── */

const S_115_3_PRE: AssessmentSession = {
  sessionId: 'S-115-3-pre',
  blockId: BLOCK_115_3.blockId,
  phase: 'pre',
  dateIso: '2026-05-04',
  status: 'completed',
  attendeeIds: idsOf(B_115_3_PEOPLE),
}

const S_115_3_POST: AssessmentSession = {
  sessionId: 'S-115-3-post',
  blockId: BLOCK_115_3.blockId,
  phase: 'post',
  dateIso: '2026-07-27',
  status: 'open',
  attendeeIds: idsOf(B_115_3_PEOPLE),
}

const S_115_1_PRE: AssessmentSession = {
  sessionId: 'S-115-1-pre',
  blockId: BLOCK_115_1.blockId,
  phase: 'pre',
  dateIso: '2026-07-30',
  status: 'open',
  attendeeIds: idsOf(B_115_1_PEOPLE),
}

const S_114_3_PRE: AssessmentSession = {
  sessionId: 'S-114-3-pre',
  blockId: BLOCK_114_3.blockId,
  phase: 'pre',
  dateIso: '2025-10-06',
  status: 'completed',
  attendeeIds: idsOf(B_114_3_PEOPLE),
}

/* One person absent at the 後測. Attendance varies session to session — that is
   why it is per-session data — and the sheet shows the gap as 未記錄 rather than
   pretending she was measured. */
const S_114_3_POST: AssessmentSession = {
  sessionId: 'S-114-3-post',
  blockId: BLOCK_114_3.blockId,
  phase: 'post',
  dateIso: '2025-12-29',
  status: 'completed',
  attendeeIds: idsOf(B_114_3_PEOPLE).filter((id) => id !== 'P-0049'),
}

const SESSIONS: readonly AssessmentSession[] = [
  S_115_3_PRE,
  S_115_3_POST,
  S_115_1_PRE,
  S_114_3_PRE,
  S_114_3_POST,
]

const SEAT_CM = 45

/* ── Outcome builders ─────────────────────────────────────────────────────── */

const sum = (xs: readonly number[]) => xs.reduce((a, b) => a + b, 0)

function complete(repTimesMs: readonly number[]): Outcome {
  return { kind: 'complete', repsCompleted: 5, repTimesMs, totalMs: sum(repTimesMs) }
}

function incomplete(repTimesMs: readonly number[]): Outcome {
  return {
    kind: 'incomplete',
    repsCompleted: repTimesMs.length,
    repTimesMs,
    elapsedMs: sum(repTimesMs),
  }
}

function handContact(repTimesMs: readonly number[], firstContactRep: number): Outcome {
  return {
    kind: 'hand_contact',
    repTimesMs,
    repsCompleted: repTimesMs.length,
    elapsedMs: sum(repTimesMs),
    firstContactRep,
    protocolInvalid: true,
  }
}

const unable: Outcome = { kind: 'unable' }

/* ── The record log, append-only and in log order ─────────────────────────── */

let recordSeq = 0
const nextRecordId = (): RecordId => `R-${(++recordSeq).toString().padStart(4, '0')}`

function trial(
  sessionId: SessionId,
  participantId: ParticipantId,
  outcome: Outcome,
  startedIso: string,
): AnyRecord {
  return {
    recordId: nextRecordId(),
    kind: 'trial',
    sessionId,
    participantId,
    outcome,
    startedIso,
    seatHeightCm: outcome.kind === 'unable' ? null : SEAT_CM,
  }
}

/** Valid ISO timestamp from a minute offset. Minutes above 59 roll into hours. */
function at(dateIso: string, fromHour: number, minuteOffset: number, second = 0): string {
  const h = fromHour + Math.floor(minuteOffset / 60)
  const m = minuteOffset % 60
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${dateIso}T${pad(h)}:${pad(m)}:${pad(second)}`
}

function buildLog(): AnyRecord[] {
  const log: AnyRecord[] = []

  /* ── 115-3 前測: all 12 assessed, session已結束 ──────────────────────────── */
  const pre = (min: number, sec = 0) => at(S_115_3_PRE.dateIso, 9, min, sec)
  const s3pre = S_115_3_PRE.sessionId
  log.push(trial(s3pre, 'P-0041', complete([2900, 3100, 3200, 3400, 3600]), pre(12)))
  log.push(trial(s3pre, 'P-0042', complete([3400, 3600, 3900, 4100, 4400]), pre(18)))
  log.push(trial(s3pre, 'P-0043', complete([2400, 2500, 2600, 2700, 2800]), pre(24)))
  log.push(trial(s3pre, 'P-0044', complete([3800, 4000, 4300, 4600, 5000]), pre(31)))
  log.push(trial(s3pre, 'P-0045', complete([2700, 2800, 2900, 3000, 3200]), pre(37)))
  log.push(trial(s3pre, 'P-0046', incomplete([4200, 4600, 5100]), pre(43)))
  log.push(trial(s3pre, 'P-0047', complete([3100, 3300, 3400, 3600, 3800]), pre(49)))
  log.push(trial(s3pre, 'P-0048', handContact([3300, 3500, 3900, 4300, 4700], 3), pre(55)))
  log.push(trial(s3pre, 'P-0049', complete([2600, 2700, 2800, 3000, 3100]), pre(61)))
  log.push(trial(s3pre, 'P-0050', unable, pre(66)))
  log.push(trial(s3pre, 'P-0051', complete([3000, 3200, 3300, 3500, 3700]), pre(70)))
  log.push(trial(s3pre, 'P-0052', complete([3600, 3800, 4100, 4400, 4800]), pre(76)))

  /* ── 115-3 後測: OPEN, mid-flight, 7 of 12 assessed ───────────────────────
     Every edge case in the product lives in this one session, so the open 場次 a
     demo lands on is the interesting one. */
  const post = (min: number, sec = 0) => at(S_115_3_POST.dateIso, 9, min, sec)
  const s3post = S_115_3_POST.sessionId

  // Straightforward improvements.
  log.push(trial(s3post, 'P-0041', complete([2500, 2600, 2700, 2800, 2900]), post(10)))
  log.push(trial(s3post, 'P-0042', complete([3000, 3100, 3300, 3500, 3700]), post(16)))

  // EDGE: void from tracking loss, then a successful restart. Both stay in the
  // log; only the restart represents the participant. Feeds the void-rate metric.
  log.push(
    trial(s3post, 'P-0043', { kind: 'void', reason: 'roi_multiple_people', repsCompleted: 2 }, post(21)),
  )
  log.push(trial(s3post, 'P-0043', complete([2200, 2300, 2300, 2400, 2500]), post(22, 30)))

  // EDGE: incomplete. Three reps is a valid recorded outcome, not an error.
  log.push(trial(s3post, 'P-0044', incomplete([4000, 4300, 4700]), post(28)))

  // EDGE: abort with a reason. Does not represent the participant, so P-0045
  // still reads as outstanding on the roster.
  log.push(
    trial(
      s3post,
      'P-0045',
      { kind: 'aborted', reason: 'interruption', repsCompleted: 1, elapsedMs: 3100 },
      post(33),
    ),
  )

  // EDGE: hand contact. Recorded in full, marked protocol-invalid, no alarm.
  log.push(trial(s3post, 'P-0048', handContact([3000, 3200, 3500, 3800, 4000], 4), post(39)))

  // EDGE: unable to perform the protocol. Still enrolled, still counted present.
  log.push(trial(s3post, 'P-0050', unable, post(45)))

  // EDGE: a correction appended on top of a complete trial. The original is
  // preserved forever; the roster shows the corrected outcome plus a marker.
  const miscounted = trial(s3post, 'P-0047', complete([3000, 3200, 3300, 3500, 3600]), post(51))
  log.push(miscounted)
  log.push({
    recordId: nextRecordId(),
    kind: 'correction',
    sessionId: s3post,
    participantId: 'P-0047',
    correctsRecordId: miscounted.recordId,
    outcome: incomplete([3000, 3200, 3300, 3500]),
    note: 'rep_miscount',
    atIso: post(52, 30),
  })
  // Outstanding at 115-3 後測: P-0046, P-0049, P-0051, P-0052, and P-0045.

  /* ── 115-1 前測 at the OTHER 據點: OPEN, 5 of 10 assessed ────────────────
     A second open session, at a different 據點, in a different 階段, on the same
     device. This is the pair that makes misattribution possible. */
  const other = (min: number, sec = 0) => at(S_115_1_PRE.dateIso, 14, min, sec)
  const s1pre = S_115_1_PRE.sessionId
  log.push(trial(s1pre, 'P-0061', complete([3200, 3400, 3500, 3700, 3900]), other(8)))
  log.push(trial(s1pre, 'P-0062', complete([2800, 2900, 3000, 3100, 3300]), other(14)))
  log.push(trial(s1pre, 'P-0063', incomplete([4400, 4800, 5200, 5600]), other(20)))
  log.push(trial(s1pre, 'P-0064', complete([3500, 3700, 3900, 4200, 4500]), other(26)))
  log.push(trial(s1pre, 'P-0065', handContact([3900, 4200, 4500, 4900, 5300], 2), other(32)))
  // Outstanding: P-0066 … P-0070.

  /* ── 114 年度第 3 期: both 場次 已結束. A finished 期, viewable and printable. */
  const oldPre = (min: number) => at(S_114_3_PRE.dateIso, 9, min)
  const p4pre = S_114_3_PRE.sessionId
  log.push(trial(p4pre, 'P-0041', complete([3100, 3300, 3400, 3600, 3900]), oldPre(11)))
  log.push(trial(p4pre, 'P-0042', complete([3700, 3900, 4200, 4500, 4900]), oldPre(17)))
  log.push(trial(p4pre, 'P-0043', complete([2600, 2700, 2800, 2900, 3100]), oldPre(23)))
  log.push(trial(p4pre, 'P-0044', complete([4100, 4400, 4700, 5000, 5400]), oldPre(29)))
  log.push(trial(p4pre, 'P-0045', complete([2900, 3000, 3100, 3300, 3500]), oldPre(35)))
  log.push(trial(p4pre, 'P-0046', incomplete([4600, 5000, 5500]), oldPre(41)))
  log.push(trial(p4pre, 'P-0047', complete([3300, 3500, 3700, 3900, 4200]), oldPre(47)))
  log.push(trial(p4pre, 'P-0048', complete([3600, 3800, 4000, 4300, 4600]), oldPre(53)))
  log.push(trial(p4pre, 'P-0049', complete([2800, 2900, 3000, 3200, 3400]), oldPre(59)))
  log.push(trial(p4pre, 'P-0050', unable, oldPre(64)))

  const oldPost = (min: number) => at(S_114_3_POST.dateIso, 9, min)
  const p4post = S_114_3_POST.sessionId
  log.push(trial(p4post, 'P-0041', complete([2800, 2900, 3000, 3200, 3400]), oldPost(10)))
  log.push(trial(p4post, 'P-0042', complete([3300, 3500, 3700, 4000, 4300]), oldPost(16)))
  log.push(trial(p4post, 'P-0043', complete([2300, 2400, 2500, 2600, 2700]), oldPost(22)))
  log.push(trial(p4post, 'P-0044', complete([3700, 3900, 4200, 4500, 4800]), oldPost(28)))
  log.push(trial(p4post, 'P-0045', complete([2600, 2700, 2800, 2900, 3100]), oldPost(34)))
  log.push(trial(p4post, 'P-0046', incomplete([4200, 4500, 4900]), oldPost(40)))
  log.push(trial(p4post, 'P-0047', complete([3000, 3200, 3300, 3500, 3800]), oldPost(46)))
  log.push(trial(p4post, 'P-0048', complete([3300, 3400, 3600, 3800, 4100]), oldPost(52)))
  // P-0049 absent at the 後測 — no record, and the sheet says 未記錄.
  log.push(trial(p4post, 'P-0050', unable, oldPost(58)))

  return log
}

/* ── Live trial simulation ────────────────────────────────────────────────────
   Scripts the scenario switcher can select. Each emits the same TrialEvent shapes
   the Python pipeline will emit in October.
   ───────────────────────────────────────────────────────────────────────────── */

export type TrialScript =
  | 'complete_typical'
  | 'complete_slow'
  | 'incomplete_three'
  | 'hand_contact'
  | 'void_midway'

const SCRIPTS: Record<TrialScript, { reps: readonly number[]; handContactRep?: number; voidAfter?: number }> = {
  complete_typical: { reps: [2400, 2500, 2600, 2700, 2900] },
  complete_slow: { reps: [3400, 3700, 3900, 4200, 4600] },
  // Ends after 3 reps and then waits: the facilitator presses 結束, which is
  // what produces `incomplete`. The instrument never decides someone is done.
  incomplete_three: { reps: [4100, 4500, 4900] },
  hand_contact: { reps: [3000, 3200, 3600, 3900, 4200], handContactRep: 3 },
  void_midway: { reps: [2600, 2700], voidAfter: 2 },
}

interface LiveTrial {
  readonly trialId: TrialId
  readonly sessionId: SessionId
  readonly participantId: ParticipantId
  readonly script: TrialScript
  readonly startedIso: string
  handlers: Set<(e: TrialEvent) => void>
  timers: number[]
  repTimes: number[]
  handContactAt: number | null
  voided: boolean
  settled: boolean
}

/* ── The source ───────────────────────────────────────────────────────────── */

export class FixtureDataSource implements SessionDataSource {
  readonly isSimulated = true

  private log: AnyRecord[] = buildLog()
  private tracking: TrackingState = 'idle'
  private trackingHandlers = new Set<(s: TrackingState) => void>()
  private recordHandlers = new Set<() => void>()
  private live: LiveTrial | null = null
  private trialSeq = 0
  private enrolled: Map<SiteId, Participant[]> = new Map([
    ['SITE-01', [...ENROLLED_01]],
    ['SITE-02', [...ENROLLED_02]],
  ])
  /** Above every seeded id, so a newly enrolled person can never collide. */
  private enrolSeq = 72
  private sessions: AssessmentSession[] = [...SESSIONS]
  private blocks: Block[] = [...BLOCKS]

  /** Selected by the scenario switcher. Drives the next live trial. */
  nextScript: TrialScript = 'complete_typical'

  async getBlocks(): Promise<readonly Block[]> {
    return this.blocks
  }

  async getSessions(): Promise<readonly AssessmentSession[]> {
    return this.sessions
  }

  async getSites(): Promise<readonly Site[]> {
    return SITES
  }

  async getEnrolment(siteId: SiteId): Promise<readonly Participant[]> {
    return this.enrolled.get(siteId) ?? []
  }

  /**
   * The STORE assigns the pseudonymous id. Staff supply a display label and
   * nothing else — there is no name parameter, by invariant 2.
   */
  async enrolParticipant(siteId: SiteId, label: string): Promise<Participant> {
    const p: Participant = {
      id: `P-${(++this.enrolSeq).toString().padStart(4, '0')}`,
      label: label.trim(),
    }
    this.enrolled.set(siteId, [...(this.enrolled.get(siteId) ?? []), p])
    this.announceRecords()
    return p
  }

  /**
   * Open, resume, or reopen the configured session.
   *
   * ONE SESSION PER (據點, 年度, 期, 階段). A second 後測 in the same 期 would be
   * precisely the ambiguity the whole feature exists to remove, so revisiting
   * setup with the same four values resumes rather than forks — and reopens the
   * session if it had been ended.
   *
   * Records are NEVER discarded here: the log is append-only, and a setup screen
   * that silently dropped a morning's measurements because someone revisited it
   * would be the worst possible bug in this product. Enrolment in the 期 only
   * grows, for the same reason — removing someone from the 期 would orphan the
   * records she already has.
   */
  async openSession(setup: SessionSetup): Promise<AssessmentSession> {
    const site = SITES.find((s) => s.siteId === setup.siteId) ?? SITES[0]!
    const roster = this.enrolled.get(site.siteId) ?? []
    const attendees = pick(roster, setup.attendeeIds)

    let block = this.blocks.find(
      (b) => b.siteId === site.siteId && b.year === setup.year && b.cycle === setup.cycle,
    )

    if (!block) {
      block = {
        blockId: `B-${site.siteId}-${setup.year}-${setup.cycle}`,
        siteId: site.siteId,
        siteName: site.name,
        blockName: `${setup.year} 年度第 ${setup.cycle} 期`,
        year: setup.year,
        cycle: setup.cycle,
        startedIso: today(),
        participants: attendees,
      }
      this.blocks = [...this.blocks, block]
    } else {
      const known = new Set(block.participants.map((p) => p.id))
      const added = attendees.filter((p) => !known.has(p.id))
      if (added.length > 0) {
        const grown: Block = { ...block, participants: [...block.participants, ...added] }
        this.blocks = this.blocks.map((b) => (b.blockId === grown.blockId ? grown : b))
        block = grown
      }
    }

    const existing = this.sessions.find(
      (s) => s.blockId === block!.blockId && s.phase === setup.phase,
    )
    const updated: AssessmentSession = existing
      ? { ...existing, status: 'open', attendeeIds: setup.attendeeIds }
      : {
          sessionId: `S-${block.blockId}-${setup.phase}`,
          blockId: block.blockId,
          phase: setup.phase,
          dateIso: today(),
          status: 'open',
          attendeeIds: setup.attendeeIds,
        }

    this.sessions = existing
      ? this.sessions.map((s) => (s.sessionId === updated.sessionId ? updated : s))
      : [...this.sessions, updated]
    this.announceRecords()
    return updated
  }

  async completeSession(sessionId: SessionId): Promise<AssessmentSession> {
    return this.setStatus(sessionId, 'completed')
  }

  async reopenSession(sessionId: SessionId): Promise<AssessmentSession> {
    return this.setStatus(sessionId, 'open')
  }

  private setStatus(sessionId: SessionId, status: 'open' | 'completed'): AssessmentSession {
    const found = this.sessions.find((s) => s.sessionId === sessionId)
    if (!found) throw new Error(`unknown session ${sessionId}`)
    const updated: AssessmentSession = { ...found, status }
    this.sessions = this.sessions.map((s) => (s.sessionId === sessionId ? updated : s))
    this.announceRecords()
    return updated
  }

  /**
   * The write guard.
   *
   * Every path that appends to the log goes through here. The UI refuses first
   * and says why — see `trialGate` — but a refusal that lives only in a
   * component is one careless call site away from being gone.
   */
  private assertWritable(sessionId: SessionId, participantId?: ParticipantId): AssessmentSession {
    const session = this.sessions.find((s) => s.sessionId === sessionId)
    if (!session) throw new Error(`unknown session ${sessionId}`)
    if (session.status !== 'open') throw new Error(`session ${sessionId} is completed`)
    if (participantId !== undefined && !session.attendeeIds.includes(participantId)) {
      throw new Error(`${participantId} is not an attendee of ${sessionId}`)
    }
    return session
  }

  async getRecords(sessionId: SessionId): Promise<readonly AnyRecord[]> {
    return this.log.filter((r) => r.sessionId === sessionId)
  }

  getTrackingState(): TrackingState {
    return this.tracking
  }

  subscribeTracking(handler: (s: TrackingState) => void): Unsubscribe {
    this.trackingHandlers.add(handler)
    return () => this.trackingHandlers.delete(handler)
  }

  subscribeRecords(handler: () => void): Unsubscribe {
    this.recordHandlers.add(handler)
    return () => this.recordHandlers.delete(handler)
  }

  private setTracking(s: TrackingState) {
    this.tracking = s
    for (const h of this.trackingHandlers) h(s)
    this.emit({ type: 'tracking', state: s })
  }

  private emit(e: TrialEvent) {
    if (!this.live) return
    for (const h of this.live.handlers) h(e)
  }

  private announceRecords() {
    for (const h of this.recordHandlers) h()
  }

  private append(r: AnyRecord) {
    this.log = [...this.log, r]
    this.announceRecords()
  }

  async startTrial(sessionId: SessionId, participantId: ParticipantId): Promise<TrialId> {
    this.assertWritable(sessionId, participantId)
    this.clearLive()
    const trialId = `T-${++this.trialSeq}`
    const script = this.nextScript
    this.live = {
      trialId,
      sessionId,
      participantId,
      script,
      startedIso: new Date().toISOString(),
      handlers: new Set(),
      timers: [],
      repTimes: [],
      handContactAt: null,
      voided: false,
      settled: false,
    }
    // Tracking goes live one frame after the cue, as it would on the appliance.
    const t = window.setTimeout(() => this.beginScript(), 120)
    this.live.timers.push(t)
    return trialId
  }

  private beginScript() {
    const live = this.live
    if (!live) return
    this.setTracking('live')

    const spec = SCRIPTS[live.script]
    let elapsed = 0

    spec.reps.forEach((repMs, i) => {
      elapsed += repMs
      const at = elapsed
      const index = i + 1
      const t = window.setTimeout(() => {
        if (!this.live || this.live.trialId !== live.trialId || this.live.settled) return

        if (spec.voidAfter !== undefined && index > spec.voidAfter) return

        this.live.repTimes.push(repMs)
        this.emit({ type: 'rep', index, repMs, elapsedMs: at })

        if (spec.handContactRep === index) {
          this.live.handContactAt = index
          this.emit({ type: 'hand_contact', repIndex: index })
        }

        // Auto-settle only at the prescribed rep count. Fewer reps require the
        // facilitator to press 結束; the instrument never decides.
        if (index === PRESCRIBED_REPS) {
          this.settleComplete()
        }
      }, at)
      live.timers.push(t)
    })

    if (spec.voidAfter !== undefined) {
      const voidAtRep = spec.reps.slice(0, spec.voidAfter)
      const voidAt = sum(voidAtRep) + 900
      const t = window.setTimeout(() => {
        if (!this.live || this.live.trialId !== live.trialId || this.live.settled) return
        this.live.voided = true
        this.live.settled = true
        this.setTracking('lost')
        const outcome: Outcome = {
          kind: 'void',
          reason: 'roi_multiple_people',
          repsCompleted: this.live.repTimes.length,
        }
        this.append(this.toRecord(this.live, outcome))
        this.emit({ type: 'void', reason: 'roi_multiple_people' })
        this.emit({ type: 'settled', outcome })
      }, voidAt)
      live.timers.push(t)
    }
  }

  private toRecord(live: LiveTrial, outcome: Outcome): AnyRecord {
    return {
      recordId: nextRecordId(),
      kind: 'trial',
      sessionId: live.sessionId,
      participantId: live.participantId,
      outcome,
      startedIso: live.startedIso,
      seatHeightCm: outcome.kind === 'unable' ? null : SEAT_CM,
    }
  }

  private settleComplete() {
    const live = this.live
    if (!live || live.settled) return
    live.settled = true
    this.setTracking('idle')

    const outcome: Outcome =
      live.handContactAt !== null
        ? handContact(live.repTimes, live.handContactAt)
        : complete(live.repTimes)

    this.append(this.toRecord(live, outcome))
    this.emit({ type: 'settled', outcome })
  }

  async endTrial(): Promise<Outcome> {
    const live = this.live
    if (!live) throw new Error('no live trial')
    if (live.settled) throw new Error('trial already settled')

    live.settled = true
    this.clearTimers(live)
    this.setTracking('idle')

    const reps = live.repTimes
    const outcome: Outcome =
      live.handContactAt !== null
        ? handContact(reps, live.handContactAt)
        : reps.length >= PRESCRIBED_REPS
          ? complete(reps)
          : incomplete(reps)

    this.append(this.toRecord(live, outcome))
    this.emit({ type: 'settled', outcome })
    return outcome
  }

  async abortTrial(_trialId: TrialId, reason: AbortReason): Promise<Outcome> {
    const live = this.live
    if (!live) throw new Error('no live trial')
    live.settled = true
    this.clearTimers(live)
    this.setTracking('idle')

    const outcome: Outcome = {
      kind: 'aborted',
      reason,
      repsCompleted: live.repTimes.length,
      elapsedMs: sum(live.repTimes),
    }
    this.append(this.toRecord(live, outcome))
    this.emit({ type: 'settled', outcome })
    return outcome
  }

  async markUnable(sessionId: SessionId, participantId: ParticipantId): Promise<Outcome> {
    this.assertWritable(sessionId, participantId)
    const outcome: Outcome = { kind: 'unable' }
    this.append({
      recordId: nextRecordId(),
      kind: 'trial',
      sessionId,
      participantId,
      outcome,
      startedIso: new Date().toISOString(),
      seatHeightCm: null,
    })
    return outcome
  }

  async appendCorrection(input: {
    sessionId: SessionId
    participantId: ParticipantId
    correctsRecordId: RecordId
    outcome: Outcome
    note: CorrectionNote
  }): Promise<void> {
    // Correcting is writing. A finished 場次 has to be reopened first, which is
    // one deliberate act away and visible when it happens.
    this.assertWritable(input.sessionId, input.participantId)
    this.append({
      recordId: nextRecordId(),
      kind: 'correction',
      sessionId: input.sessionId,
      participantId: input.participantId,
      correctsRecordId: input.correctsRecordId,
      outcome: input.outcome,
      note: input.note,
      atIso: new Date().toISOString(),
    })
  }

  subscribeTrial(trialId: TrialId, handler: (e: TrialEvent) => void): Unsubscribe {
    const live = this.live
    if (!live || live.trialId !== trialId) return () => {}
    live.handlers.add(handler)
    return () => {
      live.handlers.delete(handler)
    }
  }

  /** Reset a void so the facilitator can restart from the cue. */
  discardLive() {
    this.clearLive()
    this.setTracking('idle')
  }

  private clearTimers(live: LiveTrial) {
    for (const t of live.timers) window.clearTimeout(t)
    live.timers = []
  }

  private clearLive() {
    if (this.live) this.clearTimers(this.live)
    this.live = null
  }
}

const today = () => new Date().toISOString().slice(0, 10)
