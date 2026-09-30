# UX spec for the NewCONet customer contact site

This spec defines the NewCONet one-page website for owners, managers and VvE’s
of multi-tenant office buildings and complete apartment complexes. It is the
contract that `test-author` and `code-author` build from, so it fixes the
section order, every piece of visible copy in Dutch and English, the ids,
classes and anchors that tests hook onto, and every behaviour. The
`frontend-stylist` polishes toward it once the tests are green.

The page serves four kinds of visitor. An owner or manager of an office
building, and an owner, manager or VvE board of an apartment complex, want to
meet NewCONet or get a quote. An existing customer has an outage or a
question. A resident or tenant has come to the wrong place and needs to be
sent on. Each of them finds their route in one tap from the top of the page,
in Dutch or in English, on a phone as well as on a desktop.

## What this spec is built from

The owner approved a clickable mock. Its markup, its CSS additions and its
script are in `.local-screenshots/internetdiensten/mock-src.html`, and the same
mock rendered with its structured data is `newconet-mock.html` in that folder.
The Dutch copy is the mock's HTML, and the English copy is the `EN` object in
its script, keyed by the `data-i18n` keys. Both were proofread and legally
reviewed, so this spec copies them character for character.

The mock's frames are screenshots, so they stay out of git in
`.local-screenshots/internetdiensten/`. The frames show intent: where a frame
and this text disagree, the text wins. Several frames still show the mock's
banner, the `[adres invullen]` stubs and a privacy link, none of which ship.

The inline SVG artwork is too long to repeat here. Copy it verbatim from
`mock-src.html` at the line ranges this spec names, and keep that file until
`site/index.html` carries the artwork.

### What the mock has that does not ship

These parts of the mock exist only to present it, and the page does not carry
them.

| Mock part | What ships instead |
|---|---|
| `p.mock-banner` and its `.mock-banner` rule | Nothing |
| `span.mock-todo` stubs and the `.mock-todo` rules | The placeholders in the table below |
| The privacy link in the footer, `p.form-privacy` in the form and the `.form-privacy` rule | Nothing, until the owner supplies a privacy statement |
| The `EN` keys `mock`, `adresTodo`, `adresTodo2`, `formPrivacy`, `privacyLink`, `lblBedrijf` and `optioneel2` | Nothing; no element uses them |
| The inline `<script>` | `site/js/main.js` and `site/js/i18n.js`, specified below |

The mock's form has no error elements, status region, confirmation panel or
outage notice. Those carry over from the current `site/index.html` and
`site/js/main.js` with new copy, as the form section below specifies.

### Placeholders the owner replaces

Three details are placeholders. Keep them character for character, so the
owner can replace each with one find-and-replace. The English page shows them
unchanged, so they carry no `data-i18n` key.

| Detail | Displayed text | Where it appears |
|---|---|---|
| Address | `Straatnaam 1, 0000 AA Plaatsnaam` | Contact details under `Adres`, and the footer's contact list |
| KvK-nummer | `00000000` | Footer bottom row, after `KvK-nummer:` |
| Btw-nummer | `NL000000000B00` | Footer bottom row, after `Btw-nummer:` |

The phone number `+31 (0)6 21 10 55 02` with the link target
`tel:+31621105502`, and the address `info@newconet.nl` with the link target
`mailto:info@newconet.nl`, are real.

### Facts the page may state

The page states only the facts below. It states no prices, certifications,
client names, testimonials or team members, and no support outside office
hours.

| Fact | Where the page states it |
|---|---|
| NewCONet provides internet in multi-tenant office buildings, its speciality | Hero, routes, services badge, who we serve, about, FAQ |
| NewCONet provides internet in complete apartment complexes | Hero, routes, services, who we serve, about, FAQ |
| Wifi in the common areas, and custom high-end wifi for places such as business centres | Hero legend, services, who we serve, FAQ |
| Internet for building-bound systems | Hero, services, who we serve, process, about, FAQ |
| A partner to owners, managers and VvE’s | Hero, services, who we serve, about, FAQ |
| Business customers only, no private individuals | Routes, who we serve, about, FAQ, form, footer |
| Once NewCONet is active in an `ontsloten` building, a new tenant is usually online within two weeks | Hero, services, who we serve, process, about, FAQ |
| Support Monday to Friday, 08:30 to 17:30, and no support outside office hours as standard | Routes, services, about, FAQ, outage band, contact, footer |
| A more extensive SLA on request | Routes, services, who we serve, about, FAQ, outage band, footer |
| Phone `+31 (0)6 21 10 55 02` and email `info@newconet.nl` | Routes, FAQ, outage band, contact, form, footer, sticky bar |

The approved copy also makes claims that the fact list does not cover. These
are open items for the owner, listed at the end of this spec: that a quote is
free of obligation, personal contact, one point of contact, maintenance and
joint planning after handover, and that residents report outages to their
owner, manager or VvE.

## The journeys

Each journey has an entry point visible without scrolling, at every width.

| Journey | Entry at the top, desktop | Entry at the top, phone | Where it ends |
|---|---|---|---|
| Owner or manager of an office building | Hero `Plan een kennismaking`, route card `Multi-tenant kantoorgebouw` | Hero button, sticky bar `Contact` | The form, with `Kennismaking of offerte voor mijn gebouw` checked and, from the route card, `Multi-tenant kantoorgebouw` selected |
| Owner, manager or VvE board of an apartment complex | Route card `Compleet appartementencomplex` | Hero button, sticky bar `Contact` | The form, with the same choice and `Appartementencomplex` selected |
| Customer with an outage or question | Header `Storing?`, route card `Klant met een storing of vraag` | Header `Storing?`, sticky bar `Bellen` | A call on a working day, an email, or the form |
| Resident or tenant | Route card and outage band resident lines, the contact section's resident notice | The same, after scrolling | Sent to their owner, manager or VvE; the form will not take their message |
| English-speaking visitor | Header button `EN` | Header button `EN` | The same page in English |

The partner's fuller path runs through the services, who we serve, the process
and the FAQ before the form. Service and route links preselect the form's
choices, so a visitor never has to state twice what they came for.

The outage path never depends on the form. Every outage entry point either
dials the number or scrolls to the outage band. The band states the office
hours, the SLA line and the resident referral, and offers the number as a call
button.

## Page structure and section order

The page is one `index.html` with these regions, in this order. The `id` values
are anchor targets and test hooks, so keep them exactly.

| Order | Region | Element and `id` | Heading |
|---|---|---|---|
| 1 | Skip link | `a.skip-link` to `#inhoud` | none |
| 2 | Header | `header.site-header` | none |
| 3 | Hero | `section.hero#top` inside `main#inhoud` | h1 `Internet voor het hele gebouw.<br> Geregeld door één partner.` |
| 4 | Route chooser | `section.routes#wat-wilt-u-doen` | h2 `Wat wilt u doen?` |
| 5 | Services | `section.diensten#diensten` | h2 `Onze diensten` |
| 6 | Who we serve | `section.voor-wie#voor-wie` | h2 `Voor wie wij werken` |
| 7 | Process steps | `section.werkwijze#werkwijze` | h2 `Zo werken wij` |
| 8 | About | `section.over-ons#over-ons` | h2 `Over NewCONet` |
| 9 | FAQ | `section.faq#vragen` | h2 `Veelgestelde vragen` |
| 10 | Outage band | `section.storing#storing` | h2 `Storing? Bel ons op werkdagen` |
| 11 | Contact | `section.contact#contact` | h2 `Neem contact op` |
| 12 | Footer | `footer.site-footer` | h2 `Contact`, h2 `Snel naar` |
| 13 | Sticky contact bar | `nav.contact-bar` | none |

`main#inhoud` carries `tabindex="-1"`, so the skip link moves focus into it.
The h1's `textContent` is `Internet voor het hele gebouw. Geregeld door één
partner.`, with one space after the full stop.

## How the language switch works

Dutch is the default and what the HTML contains. One button switches the whole
page between Dutch and English, without a reload and without a second HTML
file.

### The attribute contract

Two attributes mark every translatable piece of the page.

| Attribute | Meaning | What the switch does |
|---|---|---|
| `data-i18n="<key>"` | The element's `innerHTML` is translatable | Sets `innerHTML` to `EN[key]` for English, and back to the Dutch `innerHTML` for Dutch |
| `data-i18n-aria="<key>"` | The element's `aria-label` is translatable | Sets `aria-label` to `EN[key]` for English, and back to the Dutch label for Dutch |

The script records the Dutch `innerHTML` and `aria-label` of every marked
element once, when it loads and before it applies any language. Switching back
to Dutch restores those recorded values.

The switch writes `innerHTML`, because several values carry markup: a `<br>`,
a `<strong>`, a link, or a visually hidden suffix. The dictionary is static and
no visitor input ever reaches it. A value that holds a link with
`data-onderwerp`, such as `faqIntro`, keeps working because the prefill
listener is delegated on the document.

Every key in the markup has an `EN` entry, every `EN` entry is used by exactly
one element, and no key appears on two elements. The copy tables below list
every key with its element, its Dutch HTML and its English value.

### What the switch changes

Activating `#taal-toggle` switches to the other language and changes all of
the following at once.

1. `<html lang>` becomes `nl` or `en`.
2. `document.title` becomes `TITELS.nl` or `TITELS.en`.
3. Every `data-i18n` element and every `data-i18n-aria` label switches.
4. The language button's own text, `lang` and `aria-label` switch, as the header table specifies.
5. The menu toggle's `aria-label` switches, keeping the open or closed state it describes.
6. Every field error that is showing is rendered again in the new language.
7. A message in the status region is shown again in the new language, keeping its error colour.
8. The next submit builds the mailto subject and body in the new language.

The switch keeps everything else. Form values, the checked radio, the selected
options, an open FAQ item, the menu's open state, the scroll position and
focus on the button stay as they were. The email text already in
`#bericht-kopie` and the `href` of `#mailto-opnieuw` stay as built, because
they are the email the visitor's mail program received.

The meta description, the structured data and the `noscript` message stay
Dutch.

### Which language opens

The script decides the language once, on load.

1. A `lang` URL parameter of `en` or `nl` wins, so `?lang=en` opens English.
2. Otherwise a stored choice of `en` or `nl` in the localStorage key `newconet-taal` applies.
3. Otherwise the page stays Dutch.

Only a click on `#taal-toggle` stores a choice, so a shared `?lang=en` link
never changes the recipient's stored preference. The click also removes a
`lang` parameter from the address with `history.replaceState`, so a reload
shows the language the visitor chose last.

Every localStorage read and write is wrapped in `try`/`catch`. When storage
throws, the switch still works and the choice lasts until the page reloads.

### The i18n module

`site/js/i18n.js` is a new ES module that holds every English string, and
every string the script writes in either language. `site/js/main.js` imports
it. It exports three constants.

| Export | Shape | Holds |
|---|---|---|
| `EN` | `{ [key]: string }` | The English value of every `data-i18n` and `data-i18n-aria` key in the copy tables |
| `TITELS` | `{ nl, en }` | The two page titles |
| `TEKSTEN` | `{ nl: {...}, en: {...} }` | The strings the script writes, in the shape below |

Each language in `TEKSTEN` has the same keys.

| Key path | Holds |
|---|---|
| `menu.openen`, `menu.sluiten` | The menu toggle labels |
| `taalKnop.tekst`, `taalKnop.lang`, `taalKnop.label` | The language button's text, `lang` and label while the page is in this language |
| `fouten.<name>` | The validation messages |
| `status.<name>` | The status region messages |
| `onderwerpen.<value>.label`, `onderwerpen.<value>.subject` | The radio label and mail subject for `partner`, `storing` and `vraag` |
| `rollen.<value>` | The labels for `eigenaar`, `beheerder`, `vve` and `bewoner` |
| `gebouwen.<value>` | The labels for `kantoor`, `appartement`, `businesscenter` and `anders` |
| `regels.<name>` | The mail body line labels |

