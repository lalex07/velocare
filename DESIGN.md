# Design

Visual system for VeloCare Tier 1. Strategy lives in `PRODUCT.md`; hard invariants live in
`CLAUDE.md`. Where this file and those conflict, they win.

## Theme

**Single theme, positive polarity: dark ink on a cream ground. No toggle.**

Scene sentence that produced it: *a surveyor's field notebook on a bench under fluorescent light —
warm ruled paper, dense dark ink, one blue pencil used only where something must be marked, and
nothing on the page that is not a measurement or a label.*

This replaces the earlier dark theme. The reversal is an **acuity decision, not a mood one**, and
that distinction governs how the values are picked:

1. **The field is the brightest surface.** A bright field constricts the pupil, increasing depth of
   field and reducing the visual cost of aberration and lens opacity for a 75–90 year old eye. The
   whole justification rests on luminance, so luminance is what the cream is chosen for.
2. **Cream, not white.** `oklch(0.955 0.014 88)`. Pure white under overhead fluorescent light
   produces veiling glare that gives back what the pupil constriction won. Chroma stays under 0.02:
   enough to read as warm paper, little enough that it never reads as a colour.
3. **The hero readout stays achromatic.** Near-black ink, not the accent hue. Cataracts scatter
   light and flatten contrast sensitivity; chroma on a 192px numeral costs real luminance contrast
   at 3 m. This rule is independent of polarity and survived the flip unchanged.
4. **The rail is still a different material.** It is now *darker* than the field where it used to be
   lighter. The zone law never depended on which direction that difference ran, only that it exist.

What did **not** change: the 7:1 participant floor, the ban on colour carrying meaning alone, the
2rem participant floor, tabular figures, and the tap-target floor.

The printed sheet is a separate surface and is **strictly black on white** — verified, not assumed.
The cream must never reach `print.css`.

## Color

OKLCH throughout. Strategy: **Restrained** — the floor for product register, and correct here.
Accent carries state only, never decoration.

The chromatic range is a **light-to-dark blue ramp**. Blue rather than the old olive seed because
on a warm cream ground a cool hue separates cleanly at every lightness, and because the ramp has to
carry both a near-black ink and a mid-tone accent without either reading as a different family.
Components never use a ramp step directly; they go through a semantic token, so the mapping lives
in one place.

```css
/* Blue ramp — the primary chromatic range */
--blue-50:  oklch(0.968 0.016 250);   --blue-500: oklch(0.560 0.148 250);
--blue-100: oklch(0.928 0.034 250);   --blue-600: oklch(0.492 0.152 250);
--blue-200: oklch(0.868 0.058 250);   --blue-700: oklch(0.424 0.140 250);
--blue-300: oklch(0.782 0.088 250);   --blue-800: oklch(0.340 0.108 250);
--blue-400: oklch(0.676 0.118 250);   --blue-900: oklch(0.262 0.070 250);

/* Surfaces — cream, chroma under 0.02. The FIELD is the brightest. */
--bg:              oklch(0.955 0.014 88);   /* room-facing field                */
--surface:         oklch(0.911 0.018 88);   /* facilitator rail — darker         */
--surface-raised:  oklch(0.981 0.008 88);   /* controls, rows — sit up           */
--line:            oklch(0.848 0.021 88);   /* hairlines                         */
--line-strong:     oklch(0.560 0.070 250);  /* focus ring, active borders        */

/* Ink — near-black with a slight blue cast, so text belongs to the ramp's
   family rather than reading as a neutral pasted on top. */
--ink:             oklch(0.250 0.028 255);  /* hero readout, participant text    */
--ink-secondary:   oklch(0.397 0.032 255);  /* participant-safe secondary        */
--ink-muted:       oklch(0.468 0.028 255);  /* facilitator-read text only        */

/* State — the machine. functional only */
--accent:          var(--blue-700);         /* tracking live                    */
--alert:           oklch(0.451 0.185 27);   /* tracking LOST — the only alarm   */

/* Status channel — a PERSON'S outcome. Facilitator surfaces only. */
--st-measured:     oklch(0.403 0.145 250); /* 已量測    · blue                  */
--st-partial:      oklch(0.390 0.095 195); /* 未完成五次 · teal                  */
--st-protocol:     oklch(0.410 0.105 65);  /* 手部支撐  · amber                 */
--st-unable:       oklch(0.416 0.135 310); /* 無法進行  · violet                */
--st-discarded:    var(--ink-muted);       /* 已作廢 — an absence, not a hue    */
```

### Contrast — measured, not calculated

Every number below was read back in the browser by painting the token to a canvas and computing
WCAG relative luminance. **Three revisions of this file have now carried hand-computed ratios that
were wrong in both directions**, most recently the first draft of the cream palette, whose
estimates were off by up to 1.2 ratio points and would have shipped `--ink-muted` at 3.80:1. OKLCH
lightness is not a proxy for contrast ratio; re-measure after any token change.

| Token | `--bg` | `--surface` | `--surface-raised` |
|---|---|---|---|
| `--ink` | **14.10** | 12.29 | 15.24 |
| `--ink-secondary` | **8.19** | 7.14 | 8.85 |
| `--ink-muted` | **6.06** | 5.28 | 6.55 |
| `--accent` | **7.21** | 6.29 | 7.80 |
| `--alert` | **7.14** | 6.22 | 7.72 |
| `--st-measured` | **7.88** | 6.87 | 8.52 |
| `--st-partial` | **7.69** | 6.70 | 8.31 |
| `--st-protocol` | **7.97** | 6.95 | 8.62 |
| `--st-unable` | **8.09** | 7.05 | 8.74 |
| `--st-discarded` | **6.06** | 5.28 | 6.55 |

All three ink tokens clear 4.5:1 on all three surfaces. `--ink` and `--ink-secondary` clear the
**7:1 participant floor** on `--bg`, which is the surface the participant field is painted in;
`--ink-muted` does not, and is confined to facilitator-read text.

**The scoped guarantee.** `--ink-muted` never appears inside **`.field--locked`** — the trial
screen while a trial is live — and that is verified rather than asserted: every text node in the
locked field measures **8.19:1 or better** against a 7:1 floor. The looser claim, that it never
appears in `.field` at all, is **false**: the roster occupies the full field between trials and
uses `--ink-muted` for row ids and metadata, at 6.06:1. That is correct, because the roster is read
by the facilitator, not by someone mid-effort at 3 m. The floor applies to participant-facing
surfaces, and the relaxed zone is not one.

Note the ordering is no longer monotonic across the three surfaces: `--surface-raised` is now
*lighter* than `--bg`, so ratios against it are the highest rather than the lowest. That is the
polarity flip showing up in the table, and it is why the whole table was re-measured rather than
rescaled.

### Colour never carries meaning alone

Every state pairs **colour + word + distinct shape**. The shapes are non-negotiable, because a
participant with colour-vision deficiency and a facilitator glancing sideways both read shape
faster than hue.

