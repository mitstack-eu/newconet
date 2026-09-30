# NewCONet design system

This document is the styling contract for the NewCONet site in `site/`. It lists the design tokens and the classes that `site/css/style.css` defines, so a developer can style new markup without inventing values. The page structure and copy live in `docs/design/specs/customer-contact-site.md`.

## How to use the tokens

Every colour, radius, shadow and size that a token covers comes from `:root` in `site/css/style.css`. Write `var(--color-primary)` rather than the hex value. A new value that no token covers becomes a new token and gets a row below in the same change.

The site loads no external fonts. The font stack is `"Segoe UI", Roboto, Helvetica, Arial, sans-serif`.

## Tokens

| Token | Value | Use |
|---|---|---|
| `--color-bg` | `#f7f9fb` | Page ground, field ground |
| `--color-surface` | `#ffffff` | Cards, header, form |
| `--color-white` | `#ffffff` | Text, borders and hover fills on dark sections and on the alert button |
| `--color-primary` | `#0b3d5c` | Links, secondary buttons, stat numbers |
| `--color-primary-dark` | `#082a40` | Headings, outage band, footer, primary button text |
| `--color-accent` | `#1fb6d4` | Primary button fill, logo accent |
| `--color-accent-hover` | `#17a0bc` | Primary button hover |
| `--color-text` | `#1c2b33` | Body text |
| `--color-text-muted` | `#5b6b74` | Paragraphs, hints |
| `--color-text-on-dark` | `#d3e3ec` | Text on the hero, outage band and footer |
| `--color-border` | `#e1e8ec` | Card and section borders |
| `--color-border-strong` | `#7b8c96` | Input and radio tile borders |
| `--color-selected-bg` | `#e8f1f6` | Checked radio tile, confirmation panel |
| `--color-alert` | `#b45309` | Outage buttons, notice border and heading |
| `--color-alert-bg` | `#fff7ed` | Outage route card and notice ground |
| `--color-alert-hover` | `#92400e` | Outage button hover |
| `--color-error` | `#b42318` | Field errors and the error status |
| `--color-focus` | `#0b3d5c` | Focus outline, white on dark sections |
| `--radius` | `10px` | Cards and buttons |
| `--shadow` | `0 10px 30px rgba(11, 61, 92, 0.08)` | Cards and the form |
| `--shadow-accent` | `0 8px 20px rgba(31, 182, 212, 0.35)` | Primary button hover |
| `--border-on-dark` | `rgba(211, 227, 236, 0.2)` | Divider inside the footer |
| `--container-width` | `1120px` | Content width |
| `--header-height` | `72px` | Header height and scroll margins |
| `--contact-bar-height` | `64px` | Sticky bar height and body padding |

## Contrast rules

Primary buttons use `--color-primary-dark` text on the accent fill. Links use `--color-primary` with an underline. Inputs use `--color-border-strong` so they meet 3:1 against the field ground. The accent colour stays on the logo, the primary button fill, route card top borders and the sticky bar's quote cell.

## Breakpoints

| Width | Change |
|---|---|
| Above 960px | Inline nav, five steps in a row, three-column footer |
| 960px and below | Nav behind the toggle, steps stacked, two-column footer |
| 860px and below | About and contact become one column |
| 720px and below | Sticky contact bar shows and the header quote button hides |
| 400px and below | Container padding drops to 16px and the logo shrinks |

## Classes

| Group | Classes |
|---|---|
| Layout | `container`, `section-intro`, `visually-hidden`, `skip-link` |
| Header | `site-header`, `header-inner`, `logo`, `logo-icon`, `logo-text`, `main-nav`, `header-actions`, `nav-toggle` |
| Buttons | `btn`, `btn-primary`, `btn-secondary`, `btn-alert`, `btn-small`, `btn-quote` |
| Hero | `hero`, `hero-sub`, `hero-cta`, `hero-storing` |
| Route chooser | `routes`, `routes-grid`, `route-card`, `route-card--storing`, `route-extra` |
| Services | `diensten`, `diensten-grid`, `dienst-card`, `dienst-icon`, `dienst-link` |
| Process | `werkwijze`, `stappen`, `stap` |
| About | `over-ons`, `over-ons-inner`, `over-ons-tekst`, `over-ons-punten`, `over-ons-stats`, `stat`, `stat-num`, `stat-label` |
| FAQ | `faq`, `faq-list`, `faq-item` |
| Outage band | `storing`, `storing-kern` |
| Contact | `contact`, `contact-inner`, `contact-info`, `contact-details`, `detail-hint`, `contact-form` |
| Form | `form-intro`, `form-field`, `field-optional`, `field-hint`, `field-error`, `keuze-groep`, `keuze-opties`, `keuze-optie` |
| Form states | `storing-melding`, `storing-melding-kop`, `storing-melding-rest`, `form-status`, `is-error`, `form-bevestiging`, `bevestiging-acties` |
| Footer | `site-footer`, `footer-inner`, `footer-brand`, `footer-logo`, `footer-contact`, `footer-nav`, `footer-bottom` |
| Sticky bar | `contact-bar`, `contact-bar-offerte` |

## Details of the finish

The service icons sit in a 56px tile filled with `--color-selected-bg`, so every emoji renders at the same size. The FAQ summary draws a plus that turns into a minus when the item opens. The routes, process, FAQ and contact sections share the page ground, and the about section and services section share the surface ground, so the sections alternate. On screens wider than 860px the contact details stay in view beside the tall form. A focused radio tile shows the focus outline on the whole tile.