The labels in `rollen`, `onderwerpen` and `gebouwen` equal the option and
radio texts on the page in that language, so the email repeats what the
visitor saw.

| Title | Text |
|---|---|
| `TITELS.nl`, and the HTML `<title>` | `NewCONet | Internet en wifi voor multi-tenant kantoorgebouwen en complete appartementencomplexen` |
| `TITELS.en` | `NewCONet | Internet and wifi for multi-tenant office buildings and complete apartment complexes` |

The meta description is `NewCONet levert internet en wifi in multi-tenant
kantoorgebouwen en complete appartementencomplexen, voor eigenaren, beheerders
en VvE’s. Niet voor particulieren.`

## Copy and markup per region

The copy in code spans is what the page shows, including punctuation, curly
apostrophes and en dashes. In the tables, the Dutch column is the element's
exact `innerHTML`, and the English column is the exact `EN` value. For a row
whose element reads "`aria-label` of", both columns hold the label instead.

### Skip link

The first focusable element on the page links to `#inhoud`. It is visually
hidden until it receives focus, then appears at the top left over the header.

| Key | Element | Dutch | English |
|---|---|---|---|
| `skip` | `a.skip-link` | `Direct naar de inhoud` | `Skip to content` |

### Header

The header is sticky, 72px tall, white, with a bottom border. Its DOM order is
logo, main nav, header actions, menu toggle. The logo SVG is the current
header's inline SVG, unchanged.

| Key | Element | Dutch | English |
|---|---|---|---|
| `logoLabel` | `aria-label` of `a` | `NewCONet, naar het begin van de pagina` | `NewCONet, back to the top of the page` |
| `navLabel` | `aria-label` of `nav` | `Hoofdmenu` | `Main menu` |
| `navDiensten` | `a` | `Diensten` | `Services` |
| `navVoorWie` | `a` | `Voor wie` | `Who we serve` |
| `navWerkwijze` | `a` | `Werkwijze` | `How we work` |
| `navOverOns` | `a` | `Over ons` | `About us` |
| `navVragen` | `a` | `Vragen` | `FAQ` |
| `headerStoring` | `a.btn` | `Storing?` | `Outage?` |
| `headerCta` | `a.btn` | `Neem contact op` | `Contact us` |

| Element | Target and attributes | Notes |
|---|---|---|
| `nav#hoofdmenu.main-nav` | Five links to `#diensten`, `#voor-wie`, `#werkwijze`, `#over-ons`, `#vragen` | No `Contact` link; the header button carries that route |
| `button#taal-toggle.btn.btn-secondary.btn-small.taal-toggle` | `type="button"` | First child of `div.header-actions`; visible at every width |
| `a.btn.btn-alert.btn-small` | To `#storing` | Visible at every width, including 320px |
| `a.btn.btn-primary.btn-small.btn-quote` | To `#contact` | No `data-onderwerp`; hidden at 720px and below, where the sticky bar carries the route |
| `button#nav-toggle.nav-toggle` | `aria-controls="hoofdmenu"`, `aria-expanded`, `aria-label` | Three bars; shown at 960px and below |

The language button holds the globe SVG from `mock-src.html` line 348, marked
`aria-hidden="true"`, then `span#taal-toggle-tekst`. It carries no
`data-i18n`, because the script sets it from `TEKSTEN.<taal>.taalKnop`.

| Page language | `#taal-toggle-tekst` | Button `lang` | Button `aria-label` |
|---|---|---|---|
| Dutch | `EN` | `en` | `Switch to English (EN)` |
| English | `NL` | `nl` | `Schakel naar Nederlands (NL)` |

The button names the language it switches to, in that language, which is why
its `lang` differs from the page's.

### How the mobile menu behaves

At 960px and below the nav collapses behind the toggle.

1. Closed, the toggle has `aria-expanded="false"` and the label `Menu openen` (English `Open menu`), and the menu is `display: none`, so its links are out of the tab order.
2. Activating the toggle opens the menu below the header, sets `aria-expanded="true"` and the label `Menu sluiten` (English `Close menu`), and moves focus to the first menu link.
3. Activating the toggle again closes the menu and leaves focus on the toggle.
4. Pressing Escape while the menu is open closes it and returns focus to the toggle.
5. Following any menu link closes the menu.
6. Above 960px the nav always shows inline and the toggle is hidden. A menu left open when the window widens is reset to closed.

Focus moves into the menu on open because the nav precedes the toggle in the
DOM. Without that move, the next Tab after opening would skip the links.

### Hero

The hero is `div.container.hero-grid` with two children: the text column and
`figure.hero-visual`. Above 960px they sit side by side, and at 960px and
below the figure drops under the text.

| Key | Element | Dutch | English |
|---|---|---|---|
| `heroEyebrow` | `p.hero-eyebrow` | `Voor eigenaren, beheerders en VvE’s` | `For owners, property managers and owners’ associations` |
| `heroTitel` | `h1` | `Internet voor het hele gebouw.<br> Geregeld door één partner.` | `Internet for the whole building.<br> Arranged by one partner.` |
| `heroSub` | `p.hero-sub` | `NewCONet levert internet en wifi in multi-tenant kantoorgebouwen en complete appartementencomplexen. Voor eigenaren, beheerders en VvE’s zijn wij een vaste partner: wij voorzien uw huurders of bewoners van internet, verzorgen de wifi in de algemene delen en zorgen voor het internet van de gebouwgebonden systemen.` | `NewCONet provides internet and wifi in multi-tenant office buildings and complete apartment complexes. For owners, property managers and owners’ associations, we are a dedicated partner: we provide your tenants or residents with internet, take care of the wifi in the common areas and look after the internet for the building systems.` |
| `heroCta1` | `a.btn` | `Plan een kennismaking` | `Book an introductory call` |
| `heroCta2` | `a.btn` | `Bekijk onze diensten` | `View our services` |
| `heroNoot` | `p.hero-noot` | `Is NewCONet al actief in uw gebouw en is het gebouw ontsloten? Dan is een nieuwe huurder meestal <strong>binnen twee weken</strong> online.` | `If NewCONet is already active in your building and the building is connected to the outside network, a new tenant is usually online <strong>within two weeks</strong>.` |
| `heroVisualTitel` | `title` | `Doorsnede van een kantoorgebouw en een appartementencomplex, met de internetverbinding van de straat naar elke verdieping, naar de gebouwsystemen en naar de wifi in de algemene delen` | `Cross-section of an office building and an apartment complex, showing the internet connection from the street to every floor, to the building systems and to the wifi in the common areas` |
| `legenda1` | `li` | `De verbinding van buiten naar het gebouw` | `The connection from outside into the building` |
| `legenda2` | `li` | `Een eigen aansluiting voor elke huurder` | `A dedicated connection for every tenant` |
| `legenda3` | `li` | `Internet voor de gebouwgebonden systemen` | `Internet for the building’s own systems` |
| `legenda4` | `li` | `Wifi in de algemene delen` | `Wifi in the common areas` |

| Element | Target and attributes |
|---|---|
| `a.btn.btn-primary`, `heroCta1` | To `#contactformulier`, `data-onderwerp="partner"` |
| `a.btn.btn-secondary`, `heroCta2` | To `#diensten` |
| `p.hero-noot`, `heroNoot` | No link; the class carries the text style only |

The illustration is the `svg` at `mock-src.html` lines 376 to 524, verbatim. It
carries `role="img"` and `aria-labelledby="hero-visual-titel"`, and its first
child is `title#hero-visual-titel` with the key `heroVisualTitel`. Its colours
read the tokens through `var()`, except the ground band's `#000` at 0.14
opacity, which darkens whatever gradient sits behind it.

The `figcaption` holds `ol.hero-legenda` with the four legend items. The
numbers 1 to 4 in the drawing match the legend's order, and the legend draws
its numbers from a CSS counter with empty alternative text, so a screen reader
hears the list numbering once.

### Route chooser

Three `article.route-card` elements sit in `div.routes-grid`.

| Key | Element | Dutch | English |
|---|---|---|---|
| `routesTitel` | `h2` | `Wat wilt u doen?` | `What would you like to do?` |
| `routesIntro` | `p.section-intro` | `Wij werken voor eigenaren, beheerders en VvE’s van gebouwen, niet voor particulieren. Kies wat bij u past.` | `We work for owners, property managers and owners’ associations, not for private individuals. Choose what suits you.` |
| `routeKantoorTitel` | `h3` | `Multi-tenant kantoorgebouw` | `Multi-tenant office building` |
| `routeKantoorTekst` | `p` | `U bent eigenaar of beheerder van een kantoorgebouw met meerdere huurders. Wij voorzien elke huurder van een eigen internetaansluiting en zorgen voor het internet van de gebouwgebonden systemen.` | `You own or manage an office building with multiple tenants. We provide every tenant with their own internet connection and take care of the internet for the building systems.` |
| `routeKantoorKnop` | `a.btn` | `Plan een kennismaking` | `Book an introductory call` |
| `routeAppTitel` | `h3` | `Compleet appartementencomplex` | `Complete apartment complex` |
| `routeAppTekst` | `p` | `U bent eigenaar of beheerder van een appartementencomplex, of u zit in het bestuur van de VvE. Wij voorzien alle woningen in het complex van een internetaansluiting en zorgen voor het internet van de systemen van het complex.` | `You own or manage an apartment complex, or you sit on the board of its owners’ association (VvE). We provide every home in the complex with an internet connection and take care of the internet for the complex’s own systems.` |
| `routeAppKnop` | `a.btn` | `Plan een kennismaking` | `Book an introductory call` |
| `route3Titel` | `h3` | `Klant met een storing of vraag` | `Customer with an outage or question` |
| `route3Tekst` | `p` | `Bent u klant van NewCONet? Bel ons op werkdagen tussen 08:30 en 17:30. Heeft u een SLA met ons afgesloten? Dan geldt wat daarin staat.` | `If you are a NewCONet customer, call us on working days between 08:30 and 17:30. If you have an SLA with us, its terms apply.` |
| `belKnop` | `a.btn` | `Bel +31 (0)6 21 10 55 02` | `Call +31 (0)6 21 10 55 02` |
| `route3Extra` | `p.route-extra` | `Of mail naar <a href="mailto:info@newconet.nl">info@newconet.nl</a>` | `Or email <a href="mailto:info@newconet.nl">info@newconet.nl</a>` |
| `route3Bewoner` | `p.route-extra` | `Woont u in een appartementencomplex? Neem dan contact op met de eigenaar, de beheerder of de VvE van uw complex.` | `If you live in an apartment complex, please contact the owner, manager or owners’ association of your complex.` |

| Card | Action element | Target |
|---|---|---|
| Office building | `a.btn.btn-primary`, `routeKantoorKnop` | `#contactformulier`, `data-onderwerp="partner"`, `data-gebouw="kantoor"` |
| Apartment complex | `a.btn.btn-secondary`, `routeAppKnop` | `#contactformulier`, `data-onderwerp="partner"`, `data-gebouw="appartement"` |
| Customer, `article.route-card.route-card--storing` | `a.btn.btn-alert`, `belKnop` | `tel:+31621105502` |

The third card holds two `p.route-extra` lines after its button. The first
carries the `mailto:info@newconet.nl` link, and the second sends residents to
their owner, manager or VvE.

### Onze diensten

Eight `article.dienst-card` elements sit in `div.diensten-grid`, in this order.
The first carries the modifier `dienst-card--uitgelicht` and the badge
`p.badge`.

