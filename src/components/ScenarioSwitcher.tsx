/* ─────────────────────────────────────────────────────────────────────────────
   Scenario switcher. Dev-shaped, but deliberately reachable in the deployed demo
   behind a keypress, so a judge or a physiotherapist can walk every state without
   a camera.

   `no-print` throughout: this must never reach paper.
   ───────────────────────────────────────────────────────────────────────────── */

import { strings } from '../i18n/strings'
import type { TrialScript } from '../data/fixtures'
import type { SessionId, SessionStatus } from '../domain/types'

export interface ScenarioSessionOption {
  readonly sessionId: SessionId
  readonly label: string
  readonly status: SessionStatus
}

export interface ScenarioActions {
  gotoSessions: () => void
  /** Jumps straight into a named 場次. Named, not "the pre one": with several
      open, a demo shortcut that picked by phase would pick the wrong one. */
  gotoSession: (id: SessionId) => void
  openSessions: readonly ScenarioSessionOption[]
  gotoSheet: () => void
  runTrial: (script: TrialScript) => void
  showResult: (kind: 'complete' | 'incomplete' | 'hand_contact' | 'unable' | 'aborted') => void
}

/* Ids only. Every label comes from the strings module, same as any other surface:
   a demo-only panel is still copy, and leaving it hardcoded would make it the one
   place English cannot be added by implementing the `Strings` type. */
const TRIALS: readonly TrialScript[] = [
  'complete_typical',
  'complete_slow',
  'incomplete_three',
  'hand_contact',
  'void_midway',
]

const RESULTS = ['complete', 'incomplete', 'hand_contact', 'unable', 'aborted'] as const

export function ScenarioSwitcher({
  open,
  onOpen,
  onClose,
  actions,
}: {
  open: boolean
  onOpen: () => void
  onClose: () => void
  actions: ScenarioActions
}) {
  if (!open) {
    return (
      /* Rendered into the header's end slot rather than fixed-positioned over
         the field, which is what made it overlap roster rows. */
      <button className="scn__toggle no-print" onClick={onOpen} aria-expanded={false}>
        {strings.scenario.title}（S）
      </button>
    )
  }

  return (
    <aside className="scn no-print" aria-label={strings.scenario.title}>
      <div className="scn__head">
        <h2 className="scn__title">{strings.scenario.title}</h2>
        <button className="scn__btn" onClick={onClose}>
          {strings.scenario.close}
        </button>
      </div>
      <p className="scn__hint">{strings.scenario.hint}</p>

      {/* Every seeded 場次 by name. Switching from here still goes through the
          app's one `activate` path, so the context band announces it exactly as
          it would if the row had been tapped on the session list. */}
      <div className="scn__group">
        <p className="scn__group-title">{strings.scenario.groupSessions}</p>
        <div className="scn__items">
          <button className="scn__btn" onClick={actions.gotoSessions}>
            {strings.scenario.sessionList}
          </button>
          {actions.openSessions.map((s) => (
            <button
              key={s.sessionId}
              className="scn__btn"
              onClick={() => actions.gotoSession(s.sessionId)}
            >
              {s.label}
              {'　'}
              {s.status === 'open' ? strings.session.statusOpen : strings.session.statusCompleted}
            </button>
          ))}
        </div>
      </div>

      <div className="scn__group">
        <p className="scn__group-title">{strings.scenario.groupTrial}</p>
        <div className="scn__items">
          {TRIALS.map((t) => (
            <button key={t} className="scn__btn" onClick={() => actions.runTrial(t)}>
              {strings.scenario.trials[t]}
            </button>
          ))}
        </div>
      </div>

      <div className="scn__group">
        <p className="scn__group-title">{strings.scenario.groupEdge}</p>
        <div className="scn__items">
          {RESULTS.map((r) => (
            <button key={r} className="scn__btn" onClick={() => actions.showResult(r)}>
              {strings.scenario.results[r]}
            </button>
          ))}
        </div>
      </div>

      <div className="scn__group">
        <p className="scn__group-title">{strings.scenario.groupSheet}</p>
        <div className="scn__items">
          <button className="scn__btn" onClick={actions.gotoSheet}>
            {strings.scenario.sheetMixed}
          </button>
        </div>
      </div>
    </aside>
  )
}
