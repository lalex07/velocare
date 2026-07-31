/* ─────────────────────────────────────────────────────────────────────────────
   The local data source. Implements SessionDataSource against browser storage.

   In October a LocalhostDataSource implements the identical interface against
   the Python pose pipeline. No UI code imports this file directly.

   ── IT SHIPS EMPTY ──────────────────────────────────────────────────────────

   No sessions, no participants, no records, on a first load. Ever.

   This file used to seed five 場次 across three 期 with about sixty completed
   measurements. Every one of those numbers described a trial that nobody
   performed, on a screen whose entire job is to report trials that people did
   perform. A viewer had no way to tell the difference, and the printed sheet —
   the artifact a 據點 files with a funding report — would have carried them.

   That is the same failure the rest of the product is built to avoid: 不可比較
   rather than a difference that cannot be justified; no 14-second threshold
   rather than a determination the instrument has no standing to make; a refusal
   to record rather than a guess about which 場次 a trial belongs to. **Do not
   assert what you cannot justify.** Seeded history asserted about sixty things.

   What remains simulated is the TRIAL ITSELF: rep timings come from the scripts
   below rather than from a camera, because there is no pose pipeline yet. That
   is disclosed by `isSimulated` on every surface and in the sheet's footer. The
   distinction is between "this measurement is simulated, and says so" and "this
   history is fabricated, and does not".

   ── AND IT STILL DEMONSTRATES ───────────────────────────────────────────────

   `loadExampleData()` builds one worked 期 with a 前測, a 後測 and every edge
   case. Off until pressed, reversible, and every 期 it creates carries
   `isExample`, which is rendered as a marker wherever the 期 appears — session
   list, context band, and the printed sheet in both the head and the footer.

   ── PERSISTENCE ─────────────────────────────────────────────────────────────

   Records live in localStorage so a facilitator's morning survives a reload.
   Records only: landmarks and frames are never stored anywhere, by invariant 1,
   and there is nothing in the persisted shape that could hold one.
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

/* ── 據點 ─────────────────────────────────────────────────────────────────────
   NOT a hardcoded list. An appliance is installed at a real 據點 and staff name
   it once, on the setup screen, so the site list starts empty like everything
   else and grows by `createSite`.

   This is also what keeps the uniqueness rule usable. There is exactly one 場次
   per (據點, 年度, 期, 階段) — that rule is the misattribution guard and does not
   get relaxed — but with a fixed two-item site list and a three-year picker,
   a 據點 running its second concurrent 場次 collided immediately. The room to
   have several open at once has to come from the INPUT side.
   ───────────────────────────────────────────────────────────────────────────── */

const EXAMPLE_SITE_ID = 'EX-SITE'

/* ── Persisted shape ───────────────────────────────────────────────────────── */

const STORAGE_KEY = 'velocare.local.v1'

interface PersistedState {
  readonly sites: Site[]
  readonly blocks: Block[]
  readonly sessions: AssessmentSession[]
  readonly log: AnyRecord[]
  readonly enrolment: Record<SiteId, Participant[]>
  readonly recordSeq: number
  readonly enrolSeq: number
  readonly siteSeq: number
}

const emptyState = (): PersistedState => ({
  sites: [],
  blocks: [],
  sessions: [],
  log: [],
  enrolment: {},
  recordSeq: 0,
  enrolSeq: 0,
  siteSeq: 0,
})

function readState(): PersistedState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyState()
    const parsed = JSON.parse(raw) as Partial<PersistedState>
    // Shape-checked rather than trusted. A half-written or older payload must
    // degrade to EMPTY, never to something that looks like a record.
    if (!Array.isArray(parsed.blocks) || !Array.isArray(parsed.sessions) || !Array.isArray(parsed.log)) {
      return emptyState()
    }
    return {
      sites: parsed.sites ?? [],
      blocks: parsed.blocks,
      sessions: parsed.sessions,
      log: parsed.log,
      enrolment: parsed.enrolment ?? {},
      recordSeq: parsed.recordSeq ?? 0,
      enrolSeq: parsed.enrolSeq ?? 0,
      siteSeq: parsed.siteSeq ?? 0,
    }
  } catch {
    return emptyState()
  }
}

