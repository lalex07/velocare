import { useCallback, useEffect, useMemo, useState } from 'react'
import { AppHeader, type Crumb } from './components/AppHeader'
import { DemoBadge } from './components/DemoDisclosure'
import { RailButton } from './components/RailButton'
import { Refusal } from './components/Refusal'
import { ScenarioSwitcher, type ScenarioActions } from './components/ScenarioSwitcher'
import { SessionBand, describeSession } from './components/SessionBand'
import { useDataSource } from './data/context'
import type { FixtureDataSource, TrialScript } from './data/fixtures'
import { currentTrialFor } from './domain/records'
import {
  attendeesOf,
  blockOf,
  identityOf,
  listOrder,
  sessionsOfBlock,
  trialGate,
} from './domain/sessions'
import type {
  AssessmentSession,
  CorrectionNote,
  Outcome,
  Participant,
  ParticipantId,
  SessionId,
  SessionSetup,
} from './domain/types'
import { useSessions } from './hooks/useSession'
import { strings } from './i18n/strings'
import { ParticipantDetail } from './surfaces/ParticipantDetail'
import { Result } from './surfaces/Result'
import { Roster } from './surfaces/Roster'
import { SessionList } from './surfaces/SessionList'
import { Setup } from './surfaces/Setup'
import { Sheet } from './surfaces/Sheet'
import { Trial } from './surfaces/Trial'
import { CorrectionDialog } from './surfaces/dialogs/CorrectionDialog'
import { SessionStatusDialog } from './surfaces/dialogs/SessionStatusDialog'
import { ClearDataDialog } from './surfaces/dialogs/ClearDataDialog'
import { DeleteSessionDialog } from './surfaces/dialogs/DeleteSessionDialog'

/**
 * The surfaces nest, and the header renders that nesting as a path:
 *
 *   場次 ──┬──► 新增場次
 *          └──► roster ──┬──► trial ──► result ──► detail
 *                        ├──► detail
 *                        └──► sheet
 *
 * `result` is the post-trial surface: this person's time, and move on. It is
 * deliberately NOT `detail` — see the dignity constraint in Result.tsx.
 *
 * `back` is therefore structural — the level above — rather than a visit
 * history. Someone who reaches 紀錄 from a finished trial goes UP to the
 * roster, not back into the trial they just completed.
 *
 * ── THE ACTIVE SESSION ──────────────────────────────────────────────────────
 *
 * Several 場次 are open on one device at once, so there is no implicit current
 * session and nothing here infers one. `activeSessionId` is set by exactly ONE
 * action — choosing a row on the session list — and every surface below the
 * roster reads it back through the context band. Navigating never changes it;
 * `switchedTo` makes it visible on the few occasions it does change.
 *
 * When the id no longer resolves — a session that vanished, a 期 that did not
 * load — the app falls back to the list rather than to a guess. See the
 * `trialGate` header comment for why that posture is the point.
 */
type View =
  | { kind: 'sessions' }
  | { kind: 'setup' }
  | { kind: 'roster' }
  | { kind: 'trial'; participantId: ParticipantId }
  /** Immediately after a trial. Carries the settled outcome so the surface does
      not have to re-derive which of several attempts it is showing. */
  | { kind: 'result'; participantId: ParticipantId; outcome: Outcome }
  | { kind: 'detail'; participantId: ParticipantId }
  | { kind: 'sheet' }

/** How long the "you just switched" line stays up. Long enough to read aloud. */
const SWITCH_NOTICE_MS = 8000