| Key | Element | Dutch | English |
|---|---|---|---|
| `dienstenTitel` | `h2` | `Onze diensten` | `Our services` |
| `dienstenIntro` | `p.section-intro` | `Internet, wifi en ondersteuning voor gebouwen met meerdere gebruikers, van de aansluiting tot het onderhoud.` | `Internet, wifi and support for buildings with multiple occupants, from connection to maintenance.` |
| `badgeSpecialisme` | `p.badge` | `Ons specialisme` | `Our speciality` |
| `dienst1Titel` | `h3` | `Internet voor multi-tenant kantoorgebouwen` | `Internet for multi-tenant office buildings` |
| `dienst1Tekst` | `p` | `Elke huurder krijgt een eigen internetaansluiting. U als eigenaar of beheerder heeft één aanspreekpunt voor het hele gebouw.` | `Every tenant gets their own internet connection. As the owner or manager, you have one point of contact for the whole building.` |
| `dienst1Link` | `a.dienst-link` | `Offerte aanvragen<span class="visually-hidden"> voor internet in een multi-tenant kantoorgebouw</span>` | `Request a quote<span class="visually-hidden"> for internet in a multi-tenant office building</span>` |
| `dienst2Titel` | `h3` | `Internet voor complete appartementencomplexen` | `Internet for complete apartment complexes` |
| `dienst2Tekst` | `p` | `Alle woningen in het complex krijgen een internetaansluiting. De afspraken maken wij met de eigenaar, de beheerder of de VvE.` | `Every home in the complex gets an internet connection. We make the arrangements with the owner, the manager or the owners’ association.` |
| `dienst2Link` | `a.dienst-link` | `Offerte aanvragen<span class="visually-hidden"> voor internet in een compleet appartementencomplex</span>` | `Request a quote<span class="visually-hidden"> for internet in a complete apartment complex</span>` |
| `dienstWifiTitel` | `h3` | `Wifi in de algemene delen` | `Wifi in the common areas` |
| `dienstWifiTekst` | `p` | `Wifi in de algemene delen van het gebouw, zoals de entree, de lobby en ontmoetingsruimtes. Voor huurders, bewoners en bezoekers.` | `Wifi in the common areas of the building, such as the entrance, the lobby and meeting spaces. For tenants, residents and visitors.` |
| `dienstWifiLink` | `a.dienst-link` | `Offerte aanvragen<span class="visually-hidden"> voor wifi in de algemene delen</span>` | `Request a quote<span class="visually-hidden"> for wifi in the common areas</span>` |
| `dienstMaatwerkTitel` | `h3` | `Hoogwaardige wifi op maat` | `High-end custom wifi` |
| `dienstMaatwerkTekst` | `p` | `Wifi-oplossingen op maat voor omgevingen met hoge eisen, zoals businesscenters. Wij stemmen de oplossing af op het gebouw en de gebruikers.` | `Custom wifi solutions for demanding environments, such as business centres. We tailor the solution to the building and its users.` |
| `dienstMaatwerkLink` | `a.dienst-link` | `Plan een kennismaking<span class="visually-hidden"> over wifi op maat</span>` | `Book an introductory call<span class="visually-hidden"> about custom wifi</span>` |
| `dienst3Titel` | `h3` | `Internet voor gebouwgebonden systemen` | `Internet for building systems` |
| `dienst3Tekst` | `p` | `Internet voor de systemen van het gebouw zelf, zoals toegangscontrole, liften, klimaatinstallaties en camera’s. Zo ondersteunen wij eigenaren, beheerders en VvE’s.` | `Internet for the building’s own systems, such as access control, lifts, climate control and cameras. This is how we support owners, managers and owners’ associations.` |
| `dienst3Link` | `a.dienst-link` | `Offerte aanvragen<span class="visually-hidden"> voor internet voor gebouwgebonden systemen</span>` | `Request a quote<span class="visually-hidden"> for internet for building systems</span>` |
| `dienst4Titel` | `h3` | `Partner voor eigenaren, beheerders en VvE’s` | `Partner for owners, managers and owners’ associations` |
| `dienst4Tekst` | `p` | `Wij voorzien uw huurders of bewoners van internetaansluitingen en -diensten. Zo biedt u goed internet als onderdeel van uw gebouw, zonder dat u het zelf hoeft te regelen.` | `We provide your tenants or residents with internet connections and services. That way, you offer good internet as part of your building without having to arrange it yourself.` |
| `dienst4Link` | `a.dienst-link` | `Plan een kennismaking<span class="visually-hidden"> over een partnerschap</span>` | `Book an introductory call<span class="visually-hidden"> about a partnership</span>` |
| `dienst5Titel` | `h3` | `Ondersteuning en onderhoud` | `Support and maintenance` |
| `dienst5Tekst` | `p` | `Wij blijven u ondersteunen, doen het onderhoud en denken mee met wat u nodig heeft. Wij zijn bereikbaar op werkdagen. Een ruimere SLA is mogelijk op aanvraag.` | `We keep supporting you, carry out the maintenance and work with you on what you need. We are available on working days. A more extensive SLA is available on request.` |
| `dienst5Link` | `a.dienst-link` | `Vraag naar een SLA<span class="visually-hidden"> op maat</span>` | `Ask about an SLA<span class="visually-hidden"> tailored to you</span>` |
| `dienst6Titel` | `h3` | `Nieuwe huurders snel online` | `New tenants online quickly` |
| `dienst6Tekst` | `p` | `Is NewCONet al actief in uw gebouw en is het gebouw ontsloten? Dan is een nieuwe huurder meestal binnen twee weken online.` | `If NewCONet is already active in your building and the building is connected to the outside network, a new tenant is usually online within two weeks.` |
| `dienst6Link` | `a.dienst-link` | `Neem contact op<span class="visually-hidden"> over nieuwe huurders</span>` | `Get in touch<span class="visually-hidden"> about new tenants</span>` |

Each card starts with `div.dienst-icon` holding an inline SVG, marked
`aria-hidden="true"` on the `div`. Each card ends with an `a.dienst-link` whose
visible text is followed by a `span.visually-hidden` suffix, so every link has
a unique accessible name.

| Card title key | Icon SVG, `mock-src.html` line | Link `data-onderwerp` | Link `data-gebouw` |
|---|---|---|---|
| `dienst1Titel` | 571 | `partner` | none |
| `dienst2Titel` | 581 | `partner` | none |
| `dienstWifiTitel` | 590 | `partner` | none |
| `dienstMaatwerkTitel` | 599 | `partner` | `businesscenter` |
| `dienst3Titel` | 608 | `partner` | none |
| `dienst4Titel` | 617 | `partner` | none |
| `dienst5Titel` | 626 | `vraag` | none |
| `dienst6Titel` | 635 | `partner` | none |

Every service link targets `#contactformulier`.

### Voor wie wij werken

The section holds `div.persona-grid` with three `article.persona-card`, then
`div.voor-wie-grid` with two `article.voor-wie-card`.

| Key | Element | Dutch | English |
|---|---|---|---|
| `voorWieTitel` | `h2` | `Voor wie wij werken` | `Who we serve` |
| `voorWieIntro` | `p.section-intro` | `Wij werken voor de partijen die over het internet in een gebouw beslissen: eigenaren, beheerders en VvE’s. Wij werken niet voor particulieren.` | `We work for the parties who decide on the internet in a building: owners, property managers and owners’ associations. We do not work for private individuals.` |
| `persona1Titel` | `h3` | `Eigenaren` | `Owners` |
| `persona1Tekst` | `p` | `U wilt dat uw huurders of bewoners goed internet hebben, zonder dat u het zelf hoeft te regelen. Wij voorzien hen van internet en zorgen voor het internet van de gebouwgebonden systemen.` | `You want your tenants or residents to have good internet without having to arrange it yourself. We provide them with internet and take care of the internet for the building systems.` |
| `persona2Titel` | `h3` | `Beheerders` | `Property managers` |
| `persona2Tekst` | `p` | `U wilt het internet in het gebouw onderbrengen bij een vaste partner. Wij verzorgen de aansluitingen en het onderhoud, en denken mee als het gebouw verandert.` | `You want to place the internet in the building with a dedicated partner. We handle the connections and the maintenance, and help you plan as the building changes.` |
| `persona3Titel` | `h3` | `VvE’s` | `Owners’ associations (VvE)` |
| `persona3Tekst` | `p` | `U wilt als bestuur goed internet voor alle woningen in het complex. Wij voorzien elke woning van een internetaansluiting en maken de afspraken met het bestuur.` | `As a board, you want good internet for every home in the complex. We provide every home with an internet connection and make the arrangements with the board.` |
| `huurderA` | `text` | `Huurder A` | `Tenant A` |
| `huurderB` | `text` | `Huurder B` | `Tenant B` |
| `huurderC` | `text` | `Huurder C` | `Tenant C` |
| `huurderD` | `text` | `Huurder D` | `Tenant D` |
| `badgeSpecialisme2` | `p.badge` | `Ons specialisme` | `Our speciality` |
| `voorWie1Titel` | `h3` | `Multi-tenant kantoorgebouwen` | `Multi-tenant office buildings` |
| `voorWie1Tekst` | `p` | `In een kantoorgebouw met meerdere huurders wil elk bedrijf zonder gedoe aan de slag. Wij zorgen ervoor dat elke huurder een eigen aansluiting heeft. Is het gebouw ontsloten en zijn wij er al actief? Dan is een nieuwe huurder meestal binnen twee weken online.` | `In an office building with multiple tenants, every business wants to get started without any hassle. We make sure every tenant has their own connection. If the building is connected and we are already active there, a new tenant is usually online within two weeks.` |
| `voorWie1Punt1` | `li` | `Eén aanspreekpunt voor de eigenaar of beheerder` | `One point of contact for the owner or manager` |
| `voorWie1Punt2` | `li` | `Een eigen internetaansluiting per huurder` | `A dedicated internet connection for each tenant` |
| `voorWie1Punt3` | `li` | `Internet voor de gebouwgebonden systemen` | `Internet for the building systems` |
| `voorWie1Punt4` | `li` | `Wifi in de algemene delen, of hoogwaardige wifi op maat` | `Wifi in the common areas, or high-end custom wifi` |
| `voorWie1Knop` | `a.btn` | `Plan een kennismaking` | `Book an introductory call` |
| `voorWie2Titel` | `h3` | `Complete appartementencomplexen` | `Complete apartment complexes` |
| `voorWie2Tekst` | `p` | `Voor een appartementencomplex werken wij voor de eigenaar, de beheerder of de VvE. Wij voorzien alle woningen van een internetaansluiting en zorgen voor het internet van de systemen van het complex.` | `For an apartment complex, we work for the owner, the manager or the owners’ association. We provide every home with an internet connection and take care of the internet for the complex’s own systems.` |
| `voorWie2Punt1` | `li` | `Een internetaansluiting voor alle woningen` | `An internet connection for every home` |
| `voorWie2Punt4` | `li` | `Wifi in de algemene delen van het complex` | `Wifi in the common areas of the complex` |
| `voorWie2Punt2` | `li` | `Afspraken met de eigenaar, de beheerder of de VvE` | `Arrangements with the owner, the manager or the owners’ association` |
| `voorWie2Punt3` | `li` | `Ondersteuning op werkdagen, ruimere SLA op aanvraag` | `Support on working days, a more extensive SLA on request` |
| `voorWie2Knop` | `a.btn` | `Neem contact op` | `Get in touch` |

Each persona card starts with a `div.dienst-icon` holding the SVG at
`mock-src.html` line 652, 659 or 666, marked `aria-hidden="true"`.

