/* ─────────────────────────────────────────────────────────────────────────────
   THE SHEET. This is the product.

   PRODUCT.md: "The printed sheet is the product. Not the screen." The 據點負責人
   is rarely present at a session and never sees the UI. This page is their entire
   experience of VeloCare, and it is what they file with a funding report.

   Constraints: A4 portrait, exactly one page, large type, no clipped columns.

   INVARIANT 3 (amended) — the footer is a REGULATORY SURFACE, not boilerplate. The
   sheet reports measured times to a human. It does not apply the 14-second ICOPE
   threshold, does not grade, and states no determination. There is deliberately
   no pass/fail column and no highlighted row.

   IT SAYS WHICH 期 AND WHICH 場次 IT COVERS, ON PAPER. With several 場次 open on
   one device, "前後測時間紀錄表" is no longer enough to identify what is in front
   of you: two sheets from the same morning can carry different 期 and look
   identical. So the head names the 期, both 場次 with their dates and attendance,
   and which 場次 the sheet was produced from. A 據點負責人 filing this with a
   成果報告 can check it against their paper register without asking anyone.
   ───────────────────────────────────────────────────────────────────────────── */

import { useDataSource } from '../data/context'
import { rocDate, rocToday } from '../domain/dates'
import { awaitingDisplay, outcomeDisplay } from '../domain/display'
import { currentTrialFor, type ResolvedTrial } from '../domain/records'
import { attendeesOf } from '../domain/sessions'
import {
  elapsedMsOf,
  formatSeconds,
  isAssessed,
  isProtocolValid,
  repsOf,
  type AssessmentSession,
  type Block,
  type Phase,
  type SessionId,
} from '../domain/types'
import { strings } from '../i18n/strings'
import { LogoMark } from '../components/Logo'
import { RailButton } from '../components/RailButton'
import { Shape } from '../components/Shape'

