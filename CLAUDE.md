## gstack (REQUIRED — global install)

**Before doing ANY work, verify gstack is installed:**

```bash
test -d ~/.claude/skills/gstack/bin && echo "GSTACK_OK" || echo "GSTACK_MISSING"
```

If GSTACK_MISSING: STOP. Do not proceed. Tell the user:

> gstack is required for all AI-assisted work in this repo.
> Install it:
> ```bash
> git clone --depth 1 https://github.com/garrytan/gstack.git ~/.claude/skills/gstack
> cd ~/.claude/skills/gstack && ./setup --team
> ```
> Then restart your AI coding tool.

Do not skip skills, ignore gstack errors, or work around missing gstack.

Using gstack skills: After install, skills like /qa, /ship, /review, /investigate,
and /browse are available. Use /browse for all web browsing.
Use ~/.claude/skills/gstack/... for gstack file paths (the global path).

# VeloCare — project rules

A shared, camera-based strength-training coach for community elder-care centres in Taiwan.
A participant does sit-to-stands in front of a device; it counts reps, checks movement
quality, measures how much they slow across a set, and turns that into two decisions: stop
the set now, and change the load next time. One non-specialist staff member supervises a
rotation. No wearable, no app, no smartphone, no account.

## Repository layout

This repo is `velocare/`, nested inside a parent workspace folder. The parent contains
internal strategy documents (`../Proposal .pdf`, `../GoonGPT Hackathon Blurt.pdf`). Read them
for background when useful. **Never copy them into this repo** — they are internal, contain
claims explicitly marked unverified, and this repo is public.

## Hard invariants — never violate, never "improve"

1. **No image data is ever persisted.** Frames are reduced to landmarks and discarded. No
   frame buffer, no canvas readback we retain, no upload, no "just for debugging" recording.
   If a feature seems to need stored video, stop and raise it — the answer is no.
2. **No identity fields.** There is no name, date of birth, or national ID field anywhere in
   any type, schema, form, or fixture. Participants are pseudonymous IDs (`P-0042`) plus a
   short staff-chosen display label. The mapping to a real person lives in the site's paper
   records, off-device.
3. **No clinical output.** The system never diagnoses, screens, assesses risk, categorises,
   or refers. Every output is a training measurement or a training instruction. Use training
   language (train, coach, progress, participant) — never clinical language (diagnose,
   screen, assess, rehabilitate, patient). This is a regulatory boundary, not a style
   preference: it is what keeps the product outside medical-device classification.
4. **Accessibility floor on participant surfaces**, applied before any aesthetic rule:
   nothing under 2rem; primary number ~12rem; contrast >= 7:1; colour never carries meaning
   alone (always paired with a word and a distinct shape); >=64px tap targets on facilitator
   surfaces; no hover-only affordances; honour `prefers-reduced-motion`.
5. **Traditional Chinese (zh-TW) is the default language**, English is the toggle. All copy
   lives in one strings module. Both languages ship complete — English is not a stub. The CJK
   face must have full zh-TW coverage.

## Open decisions — do not silently resolve

- **Load progression mechanism.** Resistance bands (what the current proposal says) vs chair
  height (probably more correct for sit-to-stands, and camera-verifiable). Until this is
  settled, load is an **abstract ordered ladder** and the UI says "step up / hold / step
  down". Do not hardcode band colours.
- **Velocity-intent validity.** Velocity loss only indexes fatigue if participants attempt
  maximal speed each rep. The system cues "stand up fast, sit down slowly", but compliance in
  this population is unproven. Where a session's rep-to-rep velocity is erratic rather than
  monotonically declining, prefer declining to make a recommendation over making a weak one.

## Design tool hierarchy

- **impeccable owns the design system.** `DESIGN.md` and `PRODUCT.md` are the source of
  truth for tokens, typography, and anti-references. Do not run `/design-consultation` — it
  would author a competing system.
- **taste-skill applies at generation time only.** It never overrides `DESIGN.md`.
- **When impeccable and taste conflict, impeccable wins.**
- Variant exploration: `/design-shotgun`. Mockup to markup: `/design-html`.
- Plan-stage design critique: `/plan-design-review`. Built-UI critique: impeccable
  `/audit`, `/critique`, `/polish`. Do not use gstack `/design-review` — impeccable owns that.

## Aesthetic direction

The participant display should look almost austere. That is the correct outcome, not a
failure of ambition — do not let anti-slop rules push it toward visual interest.
Anti-references: consumer fitness apps (rings, streaks, confetti, badges, gamification),
glossy health-tech SaaS (gradient cards, glassmorphism, hero sections), clinical software
(dense grids, tiny type, chart walls).
Tone: dignified. These are adults doing hard physical work — not patients being managed, not
users being engaged. No cheerfulness, no encouragement stickers, no exclamation marks.

## Current scope