Each `voor-wie-card` starts with `figure.voor-wie-visual`, marked
`aria-hidden="true"`, holding the drawing at `mock-src.html` lines 675 to 706
for the office building and 724 to 758 for the apartment complex. The four
`Huurder` labels inside the office drawing carry keys, so the drawing matches
the page language even though assistive technology skips it.

The card body is `div.voor-wie-body`. The office card opens with the badge
`p.badge`, and both cards list their points in `ul.over-ons-punten`. The
apartment card lists its points in the order `voorWie2Punt1`, `voorWie2Punt4`,
`voorWie2Punt2`, `voorWie2Punt3`, as the table shows.

| Card | Action element | Target |
|---|---|---|
| Office buildings | `a.btn.btn-primary`, `voorWie1Knop` | `#contactformulier`, `data-onderwerp="partner"`, `data-gebouw="kantoor"` |
| Apartment complexes | `a.btn.btn-secondary`, `voorWie2Knop` | `#contactformulier`, `data-onderwerp="partner"`, `data-gebouw="appartement"` |

### Zo werken wij

The steps are an `ol.stappen` of five `li.stap`, each with an h3 and one
paragraph. The step number comes from a CSS counter.

| Key | Element | Dutch | English |
|---|---|---|---|
| `werkwijzeTitel` | `h2` | `Zo werken wij` | `How we work` |
| `werkwijzeIntro` | `p.section-intro` | `Van de eerste kennismaking tot de dagelijkse ondersteuning: zo verloopt een samenwerking met NewCONet.` | `From the first introduction to day-to-day support: this is what working with NewCONet looks like.` |
| `stap1Titel` | `h3` | `Kennismaking` | `Introduction` |
| `stap1Tekst` | `p` | `U neemt contact met ons op als eigenaar, beheerder of VvE. U heeft persoonlijk contact met ons.` | `You contact us as an owner, property manager or owners’ association. You deal with us personally.` |
| `stap2Titel` | `h3` | `Het gebouw in kaart brengen` | `Mapping the building` |
| `stap2Tekst` | `p` | `Samen met u bekijken wij het gebouw, de huurders of bewoners en de systemen die internet nodig hebben.` | `Together with you, we look at the building, the tenants or residents and the systems that need internet.` |
| `stap3Titel` | `h3` | `Voorstel op maat` | `A tailored proposal` |
| `stap3Tekst` | `p` | `U ontvangt een voorstel en een vrijblijvende offerte die passen bij uw gebouw.` | `You receive a proposal and a no-obligation quote that fit your building.` |
| `stap4Titel` | `h3` | `Aansluiten` | `Connecting` |
| `stap4Tekst` | `p` | `Wij sluiten de huurders of woningen en de gebouwgebonden systemen aan. Is het gebouw ontsloten en zijn wij er al actief? Dan leveren wij een internetdienst meestal binnen twee weken.` | `We connect the tenants or homes and the building systems. If the building is connected and we are already active there, we usually deliver an internet service within two weeks.` |
| `stap5Titel` | `h3` | `Ondersteuning en onderhoud` | `Support and maintenance` |
| `stap5Tekst` | `p` | `Wij blijven u ondersteunen, doen het onderhoud en denken mee als uw behoefte verandert.` | `We keep supporting you, carry out the maintenance and help you plan as your needs change.` |
| `werkwijzeKnop` | `a.btn` | `Plan een kennismaking` | `Book an introductory call` |

Below the list sits `a.btn.btn-primary` with the key `werkwijzeKnop`, to
`#contactformulier` with `data-onderwerp="partner"`. Above 960px the five steps
sit in one row, and at 960px and below they stack with the number to the left.

### Over NewCONet

The text column holds the h2, two paragraphs and `ul.over-ons-punten`. The
stats are a `ul.over-ons-stats` with `role="list"` of three `li.stat`, so a
screen reader announces a list of three. Each stat number carries both
`stat-num` and `stat-num--tekst`, because the values are words rather than
figures.

| Key | Element | Dutch | English |
|---|---|---|---|
| `overOnsTitel` | `h2` | `Over NewCONet` | `About NewCONet` |
| `overOns1` | `p` | `NewCONet levert internet en wifi in gebouwen met meerdere gebruikers. Wij zijn gespecialiseerd in multi-tenant kantoorgebouwen en voorzien daarnaast complete appartementencomplexen van internet.` | `NewCONet provides internet and wifi in buildings with multiple occupants. We specialise in multi-tenant office buildings and also provide internet for complete apartment complexes.` |
| `overOns2` | `p` | `Voor eigenaren, beheerders en VvE’s zijn wij een vaste partner. Wij zorgen voor de internetaansluitingen van hun huurders en bewoners en voor het internet van de gebouwgebonden systemen. Wij werken niet voor particulieren.` | `For owners, property managers and owners’ associations, we are a dedicated partner. We take care of their tenants’ and residents’ internet connections and of the internet for the building systems. We do not work for private individuals.` |
| `overOnsPunt1` | `li` | `Persoonlijk contact` | `Personal contact` |
| `overOnsPunt2` | `li` | `Gespecialiseerd in multi-tenant kantoorgebouwen` | `Specialised in multi-tenant office buildings` |
| `overOnsPunt3` | `li` | `Onderhoud en meedenken, ook na de oplevering` | `Maintenance and joint planning, continuing after handover` |
| `stat1Num` | `span.stat-num` | `Binnen 2 weken` | `Within 2 weeks` |
| `stat1Label` | `span.stat-label` | `meestal, in een ontsloten gebouw waar wij al actief zijn` | `usually, in a connected building where we are already active` |
| `stat2Num` | `span.stat-num` | `Ma–vr` | `Mon–Fri` |
| `stat2Label` | `span.stat-label` | `ondersteuning van 08:30 tot 17:30` | `support from 08:30 to 17:30` |
| `stat3Num` | `span.stat-num` | `SLA op maat` | `Tailored SLA` |
| `stat3Label` | `span.stat-label` | `ruimere afspraken op aanvraag` | `more extensive agreements on request` |

### Veelgestelde vragen

Each question is a native `details.faq-item` with a `summary` and one `p`. All
fourteen items start closed. The intro's link targets `#contactformulier` and
carries `data-onderwerp="vraag"`, in both languages.

| Key | Element | Dutch | English |
|---|---|---|---|
| `faqTitel` | `h2` | `Veelgestelde vragen` | `Frequently asked questions` |
| `faqIntro` | `p.section-intro` | `Staat uw vraag er niet bij? <a href="#contactformulier" data-onderwerp="vraag">Stuur ons een bericht</a>.` | `Can’t find your question? <a href="#contactformulier" data-onderwerp="vraag">Send us a message</a>.` |
| `faq1V` | `summary` | `Welke internetdiensten levert NewCONet?` | `Which internet services does NewCONet provide?` |
| `faq1A` | `p` | `NewCONet levert internetdiensten in multi-tenant kantoorgebouwen en complete appartementencomplexen, voor eigenaren, beheerders en VvE’s. Wij zorgen voor de internetaansluitingen van huurders en bewoners, voor wifi in de algemene delen en hoogwaardige wifi op maat, voor het internet van gebouwgebonden systemen, en voor de ondersteuning en het onderhoud daarvan.` | `NewCONet provides internet services in multi-tenant office buildings and complete apartment complexes, for owners, property managers and owners’ associations. We take care of the internet connections for tenants and residents, wifi in the common areas and high-end custom wifi, internet for building systems, and the support and maintenance that go with them.` |
| `faq2V` | `summary` | `Voor welke gebouwen werkt NewCONet?` | `Which buildings does NewCONet work for?` |
| `faq2A` | `p` | `NewCONet is gespecialiseerd in multi-tenant kantoorgebouwen: kantoorgebouwen met meerdere huurders. Daarnaast voorziet NewCONet complete appartementencomplexen van internet.` | `NewCONet specialises in multi-tenant office buildings: office buildings with several tenants. NewCONet also provides internet for complete apartment complexes.` |
| `faq11V` | `summary` | `Levert NewCONet ook aan particulieren?` | `Does NewCONet supply private individuals?` |
| `faq11A` | `p` | `Nee. NewCONet werkt alleen voor eigenaren, beheerders en VvE’s van gebouwen, niet voor particulieren. Woont u in een appartementencomplex en heeft u een vraag over uw internet? Neem dan contact op met de eigenaar, de beheerder of de VvE van uw complex.` | `No. NewCONet works only for owners, property managers and owners’ associations, not for private individuals. If you live in an apartment complex and have a question about your internet, please contact the owner, manager or owners’ association of your complex.` |
| `faq12V` | `summary` | `Wat is internet voor een compleet appartementencomplex?` | `What is internet for a complete apartment complex?` |
| `faq12A` | `p` | `NewCONet voorziet alle woningen in een appartementencomplex van een internetaansluiting. De afspraken daarover maakt NewCONet met de eigenaar, de beheerder of de VvE van het complex, niet met individuele bewoners.` | `NewCONet provides every home in an apartment complex with an internet connection. NewCONet makes the arrangements with the owner, the manager or the owners’ association of the complex, not with individual residents.` |
| `faq13V` | `summary` | `Kan een VvE met NewCONet samenwerken?` | `Can an owners’ association (VvE) work with NewCONet?` |
| `faq13A` | `p` | `Ja. Bij een appartementencomplex kan de VvE onze opdrachtgever zijn, net als de eigenaar of de beheerder. NewCONet voorziet dan alle woningen in het complex van een internetaansluiting.` | `Yes. For an apartment complex, the owners’ association can be our client, just like the owner or the manager. NewCONet then provides every home in the complex with an internet connection.` |
| `faq14V` | `summary` | `Levert NewCONet ook wifi?` | `Does NewCONet also provide wifi?` |
| `faq14A` | `p` | `Ja. NewCONet verzorgt wifi in de algemene delen van gebouwen, zoals de entree, de lobby en ontmoetingsruimtes. Daarnaast levert NewCONet hoogwaardige wifi-oplossingen op maat voor omgevingen met hoge eisen, zoals businesscenters.` | `Yes. NewCONet takes care of wifi in the common areas of buildings, such as the entrance, the lobby and meeting spaces. NewCONet also provides high-end custom wifi solutions for demanding environments, such as business centres.` |
| `faq3V` | `summary` | `Wat is een multi-tenant kantoorgebouw?` | `What is a multi-tenant office building?` |
| `faq3A` | `p` | `Een multi-tenant kantoorgebouw is een kantoorgebouw waarin meerdere bedrijven ruimte huren. In zo’n gebouw krijgt elke huurder van NewCONet een eigen internetaansluiting. De eigenaar of beheerder heeft één aanspreekpunt voor het internet in het hele gebouw.` | `A multi-tenant office building is an office building in which several businesses rent space. In such a building, every tenant gets their own internet connection from NewCONet. The owner or manager has one point of contact for the internet in the whole building.` |
| `faq4V` | `summary` | `Hoe snel is een nieuwe huurder online?` | `How quickly is a new tenant online?` |
| `faq4A` | `p` | `Is NewCONet al actief in het gebouw en is het gebouw ontsloten? Dan is een nieuwe huurder meestal binnen twee weken online. In andere gevallen hangt de levertijd af van het gebouw. Die bespreken wij vooraf met u.` | `If NewCONet is already active in the building and the building is connected to the outside network, a new tenant is usually online within two weeks. In other cases, the delivery time depends on the building, and we discuss it with you in advance.` |
| `faq5V` | `summary` | `Wat betekent ‘ontsloten’?` | `What does ‘connected building’ mean?` |
| `faq5A` | `p` | `Een gebouw is ontsloten als het een verbinding heeft met het netwerk buiten het gebouw. Via die verbinding levert NewCONet internet aan de huurders en aan de systemen in het gebouw.` | `A building is connected when it has a link to the network outside the building. Through that link, NewCONet delivers internet to the tenants and to the systems in the building.` |
| `faq6V` | `summary` | `Wat zijn gebouwgebonden systemen?` | `What are building systems?` |
| `faq6A` | `p` | `Gebouwgebonden systemen zijn systemen die bij het gebouw horen, zoals toegangscontrole, liften, klimaatinstallaties en camera’s. NewCONet levert het internet dat deze systemen nodig hebben en ondersteunt daarmee eigenaren, beheerders en VvE’s.` | `Building systems are systems that belong to the building, such as access control, lifts, climate control and cameras. NewCONet provides the internet these systems need, and in doing so supports owners, property managers and owners’ associations.` |
| `faq7V` | `summary` | `Ik ben eigenaar, beheerder of VvE-bestuurder. Wat regelt NewCONet voor mijn gebouw?` | `I am an owner, property manager or VvE board member. What does NewCONet arrange for my building?` |
| `faq7A` | `p` | `NewCONet voorziet uw huurders of bewoners van internetaansluitingen en -diensten, zorgt voor het internet van de gebouwgebonden systemen en denkt met u mee over wat uw gebouw nodig heeft. Voor het internet in het hele gebouw heeft u één aanspreekpunt.` | `NewCONet provides your tenants or residents with internet connections and services, takes care of the internet for the building systems and works with you on what your building needs. You have one point of contact for the internet in the whole building.` |
| `faq8V` | `summary` | `Wanneer is NewCONet bereikbaar?` | `When can I reach NewCONet?` |
| `faq8A` | `p` | `NewCONet is voor klanten bereikbaar op werkdagen, van maandag tot en met vrijdag, van 08:30 tot 17:30. U belt ons op +31 (0)6 21 10 55 02 of mailt naar info@newconet.nl. Buiten kantoortijden biedt NewCONet standaard geen ondersteuning.` | `NewCONet is available to customers on working days, Monday to Friday, from 08:30 to 17:30. You can call us on +31 (0)6 21 10 55 02 or email info@newconet.nl. As standard, NewCONet does not provide support outside office hours.` |
| `faq9V` | `summary` | `Biedt NewCONet een SLA aan?` | `Does NewCONet offer an SLA?` |
| `faq9A` | `p` | `Ja, op aanvraag. Heeft u meer nodig dan ondersteuning op werkdagen van 08:30 tot 17:30? Dan maakt NewCONet een SLA op maat.` | `Yes, on request. If you need more than support on working days from 08:30 to 17:30, NewCONet can draw up a tailored SLA.` |
| `faq10V` | `summary` | `Is een offerte van NewCONet vrijblijvend?` | `Is a quote from NewCONet free of obligation?` |
| `faq10A` | `p` | `Ja. U vraagt een offerte aan via het formulier onderaan deze pagina, per e-mail of telefonisch.` | `Yes. You can request a quote using the form at the bottom of this page, by email or by phone.` |

