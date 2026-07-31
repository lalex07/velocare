/* ─────────────────────────────────────────────────────────────────────────────
   The 示範資料 marker.

   Rendered wherever an example 期 appears — session list row, session context
   band, participant record, and the printed sheet. One component so the wording
   cannot drift between surfaces, and so "is this marked everywhere?" is a
   question about call sites rather than about copy.

   IT IS NOT DECORATIVE AND IT IS NOT `no-print`. The whole point is that a
   viewer holding the paper can tell. See `.sheet__example` in print.css for the
   printed form, which is a full sentence rather than a badge.

   Marked at 期 level: see the `isExample` comment in domain/types.ts for why a
   real trial performed inside an example 期 is still example-marked.
   ───────────────────────────────────────────────────────────────────────────── */

import { strings } from '../i18n/strings'

export function ExampleTag({ block }: { block: { readonly isExample?: boolean } | null }) {
  if (!block?.isExample) return null
  return <span className="extag">{strings.example.tag}</span>
}
