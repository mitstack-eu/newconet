# NewCONet design system

This document is the styling contract for the NewCONet site in `site/`. It lists the design tokens and the classes that `site/css/style.css` defines, so a developer can style new markup without inventing values. The page structure and copy live in `docs/design/specs/customer-contact-site.md`.

## How to use the tokens

Every colour, radius, shadow and size that a token covers comes from `:root` in `site/css/style.css`. Write `var(--color-primary)` rather than the hex value. A new value that no token covers becomes a new token and gets a row below in the same change.

Inline SVG artwork follows the same rule: its fills and strokes read the tokens through `var()`. The one exception is the hero drawing's ground band, a `#000` fill at 0.14 opacity that darkens whatever gradient sits behind it.

The site loads no external fonts. The font stack is `"Segoe UI", Roboto, Helvetica, Arial, sans-serif`.

## Tokens

| Token | Value | Use |
|---|---|---|
| `--color-bg` | `#f7f9fb` | Page ground, field ground |
| `--color-surface` | `#ffffff` | Cards, header, form |
| `--color-white` | `#ffffff` | Text, borders and hover fills on dark sections and on the alert button; legend number discs |
| `--color-primary` | `#0b3d5c` | Links, secondary buttons, stat numbers, badge text, persona card top border |
| `--color-primary-dark` | `#082a40` | Headings, outage band, footer, primary button text |
| `--color-accent` | `#1fb6d4` | Primary button fill, logo accent, hero eyebrow text, featured service card border |
| `--color-accent-hover` | `#17a0bc` | Primary button hover |
| `--color-text` | `#1c2b33` | Body text |
| `--color-text-muted` | `#5b6b74` | Paragraphs, hints |
| `--color-text-on-dark` | `#d3e3ec` | Text on the hero, outage band and footer |
| `--color-border` | `#e1e8ec` | Card and section borders |
| `--color-border-strong` | `#7b8c96` | Input and radio tile borders |
| `--color-selected-bg` | `#e8f1f6` | Checked radio tile, confirmation panel, badge ground, top of the who-we-serve drawings |
| `--color-alert` | `#b45309` | Outage buttons, notice border and heading, resident notice border |
| `--color-alert-bg` | `#fff7ed` | Outage route card and notice ground |
| `--color-alert-hover` | `#92400e` | Outage button hover |
| `--color-error` | `#b42318` | Field errors and the error status |
| `--color-focus` | `#0b3d5c` | Focus outline, white on dark sections |
| `--radius` | `10px` | Cards and buttons |
| `--radius-pill` | `999px` | Fully rounded ends on the hero eyebrow and the badge |
| `--shadow` | `0 10px 30px rgba(11, 61, 92, 0.08)` | Cards and the form |
| `--shadow-accent` | `0 8px 20px rgba(31, 182, 212, 0.35)` | Primary button hover |
| `--border-on-dark` | `rgba(211, 227, 236, 0.2)` | Divider inside the footer, hero eyebrow outline |
| `--container-width` | `1120px` | Content width |
| `--hero-visual-max` | `560px` | Widest the hero illustration grows, so it never outweighs the headline |
| `--header-height` | `72px` | Header height and scroll margins |
| `--contact-bar-height` | `64px` | Sticky bar height and body padding |

`--radius-pill` exists because `--radius` rounds a corner, while a pill needs ends as round as the element is tall at any height. `--hero-visual-max` exists because the illustration scales with its column and needs a cap no other token describes.

## Contrast rules

Primary buttons use `--color-primary-dark` text on the accent fill. Links use `--color-primary` with an underline. Inputs use `--color-border-strong` so they meet 3:1 against the field ground.

The accent colour stays on the logo, the primary button fill, route card top borders, the featured service card's top border and the sticky bar's contact cell. It appears as text in one place outside the logo: the hero eyebrow, bold at 0.85rem, where it measures 4.7:1 against the lightest point of the hero gradient. Put accent text on no other ground.

## Breakpoints

| Width | Change |
|---|---|
| Above 1100px | Inline nav with 24px gaps; the language button shows its globe icon |
| 961px to 1100px | Nav gap drops to 16px; the language button hides its globe icon |
| 960px and below | Nav behind the toggle; the hero grid becomes one column with the illustration below the text, aligned left; steps stacked; two-column footer |
| 860px and below | About and contact become one column |
| 720px and below | Sticky contact bar shows and the header's contact button hides |
| 400px and below | Container padding drops to 16px; header, header-action and logo gaps drop to 6px; the logo text drops to 1.1rem; the alert and language buttons pad 8px 10px; the globe icon hides |
| 359px and below | The logo shows the hexagon without the wordmark |

The two narrowest rules keep `Storing?`, the language button and a full 44px menu toggle in the header down to 320px. `.nav-toggle` never shrinks, at any width.

## Classes

