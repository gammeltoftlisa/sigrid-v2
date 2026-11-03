---
name: button-hierarchy
description: Use whenever adding or changing buttons, links styled as buttons, dialog actions or empty-state actions in Sigrid. Decides which action is primary (the one filled black button), secondary (outline) or tertiary (ghost), how destructive actions look, and how buttons are ordered, so every screen has one clear thing to do.
---

# Button hierarchy

Every view has **at most one primary action**: the single thing the person most likely came to do. Everything else
steps down. Based on Material Design 3 (filled / outlined / text), Apple's Human Interface Guidelines (one prominent
button per view) and Nielsen Norman Group's guidance on primary and secondary actions.

## The levels

| Level | Variant | Use for | Examples in Sigrid |
| --- | --- | --- | --- |
| Primary | `default` (black, stitched) | The one main action of the view | Start sewing / Continue sewing, Mark done, Continue (onboarding), Go to payment, New pattern, Publish |
| Secondary | `outline` | Real alternatives and supporting actions | Print, Settings, View pattern, Pattern studio, a second project's Continue |
| Tertiary | `ghost` | Low-stakes, reversible, or "not now" | Skip for now, Clear filters, See all, Use another photo, Cancel in a toolbar |
| Destructive | `destructive` (quiet red outline) | Deleting or ending something | Delete my sewing, Delete my account |

## Rules

1. **One primary per view.** A page, a dialog, a sheet and a drawer are each a view, so a dialog may have its own
   primary even when the page under it has one. Count what's visible at once: a phone action bar and a desktop
   panel footer that show the same button at different widths count as one.
2. **Pick the primary by intent, not by importance to us.** Home: pick up the most recent project. A pattern: start
   or continue sewing (or buy). The guide: mark this step done. Onboarding: continue. Browsing pages (Explore, Shop),
   reading pages (legal) and settings have **no** primary: there is no single next step.
3. **When two things compete, the second becomes secondary.** Two empty states on one page (a maker's You): the one
   that matters to this person keeps the primary (New pattern); the other drops to outline. Several equal choices
   (checking out at several shops) are all secondary; with only one, it's primary.
4. **Never the same action twice.** If the main button already does it, don't repeat it elsewhere on the view.
5. **Destructive is never primary on a page.** It's a quiet red outline. Only the final confirm inside a
   "Delete …?" dialog is red-filled (`AlertDialogAction variant="destructive"`), next to a safe Cancel.
6. **Order:** in a row, the primary goes last (rightmost), secondary before it, tertiary first. Stacked on phones,
   the primary goes on top and spans the width. Cancel never sits where the primary usually is.
7. **Size follows weight:** the primary is `size="lg"` in pages, dialogs and bars; secondary and tertiary match its
   height when they sit beside it, and are smaller (`sm`) when they sit inside rows and cards.
8. **Disabled primaries say why** (a line under, or the label: "Choose a size to continue").
9. **Error and empty states** follow the same rule: their one way forward is primary when nothing else on the view
   is; otherwise it's outline.

## Before finishing a screen

- Count the filled black buttons visible at once. More than one: demote all but the most likely next step.
- None, on a task screen (not browsing, reading or settings): something should probably be primary.
- Check each dialog and sheet separately, and the phone and desktop layouts separately.
