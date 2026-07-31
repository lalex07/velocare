/* Ending a 場次, and reopening one.

   Both are confirmed rather than immediate, because both change whether the
   device will accept a measurement — which is the one piece of state a
   facilitator must never change by accident. Ending is confirmed because a
   session that stops accepting trials mid-class would look like a broken
   machine; reopening is confirmed because it makes a filed 期 writable again.

   The end copy states the reversal in the same breath as the consequence. A
   facilitator who believes an action cannot be undone will avoid using it, and
   an unended session is how 場次 stop being distinguishable at all. */

import { RailButton } from '../../components/RailButton'
import { strings } from '../../i18n/strings'
import { Dialog } from './Dialog'

export function SessionStatusDialog({
  open,
  mode,
  sessionName,
  onCancel,
  onConfirm,
}: {
  open: boolean
  mode: 'end' | 'reopen'
  /** The full 據點 · 期別 · 階段 line, so the dialog names what it will act on. */
  sessionName: string
  onCancel: () => void
  onConfirm: () => void
}) {
  const ending = mode === 'end'
  return (
    <Dialog open={open} onCancel={onCancel} labelledBy="session-status-title">
      <h2 className="dlg__title" id="session-status-title">
        {ending ? strings.session.endTitle : strings.session.reopenTitle}
      </h2>
      {/* Names the session. A confirmation that does not say what it will act on
          is not a confirmation once several sessions exist. */}
      <p className="dlg__legend">{sessionName}</p>
      <p className="dlg__body">{ending ? strings.session.endBody : strings.session.reopenBody}</p>
      <div className="dlg__actions">
        <RailButton variant="quiet" onClick={onCancel}>
          {strings.session.cancel}
        </RailButton>
        <RailButton onClick={onConfirm}>
          {ending ? strings.session.endConfirm : strings.session.reopenConfirm}
        </RailButton>
      </div>
    </Dialog>
  )
}