/* ── The worked example ──────────────────────────────────────────────────────
   One 期, two 場次, twelve people, every edge case. Built on demand, never at
   construction, and stamped `isExample` at 期 level.
   ───────────────────────────────────────────────────────────────────────────── */

const EXAMPLE_PEOPLE: readonly Participant[] = [
  { id: 'E-0001', label: '王阿姨' },
  { id: 'E-0002', label: '陳媽' },
  { id: 'E-0003', label: '林伯' },
  { id: 'E-0004', label: '張姐' },
  { id: 'E-0005', label: '李伯' },
  { id: 'E-0006', label: '黃阿姨' },
  { id: 'E-0007', label: '吳媽' },
  { id: 'E-0008', label: '蔡伯' },
  { id: 'E-0009', label: '鄭姐' },
  { id: 'E-0010', label: '許阿姨' },
  { id: 'E-0011', label: '曾伯' },
  { id: 'E-0012', label: '何媽' },
]

/* `E-` and not `P-`, so an example participant is distinguishable from a real
   one by its id alone — in the log, in a console, and on the printed sheet. */
const EXAMPLE_BLOCK_ID = 'EXAMPLE-115-3'
const EXAMPLE_PRE = 'EXAMPLE-115-3-pre'
const EXAMPLE_POST = 'EXAMPLE-115-3-post'

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