### Outage band

The outage band is a full-width dark section on `--color-primary-dark`. Its
children are, in order, the h2, a paragraph, `p.storing-kern`, the resident
paragraph and the call button.

| Key | Element | Dutch | English |
|---|---|---|---|
| `storingTitel` | `h2` | `Storing? Bel ons op werkdagen` | `Outage? Call us on working days` |
| `storingTekst` | `p` | `Voor klanten zijn wij bereikbaar van maandag tot en met vrijdag, van 08:30 tot 17:30. Heeft u een SLA met ons afgesloten? Dan geldt wat daarin staat.` | `For customers, we are available Monday to Friday, from 08:30 to 17:30. If you have an SLA with us, its terms apply.` |
| `storingKern` | `p.storing-kern` | `Wilt u ruimere afspraken over ondersteuning? Vraag naar een SLA op maat.` | `Need more extensive support agreements? Ask about a tailored SLA.` |
| `storingBewoner` | `p` | `Woont u in een appartementencomplex? Meld een storing dan bij de eigenaar, de beheerder of de VvE van uw complex.` | `If you live in an apartment complex, please report an outage to the owner, manager or owners’ association of your complex.` |
| `belKnop2` | `a.btn` | `Bel +31 (0)6 21 10 55 02` | `Call +31 (0)6 21 10 55 02` |

The call button is `a.btn.btn-alert` to `tel:+31621105502`.

### Neem contact op

The contact section keeps two columns: `div.contact-info` on the left, the
form on the right. `p.contact-bewoner` sits between the intro and the details
list, so a resident reads it before any contact detail.

| Key | Element | Dutch | English |
|---|---|---|---|
| `contactTitel` | `h2` | `Neem contact op` | `Get in touch` |
| `contactIntro` | `p` | `Bent u eigenaar, beheerder of VvE-bestuurder en wilt u internet voor uw gebouw? Of heeft u een vraag? Neem gerust contact op.` | `Are you an owner, property manager or VvE board member and would you like internet for your building? Or do you have a question? Feel free to get in touch.` |
| `contactBewoner` | `p.contact-bewoner` | `Bent u bewoner of huurder? Neem dan contact op met de eigenaar, de beheerder of de VvE van uw gebouw.` | `If you are a resident or tenant, please contact the owner, manager or owners’ association of your building.` |
| `lblTelefoon` | `strong` | `Telefoon` | `Phone` |
| `telefoonHint` | `span.detail-hint` | `Op werkdagen van 08:30 tot 17:30` | `On working days from 08:30 to 17:30` |
| `lblEmail` | `strong` | `E-mail` | `Email` |
| `lblAdres` | `strong` | `Adres` | `Address` |
| `lblTijden` | `strong` | `Bereikbaarheid` | `Office hours` |
| `tijden` | `span` | `Ma–vr: 08:30–17:30` | `Mon–Fri: 08:30–17:30` |

The details list is `ul.contact-details` with `role="list"` and four items.

| Label key | Value | Extra line |
|---|---|---|
| `lblTelefoon` | `+31 (0)6 21 10 55 02` as a link to `tel:+31621105502` | `span.detail-hint` with `telefoonHint` |
| `lblEmail` | `info@newconet.nl` as a link to `mailto:info@newconet.nl` | none |
| `lblAdres` | `Straatnaam 1, 0000 AA Plaatsnaam`, in a plain `span` without a key | none |
| `lblTijden` | `span` with `tijden` | none |

The form is specified in its own section below.

### Footer

The footer has three columns above 960px, two at 960px and below, and one at
720px and below.

| Key | Element | Dutch | English |
|---|---|---|---|
| `footerTagline` | `p` | `Internet en wifi voor multi-tenant kantoorgebouwen en complete appartementencomplexen. Voor eigenaren, beheerders en VvE’s, niet voor particulieren.` | `Internet and wifi for multi-tenant office buildings and complete apartment complexes. For owners, property managers and owners’ associations, not for private individuals.` |
| `footerContact` | `h2` | `Contact` | `Contact` |
| `footerTel` | `span` | `Telefoon:` | `Phone:` |
| `footerMail` | `span` | `E-mail:` | `Email:` |
| `footerTijden` | `li` | `Ma–vr: 08:30–17:30` | `Mon–Fri: 08:30–17:30` |
| `footerSla` | `li` | `Ruimere SLA op aanvraag` | `More extensive SLA on request` |
| `footerNavLabel` | `aria-label` of `nav` | `Voettekst` | `Footer` |
| `footerSnel` | `h2` | `Snel naar` | `Quick links` |
| `navDiensten2` | `a` | `Diensten` | `Services` |
| `navVoorWie2` | `a` | `Voor wie` | `Who we serve` |
| `navWerkwijze2` | `a` | `Werkwijze` | `How we work` |
| `navOverOns2` | `a` | `Over ons` | `About us` |
| `navVragen2` | `a` | `Vragen` | `FAQ` |
| `navContact2` | `a` | `Contact` | `Contact` |
| `rechten` | `span` | `NewCONet. Alle rechten voorbehouden.` | `NewCONet. All rights reserved.` |
| `kvk` | `span` | `KvK-nummer:` | `Chamber of Commerce (KvK) number:` |
| `btw` | `span` | `Btw-nummer:` | `VAT number:` |

| Column | Content, in order |
|---|---|
| Brand | `p.footer-logo` with `New<span>CO</span>Net`, then the tagline |
| Contact | h2, then `ul` with `role="list"`: phone label and `tel:` link, email label and `mailto:` link, `Straatnaam 1, 0000 AA Plaatsnaam` without a key, hours, SLA line |
| Links | `nav.footer-nav`, h2, then six links to `#diensten`, `#voor-wie`, `#werkwijze`, `#over-ons`, `#vragen`, `#contact` |

Below the columns sits `div.container.footer-bottom.footer-legal` with three
paragraphs and no privacy link.

| Paragraph | Markup |
|---|---|
| Copyright | `&copy; <span id="jaar">2026</span> <span data-i18n="rechten">NewCONet. Alle rechten voorbehouden.</span>` |
| KvK | `<span data-i18n="kvk">KvK-nummer:</span> 00000000` |
| Btw | `<span data-i18n="btw">Btw-nummer:</span> NL000000000B00` |

The script sets `#jaar` to the current year, and the HTML carries the build
year as its fallback text.

### Sticky contact bar

At 720px and below a bar is fixed to the bottom of the viewport. It is a `nav`
holding three equal links.

| Key | Element | Dutch | English |
|---|---|---|---|
| `barLabel` | `aria-label` of `nav` | `Snel contact` | `Quick contact` |
| `barBellen` | `a` | `Bellen` | `Call` |
| `barMailen` | `a` | `Mailen` | `Email` |
| `barContact` | `a.contact-bar-offerte` | `Contact` | `Contact` |

| Key | Target |
|---|---|
| `barBellen` | `tel:+31621105502` |
| `barMailen` | `mailto:info@newconet.nl` |
| `barContact` | `#contactformulier`, with `class="contact-bar-offerte"` and `data-onderwerp="partner"`; accent background |

The bar is 64px tall plus the bottom safe-area inset. The `body` gets the same
bottom padding, so the bar never covers the footer. Above 720px the bar is
`display: none`.

## Structured data

`index.html` carries two static `<script type="application/ld+json">` blocks in
its `head`. They stay Dutch when the page switches to English.

The first block is a `FAQPage` with `"inLanguage": "nl"`. Its `mainEntity`
holds one `Question` per FAQ item, in page order. Each question's `name` equals
the Dutch `summary` text, and its `acceptedAnswer` is an `Answer` whose `text`
equals the Dutch answer paragraph's text, character for character. A test
compares the two, so a change to an FAQ answer changes both places.

