/* ─────────────────────────────────────────────────────────────────────────────
   Trial — 5x sit-to-stand, arms crossed.

   THE ZONE LAW. The Participant Field above holds exactly one number and one pip
   row while a trial is running. No clock, no per-rep list, no name. The
   Facilitator Rail below holds every control and all machine state, on a
   different surface lightness so it reads as a separate device panel.

   DEVIATION FROM THE ORIGINAL BRIEF, recorded in DESIGN.md: no live timer. The
   participant reads at most four characters at a time and needs reps-remaining;
   the facilitator needs to know tracking is alive so they can catch a void. The
   elapsed time is captured throughout and appears on the result surface and the
   sheet. Nobody acts on it mid-trial.

   The clock starts on the staff press, never on first movement: cue-to-movement
   reaction time in this population is 0.3-1.0 s, larger than the whole October
   error budget and systematic rather than random.
   ───────────────────────────────────────────────────────────────────────────── */

import { useEffect, useRef, useState } from 'react'
import { CameraControls } from '../components/CameraControls'
import { CameraSelfView } from '../components/CameraSelfView'
import { Digits } from '../components/Digits'
import { RailButton } from '../components/RailButton'
import { Refusal } from '../components/Refusal'
import { RepPips } from '../components/RepPips'
import { StateChip } from '../components/StateChip'
import { useDataSource } from '../data/context'
import type { TrialId } from '../data/SessionDataSource'
import { cameraSignalDisplay, outcomeDisplay, trackingDisplay } from '../domain/display'
import { useCameraPreview } from '../hooks/useCameraPreview'
import type { TrialGate } from '../domain/sessions'
import {
  PRESCRIBED_REPS,
  type AbortReason,
  type AssessmentSession,
  type Outcome,
  type Participant,
} from '../domain/types'
import { useChime } from '../hooks/useChime'
import { useTracking } from '../hooks/useSession'
import { strings } from '../i18n/strings'
import { AbortDialog } from './dialogs/AbortDialog'
import { UnableDialog } from './dialogs/UnableDialog'

type Stage = 'cue' | 'running' | 'void' | 'settled'