Shapes are **SVG, not Unicode geometric characters** (`src/components/Shape.tsx`). Noto Sans TC
does not cover `▮ ▯ ◇ ⊘`, and a missing-glyph box is not a shape. If a state's legibility depends
on font coverage it is not guaranteed, which is the same argument as the `Digits` primitive.

| State | Colour | Word | Shape (`ShapeKind`) |
|---|---|---|---|
| Tracking live | `--accent` | 追蹤中 | `circle-filled` |
| Tracking idle | none (`--ink-secondary`) | 待機 | `circle-hollow` |
| Tracking lost | `--alert` | 追蹤中斷 | `square-filled` |
| Awaiting measurement | none (`--ink-secondary`) | 待量測 | `circle-hollow` |
| Complete | `--st-measured` | 已量測 | `bar-filled` |
| Incomplete | `--st-partial` | 未完成五次 | `bar-hollow` |
| Protocol invalid | `--st-protocol` | 手部支撐 | `triangle` |
| Unable to perform | `--st-unable` | 無法進行 | `diamond` |
| Aborted | `--st-discarded` | 已作廢 | `slash-circle` |
| Camera signal live | `--accent` | 鏡頭訊號正常 | `signal-full` |
| Camera signal stalled | `--alert` | 鏡頭訊號不穩 | `signal-weak` |
| Camera off | none (`--ink-secondary`) | 鏡頭已關閉 | `signal-none` |

Three disjoint shape families, so a facilitator glancing sideways never confuses them:

- **Tracking** — circles and a square. Is the machine watching?
- **Outcome** — bars, triangle, diamond, slash. Did the person finish?
- **Camera signal** — a stepped meter. Is the lens still delivering frames?

Awaiting measurement keeps `circle-hollow` and stays achromatic on purpose: it is the majority
state at the start of a session, and colouring eight of twelve rows would destroy the contrast that
makes the measured ones scannable.

### Outcome colour — revised

The original rule was **"only two states carry colour, and both are about the machine; everything
describing a person's result is achromatic."** That was too strong, and the roster proved it: at
twelve rows, states separated only by a small grey glyph could not be scanned, and the facilitator
lost the one thing that surface exists to answer — who is left. Colour is now a **third redundant
channel** on outcome states, on facilitator surfaces only.

The part of the old rule that was actually load-bearing is kept intact:

1. **No outcome state is red.** `--alert` (hue 30) still means the MACHINE failed — tracking lost,
   void — and never that a person did badly. `PRODUCT.md`: "failure states are not failures." A
   participant who used their hands did not malfunction, and a red row would tell them they did.
2. **Hue is category, not quality.** The four chromatic outcome tones are tuned to equal *measured
   luminance* rather than to equal OKLCH lightness — not the same thing, which is why each hue
   carries a slightly different L. They land at **7.69–8.09:1** on `--bg`, a spread of 0.40 of a
   ratio point, so none of them pops as an alarm relative to the others. It reads as a patch panel,
   not a traffic light. This is measured, not asserted.
3. **Never inside `.field--locked`.** The participant field during a live trial renders no chip at
   all, so it stays exactly as austere as it was. The trial screenshot is unchanged.
4. **Colour is still never alone.** Every state keeps its word and its SVG shape. Delete every
   `--st-` token and the surface remains fully readable.

The printed sheet is deliberately excluded: it is black on white, and a mono office printer would
render these five hues as five indistinguishable greys. Paper keeps word plus shape.

## Typography

**One family: Noto Sans TC.** Bundled locally via `@fontsource/noto-sans-tc`, never a CDN, because
the appliance has no network. Weights 400 / 500 / 700 only.

Chinese is the interface, not a fallback. There is no Latin display face. When English arrives it
will be Noto Sans (Latin), which is metrically designed alongside Noto Sans TC and therefore
matches weight and x-height without optical patching.

### Digits are the primary content

Two mechanisms, belt and braces, because a digit that changes width as it changes value is
disqualifying on an instrument:

1. `font-variant-numeric: tabular-nums` plus `font-feature-settings: "tnum" 1`.
2. **A `<Digits>` primitive that renders each character in a fixed `1ch` inline-block cell.** This
   is font-independent and survives a fallback face, which `tnum` alone does not. All hero numbers
   and all elapsed times route through it.

### Scale — fixed rem, not fluid

Fluid type is wrong here. The monitor is a known fixed device at a known fixed distance; a
`clamp()` that shrinks the readout on a narrower viewport would shrink the one thing that must
never shrink.

```css
/* Participant field — 2rem floor per invariant 4 */
--t-hero:    12rem;    /* 192px · rep count                     */
--t-display:  5rem;    /*  80px · elapsed time, result surface   */
--t-lead:     3rem;    /*  48px · 完成, state words              */
--t-part:     2rem;    /*  32px · participant floor              */

/* Facilitator band — NOT the participant band. Read at ~0.6 m by
   a standing operator looking at the machine. Ordinary working-UI
   sizes; the 2rem floor does not apply and applying it was a bug. */
--t-fac-xl: 1.75rem;   /* 28px · facilitator emphasis            */
--t-fac-lg: 1.25rem;   /* 20px · row primary, dialog titles      */
--t-fac:    1.0625rem; /* 17px · controls, body, labels          */
--t-fac-sm: 0.9375rem; /* 15px · metadata floor                  */
```

Ratio ≈1.25 in the participant band, ≈1.13–1.18 in the facilitator band per the product register
(1.125–1.2 is the product-UI norm; the ≥1.25 rule is a brand-surface rule). Line-height 1.1 on the
hero (a 192px numeral needs no leading), 1.5 on prose.

### The floor is scoped, and the scoping is mechanical

The accessibility floor — nothing under 2rem, ~12rem primary, 7:1 — is **participant-facing only**.
An earlier revision applied it to the roster, which is a facilitator surface, and the cost was
concrete: at 1280×800 only three of twelve rows were on screen. A roster you must scroll cannot
answer "who is left", which is the only question it exists to answer.

The separation is enforced by token vocabulary rather than by vigilance:

- `.field--locked` is built **exclusively** from `--t-hero` / `--t-display` / `--t-part`, every one
  of which is ≥2rem. No `--t-fac-*` token appears inside it.
- Therefore the facilitator band can be re-scaled freely without any possibility of breaching the
  participant floor. That is why the change above was safe.
- `.field--locked` also sets `font-size: var(--t-part)`, so `ch` and `em` measured inside the
  participant zone resolve against the participant size. Without this, lowering the facilitator
  scale silently narrowed `.cue` and re-broke 工作人員 across a line. Measure-widths in that zone
  depend on this rule.

**The 64px tap target is not part of the floor and does not move.** It is about a hurried standing
user, not about visual acuity, and it applies to every facilitator control at every type size. It
is also the binding constraint on the roster: twelve rows × 64px is 768px of rows alone, which does
not fit under an 800px viewport at any type size. That is why the roster is two columns.

### Surface classification

