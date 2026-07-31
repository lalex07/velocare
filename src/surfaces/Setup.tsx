/* ─────────────────────────────────────────────────────────────────────────────
   Session setup — where a 場次 is configured. Reached from the session list.

   Where a session is configured: 據點, 期 (year + cycle), phase, who is here
   today, and a camera framing check before anyone sits down. Phase is CHOSEN
   here rather than toggled mid-session, which is what the roster rail used to
   do — a control that silently changes which assessment point you are recording
   into does not belong beside the list you are recording from.

   IT SAYS WHAT THE BUTTON WILL DO BEFORE IT IS PRESSED. There is exactly one
   場次 per (據點, 年度, 期, 階段) — a second 後測 in the same 期 would be the
   ambiguity this whole feature exists to remove — so configuring a combination
   that already exists RESUMES it rather than forking it, and reopens it if it
   had been ended. That is the right behaviour and the wrong thing to do
   silently, so the notice and the button label both change: 開始本場 becomes
   接續本場 or 重新開啟並開始, and the attendance list preloads from the 期 rather
   than from the site's whole book.

   INVARIANT 2 — NO NAME FIELD, EVER. The add-participant form has exactly one
   text input and it collects a short display label. The pseudonymous id is
   assigned by the store, not typed. `SessionDataSource.enrolParticipant` takes
   `(siteId, label)` and nothing else, so there is no parameter a name could be
   passed through even by mistake. The hint under the field says so in the
   interface, at the one place someone might be tempted.

   ATTENDANCE IS A COUNT, NOT A WARNING. Below an average of 10 per 期 the site
   loses the entire NT$36,000, so the number matters — but it is the 據點's
   number, not the device's business. It renders as plain text at the same
   weight as everything else: no red, no icon, no "too few" copy, no blocked
   button. The device reports; the site decides.

   Fixtures only, behind the interface. Nothing in this file knows where the
   enrolment list comes from, so a real participant store on the appliance drops
   in without a change here.
   ───────────────────────────────────────────────────────────────────────────── */

import { useEffect, useMemo, useRef, useState } from 'react'
import { CameraControls } from '../components/CameraControls'
import { DemoNotice } from '../components/DemoDisclosure'
import { CameraSelfView } from '../components/CameraSelfView'
import { RailButton } from '../components/RailButton'
import { Refusal } from '../components/Refusal'
import { useDataSource } from '../data/context'
import { useCameraPreview } from '../hooks/useCameraPreview'
import {
  FUNDED_ATTENDANCE_MIN,
  type AssessmentSession,
  type Block,
  type Participant,
  type ParticipantId,
  type Phase,
  type SessionSetup,
  type Site,
} from '../domain/types'
import { strings } from '../i18n/strings'

/* 期 stays a fixed set: the funding rule is a maximum of three 期 per year per
   特約服務點, so a free field here would invite an invalid value. 年度 does not —
   民國 years keep going, and pinning the picker to three of them is what made
   every second 場次 collide with the uniqueness rule. */
const CYCLES = [1, 2, 3] as const
const ROC_OFFSET = 1911
const thisRocYear = () => new Date().getFullYear() - ROC_OFFSET