export function Sheet({
  block,
  sessions,
  allResolved,
  generatedFrom,
}: {
  block: Block
  /** The 場次 of THIS 期 only. A sheet spanning several 期 would be unfileable. */
  sessions: readonly AssessmentSession[]
  allResolved: ReadonlyMap<SessionId, readonly ResolvedTrial[]>
  /** The 場次 the facilitator pressed 產生報表 from. Named on the sheet. */
  generatedFrom: AssessmentSession
}) {
  const src = useDataSource()
  const pre = sessions.find((s) => s.phase === 'pre') ?? null
  const post = sessions.find((s) => s.phase === 'post') ?? null
  const preTrials = (pre && allResolved.get(pre.sessionId)) ?? []
  const postTrials = (post && allResolved.get(post.sessionId)) ?? []

  const phaseWord = (p: Phase) => (p === 'pre' ? strings.phase.pre : strings.phase.post)
  /* One line per 階段: was it held, when, and how many people were on it. A
     blank cell in the table below is then attributable — absent from that
     session, rather than missing data of unknown provenance. */
  const coverageOf = (s: AssessmentSession | null, phase: Phase) =>
    s === null
      ? strings.sheet.coverageNotHeld(phaseWord(phase))
      : strings.sheet.coveragePhase(phaseWord(phase), rocDate(s.dateIso), attendeesOf(s, block).length)

  const rows = block.participants.map((p) => {
    const a = currentTrialFor(preTrials, p.id)
    const b = currentTrialFor(postTrials, p.id)
    const preMs = a ? elapsedMsOf(a.outcome) : null
    const postMs = b ? elapsedMsOf(b.outcome) : null

    /* A difference is only meaningful when the two trials measured the same
       thing. Comparing a 5-rep time against a 4-rep time produces a large
       apparent improvement for a participant who actually did LESS work, and
       this sheet is filed to justify funding. Both trials must therefore be
       protocol-valid AND over the same number of repetitions; otherwise the
       cell reads 不可比較 and the footer explains why. */
    const comparable =
      a !== null &&
      b !== null &&
      preMs !== null &&
      postMs !== null &&
      isProtocolValid(a.outcome) &&
      isProtocolValid(b.outcome) &&
      repsOf(a.outcome) === repsOf(b.outcome)

    const delta = comparable && preMs !== null && postMs !== null ? (postMs - preMs) / 1000 : null

    return { participant: p, pre: a, post: b, preMs, postMs, delta }
  })

  const assessed = rows.filter((r) => r.post !== null && isAssessed(r.post.outcome)).length
  const valid = rows.filter((r) => r.post !== null && isProtocolValid(r.post.outcome)).length

  return (
    <div className="sheet-screen">
      {/* Print only. Getting back is the header's job, on every surface, by one
          control — a second 關閉 here would be a second answer to a question
          that should have exactly one. */}
      <div className="sheet-screen__bar no-print">
        <RailButton variant="primary" icon="print" onClick={() => window.print()}>
          {strings.sheet.print}
        </RailButton>
      </div>

      <div className="sheet-wrap">
        <article className="sheet">
          <header className="sheet__head">
            {/* <h2>, not <h1>: on screen the header trail owns the page
                heading, and two <h1>s is a malformed outline. On paper the size
                is unchanged, so it still reads as the document title.

                The mark rides on the title's baseline at its cap height — the
                same rule it follows beside the wordmark in the app header. It is
                pure `currentColor`, so it inherits the sheet's #000 and stays
                chroma 0 on paper without a second drawing. */}
            <div className="sheet__titleline">
              <LogoMark className="sheet__mark" />
              <h2 className="sheet__title">{strings.sheet.title}</h2>
            </div>
            <p className="sheet__subtitle">{strings.sheet.subtitle}</p>
            <div className="sheet__meta">
              <span className="sheet__meta-item">
                <span className="sheet__meta-label">{strings.sheet.site}</span>
                <span className="sheet__meta-value">{block.siteName}</span>
              </span>
              <span className="sheet__meta-item">
                <span className="sheet__meta-label">{strings.sheet.block}</span>
                <span className="sheet__meta-value">{block.blockName}</span>
              </span>
              <span className="sheet__meta-item">
                <span className="sheet__meta-label">{strings.sheet.printedOn}</span>
                <span className="sheet__meta-value">{rocToday()}</span>
              </span>
            </div>

            {/* Which 場次 this sheet covers, and which one it came from. Both on
                paper: a report that only a screen can identify is not a report.

                EXAMPLE DATA IS SAID HERE TOO, INSIDE THE SAME BLOCK. A badge
                would not do: this sheet leaves the building, filed with a
                funding report by someone who was not in the room, so the
                marking has to be a sentence that survives being read cold and
                has to say what the numbers may NOT be used for. Above the table,
                because a reader must meet it before the numbers.

                It shares this block rather than taking one of its own — as a
                separate boxed element it cost 12.7mm and pushed a twelve-row
                sheet to two pages. Inside, the whole metadata block simply
                becomes boxed and the notice adds one line. Measured; see
                print.css. */}
            <div className={block.isExample ? 'sheet__coverage sheet__coverage--example' : 'sheet__coverage'}>
              {block.isExample && (
                <p className="sheet__example">
                  <strong>{strings.example.tag}</strong>　{strings.example.sheetNotice}
                </p>
              )}
              <span className="sheet__meta-item">
                <span className="sheet__meta-label">{strings.sheet.coverage}</span>
                <span className="sheet__meta-value">
                  {coverageOf(pre, 'pre')}
                  {'　'}
                  {coverageOf(post, 'post')}
                </span>
              </span>
              <span className="sheet__meta-item">
                <span className="sheet__meta-label">{strings.sheet.generatedFrom}</span>
                <span className="sheet__meta-value">
                  {strings.sheet.generatedFromValue(
                    phaseWord(generatedFrom.phase),
                    rocDate(generatedFrom.dateIso),
                  )}
                </span>
              </span>
            </div>
          </header>

          <table className="sheet__table">
            <thead>
              <tr>
                <th>{strings.sheet.colId}</th>
                <th>{strings.sheet.colLabel}</th>
                <th className="num">{strings.sheet.colPre}</th>
                <th className="num">{strings.sheet.colPost}</th>
                <th className="num">{strings.sheet.colChange}</th>
                <th>{strings.sheet.colNote}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ participant, post: b, preMs, postMs, delta }) => {
                /* The note describes the POST trial, which is the operative
                   column. Falling back to the pre outcome made a participant
                   with no post trial read as though she had been measured. */
                const note = b ? outcomeDisplay(b.outcome) : awaitingDisplay
                return (
                  <tr key={participant.id}>
                    <td className="sheet__id">{participant.id}</td>
                    <td className="sheet__label">{participant.label}</td>
                    <td className="num">
                      <span className={preMs === null ? 'sheet__num sheet__num--absent' : 'sheet__num'}>
                        {preMs === null ? strings.sheet.notRecorded : formatSeconds(preMs)}
                      </span>
                    </td>
                    <td className="num">
                      <span className={postMs === null ? 'sheet__num sheet__num--absent' : 'sheet__num'}>
                        {postMs === null ? strings.sheet.notRecorded : formatSeconds(postMs)}
                      </span>
                    </td>
                    <td className="num">
                      <span
                        className={delta === null ? 'sheet__num sheet__num--absent' : 'sheet__num'}
                      >
                        {delta === null
                          ? postMs === null || preMs === null
                            ? '—'
                            : strings.sheet.notComparable
                          : `${delta > 0 ? '+' : delta < 0 ? '−' : '±'}${Math.abs(delta).toFixed(1)}`}
                      </span>
                    </td>
                    <td className="sheet__state">
                      {note && (
                        <>
                          <Shape kind={note.shape} className="sheet__shape" />
                          {note.word}
                        </>
                      )}
                      {b && b.correctionCount > 0 && strings.sheet.aside(strings.status.corrected)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          <div className="sheet__summary">
            <span className="sheet__summary-item">
              <span>{strings.sheet.summaryAttendance}</span>
              <span className="sheet__summary-value">{block.participants.length}</span>
            </span>
            <span className="sheet__summary-item">
              <span>{strings.sheet.summaryAssessed}</span>
              <span className="sheet__summary-value">{assessed}</span>
            </span>
            <span className="sheet__summary-item">
              <span>{strings.sheet.summaryProtocolValid}</span>
              <span className="sheet__summary-value">{valid}</span>
            </span>
          </div>

          <footer className="sheet__foot">
            <p>{strings.sheet.footerScope}</p>
            <p>{strings.sheet.footerComparable}</p>
            <p>{strings.sheet.footerHandContact}</p>
            <p>{strings.sheet.footerPrivacy}</p>
            {block.isExample && (
              <p>
                <strong>{strings.example.tag}</strong>　{strings.example.sheetNotice}
              </p>
            )}
            {src.isSimulated && (
              <p>
                <strong>{strings.demo.badge}</strong>　{strings.demo.detail}
              </p>
            )}
            <div className="sheet__sign">
              <span className="sheet__sign-field">{strings.sheet.signFacilitator}</span>
              <span className="sheet__sign-field">{strings.sheet.signLead}</span>
            </div>
          </footer>
        </article>
      </div>
    </div>
  )
}