| Group | Classes |
|---|---|
| Layout | `container`, `section-intro`, `visually-hidden`, `skip-link` |
| Header | `site-header`, `header-inner`, `logo`, `logo-icon`, `logo-text`, `main-nav`, `header-actions`, `nav-toggle`, `taal-toggle` |
| Buttons | `btn`, `btn-primary`, `btn-secondary`, `btn-alert`, `btn-small`, `btn-quote` |
| Badges | `badge` |
| Hero | `hero`, `hero-grid`, `hero-eyebrow`, `hero-sub`, `hero-cta`, `hero-noot`, `hero-visual`, `hero-legenda` |
| Route chooser | `routes`, `routes-grid`, `route-card`, `route-card--storing`, `route-extra` |
| Services | `diensten`, `diensten-grid`, `dienst-card`, `dienst-card--uitgelicht`, `dienst-icon`, `dienst-link` |
| Who we serve | `voor-wie`, `persona-grid`, `persona-card`, `voor-wie-grid`, `voor-wie-card`, `voor-wie-visual`, `voor-wie-body` |
| Process | `werkwijze`, `stappen`, `stap` |
| About | `over-ons`, `over-ons-inner`, `over-ons-tekst`, `over-ons-punten`, `over-ons-stats`, `stat`, `stat-num`, `stat-num--tekst`, `stat-label` |
| FAQ | `faq`, `faq-list`, `faq-item` |
| Outage band | `storing`, `storing-kern` |
| Contact | `contact`, `contact-inner`, `contact-info`, `contact-bewoner`, `contact-details`, `detail-hint`, `contact-form` |
| Form | `form-intro`, `form-field`, `field-optional`, `field-hint`, `field-error`, `keuze-groep`, `keuze-opties`, `keuze-optie` |
| Form states | `storing-melding`, `storing-melding-kop`, `storing-melding-rest`, `form-status`, `is-error`, `form-bevestiging`, `bevestiging-acties` |
| Footer | `site-footer`, `footer-inner`, `footer-brand`, `footer-logo`, `footer-contact`, `footer-nav`, `footer-bottom`, `footer-legal` |
| Sticky bar | `contact-bar`, `contact-bar-offerte` |

## What the pattern classes do

Most classes above style one region and need no explanation beyond their name. The classes below carry a reusable pattern or a rule that is easy to break.

| Class | What it does |
|---|---|
| `taal-toggle` | Modifies `btn btn-secondary btn-small` into the compact language button: 8px 12px padding, a 6px gap and an 18px globe icon |
| `hero-grid` | Two-column grid inside the hero container, text at `1.05fr` and illustration at `1fr`, 48px gap, children at `min-width: 0` |
| `hero-eyebrow` | A pill label above the h1: accent text, uppercase, 0.85rem bold, outlined in `--border-on-dark` with `--radius-pill` |
| `hero-visual` | The illustration's `figure`, capped at `--hero-visual-max` and aligned to the grid's end; its SVG scales to the width |
| `hero-legenda` | A numbered legend under the illustration; each item's number is a 24px white disc from a CSS counter with empty alternative text, so a screen reader hears the list numbering once |
| `badge` | A small pill on `--color-selected-bg` with `--color-primary` bold text, placed above a card heading |
| `dienst-card--uitgelicht` | Marks the featured service card with a 4px accent top border |
| `voor-wie` | The who-we-serve section, on the page ground |
| `persona-grid` | Auto-fit grid of cards at least 260px wide, 24px gap, 32px below |
| `persona-card` | A surface card with a 4px primary top border, 28px padding and the card shadow |
| `voor-wie-grid` | Auto-fit grid of cards at least 340px wide, 24px gap |
| `voor-wie-card` | A column card whose drawing sits on top and whose body fills the rest, so the buttons of two cards line up at the bottom |
| `voor-wie-visual` | The drawing's `figure`, on a gradient from `--color-selected-bg` to the surface, with a bottom border; the SVG is at most 200px tall |
| `voor-wie-body` | The card body; its `.btn` is pushed to the bottom with `margin-top: auto` |
| `stat-num--tekst` | Drops a stat number to 1.7rem, for stats that are words rather than figures |
| `contact-bewoner` | A surface notice with a 4px alert left border, for the line that sends residents elsewhere |
| `footer-legal` | Lays out the footer's bottom row as a wrapping flex row with 8px by 24px gaps |

## Details of the finish

The sections alternate grounds so each one reads as its own band. The hero is the dark gradient from `--color-primary-dark` to `--color-primary`. Below it, the routes, who-we-serve, about and contact sections sit on the page ground. The services, process and FAQ sections sit on the surface ground, and the process and FAQ sections add a top border in `--color-border`. The about section's stat tiles sit on the surface ground, and the outage band is `--color-primary-dark`.

The service and persona icons are inline SVG line drawings in `--color-primary` with an accent detail, each in a 56px tile filled with `--color-selected-bg`. The language button's globe icon draws in `currentColor`, so it follows the button's text colour. The FAQ summary draws a plus that turns into a minus when the item opens.

On screens wider than 860px the contact details stay in view beside the tall form. A focused radio tile shows the focus outline on the whole tile. The form's submit button takes its top margin from `.contact-form [type="submit"]`, because it sits inside a wrapper rather than directly in the form.