export function Setup({
  onBegin,
  onReset,
}: {
  onBegin: (setup: SessionSetup) => void
  onReset: () => void
}) {
  const src = useDataSource()
  const camera = useCameraPreview()

  const [sites, setSites] = useState<readonly Site[]>([])
  const [enrolled, setEnrolled] = useState<readonly Participant[]>([])
  const [blocks, setBlocks] = useState<readonly Block[]>([])
  const [sessions, setSessions] = useState<readonly AssessmentSession[]>([])
  const [siteId, setSiteId] = useState<string>('')
  const [year, setYear] = useState<number>(thisRocYear)
  const [cycle, setCycle] = useState<number>(1)
  const [newSite, setNewSite] = useState('')
  const [siteAdded, setSiteAdded] = useState<string | null>(null)
  /* Set when 開始本場 is pressed while something is missing. The refusal is
     always visible in the relevant card; this is what scrolls it into view and
     moves focus, so pressing the primary action never does nothing. */
  const [pressed, setPressed] = useState(false)
  const siteInputRef = useRef<HTMLInputElement>(null)
  const labelInputRef = useRef<HTMLInputElement>(null)
  const picksRef = useRef<HTMLUListElement>(null)
  /** Set once the facilitator adjusts the attendance list by hand. */
  const touched = useRef(false)
  const [phase, setPhase] = useState<Phase>('post')
  const [attendees, setAttendees] = useState<ReadonlySet<ParticipantId>>(new Set())
  const [newLabel, setNewLabel] = useState('')
  const [justAdded, setJustAdded] = useState<Participant | null>(null)

  useEffect(() => {
    void (async () => {
      const [ss, bs, sess] = await Promise.all([src.getSites(), src.getBlocks(), src.getSessions()])
      setSites(ss)
      setBlocks(bs)
      setSessions(sess)
      setSiteId((prev) => prev || ss[0]?.siteId || '')
    })()
  }, [src])

  // Enrolment is per-據點, so it reloads when the 據點 changes.
  useEffect(() => {
    if (!siteId) return
    void (async () => setEnrolled(await src.getEnrolment(siteId)))()
  }, [src, siteId])

  /* Does the configured (據點, 年度, 期) already exist, and does it already have
     a 場次 for this 階段? Both answers change what the primary button does, and
     both are stated on screen before it is pressed. */
  const existingBlock =
    blocks.find((b) => b.siteId === siteId && b.year === year && b.cycle === cycle) ?? null
  const existingSession =
    (existingBlock &&
      sessions.find((s) => s.blockId === existingBlock.blockId && s.phase === phase)) ||
    null

  /* Preselect the people already in this 期, not everyone enrolled at the site.
     Enrolment is site-level and outlives any one 期; a facilitator unticking two
     absentees from today's class is less work than ticking twelve. When the 場次
     itself already exists, its OWN attendance is the better starting point —
     attendance varies session to session and that list is the last thing
     somebody at this 據點 confirmed. */
  useEffect(() => {
    if (existingSession) setAttendees(new Set(existingSession.attendeeIds))
    else if (existingBlock) setAttendees(new Set(existingBlock.participants.map((p) => p.id)))
    // `touched` guards the last branch only. Without it, enrolling somebody
    // re-selected EVERYONE — so a facilitator who unticked two absentees and
    // then added a newcomer silently got the absentees back, and the attendance
    // list is the thing the whole 場次 is recorded against. `add()` ticks the
    // person it just created, which is the only auto-selection that should
    // survive a manual adjustment.
    else if (!touched.current) setAttendees(new Set(enrolled.map((p) => p.id)))
    // Keyed on identity rather than on the objects, so retyping the same
    // combination does not stomp a selection the facilitator just adjusted.
  }, [existingSession?.sessionId, existingBlock?.blockId, enrolled]) // eslint-disable-line react-hooks/exhaustive-deps

  const count = attendees.size
  const sorted = useMemo(() => [...enrolled].sort((a, b) => a.id.localeCompare(b.id)), [enrolled])

  /* WHAT IS MISSING, AS A REASON — never as a disabled button.
     `Trial.tsx` and `Roster.tsx` both refuse the greyed-control pattern on the
     grounds that it tells a standing part-time worker that something is wrong
     and nothing about what to do, and that the next thing they will do is press
     it again. This surface is the FIRST one anyone sees and it had exactly that
     bug: `disabled={count === 0 || sites.length === 0}`.

     NOTE WHAT IS NOT IN HERE: the funding floor. Below an average of ten per 期
     a site loses the whole NT$36,000, so the number matters — but it is the
     據點's number, not the device's business. A 場次 with five attendees starts
     normally. FUNDED_ATTENDANCE_MIN is rendered as a count in the rail and gates
     nothing, here or anywhere. */
  const missing: 'no_site' | 'no_enrolment' | 'no_attendees' | null =
    sites.length === 0
      ? 'no_site'
      : enrolled.length === 0
        ? 'no_enrolment'
        : count === 0
          ? 'no_attendees'
          : null

  /** Take the facilitator to the control that fixes it. */
  function goToFix(reason: 'no_site' | 'no_enrolment' | 'no_attendees') {
    const el =
      reason === 'no_site'
        ? siteInputRef.current
        : reason === 'no_enrolment'
          ? labelInputRef.current
          : picksRef.current
    el?.scrollIntoView({ block: 'center', behavior: 'auto' })
    el?.focus()
  }

  function begin() {
    if (missing) {
      // Surfaces the reason rather than doing nothing.
      setPressed(true)
      goToFix(missing)
      return
    }
    onBegin({ siteId, year, cycle, phase, attendeeIds: [...attendees] })
  }

  const refusal = (reason: 'no_site' | 'no_enrolment' | 'no_attendees') => (
    <Refusal
      title={strings.setup.refuseTitle}
      body={strings.setup.refuse[reason]}
      actions={
        <RailButton variant="quiet" onClick={() => goToFix(reason)}>
          {strings.setup.refuseGoto[reason]}
        </RailButton>
      }
    />
  )

  const willReopen = existingSession?.status === 'completed'
  const sessionNote = existingSession
    ? existingBlock
      ? willReopen
        ? strings.session.willReopen(
            strings.session.describe(
              existingBlock.siteName,
              existingBlock.blockName,
              phase === 'pre' ? strings.phase.pre : strings.phase.post,
            ),
          )
        : strings.session.willResume(
            strings.session.describe(
              existingBlock.siteName,
              existingBlock.blockName,
              phase === 'pre' ? strings.phase.pre : strings.phase.post,
            ),
          )
      : null
    : strings.session.willCreate
  const beginWord = existingSession
    ? willReopen
      ? strings.session.beginReopen
      : strings.session.beginResume
    : strings.setup.begin

  function toggle(id: ParticipantId) {
    touched.current = true
    setAttendees((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function addSite() {
    const name = newSite.trim()
    if (!name) return
    const site = await src.createSite(name)
    setSites((prev) => [...prev, site])
    setSiteId(site.siteId)
    setNewSite('')
    setSiteAdded(site.name)
  }

  async function add() {
    const label = newLabel.trim()
    if (!label) return
    const p = await src.enrolParticipant(siteId, label)
    setEnrolled((prev) => [...prev, p])
    setAttendees((prev) => new Set(prev).add(p.id))
    setNewLabel('')
    setJustAdded(p)
  }

  return (
    <div className="zones">
      <div className="field">
        <div className="setup">
          {/* No heading here: the header trail's current segment is already this
              page's <h1> and repeating the title gave the surface two names. */}
          {/* The disclosure in full, un-collapsed, on the surface anyone
              opening the demo URL lands on. Elsewhere it is the header badge. */}
          <header className="setup__head">
            <DemoNotice simulated={src.isSimulated} />
            <p className="setup__lede">{strings.setup.lede}</p>
          </header>

          <div className="setup__grid">
            {/* ── 據點 and 期 ───────────────────────────────────────────── */}
            <section className="card">
              <h3 className="card__title">{strings.setup.blockLabel}</h3>

              {sites.length > 0 && (
                <label className="fld">
                  <span className="fld__label">{strings.setup.siteLabel}</span>
                  <select
                    className="fld__control"
                    value={siteId}
                    onChange={(e) => setSiteId(e.target.value)}
                  >
                    {sites.map((s) => (
                      <option key={s.siteId} value={s.siteId}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              {/* A sentence with the control to fix it directly reachable — the
                  新增據點 form is immediately below, and the button focuses it. */}
              {missing === 'no_site' && refusal('no_site')}

              {/* Creating a 據點 lives HERE rather than behind a settings screen.
                  It is also what makes concurrent 場次 possible without touching
                  the uniqueness rule: a 前測 at one 據點 and a 後測 at another are
                  different keys, so both can be open. */}
              <div className="addp">
                <h4 className="addp__title">{strings.setup.addSiteTitle}</h4>
                <label className="fld">
                  <span className="fld__label">{strings.setup.addSiteLabel}</span>
                  <input
                    ref={siteInputRef}
                    className="fld__control"
                    type="text"
                    value={newSite}
                    placeholder={strings.setup.addSitePlaceholder}
                    onChange={(e) => {
                      setNewSite(e.target.value)
                      setSiteAdded(null)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        void addSite()
                      }
                    }}
                  />
                  <span className="fld__hint">{strings.setup.addSiteHint}</span>
                </label>
                {/* THE ONE PLACE `disabled` IS STILL CORRECT, and the line is
                    worth stating so it is not read as an oversight or copied as
                    a licence. A refusal must give a route out when the reason
                    lives SOMEWHERE ELSE — that is why 開始本場 is never disabled.
                    Here the reason is the empty box 8px above the button, and it
                    is already focused; the control IS the route out, so there is
                    nothing a sentence could add. */}
                <RailButton onClick={() => void addSite()} disabled={newSite.trim().length === 0}>
                  {strings.setup.addSiteAction}
                </RailButton>
                {siteAdded && (
                  <p className="addp__done" role="status">
                    {strings.setup.siteAdded(siteAdded)}
                  </p>
                )}
              </div>

              <div className="fld-row">
                <label className="fld">
                  <span className="fld__label">{strings.setup.yearLabel}</span>
                  <input
                    className="fld__control"
                    type="number"
                    inputMode="numeric"
                    min={100}
                    max={200}
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                  />
                  <span className="fld__hint">{strings.setup.yearHint}</span>
                </label>

                <label className="fld">
                  <span className="fld__label">{strings.setup.cycleLabel}</span>
                  <select
                    className="fld__control"
                    value={cycle}
                    onChange={(e) => setCycle(Number(e.target.value))}
                  >
                    {CYCLES.map((c) => (
                      <option key={c} value={c}>
                        {strings.setup.cycleOf(c)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {/* Phase is a deliberate, explicit choice made once per session.
                  Radio rather than a toggle: a toggle invites a stray tap. */}
              <fieldset className="fld fld--group">
                <legend className="fld__label">{strings.setup.phaseChoice}</legend>
                <div className="seg">
                  {(['pre', 'post'] as const).map((p) => (
                    <label key={p} className={phase === p ? 'seg__opt seg__opt--on' : 'seg__opt'}>
                      <input
                        type="radio"
                        name="phase"
                        value={p}
                        checked={phase === p}
                        onChange={() => setPhase(p)}
                      />
                      <span>{p === 'pre' ? strings.phase.pre : strings.phase.post}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              {/* Said before the button is pressed, not discovered after. One
                  場次 per (據點, 年度, 期, 階段), so this combination either
                  resumes an existing one or creates a new one — and which of
                  those it is, is exactly the thing a facilitator has to know. */}
              {sessionNote && (
                <p className="card__hint card__hint--note" role="status">
                  {sessionNote}
                </p>
              )}
            </section>

            {/* ── Camera framing check ──────────────────────────────────── */}
            <section className="card card--camera">
              <h3 className="card__title">{strings.setup.framingTitle}</h3>
              <p className="card__hint">{strings.setup.framingHint}</p>
              {camera.status === 'live' && (
                <div className="setup__view">
                  <CameraSelfView attach={camera.attach} guide />
                </div>
              )}
              <CameraControls
                status={camera.status}
                onStart={() => void camera.start()}
                onStop={camera.stop}
              />
            </section>

            {/* ── Attendance ───────────────────────────────────────────── */}
            <section className="card card--wide">
              <div className="card__head">
                <h3 className="card__title">{strings.setup.attendeesTitle}</h3>
                <div className="card__actions">
                  <button
                    type="button"
                    className="linkbtn"
                    onClick={() => {
                      touched.current = true
                      setAttendees(new Set(enrolled.map((p) => p.id)))
                    }}
                  >
                    {strings.setup.selectAll}
                  </button>
                  <button
                    type="button"
                    className="linkbtn"
                    onClick={() => {
                      touched.current = true
                      setAttendees(new Set())
                    }}
                  >
                    {strings.setup.selectNone}
                  </button>
                </div>
              </div>
              <p className="card__hint">{strings.setup.attendeesHint}</p>
              {/* Stated once, plainly, next to the list it refers to. No colour,
                  no icon, no instruction: the count is the 據點's business. */}
              <p className="card__hint">{strings.setup.fundedNote}</p>

              {/* Both stated as refusals with a route out, same as every other
                  surface. Visible before the press, not only after it. */}
              {missing === 'no_enrolment' && refusal('no_enrolment')}
              {missing === 'no_attendees' && refusal('no_attendees')}

              <ul className="picks" ref={picksRef} tabIndex={-1}>
                {sorted.map((p) => {
                  const on = attendees.has(p.id)
                  return (
                    <li key={p.id}>
                      <label className={on ? 'pick pick--on' : 'pick'}>
                        <input type="checkbox" checked={on} onChange={() => toggle(p.id)} />
                        <span className="pick__label">{p.label}</span>
                        <span className="pick__id">{p.id}</span>
                      </label>
                    </li>
                  )
                })}
              </ul>

              <div className="addp">
                <h4 className="addp__title">{strings.setup.addTitle}</h4>
                <label className="fld">
                  <span className="fld__label">{strings.setup.addFieldLabel}</span>
                  <input
                    ref={labelInputRef}
                    className="fld__control"
                    type="text"
                    value={newLabel}
                    /* No maxLength. Invariant 2 is enforced by the SCHEMA having
                       nowhere to put an identifier — `enrolParticipant(siteId,
                       label)` takes no other parameter — not by the field being
                       too short to type a name into. A cap only truncated
                       legitimate 稱謂 while stopping nothing. */
                    placeholder={strings.setup.addPlaceholder}
                    onChange={(e) => {
                      setNewLabel(e.target.value)
                      setJustAdded(null)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        void add()
                      }
                    }}
                  />
                  {/* Invariant 2, stated in the interface rather than only in
                      the code. This is the one field in the product where
                      someone might type a real name. */}
                  <span className="fld__hint">{strings.setup.addFieldHint}</span>
                </label>
                <RailButton onClick={() => void add()} disabled={newLabel.trim().length === 0}>
                  {strings.setup.addAction}
                </RailButton>
                {justAdded && (
                  <p className="addp__done" role="status">
                    {strings.setup.idAssigned(justAdded.id)}
                  </p>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>

      <div className="rail">
        {/* A count, not a warning. See the file header. */}
        <div className="rail__context">
          <span className="rail__context-id">{strings.setup.fundedFloor(FUNDED_ATTENDANCE_MIN)}</span>
          <span className="rail__context-label">{strings.setup.attendanceCount(count)}</span>
        </div>
        <div className="rail__spacer" />
        <div className="rail__actions">
          <span className="rail__note" role="status">
            {pressed && missing ? strings.setup.refuse[missing] : strings.setup.enrolledCount(enrolled.length)}
          </span>
          {/* Whole-machine reset. Whole-場次 deletion lives on the session list;
              neither touches an individual record — see the deletion boundary in
              SessionDataSource.ts. */}
          <RailButton variant="quiet" onClick={onReset}>
            {strings.setup.resetAction}
          </RailButton>
          {/* NEVER DISABLED. Pressing it with something missing scrolls the
              reason into view and focuses the control that fixes it — see
              `missing` above, and the same posture in Trial.tsx and Roster.tsx. */}
          <RailButton variant="primary" icon="roster" onClick={begin}>
            {beginWord}
          </RailButton>
        </div>
      </div>
    </div>
  )
}