| Surface | Audience | Floor applies |
|---|---|---|
| Trial screen, `.field--locked` (cue, readout, 完成, void) | **Participant**, 2.5–3 m, mid-effort | **Yes** |
| Roster | Facilitator, standing at the machine | No |
| Result | Facilitator (participant may glance) | No |
| Correction / abort / unable dialogs | Facilitator | No |
| Facilitator rail, all surfaces | Facilitator | No |
| Framing preview | Facilitator | No |
| Demo banner, scenario switcher | Observer / demo only | No |
| Printed sheet | Site lead, on paper | Own pt scale |

The result surface keeps `--t-display` on the measured time. That is a hierarchy decision about the
surface's primary content, not the participant floor leaking back in.

## Layout — the zone law

This is the resolution of the central structural problem: **one machine, one monitor, two
audiences.**

```
┌────────────────────────────────────────────┐
│                                            │
│         PARTICIPANT FIELD  ~72vh           │   --bg
│                                            │
│  ┌─────────────────┬─────────────────┐    │
│  │                 │                 │    │
│  │   SELF-VIEW     │   0 / 5         │    │
│  │   mirrored,     │   次             │    │
│  │   full height   │   ○ ○ ○ ○ ○     │    │
│  │                 │                 │    │
│  └─────────────────┴─────────────────┘    │
│   Equal halves. With no camera the right   │
│   half becomes the whole field.            │
├────────────────────────────────────────────┤   1px --line
│  FACILITATOR RAIL  ~28vh        --surface  │
│  All controls. All machine state.          │
└────────────────────────────────────────────┘
```

**Rules:**

- The rail is a **different surface lightness**, so it reads as a separate device panel rather
  than as part of the readout. This is the whole trick: the two audiences are separated by
  material, not by font size.
- **During an active trial the Participant Field is locked to one number, the pips, and the
  self-view.** No clock, no per-rep list, no name, no logo. `--ink-muted` is banned from this zone
  by contrast, which makes the rule mechanical. The rep count is required to be the largest element
  in its half; it is no longer required to be the largest element on screen. See the split below.
- **Between trials the zone law relaxes.** Roster and result may occupy the full field, because
  nobody is mid-effort and the facilitator is the only reader.
- Facilitator controls: **≥64px tap targets**, ≥16px gaps so a hurried thumb cannot hit two.
- No hover-only affordances anywhere. Every state reachable by focus and touch.

### Deviation from the original build brief, recorded deliberately

The brief asked for "rep count, running total time, per-rep times as they land" during a trial.
**The live clock and the per-rep column are not built.** `PRODUCT.md` defines the participant as
reading "at most four characters at a time," which a count plus a clock plus an accumulating
column violates. Elapsed time is captured throughout and appears on the result surface and the
sheet. Nobody acts on it mid-trial: the participant needs reps-remaining, the facilitator needs
to know tracking is alive so they can catch a void early. The rail therefore carries a
tracking-health indicator where the clock would have been.

## Components

Custom. No Material, no Carbon, no shadcn vocabulary — none of them has a primitive for "one
number legible at three metres" or for a government funding report.

| Component | Notes |
|---|---|
| `Digits` | Fixed-cell numeral renderer. Every number on screen goes through it. |
| `RepPips` | Five slots, filled / hollow. Shape-first so it reads without colour. |
| `StateChip` | Colour + word + shape triad from the table above. Never colour alone. |
| `RailButton` | 64px min, three sizes, full state set: default / hover / focus-visible / active / disabled. |
| `ParticipantRow` | Roster row. Status by shape and word. **Carries no time.** |
| `TrialField` | The locked participant zone. Two equal halves, or one when there is no camera. |
| `Digits` | Fixed-cell numerals. Signs get a full cell; separators get 0.42ch. |
| `FacilitatorRail` | Persistent bottom panel. |
| `Sheet` | The A4 print surface. Light theme, separate scale in pt/mm. |
| `ScenarioSwitcher` | Overlay, keypress-reachable, absent from print. |
| `DemoBanner` | Persistent honesty marker. Cannot be dismissed. One dense line. |
| `AppHeader` | The path to where you are. Home, back, one `<h1>` per surface. |
| `Setup` | Session setup. 據點, 期, phase, attendance, framing check. |
| `Result` | Post-trial. This person's time, and move on. **No history — see above.** |
| `ParticipantDetail` | One person, both phases, splits, full attempt history. |
| `RepSplits` | Within-trial rep durations. Sequential, one series, direct-labelled. |
| `Logo` | The mark plus wordmark. `currentColor`, capped at cap height. `LogoMark` alone for the sheet. |
| `Icon` | Wayfinding and action glyphs. SVG, never a font glyph. |
| `CameraSelfView` | Mirrored participant self-view. Fills its half of the split. |
| `CameraControls` | Facilitator half: opt-in button, privacy text, unavailable paths. |

### The self-view and the framing preview

Functional, not decorative. A Tier 1 trial **cannot pause**: tracking loss voids it and forces a
restart from the cue with an older adult already out of the chair. Framing has to be right before
the start press, and the participant benefits from seeing themselves the way they would in a video
call.

It is split in two, because the two audiences want different things from the same stream:

| | Where | Audience |
|---|---|---|
| `CameraSelfView` | Participant field | The participant, adjusting their own position |
| `CameraControls` | Facilitator zone | The facilitator: opt-in button, privacy text, status |

**Mirrored.** `transform: scaleX(-1)`. A self-view is the one case where the mirrored image is
correct: the participant is adjusting their own body against it, and unmirrored, leaning left moves
your image right. An earlier revision had a second unmirrored feed for the facilitator on the
argument that mirroring makes "move them left" mean the wrong thing. That argument loses: the
facilitator is standing beside the person and can see them directly, and from the screen they only
need "is the whole person inside the box", which mirroring does not affect.

#### The layout: a fifty-fifty split

The trial screen is **two equal halves**: self-view on the left, full height, like the remote pane
of a video call; readout and everything else on the right.

This **supersedes an earlier corner-pip layout** and the "unambiguously largest element on screen"
rule that went with it. The rule has been narrowed deliberately: the rep count is now required to
be **the largest element in the right half**, not on the whole screen. That is a real change in
what the surface optimises for — presence and self-monitoring during the effort, over absolute
singularity of the number — and it should be understood as a decision rather than a drift.

With no camera, or a denied permission, there is no left half and the readout takes the entire
field. The fallback is exactly the layout this screen has always had.

The split runs at **every stage**, not only once the trial starts. The brief permits the video to
take the full field before the cue, but the cue text has to live somewhere, and a video that fills
the screen and then jumps to half of it relayouts the participant's whole world at the moment they
are being asked to concentrate. Half of a 1280px field is a 640px-wide, full-height pane, which is
larger than the 360px box it replaces, so framing loses nothing by holding still.

**Measured across thirteen viewport sizes** — no horizontal overflow, no clipping, exact 50/50
where split, and `.readout__count` the largest element in the right half at every one:

| Viewport | Layout | Hero | Count width | Half, less padding |
|---|---|---|---|---|
| 1920x1080 | split | 12rem | 501px | 912px |
| 1600x900 | split | 12rem | 501px | 752px |
| 1280x800 | split | 12rem | 501px | 592px |
| 1200x800 | split | 12rem | 501px | 552px |
| 1120x800 | split | 9rem | 375px | 512px |
| 1000x800 | split | 9rem | 375px | 452px |
| 901x800 | split | 9rem | 375px | 403px |
| 900x800 | stacked | 8rem | 334px | 852px |
| 820x1180 (portrait) | stacked | 8rem | 334px | 772px |
| 620x900 | stacked | 6rem | 250px | 572px |

Two breakpoints, both scoped to `.field--split` so the no-camera layout keeps 12rem throughout:

- **1120px.** Halving the field halves the width the hero lives in, so the step-down point moves
  up. `0 / 5` at 12rem measures 501px; half of 1120px less the stage's 48px of padding is 512px,
  the last width where it fits without reflowing. Below that the hero steps to 9rem.
- **900px, or any portrait orientation.** Stack instead of splitting: video above, readout below.
  The readout row takes the larger share (`1.35fr` against `1fr`) because a 50/50 row split would
  not keep the count dominant on a short viewport.

**The participant floor is never approached.** The smallest hero anywhere in the table is 6rem —
96px, three times the 2rem floor — and every other participant-band token is untouched.

#### The honest limitation

The old corner-pip layout was defended with size ratios. That defence is gone: at 50/50 the video
is not subordinate by area, and it never will be again. What remains true is narrower and worth
stating plainly:

- The count is the largest thing in its own half, at every supported size, measured.
- **Area was never salience anyway.** A moving image attracts gaze pre-attentively in a way a
  static numeral does not. That was the limitation of the pip layout too; the split simply makes
  it unmistakable rather than arguable.

Whether a participant mid-effort reads the count or watches themselves is now an open question that
the layout does not settle, and nothing in this file should be read as evidence either way. It
needs testing with real participants and remains the single highest-value thing to learn about this
surface.

#### Invariant 1 is untouched

`useCameraPreview.ts` obtains a `MediaStream` and binds it to a `<video>`. There is no canvas, no
`drawImage`, no `getImageData`, no `ImageCapture`, no `MediaRecorder`, no pose estimation, no
landmark extraction, no frame buffer, no upload, no storage. Verified in the browser: **zero
`<canvas>` elements exist in the DOM while the preview is live.**

Liveness comes from `MediaStreamTrack` events plus `requestVideoFrameCallback` *metadata*
(presented-frame counts and timestamps). Neither exposes pixels. It reports **鏡頭訊號** (camera
signal), not tracking confidence: this build runs no pose estimation, so a confidence figure would
be invented. What it can honestly report is whether frames are still arriving, which is also what
actually predicts the void this preview exists to prevent.

Every unavailable path — permission denied, no camera, insecure origin, no browser support — is
ordinary text at the same weight as the idle copy, because none of them is an error and none stops
the fixture demo working.

### The roster grid

**Rows lay out on a shared grid, not independently.** That is the fix for a real
legibility failure: rows used to be flex lines sizing their own cells, so 已量測
sat at one x in the left column and another in the right, and any row carrying an
extra 已更正 chip pushed its own status and action out of line with every other
row. Flattening the containers had removed the noise but left nothing holding the
eye to a column.

- **Explicit tracks: `id · label · status · modifier · action`.** Everything is
  fixed except the label, which takes the slack. Fixed tracks are what make the
  two halves align to each other rather than each to its own content.
- **Every row emits all five cells, including an empty modifier cell.** That is
  what keeps a corrected row on the same geometry as an uncorrected one.
- **The two halves are separate grids with identical track definitions**, given
  equal width by the wrapper. Measured: one distinct x per track per half, and
  the two halves match to within 0.6px at both 1280 and 1600.
- **Separation is a hairline between rows.** Not a container — the old rule was
  at most one box per row; this is none.

### Roster density

Twelve rows is the whole class, so the roster earns a rule about visual noise:
**one container per row, not two.** Every row used to be a card holding a button
that was itself a card — twenty-four bordered boxes on one screen.

- **Only outstanding rows carry a container.** A measured row needs nothing done
  to it, so it sits plain on the field. The box is a signal, not a default.
- **The row action carries no chrome until it is pointed at.** Full 64px hit
  area, near-zero visual weight: the border, fill and type weight come off, the
  tap target does not. Shrinking a target to reduce weight would trade the wrong
  thing.
- **Hierarchy is identity, then status, then action.** The participant's label is
  the largest thing in the row; the status chip is a size down; the action is the
  same size as the status but in recessive ink, taking the accent only on the
  rows that still need work.

### Roster carries no times

A screen listing ten older adults with their times, in a small shared room, is a leaderboard. The
design doc names this as the most likely route to facilitator veto and a real dignity harm. The
roster shows **status only**: outstanding, done, protocol-invalid, unable. Numbers live on the
result surface (one participant at a time) and on the sheet (which the site lead reads alone).

## Icons

Icons exist for **wayfinding and status scanning**, which helps an older user base and adds a
channel alongside word and shape so colour is never carrying meaning alone.

Two components, and the split is the policy rather than an accident:

| | Answers | Used for |
|---|---|---|
| `Shape` | "what **state** is this in" | Outcome and tracking marks |
| `Icon` | "what **place** is this" / "what will this **do**" | Header surfaces, control verbs |

**Rules:**

- **Every icon answers one of those two questions.** An icon added to make a screen feel friendlier
  is the consumer-fitness failure the anti-references rule out, and does not ship. No celebration
  marks, no encouragement glyphs, no mascots, no progress ornaments.
- **SVG, never font glyphs.** Noto Sans TC has no coverage for arrows, cameras or document marks,
  and an uncovered codepoint renders as a tofu box — worse than no icon, because the user cannot
  tell it is missing rather than broken. Same argument as `Digits` and `Shape`.
- **Never the sole carrier of meaning.** Every icon is `aria-hidden` and sits beside a text label;
  `RailButton` has no icon-only variant, deliberately.
- **`currentColor` throughout**, so an icon inherits the contrast of the text beside it and cannot
  drift below the floor independently.

Three disjoint shape families exist so a facilitator glancing sideways never confuses them:
tracking is circles and a square, outcomes are bars and polygons, camera signal is a stepped meter.

## One band of chrome

The header used to be 80px, with a 42px full-width demo strip beneath it: **123px
of chrome on every surface before any content.** It is now a single 72px band and
content starts at 73px.

What moved:

- **The demo marker folded into the header** as a badge with the sentence behind
  it. See below for why that does not weaken the disclosure.
- **The logo went to one line**, and later lost its placeholder chrome
  entirely: the dashed slot and the 標誌暫定 caption are gone, replaced by the
  real mark at cap height beside the wordmark. See **The mark** below.
- **示範情境 was demoted.** It is a demo affordance, not a product control, so it
  carries no border and no fill and reads as a note. Its 64px hit area is kept:
  quiet is about weight, not about being hard to hit.

### Folding the disclosure did not weaken it

Worth being precise about, because "we made the disclaimer smaller" is exactly
the move this section exists to prevent:

- The badge is **always visible, on every surface, and cannot be dismissed**.
  There is no state in which the product does not say 示範模式.
- The **full sentence is permanently visible, un-collapsed, on the setup
  screen** — the first surface anyone opening the demo URL lands on.
- It is also in the **printed sheet's footer**, which is the artifact that
  actually leaves the building.
- The popover opens on **click or focus, never hover alone**.

So the claim is made in full at the entry point and on paper, and marked
permanently everywhere else.

## Navigation — a path, not a nav bar

This product is a workflow. Six surfaces, and they nest:

```
場次清單 ──┬──► 新增場次
           └──► 本期名單 ──┬──► 王阿姨・量測 ──► 王阿姨・本次量測 ──► 王阿姨・紀錄
                          ├──► 王阿姨・紀錄
                          └──► 報表
```

A row of top-level tabs would misdescribe that: it would imply you can be "in"
the trial surface without a participant, which is not a state that exists. So the
header renders **the actual path to where you are, and every segment of it is a
button.** Two guarantees fall out, and a facilitator can rely on both without
learning anything:

- **Home is always the first segment**, and it always returns to 場次清單.
- **Back is always the segment before the current one** — one level *up*, by
  construction rather than by history. A browser-style back that retraced visits
  would send someone who reached 紀錄 from a finished 量測 back into the trial
  they just completed, which is not up.

Back is *also* duplicated as an explicit ← control at the left of the trail. A
breadcrumb segment reads as location to some people and as a control to others,
and a standing part-time worker should not have to work out which.

**Every segment and the ← are full 64px targets, and the visual weight is
independent of that.** The segments used to carry a real border and fill so that
"tappable" was not something you had to infer. At three segments that inverted
the row's hierarchy: three chunky filled buttons competing with the page title,
when a breadcrumb is navigation and the place you *are* should be the loudest
thing in it. So the fill, the border and half the horizontal padding came off —
`min-height: var(--tap)` holds the floor and is untouched — and the current
segment went to 20px/700 against the segments' 17px/500. Hover and
`:focus-visible` still fill, and the global 3px focus ring is unchanged, so the
affordance is reachable by pointer and keyboard alike; it is just no longer
shouted at rest.

This is the same trade the roster's 查看紀錄 makes, and the rule generalises:
**weight is a separate axis from hit area, and only weight is negotiable.**

A second pass took it further, toward `lalex07/Clinic`'s `.breadcrumb`: links at
`--t-fac-sm` in `--ink-secondary`, separators muted, the current segment in
`--accent` at 700. Two deliberate divergences from that source:

- **The current segment keeps `--t-fac-lg`.** In Clinic the breadcrumb is a strip
  above a separate large `<h1>`; here the current segment *is* the surface's
  `<h1>`, so taking the source's uniform small size would leave every screen
  without a readable heading. Small type is for the links, which are navigation.
- **Separators are `--ink-muted`, not `--line-strong`.** Measured, `--line-strong`
  as text on the header ground is **4.39:1** — under the 4.5 floor. It is
  `aria-hidden` and decorative so WCAG exempts it, but relaxing the audit to let a
  4.39 through is a worse habit than taking the next token up. `--ink-muted` is
  6.55:1 and still reads fainter than the 8.85:1 links beside it, which was the
  whole visual intent.

## The skip link

Ported from `lalex07/Clinic`: absolutely positioned, translated off-screen,
revealed on `:focus` with a visible outline, targeting the main content region.

**The target is a `<main id="main">` wrapper the app shell owns, not an id on each
surface.** Every current and future surface is covered without anyone remembering
to add one — a skip link pointing at nothing is worse than none, because it
reports as present to an audit. `tabIndex={-1}` on the wrapper is what makes
focus actually land there; without it the browser scrolls and focus stays put, so
the next Tab returns to the header.

Two divergences from the source, both because a house rule beats a port:
`border-radius: var(--r)` rather than its `999px` — nothing here is pill-shaped —
and a transition on `var(--dur)`, which collapses to 1 ms under
`prefers-reduced-motion` where the source's hard-coded 0.25 s does not. It carries
the full `--tap` height like every other control: it is the first thing a keyboard
user lands on, and there is no reason for it to be the one target that is hard to
hit.

**Known limit — it does not solve the problem that prompted it.** The stated pain
was tabbing through twelve roster rows to reach the footer actions. A skip link
lands you at the *start* of the main region, which on the roster is the top of
those twelve rows. Fixing that needs a second skip target on the facilitator rail,
which is not built: the rails live inside each surface rather than in the shell,
so unlike `#main` it would not be self-maintaining.

**The current segment is the page's `<h1>`.** That gives exactly one heading per
surface and a well-formed outline — the trial screen had no heading at all before
this, and the setup screen and the sheet each briefly had two.

**The header's phase chip is gone**, and it is not coming back. It read
本期階段：後測 and nothing else, which was adequate while there was one implicit
session and pre-versus-post was the only ambiguity. With several 場次 open on one
device it is not: 據點, 期別 and 階段 all have to be readable together before
anyone presses 開始, and a chip in the end slot beside a demo badge is not where
that belongs. It moved to the session context band below the header — see
**Several 場次 at once** below.

The header still answers only "where am I". The band answers "what am I
recording into". Neither is a control that changes the answer: switching happens
on the session list, and only there.

The rail keeps the primary forward action on each surface, which is what a
standing operator's thumb is already aimed at. **The header is for orientation;
the rail is for doing.**

## Several 場次 at once

A 據點 runs a 後測 for one 期 in the morning and a 前測 for another in the
afternoon, and the machine does not get put away in between. A 場次 is therefore
a first-class entity with a status — 進行中 or 已結束 — and the root surface is a
list of them rather than one implicit current session.

**The whole design serves one failure.** With a single session it was impossible
to record a trial into the wrong place. With several it is not, and the failure
is silent: a trial recorded against the wrong 期 or the wrong 階段 surfaces weeks
later as a wrong number in a 成果報告, with nothing on the printed sheet to
reveal it. Nobody would ever find it. Everything below is a response to that, and
none of it is a warning dialog.

### Nothing is selected for you

The session list selects nothing on load. No "resume the most recent open
session", no "there is only one open session so use it". An app that guessed
right most of the time would be worse than one that is obviously silent, because
the once it guessed wrong would be unfindable. Picking is one tap, and it is the
tap that makes everything after it unambiguous.

The list is **grouped by status** — 進行中 above 已結束 — rather than coloured by
it. The grouping does the scanning work, so the two status marks need no hue and
the product does not have to invent a sixth colour channel. They do get a fourth
disjoint SHAPE family: tracking is circles and a square, outcomes are bars and
polygons, camera signal is a stepped meter, and a 場次 is a bracket — open at one
end or closed at both. A session is an interval of time, so it is drawn as one.

### The session context band

**據點, 期別, 階段 and date, together, at facilitator reading size, on every
surface where a trial can be started or recorded** — roster, trial, result,
participant record and sheet. 56 px, its own surface lightness, directly under
the header.