export function Trial({
  participant,
  session,
  gate,
  onSettled,
  onBack,
  onSessions,
}: {
  participant: Participant
  session: AssessmentSession
  /** Whether this 場次 will accept a trial for this person. See domain/sessions.ts. */
  gate: TrialGate
  onSettled: (outcome: Outcome) => void
  onBack: () => void
  /** Out to the session list — the one route that resolves every refusal. */
  onSessions: () => void
}) {
  const src = useDataSource()
  const tracking = useTracking()
  const { chime, armAudio } = useChime()
  /* Held at this level rather than inside the panel so the stream survives the
     panel unmounting when the trial starts, and the rail can keep reporting
     signal. Opt-in: nothing here requests the camera until the button is used. */
  const camera = useCameraPreview()

  const [stage, setStage] = useState<Stage>('cue')
  const [reps, setReps] = useState(0)
  const [handContact, setHandContact] = useState(false)
  const [outcome, setOutcome] = useState<Outcome | null>(null)
  const [flash, setFlash] = useState(false)
  const [askAbort, setAskAbort] = useState(false)
  const [askUnable, setAskUnable] = useState(false)
  const trialIdRef = useRef<TrialId | null>(null)

  // Reset when the facilitator moves to a different participant.
  useEffect(() => {
    setStage('cue')
    setReps(0)
    setHandContact(false)
    setOutcome(null)
    trialIdRef.current = null
  }, [participant.id])

  async function begin() {
    // Re-checked at the press, not only at render. The session could have been
    // ended in another tab, or the gate could have flipped while this surface
    // sat open on the cue — and "recorded into a guess" is the one outcome this
    // product will not produce.
    if (!gate.ok) return
    armAudio() // the staff press is the gesture the browser requires
    const id = await src.startTrial(session.sessionId, participant.id)
    trialIdRef.current = id
    setReps(0)
    setHandContact(false)
    setOutcome(null)
    setStage('running')
  }

  // Subscribe to the live stream. Identical event shapes to the October pipeline.
  useEffect(() => {
    const id = trialIdRef.current
    if (stage !== 'running' || !id) return

    return src.subscribeTrial(id, (e) => {
      switch (e.type) {
        case 'rep':
          setReps(e.index)
          chime()
          break
        case 'hand_contact':
          // The field does NOT change. Telling a participant mid-effort that
          // they are doing it wrong is distracting and undignified; the
          // facilitator sees the flag and can cue them by voice.
          setHandContact(true)
          break
        case 'void':
          setStage('void')
          setFlash(true)
          window.setTimeout(() => setFlash(false), 400)
          break
        case 'settled':
          setOutcome(e.outcome)
          setStage(e.outcome.kind === 'void' ? 'void' : 'settled')
          break
        case 'tracking':
          break
      }
    })
  }, [stage, src, chime])

  async function endNow() {
    const id = trialIdRef.current
    if (!id) return
    const o = await src.endTrial(id)
    setOutcome(o)
    setStage('settled')
  }

  async function doAbort(reason: AbortReason) {
    const id = trialIdRef.current
    setAskAbort(false)
    if (!id) return
    await src.abortTrial(id, reason)
    onBack()
  }

  async function doUnable() {
    setAskUnable(false)
    if (!gate.ok) return
    await src.markUnable(session.sessionId, participant.id)
    onBack()
  }

  function restart() {
    setStage('cue')
    setReps(0)
    setHandContact(false)
    setOutcome(null)
    trialIdRef.current = null
  }

  const trackChip = trackingDisplay(stage === 'void' ? 'lost' : tracking)
  const cameraLive = camera.status === 'live'

  /* The refusal replaces the cue rather than sitting beside it. A screen that
     said 請準備 and then declined to start would be the worst of both. Once a
     trial is running the gate cannot have been closed when it began, so only the
     cue stage is guarded. */
  const blocked = !gate.ok && stage === 'cue'

  return (
    <div className="zones">
      {/* ── Participant Field ─────────────────────────────────────────────
          FIFTY-FIFTY SPLIT when the camera is live: self-view on the left, the
          readout and everything else on the right. With no camera — or a denied
          permission — there is no left half and the readout gets the whole
          field, so the fallback is the layout this screen has always had.

          The split runs at EVERY stage rather than only once the trial starts.
          The brief permits the video to take the full field before the cue, but
          the cue text has to live somewhere, and a video that fills the screen
          and then jumps to half of it relayouts the participant's whole world at
          the exact moment they are being asked to concentrate. Half of a 1280px
          field is a 640px-wide, full-height pane — far larger than the 360px box
          it replaces, so framing loses nothing by holding still. */}
      <div className={cameraLive ? 'field field--locked field--split' : 'field field--locked'}>
        {cameraLive && (
          <div className="field__view">
            {/* Framing rectangle only while positioning. Once the trial runs it
                is noise: nobody is adjusting their chair mid-effort. */}
            <CameraSelfView attach={camera.attach} guide={stage === 'cue'} />
          </div>
        )}

        <div className="field__stage">
          {blocked && !gate.ok && (
            <Refusal
              title={strings.session.refuseTitle}
              body={strings.session.refuse[gate.reason]}
              actions={
                <RailButton variant="primary" icon="roster" onClick={onSessions}>
                  {strings.session.refuseGoto}
                </RailButton>
              }
            />
          )}

          {stage === 'cue' && !blocked && (
            <div className="cue">
              <p className="cue__title">{strings.trial.cue}</p>
              <p className="cue__hint">{strings.trial.cueHint}</p>
              {cameraLive && <p className="cue__framing">{strings.camera.selfViewHint}</p>}
            </div>
          )}

          {stage === 'running' && (
            <div className="readout">
              <div className="readout__count">
                <Digits value={strings.trial.repsOf(reps, PRESCRIBED_REPS)} />
              </div>
              <div className="readout__unit">{strings.trial.repsLabel}</div>
              <RepPips done={reps} />
              {/* Announced politely so a screen reader follows without the visual
                  field gaining a single extra character. */}
              <p className="sr-only" aria-live="polite">
                {strings.trial.srRepAnnounce(reps, PRESCRIBED_REPS)}
              </p>
            </div>
          )}

          {stage === 'settled' && outcome && (
            /* The participant sees 完成 and their pips. Nothing else.
               The outcome nuance (未完成五次 / 手部支撐) lives in the rail, for the
               facilitator. Putting "you did not complete five" in front of the
               participant at 48px is exactly the harm the tone rule forbids:
               a valid recorded outcome must not read as a failure. */
            <div className="done">
              <p className="done__word">{strings.trial.complete}</p>
              <RepPips done={reps} />
            </div>
          )}

          {stage === 'void' && (
            <div className="void-note">
              <p className="void-note__title">{strings.trial.voidTitle}</p>
              <p className="void-note__body">{strings.trial.voidBody}</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Camera controls ─────────────────────────────────────────────────
          Cue stage only, and controls only — the image itself is up in the
          participant field. A Tier 1 trial cannot pause and tracking loss voids
          it, so the moment before the start press is the only cheap chance to
          fix a bad camera position, and the only moment these controls matter. */}
      {stage === 'cue' && !blocked && (
        <CameraControls
          status={camera.status}
          onStart={() => void camera.start()}
          onStop={camera.stop}
        />
      )}

      {/* ── Facilitator Rail ────────────────────────────────────────────── */}
      <div className={flash ? 'rail rail--flash' : 'rail'}>
        <div className="rail__context">
          <span className="rail__context-id">{participant.id}</span>
          <span className="rail__context-label">{participant.label}</span>
        </div>

        <div className="rail__state">
          <StateChip display={trackChip} />
        </div>

        {/* The collapsed form of the preview. Only present once the facilitator
            has actually enabled the camera, and only away from the cue stage
            where the full panel is showing. */}
        {camera.status === 'live' && stage !== 'cue' && (
          <div className="rail__state">
            <StateChip display={cameraSignalDisplay(camera.signal)} />
          </div>
        )}

        {/* Outcome detail is facilitator-facing, never participant-facing. */}
        {stage === 'settled' && outcome && outcome.kind !== 'complete' && (
          <div className="rail__state">
            <StateChip display={outcomeDisplay(outcome)} />
          </div>
        )}

        {handContact && stage === 'running' && (
          <div className="rail__state">
            <StateChip display={outcomeDisplay(HAND_CONTACT_SHAPE)} />
          </div>
        )}

        <div className="rail__spacer" />

        <div className="rail__actions">
          {/* No 回名單 here: the header carries back on every surface, and two
              controls to one destination is one too many. */}
          {/* No 開始 control at all when the gate is closed. A disabled primary
              is still the thing a hurried thumb aims at. */}
          {stage === 'cue' && !blocked && (
            <>
              <RailButton variant="quiet" onClick={() => setAskUnable(true)}>
                {strings.unable.action}
              </RailButton>
              <RailButton variant="primary" icon="start" onClick={() => void begin()}>
                {strings.trial.begin}
              </RailButton>
            </>
          )}

          {stage === 'running' && (
            <>
              <RailButton onClick={() => setAskAbort(true)}>{strings.trial.discard}</RailButton>
              <RailButton variant="primary" onClick={() => void endNow()}>
                {strings.trial.end}
              </RailButton>
            </>
          )}

          {stage === 'settled' && outcome && (
            <RailButton variant="primary" icon="record" onClick={() => onSettled(outcome)}>
              {strings.trial.viewResult}
            </RailButton>
          )}

          {stage === 'void' && (
            <RailButton variant="primary" onClick={restart}>
              {strings.trial.restart}
            </RailButton>
          )}
        </div>
      </div>

      <AbortDialog open={askAbort} onCancel={() => setAskAbort(false)} onConfirm={doAbort} />
      <UnableDialog
        open={askUnable}
        onCancel={() => setAskUnable(false)}
        onConfirm={() => void doUnable()}
      />
    </div>
  )
}

/* A minimal hand-contact outcome purely for the rail chip's word+shape. The real
   outcome is assembled by the data source when the trial settles. */
const HAND_CONTACT_SHAPE = {
  kind: 'hand_contact',
  repsCompleted: 0,
  repTimesMs: [],
  elapsedMs: 0,
  firstContactRep: 0,
  protocolInvalid: true,
} as const