Frontend only, driven by fixtures behind a `SessionDataSource` interface. The pose pipeline
implements that same interface later; no UI code may know the difference. No backend, no
accounts, no deployment yet.

## Post-submission backlog

**Documentation only. Do not implement any of this without being asked.** These are decisions
already made, recorded so they are not re-derived — or re-litigated — from scratch later.

A convention borrowed from `lalex07/Clinic`'s CLAUDE.md and worth keeping: **where a rule exists
because something broke, the incident is written into the rule.** A rule with its scar tissue
attached survives; a rule stated as a bare preference gets "simplified" by the next agent who does
not know what it cost.

### 1. Clinical-language lint

Port the mechanism from `lalex07/Clinic`'s §九 compliance check, where a forbidden-word list is
grepped on every commit to enforce Taiwan medical advertising law.

VeloCare has the same class of constraint and **enforces it with nothing but memory.** Invariant 3's
ban on clinical language is not a style preference — it is the basis of the medical-device position,
and a single 評估 that slips into the printed sheet is a regulatory problem rather than a typo.

Word list: 診斷, 篩檢, 判讀, 評估, 風險, 轉介, 病人, 患者, plus the English equivalents — diagnose,
screen, assess, risk, refer, patient. Grepped over `src/i18n/strings.ts`, the printed-sheet copy,
`README.md` and `DESIGN.md`.

Note when building it: several of these words legitimately appear in those files *inside prose
explaining why the product does not do the thing*. The check needs an allowlist mechanism or it
will cry wolf on its first run and be disabled by the second.

### 2. Package the verification harness as a skill

The checks currently re-typed by hand every round: contrast through canvas, print height against A4,
the 64px tap-target floor, the twelve-row roster test, one `<h1>` per surface, and bar-to-ground
≥3:1 for non-text graphics.

**Write both known traps into it, because both were defects in the measuring tool rather than in the
thing being measured — and both produced confident, wrong numbers:**

- `getComputedStyle` returns `oklch()` verbatim under CSS Color 4. String-parsing it silently
  reports **1.00:1 for everything**. Colours must be resolved through a canvas.
- Painting an opaque backdrop under a swatch before sampling makes every transparent background
  resolve to that backdrop. This reported **dark ink on cream at 1.31:1** — the audit ran green for
  a full round on numbers that were nonsense. A ratio that absurd is a broken instrument, not a
  broken palette; treat implausible results as a tooling bug first.

Add a third, learned on the print pass: **A4 capacity must be measured by rendering to PDF and
counting pages, not estimated from a content height.** The estimate was out by two rows in both
directions, and it let a layout change ship as "5.7 mm of headroom" when it had actually cost two
rows of one-page capacity.

### 3. Multi-agent rules

Adapted from the same repo:

- **Two agents never edit the same file.** Last-write-wins loses changes silently — there is no
  conflict, no error, and nothing in the diff to show that something was overwritten.
- **One agent commits per batch.**
- **Edits to shared chrome serialize into a single agent** — `tokens.css`, the strings module, the
  print stylesheet. These are touched by nearly every task and are where concurrent edits collide.

Learned the hard way: this project has already paid for this once. Roughly **3,500 lines were built
on another branch against a superseded plan** and had to be thrown away.

### 4. Design items from `lalex07/Clinic` worth taking later

- **CJK measure discipline as a system rule rather than per-component.** Headings capped around
  22ch, body around 40–45 CJK characters. The audit flagged `.t2__body` at roughly 50. `ch` is sized
  on the "0" advance, so CJK fits about 1.8 characters per `ch` — a `max-width` in `ch` does not mean
  what it appears to mean here, which is how that one drifted.
- **A single `--ease` motion token** instead of ad-hoc curves across the four functional animations.
- **If participant search is ever added, build it as a click-to-open overlay, not an inline header
  field.** Learned the hard way, twice: Clinic hit this when an inline header search box overflowed
  its nav onto a second line, and VeloCare's header has been over-crowded in three separate rounds
  — the demo strip, the phase chip, and the scenario toggle each had to be folded, moved or demoted.
  The header has no room. Do not re-learn this.

### 5. Explicitly do NOT port from that repo

Its hand-rolled focus trap (VeloCare's native `<dialog>` + `showModal()` is stronger and comes with
Esc and focus restoration for free), the `body::before` grain overlay, `.reveal` scroll animations,
the photo-zone system, card lift-on-hover, serif headings, the apricot accent.

**The visual language there is a patient-facing marketing site**, and it matches `PRODUCT.md`'s
anti-references almost line for line. Two things have already been taken from it — the skip link and
the breadcrumb weight — and both needed adapting rather than copying: its skip link is pill-shaped,
which the radius scale forbids, and its transition is hard-coded rather than running on a token that
collapses under `prefers-reduced-motion`. Assume anything else from that repo needs the same
treatment.
