/* ─────────────────────────────────────────────────────────────────────────────
   Participant detail — one person, this 期, both phases.

   TWO BOUNDARIES, neither of which may be crossed by anything added here.

   1. NO LONGITUDINAL TREND. The design doc's "Explicitly NOT building" list
      names trend charts. This surface shows exactly two assessment points
      because the 期 has exactly two, and it shows them as a pre row and a post
      row — never as a series on a time axis, never with 期 history alongside.
      The per-rep splits inside each trial ARE plotted, and that is a different
      object: within-trial detail at 30-second resolution, not a trend across
      months.

   2. NO DETERMINATION OF ANY KIND. No 14-second threshold, no pass/fail, no
      risk band, no percentile, no comparison against published norms, no
      referral suggestion. The 差值 rule below is arithmetic with a
      comparability guard, not a judgement. If a `passed` or `band` field ever
      appears on this screen the product has crossed the line it exists to stay
      behind.

   The 差值 rule is deliberately conservative and is NOT weakened here: a
   difference is computed only when both trials are protocol-valid AND over the
   same rep count. Comparing a 5-rep time against a 4-rep time produces a large
   apparent improvement for someone who did less work.
   ───────────────────────────────────────────────────────────────────────────── */

import { Digits } from '../components/Digits'
import { Icon } from '../components/Icon'
import { RailButton } from '../components/RailButton'
import { RepSplits } from '../components/RepSplits'
import { RepStatsBlock, SplitOverlay } from '../components/RepStatsBlock'
import { StateChip } from '../components/StateChip'
import { Tier2Panel } from '../components/Tier2Panel'
import { rocDate } from '../domain/dates'
import { outcomeDisplay } from '../domain/display'
import { attemptsFor, type ResolvedTrial } from '../domain/records'
import {
  elapsedMsOf,
  formatSeconds,
  isProtocolValid,
  repsOf,
  type AssessmentSession,
  type Outcome,
  type Participant,
  type SessionId,
} from '../domain/types'
import { strings } from '../i18n/strings'

interface PhaseView {
  readonly session: AssessmentSession
  readonly trial: ResolvedTrial | null
  readonly attempts: readonly ResolvedTrial[]
}

/** Per-rep durations, where the outcome has them. */
function splitsOf(t: ResolvedTrial | null): readonly number[] {
  if (!t) return []
  const o = t.outcome
  return o.kind === 'complete' || o.kind === 'incomplete' || o.kind === 'hand_contact'
    ? o.repTimesMs
    : []
}

function reasonWord(o: Outcome): string | null {
  if (o.kind === 'aborted') return strings.abort.reasons[o.reason]
  if (o.kind === 'hand_contact') return strings.detail.firstContactRep(o.firstContactRep)
  return null
}

