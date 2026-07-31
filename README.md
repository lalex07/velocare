# VeloCare — Tier 1 UI

Frontend for the Tier 1 measurement surface: an automated **five-times sit-to-stand** assessment
for community elder-care centres in Taiwan, and the one-page sheet a site files with its funding
report.

**This build is fixtures only. Every rep count and every time is simulated — there is no pose
estimation and no measurement.** The one real camera code path is an opt-in framing preview and
participant self-view: it binds a `MediaStream` to a `<video>` and does nothing else. No canvas, no
capture, no analysis, no retention.

Read `PRODUCT.md` for who this is for and `DESIGN.md` for the visual system. Both outrank this
file, and `CLAUDE.md`'s hard invariants outrank all three.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
```

```bash
npm run build      # tsc --noEmit && vite build  →  dist/
npm run preview    # serve the built bundle
npm run typecheck
```

Node 22+. Built and verified on Node 26 / npm 11.

## What you are looking at

Several 場次 can be open on one device at once, so the root surface is a **session list** and
nothing is selected for you. Under it, a header renders **the path to where you are**:

```
場次清單 ──┬──► 新增場次
           └──► 本期名單 ──┬──► 王阿姨・量測 ──► 王阿姨・本次量測 ──► 王阿姨・紀錄
                          ├──► 王阿姨・紀錄
                          └──► 報表