export function App() {
  const src = useDataSource()
  const [activeSessionId, setActiveSessionId] = useState<SessionId | null>(null)
  const [view, setView] = useState<View>({ kind: 'sessions' })
  const [scenarioOpen, setScenarioOpen] = useState(false)
  const [correcting, setCorrecting] = useState(false)
  const [statusDialog, setStatusDialog] = useState<'end' | 'reopen' | null>(null)
  /* The session whose switch has not been announced yet — an ID, not a label.
     A newly created 場次 is activated before its 期 has finished loading, so
     resolving the name at activation time produced no announcement at all for
     exactly the case where one matters most. Resolved at render instead. */
  const [announcing, setAnnouncing] = useState<SessionId | null>(null)
  const [clearing, setClearing] = useState(false)
  const [deleting, setDeleting] = useState<{ id: SessionId; name: string; records: number } | null>(
    null,
  )
  const [hasExample, setHasExample] = useState(false)

  const { blocks, sessions, allResolved, loaded } = useSessions()

  /* Re-asked whenever the log changes rather than held as derived state, so the
     control's label can never disagree with what is actually loaded. */
  useEffect(() => {
    void src.hasExampleData().then(setHasExample)
  }, [src, blocks])

  // The scenario switcher needs the fixture-only `nextScript` knob. Narrowed
  // here rather than widening SessionDataSource, so the October implementation
  // is not obliged to grow a demo affordance.
  const fixture = src as unknown as Partial<FixtureDataSource>

  const active = sessions.find((s) => s.sessionId === activeSessionId) ?? null
  const block = blockOf(blocks, active)
  const resolved = (active && allResolved.get(active.sessionId)) ?? []
  const attendees = attendeesOf(active, block)
  const blockSessions = block ? sessionsOfBlock(sessions, block.blockId) : []
  const gate = trialGate(active, block)

  const participantsById = useMemo(() => {
    const m = new Map<ParticipantId, Participant>()
    for (const p of attendees) m.set(p.id, p)
    return m
  }, [attendees])

  // Scenario switcher: S toggles. Ignored while typing in a field.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT')) return
      if (e.key === 's' || e.key === 'S') setScenarioOpen((v) => !v)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  /* If the active session stops resolving, fall back to the list. Never to a
     substitute session: "close enough" is how a trial ends up in the wrong 期. */
  useEffect(() => {
    if (!loaded) return
    if (view.kind === 'sessions' || view.kind === 'setup') return
    if (!active || !block) {
      setActiveSessionId(null)
      setView({ kind: 'sessions' })
    }
  }, [loaded, view.kind, active, block])

  useEffect(() => {
    if (!announcing) return
    const t = window.setTimeout(() => setAnnouncing(null), SWITCH_NOTICE_MS)
    return () => window.clearTimeout(t)
  }, [announcing])

  const firstOutstanding = useCallback((): Participant | null => {
    for (const p of attendees) {
      if (currentTrialFor(resolved, p.id) === null) return p
    }
    return attendees[0] ?? null
  }, [attendees, resolved])

  /**
   * The next person still to be measured, skipping the one just finished.
   *
   * Roster order, not "nearest after this index": a facilitator calls the class
   * in list order, and after a mid-list redo the next name should still be the
   * first outstanding one rather than whoever happens to sit below.
   */
  const nextOutstanding = useCallback(
    (afterId: ParticipantId): Participant | null => {
      for (const p of attendees) {
        if (p.id !== afterId && currentTrialFor(resolved, p.id) === null) return p
      }
      return null
    },
    [attendees, resolved],
  )

  /**
   * The ONE place the active session changes.
   *
   * Deliberate by construction: it is only ever called from a row on the
   * session list or from the setup screen's begin button, never from a
   * navigation. It marks the change for announcement whenever it is a real
   * change, so the context band says so out loud rather than quietly showing
   * different words.
   */
  const activate = useCallback(
    (session: AssessmentSession, next: View) => {
      if (session.sessionId !== activeSessionId) setAnnouncing(session.sessionId)
      setActiveSessionId(session.sessionId)
      setView(next)
    },
    [activeSessionId],
  )

  /* Resolved here, not at activation: a session created a moment ago is active
     before `blocks` has reloaded, and naming it then yielded nothing. */
  const switchedTo =
    announcing && active && block && active.sessionId === announcing
      ? describeSession(identityOf(active, block))
      : null

  const goSessions = () => setView({ kind: 'sessions' })
  const goRoster = () => setView({ kind: 'roster' })

  const actions: ScenarioActions = {
    gotoSessions: goSessions,
    gotoSession: (id) => {
      const s = sessions.find((x) => x.sessionId === id)
      if (s) activate(s, { kind: 'roster' })
    },
    openSessions: listOrder(sessions).map((s) => {
      const b = blockOf(blocks, s)
      return {
        sessionId: s.sessionId,
        label: b ? describeSession(identityOf(s, b)) : s.sessionId,
        status: s.status,
      }
    }),
    gotoSheet: () => active && setView({ kind: 'sheet' }),
    runTrial: (script: TrialScript) => {
      if (fixture.nextScript !== undefined) fixture.nextScript = script
      const p = firstOutstanding()
      if (p && gate.ok) setView({ kind: 'trial', participantId: p.id })
    },
    showResult: () => {
      const p = firstOutstanding()
      if (p) setView({ kind: 'detail', participantId: p.id })
    },
  }

  async function loadExample() {
    await src.loadExampleData()
    setHasExample(true)
  }

  /* Clears EVERYTHING, example and locally recorded alike, and says so in the
     dialog. A control that silently spared "real" records would be worse: it
     would leave a facilitator unsure what is still on the machine. */
  async function clearAll() {
    setClearing(false)
    setActiveSessionId(null)
    setView({ kind: 'sessions' })
    await src.clearAllData()
    setHasExample(false)
  }

  /* Whole 場次 only. There is no per-record delete in this product — see the
     boundary note on SessionDataSource.deleteSession. */
  async function deleteSession() {
    const target = deleting
    setDeleting(null)
    if (!target) return
    if (target.id === activeSessionId) {
      setActiveSessionId(null)
      setView({ kind: 'sessions' })
    }
    await src.deleteSession(target.id)
    setHasExample(await src.hasExampleData())
  }

  async function beginSession(setup: SessionSetup) {
    const opened = await src.openSession(setup)
    activate(opened, { kind: 'roster' })
  }

  async function endSession() {
    setStatusDialog(null)
    if (!active) return
    await src.completeSession(active.sessionId)
    // Back to the list, not into a read-only roster: ending a 場次 is the end of
    // a piece of work, and the next thing anyone does is pick the next one.
    setView({ kind: 'sessions' })
  }

  async function reopenSession() {
    setStatusDialog(null)
    if (!active) return
    await src.reopenSession(active.sessionId)
  }

  const current =
    view.kind === 'trial' || view.kind === 'detail' || view.kind === 'result'
      ? participantsById.get(view.participantId)
      : undefined
  const currentTrial = current ? currentTrialFor(resolved, current.id) : null

  /* The path to the current surface. Root first, current last; the last entry
     has no `go`, which is what marks it as current and makes it the <h1>. */
  const trail: Crumb[] = [
    {
      title: strings.nav.placeSessions,
      icon: 'roster',
      go: view.kind === 'sessions' ? undefined : goSessions,
    },
  ]
  if (view.kind === 'setup') {
    trail.push({ title: strings.nav.placeSetup, icon: 'roster' })
  } else if (view.kind !== 'sessions') {
    trail.push({
      title: strings.nav.placeRoster,
      icon: 'roster',
      go: view.kind === 'roster' ? undefined : goRoster,
    })
  }
  if (view.kind === 'trial') {
    trail.push({ title: strings.nav.placeTrial(current?.label ?? ''), icon: 'trial' })
  } else if (view.kind === 'result') {
    trail.push({ title: strings.nav.placeTrialResult(current?.label ?? ''), icon: 'record' })
  } else if (view.kind === 'detail') {
    trail.push({ title: strings.nav.placeResult(current?.label ?? ''), icon: 'record' })
  } else if (view.kind === 'sheet') {
    trail.push({ title: strings.nav.placeSheet, icon: 'sheet' })
  }

  async function submitCorrection(outcome: Outcome, note: CorrectionNote) {
    setCorrecting(false)
    if (!current || !currentTrial || !active || !gate.ok) return
    await src.appendCorrection({
      sessionId: active.sessionId,
      participantId: current.id,
      correctsRecordId: currentTrial.latestRecordId,
      outcome,
      note,
    })
  }

  /* Header, then the session context band on every surface that has an active
     session. The band replaces the header's old read-only phase chip: with
     several 場次 open, 前測 alone is no longer enough to say where a number will
     land. See SessionBand.tsx. */
  const shell = (body: React.ReactNode) => (
    <div className="app">
      {/* First tab stop on every surface. Off-screen until focused. */}
      <a className="skip-link no-print" href="#main">
        {strings.nav.skipToMain}
      </a>
      <AppHeader
        trail={trail}
        demoSlot={<DemoBadge simulated={src.isSimulated} />}
        scenarioSlot={
          <ScenarioSwitcher
            open={scenarioOpen}
            onOpen={() => setScenarioOpen(true)}
            onClose={() => setScenarioOpen(false)}
            actions={actions}
          />
        }
      />
      {active && block && view.kind !== 'sessions' && view.kind !== 'setup' && (
        <SessionBand identity={identityOf(active, block)} switchedTo={switchedTo} />
      )}
      {/* The skip link's target. A wrapper the shell owns rather than an id on
          each surface, so a surface added later cannot forget to carry one and
          leave the link pointing at nothing. `tabIndex={-1}` is what lets focus
          actually land here; without it the browser scrolls but focus stays put
          and the next Tab returns to the header. */}
      <main id="main" className="app__main" tabIndex={-1}>
        {body}
      </main>
    </div>
  )

  if (view.kind === 'sessions') {
    return shell(
      <>
        <SessionList
          blocks={blocks}
          sessions={sessions}
          allResolved={allResolved}
          activeSessionId={activeSessionId}
          hasExample={hasExample}
          onOpen={(s) => activate(s, { kind: 'roster' })}
          onNew={() => setView({ kind: 'setup' })}
          onLoadExample={() => void loadExample()}
          onDelete={(s, name, records) => setDeleting({ id: s.sessionId, name, records })}
        />
        <DeleteSessionDialog
          open={deleting !== null}
          sessionName={deleting?.name ?? ''}
          recordCount={deleting?.records ?? 0}
          onCancel={() => setDeleting(null)}
          onConfirm={() => void deleteSession()}
        />
      </>,
    )
  }

  if (view.kind === 'setup')
    return shell(
      <>
        <Setup onBegin={(s) => void beginSession(s)} onReset={() => setClearing(true)} />
        <ClearDataDialog
          open={clearing}
          onCancel={() => setClearing(false)}
          onConfirm={() => void clearAll()}
        />
      </>,
    )

  if (!active || !block) return shell(<div className="field" />)

  const sessionName = describeSession(identityOf(active, block))

  return shell(
    <>
      {view.kind === 'roster' && (
        <div className="zones">
          <div className="field">
            <Roster
              attendees={attendees}
              resolved={resolved}
              gate={gate}
              onStart={(p) => setView({ kind: 'trial', participantId: p.id })}
              onReview={(p) => setView({ kind: 'detail', participantId: p.id })}
            />
          </div>
          <div className="rail">
            {/* The 據點/期/階段 line lives in the band above, which every surface
                carries. The rail keeps the count, which is this list's own. */}
            <div className="rail__context">
              <span className="rail__context-id">{strings.session.contextLabel}</span>
              <span className="rail__context-label">
                {strings.session.attendeeCount(attendees.length)}
              </span>
            </div>
            <div className="rail__spacer" />
            <div className="rail__actions">
              {/* Ending and reopening are the two acts that change whether this
                  device will record. Both are confirmed; neither is a toggle. */}
              {active.status === 'open' ? (
                <RailButton variant="quiet" onClick={() => setStatusDialog('end')}>
                  {strings.session.endAction}
                </RailButton>
              ) : (
                <RailButton variant="quiet" onClick={() => setStatusDialog('reopen')}>
                  {strings.session.reopenAction}
                </RailButton>
              )}
              <RailButton variant="primary" icon="sheet" onClick={() => setView({ kind: 'sheet' })}>
                {strings.roster.openSheet}
              </RailButton>
            </div>
          </div>
        </div>
      )}

      {view.kind === 'trial' && current && (
        <Trial
          participant={current}
          session={active}
          gate={trialGate(active, block, current.id)}
          onSettled={(outcome) => setView({ kind: 'result', participantId: current.id, outcome })}
          onBack={goRoster}
          onSessions={goSessions}
        />
      )}

      {/* A participant who is no longer on this 場次 — switched away from mid-
          rotation, or removed from the attendance list. The surface refuses
          rather than rendering a trial with nowhere to put its result. */}
      {(view.kind === 'trial' || view.kind === 'result' || view.kind === 'detail') && !current && (
        <div className="zones">
          <div className="field">
            <Refusal
              title={strings.session.refuseTitle}
              body={strings.session.refuse.not_attending}
              actions={
                <RailButton variant="primary" icon="roster" onClick={goRoster}>
                  {strings.nav.backToRoster}
                </RailButton>
              }
            />
          </div>
        </div>
      )}

      {view.kind === 'result' && current && (
        <Result
          participant={current}
          outcome={view.outcome}
          seatHeightCm={currentTrial?.original.seatHeightCm ?? null}
          nextParticipant={nextOutstanding(current.id)}
          onNext={() => {
            const n = nextOutstanding(current.id)
            setView(n ? { kind: 'trial', participantId: n.id } : { kind: 'roster' })
          }}
          onFullRecord={() => setView({ kind: 'detail', participantId: current.id })}
        />
      )}

      {view.kind === 'detail' && current && (
        <>
          <ParticipantDetail
            participant={current}
            sessions={blockSessions}
            allResolved={allResolved}
            writable={gate.ok}
            onCorrect={() => setCorrecting(true)}
            onRemeasure={() => setView({ kind: 'trial', participantId: current.id })}
            onDone={goRoster}
          />
          {currentTrial && (
            <CorrectionDialog
              open={correcting}
              original={currentTrial.outcome}
              onCancel={() => setCorrecting(false)}
              onConfirm={(o, n) => void submitCorrection(o, n)}
            />
          )}
        </>
      )}

      {view.kind === 'sheet' && (
        <Sheet
          block={block}
          sessions={blockSessions}
          allResolved={allResolved}
          generatedFrom={active}
        />
      )}

      <SessionStatusDialog
        open={statusDialog !== null}
        mode={statusDialog ?? 'end'}
        sessionName={sessionName}
        onCancel={() => setStatusDialog(null)}
        onConfirm={() => void (statusDialog === 'end' ? endSession() : reopenSession())}
      />
    </>,
  )
}
