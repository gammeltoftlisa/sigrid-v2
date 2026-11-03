# DESIGN.md: UI rules for Sigrid

These rules are **mandatory** for anyone building UI in this repo, people and AI agents alike.
The visual reference is the Storybook in the `sewing-app` repo (`npm run storybook`, http://localhost:6006), which documents the components in this repo. Its Screens are this app's real pages, copied by the sync script.

Where things live here: tokens and the brand layer in `app/globals.css`, shadcn components in `components/ui/`, patterns in `components/patterns/`, imagery in `components/garment/`.
The sewing guide (`components/sewing/`, `components/legacy/`) is older code; don't use `components/legacy` in new code.

> **Logo: a polished metal needle bent into an S.** It's a photo with a transparent background and a see-through eye (`public/brand/needle.png`), so it never takes the text colour. `NeedleMark` on its own in the rail, `Wordmark` (the needle as the S of Sigrid) elsewhere. At text size and in the browser icon it uses `needle-small.png`, a sturdier cut, because the real needle's line nearly vanishes when small.
>
> **Brand: liquid glass, warm editorial atelier.** Built on the `liquid-glass-frontend` skill (`.claude/skills/liquid-glass-frontend`, read its `references/` before UI work).
> Real Apple-style frosted glass over a calm page: a cutting mat as the floor, seen from low down looking towards the top right, on a stipple of tiny dots (`Atmosphere`), in black, white and beige. A characterful serif (Fraunces) does the talking, with italic accents and small mono kickers.
> **Signature moment:** the big Fraunces page title with its italic ink line. Calm copy, confident type. Nothing animates on arrival.

## 0. Workflow

1. **Storybook first.** Before building a screen, look for an existing component or pattern in Storybook.
2. **Missing piece?** Add it as a pattern (or `npx shadcn@latest add <name>` for a shadcn component), then a story for it in the Storybook.
3. **Compose, don't restyle.** Screens are built from `components/ui/*` and `components/patterns/*`. If a page needs a long one-off `className`, it belongs in a pattern.
4. **Check phone and laptop, light and dark.** Every story must look right at 375px and on a laptop in both themes, with no violations in the Accessibility panel.
5. **Don't restyle `components/ui/`.** Those are shadcn source files; the brand layer in the global CSS styles them. Bug fixes are fine.
6. **Keep the Storybook in step.** After changing components, run `node scripts/sync-from-app.mjs <path to sigrid-v2>` in the `sewing-app` repo, then update the stories.

## 1. Stack

| Thing | Use | Never |
| --- | --- | --- |
| Styling | Tailwind CSS v4 utilities and the tokens below | CSS modules, inline `style` for colours or spacing, arbitrary values (`text-[…]`, `w-[…]`, `#hex`) |
| Components | shadcn/ui (`base-nova`, Base UI primitives) | Other component libraries |
| Patterns | `components/patterns/` | Rebuilding a pattern inline in a page |
| Icons | `@tabler/icons-react` | Emoji, other icon sets, inline SVG copies |
| Class merging | `cn` from `"cn"` | String concatenation |
| Fonts | Fraunces for display (`font-heading`, every `h1`/`h2`), Be Vietnam Pro for text (`font-sans`), JetBrains Mono for kickers and badges (`font-mono`) | Inter, Roboto, system-ui as the character face; any other font |
| Motion | `motion` (`motion/react`) | `framer-motion` imports |

Base UI note: triggers compose with `render={<Button … />}`, **not** `asChild`. A `Button` rendered as a link needs `nativeButton={false}`.

## 2. Colour

**One source of truth:** three RGB triplets in `:root`. There is no brand colour for now, only black, white and beige: `--tri-primary` ink `#211C16` (bone on dark), `--tri-primary-soft` beige `#B0A694`, `--tri-accent` beige `#C4BAA8`, on obsidian `#15110D` and ivory `#EFEADE`. Main buttons are black (light in dark mode). Status colours stay functional. Every tint is `rgb(var(--tri-primary) / 0.x)`. Re-skin by editing those three lines.

Themes: `next-themes` sets `<html data-theme="light|dark">` (system by default, switch in You → Settings → Appearance). The brand stays the same; only the `--app-*` surface tokens and `--aura` change. shadcn names point at them, so components never know the theme.

| Token | Light / dark | Use |
| --- | --- | --- |
| `--app-bg` → `background` | `#EFEADE` / `#15110D` | The page, under the atmosphere |
| `--app-panel` | `#FFFFFF` / `#1C1C1C` | Solid surfaces; neutral, only the page is warm |
| `--glass-fill` / `-blur` / `-border` / `-edge` / `-inset` | white at 62% (dark gray at 62% on dark), a 20px blur, a dashed stroke, a top sheen with a soft lift; `-inset` transparent | Every glass surface, one material |
| `--app-elev` | `#FFFFFF` / `#2B2B2B` | Solid fills, such as a focused field |
| `card` → `--glass-inset` | see above | Insets: what sits on glass |
| `--app-text` → `foreground` | `#211C16` / `#F0ECE1` | Text |
| `--app-text-soft` → `muted-foreground` | `#6B6052` / `#A79C8C` | Secondary text (AA on every surface) |
| `--app-border` / `-strong` | ink or bone at 10% / 20% | Hairlines on glass, field and button edges |
| `primary`, `brand`, `ring` | ink (bone or beige on dark) | Progress, chosen states, focus on fields |
| `--accent-ink` | ink / beige | Italic headline accents, kickers |
| `success` / `destructive` / `warning` / `info` | deep tone for text, `-solid` for the accent; lighter tones in dark | State only, with text or an icon (`StatusBadge`, `StatusMessage`) |
| `data-1` … `data-4` | one neutral hue, light → dark (reversed in dark) | Charts and the heatmap |

- Only token utilities (`bg-card`, `text-muted-foreground`, `bg-data-2`). Never `bg-white`, `text-black` or hex in components; the print sheet is the one exception.
- **One primary action per screen or dialog.**
- New tokens go in `:root` **and** `:root[data-theme="dark"]`, and must pass AA in both.

## 3. Surfaces: liquid glass

**Everything sits in a container, never on the background.** Only titles, body text, buttons and button groups may sit directly on the page.

**Products and reading have their own container.** A product (photo plus text) always sits in `ProductGrid`: a solid fill a little lighter than the page (`--product-fill`) with the page's dots. A page shares one container for all its products, with a stroke between them instead of a box around each. The same goes for products in a labelled section (`ProductGrid label="…"`). Never put products directly on the background or in a glass `Panel`. A single large photo uses `ProductFrame`.

**Glass is only for things you act on:** buttons, button groups, fields, the rail and tab bar, menus, dialogs, and panels of controls (`<Panel glass>`, such as Browse in Find fabric, the guide's step list and Profile's `SettingsList`). Products and anything you only read use the solid container: `ProductGrid`, or `Panel` without `glass`, such as dashboard stats and step instructions.

Glass is **one material, whatever its size and whatever is behind it**: white and clearly there, so it reads over the page and over photos alike. Five tokens are the whole material: `--glass-fill` (62% white), `--glass-blur` (20px), `--glass-border` (a dashed stroke), `--glass-edge` (a 1px top sheen and a soft lift). Every glass surface (panels, cards, bars, the shop bar, sheets, dialogs, the guide sheet, Clerk's cards, menus, dropdowns, selects, popovers, toasts, tooltips, chips on photos, glass buttons and fields) uses exactly these, from one rule in `globals.css`; nothing sets its own fill, blur, border or shadow. Whatever sits inside glass adds no fill of its own (`--glass-inset`), so it looks the same there as on the page. Only the page is warm: no cream tints on glass and no `saturate()`. Behind a modal (dialog, sheet, drawer, the guide, Clerk's window) the page is washed in its own colour and heavily blurred (`--overlay-fill`, `--overlay-blur`), never darkened, so nothing can be read through it. `Atmosphere` (in the root layout) draws the mat and a stipple of tiny dots behind every screen. No drifting blobs, no moving fades.

| Material | What | How |
| --- | --- | --- |
| Surface | panels, cards, alerts, the segmented control | `Panel`, `glass-panel`, `glass-surface`; automatic on `Card` and `Alert` |
| Soft | floating bars: rail, tab bar, `ActionBar`; sheets and dialogs. The same glass as panels | `glass` / `glass-surface-soft`; automatic on sheets and dialogs |
| Floating (the same glass) | dropdowns, selects, popovers, toasts, tooltips, chips on photos | automatic; `glass-menu` for custom popovers |
| Inset (no blur) | everything **inside** glass: rows, fields, chips, buttons, tiles | `PanelRow`, `Inset`, `DetailList`; fields and buttons turn inset automatically |
| Glass pill | primary and outline buttons on the page | automatic on `Button` |

- **Never animate `opacity`, `filter` or `mask` on glass or on anything that contains it, even with a fill-forwards animation that has ended.** The browser then cuts the glass off from the page: its computed styles look right, but there is nothing behind it to blur.
- **Never nest `backdrop-filter`.** Inside glass, use the inset (tint + sheen). The global CSS does this for shadcn parts.
- **No `mix-blend-mode` anywhere, including on `::before`/`::after` and in shadcn parts.** One blended element on screen stops every glass surface from blurring, even a tiny avatar border, so glass changes as you scroll. Texture goes inside `Atmosphere`, behind the content.
- Light and dark use the same glass recipe; only the tokens differ.
- Popovers render in portals at the root (Base UI does this), so `backdrop-filter` stacking contexts never trap them.
- Product photos and reading text are never glass. Labels on photos use `PhotoLabel`.
- Reduced transparency turns glass solid and hides the atmosphere.

## 4. Shape

| Token | Value | Use |
| --- | --- | --- |
| `rounded-(--radius)` | 22px | Panels, cards, sheets |
| `rounded-(--field-radius)` | 22px | Fields and dropdowns: a full pill when one line tall, the same curve when taller |
| `rounded-(--control-radius)` | 14px | White rows, `Inset`, size tiles |
| `rounded-full` | | Every button (pills), badges, avatars, chips on photos, icon bubbles, the tab bar and every navigation item (rest, hover and current) |
| `rounded-(--image-radius)` | 16px | Photos |
| `rounded-pane` / `rounded-pane-lg` | 22 / 28px | The floating rail, the action bar, the completion dialog |
| `rounded-xs` | 4px | Heatmap cells, tiny marks |

Image shapes: `aspect-product` (4:5, product tiles), `aspect-cover` (4:3, project cards), `aspect-wide` (2:1, maker covers).

## 5. Type and spacing (the rhythm)

**Typography is the design.** Big, characterful and mixed: a roman line, then an italic ink line.

| Level | Class | Look | Use |
| --- | --- | --- | --- |
| Page title | `h1` | `clamp(2.75rem, 6.2vw, 5.75rem)`, Fraunces 360 | One per screen |
| Compact page title | `h1.title-compact` | `clamp(2.25rem, 3.4vw, 3.5rem)`, Fraunces 360 | The title shares the screen: garment, maker, a message page |
| Section | `page-section-title` | 26–36px Fraunces 400 | Sections of a page (`PageSection`) |
| Big moment | `title-xl` | 34px Fraunces 400 | A celebration, a stat |
| Main subject | `title-lg` | 28px Fraunces 400 | The one thing a panel is about: the current step, a plan's price |
| Subject | `title-md` | 22px Fraunces 400 | What a block is about: a project, a maker, a legal section, a garment's price |
| Small subject | `title-sm` | 19px Fraunces 400 | Product names, dialog and empty-state titles (automatic on those) |
| Lead | `text-base` | 17px, 400 | Under a title, reading text |
| Body | `text-sm` | 15px, 400 | Default text, buttons (500), fields, menus, breadcrumbs |
| Detail | `text-xs` | 13px, 400 | Meta, captions, small buttons and chips (500) |
| Tiny mark | `text-2xs` | 12px, 500 or 400 | Counters, step numbers, tab bar labels |
| Label | `eyebrow`, `kicker` | 11px mono 500, 0.22em, uppercase | Panel labels, badges, every small uppercase label |

Text is 400, or 500 for emphasis. **Never 600 or 700, and never a size that isn't in this table.** Don't reach for `text-xl` or `font-heading` directly: use the level.

Put the line that carries the feeling in `<em className="display-italic">` (italic, WONK axis, ink). Body is Be Vietnam Pro 400, emphasis 500. `tabular-nums` on measurements, counts and prices. Reading text is `max-w-prose`.

| Space | Use |
| --- | --- |
| 4px (`gap-1`) | Lines inside one item: name → meta → price |
| 8px (`gap-2`) | Related items: rows in a panel, chips, tiles in a stat grid |
| 12px (`gap-3`) | Image → text, label → control |
| 16px (`p-4`, `gap-4`) | Inside a component: container padding, settings groups, section title → content |
| 12px × 16px (`container-head`) | A container's label row: `Panel` and `ProductGrid` headers are the same height |
| 12px (`gap-3`, `--grid-gutter`) | Between containers on the background, in every direction |
| 24 / 32px (`--page-top`) | Top of every page, above its title or breadcrumbs (built into `PageContainer`) |
| 24 / 32px (`--title-gap`) | Page title → first container (built into `PageHeader`) |
| 40 / 48px (`--section-gap`) | Before a titled `PageSection` further down a page |
| 32 / 48px (`--page-bottom`) | Below the last container |

Phones / from `md`. **Pages never add their own top padding or margins between blocks** (no `pt-3` on a header, no `mt-…` between containers): the tokens in `globals.css` do it, so every page starts and breathes the same way.

Half steps (`px-2.5`, `py-1.5`) are only for padding inside small controls and pills. Never between things.

**No drop shadows anywhere.** Containers, buttons, menus and controls are flat: they're told apart by their dashed edges and fills, never by a shadow or glow. Only the 1px top highlight on glass stays. Tailwind's `shadow-*` utilities are cancelled globally.

### Page titles

| Kind of page | Its heading | Example |
| --- | --- | --- |
| A main tab | The place, as a big `PageHeader` title | Your sewing |
| A browsing tab | No visible title: the sticky search bar is the header (`ShopLayout`), with everything that narrows what you see in it | Explore, Shop |
| Your own profile | **Your name**, in your card; no page title. The tab already says where you are | You |
| A thing | **Its own name**, with breadcrumbs above | Cap-Sleeve Button Top, Mia Johansson |
| A sub-page | Its name, with a breadcrumb back | Settings, Pattern studio |

Every page also names itself in the browser tab, then Sigrid: "Explore · Sigrid" (the root layout's template). Client pages get theirs from a small `layout.tsx` beside them; patterns and makers use their own name.

### Browsing: Explore and Shop

Both use `ShopLayout`: one glass bar, 8px from the top like the rail, that stays while the products scroll under it to the screen's edges. Everything that changes what you see is in that bar, at one 40px height: Explore's Patterns / Makers switch (`lead`), the search, and the dropdowns (Explore) or the bag (Shop). On phones the dropdowns move into a Filters sheet behind a button in the bar, and anything that doesn't fit sits just under it.

### The sewing guide

Like a recipe app's cook mode: **one step at a time, everything about it in one place, the overview on demand.**

- **The step card** (`StepCard`, the narrow column; under the picture on phones) holds everything about the step on screen, top to bottom: where you are (stage, "Step 7 of 24", a progress line cut into stages), the action, the title, the instruction in reading size, the measurement and tool as stitched labels, the tip (always shown, never behind a tap), what comes next, then ‹ **Mark done** ›. The card fills its column so the buttons sit in the same place on every step.
- **The picture** gets the rest of the screen.
- **All steps** (top bar) opens the whole guide in a sheet (`StepsList`): stages fold open to their steps, "Now" marks where you are, picking one shows it and closes the sheet.
- **The studio writes the same screen.** The guide editor (`/studio/[id]/guide`, `StudioGuide`) is this screen with the text typed in place: the same top line (All steps, the size, the pattern pieces), the same step card (its title, instruction, measurement, tool and tip are write-in-place fields) and the same framed picture. The middle button is **Add step** instead of Mark done. All steps opens the whole guide in a sheet, where steps and sections are added, renamed, dragged and deleted, and the pattern pieces are measured in the card. Likewise the studio's pattern page is the garment page with its content editable.
- **Viewing is never doing.** Looking at another step labels it "Done" or "Still to come", and the main button becomes "Back to step N". Only Mark done moves progress, and the progress line never shows the step you're looking at.

### Checkout

Buying a pattern opens its own checkout page (`/garment/[id]/checkout`), not Stripe's. The page is Sigrid's, and the card fields inside it are Stripe's (Checkout Elements, `CheckoutForm`), so the card goes straight to Stripe. They're drawn with the field tokens (fully rounded, dashed at rest, a crisp ink edge while typing) and follow light and dark.

- **Your order** (solid `Panel`): the photo, name and maker, what's included, the total. Beside the payment from md and sticky; first and short on phones.
- **Payment** (glass `Panel`): card first, one method open at a time. Then the right-to-cancel waiver as a checkbox, then **Pay €12** with a lock, the one primary. A line under it says why it's disabled ("Tick the box above to pay", "Fill in your payment details to pay"), then where the receipt goes.
- **Trust, said once and plainly**: "Encrypted" in the panel's header and one line at the bottom: the card goes straight to Stripe and never reaches Sigrid. No badges, no seals.
- **Cards, Apple Pay and Google Pay only**, through one named Stripe setup ("Sigrid checkout", made by `paymentMethodSetup` in `lib/stripe.ts`). No Link form, no bank redirects. The account's own defaults are left alone.
- **VAT**: the total says "including VAT" only once a real VAT number is in `lib/legal.ts` (`pricesIncludeVat`). Until then it claims nothing.
- A declined card shows Stripe's reason in a `StatusMessage` above Pay; nothing is charged. After paying, the pattern page confirms with Stripe and opens the size choice.

### Button hierarchy

**One primary per view** (the filled black button): the one thing the person most likely came to do. Secondary is `outline`, tertiary `ghost`, destructive a quiet red outline (red-filled only as the final confirm in a delete dialog). A dialog or sheet is its own view. Browsing, reading and settings pages have no primary. The full rules, with examples, are in `.claude/skills/button-hierarchy`.

### Search

Both browsing searches are `SearchSuggest`, a combobox like a store's: from the first letter, a container opens under the field with what matches, grouped, each row with a picture and the typed letters in medium weight. Explore suggests patterns and makers (straight from the page's data); the Shop suggests categories (at once) and products (from `/api/shop`, after a 180ms pause, within the category you're in). Clicking a row opens it (products open the shop's page in a new tab, like their cards). Enter, or the pinned **See all results** row, searches everything; arrows move, Escape closes. The container is placed at the end of the page, outside the bar, because glass inside glass can't blur. A failed lookup says so with **Try again**.

### Pop-ups

Dialogs, confirmations, sheets and phone drawers all read the same way: 16px padding, the title and description left-aligned at the top, actions at the bottom. Choices that fit on one row stay on one row (up to five sizes).

### Motion in the navigation

The rail's and tab bar's current-page marker is one round stitched bubble, the same shape as the hover under it and the avatar, that glides between destinations (including the avatar for You) on a soft spring with a little give (`bounce: 0.22`, 0.5s). It glides across page frames too, through the app-wide `LayoutGroup` in `MotionProvider`. Links ease their hover in, lift the icon 1px on hover, and give way slightly when pressed. All of it switches off with reduced motion.

### Errors

Every failure says **what happened**, **why** (usually a connection problem) and **what's safe** ("nothing was charged", "your bag is safe"). When something can be done about it, the message carries the button that does it: a `StatusMessage` with an action where content didn't load, or a toast with `action: { label, onClick }` after something you did. "Please try again" without a button is never enough.

| Failure | What people see |
| --- | --- |
| Content didn't load (shop, fabric, your patterns, a guide, more products) | `StatusMessage` or empty state in its place, with **Try again** |
| An action failed (checkout, deleting data, account type, a photo) | Toast saying what didn't change, with **Try again** or **Choose another** |
| Couldn't check which patterns you own | **Check again** instead of Buy, so nobody buys a pattern twice |
| A payment couldn't be confirmed | Toast that stays until dismissed, with **Check again** |
| A link to a pattern, maker or page that doesn't exist | `NotFoundMessage`: what's missing, why, and a way on. Never something else in its place |
| Offline | One toast that stays until you're back online; sewing saves on the device and syncs by itself |
| Nothing can be done (device storage full, browser won't save) | An explanation of what wasn't saved and why, with no button |
| A page crashes | `app/error.tsx`: **Try again** and **Go home** |

## 6. Controls

| Control | Height | Notes |
| --- | --- | --- |
| Fields and dropdowns | 36px (44px on touch), 32px small (40px on touch) | 15px text, 14px side padding, fully rounded, 16px muted icons |
| Button | 40px | `size="lg"` (44px) for the one main action |
| Small button and chips | 32px (40px on touch) | `size="sm"`; filter chips, removable filters, the bag |
| Icon button | 36–44px | `size="icon-lg"` in bars, always with `aria-label` |

- **Every control that isn't the black primary button has the same three states** (`--control-rest`, `--control-hover`, `--control-active` in `globals.css`): frosted at rest, a bit lighter on hover, lighter still when chosen. **Stitches: one line at rest, two on hover or when chosen, never three.** The first line is the button's dashed edge; hover and chosen add one running stitch just inside it (lighter thread on hover, firmer when chosen). Never a solid ring. The black primary button follows the same rule. Chosen means pressed, selected or current; it is a stronger hover, never ink or a colour, and stays chosen under the pointer. This covers outline, secondary and ghost buttons, chips and size tiles, the segmented control, shop category bubbles, the nav's current tab, guide steps, menu rows and the studio's toggles. A hand-built control gets it with `data-control`.
- Labels: 13px medium, 8px above the field. Every field has a visible label; placeholders are examples.
- Fields have three looks: frosted at rest, whiter with a darker stitch on hover, solid white with a crisp 1px ink edge while typing or open. **Never a ring around a field.** A problem is a 1px solid red edge plus text under the field.
- A dropdown is full width unless a row of controls needs a set size (`w-40`), and its open list is always exactly as wide as the field, including popover dropdowns (`w-(--anchor-width)`). Long options wrap and are never cut off. Lists scroll after about 8 rows, stopping mid-row so you can see there is more.
- Inside a list: 4px padding, 32px rows, and the row you're on is a fully rounded pill in the hover glass (`--control-hover`); the chosen row is `--control-active`, by mouse or keyboard. The chosen row has a check and medium text. The list's text lines up with the field's. Hand-built choices in a popover use `.menu-option` for the same pill.
- The slider is a 2px ink track with small glass handles; it can always be typed into as well.
- Touch targets are at least 44×44px on phones.

## 7. Layout

- **Mobile first** (375px). Screens use `PageContainer` and `PageHeader` inside `AppShell`.
- **Vary the treatment.** Siblings don't all share one shape: a product grid leads with a `GarmentCard lead` (twice as wide and tall, with its description), and adjacent sections use different patterns.
- **Navigation**: from `md`, a floating glass icon rail (`AppSidebar`); on phones, a floating glass tab bar (`AppTabBar`). Pages leave room with `pb-tabbar`. The phone's main action goes in an `ActionBar` above the tab bar.
- **12-column grid**: one grid, one gutter (16px on phones, 24px from `md`). Never one-off `grid-cols-[…]`.
  - `grid-12` is the page grid. `col-side` (4 columns on `lg`, 3 from `xl`, sticky 8px from the top like the rail) and `col-main` (the rest) make the two-column workspace.
  - `tiles` is every grid of cards with images, and there is one rule for how many fit a row. The count follows the width of the container, never the screen or the page: **under 720px 2, 720–959px 3, 960–1199px 4, 1200px and up 5.** Pages never set their own count. Cards that don't fit go to the next row, every row is the same height, and a short last row leaves its spots empty.
  - `tiles-wide` is for bigger cards without images, such as plans: 1, then 2, then 3 per row.
- **Top line**: `PageHeader` (or `TopBar`) shows back, breadcrumbs and quick actions as plain text on the page, no container.
- **Side sheets**: `PanelSheet` (full width on phones, 448px from `sm`).
- **Show only what's needed.** Fewer panels, fewer words, one main action.

## 8. Which component to use

| Need | Use |
| --- | --- |
| A page title | `PageHeader` (optional `kicker`) |
| The pattern studio's list | Your patterns as `GarmentCard`s in a `ProductGrid`, tagged Draft or Published; delete is on the pattern's own page |
| Main / secondary / quiet action | `Button` (black, stitched) / `variant="outline"` (frosted pill) / `variant="ghost"` |
| Delete or reset | `Button variant="destructive"` (outlined text) + `AlertDialog` that says what will be lost |
| Icon-only action | `Button size="icon-lg"` + `aria-label` |
| Text input | `Field` > `FieldLabel` + `Input` |
| Choose one of 6+ | `Select` |
| A setting / an agreement | `Switch` / `Checkbox` |
| Filter by category | `CategoryTabs` |
| The way into the store | `ShopHome`: **never filters on the way in.** Under the bar and the category bubbles, each category is its own row: its name, a "Show all" button with the count, and up to 12 products in a `ProductGrid` that scrolls sideways (`.tiles-row`, the same cards per row as `tiles`), ending in another "Show all". You reach the filter panel by going into a category or searching. |
| Chosen filters | `FilterTags`, above the products on the right: a removable tag per chosen filter (colours with their dot), plus "Clear all" when there are two or more. Colour dots have no stroke; white and cream get a soft shadow so they still show on white. |
| The store, inside a category or a search | `ShopBrowse` in a `ShopLayout`: the page fits the screen and the products scroll inside their container, never the page. No "Shop" title. A bar at the top holds search and the bag, and is the only thing that always stays, with the filter panel staying in view beside the products. Under the bar, category bubbles with icons (`category-icons.ts`) that drill down (the one you're in softly tinted, never a black fill), with breadcrumbs above them as the way back up, and scroll away with the products. They stay on one line in `CategoryRow`, fading out softly at an edge where there's more: swipe, or use the arrows floating over the ends. The bar is fully rounded and floats over the products with nothing filled behind it (`lib/shop/taxonomy.ts`), and a side panel on the page grid (`col-side`: 4 of 12 columns, 3 from `xl`) where every filter is a dropdown (`FilterDropdown`, `PriceDropdown`), which come from the head category. Categories are never in a dropdown. |
| What a pattern needs | A row in the garment page's Overview opens `WhatYouNeedDialog`: every thing with its picture from `supplyIcon()` |
| What the store carries | `curate()` in `lib/shop/curate.ts`: a quota per subcategory, one of each kind of thing, about 150 in all |
| Buying for a garment | `PatternFabric` in a `ShopLayout`: `GarmentThumb` and the garment's name, then dropdowns for what you need, size, recommended fabric and filters |
| Group things | `Panel` (solid; `glass` when it holds controls), rows in `PanelRow`, plain white blocks in `Inset` |
| Label–value details | `DetailList` |
| Any products, on a page or in a section | One `ProductGrid` around a `tiles` grid, with a stroke between products |
| One large product photo | `ProductFrame` around `GarmentGallery`. On the garment page both columns are sticky, so whichever is shorter (the photo or the details) stays in view until the section below |
| A garment in a grid | `GarmentCard` in a `ProductGrid` (pass `photos`: several can be swiped through on the tile) |
| A pattern's photos | `GarmentGallery`: one photo at a time, swipe or arrows on hover, dots for how many. One photo is just `GarmentImage`. Studio patterns keep up to 6 (`setPhotos()`), the first is the cover |
| An icon in a round bubble | `.icon-bubble` (`size-7` to `size-10`): a dashed outline, never a grey fill. `StepDot` "upcoming" is the same |
| A row you press in a panel or dialog | `PanelRow` with `href` or `onClick` (or `.press-row` + `data-control`): one stitch at rest, the control states on hover. Never `hover:bg-background` |
| Text typed in place (studio) | `InlineText`, `InlineTextarea`, `InlinePick` (`.inline-field`): reads like the page, the field's hover and typing states |
| A product in the store | `ShopCard` (`FabricCard` plus its choice of size or colour) in a `ProductGrid` |
| A fabric for a pattern | `FabricCard` in a `ProductGrid` |
| Featured product at the start of a grid | `GarmentCard lead description={…}` |
| Light / dark / system | `useTheme()` from `next-themes`; the switch lives in Settings (from You) |
| What's in progress on Home | `HomeDashboard`: one project fills the container, several become equal `ProjectCard`s |
| The user's picture and setting it | `UserAvatar`, `ProfilePhoto` (drop, paste or choose, then frame) |
| Started projects | `ProjectGrid` (cards: `ProjectCard`, data: `projectCardData()`): `tiles` decides how many fit a row. Only the photo, name, next step, progress and one button |
| A pattern maker | `MakerCard`; their page is built like You: the same `ProfileHeader` in the side column, their patterns beside it |
| A person's card | `ProfileHeader`, on You and on a maker's page alike: a big round photo, the name, a line under it, a label pill, bio, facts, one action |
| A label on a photo | `PhotoLabel` |
| A small white label | `Pill` |
| Pick a size | `SizePicker`, or `SizeSheet` for a project |
| This week and totals on Home | `SewingDashboard`: kept plain. The day's letter is ringed when you sewed that day, and each total sits in its own small container, one under the other |
| A settings page | One `SettingsList` per kind of thing (`solid` when it only reads or links onward) > `SettingsGroup` > `SettingsRow`. Settings (`/profile/settings`, from the gear on You): About you, Settings, Your data, About Sigrid. |
| You (`/profile`) | An overview of you and what's yours: your card (`ProfileHeader`: photo, name, account type, Settings) in the side column, then Made by you (pattern makers, `MadePatterns`) and Your patterns (`OwnedPatterns`). There's no separate My patterns page; `/patterns` redirects here. Preferences never live on You, they live in Settings. |
| What kind of user someone is | `useAccountType()`: sewer or pattern maker, on the Clerk account. Decides what shows, never what someone may do or pay for |
| Side panel | `PanelSheet` |
| The fabric bag | `FabricBagButton` + `FabricBagSheet` |
| State (saved, failed, needs a look, info) | `StatusMessage`; `StatusBadge` for short labels |
| Quick confirmation | `toast()` from `sonner` |
| Nothing here yet | `Empty` with one next action |
| Loading | `Skeleton`, or `Spinner` in the button |
| A table | `Table` inside an `Inset` |
| Login and sign-up | `AuthShell` around Clerk's form; its styling is in the global CSS |
| A legal page | `LegalPage` + `LegalSection`, with `LegalFooter` under it. Always a page, never a modal: long reading that has to be linkable, printable and open to anyone |
| Reaching the legal pages | `SettingsLinks` in Settings, plus a link where it matters: sign-up, the welcome's agreement, before paying. Those open in a new tab so nothing being filled in is lost. Not in a footer on every screen |
| Keep the page from jumping when a list shrinks | `KeepHeight` |

## 9. Product rules (sewing)

- **Viewing a step ≠ completing a step.** Progress changes only when the user presses "Mark done". Opening, scrolling to or moving past a step never changes it. The step on screen has `aria-current="step"`.
- Anything that resets progress (like changing size) needs a confirmation that says what will be lost.
- The recommended size is labelled, never chosen silently.
- Measurements show their unit in the field and use `inputMode="decimal"`.
- No fake social proof: example profiles are labelled "Example profile", no invented reviews or counts.

## 10. Icons

- Tabler only, stroke style. Colour inherits.
- In buttons, menus and inputs, don't set a size. Inline `size-4`, rows `size-5`, empty states `size-8`.
- Decorative icons get `aria-hidden`. Same meaning, same icon everywhere. No emoji.

## 11. Motion

One easing everywhere: `[0.22, 1, 0.36, 1]` (`ease` in `patterns/reveal.tsx`, `--ease-out-soft` in CSS).

| What | How |
| --- | --- |
| Atmosphere | `Atmosphere`: a cutting mat and tiny dots behind every screen. Nothing moves |
| Guide steps | See "Guide animations" |
| Sliding marker (tabs, navigation) | Built into `CategoryTabs`, `AppSidebar`, `AppTabBar` |
| Hover | Buttons lift 1px and turn a bit lighter (`--control-hover`), never swap colour; `hover-zoom` on photos |

No bounce. Reduced motion is respected everywhere (`MotionConfig reducedMotion="user"` plus the global CSS rule).

## 12. Imagery

`GarmentImage` shows the garment photo from `lib/garment-photos.ts` (files in `public/garments`). The garment is the subject of the picture. A photo attached to a garment shows everywhere that garment appears, so always pass `garment.photo`. With no photo, or one that won't load, it shows a plain no-photo icon, never a drawn stand-in. Fabric photos belong to the shops.

## 13. Accessibility (WCAG 2.2 AA)

- Text ≥ 4.5:1, UI parts ≥ 3:1. The tokens pass; raw colours might not.
- Everything works by keyboard. Focus is a 2px ink outline, always visible (built in).
- Every input has a visible label. Errors are text under the field plus `aria-invalid`.
- Icon-only buttons have `aria-label`. Photos have `alt`; decorative images `alt=""`.
- Charts have the same data as text for screen readers.
- One `h1` per screen; headings in order.

## 14. Voice

Sigrid sounds like a calm, experienced friend at the sewing table. Every sentence should leave a nervous first-time sewer calmer and clearer.

- Calm, not cheerful: no exclamation marks, no hype, no emoji.
- One thing at a time: short sentences, one action each, numbers with units ("Sew 1.5 cm from the edge").
- Honest about progress, data and money ("Nothing changes without telling you first").
- Body-neutral: sizes and measurements, never "flattering".
- Buttons: a verb first, 1–3 words, saying the result ("Start sewing", "Agree and continue").
- No step numbers like "01" or percentages where a plain "6/25" or words will do. (Product rule wins over the skill's numbered-index suggestion.)

## 15. Before you call UI work done

- [ ] Built only from components and patterns shown in Storybook (or new ones were added with stories)
- [ ] No raw colours, arbitrary values, emoji icons or extra fonts
- [ ] Glass is real frost over the atmosphere; nothing nested blurs inside glass; nothing blended sits above the page
- [ ] At most one primary button per view
- [ ] Right at 375px and on a laptop, **in light and dark**; keyboard works; Accessibility panel clean
- [ ] Progress only changes on an explicit action
- [ ] Copy is calm, specific and plain
- [ ] The honesty check: does it have a signature moment and varied composition, or does it look like a template?

## Guide animations

Every guide step plays as a short film: **what you do, the whole way along, then the result.** Nobody chooses an animation. `lib/guide-animation/rules.ts` reads it from the step, so this works for every guide and for patterns from the studio. Change a rule there and in this table together.

| The step says | It plays |
| --- | --- |
| `prepare`, "wash" | The cloth lifts and settles |
| `prepare`, "fold" or "lay out" | The cloth folds in half |
| `prepare`, "hang", or with a piece | The work settles flat |
| `cut`, the piece on the fold, or "on the fold" | **Half pattern.** Fold, pattern against the fold, draw round it, cut everywhere except the fold, opens into one joined piece |
| `cut`, "(cut 2)", "both layers", "a left and a right", more than one of a piece | **Two loose pieces.** Fold, pattern in the corner away from the fold, cut right round, A1 and A2 lie apart |
| `cut`, anything else | **Full pattern.** One layer, pattern in a corner, one piece |
| `mark` right before a `cut` of the same piece | The first half of the cut: the chalk line. The `cut` step then cuts it |
| `mark`, anything else | Chalk marks along the edge, as many as it says ("4 loops") |
| `fold`, "0.5 + 1 cm", "6 mm double fold" | **Fold twice**, each the whole length |
| `fold`, "2.5 cm fold" or `annotation.amount` | **Fold once**, the whole length |
| `fold`, "in half" | Fold once, half the piece |
| `press`, "fold" or "hem" in the title | The same as `fold`, then ironed |
| `press`, anything else | The iron, once, along the whole seam or edge |
| `pin` | Pins evenly along the whole line, one after another |
| `sew` or `attach` | The machine along the whole line. If the edge is folded it sews the fold's inner edge |
| `sew`, "by hand", "slip stitch" | The hand needle instead of the machine |
| `sew`, "buttons" | Each button, by hand, as many as it says |
| `sew`, "dart" | A short dart in from the edge |
| A piece in `pieceIds` not yet on the table | It comes in first, then the step's own action |
| Any step after it | Whatever was folded and sewn stays on the cloth |

**Stitches:** straight by default. "baste", "longest stitch", "gather": basting. "topstitch", "close to the fold", "understitch": topstitch. "zigzag", "overlock", "blind hem", "buttonhole" (satin): those stitches.

**Which edge:** `annotation.edge`; "hem" means the bottom; "front edges" or "placket" means both sides.

**Rules for every animation**

- One fabric colour on both sides and for every piece. No textures.
- A tool is always the same size on screen, whatever the camera does. Stitches are thin and small.
- The camera follows the work from start to end and pulls back for the result. Never a partial close-up that suggests working only there.
- Pieces are always named the same way: A, or A1 and A2.
- Cut pieces come from a corner, to save fabric. The pattern sits exactly in the corner: a side on the fabric's own edge is never drawn or cut.
- Folds are one even movement. Check landings by measuring frame-to-frame change: a jump is a bug.

**To make a guide look right:** write the step in plain words, set `action`, and give an edge with `annotation` when it matters. Set `pieceIds` and `join` when a step joins pieces: `layer` lays one on another (a shoulder, a side seam on a flat garment), `side` puts it beside (a sleeve), `top` on its top edge (a collar, a band).

## Site structure

Each main page answers one question. **Home:** what am I sewing and how is it going (no browsing). **My patterns:** every pattern I've bought, kept for good, whether I've started it or finished it. **Explore:** what could I sew next (every pattern and maker). **Shop:** what do I sew it with: fabric and every other supply. Each pattern page has a "What you'll need" list (`lib/fabric/supplies.ts`, only what its guide or description says), and each row opens that supply in the shop for that pattern. **Profile:** my account and settings. **Everything needs an account:** `proxy.ts` sends anyone logged out to the login screen, and only login and the legal pages are open. A *pattern* is what you find and buy, a *project* is what you're sewing. Main pages have no breadcrumbs, because the menu shows where you are; deeper pages do.

**No entrance animations.** Pages and their content are simply there when you arrive: no rising, fading, wiping or staggering. Motion only answers something you do, like a hover, a press or opening a panel.