The second block is the `Organization`, exactly as follows.

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "NewCONet",
  "url": "https://newconet.apps.mitstack.dev/",
  "email": "info@newconet.nl",
  "telephone": "+31621105502",
  "description": "NewCONet levert internet en wifi in multi-tenant kantoorgebouwen en complete appartementencomplexen, en internet voor gebouwgebonden systemen. NewCONet werkt voor eigenaren, beheerders en VvE’s, niet voor particulieren.",
  "audience": {
    "@type": "BusinessAudience",
    "name": "Eigenaren, beheerders en VvE’s van kantoorgebouwen en appartementencomplexen"
  },
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "customer support",
    "telephone": "+31621105502",
    "email": "info@newconet.nl",
    "hoursAvailable": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      "opens": "08:30",
      "closes": "17:30"
    }
  }
}
```

## The contact form

The site has no backend, and the form never pretends to send anything.
Submitting a valid form opens the visitor's own email program with a prefilled
message to `info@newconet.nl`. The visitor sends that email themselves. The
form says so before and after submitting, and it keeps every entered value, so
nothing is lost when no email program opens.

### Form copy

| Key | Element | Dutch | English |
|---|---|---|---|
| `formTitel` | `h3` | `Stuur ons een bericht` | `Send us a message` |
| `formIntro` | `p.form-intro` | `Vul het formulier in. Daarna opent uw e-mailprogramma een e-mail aan info@newconet.nl met uw bericht. Die e-mail verstuurt u zelf.` | `Fill in the form. Your email app then opens an email to info@newconet.nl with your message. You send that email yourself.` |
| `lblRol` | `label` | `Wie bent u?` | `Who are you?` |
| `rolKies` | `option` | `Kies uw rol` | `Choose your role` |
| `rolEigenaar` | `option` | `Eigenaar van het gebouw` | `Owner of the building` |
| `rolBeheerder` | `option` | `Beheerder van het gebouw` | `Manager of the building` |
| `rolVve` | `option` | `Bestuur van een VvE` | `Board of an owners’ association (VvE)` |
| `rolBewoner` | `option` | `Bewoner of huurder` | `Resident or tenant` |
| `bewonerKop` | `p.storing-melding-kop` | `Neem contact op met uw eigenaar, beheerder of VvE` | `Please contact your owner, manager or owners’ association` |
| `bewonerTekst` | `p` | `NewCONet maakt de afspraken over internet met de eigenaar, de beheerder of de VvE van een gebouw, niet met individuele bewoners of huurders. Zij kunnen contact met ons opnemen.` | `NewCONet makes its internet arrangements with the owner, manager or owners’ association of a building, not with individual residents or tenants. They can get in touch with us.` |
| `formLegend` | `legend` | `Waarmee kunnen wij u helpen?` | `How can we help you?` |
| `optPartner` | `span` | `Kennismaking of offerte voor mijn gebouw` | `Introduction or quote for my building` |
| `optStoring` | `span` | `Storing of ondersteuning` | `Outage or support` |
| `optVraag` | `span` | `Algemene vraag` | `General question` |
| `lblGebouw` | `span` | `Om welk type gebouw gaat het?` | `What type of building is it?` |
| `optioneel` | `span.field-optional` | `(optioneel)` | `(optional)` |
| `gebouwOnbekend` | `option` | `Nog niet bekend` | `Not known yet` |
| `gebouwKantoor` | `option` | `Multi-tenant kantoorgebouw` | `Multi-tenant office building` |
| `gebouwAppartement` | `option` | `Appartementencomplex` | `Apartment complex` |
| `gebouwBusinesscenter` | `option` | `Businesscenter` | `Business centre` |
| `gebouwAnders` | `option` | `Anders` | `Other` |
| `lblNaam` | `label` | `Naam` | `Name` |
| `lblOrganisatie` | `label` | `Naam van uw organisatie of VvE` | `Name of your organisation or owners’ association` |
| `lblEmailadres` | `label` | `E-mailadres` | `Email address` |
| `lblTelefoonnummer` | `span` | `Telefoonnummer` | `Phone number` |
| `optioneel3` | `span.field-optional` | `(optioneel)` | `(optional)` |
| `telefoonveldHint` | `p.field-hint` | `Handig als wij u willen terugbellen.` | `Useful if we need to call you back.` |
| `lblBericht` | `label` | `Bericht` | `Message` |
| `berichtHint` | `p.field-hint` | `Maximaal 1500 tekens.` | `Up to 1,500 characters.` |
| `formKnop` | `button.btn` | `Open dit bericht in uw e-mailprogramma` | `Open this message in your email app` |

The elements below are not in the mock. They carry over from the current form
with new copy, and their keys are new. The outage notice reuses sentences that
the outage band already states, so it adds no new claims.

| Key | Element | Dutch HTML | English value |
|---|---|---|---|
| `storingMeldingKop` | `p.storing-melding-kop` | `Storing? Bel ons op werkdagen` | `Outage? Call us on working days` |
| `storingMeldingTekst` | `p` | `Voor klanten zijn wij bereikbaar van maandag tot en met vrijdag, van 08:30 tot 17:30. Heeft u een SLA met ons afgesloten? Dan geldt wat daarin staat.` | `For customers, we are available Monday to Friday, from 08:30 to 17:30. If you have an SLA with us, its terms apply.` |
| `belKnop3` | `a.btn.btn-alert` | `Bel +31 (0)6 21 10 55 02` | `Call +31 (0)6 21 10 55 02` |
| `storingMeldingBewoner` | `p.storing-melding-rest` | `Woont u in een appartementencomplex? Meld een storing dan bij de eigenaar, de beheerder of de VvE van uw complex.` | `If you live in an apartment complex, please report an outage to the owner, manager or owners’ association of your complex.` |
| `bevestigingTitel` | `h4#bevestiging-titel` | `Nog één stap: verstuur de e-mail` | `One more step: send the email` |
| `bevestigingTekst` | `p` | `Uw e-mailprogramma opent een nieuwe e-mail aan info@newconet.nl met uw bericht erin. Pas als u die e-mail verstuurt, ontvangen wij uw bericht.` | `Your email app opens a new email to info@newconet.nl with your message in it. We only receive your message once you send that email.` |
| `bevestigingFallback` | `p` | `Is er geen e-mail geopend? Kopieer dan uw bericht en mail het naar <a href="mailto:info@newconet.nl" aria-label="Mail naar info@newconet.nl">info@newconet.nl</a>. U kunt ons op werkdagen ook bellen op <a href="tel:+31621105502" aria-label="Bel +31 (0)6 21 10 55 02">+31 (0)6 21 10 55 02</a>.` | `If no email opened, copy your message and email it to <a href="mailto:info@newconet.nl" aria-label="Email info@newconet.nl">info@newconet.nl</a>. You can also call us on <a href="tel:+31621105502" aria-label="Call +31 (0)6 21 10 55 02">+31 (0)6 21 10 55 02</a> on working days.` |
| `berichtKopieLabel` | `label.visually-hidden` for `#bericht-kopie` | `Uw bericht` | `Your message` |
| `kopieerKnop` | `button#kopieer-bericht` | `Kopieer bericht` | `Copy message` |
| `mailtoOpnieuw` | `a#mailto-opnieuw` | `Open de e-mail opnieuw` | `Open the email again` |

### Fields and their order

The form is `form#contactformulier.contact-form` with `novalidate`,
`tabindex="-1"` and `aria-labelledby="formulier-titel"`. The heading and the
intro paragraph come first, then these parts in DOM order.

| Order | Part | Control and attributes | Required |
|---|---|---|---|
| 1 | `div.form-field`, label `lblRol` | `select#rol`, `name="rol"`, `aria-describedby="rol-fout"`; options `""` (`rolKies`), `eigenaar`, `beheerder`, `vve`, `bewoner`; then `p.field-error#rol-fout` | Yes |
| 2 | `div.storing-melding#bewoner-melding`, `hidden` | `p.storing-melding-kop` with `bewonerKop`, then `p` with `bewonerTekst` | none |
| 3 | `div#formulier-rest` | Holds parts 4 to 13 | none |
| 4 | `fieldset.keuze-groep#onderwerp-groep`, legend `formLegend` | `aria-describedby="onderwerp-fout"`; three `label.keuze-optie` radios `name="onderwerp"`: `partner`, `storing`, `vraag`, none checked; each label text in a `span` with its key; then `p.field-error#onderwerp-fout` | Yes |
| 5 | `div.storing-melding#storing-melding`, `hidden` | `storingMeldingKop`, `storingMeldingTekst`, the `belKnop3` button to `tel:+31621105502`, `storingMeldingBewoner` | none |
| 6 | `div.form-field`, label `lblGebouw` plus `span.field-optional` `optioneel` | `select#gebouw`, `name="gebouw"`; options `""` (`gebouwOnbekend`), `kantoor`, `appartement`, `businesscenter`, `anders` | No |
| 7 | `div.form-field`, label `lblNaam` | `input#naam`, `type="text"`, `autocomplete="name"`, `aria-describedby="naam-fout"`; then `p.field-error#naam-fout` | Yes |
| 8 | `div.form-field`, label `lblOrganisatie` | `input#bedrijf`, `name="bedrijf"`, `type="text"`, `autocomplete="organization"`, `aria-describedby="bedrijf-fout"`; then `p.field-error#bedrijf-fout` | Yes |
| 9 | `div.form-field`, label `lblEmailadres` | `input#email`, `type="email"`, `autocomplete="email"`, `aria-describedby="email-fout"`; then `p.field-error#email-fout` | Yes |
| 10 | `div.form-field`, label `lblTelefoonnummer` plus `span.field-optional` `optioneel3` | `input#telefoon`, `type="tel"`, `autocomplete="tel"`, `aria-describedby="telefoon-hint telefoon-fout"`; `p.field-hint#telefoon-hint`, then `p.field-error#telefoon-fout` | No |
| 11 | `div.form-field`, label `lblBericht` | `textarea#bericht`, 5 rows, `maxlength="1500"`, `aria-describedby="bericht-hint bericht-fout"`; `p.field-hint#bericht-hint`, then `p.field-error#bericht-fout` | Yes |
| 12 | Submit | `button.btn.btn-primary`, `type="submit"`, key `formKnop` | none |
| 13 | `div.form-bevestiging#formulier-bevestiging`, `hidden` | The confirmation panel, specified below | none |
| 14 | `p.form-status#formulier-status` | `role="status"`, empty at load | none |
| 15 | `noscript` | `p.form-status` with the Dutch message below | none |

Required fields carry no marker, and optional fields carry `(optioneel)`
inside the label, so the word is part of the accessible name. Each error
element is `hidden` while empty.

The status region sits outside `#formulier-rest`, so it stays in the page and
can still announce when the rest of the form is hidden. The confirmation panel
sits inside, so it hides with the fields it belongs to.

The message is capped at 1500 characters because the whole message travels
inside the mailto link, and mail programs differ in the link length they
accept.

### Residents and tenants

NewCONet does not work for private individuals, so the form stops a resident
before they type anything.

1. When `#rol` changes to `bewoner`, `#bewoner-melding` shows, `#formulier-rest` gets `hidden`, and the status region announces `status.bewoner`.
2. With `#formulier-rest` hidden, no submit button and no text field is reachable, so nothing can be submitted.
3. When `#rol` changes to any other value, `#bewoner-melding` hides and `#formulier-rest` shows again with every earlier value intact. The status region clears if it held `status.bewoner`.
4. A prefill link clicked while `bewoner` is chosen still sets the radio and building type, but leaves `#rol` and both visibility states alone.

As a guard, `validate` also rejects `bewoner`, so no code path can build a
mailto for a resident.

### The outage notice inside the form

When `storing` is checked, `#storing-melding` shows directly below the radio
group. It hides again as soon as another choice is checked. The notice appears
visually, so the status region announces `status.storing` to make the change
audible too. The rest of the form stays usable, since a customer may still
write about an outage.

### Prefilling from links

Any link carrying `data-onderwerp` prefills the form when it is clicked. The
link's own `href` still scrolls to the form, with or without script.

1. The click checks the radio whose value equals `data-onderwerp`.
2. When the link also carries `data-gebouw`, the click selects that option in `#gebouw`. A link without it leaves `#gebouw` unchanged.
3. The outage notice shows or hides to match the checked radio.
4. After a failed submit, the radio group re-validates.
5. Focus is not moved into a field, so a phone keyboard does not pop up over the form.

The form carries `scroll-margin-top` of the header height plus 16px, so the
sticky header never covers the form's heading after the jump.

