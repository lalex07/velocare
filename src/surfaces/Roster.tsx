/* ─────────────────────────────────────────────────────────────────────────────
   Roster — the working screen. This is where the facilitator lives.

   Carries NO TIMES, deliberately. Ten older adults listed with their times in a
   small shared room is a leaderboard; the design doc names that as the most
   likely route to facilitator veto and a real dignity harm. Status only. Numbers
   live on the result surface (one participant at a time) and on the sheet (read
   alone by the site lead).

   THE ROWS ARE THE SESSION'S ATTENDEES, NOT THE 期'S ROSTER. Enrolment in a 期
   outlives any one 場次 and attendance varies session to session, so with
   several sessions per 期 the two lists are no longer the same list. Deriving
   the roster from `attendeeIds` is what stops the afternoon's 前測 from
   inheriting the morning's 後測 attendance.

   WHEN THE SESSION IS FINISHED THE ROSTER IS READ-ONLY. Not disabled buttons
   twelve times over — a single sentence at the top saying so, and no 開始量測
   control at all. Rows that already have a record keep 查看紀錄, because reading
   a finished session is exactly what a finished session is for.
   ───────────────────────────────────────────────────────────────────────────── */

import { RailButton } from '../components/RailButton'
import { Refusal } from '../components/Refusal'
import { StateChip } from '../components/StateChip'
import { awaitingDisplay, outcomeDisplay } from '../domain/display'
import { currentTrialFor, type ResolvedTrial } from '../domain/records'
import type { TrialGate } from '../domain/sessions'
import type { Participant } from '../domain/types'
import { strings } from '../i18n/strings'

export function Roster({
  attendees,
  resolved,
  gate,
  onStart,
  onReview,
}: {
  /** Who is on THIS 場次, in 期 roster order. */
  attendees: readonly Participant[]
  resolved: readonly ResolvedTrial[]
  /** Whether this session will accept a trial at all. See domain/sessions.ts. */
  gate: TrialGate
  onStart: (p: Participant) => void
  onReview: (p: Participant, trial: ResolvedTrial) => void
}) {
  const rows = attendees.map((p) => ({
    participant: p,
    trial: currentTrialFor(resolved, p.id),
  }))

  const doneCount = rows.filter((r) => r.trial !== null).length

  /* Split into two halves of equal length rather than letting a multi-column
     flow decide. Column-major: the left half is the first six in call order,
     the right the next six. Each half is its own grid with IDENTICAL explicit
     tracks, so a status chip lands at the same offset in both. */
  const half = Math.ceil(rows.length / 2)
  const halves = [rows.slice(0, half), rows.slice(half)]

  return (
    <div className="roster">
      {/* 據點 / 期別 / 階段 are in the session band above, which is the one place
          that answers "which 場次 am I recording into". This line carries only
          what is specific to the list beneath it. */}
      <div className="roster__meta">
        <span>{strings.roster.progress(doneCount, rows.length)}</span>
        <span>{strings.roster.attendanceNote(rows.length)}</span>
      </div>

      {/* Said once, above the list, rather than twelve times inside it. */}
      {!gate.ok && gate.reason === 'completed' && (
        <p className="roster__readonly">{strings.session.readOnlyNote}</p>
      )}
      {!gate.ok && gate.reason !== 'completed' && (
        <Refusal title={strings.session.refuseTitle} body={strings.session.refuse[gate.reason]} />
      )}

      {rows.length === 0 ? (
        <div className="cue">
          <p className="cue__title">{strings.roster.emptyTitle}</p>
          <p className="cue__hint">{strings.roster.emptyBody}</p>
        </div>
      ) : (
        <div className="roster__cols">
          {halves.map((group, gi) => (
            <ul className="rgrid" key={gi}>
              {group.map(({ participant, trial }) => {
                const display = trial ? outcomeDisplay(trial.outcome) : awaitingDisplay
                return (
                  /* Every row emits the SAME FIVE CELLS in the same order, and
                     the modifier cell is rendered even when empty. That is what
                     keeps 吳媽's 已更正 from pushing her status and action out of
                     the column everyone else is aligned to. */
                  <li className="rgrid__row" key={participant.id}>
                    <span className="rgrid__id">{participant.id}</span>
                    <span className="rgrid__label">{participant.label}</span>
                    <span className="rgrid__state">
                      <StateChip display={display} size="row" />
                    </span>
                    <span className="rgrid__mod">
                      {trial && trial.correctionCount > 0 ? strings.status.corrected : ''}
                    </span>
                    <span className="rgrid__action">
                      {trial ? (
                        <RailButton
                          variant="quiet"
                          icon="record"
                          ariaLabel={strings.roster.reviewFor(participant.label)}
                          onClick={() => onReview(participant, trial)}
                        >
                          {strings.roster.review}
                        </RailButton>
                      ) : gate.ok ? (
                        <RailButton
                          icon="start"
                          ariaLabel={strings.roster.startFor(participant.label)}
                          onClick={() => onStart(participant)}
                        >
                          {strings.roster.start}
                        </RailButton>
                      ) : (
                        /* No control, rather than a dead one. The reason is
                           stated once above; a greyed button twelve times over
                           says nothing and invites a twelfth press. */
                        <span className="rgrid__none" aria-hidden="true">
                          —
                        </span>
                      )}
                    </span>
                  </li>
                )
              })}
            </ul>
          ))}
        </div>
      )}
    </div>
  )
}
