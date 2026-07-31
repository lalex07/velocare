/* ─────────────────────────────────────────────────────────────────────────────
   The header — navigation, and the answer to "where am I".

   STRUCTURE: A PATH, NOT A NAV BAR.

   This product is a workflow. There are five surfaces and they nest:

       設定 ──► 本期名單 ──┬──► 王阿姨・量測
                          ├──► 王阿姨・紀錄
                          └──► 報表

   So the header shows the actual path to where you are, and **every segment of
   it is a button**. That gives two guarantees a facilitator can rely on without
   learning anything:

     - **Home** is always the first segment. It always returns to 場次設定.
     - **Back** is always the segment immediately before the current one, which
       is one level up by construction rather than by history. A browser-style
       back that retraced visits would send someone who arrived at 紀錄 from
       量測 back into a finished trial, which is not "up".

   Both are also duplicated as an explicit ← control at the left, because a
   breadcrumb segment reads as location to some people and as a control to
   others, and a standing part-time worker should not have to guess. The whole
   trail is 64px tall so every segment clears the tap floor.

   ONE BAND. The demo marker used to be a full-width strip beneath this header,
   which meant every surface opened with two bands of chrome before any content.
   It is now a badge in the end slot; see DemoDisclosure.tsx for why folding it
   does not weaken the disclosure.

   THE PHASE CHIP IS GONE FROM HERE. It said 本期階段：後測 and nothing else,
   which was adequate while there was one implicit session and pre-versus-post
   was the only ambiguity. With several 場次 open on one device it is not: 據點,
   期別 and 階段 all have to be readable together before anyone presses 開始, and
   a chip in the end slot beside a demo badge is not where that belongs. It moved
   to the session context band below this header — see SessionBand.tsx. The
   header answers "where am I"; the band answers "what am I recording into".
   ───────────────────────────────────────────────────────────────────────────── */

import { Icon, type IconKind } from './Icon'
import { Logo } from './Logo'
import { strings } from '../i18n/strings'

export interface Crumb {
  readonly title: string
  readonly icon: IconKind
  /** Absent on the current surface, which is what makes it the current one. */
  readonly go?: (() => void) | undefined
}

export function AppHeader({
  trail,
  demoSlot,
  scenarioSlot,
}: {
  /** Root first, current surface last. Always at least one entry. */
  trail: readonly Crumb[]
  /** The persistent 示範模式 marker, folded in from what used to be a
      full-width strip below this header. */
  demoSlot?: React.ReactNode
  /** The demo-only scenario control. Lives here so it stops floating over
      roster content, which is what it did as a fixed-position button. */
  scenarioSlot?: React.ReactNode
}) {
  const back = [...trail].reverse().find((c) => c.go)
  const home = trail[0]

  return (
    <header className="hdr no-print">
      <Logo />

      <nav className="hdr__nav" aria-label={strings.nav.whereLabel}>
        {/* Explicit back, in a fixed position, on every surface that has one. */}
        {back && back !== home && (
          <button type="button" className="hdr__up" onClick={back.go} title={strings.nav.back}>
            <Icon kind="back" />
            <span className="sr-only">{strings.nav.back}</span>
          </button>
        )}

        <ol className="trail">
          {trail.map((c, i) => {
            const last = i === trail.length - 1
            return (
              <li key={`${c.title}-${i}`} className="trail__item">
                {i > 0 && (
                  <span className="trail__sep" aria-hidden="true">
                    /
                  </span>
                )}
                {c.go ? (
                  <button type="button" className="trail__link" onClick={c.go}>
                    <Icon kind={c.icon} />
                    <span>{c.title}</span>
                  </button>
                ) : (
                  /* The current segment is the page's <h1>. It names the surface
                     and it is already the one heading every surface has, so
                     making it the heading avoids either a duplicate title or a
                     visually-hidden one that can drift out of sync. */
                  <h1 className="trail__now" aria-current={last ? 'page' : undefined}>
                    <Icon kind={c.icon} />
                    <span>{c.title}</span>
                  </h1>
                )}
              </li>
            )
          })}
        </ol>
      </nav>

      <div className="hdr__end">
        {demoSlot}
        {scenarioSlot}
      </div>
    </header>
  )
}