| Link, by key | `data-onderwerp` | `data-gebouw` |
|---|---|---|
| `heroCta1` | `partner` | none |
| `routeKantoorKnop` | `partner` | `kantoor` |
| `routeAppKnop` | `partner` | `appartement` |
| `dienst1Link` | `partner` | `kantoor` |
| `dienst2Link` | `partner` | `appartement` |
| `dienstWifiLink`, `dienst3Link`, `dienst4Link`, `dienst6Link` | `partner` | none |
| `dienstMaatwerkLink` | `partner` | `businesscenter` |
| `dienst5Link` | `vraag` | none |
| `voorWie1Knop` | `partner` | `kantoor` |
| `voorWie2Knop` | `partner` | `appartement` |
| `werkwijzeKnop` | `partner` | none |
| The link inside `faqIntro` | `vraag` | none |
| `barContact` | `partner` | none |

No link carries `data-dienst`, and the form has no `select#dienst`.

### Validation

The form validates in script, and `novalidate` suppresses the browser's own
bubbles. Every value is trimmed first, so whitespace alone counts as empty.
The messages come from `TEKSTEN.<taal>.fouten`, in the page's current
language.

| Field | Rule | `fouten` key | Dutch | English |
|---|---|---|---|---|
| `rol` | Not empty | `rol` | `Kies uw rol.` | `Choose your role.` |
| `rol` | Not `bewoner` | `rolBewoner` | `Neem contact op met de eigenaar, de beheerder of de VvE van uw gebouw.` | `Please contact the owner, manager or owners’ association of your building.` |
| `onderwerp` | One radio checked | `onderwerp` | `Kies waarmee wij u kunnen helpen.` | `Choose how we can help you.` |
| `naam` | Not empty | `naam` | `Vul uw naam in.` | `Enter your name.` |
| `bedrijf` | Not empty | `bedrijf` | `Vul de naam van uw organisatie of VvE in.` | `Enter the name of your organisation or owners’ association.` |
| `email` | Not empty | `emailLeeg` | `Vul uw e-mailadres in.` | `Enter your email address.` |
| `email` | Matches `^[^\s@]+@[^\s@]+\.[^\s@]+$` | `emailFout` | `Vul een geldig e-mailadres in, bijvoorbeeld naam@bedrijf.nl.` | `Enter a valid email address, for example name@company.com.` |
| `telefoon` | Empty, or only digits, spaces, `+`, `-`, `(` and `)` with at least 8 digits | `telefoon` | `Vul een geldig telefoonnummer in, of laat dit veld leeg.` | `Enter a valid phone number, or leave this field empty.` |
| `bericht` | Not empty | `bericht` | `Vul uw bericht in.` | `Enter your message.` |

`gebouw` is never invalid. A value outside the five options counts as empty.

The form order for validation and focus is `rol`, `onderwerp`, `naam`,
`bedrijf`, `email`, `telefoon`, `bericht`. On submit with any invalid field,
the form does the following.

1. Each invalid field shows its message in its `-fout` element and gets `aria-invalid="true"`; for the request type, the fieldset gets it.
2. The status region shows `status.onvolledig` in the error colour.
3. Focus moves to the first invalid field in form order, which for the request type is its first radio.
4. No mailto link opens and no confirmation shows.

After the first failed submit, each field re-validates as the visitor types or
changes it. A fixed field loses its message and its `aria-invalid` at once.
Before the first submit, nothing is validated, so a visitor is never scolded
mid-typing.

### Status messages

The status region shows one message at a time, from `TEKSTEN.<taal>.status`.

| `status` key | When | Dutch | English |
|---|---|---|---|
| `onvolledig` | A submit with invalid fields; error colour | `Het formulier is nog niet compleet. Controleer de gemarkeerde velden.` | `The form is not complete yet. Check the highlighted fields.` |
| `storing` | The visitor checks `storing` | `Storing? Bel ons op werkdagen tussen 08:30 en 17:30 op +31 (0)6 21 10 55 02.` | `Outage? Call us on +31 (0)6 21 10 55 02 on working days between 08:30 and 17:30.` |
| `bewoner` | The visitor chooses `bewoner` | `NewCONet maakt geen afspraken met individuele bewoners of huurders. Neem contact op met de eigenaar, de beheerder of de VvE van uw gebouw.` | `NewCONet does not make arrangements with individual residents or tenants. Please contact the owner, manager or owners’ association of your building.` |
| `geopend` | A valid submit | `Uw e-mailprogramma wordt geopend. Verstuur de e-mail, dan ontvangen wij uw bericht.` | `Your email app is opening. Send the email and we will receive your message.` |
| `gekopieerd` | `Kopieer bericht` succeeds | `Bericht gekopieerd.` | `Message copied.` |
| `kopieerFout` | The clipboard refuses; error colour | `Kopiëren is niet gelukt. Selecteer de tekst en kopieer hem zelf.` | `Copying failed. Select the text and copy it yourself.` |

The `storing` message clears when another radio is checked, and the
`onvolledig` message clears once every field is valid again.

### Building the email

A valid submit builds one mailto URL to `info@newconet.nl` with a `subject` and
a `body` parameter, in the page's current language. Both are encoded with
`encodeURIComponent`, so a space becomes `%20` and never `+`.

The subject depends on the request type. When a building type other than
`anders` is chosen, `: <building label>` is appended, using the `gebouwen`
label in the same language.

| `onderwerp` | Dutch subject | English subject |
|---|---|---|
| `partner` | `Kennismaking of offerte via de website` | `Introduction or quote via the website` |
| `storing` | `Storing of ondersteuning via de website` | `Outage or support via the website` |
| `vraag` | `Vraag via de website` | `Question via the website` |

| `gebouw` | Dutch label | English label |
|---|---|---|
| `kantoor` | `Multi-tenant kantoorgebouw` | `Multi-tenant office building` |
| `appartement` | `Appartementencomplex` | `Apartment complex` |
| `businesscenter` | `Businesscenter` | `Business centre` |
| `anders` | `Anders` | `Other` |

The body joins its lines with CRLF (`\r\n`). The line for an empty optional
field is left out: `Gebouw` when no building type is chosen, `Telefoon` when
the phone field is empty. The values of `Rol`, `Onderwerp` and `Gebouw` are the
visible option and radio labels.

| `regels` key | Dutch label | English label |
|---|---|---|
| `rol` | `Rol` | `Role` |
| `onderwerp` | `Onderwerp` | `Topic` |
| `gebouw` | `Gebouw` | `Building` |
| `naam` | `Naam` | `Name` |
| `organisatie` | `Organisatie` | `Organisation` |
| `email` | `E-mailadres` | `Email address` |
| `telefoon` | `Telefoon` | `Phone` |
| `bericht` | `Bericht` | `Message` |

For a full Dutch form the body reads as follows.

```text
Rol: Eigenaar van het gebouw
Onderwerp: Kennismaking of offerte voor mijn gebouw
Gebouw: Multi-tenant kantoorgebouw
Naam: Jan de Vries
Organisatie: Voorbeeld Vastgoed BV
E-mailadres: jan@voorbeeld.nl
Telefoon: 06 12345678

Bericht:
Wij zoeken internet voor de huurders in ons kantoorgebouw.
```

Its subject is `Kennismaking of offerte via de website: Multi-tenant
kantoorgebouw`, and the finished link starts with the string below.

```text
mailto:info@newconet.nl?subject=Kennismaking%20of%20offerte%20via%20de%20website%3A%20Multi-tenant%20kantoorgebouw&body=Rol%3A%20Eigenaar%20van%20het%20gebouw%0D%0A
```

The mail building and validation live in pure functions that `main.js`
exports, so tests can call them without a browser. The DOM wiring runs only
when the module loads in a page.

| Export | Takes | Returns |
|---|---|---|
| `validate(fields, taal = 'nl')` | `{ rol, onderwerp, gebouw, naam, bedrijf, email, telefoon, bericht }`, raw strings, and `'nl'` or `'en'` | An object mapping each invalid field name to its message in that language; empty when valid |
| `buildMailto(fields, taal = 'nl')` | The same object, already valid, and the language | `{ subject, body, href }` |
| `init(doc, { navigate, clipboard })` | The document, and optional stand-ins for navigation and the clipboard | Nothing; wires the menu, the language switch and the form |

### Confirmation and fallback

After a valid submit, the page sets the location to the mailto URL and shows
the confirmation panel. The page cannot know whether an email program opened,
because a browser reports nothing back from a mailto link. The confirmation
therefore describes the next step and offers a fallback in the same view.

1. The status region announces `status.geopend`.
2. `#formulier-bevestiging` becomes visible below the submit button.
3. Focus moves to its heading `h4#bevestiging-titel`, which has `tabindex="-1"`.
4. The form keeps every value; nothing resets.

The panel holds, in order, `bevestigingTitel`, `bevestigingTekst`,
`bevestigingFallback`, the hidden label `berichtKopieLabel`, the read-only
`textarea#bericht-kopie` with 8 rows holding the exact email body, and
`div.bevestiging-acties` with `button#kopieer-bericht.btn.btn-secondary` and
`a#mailto-opnieuw`. The `href` of `#mailto-opnieuw` is the same mailto URL.

`Kopieer bericht` writes the body to the clipboard. On success the status
region shows `status.gekopieerd`. When the clipboard refuses, the textarea's
text is selected and the status region shows `status.kopieerFout` in the error
colour.

A second valid submit rebuilds the body, the link and the textarea from the
current values and the current language. An invalid submit hides the panel
again.

### Without JavaScript

The phone, email and anchor links all work without script. The form and the
language button do not. The `noscript` paragraph inside the form stays Dutch,
since no language switch runs without script.

| Element | Copy |
|---|---|
| `noscript > p.form-status` | `Dit formulier werkt alleen met JavaScript. Mail ons op info@newconet.nl, of bel ons op werkdagen tussen 08:30 en 17:30 op +31 (0)6 21 10 55 02.` |

## States the page shows

The page fetches nothing, so it has no loading state and no empty state. Its
states are the two languages, the form's states, the menu, and the page at its
densest. The frames are in `.local-screenshots/internetdiensten/`. The `phone-3*`
and `tablet-768-*` frames show the mock with this spec's header fix applied.

| State | What the visitor sees | Frame |
|---|---|---|
| Desktop, Dutch | Header with five nav links, `EN`, `Storing?` and `Neem contact op`; hero text beside the illustration | `desktop-nl-top.png` |
| Desktop, English | The same in English, with `NL` in the header | `desktop-en-top.png` |
| Small desktop at 1024px, both languages | Inline nav, the language button without its globe icon, hero text beside the illustration | `tablet-nl-top.png`, `tablet-en-top.png` |
| Tablet at 768px, both languages | Collapsed nav, the language button with its globe, `Storing?` and `Neem contact op`; hero illustration below the text | `tablet-768-nl-top.png`, `tablet-768-en-top.png` |
| Phone, both languages | `EN` or `NL`, `Storing?` and the toggle in the header; sticky bar at the bottom | `phone-nl-top.png`, `phone-en-top.png` |
| Phone header at 360px | Full wordmark, 44px toggle, nothing clipped | `phone-360-header.png` |
| Phone header at 320px | Hexagon without the wordmark, both buttons and the toggle | `phone-320-header.png` |
| Menu open | Five links below the header, focus on the first | `phone-360-menu-open.png` |
| Each section at 1440px, Dutch | Header, routes, services, who we serve, process, about, FAQ, outage band, contact, footer | `sec-1440-nl-header.png` and the nine other `sec-1440-nl-*.png` |
| Route chooser | Two partner cards and the customer card | `v-routes.png` |
| Who we serve | Three persona cards, then the two drawings with their cards | `v-voor-wie.png` |
| Resident chosen | `#bewoner-melding` below the role field, the rest of the form gone | `v-contact-bewoner.png` |
| Outage type chosen | Alert notice with the call button under the radios, status line below the form | No frame; the notice keeps its current look |
| Validation errors | Messages under each invalid field, red borders, status line | No frame; unchanged look |
| Confirmation | Panel with the next step, fallback, message copy and actions, then the status line | No frame; unchanged look |
| Dense FAQ | All fourteen answers open | No frame |