It replaced the header's read-only phase chip rather than being added beside it,
so this is one band of chrome becoming two and not three. That costs the
participant field 56 px on a surface whose largest element is 192 px, and it buys
knowing which 期 a number lands in. That trade is not close.

**階段 carries the extra weight** inside the band, and inside every session list
row. 前測 and 後測 are the pair that gets confused: they look alike, read alike,
and are the two values a facilitator is most likely to get wrong at three in the
afternoon.

The band is information, never a control. There is no switcher in it. And it is
`no-print`, like every other piece of app chrome — the sheet carries its own
coverage line instead.

### Refusing rather than guessing

The product already refuses in one place: 不可比較 on the sheet, where two trials
cannot honestly be subtracted. The same posture now runs the other direction. A
trial cannot begin unless the active session is **present, resolvable to a 期,
still open, and actually listing the person about to be measured**. `trialGate`
in `src/domain/sessions.ts` returns a reason rather than a boolean, because every
refusal has to be said out loud.

A refusal is a surface, not a disabled button. A greyed-out control tells a
standing part-time worker that something is wrong and nothing about what to do,
and the thing they will do next is press it again. So each one names the reason
in a sentence and offers the one route out. It is not styled as an error either:
`--alert` is reserved for the machine failing, and a refusal is the machine
working correctly.

On a finished 場次 the roster is read-only — one sentence at the top, and no
開始量測 control at all rather than twelve dead ones. Rows that already have a
record keep 查看紀錄, because reading a finished session is what a finished
session is for.

The same guard lives at the data-source seam. A refusal that exists only in a
component is one careless call site away from being gone.

### Switching is deliberate, and visible when it happens

The active session changes in exactly one place: choosing a row on the session
list. Never as a side effect of navigating, never as a consequence of a phase
toggle — that control is gone and stays gone. When it does change, the band
announces it in a `role="status"` line for eight seconds, with an accent rule
under the band. A steady state, not an animation, so `prefers-reduced-motion`
needs no second implementation.

Ending a 場次 and reopening one are both confirmed, and both name the session
they will act on. The end copy states the reversal in the same breath as the
consequence: a facilitator who believes an action cannot be undone will avoid
using it, and unended sessions are how 場次 stop being distinguishable at all.

### One 場次 per (據點, 年度, 期, 階段)

A second 後測 in the same 期 would be exactly the ambiguity this all exists to
remove, so configuring a combination that already has a 場次 resumes it rather
than forking it, and reopens it if it had been ended. That is the right behaviour
and the wrong thing to do silently, so the setup screen says which before the
button is pressed — 開始本場 becomes 接續本場 or 重新開啟並開始 — and preloads
the attendance list from that 場次 rather than from the site's whole book.

### The sheet says what it covers

With several 場次 open on one device, 前後測時間紀錄表 is no longer enough to
identify the paper in front of you: two sheets from the same morning can carry
different 期 and look identical. So the head names the 期, both 階段 with their
dates and attendance, and which 場次 the sheet was produced from.

That line costs the sheet **one row of one-page capacity** — 14 participants down
to 13, measured by rendering to A4 and counting pages, not estimated. A first
draft boxed it and cost two. The minimum funded class is 10.

## Session setup

Reached from the session list, not the entry point any more. Where 據點, 期 (year
+ cycle), phase and today's attendance are configured, plus a camera framing
check before anyone sits down.

**Invariant 2 is enforced by the interface's shape, not by discipline.** The
add-participant form has exactly one text input and it collects a short display
label — verified: one `<input type="text">` on the whole surface. The
pseudonymous id is assigned by the store and shown back to staff after the fact
(`已指定代號 P-0056`); it is never typed. `enrolParticipant(siteId, label)` takes
no other parameter, so there is nowhere a real identifier could be passed even by
mistake. The hint under the field says so in the interface, at the one place in
the product where someone might be tempted.

**Attendance is a count, not a warning.** Below an average of 10 per 期 the site
loses the entire NT$36,000, so the number matters — but it is the 據點's number.
It renders as plain text at ordinary weight beside the threshold it is measured
against: no red, no icon, no "too few" copy, no blocked button, no instruction.
The device reports; the site decides. Compare the 14-second ICOPE threshold,
which this build refuses to apply at all: that one is clinical, so it is absent
entirely rather than merely unstyled.

Enrolment is **site-level and outlives any one 期**, so the picker defaults to the
people already in this 期 rather than to the site's whole book.

## Result — the post-trial surface

Reached the instant a trial settles. **Its only job is this person's time, and
move on.**

The readout is **centred on both axes as one block** — the time, the unit and
the metadata row together. Left-aligned at the top of a tall field it read as a
layout that had not been finished rather than as one that is deliberately quiet,
which is the failure mode austerity has: it looks identical to neglect unless the
composition is doing visible work. Centring the number while the facts stayed
left would have pulled the same block into two, so they share one axis.

Vertical centring uses `justify-content: safe center`, not `margin: auto`: with
`safe`, content taller than the field falls back to start alignment instead of
overflowing past the scroll origin and putting the top of the readout out of
reach on a short window. The measured time prominently, any flag stated plainly, a primary
action that names the next participant, and one quiet link into the full record.

### It shows no history, and that is a dignity constraint

**No attempt history, no voids, no aborts, no corrections.** Not collapsed behind
a disclosure, not in a drawer, not in small type at the bottom. Not at all.

The reason is the room, not the layout. When this screen is up the participant is
still seated in front of it and the rest of the class is in the room looking at
the same monitor. "Third attempt", "voided", "aborted: participant declined",
"corrected from 5 reps to 4" are all true, all necessary to keep, and all nobody
else's business. Putting someone's correction history on a large display in front
of their class is the same harm that keeps times off the roster.

The record is not hidden — it is one tap away on **ParticipantDetail**, which the
facilitator reads at arm's length, one person at a time. Different surface,
different reader, different position in the room.

This was consolidated into ParticipantDetail once and reverted for exactly this
reason. The constraint is restated in `Result.tsx`'s header so it survives the
next round of simplification.

### What it does show

Flags are **descriptive, never evaluative**: 未完成五次 and 手部支撐 say what was
measured and stop. They sit in the **facilitator band rather than at display
size**, because a valid outcome announced at 48px to a seated participant reads
as a verdict even when the words are neutral — the same reasoning that keeps
outcome detail out of the trial screen's locked field.

The time uses `--t-display` rather than `--t-hero`: the participant may glance at
it, but this is not the locked field, and a 192px numeral would compete with the
rail action the facilitator needs next.

The primary action **names the next participant** (`下一位：黃阿姨`) and goes
straight to their cue, because a class of twelve is run by one person and the
next name is the thing they need next. With nobody left it falls back to the
roster.

## Participant detail

Reached from 查看紀錄, and from Result's 查看完整紀錄. One person, this 期, both phases side by side, plus the
full append-only attempt history.

**Two boundaries, and neither may be crossed by anything added here.**