function PhaseBlock({ view }: { view: PhaseView }) {
  const phaseWord = view.session.phase === 'pre' ? strings.phase.pre : strings.phase.post
  const t = view.trial
  const ms = t ? elapsedMsOf(t.outcome) : null
  const splits =
    t && (t.outcome.kind === 'complete' || t.outcome.kind === 'incomplete' || t.outcome.kind === 'hand_contact')
      ? t.outcome.repTimesMs
      : []

  return (
    <section className="pd__phase">
      <header className="pd__phase-head">
        <h2 className="pd__phase-name">{phaseWord}</h2>
        {t && <StateChip display={outcomeDisplay(t.outcome)} size="row" />}
      </header>

      {!t ? (
        <div className="pd__empty">
          <p className="pd__empty-title">{strings.detail.noRecord}</p>
          <p className="pd__empty-body">{strings.detail.noRecordBody}</p>
        </div>
      ) : (
        <>
          <div className="pd__facts">
            <div className="fact">
              <span className="fact__label">{strings.detail.totalLabel}</span>
              <span className="fact__value fact__value--lead">
                {ms === null ? (
                  strings.result.noTime
                ) : (
                  <>
                    <Digits value={formatSeconds(ms)} /> {strings.result.seconds}
                  </>
                )}
              </span>
            </div>
            <div className="fact">
              <span className="fact__label">{strings.result.reps}</span>
              <span className="fact__value">
                <Digits value={repsOf(t.outcome)} /> {strings.trial.repsLabel}
              </span>
            </div>
            <div className="fact">
              <span className="fact__label">{strings.detail.dateLabel}</span>
              <span className="fact__value">{rocDate(view.session.dateIso)}</span>
            </div>
            <div className="fact">
              <span className="fact__label">{strings.detail.protocolLabel}</span>
              <span className="fact__value">
                {isProtocolValid(t.outcome) ? strings.detail.protocolValid : strings.detail.protocolInvalid}
              </span>
            </div>
            {t.original.seatHeightCm !== null && (
              <div className="fact">
                <span className="fact__label">{strings.result.seatHeight}</span>
                <span className="fact__value">
                  <Digits value={t.original.seatHeightCm} /> {strings.result.cm}
                </span>
              </div>
            )}
          </div>

          {reasonWord(t.outcome) && <p className="pd__flag">{reasonWord(t.outcome)}</p>}

          <RepSplits repTimesMs={splits} phaseWord={phaseWord} />
          {/* Arithmetic on the times above. See domain/stats.ts for what is
              deliberately absent — no velocity, no trace, no threshold. */}
          <RepStatsBlock repTimesMs={splits} phaseWord={phaseWord} />
        </>
      )}

      {/* Every attempt, including the ones that do not represent the
          participant. A void and an abort are part of what happened and stay
          visible; the log is append-only and this surface reads it honestly. */}
      {view.attempts.length > 0 && (
        <details className="pd__history">
          <summary className="pd__history-head">
            <span>{strings.detail.historyTitle}</span>
            <span className="pd__history-count">{view.attempts.length}</span>
          </summary>
          <p className="pd__history-hint">{strings.detail.historyHint}</p>
          <ol className="pd__attempts">
            {view.attempts.map((a, i) => (
              <li key={a.original.recordId} className="attempt">
                <span className="attempt__n">{strings.detail.attemptN(i + 1)}</span>
                <span className="attempt__state">
                  <StateChip display={outcomeDisplay(a.outcome)} size="row" />
                </span>
                <span className="attempt__meta">
                  {reasonWord(a.outcome) ?? ''}
                  {/* A correction is shown AS a correction against the original,
                      never as an edit of it. The original outcome stays on
                      screen beside the corrected one. */}
                  {a.correctionCount > 0 && (
                    <span className="attempt__corrected">
                      <Icon kind="record" />
                      {strings.detail.correctsPrior}
                      {'　'}
                      {strings.detail.supersededBy}：
                      <StateChip display={outcomeDisplay(a.original.outcome)} size="row" />
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ol>
        </details>
      )}
    </section>
  )
}

export function ParticipantDetail({
  participant,
  sessions,
  allResolved,
  writable,
  onCorrect,
  onRemeasure,
  onDone,
}: {
  participant: Participant
  /** The 場次 of THIS 期 only — 前測 and 後測. Never every session on the device:
      the 期 has exactly two assessment points and that is what this shows. */
  sessions: readonly AssessmentSession[]
  allResolved: ReadonlyMap<SessionId, readonly ResolvedTrial[]>
  /** Whether the active 場次 still accepts writes. Correcting is writing. */
  writable: boolean
  onCorrect: () => void
  onRemeasure: () => void
  onDone: () => void
}) {
  const views: PhaseView[] = sessions
    .slice()
    .sort((a, b) => (a.phase === 'pre' ? -1 : b.phase === 'pre' ? 1 : 0))
    .map((session) => {
      const resolved = allResolved.get(session.sessionId) ?? []
      const attempts = attemptsFor(resolved, participant.id)
      const assessed = attempts.filter((t) => t.outcome.kind !== 'void' && t.outcome.kind !== 'aborted')
      return { session, trial: assessed[assessed.length - 1] ?? null, attempts }
    })

  const pre = views.find((v) => v.session.phase === 'pre')?.trial ?? null
  const post = views.find((v) => v.session.phase === 'post')?.trial ?? null
  const preMs = pre ? elapsedMsOf(pre.outcome) : null
  const postMs = post ? elapsedMsOf(post.outcome) : null

  /* THE COMPARABILITY GUARD — not weakened. Both trials must be protocol-valid
     AND over the same rep count. Otherwise the cell reads 不可比較 and the
     footnote explains why, exactly as on the printed sheet. */
  const comparable =
    pre !== null &&
    post !== null &&
    preMs !== null &&
    postMs !== null &&
    isProtocolValid(pre.outcome) &&
    isProtocolValid(post.outcome) &&
    repsOf(pre.outcome) === repsOf(post.outcome)

  const delta = comparable && preMs !== null && postMs !== null ? (postMs - preMs) / 1000 : null

  const preSplits = splitsOf(pre)
  const postSplits = splitsOf(post)

  return (
    <div className="zones">
      <div className="field">
        <div className="pd">
          <div className="pd__phases">
            {views.map((v) => (
              <PhaseBlock key={v.session.sessionId} view={v} />
            ))}
          </div>

          <section className="pd__delta">
            <h2 className="pd__delta-title">{strings.detail.deltaTitle}</h2>
            {delta === null ? (
              <>
                <p className="pd__delta-value pd__delta-value--none">{strings.sheet.notComparable}</p>
                {/* The same wording as the sheet's footer. A blank or a dash
                    would read as missing data rather than as a deliberate
                    refusal to compare two different things. */}
                <p className="pd__delta-why">{strings.sheet.footerComparable}</p>
              </>
            ) : (
              <>
                <p className="pd__delta-value">
                  <Digits
                    value={`${delta > 0 ? '+' : delta < 0 ? '−' : '±'}${Math.abs(delta).toFixed(1)}`}
                  />{' '}
                  {strings.result.seconds}
                </p>
                {/* Direction in words, never a verdict. "Faster" is arithmetic;
                    "improved", "normal" or "at risk" would be a determination. */}
                <p className="pd__delta-why">
                  {delta < 0
                    ? strings.detail.deltaFaster
                    : delta > 0
                      ? strings.detail.deltaSlower
                      : strings.detail.deltaSame}
                </p>
              </>
            )}
          </section>

          {/* Two assessment points side by side on one scale. Not a trend: see
              the header comment in RepStatsBlock.tsx. */}
          <SplitOverlay preMs={preSplits} postMs={postSplits} />

          {/* Roadmap, not data. Names only, no values, its own ground. */}
          <Tier2Panel />
        </div>
      </div>

      <div className="rail">
        <div className="rail__context">
          <span className="rail__context-id">{participant.id}</span>
          <span className="rail__context-label">{participant.label}</span>
        </div>
        <div className="rail__spacer" />
        <div className="rail__actions">
          {/* Correcting and re-measuring both APPEND to the log, so both are
              gone once the 場次 is finished. Stated, not merely absent — the
              note says the session can be reopened, which is what stops a
              facilitator concluding the machine has lost the ability. */}
          {writable ? (
            <>
              <RailButton variant="quiet" onClick={onCorrect}>
                {strings.result.correct}
              </RailButton>
              <RailButton icon="start" onClick={onRemeasure}>
                {strings.result.redo}
              </RailButton>
            </>
          ) : (
            <span className="rail__note">{strings.session.readOnlyNote}</span>
          )}
          <RailButton variant="primary" icon="roster" onClick={onDone}>
            {strings.result.accept}
          </RailButton>
        </div>
      </div>
    </div>
  )
}