The dense form case is a 1500-character message with a long organisation name
and `Businesscenter` chosen. The textarea grows no wider than its column, and
the confirmation textarea scrolls inside itself. The densest English case is
the header at 961px, where the English nav is widest; it fits with the globe
icon hidden.

## Accessibility

The page meets WCAG 2.2 AA. Beyond the behaviour above, these requirements
hold.

| Area | Requirement |
|---|---|
| Language | `<html lang>` follows the page language; the language button carries the `lang` of the language it names |
| Landmarks | One `header`, one `main#inhoud`, one `footer`; the three `nav` elements have distinct labels in each language |
| Headings | One h1; sections use h2; cards, steps and the form heading use h3; the confirmation uses h4 |
| Focus | Every interactive element shows a 3px `:focus-visible` outline in `--color-focus`, offset 3px |
| Focus on dark ground | The hero, the outage band and the footer set `--color-focus` to white |
| Labels | Every control has a visible `label` or `legend`; placeholders are not used |
| Live region | `#formulier-status` has `role="status"`, sits outside `#formulier-rest` and is in the DOM from page load |
| Link names | Every link's purpose is clear from its text or its card's heading; service links carry a hidden suffix |
| Decorative content | Service, persona and button icons, the who-we-serve drawings, the logo SVG and CSS step and legend numbers are hidden from assistive technology |
| Informative image | The hero drawing is `role="img"` named by its `title`, and the legend repeats its content as text |
| Targets | Buttons, the menu toggle, sticky bar links and radio tiles are at least 44 by 44 CSS pixels |
| Motion | Under `prefers-reduced-motion: reduce`, smooth scrolling, transitions and hover lifts are off |
| Reflow | No horizontal scroll at 320px, which is 400% zoom of a 1280px window, in either language |

Apart from the logo, the accent colour appears as text only on the hero
eyebrow. There it measures 4.7:1 against the lightest point of the hero
gradient.

## Responsive behaviour

The breakpoints below come from real collisions in the mock, measured in both
languages.

| Width | Change |
|---|---|
| Above 1100px | Inline nav with 24px gaps; the language button shows its globe icon |
| 961px to 1100px | Nav gap drops to 16px; the language button hides its globe icon |
| 960px and below | Nav behind the toggle; hero becomes one column with the illustration below the text, aligned left; steps stacked; two-column footer |
| 860px and below | About and contact become one column; the details come before the form |
| 720px and below | Sticky contact bar shows; the header's `Neem contact op` hides; sections pad 64px; one-column footer |
| 400px and below | Container side padding drops to 16px; header, header-action and logo gaps drop to 6px; the logo text drops to 1.1rem; `Storing?` and the language button pad 8px 10px; the globe icon hides |
| 359px and below | The logo shows the hexagon without the wordmark; its accessible name is unchanged |

The mock fits 360px only by squeezing the menu toggle to 32px wide, and at
320px it scrolls sideways by 12px. The 400px and 359px rules above fix both,
and `.nav-toggle` gets `flex-shrink: 0` at every width. With them, the header
at 360px keeps 6px of slack in Dutch and 8px in English.

Every section carries `scroll-margin-top: var(--header-height)`, so anchor
jumps land below the sticky header.

## Styles to carry over

The mock's second `<style>` block is real CSS. Copy it into
`site/css/style.css`, apart from the mock-only rules named earlier, and apply
the changes below. `docs/design-system.md` documents every token and class.

| Change | Why |
|---|---|
| Add the tokens `--radius-pill: 999px` and `--hero-visual-max: 560px` to `:root` | The eyebrow and badge pills, and the illustration's width cap |
| Replace the grouped ground rule for `.routes`, `.werkwijze`, `.faq`, `.contact` and the `.over-ons` and `.stat` grounds with the mock's section-ground rules | The new section order needs new alternation |
| Replace `.contact-form > .btn` with `.contact-form [type="submit"]` | The submit button now sits inside `#formulier-rest`, so the child selector no longer matches it |
| Rename `.hero-storing` to `.hero-noot`, keep its rules, add `max-width: 560px`, and give `.hero-noot strong` the white text colour | The note is no outage line, and it should not run wider than the intro above it |
| Add `flex-shrink: 0` to `.nav-toggle` | Keeps the toggle 44px wide in a crowded header |
| Change the 400px rule to set `.header-inner`, `.header-actions` and `.logo` gaps to 6px and `.logo` to `font-size: 1.1rem` | Fits the header at 360px with slack |
| Add `@media (max-width: 359px) { .logo-text { display: none; } }` | Fits the header at 320px |
| Leave out `.mock-banner`, `.mock-todo`, `.site-footer .mock-todo` and `.form-privacy` | Mock-only, or waiting for the privacy statement |

## How the site is delivered

The site is static and served by the existing nginx container.

| File | Role |
|---|---|
| `site/index.html` | The whole page, in Dutch, with both structured-data blocks |
| `site/css/style.css` | The one stylesheet |
| `site/js/main.js` | The page script, loaded with `<script type="module" src="js/main.js">` |
| `site/js/i18n.js` | The English dictionary, the titles and the script's strings, imported by `main.js` |
| `site/assets/favicon.svg` | The favicon, unchanged |

The page uses no framework, no CDN, no external font and no analytics, and it
sets no cookies. It stores one localStorage value, the language choice.

## UX acceptance criteria

These are the behaviours tests pin down. Each is observable in a browser
without reading the code.

| Area | Criterion |
|---|---|
| Reach | At 360px and at 320px, `Storing?`, the language button and the menu toggle are visible without opening the menu, and the toggle is 44px wide |
| Reach | At 360px, the sticky bar shows `Bellen` to `tel:+31621105502`, `Mailen` to `mailto:info@newconet.nl` and `Contact` to `#contactformulier` |
| Reach | Above 720px the sticky bar is not displayed, and `Neem contact op` in the header links to `#contact` |
| Reach | `Storing?` links to `#storing`, whose section holds a `tel:+31621105502` link named `Bel +31 (0)6 21 10 55 02` |
| Structure | Sections appear in the order of the structure table, with the exact h1 and h2 texts |
| Structure | The header nav has exactly five links, to `#diensten`, `#voor-wie`, `#werkwijze`, `#over-ons` and `#vragen` |
| Structure | The route chooser has three cards with the exact h3s and actions, and the third card is `route-card--storing` |
| Structure | The services section has eight cards; the first is `dienst-card--uitgelicht` with a badge; every service link has a unique accessible name |
| Structure | Who we serve has three persona cards and two `voor-wie-card` elements with the exact h3s |
| Structure | The process section is an ordered list of five steps with the exact h3s |
| Structure | The FAQ has fourteen `details` items with the exact questions, all closed on load |
| Structure | The hero figure is `role="img"` named by `#hero-visual-titel`, followed by a legend of four items |
| Copy | Every Dutch text in the copy tables appears exactly; the footer bottom row shows `KvK-nummer: 00000000` and `Btw-nummer: NL000000000B00`; no privacy link or privacy line exists |
| Structured data | The `FAQPage` block has fourteen questions whose names and answers equal the page's Dutch FAQ texts in order; the `Organization` block equals the one in this spec |
| Language | The button shows `EN` with `lang="en"` and label `Switch to English (EN)` on a Dutch page, and `NL` with `lang="nl"` and label `Schakel naar Nederlands (NL)` on an English page |
| Language | Switching to English sets every `data-i18n` element and `data-i18n-aria` label to its `EN` value, sets `<html lang="en">` and `TITELS.en`, and switching back restores the Dutch HTML exactly |
| Language | Every `data-i18n` and `data-i18n-aria` key in `index.html` has an `EN` entry, and every `EN` entry is used |
| Language | `?lang=en` opens English; a stored `newconet-taal` of `en` opens English; a click stores the choice and removes the `lang` parameter |
| Language | A localStorage that throws on read and write leaves the page Dutch and the switch working |
| Language | With the menu open, switching language labels the toggle `Close menu` or `Menu sluiten` |
| Language | After a failed submit, switching language shows the visible field errors and the status message in the new language |
| Residents | Choosing `bewoner` shows `#bewoner-melding`, hides `#formulier-rest`, and writes `status.bewoner` to `#formulier-status`; choosing another role restores the form with its values |
| Prefill | Clicking `routeKantoorKnop` checks `partner` and selects `kantoor`; clicking `dienstMaatwerkLink` selects `businesscenter`; clicking `dienst5Link` checks `vraag` |
| Prefill | A link without `data-gebouw` leaves `#gebouw` unchanged |
| Outage | Checking `storing` shows `#storing-melding` with a call link and writes `status.storing`; checking another choice hides the notice and clears that message |
| Validation | Submitting an empty form shows the six required-field messages, sets `aria-invalid`, fills the status region and focuses `#rol` |
| Validation | `naam@bedrijf` shows the invalid-email message; `12ab` in Telefoonnummer shows the phone message; whitespace-only Naam, Organisatie or Bericht counts as empty |
| Validation | After a failed submit, fixing a field removes its message and `aria-invalid` without resubmitting |
| Email | A valid Dutch submit navigates to a mailto URL for `info@newconet.nl` whose decoded subject and body match the tables above; the same form in English uses the English subject and labels |
| Email | No building type and an empty phone field produce no `Gebouw` or `Telefoon` line |
| Email | `validate` and `buildMailto` are exported, take the language, and return the shapes in the exports table; `validate` rejects `bewoner` |
| Confirmation | A valid submit shows `#formulier-bevestiging`, focuses its heading, keeps all field values and fills `#bericht-kopie` with the body; `#mailto-opnieuw` carries the same URL |
| Confirmation | `Kopieer bericht` reports `status.gekopieerd`, or `status.kopieerFout` when the clipboard refuses |
| Menu | The toggle's `aria-expanded` and label follow the open state; opening focuses the first link; Escape closes and returns focus; a menu link closes the menu |
| Access | The first Tab stop is `Direct naar de inhoud`, which moves focus to `main#inhoud` |
| Access | At 320px and 360px, in both languages, `document.documentElement.scrollWidth` equals the viewport width |
| Access | Under reduced motion, `html` has `scroll-behavior: auto` |
| Honesty | No code path shows a sent or thank-you message |
| Footer | The footer repeats phone, email, address, hours and the SLA line; `#jaar` shows the current year |

## Open items for the owner

The page ships with the placeholders and claims below until the owner settles
them.

| Item | What the page does until then |
|---|---|
| The street address | Shows `Straatnaam 1, 0000 AA Plaatsnaam` |
| The KvK-nummer | Shows `00000000` |
| The btw-nummer | Shows `NL000000000B00` |
| The legal company name, if it differs from `NewCONet` | Uses `NewCONet` in the copyright line and the structured data |
| A privacy statement | Has no privacy link and no privacy line in the form |
| Whether a quote is free of obligation | States it in the FAQ and the process step |
| Whether public holidays count as working days | Says `werkdagen` and `maandag tot en met vrijdag` without naming holidays |
| Whether residents report outages through their owner, manager or VvE | Sends residents there from the routes, the outage band, the contact section and the form |
| Whether a business tenant in an office building may contact NewCONet directly | Treats `Bewoner of huurder` as a private individual and blocks the form |
| The building-system examples: access control, lifts, climate installations, cameras | States them in services and the FAQ |
| The common-area examples: entrance, lobby, meeting rooms | States them in services and the FAQ |
| Personal contact, one point of contact, and maintenance and joint planning after handover | States them in the about list, the process and the FAQ |
| Support in English, and the Netherlands as the service area | States both in the structured data |
| The site's public URL | Uses `https://newconet.apps.mitstack.dev/` in the structured data |