1. **No longitudinal trend.** The design doc's "Explicitly NOT building" list
   names trend charts. This surface shows two assessment points because the 期
   has two, as two blocks — never as a series on a time axis, never with 期
   history alongside. The per-rep splits *inside* each trial are plotted, and
   that is a different object: within-trial detail at 30-second resolution, not a
   trend across months.
2. **No determination.** No 14-second threshold, no pass/fail, no risk band, no
   percentile, no comparison against published norms, no referral suggestion. If
   a `passed` or `band` field ever appears here the product has crossed the line
   it exists to stay behind.

**差值 is not weakened.** Computed only when both trials are protocol-valid *and*
over the same rep count; otherwise 不可比較, with the same wording the sheet's
footer uses. Direction is reported in words — 較前測快 — which is arithmetic.
"Improved", "normal" or "at risk" would be determinations.

**Corrections appear as corrections.** The original outcome stays on screen
beside the corrected one; voids and aborts stay in the history. Nothing on this
surface reads as an edit, because nothing in the log is one.

### Derived statistics

All arithmetic on the recorded times — `domain/stats.ts`. Rep-to-rep slowdown
(第5次 vs 第1次), mean seconds per rep, fastest and slowest rep with their
indices, and the spread as a consistency measure.

**The slowdown is the fatigue signal expressed in TIME.** If someone is fatiguing
within the set the later reps take longer, and that shows up in durations without
a pose model. It is stated as arithmetic — 較第 1 次慢 0.7 秒 — and never as a
judgement about the person.

**Deliberately absent, and must stay absent while this build has no pose
estimation:** peak velocity, mean velocity, velocity loss, and any movement
trace. There is no pose model here, so those numbers would be fabricated — the
same reason the rail reports 鏡頭訊號 rather than a tracking-confidence figure.
They are also Tier 2. `Tier2Panel` names them as planned outputs and shows no
values.

### The pre/post split overlay

Two assessment points on one shared scale, drawn as **two blocks per rep** —
前測 above, 後測 below — rather than as a line across a time axis. There is no
date axis, and a third point could not be added without changing the form, which
is the property that keeps it inside the no-trend rule.

Per the dataviz method, before/after per item is the dumbbell/grouped-bar case,
so it is **one hue in two shades** rather than two categorical hues. Two series
means a legend is required, and each bar is additionally prefixed with its series
word, so identity never rests on colour alone. Values are direct-labelled and a
screen-reader table carries the same numbers.

Scale is the maximum **across both trials** — a shared axis is what makes them
comparable, and it stays strictly internal to this participant's own two
measurements, so no norm is imported.

## The Tier 2 roadmap panel

A **statement of intent, never a preview of data.** The only place in the product
allowed to say peak velocity, mean velocity or velocity loss, and only as planned
outputs of work that does not exist.

- **No numbers, no mock values, no placeholder chart.** Not a greyed-out figure,
  not a dash, not a dimmed sparkline. A fabricated number beside real measured
  times is worse than no number. The planned-outputs list is verified
  numeral-free; digits appear only in the gate prose, where they are the
  pre-registered criteria rather than measurements.
- **Materially different and subordinate**: its own dashed border, no ground
  fill, muted ink, and a 尚未開發 badge on the panel itself.
- **The gate is stated with its actual criteria**, including that an
  indeterminate result counts as failure. A roadmap that omits its own failure
  conditions is marketing, and a pre-registration with a silent middle is not a
  pre-registration.

If a value ever needs to appear there, Tier 2 shipped — at which point it belongs
in a measured block above, not in a roadmap panel.

### The rep-split chart

Form chosen before colour, per the dataviz method: the job is *compare magnitude
across five ordered items, one series*, which is a bar chart with a **sequential
single hue** — not categorical, because the reps are one series rather than five
identities needing to be told apart. One series needs no legend; the title names
it. Values are direct-labelled, so the chart never depends on an axis a reader
has to trace back, and a screen-reader table carries the same numbers.

Marks follow the spec: 12px bars in a 20px slot so the leftover is air rather
than fill, square at the baseline and 4px rounded at the data end, a 2px surface
gap between neighbours, and text in text tokens rather than the series colour.

Bar width is scaled against **the trial's own longest rep**. The comparison is
strictly internal to that measurement; an external scale would be importing a
norm.

#### Bars are non-text marks, and the floor is 3:1

The bars ran at `--accent` — **7.80:1**, the same weight as the primary action —
and were the loudest thing on the participant record. That was a category error:
the text floors (4.5:1 general, 7:1 in the participant field) apply to *text*,
and a bar is a non-text graphical object whose floor is **3:1**. Worse, the
per-rep times are **direct-labelled in text beside every bar**, so the bar is
redundant encoding and the number is the data. A redundant encoding should
support the reading, not dominate it.

Two `--series` tokens now carry the chart, at reduced lightness *and* reduced
chroma — 0.148 → 0.100 — because saturation is most of what reads as loud:

| Mark | Ground | Measured | Floor |
|---|---|---|---|
| Rep-split bar (`--series`) | `--surface-raised` | **3.73:1** | 3:1 |
| Overlay 前測 (`--series`) | `--surface-raised` | **3.73:1** | 3:1 |
| Overlay 後測 (`--series-strong`) | `--surface-raised` | **5.69:1** | 3:1 |
| Any of the above | `--bg`, as the harder case | 3.45 / 3.45 / 5.27 | 3:1 |

**The old 前測 shade was already failing.** `--blue-300` measured **1.87:1** —
below the non-text floor before any of this started. It could not be softened,
only raised, so the pre/post pair is now *compressed toward the middle* rather
than uniformly lightened: 前測 is darker than it was and 後測 is lighter. They
stay one hue at two lightnesses — the correct before/after encoding — separated
by 1.53× in contrast, and each bar still carries its series word, so colour is
never the sole channel.

No ramp step sits usefully near the line: `--blue-400` is 2.75:1 and
`--blue-500` is 4.43:1, and 3:1 falls between them. That is why these are their
own semantic tokens rather than another ramp reference.

Ambiguity at the light end was checked rather than assumed: the shortest bar in
the fixture set renders at 350px against a 432px longest, and the `min-width:
2px` floor only matters for a rep that is a rounding error of the longest, which
the protocol does not produce.

## The mark

```
  ┌ end-stop                              end-stop ┐
  │                                 ╭──────────────│
  │                                ╱               ╵  standing hip height
  │                               ╱
  ╵──────────────╮              ╱
   seated hip    ╰─────────────╯
```

**It is the hip-height trace of one sit-to-stand, dimensioned.** Flat at the
seated height, an S-curve up, flat at the standing height — with a caliper
end-stop at each of the two heights.

**The end-stops are the whole idea, and they are the thing to protect if this is
ever redrawn.** Without them the shape is a curve, and a curve going up and to
the right is a motion swoosh — which puts the product squarely in the consumer
fitness family the anti-references rule out, and claims something about
energy and progress that a measuring instrument has no business claiming. With
them it is a **dimensioned measurement**: two positions, and the distance
between them. That is what this product actually does, and it is the same claim
the printed sheet makes. A swoosh would be the first piece of the interface to
lie.

