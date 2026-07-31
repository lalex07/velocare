/* Clearing every 場次 and every record on this machine.

   Confirmed, and the copy is explicit that it takes BOTH the example data and
   anything actually recorded here. A control that quietly spared "real" records
   would be worse than one that takes everything: it would leave a facilitator
   unsure what is still on the machine, which is the state this whole change
   exists to eliminate. */

import { RailButton } from '../../components/RailButton'
import { strings } from '../../i18n/strings'
import { Dialog } from './Dialog'

export function ClearDataDialog({
  open,
  onCancel,
  onConfirm,
}: {
  open: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <Dialog open={open} onCancel={onCancel} labelledBy="clear-title">
      <h2 className="dlg__title" id="clear-title">
        {strings.example.clearTitle}
      </h2>
      <p className="dlg__body">{strings.example.clearBody}</p>
      <div className="dlg__actions">
        <RailButton variant="quiet" onClick={onCancel}>
          {strings.example.cancel}
        </RailButton>
        <RailButton onClick={onConfirm}>{strings.example.clearConfirm}</RailButton>
      </div>
    </Dialog>
  )
}
