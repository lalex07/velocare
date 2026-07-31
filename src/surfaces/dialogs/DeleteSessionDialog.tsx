/* Deleting a whole 場次.

   THE DELETION BOUNDARY — see SessionDataSource.deleteSession for the full
   argument. Deletion operates on a whole 場次 or on everything, NEVER on an
   individual trial record: a record once written is never altered, and a
   miscount is fixed by appending a correction that points at the original.
   Both survive forever. The confirmation says so out loud, because the person
   most likely to want a single record gone is exactly the person who needs to
   be told that correcting is the supported move and does not destroy anything.

   It names the 場次 and counts the records. A confirmation that does not say
   what it will act on is not a confirmation once several 場次 exist. */

import { RailButton } from '../../components/RailButton'
import { strings } from '../../i18n/strings'
import { Dialog } from './Dialog'

export function DeleteSessionDialog({
  open,
  sessionName,
  recordCount,
  onCancel,
  onConfirm,
}: {
  open: boolean
  sessionName: string
  recordCount: number
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <Dialog open={open} onCancel={onCancel} labelledBy="delete-session-title">
      <h2 className="dlg__title" id="delete-session-title">
        {strings.session.deleteTitle}
      </h2>
      <p className="dlg__body">{strings.session.deleteBody(sessionName, recordCount)}</p>
      <div className="dlg__actions">
        <RailButton variant="quiet" onClick={onCancel}>
          {strings.session.cancel}
        </RailButton>
        <RailButton onClick={onConfirm}>{strings.session.deleteConfirm}</RailButton>
      </div>
    </Dialog>
  )
}