```

Every segment of that path is a 64px button. Home is always the first segment; back is always the
one before the current, which is one level *up* rather than a visit history. The header answers
where you are; the rail carries the forward action.

The theme is **positive polarity — dark ink on a cream ground**. That is an acuity decision: a
bright field constricts the pupil, which increases depth of field for a 75–90 year old reader. The
printed sheet stays strictly black on white.

| Surface | What it is |
|---|---|
| **Sessions** | Every 場次, open and completed, grouped by status. The only place the active session changes. |
| **Setup** | 據點, 期, phase, today's attendance, camera framing check. Where a 場次 is configured. |
| **Roster** | The active 場次's attendance list. Status per participant. Deliberately carries **no times**. |
| **Trial** | The 5×STS itself. Mirrored self-view on the left half, one number and five pips on the right. |
| **Result** | Straight after a trial: the time, any flag, and the next participant's name. Deliberately carries **no attempt history** — the participant is still sitting in front of the screen. |
| **Detail** | One participant, both phases, per-rep splits, 差值, and the full append-only attempt history. |
| **Sheet** | A4, one page, printable. **This is the product.** |

### Several 場次 at once, and the one failure that creates

A 據點 runs a 後測 for one 期 in the morning and a 前測 for another in the afternoon, and the
machine does not get put away in between. With one implicit session it was impossible to record a
trial into the wrong place. With several it is not — and the failure is silent: a trial recorded
against the wrong 期 or the wrong 階段 surfaces weeks later as a wrong number in a 成果報告, with
nothing on the sheet to reveal it. Nobody would ever find it.

Four things address that, and none of them is a warning dialog:

- **Nothing is active until someone picks.** No most-recent-session heuristic. An app that guessed
  right most of the time would be worse than one that is obviously silent, because the once it
  guessed wrong would be unfindable.
- **The active 據點 / 期別 / 階段 is on every surface that can record**, as a band under the header
  at facilitator reading size — roster, trial, result, participant record and sheet. It replaced
  the header's read-only phase chip, which was adequate when pre-versus-post was the only
  ambiguity and is not now. 階段 carries the extra weight: 前測 and 後測 are the pair that gets
  confused.
- **The device refuses rather than guessing.** A trial cannot start unless the session is present,
  resolvable to a 期, still open, and actually listing the person about to be measured. Refusals
  are stated in a sentence with the route out, never a greyed-out button. The guard also lives at
  the data-source seam, so a future caller cannot write into a finished 場次 by forgetting to ask.
- **Switching is deliberate and visible.** It happens in exactly one place — a row on the session
  list — never as a side effect of navigating, and the band announces it in a `role="status"` line
  for eight seconds afterwards.

Ending a 場次 stops it accepting trials, corrections and 無法進行 records; the data stays and stays
printable. Reopening is one confirmed act away, and the copy says so — a facilitator who believes
an action cannot be undone will avoid using it, and unended sessions are how 場次 stop being
distinguishable at all. There is **exactly one 場次 per (據點, 年度, 期, 階段)**: configuring a
combination that already exists resumes it rather than forking it, and the setup screen says which
before the button is pressed.

The sheet says which 期 and which 場次 it covers, **on paper** — both 階段 with their dates and
attendance, and which 場次 it was produced from. Two sheets from the same morning can otherwise
carry different 期 and look identical.

### Press `S` for the scenario switcher

The deployed demo keeps it reachable on purpose, so anyone can walk every state without a camera:
every seeded 場次 by name, each trial script (typical, slow, three-reps-only, hand contact,
tracking loss and restart), each recorded outcome, and the sheet with mixed results. Switching
sessions from the panel goes through the same one code path a tapped row does, so the context band
announces it identically. It never prints.

## The seam — where October plugs in

Everything the UI knows about data goes through one interface:

```
src/data/SessionDataSource.ts     ← the contract
src/data/fixtures.ts              ← this build (simulated)
src/data/context.tsx              ← useDataSource(); the only way components reach data
src/main.tsx                      ← the ONE line that names a concrete source
```

In October, `main.tsx` becomes:

```ts
const source = new LocalhostDataSource('http://127.0.0.1:8765')
```

and nothing else changes. The Python capture-and-decision process serves that same interface over
localhost HTTP/WebSocket on the appliance; the web UI runs full-screen in a kiosk browser on the
same machine. There is a local server. There is no remote backend, no cloud, no account, and no
network dependency.

`TrialEvent` in `src/domain/types.ts` is the wire shape the pose pipeline must emit:
`tracking` · `rep` · `hand_contact` · `void` · `settled`. The fixture source emits exactly these.

**If a component ever imports `data/fixtures` directly, that is a bug.**

## What is simulated

- **Everything numeric.** Rep detection, timings, seat height, tracking state. All scripted in
  `src/data/fixtures.ts`.
- **Two 據點, three 期, five 場次.** Fictional throughout, with pseudonymous participants
  (`P-0041`…`P-0055` and `P-0061`…`P-0072`) carrying staff-style display labels. No real person is
  represented; there are no identity fields anywhere in the type system, by invariant.

  | 期 | 場次 | | |
  |---|---|---|---|
  | 115 年度第 3 期 · 示範社區照顧關懷據點 | 前測 115/05/04 | 已結束 | 12 人, all assessed |
  | | 後測 115/07/27 | **進行中** | 12 人, 7 assessed |
  | 115 年度第 1 期 · 示範第二關懷據點 | 前測 115/07/30 | **進行中** | 10 人, 5 assessed |
  | 114 年度第 3 期 · 示範社區照顧關懷據點 | 前測 114/10/06 | 已結束 | 10 人, all assessed |
  | | 後測 114/12/29 | 已結束 | 9 人 — one absent, so the sheet reads 未記錄 |

  Two are open, mid-progress, at different 據點 and different 階段: the exact configuration in
  which a trial could be recorded into the wrong place.
- **The record log.** Pre-populated append-only. The open 後測 carries one of every edge case,
  including a tracking-loss void followed by a successful restart and a correction stacked on a
  completed trial.

## What is real

- Every surface, all interaction, and every state transition — including the session lifecycle.
- **The print sheet**, including its regulatory footer.
- The append-only record model with corrections-as-records (`src/domain/records.ts`).
- All five edge cases as first-class recorded outcomes, not error handling.
- Bundled fonts, the accessibility floor, and the print stylesheet.

## Decisions that deviate from the original brief

Recorded here so a later reader knows they were deliberate.

**1. No live timer during a trial.** The brief asked for "rep count, running total time, per-rep
times as they land". `PRODUCT.md` defines the participant as reading *at most four characters at a
time*, which a count plus a clock plus an accumulating column violates. Nobody acts on elapsed
time mid-trial: the participant needs reps-remaining, the facilitator needs to know tracking is
alive so they can catch a void. The rail carries a tracking-health indicator where the clock would
have been. Elapsed time is captured throughout and appears on Result and on the sheet.

**2. Outcome detail is facilitator-facing only.** On a settled trial the participant sees 完成 and
their pips, nothing else. `未完成五次` and `手部支撐` appear in the rail. Putting "you did not
complete five" in front of someone at 48px is the exact harm the tone rule forbids.

**3. The roster shows no times.** Ten older adults listed with their times, on a monitor in a small
shared room, is a leaderboard. Numbers live on Result (one person at a time) and on the sheet
(read alone by the site lead).

**4. 差值 is withheld when the two trials are not comparable.** A difference is only computed when
both trials are protocol-valid **and** over the same number of repetitions. Comparing a 5-rep time
against a 4-rep time produced a −4.2 s "improvement" for a participant who did *less* work; the
cell now reads 不可比較 and the footer explains why. This is a funding document.

**5. Shapes are SVG, not Unicode.** Noto Sans TC does not cover `▮ ▯ ◇ ⊘`. Since colour never
carries meaning alone, the shape is load-bearing and cannot depend on font coverage.

## Fonts

Noto Sans TC, bundled locally via `@fontsource/noto-sans-tc`, **never a CDN** — the appliance has
no network. Fontsource ships CJK as many small `unicode-range` subsets, so the browser fetches only
the ranges a page actually uses despite the large total on disk.

Digits get two independent guarantees, because a numeral that changes width as its value changes is
disqualifying on an instrument: `font-variant-numeric: tabular-nums` globally, **and** a `Digits`
primitive that renders each character in a fixed `1ch` cell. The second survives a fallback face,
which the first does not. Verified: all ten digits measure 113.27 px at the hero size.

## Verified

Measured in a headless browser, not eyeballed.

- **All nine screens audited**, not just the roster: 747 text nodes across the session list, setup,
  roster, detail, trial cue, trial running, trial settled, result and the sheet — plus the
  read-only roster of a finished 場次. Zero below 4.5:1, minimum 5.28:1. Zero controls under 64 px
  once `<input>`s are resolved to their wrapping `<label>`, which is the actual tap target. One
  `<h1>` per surface, no duplicates.
  The audit script itself had a bug worth recording: it painted black under each swatch before
  reading it back, which made every transparent background resolve as opaque black and reported
  dark ink on cream at **1.31:1**. Numbers that absurd are a broken instrument, not a broken
  palette. Do not pre-fill the canvas.
- **Roster columns actually align.** Measured: one distinct x per track per half for both the
  status and action columns, and the two halves match each other to within 0.6 px at 1280×800 and
  1600×900 — including the row carrying an extra 已更正 modifier, which sits on the same geometry
  as every other row because the modifier cell is always rendered.
- **Two bands of chrome, and the second one is the trade.** Header 72 px, session context band
  56 px, content starts at 129 px. The band replaced the header's read-only phase chip rather than
  being added to it. It costs the participant field 56 px on a surface whose largest element is
  192 px, and it buys knowing which 期 a number lands in — see the multi-session section above.
  Both the header and the band are `no-print`; **zero app chrome reaches paper**, verified.
- **Roster still fits the class, with the band in place.** All **12 of 12 rows fully visible at
  1280×800 with no scrolling** (neither the field nor the page scrolls), and 12 of 12 at 1440×900
  and 1600×900. Two columns: twelve rows at the 64 px tap floor is 768 px of rows alone, which does
  not fit under an 800 px viewport at any type size, so the tap target rather than the typography is
  the binding constraint. The 據點/期別 line came off the roster's own metadata row when the band
  took it over, which is where the band's 56 px partly came back from.
- **Contrast.** Full-page audit resolves every colour through a canvas (`getComputedStyle` returns
  `oklch()` verbatim, so string parsing silently reports 1.00:1). **Zero below 4.5:1**,
  minimum 5.28:1. Every text node in the locked participant field measures **≥8.19:1**
  against a 7:1 floor. Token matrix is in `DESIGN.md`; all values there are measured, and three
  hand-computed sets have now been wrong — including the first draft of this cream palette, whose
  estimates would have shipped `--ink-muted` at 3.80:1.
- **Print.** One A4 page, **measured by rendering the real sheet to PDF and counting pages** —
  `MediaBox [0 0 594.96 841.92]`, `/Count 1`. Capacity is measured the same way, by duplicating
  rows until it breaks: **13 participants on one page, 14 spills.** The content-height estimate
  this used to rely on was out by two rows in both directions, and it is what let a first draft of
  the coverage block ship as "5.7 mm of headroom" when it had actually cost two rows.
  Note the app shell needs its `height:100%` / `overflow:hidden` flattened in `@media print`, or a
  sheet that fits paginates to two pages anyway — and the session band needs `no-print`, which it
  did not have at first: app chrome on a sheet handed to a 據點負責人 is a bug, and it also pushed
  the twelve-row sheet to two pages.
- **Print stays black on white.** The screen's cream ground does not leak onto paper: under print
  emulation the sheet background measures pure `255,255,255` and **all 104 text nodes measure
  chroma 0 on both foreground and background**. Verified, not assumed.
- **Tap targets.** Zero facilitator controls under 64 px; smallest measured row is 66 px. (The
  scenario switcher toggle is 44 px: a demo-only affordance, absent from the product and from
  print.)
- **Digits.** All ten digits measure **113.27 px** at the hero size, unchanged.
- **Camera.** The self-view acquires a real 1280×720 stream, and **zero `<canvas>` elements exist
  in the DOM** while it is live. Denying permission leaves the trial flow fully working on fixtures.
- **Trial split.** The trial screen is two equal halves: mirrored self-view left, readout right.
  Verified across **thirteen viewport sizes** — exact 50/50 where split, no horizontal overflow, no
  clipping, and `.readout__count` the largest element in the right half at every one. Stacks below
  900 px or in portrait. Smallest hero anywhere is 6rem, three times the 2rem participant floor.
  With no camera the readout takes the whole field. See `DESIGN.md` for what this gave up: the rep
  count is no longer the largest element on screen, only in its half.
- **Reduced motion.** All four animations collapse to instant state swaps; content is never gated
  behind a transition.
- **No horizontal overflow** at 1280×800 or 1600×900.
- **CJK line breaking.** 雙手抱胸，坐穩後由工作人員開始。 holds one line at 1280×800, 1600×900,
  900×700 and 620×700, so 工作人員 never splits across lines.

### Known limits

- The sheet fits **13 participants** on one page — measured, not estimated. It was 14 before the
  涵蓋場次 line, which costs exactly one row and is worth it: with several 場次 open on one device,
  a sheet that cannot be identified from paper alone is not filable. Beyond 13 it needs a second
  page or a smaller row rhythm; the minimum funded class size is 10.
- **zh-TW only**, a dated exception to invariant 5 recorded in the design doc. Every string already
  routes through `src/i18n/strings.ts`, so English is an implementation of the `Strings` type rather
  than a refactor.
- Layout targets a fixed landscape monitor. It degrades safely on a laptop for the demo URL, but it
  is not a responsive product and phones are out of scope.

## Not built, on purpose

Physiotherapist dashboard · longitudinal trend charts · live rep-by-rep form coaching · multi-person
tracking · **any pose estimation, landmark extraction or MediaPipe code** · mobile app · cloud
backend · accounts · a second exercise · TTS · automatic capacity test.

The one piece of camera code that does exist is the opt-in framing preview: it binds a
`MediaStream` to a `<video>` and does nothing else. No canvas, no frame capture, no analysis, no
retention. Rep counts and times are still entirely fixture-driven.

**Tier 2** (working sets, load ladder, stop rule) is gated on the August experiment described in the
design doc and is deliberately absent. There is no velocity or effort UI anywhere in this build.

## Deploy

Not yet deployed. `npm run build` produces a self-contained `dist/` with a relative base, so it
works from a subpath, an arbitrary static host, or `file://`.

Whatever host is used, the deployed page must keep the persistent 示範模式 · 模擬資料 marker. It is
not decorative: this is a UI prototype with simulated data, and it must never read as a working
measurement system.
