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

import { useEffect, useMemo, useState } from 'react'
import { CameraControls } from '../components/CameraControls'
import { DemoNotice } from '../components/DemoDisclosure'
import { CameraSelfView } from '../components/CameraSelfView'
import { RailButton } from '../components/RailButton'
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

const CYCLES = [1, 2, 3] as const
const YEARS = [114, 115, 116] as const

export function Setup({ onBegin }: { onBegin: (setup: SessionSetup) => void }) {
  const src = useDataSource()
  const camera = useCameraPreview()

  const [sites, setSites] = useState<readonly Site[]>([])
  const [enrolled, setEnrolled] = useState<readonly Participant[]>([])
  const [blocks, setBlocks] = useState<readonly Block[]>([])
  const [sessions, setSessions] = useState<readonly AssessmentSession[]>([])
  const [siteId, setSiteId] = useState<string>('')
  const [year, setYear] = useState<number>(115)
  const [cycle, setCycle] = useState<number>(3)
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
      setSiteId(ss[0]?.siteId ?? '')
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
    else setAttendees(new Set(enrolled.map((p) => p.id)))
    // Keyed on identity rather than on the objects, so retyping the same
    // combination does not stomp a selection the facilitator just adjusted.
  }, [existingSession?.sessionId, existingBlock?.blockId, enrolled]) // eslint-disable-line react-hooks/exhaustive-deps

  const count = attendees.size
  const sorted = useMemo(() => [...enrolled].sort((a, b) => a.id.localeCompare(b.id)), [enrolled])

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
    setAttendees((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
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

              <div className="fld-row">
                <label className="fld">
                  <span className="fld__label">{strings.setup.yearLabel}</span>
                  <select
                    className="fld__control"
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                  >
                    {YEARS.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
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
                    onClick={() => setAttendees(new Set(enrolled.map((p) => p.id)))}
                  >
                    {strings.setup.selectAll}
                  </button>
                  <button type="button" className="linkbtn" onClick={() => setAttendees(new Set())}>
                    {strings.setup.selectNone}
                  </button>
                </div>
              </div>
              <p className="card__hint">{strings.setup.attendeesHint}</p>
              {/* Stated once, plainly, next to the list it refers to. No colour,
                  no icon, no instruction: the count is the 據點's business. */}
              <p className="card__hint">{strings.setup.fundedNote}</p>

              <ul className="picks">
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
                    className="fld__control"
                    type="text"
                    value={newLabel}
                    maxLength={12}
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
          <span className="rail__note">{strings.setup.enrolledCount(enrolled.length)}</span>
          <RailButton
            variant="primary"
            icon="roster"
            disabled={count === 0}
            onClick={() =>
              onBegin({ siteId, year, cycle, phase, attendeeIds: [...attendees] })
            }
          >
            {beginWord}
          </RailButton>
        </div>
      </div>
    </div>
  )
}
