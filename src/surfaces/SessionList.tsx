/* ─────────────────────────────────────────────────────────────────────────────
   The session list — the root surface, and the ONLY place a session is chosen.

   Several 場次 are open on one device at the same time: a 據點 runs a 後測 for
   one 期 in the morning and a 前測 for another in the afternoon, and the machine
   does not get put away in between. So there is no "current session" the app can
   infer. There is a list, and someone picks.

   NOTHING IS SELECTED FOR YOU, and that is the whole design. An app that
   auto-resumed the most recent open session would be right most of the time,
   which is worse than being obviously silent — the one time it guessed wrong,
   the wrong number would go into a 成果報告 and nothing on the sheet would
   reveal it. Picking is one tap, and it is the tap that makes the rest of the
   session unambiguous.

   Grouped by status rather than coloured by it: 進行中 above 已結束. The
   grouping does the scanning work, so the status marks need no hue and the
   product does not have to invent a sixth colour channel.
   ───────────────────────────────────────────────────────────────────────────── */

import { RailButton } from '../components/RailButton'
import { StateChip } from '../components/StateChip'
import { describeSession } from '../components/SessionBand'
import { rocDate } from '../domain/dates'
import { sessionStatusDisplay } from '../domain/display'
import type { ResolvedTrial } from '../domain/records'
import { attendeesOf, blockOf, identityOf, listOrder, progressOf } from '../domain/sessions'
import type { AssessmentSession, Block, SessionId } from '../domain/types'
import { strings } from '../i18n/strings'

export function SessionList({
  blocks,
  sessions,
  allResolved,
  activeSessionId,
  onOpen,
  onNew,
}: {
  blocks: readonly Block[]
  sessions: readonly AssessmentSession[]
  allResolved: ReadonlyMap<SessionId, readonly ResolvedTrial[]>
  activeSessionId: SessionId | null
  onOpen: (session: AssessmentSession) => void
  onNew: () => void
}) {
  const ordered = listOrder(sessions)
  const open = ordered.filter((s) => s.status === 'open')
  const done = ordered.filter((s) => s.status === 'completed')

  const row = (s: AssessmentSession) => {
    const block = blockOf(blocks, s)
    if (!block) return null
    const identity = identityOf(s, block)
    const resolved = allResolved.get(s.sessionId) ?? []
    const progress = progressOf(s, block, resolved)
    const label = describeSession(identity)
    const isActive = s.sessionId === activeSessionId

    return (
      <li className={isActive ? 'srow srow--active' : 'srow'} key={s.sessionId}>
        <span className="srow__site">{block.siteName}</span>
        <span className="srow__block">{block.blockName}</span>
        {/* 階段 gets the strongest weight in the row for the same reason it leads
            the context band: 前測 and 後測 are the pair that gets confused. */}
        <span className="srow__phase">
          {s.phase === 'pre' ? strings.phase.pre : strings.phase.post}
        </span>
        <span className="srow__date">{rocDate(s.dateIso)}</span>
        <span className="srow__state">
          <StateChip display={sessionStatusDisplay(s.status)} size="row" />
        </span>
        <span className="srow__progress">
          {strings.session.progress(progress.done, progress.total)}
        </span>
        {/* Rendered even when empty, so the action column holds one x across
            every row — the same rule the roster grid runs on. */}
        <span className="srow__mark">{isActive ? strings.session.current : ''}</span>
        <span className="srow__action">
          <RailButton
            variant={s.status === 'open' ? 'secondary' : 'quiet'}
            icon={s.status === 'open' ? 'start' : 'record'}
            ariaLabel={
              s.status === 'open'
                ? strings.session.resumeFor(label)
                : strings.session.viewFor(label)
            }
            onClick={() => onOpen(s)}
          >
            {s.status === 'open' ? strings.session.resume : strings.session.view}
          </RailButton>
        </span>
      </li>
    )
  }

  const total = open.length + done.length

  return (
    <div className="zones">
      <div className="field">
        <div className="slist">
          <p className="slist__lede">{strings.session.listLede}</p>

          {total === 0 ? (
            <div className="cue">
              <p className="cue__title">{strings.session.emptyTitle}</p>
              <p className="cue__hint">{strings.session.emptyBody}</p>
            </div>
          ) : (
            <>
              {open.length > 0 && (
                <section className="slist__group">
                  <h2 className="slist__group-title">{strings.session.groupOpen}</h2>
                  <ul className="sgrid">{open.map(row)}</ul>
                </section>
              )}
              {done.length > 0 && (
                <section className="slist__group">
                  <h2 className="slist__group-title">{strings.session.groupCompleted}</h2>
                  <ul className="sgrid">{done.map(row)}</ul>
                </section>
              )}
            </>
          )}
        </div>
      </div>

      <div className="rail">
        <div className="rail__context">
          <span className="rail__context-id">{strings.session.groupOpen}</span>
          <span className="rail__context-label">{open.length}</span>
        </div>
        <div className="rail__spacer" />
        <div className="rail__actions">
          <RailButton variant="primary" icon="roster" onClick={onNew}>
            {strings.session.newSession}
          </RailButton>
        </div>
      </div>
    </div>
  )
}

/** Attendance count for one session. Exported for the sheet's coverage line. */
export function attendeeCount(session: AssessmentSession, block: Block | null): number {
  return attendeesOf(session, block).length
}
