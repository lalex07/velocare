/* ─────────────────────────────────────────────────────────────────────────────
   A refusal, stated out loud.

   The product already refuses in one place: 不可比較 on the sheet, where two
   trials cannot honestly be subtracted. This is the same posture applied to the
   other direction — the device will not record a trial when it cannot say
   unambiguously which 場次 the trial belongs to.

   It is a SURFACE, not a disabled button. A greyed-out control tells a standing
   part-time worker that something is wrong and nothing about what to do, and the
   thing they will do next is press it again. So every refusal names the reason
   in a sentence and offers the one route out.
   ───────────────────────────────────────────────────────────────────────────── */

import type { ReactNode } from 'react'
import { Shape } from './Shape'

export function Refusal({
  title,
  body,
  actions,
}: {
  title: string
  body: string
  actions?: ReactNode
}) {
  return (
    <div className="refusal" role="status">
      <p className="refusal__title">
        <Shape kind="slash-circle" className="refusal__mark" />
        {title}
      </p>
      <p className="refusal__body">{body}</p>
      {actions && <div className="refusal__actions">{actions}</div>}
    </div>
  )
}
