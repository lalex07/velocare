/* ─────────────────────────────────────────────────────────────────────────────
   Result — one participant, immediately after their trial.

   ITS ONLY JOB IS: THIS PERSON'S TIME, AND MOVE ON.

   ── THE DIGNITY CONSTRAINT ──────────────────────────────────────────────────

   THIS SURFACE MUST NEVER SHOW ATTEMPT HISTORY, VOIDS, ABORTS, OR CORRECTIONS.
   Not collapsed behind a disclosure, not in a "details" drawer, not in small
   type at the bottom. NOT AT ALL.

   The reason is the room, not the layout. When this screen is up, the
   participant is still seated in front of it and nine other people are in the
   room looking at the same monitor. "Third attempt", "voided", "aborted:
   participant declined", "corrected from 5 reps to 4" are all true, all
   necessary to keep, and all nobody else's business. Putting a person's
   correction history on a large display in front of their class is a harm this
   product exists to avoid, and it is the same harm that keeps times off the
   roster.

   That record is not being hidden — it is one tap away on ParticipantDetail,
   which the facilitator reads at arm's length, one person at a time. Different
   surface, different reader, different room position.

   IF YOU ARE HERE TO "SIMPLIFY BY CONSOLIDATING" THIS INTO ParticipantDetail:
   that was tried, and reverted, for this reason.

   ── What it does show ───────────────────────────────────────────────────────

   The measured time, prominently, and any flag stated plainly. Flags are
   descriptive and never evaluative: 未完成五次 and 手部支撐 say what was
   measured. They are set in the facilitator band rather than at display size,
   because a valid outcome announced at 48px to a seated participant reads as a
   verdict even when the words are neutral.

   INVARIANT 3 (amended): this surface reports a measured time. It does not
   apply the 14-second threshold, does not grade, and renders no verdict. If a
   `passed`/`failed` badge ever appears here, the product has crossed the line
   it exists to stay behind.
   ───────────────────────────────────────────────────────────────────────────── */

import { Digits } from '../components/Digits'
import { RailButton } from '../components/RailButton'
import { StateChip } from '../components/StateChip'
import { outcomeDisplay } from '../domain/display'
import {
  elapsedMsOf,
  formatSeconds,
  isProtocolValid,
  repsOf,
  type Outcome,
  type Participant,
} from '../domain/types'
import { strings } from '../i18n/strings'

/** Plain-language note for outcomes that carry one. `null` is the common case. */
function flagOf(outcome: Outcome): string | null {
  switch (outcome.kind) {
    case 'incomplete':
      return strings.result.flagIncomplete(outcome.repsCompleted)
    case 'hand_contact':
      return strings.result.flagHandContact(outcome.firstContactRep)
    case 'unable':
      return strings.result.flagUnable
    default:
      return null
  }
}

export function Result({
  participant,
  outcome,
  seatHeightCm,
  nextParticipant,
  onNext,
  onFullRecord,
}: {
  participant: Participant
  outcome: Outcome
  seatHeightCm: number | null
  /** The next outstanding participant, if the rotation has one left. */
  nextParticipant: Participant | null
  onNext: () => void
  onFullRecord: () => void
}) {
  const ms = elapsedMsOf(outcome)
  const flag = flagOf(outcome)

  return (
    <div className="zones">
      {/* `field--center` rather than padding: the readout is a short block on a
          tall surface, and left-aligned at the top it read as a layout that had
          not been finished rather than as one that is deliberately quiet. */}
      <div className="field field--center">
        <div className="res">
          {/* The time, and essentially nothing else. */}
          <div className="res__primary">
            {ms === null ? (
              <span className="res__time res__time--none">{strings.result.noTime}</span>
            ) : (
              <>
                <span className="res__time">
                  <Digits value={formatSeconds(ms)} />
                </span>
                <span className="res__unit">{strings.result.seconds}</span>
              </>
            )}
          </div>

          <div className="res__meta">
            <StateChip display={outcomeDisplay(outcome)} size="row" />
            <span className="res__fact">
              {strings.result.reps} <Digits value={repsOf(outcome)} /> {strings.trial.repsLabel}
            </span>
            {seatHeightCm !== null && (
              <span className="res__fact">
                {strings.result.seatHeight} <Digits value={seatHeightCm} /> {strings.result.cm}
              </span>
            )}
          </div>

          {/* Stated plainly, at facilitator size. Not an error, and not styled
              as one: every one of these is a valid recorded outcome. */}
          {flag && <p className="res__flag">{flag}</p>}
          {!isProtocolValid(outcome) && outcome.kind !== 'unable' && (
            <p className="res__flag">{strings.result.flagProtocolInvalid}</p>
          )}
        </div>
      </div>

      <div className="rail">
        <div className="rail__context">
          <span className="rail__context-id">{participant.id}</span>
          <span className="rail__context-label">{participant.label}</span>
        </div>
        <div className="rail__spacer" />
        <div className="rail__actions">
          {/* Secondary, and the only route off this surface that is not "move
              on". The full record — history, voids, corrections — lives there. */}
          <RailButton variant="quiet" icon="record" onClick={onFullRecord}>
            {strings.result.fullRecord}
          </RailButton>
          {/* Primary: keep the rotation moving. A class of twelve is run by one
              person, and the next name is the thing they need next. */}
          <RailButton variant="primary" icon={nextParticipant ? 'start' : 'roster'} onClick={onNext}>
            {nextParticipant ? strings.result.next(nextParticipant.label) : strings.result.noneLeft}
          </RailButton>
        </div>
      </div>
    </div>
  )
}
