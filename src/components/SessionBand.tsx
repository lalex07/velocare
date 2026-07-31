/* ─────────────────────────────────────────────────────────────────────────────
   The session context band.

   WHY THIS IS A BAND AND NOT A CHIP.

   With one implicit session it was impossible to record a trial into the wrong
   place. With several open at once it is not, and the failure is silent: a trial
   recorded against the wrong 期 or the wrong 階段 surfaces weeks later as a
   wrong number in a 成果報告, with nothing on the printed sheet to reveal it.
   Nobody would ever find it.

   A small phase chip in the header's end slot — which is what this replaces —
   was adequate when the only ambiguity was pre versus post. It is not adequate
   now. So 據點, 期別 and 階段 are stated together, at facilitator reading size,
   in a fixed position, on EVERY surface where a trial can be started or
   recorded: the roster, the trial, the result, the participant record, and the
   sheet. Not a subtle chip, and never only on setup.

   IT IS INFORMATION, NOT A CONTROL. There is no switcher in here. Switching
   sessions has to be a deliberate act rather than a side effect of navigating,
   so it happens in exactly one place — choosing a row on the session list — and
   this band reports the result. `switchedTo` is what makes that visible when it
   happens: a `role="status"` line, so a screen reader is told as well.

   ONE BAND OF CHROME BECAME TWO, and that is the trade. The header's read-only
   phase chip is gone, so this is a replacement rather than an addition, and it
   costs the participant field ~56px. Correctness about which 期 a number belongs
   to is worth more than 56px of a surface whose largest element is 192px.
   ───────────────────────────────────────────────────────────────────────────── */

import { ExampleTag } from './ExampleTag'
import { sessionStatusDisplay } from '../domain/display'
import { rocDate } from '../domain/dates'
import type { SessionIdentity } from '../domain/sessions'
import { strings } from '../i18n/strings'
import { StateChip } from './StateChip'

export function describeSession(id: SessionIdentity): string {
  const phase = id.phase === 'pre' ? strings.phase.pre : strings.phase.post
  return strings.session.describe(id.siteName, id.blockName, phase)
}

export function SessionBand({
  identity,
  switchedTo,
}: {
  identity: SessionIdentity
  /** Set for a few seconds after the active session changes. */
  switchedTo?: string | null
}) {
  const phaseWord = identity.phase === 'pre' ? strings.phase.pre : strings.phase.post

  return (
    /* `no-print`: this is app chrome, and the only thing that reaches paper is
       the sheet. The 期 and 階段 are not lost on paper — the sheet carries its
       own coverage block, which is the whole reason that block exists. */
    <div
      className={switchedTo ? 'sband sband--switched no-print' : 'sband no-print'}
      role="group"
      aria-label={strings.session.contextLabel}
    >
      <Fact label={strings.session.siteLabel} value={identity.siteName} />
      <Fact label={strings.session.blockLabel} value={identity.blockName} />
      {/* 階段 is the one an eye lands on first: it is the field most likely to be
          wrong, because 前測 and 後測 look alike and read alike. */}
      <Fact label={strings.session.phaseLabel} value={phaseWord} lead />
      <Fact label={strings.session.dateLabel} value={rocDate(identity.dateIso)} />

      <span className="sband__status">
        <StateChip display={sessionStatusDisplay(identity.status)} size="row" />
      </span>

      {/* Every surface that can record carries the band, so marking it here
          marks the roster, the trial, the result and the participant record in
          one place. The sheet marks itself — paper leaves the building. */}
      <ExampleTag block={{ isExample: identity.isExample }} />

      {/* Announced, not merely styled. A switch that only changed a colour would
          be exactly the silent change this band exists to prevent. */}
      <p className="sband__switched-note" role="status">
        {switchedTo ? strings.session.switched(switchedTo) : ''}
      </p>
    </div>
  )
}

function Fact({ label, value, lead }: { label: string; value: string; lead?: boolean }) {
  return (
    <span className={lead ? 'sband__fact sband__fact--lead' : 'sband__fact'}>
      <span className="sband__label">{label}</span>
      <span className="sband__value">{value}</span>
    </span>
  )
}