The two weights are load-bearing in the same way: the trace is `stroke-width: 9`
and the end-stops are `6.5`, because on a dimension drawing the ticks are
thinner than the thing being dimensioned. Equal weights would read as a bracket.

### It is `currentColor`, everywhere, with one exception

No fill anywhere, no literal colour anywhere, in `Logo.tsx`. One drawing serves
accent blue on cream in the app header, **pure black on the printed sheet**, and
reversed on a dark ground if that ever exists. This is not tidiness: it is what
keeps the print rule — every mark on paper measures chroma 0 — true without an
exception, and verified rather than asserted (the sheet mark reads
`stroke: rgb(0,0,0)`, `fill: none`).

The one exception is `public/favicon.svg`, which must carry literal values
because a standalone SVG has no context to inherit: `currentColor` at the root
resolves to the UA's initial text colour, so the mark would be black on every
browser and invisible against a dark tab strip. It carries the token readbacks
(`#004f96` on `#f4f0e6`, reversed under `prefers-color-scheme: dark`) and an
identical copy of the path data. **If the geometry changes, change both files.**

### Size: capped at cap height, in `em`

**The mark never exceeds the cap height of the type it sits beside**, and is
sized in `em` against that type so the relationship survives a change to
`--t-fac` without being re-tuned. Measured, not assumed: Noto Sans TC's cap
height read back through canvas `TextMetrics` at weight 700 is **12.60 px on a
17 px em — a ratio of 0.741**, so the box is `0.74em`. The ink fills about 94%
of the viewBox, so the drawn mark lands just *under* cap height, which is the
correct side of "must not exceed". It sits on the baseline, not centred.

The same rule, the same `0.74em`, applies on the printed sheet against the 18 pt
title — where it also sits inside the title's own line box and therefore costs
the one-page sheet **zero rows** of capacity.

It is an identifier, not a feature. The placeholder it replaced ran 19 px inside
a 30 px dashed slot — half again the height of the word it belongs to, which is
what a provisional marker should look like and not what a real mark should.

### Known limit: the end-stops do not survive the header at 1× density

At the header's 12.6 px cap the end-stop stroke is **0.89 CSS px** and each tick
protrudes about **1.0 px** past the trace edge. On a 1× display that is a single
pixel and the mark reads as a bare S-curve — the swoosh the concept exists to
avoid. At 2× it resolves, and at 24 px and above the end-stops are unambiguous
(verified by rendering at 220/64/24/12.6 px). Recorded rather than fixed,
because the size ceiling is a deliberate constraint and loosening it unilaterally
would trade a stated design rule for a rendering detail. If the appliance turns
out to be a 1× panel, the options are a slightly heavier end-stop weight *at
small sizes only*, or accepting the swoosh reading in the header while the sheet
— where the mark is 17.8 px and prints at 300 dpi — carries the real thing.

## Spacing & radii## Spacing & radii

```css
--s-1: 0.25rem;  --s-2: 0.5rem;   --s-3: 0.75rem;  --s-4: 1rem;
--s-6: 1.5rem;   --s-8: 2rem;     --s-12: 3rem;    --s-16: 4rem;   --s-24: 6rem;

--r-xs: 3px;   /* status marks, chips, hairline insets   */
--r-sm: 6px;   /* inputs, small controls, badges         */
--r:    10px;  /* buttons, roster rows, form options     */
--r-lg: 14px;  /* panels, dialogs, video surfaces        */
--r-xl: 20px;  /* large containers only                  */
```

Rhythm is varied deliberately: the rail is dense (`--s-3`/`--s-4`), the participant field is
extremely sparse (`--s-16`/`--s-24`). The contrast in density is itself the signal that the two
zones belong to different readers.

### The radius scale

The original 2 / 4 / 6px read as machined metal, which suited the dark instrument theme. At twelve
roster rows it also read as twelve hard rectangles stacked, and hard rectangles are tiring to scan.
The scale above is softer without becoming an app.

Rules, so this stays a scale rather than a habit:

- **Every radius comes from the scale.** No ad-hoc values anywhere. If something needs a radius the
  scale does not have, the scale is wrong and gets changed here first.
- **Pick by size of thing, not by feel.** A 20px radius on a 64px control looks inflated; a 6px
  radius on a dialog looks unfinished. The step tracks the element's size.
- **The ceiling is 20px and it is for large containers only.** Nothing is pill-shaped. A fully
  rounded control reads as a consumer app badge, which the anti-references rule out.
- **One exception, and it is geometric rather than stylistic:** the rep pip is `border-radius: 50%`
  because a pip is a circle. It is the only 50% radius in the product.

## z-index scale

```css
--z-base: 0;  --z-rail: 10;  --z-overlay: 20;  --z-scenario: 30;
```

Semantic, never arbitrary. No 999.

## Motion

Functional only. Nothing decorative, per invariant 4 and the product bans.

```css
--dur-fast: 120ms;  --dur: 180ms;  --dur-slow: 260ms;
--ease-out: cubic-bezier(0.22, 1, 0.36, 1);   /* ease-out-quint. no bounce. */
```

Exactly four animations exist, each conveying state:

1. **Pip fill** on rep detection — 120ms. The only feedback the participant gets besides the
   number, and it is what makes the chime legible to a deaf participant.
2. **Number increment** — no transition. A counter that eases is harder to read, not softer.
3. **Zone state change** (idle → live → complete) — 180ms crossfade on the rail only.
4. **Void** — single 260ms flash of the rail, once, not a loop. A looping alarm in a room of ten
   older adults is a dignity problem.

`@media (prefers-reduced-motion: reduce)` collapses all four to instant state swaps. The reveal is
never gated on a transition, so content is visible if animation never fires.

## The print sheet

A first-class surface, not an export. Light theme, own scale.

- **A4 portrait, exactly one page.** Overflow is a bug, and "does it print correctly" is an
  acceptance criterion.
- `@page { size: A4; margin: 14mm; }`
- Type in pt: title 18pt / row primary 13pt / numbers 15pt bold tabular / body 10.5pt / footnote 9pt.
- Black on white. No screen colour survives; no state hue is load-bearing because every state
  already carries a word and a shape.
- Structure: 期 header (site, block, pre/post, date) → per-participant rows with pre, post, and
  change → roster summary → a footer stating what the instrument measured and, honestly, what it
  does not conclude.
- **The footer is a regulatory surface**, not boilerplate. Per the invariant 3 amendment the sheet
  reports a measured time to a human; it never applies the 14-second threshold or states a
  determination. Wording is fixed in the strings module and should not be edited casually.

## Accessibility floor

Restating, because it applies before every rule above:

- Participant-facing: nothing below `2rem`; hero ~`12rem`; contrast ≥7:1 (achieved: 8.19–14.10:1
  on the cream ground, measured through a canvas).
- Colour never alone — colour + word + shape, always.
- Facilitator tap targets ≥64px; no hover-only affordances.
- `prefers-reduced-motion` honoured on all four animations.
- Tabular figures enforced twice (feature setting plus fixed cells).
- Full zh-TW coverage, bundled, no network dependency.