/** Valid ISO timestamp from a minute offset. Minutes above 59 roll into hours. */
function at(dateIso: string, fromHour: number, minuteOffset: number, second = 0): string {
  const h = fromHour + Math.floor(minuteOffset / 60)
  const m = minuteOffset % 60
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${dateIso}T${pad(h)}:${pad(m)}:${pad(second)}`
}

const today = () => new Date().toISOString().slice(0, 10)

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
  /** The TRIAL is simulated — rep timings come from a script, not a camera.
      Records are not: everything in the log was either performed here or is
      marked as an example. */
  readonly isSimulated = true

  private state: PersistedState = readState()
  private tracking: TrackingState = 'idle'
  private trackingHandlers = new Set<(s: TrackingState) => void>()
  private recordHandlers = new Set<() => void>()
  private live: LiveTrial | null = null
  private trialSeq = 0

  /** Selected by the scenario switcher. Drives the next live trial. */
  nextScript: TrialScript = 'complete_typical'

  private persist() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state))
    } catch {
      // A full or disabled store must not take the session down. The in-memory
      // state stays authoritative for this page; only durability is lost.
    }
  }

  private commit(next: Partial<PersistedState>) {
    this.state = { ...this.state, ...next }
    this.persist()
    this.announceRecords()
  }

  private nextRecordId(): RecordId {
    const n = this.state.recordSeq + 1
    this.state = { ...this.state, recordSeq: n }
    return `R-${n.toString().padStart(4, '0')}`
  }

  async getBlocks(): Promise<readonly Block[]> {
    return this.state.blocks
  }

  async getSessions(): Promise<readonly AssessmentSession[]> {
    return this.state.sessions
  }

  async getSites(): Promise<readonly Site[]> {
    return this.state.sites
  }

  async createSite(name: string): Promise<Site> {
    const n = this.state.siteSeq + 1
    const site: Site = { siteId: `SITE-${n.toString().padStart(2, '0')}`, name: name.trim() }
    this.commit({ siteSeq: n, sites: [...this.state.sites, site] })
    return site
  }

  async getEnrolment(siteId: SiteId): Promise<readonly Participant[]> {
    return this.state.enrolment[siteId] ?? []
  }

  /**
   * The STORE assigns the pseudonymous id. Staff supply a display label and
   * nothing else — there is no name parameter, by invariant 2.
   */
  async enrolParticipant(siteId: SiteId, label: string): Promise<Participant> {
    const n = this.state.enrolSeq + 1
    const p: Participant = { id: `P-${n.toString().padStart(4, '0')}`, label: label.trim() }
    this.commit({
      enrolSeq: n,
      enrolment: { ...this.state.enrolment, [siteId]: [...(this.state.enrolment[siteId] ?? []), p] },
    })
    return p
  }

  /* ── Example data ───────────────────────────────────────────────────────── */

  async hasExampleData(): Promise<boolean> {
    return this.state.blocks.some((b) => b.isExample === true)
  }

  async clearAllData(): Promise<void> {
    this.clearLive()
    this.state = emptyState()
    this.persist()
    this.announceRecords()
  }

  /**
   * Build the worked example.
   *
   * Everything here is marked. The 期 carries `isExample`, participants carry
   * `E-` ids rather than `P-`, and the UI renders a 示範資料 marker anywhere the
   * 期 shows — including the printed sheet, in both the head and the footer.
   */
  async loadExampleData(): Promise<void> {
    if (await this.hasExampleData()) return

    const preDate = '2026-05-04'
    const postDate = '2026-07-27'

    const exampleSite: Site = { siteId: EXAMPLE_SITE_ID, name: '示範社區照顧關懷據點' }

    const block: Block = {
      blockId: EXAMPLE_BLOCK_ID,
      siteId: exampleSite.siteId,
      siteName: exampleSite.name,
      blockName: '115 年度第 3 期',
      year: 115,
      cycle: 3,
      startedIso: preDate,
      participants: EXAMPLE_PEOPLE,
      isExample: true,
    }

    const ids = EXAMPLE_PEOPLE.map((p) => p.id)
    const pre: AssessmentSession = {
      sessionId: EXAMPLE_PRE,
      blockId: EXAMPLE_BLOCK_ID,
      phase: 'pre',
      dateIso: preDate,
      status: 'completed',
      attendeeIds: ids,
    }
    const post: AssessmentSession = {
      sessionId: EXAMPLE_POST,
      blockId: EXAMPLE_BLOCK_ID,
      phase: 'post',
      dateIso: postDate,
      status: 'open',
      attendeeIds: ids,
    }

    const log: AnyRecord[] = []
    let seq = this.state.recordSeq
    const rid = () => `R-${(++seq).toString().padStart(4, '0')}`
    const trial = (
      sessionId: SessionId,
      participantId: ParticipantId,
      outcome: Outcome,
      startedIso: string,
    ): AnyRecord => ({
      recordId: rid(),
      kind: 'trial',
      sessionId,
      participantId,
      outcome,
      startedIso,
      seatHeightCm: outcome.kind === 'unable' ? null : SEAT_CM,
    })

    /* 前測 — all twelve assessed, so the sheet has a real comparison to show. */
    const t1 = (min: number, sec = 0) => at(preDate, 9, min, sec)
    log.push(trial(EXAMPLE_PRE, 'E-0001', complete([2900, 3100, 3200, 3400, 3600]), t1(12)))
    log.push(trial(EXAMPLE_PRE, 'E-0002', complete([3400, 3600, 3900, 4100, 4400]), t1(18)))
    log.push(trial(EXAMPLE_PRE, 'E-0003', complete([2400, 2500, 2600, 2700, 2800]), t1(24)))
    log.push(trial(EXAMPLE_PRE, 'E-0004', complete([3800, 4000, 4300, 4600, 5000]), t1(31)))
    log.push(trial(EXAMPLE_PRE, 'E-0005', complete([2700, 2800, 2900, 3000, 3200]), t1(37)))
    log.push(trial(EXAMPLE_PRE, 'E-0006', incomplete([4200, 4600, 5100]), t1(43)))
    log.push(trial(EXAMPLE_PRE, 'E-0007', complete([3100, 3300, 3400, 3600, 3800]), t1(49)))
    log.push(trial(EXAMPLE_PRE, 'E-0008', handContact([3300, 3500, 3900, 4300, 4700], 3), t1(55)))
    log.push(trial(EXAMPLE_PRE, 'E-0009', complete([2600, 2700, 2800, 3000, 3100]), t1(61)))
    log.push(trial(EXAMPLE_PRE, 'E-0010', unable, t1(66)))
    log.push(trial(EXAMPLE_PRE, 'E-0011', complete([3000, 3200, 3300, 3500, 3700]), t1(70)))
    log.push(trial(EXAMPLE_PRE, 'E-0012', complete([3600, 3800, 4100, 4400, 4800]), t1(76)))

    /* 後測 — OPEN and mid-rotation, so the example lands on a session that can
       actually be worked rather than a finished one. Every edge case lives here. */
    const t2 = (min: number, sec = 0) => at(postDate, 9, min, sec)
    log.push(trial(EXAMPLE_POST, 'E-0001', complete([2500, 2600, 2700, 2800, 2900]), t2(10)))
    log.push(trial(EXAMPLE_POST, 'E-0002', complete([3000, 3100, 3300, 3500, 3700]), t2(16)))

    // EDGE: void from tracking loss, then a successful restart. Both stay in the
    // log; only the restart represents the participant.
    log.push(
      trial(EXAMPLE_POST, 'E-0003', { kind: 'void', reason: 'roi_multiple_people', repsCompleted: 2 }, t2(21)),
    )
    log.push(trial(EXAMPLE_POST, 'E-0003', complete([2200, 2300, 2300, 2400, 2500]), t2(22, 30)))

    // EDGE: incomplete. Three reps is a valid recorded outcome, not an error.
    log.push(trial(EXAMPLE_POST, 'E-0004', incomplete([4000, 4300, 4700]), t2(28)))

    // EDGE: abort with a reason. Does not represent the participant, so E-0005
    // still reads as outstanding on the roster.
    log.push(
      trial(
        EXAMPLE_POST,
        'E-0005',
        { kind: 'aborted', reason: 'interruption', repsCompleted: 1, elapsedMs: 3100 },
        t2(33),
      ),
    )

    // EDGE: hand contact. Recorded in full, marked protocol-invalid, no alarm.
    log.push(trial(EXAMPLE_POST, 'E-0008', handContact([3000, 3200, 3500, 3800, 4000], 4), t2(39)))

    // EDGE: unable to perform the protocol. Still enrolled, still counted present.
    log.push(trial(EXAMPLE_POST, 'E-0010', unable, t2(45)))

    // EDGE: a correction on top of a complete trial. The original is preserved
    // forever; the roster shows the corrected outcome plus a marker.
    const miscounted = trial(EXAMPLE_POST, 'E-0007', complete([3000, 3200, 3300, 3500, 3600]), t2(51))
    log.push(miscounted)
    log.push({
      recordId: rid(),
      kind: 'correction',
      sessionId: EXAMPLE_POST,
      participantId: 'E-0007',
      correctsRecordId: miscounted.recordId,
      outcome: incomplete([3000, 3200, 3300, 3500]),
      note: 'rep_miscount',
      atIso: t2(52, 30),
    })

    this.commit({
      sites: this.state.sites.some((x) => x.siteId === exampleSite.siteId)
        ? this.state.sites
        : [...this.state.sites, exampleSite],
      blocks: [...this.state.blocks, block],
      sessions: [...this.state.sessions, pre, post],
      log: [...this.state.log, ...log],
      recordSeq: seq,
    })
  }

  /* ── Session lifecycle ──────────────────────────────────────────────────── */

  /**
   * Open, resume, or reopen the configured session.
   *
   * ONE SESSION PER (據點, 年度, 期, 階段). Revisiting setup with the same four
   * values resumes rather than forks, and reopens the session if it had been
   * ended. Records are NEVER discarded here, and enrolment in the 期 only grows.
   *
   * A NEW 場次 ALWAYS STARTS AT ZERO MEASURED. Nothing here writes a record;
   * progress is derived from the log by `progressOf`, so "已量測 0 / 12" on a
   * fresh session is a fact about the log rather than an initial value someone
   * has to remember not to seed.
   */
  async openSession(setup: SessionSetup): Promise<AssessmentSession> {
    const site = this.state.sites.find((s) => s.siteId === setup.siteId)
    if (!site) throw new Error(`unknown site ${setup.siteId}`)
    const roster = this.state.enrolment[site.siteId] ?? []
    const attendees = roster.filter((p) => setup.attendeeIds.includes(p.id))

    let blocks = this.state.blocks
    let block = blocks.find(
      (b) => b.siteId === site.siteId && b.year === setup.year && b.cycle === setup.cycle && !b.isExample,
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
      blocks = [...blocks, block]
    } else {
      const known = new Set(block.participants.map((p) => p.id))
      const added = attendees.filter((p) => !known.has(p.id))
      if (added.length > 0) {
        const grown: Block = { ...block, participants: [...block.participants, ...added] }
        blocks = blocks.map((b) => (b.blockId === grown.blockId ? grown : b))
        block = grown
      }
    }

    const existing = this.state.sessions.find(
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

    this.commit({
      blocks,
      sessions: existing
        ? this.state.sessions.map((s) => (s.sessionId === updated.sessionId ? updated : s))
        : [...this.state.sessions, updated],
    })
    return updated
  }

  async completeSession(sessionId: SessionId): Promise<AssessmentSession> {
    return this.setStatus(sessionId, 'completed')
  }

  /**
   * Delete a whole 場次 and every record in it.
   *
   * THE DELETION BOUNDARY — see the interface for why it must not be widened.
   * There is no `deleteRecord` here and there must never be one: a record, once
   * written, is never altered. A miscount is fixed by APPENDING a correction
   * that points at the original, and both survive forever. The moment an
   * individual record becomes deletable, "correct it" and "delete the
   * inconvenient one" become the same gesture and nothing on the printed sheet
   * can be defended afterwards.
   *
   * A 期 left with no 場次 goes too — an empty 期 is not a thing anyone can act
   * on, and leaving it would make the uniqueness rule collide against a shell.
   */
  async deleteSession(sessionId: SessionId): Promise<void> {
    const target = this.state.sessions.find((s) => s.sessionId === sessionId)
    if (!target) return
    if (this.live?.sessionId === sessionId) this.clearLive()

    const sessions = this.state.sessions.filter((s) => s.sessionId !== sessionId)
    const orphaned = !sessions.some((s) => s.blockId === target.blockId)
    this.commit({
      sessions,
      log: this.state.log.filter((r) => r.sessionId !== sessionId),
      blocks: orphaned
        ? this.state.blocks.filter((b) => b.blockId !== target.blockId)
        : this.state.blocks,
    })
  }

  async reopenSession(sessionId: SessionId): Promise<AssessmentSession> {
    return this.setStatus(sessionId, 'open')
  }

  private setStatus(sessionId: SessionId, status: 'open' | 'completed'): AssessmentSession {
    const found = this.state.sessions.find((s) => s.sessionId === sessionId)
    if (!found) throw new Error(`unknown session ${sessionId}`)
    const updated: AssessmentSession = { ...found, status }
    this.commit({ sessions: this.state.sessions.map((s) => (s.sessionId === sessionId ? updated : s)) })
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
    const session = this.state.sessions.find((s) => s.sessionId === sessionId)
    if (!session) throw new Error(`unknown session ${sessionId}`)
    if (session.status !== 'open') throw new Error(`session ${sessionId} is completed`)
    if (participantId !== undefined && !session.attendeeIds.includes(participantId)) {
      throw new Error(`${participantId} is not an attendee of ${sessionId}`)
    }
    return session
  }

  async getRecords(sessionId: SessionId): Promise<readonly AnyRecord[]> {
    return this.state.log.filter((r) => r.sessionId === sessionId)
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
    this.commit({ log: [...this.state.log, r] })
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
      const atMs = elapsed
      const index = i + 1
      const t = window.setTimeout(() => {
        if (!this.live || this.live.trialId !== live.trialId || this.live.settled) return

        if (spec.voidAfter !== undefined && index > spec.voidAfter) return

        this.live.repTimes.push(repMs)
        this.emit({ type: 'rep', index, repMs, elapsedMs: atMs })

        if (spec.handContactRep === index) {
          this.live.handContactAt = index
          this.emit({ type: 'hand_contact', repIndex: index })
        }

        // Auto-settle only at the prescribed rep count. Fewer reps require the
        // facilitator to press 結束; the instrument never decides.
        if (index === PRESCRIBED_REPS) {
          this.settleComplete()
        }
      }, atMs)
      live.timers.push(t)
    })

    if (spec.voidAfter !== undefined) {
      const voidAt = sum(spec.reps.slice(0, spec.voidAfter)) + 900
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
      recordId: this.nextRecordId(),
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
      recordId: this.nextRecordId(),
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
      recordId: this.nextRecordId(),
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
