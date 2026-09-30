# UX spec for the NewCONet customer contact site

This spec defines the NewCONet one-page website for business customers. It is
the contract that `test-author` and `code-author` build from, so it fixes the
section order, the exact Dutch copy, the contact form's fields and behaviour,
and every state the page shows. `frontend-stylist` polishes toward it once the
tests are green.

The page serves three kinds of visitor. A prospect wants advice or a quote, an
existing customer has an outage, and someone else has a general question. Each
of them reaches the right contact route in one tap from the top of the page,
on a phone as well as on a desktop.

## What this spec is built from

The source is the company's current site: `index.html`, `css/style.css`,
`js/script.js` and `assets/favicon.svg`. The brand carries over unchanged. That
means the hexagon logo, the colours `#0b3d5c`, `#082a40` and `#1fb6d4`, the
formal "u" tone and the existing copy for the hero, services and about section.

The repository has no `docs/design-system.md` yet. Until it exists, the token
table in this spec is the contract, and the change that adds the site also
creates `docs/design-system.md` from that table, as `.claude/rules/frontend.md`
requires.

A clickable prototype settled the layout, states and copy. Its frames are
screenshots, so they stay out of git in `.local-screenshots/customer-contact-site/`,
and the prototype itself is discarded. The frames show intent: where a frame and
this text disagree, the text wins.

### Placeholders the owner replaces

Three contact details are placeholders. Keep them character for character, so
the owner can replace each with one find-and-replace across the three files.

| Detail | Displayed text | Link target |
|---|---|---|
| Phone | `+31 (0)00 000 00 00` | `tel:+31000000000` |
| Address | `Straatnaam 1, 0000 AA Plaatsnaam` | none |
| Email | `info@newconet.nl` | `mailto:info@newconet.nl` |

The email address and the opening hours `Ma–vr: 08:30 – 17:30` are real.

### Facts the page may state

The page invents no business facts. It states no response times, prices,
certifications, client names, testimonials, team members or KvK number. Every
claim on the page traces to a phrase in the source site.

| Claim on the page | Where the source supports it |
|---|---|
| 24/7 bereikbaar bij storing | The `24/7` stat in the about section |
| Offertes zijn vrijblijvend | The contact intro, "een vrijblijvende offerte" |
| Een enkel kantoor of meerdere vestigingen | The about section, second paragraph |
| Maatwerk in plaats van standaardoplossingen | The about section's list |
| Persoonlijk contact, geen callcenters | The about section's list |
| Afgestemd op uw pand en groeiplannen | The Netwerkaanleg card |
| Proactief beheer, storingen opgelost voordat u ze merkt | The Beheer & onderhoud card |
| Ook buiten kantoortijden en in het weekend | Derived from 24/7 |

The Glasvezel card keeps the source's own word "gecertificeerd". The page adds
no further certification claim.

## The three journeys

Each journey has an entry point visible without scrolling, at every width.

| Journey | Entry at the top, desktop | Entry at the top, phone | Where it ends |
|---|---|---|---|
| Prospect wants advice or a quote | Header button `Offerte aanvragen`, hero button `Vraag een offerte aan` | Sticky bar `Offerte`, hero button | The form, with `Offerte of advies` chosen |
| Customer with an outage | Header button `Storing?`, the hero's storing line | Header button `Storing?`, the hero's phone link, sticky bar `Bellen` | A phone call to the 24/7 number |
| General question | Nav link `Contact`, the route chooser | Sticky bar `Bellen` or `Mailen`, the route chooser | A call, an email, or the form with `Algemene vraag` chosen |

The prospect's fuller path runs through the services, the process steps and
the FAQ before the form. Every service card links to the form with that
service chosen, so a prospect never has to name the service twice.

The outage path never goes through the form. Every outage entry point either
dials the number or scrolls to the storing band, which shows the number as a
call button with the message that urgent outages go by phone.

## Page structure and section order

The page is one `index.html` with these regions, in this order. The `id` values
are anchor targets and test hooks, so keep them exactly.

| Order | Region | Element and `id` | Heading |
|---|---|---|---|
| 1 | Skip link | `a.skip-link` to `#inhoud` | none |
| 2 | Header | `header.site-header` | none |
| 3 | Hero | `section.hero#top` inside `main#inhoud` | h1 `Stevige netwerken. Zonder gedoe.` |
| 4 | Route chooser | `section.routes#wat-wilt-u-doen` | h2 `Wat wilt u doen?` |
| 5 | Services | `section.diensten#diensten` | h2 `Onze diensten` |
| 6 | Process steps | `section.werkwijze#werkwijze` | h2 `Zo werken wij` |
| 7 | About | `section.over-ons#over-ons` | h2 `Over NewCONet` |
| 8 | FAQ | `section.faq#vragen` | h2 `Veelgestelde vragen` |
| 9 | Outage band | `section.storing#storing` | h2 `Storing? Bel ons direct` |
| 10 | Contact | `section.contact#contact` | h2 `Neem contact op` |
| 11 | Footer | `footer.site-footer` | h2 `Contact`, h2 `Snel naar` |
| 12 | Sticky contact bar | `nav.contact-bar` | none |

The FAQ sits before the outage band and the contact section, so a prospect
reads the answers just before the form. The outage band sits directly above
the contact section, so a visitor who scrolls to "Contact" passes the phone
number before reaching the form.

`main#inhoud` carries `tabindex="-1"`, so the skip link moves focus into it.

## Copy and markup per region

All visible copy is Dutch and exact. The copy in code spans is what the page
shows, including punctuation.

### Skip link

The first focusable element on the page is `Direct naar de inhoud`, linking to
`#inhoud`. It is visually hidden until it receives focus, then appears at the
top left over the header.

### Header

The header is sticky, 72px tall, white, with a bottom border. Its DOM order is
logo, main nav, header actions, menu toggle.

| Element | Copy and target | Notes |
|---|---|---|
| Logo link | Hexagon SVG plus `New` `CO` `Net`, to `#top` | Accessible name `NewCONet, naar het begin van de pagina`; the SVG and the text are `aria-hidden` |
| Main nav | `Diensten`, `Werkwijze`, `Over ons`, `Vragen`, `Contact` | `nav#hoofdmenu` with `aria-label="Hoofdmenu"`; targets `#diensten`, `#werkwijze`, `#over-ons`, `#vragen`, `#contact` |
| Outage button | `Storing?`, to `#storing` | Visible at every width, including 360px |
| Quote button | `Offerte aanvragen`, to `#contactformulier` | Prefills `offerte`; hidden at 720px and below, where the sticky bar carries it |
| Menu toggle | Three bars | Shown at 960px and below; see the menu behaviour below |

The logo SVG is the source header's inline SVG, unchanged, including its
gradient that reads the colour tokens.

### How the mobile menu behaves

At 960px and below the nav collapses behind the toggle. The toggle is a
`button#nav-toggle` with `aria-controls="hoofdmenu"`.

1. Closed, the toggle has `aria-expanded="false"` and the label `Menu openen`, and the menu is `display: none`, so its links are out of the tab order.
2. Activating the toggle opens the menu below the header, sets `aria-expanded="true"` and the label `Menu sluiten`, and moves focus to the first menu link, `Diensten`.
3. Activating the toggle again closes the menu and leaves focus on the toggle.
4. Pressing Escape while the menu is open closes it and returns focus to the toggle.
5. Following any menu link closes the menu.
6. Above 960px the nav always shows inline and the toggle is hidden. A menu left open when the window widens is reset to closed.

Focus moves into the menu on open because the nav precedes the toggle in the
DOM. Without that move, the next Tab after opening would skip the links.

### Hero

| Element | Copy |
|---|---|
| h1 | `Stevige netwerken.` line break `Zonder gedoe.` |
| Intro | `NewCONet ontwerpt, legt aan en beheert bedrijfsnetwerken die het gewoon altijd doen — van kantoor tot bedrijventerrein.` |
| Primary button | `Vraag een offerte aan`, to `#contactformulier`, prefills `offerte` |
| Secondary button | `Bekijk onze diensten`, to `#diensten` |
| Outage line | `Storing? Wij zijn 24/7 bereikbaar:` followed by the phone link `+31 (0)00 000 00 00` |

The outage line gives a customer with an outage a one-tap call from the first
screen, without competing with the quote button.

### Route chooser

The h2 is `Wat wilt u doen?` with the intro `Kies wat bij u past.` Three cards
follow, each an `article.route-card` with an h3, a sentence and one action.

| Card | h3 | Body | Action |
|---|---|---|---|
| Quote | `Advies of een offerte` | `U wilt een netwerk laten aanleggen, uitbreiden of verbeteren. Vertel ons wat u nodig heeft en vraag een vrijblijvende offerte aan.` | Button `Offerte aanvragen`, to `#contactformulier`, prefills `offerte` |
| Outage | `Storing melden` | `Werkt uw netwerk niet zoals het hoort? Bel ons: bij een storing zijn wij 24/7 bereikbaar. Meld een storing niet via het formulier of per e-mail.` | Button `Bel +31 (0)00 000 00 00`, to `tel:+31000000000` |
| Question | `Een vraag stellen` | `Heeft u een vraag over uw netwerk of onze diensten? Bel of mail ons op werkdagen van 08:30 tot 17:30, of stuur een bericht.` | Button `Stuur een bericht`, to `#contactformulier`, prefills `vraag`; below it `Of mail naar info@newconet.nl` with the address as a mailto link |

The outage card uses the modifier `route-card--storing`, with the alert colour
on its top border and the alert background.

### Onze diensten

The h2 is `Onze diensten` and the intro is `Van het eerste kabeltje tot 24/7
monitoring: wij regelen het complete netwerk.` Six `article.dienst-card`
elements follow, in the source order and with the source copy unchanged.

| h3 | Body | `data-dienst` value |
|---|---|---|
| `Netwerkaanleg` | `Ontwerp en installatie van bekabelde en draadloze netwerken, afgestemd op uw pand en groeiplannen.` | `netwerkaanleg` |
| `Zakelijk WiFi` | `Dekkend, snel en stabiel WiFi voor kantoren, winkels en bedrijfshallen — ook op de moeilijke plekken.` | `zakelijk-wifi` |
| `Glasvezel & bekabeling` | `Aanleg van glasvezel- en datanetwerken, gecertificeerd en toekomstbestendig aangelegd.` | `glasvezel-bekabeling` |
| `Beheer & onderhoud` | `Proactief beheer van uw netwerk, zodat storingen worden opgelost voordat u ze merkt.` | `beheer-onderhoud` |
| `Netwerkbeveiliging` | `Firewalls, segmentatie en monitoring om uw bedrijfsnetwerk veilig en compliant te houden.` | `netwerkbeveiliging` |
| `Cloud & connectiviteit` | `Koppeling van uw netwerk met cloudomgevingen en meerdere vestigingen, snel en betrouwbaar.` | `cloud-connectiviteit` |

Each card keeps the source emoji icon, marked `aria-hidden="true"`. Each card
ends with a link `a.dienst-link` to `#contactformulier`, carrying
`data-onderwerp="offerte"` and its `data-dienst` value. The visible text is
`Offerte aanvragen`, followed by a visually hidden ` voor <dienst>`. The
accessible name is therefore unique per card, for example `Offerte aanvragen
voor Zakelijk WiFi`.

### Zo werken wij

The h2 is `Zo werken wij` and the intro is `Van het eerste contact tot het
dagelijkse beheer: zo verloopt een samenwerking met NewCONet.` The steps are an
`ol.stappen` of five `li.stap`, each with an h3 and one paragraph. The step
number comes from a CSS counter. The steps name no timeframes.

| Step | h3 | Body |
|---|---|---|
| 1 | `Contact` | `U belt, mailt of stuurt een bericht. U heeft direct persoonlijk contact met ons, geen callcenter.` |
| 2 | `Kennismaking en inventarisatie` | `We bespreken uw situatie en brengen uw pand, uw huidige netwerk en uw groeiplannen in kaart.` |
| 3 | `Voorstel en offerte` | `U ontvangt een voorstel op maat met een vrijblijvende offerte. Maatwerk, geen standaardoplossing.` |
| 4 | `Aanleg` | `Wij ontwerpen en installeren uw bekabelde en draadloze netwerk, afgestemd op uw pand.` |
| 5 | `Beheer` | `Wij beheren uw netwerk proactief, zodat storingen worden opgelost voordat u ze merkt. Bij een storing zijn wij 24/7 bereikbaar.` |

Below the list sits the button `Vraag een offerte aan`, to `#contactformulier`,
prefilling `offerte`. Above 960px the five steps sit in one row, and at 960px
and below they stack with the number to the left.

### Over NewCONet

The about section keeps the source copy unchanged: the h2 `Over NewCONet`, both
paragraphs, and the three list items `Persoonlijk contact, geen callcenters`,
`Maatwerk in plaats van standaardoplossingen` and `Snelle service bij
storingen`.

The stats become a `ul.over-ons-stats` of three `li.stat`, so a screen reader
announces them as a list of three. The values are `10+` with `jaar ervaring`,
`100%` with `persoonlijke aanpak`, and `24/7` with `bereikbaar bij storing`.

### Veelgestelde vragen

The h2 is `Veelgestelde vragen`. The intro is `Staat uw vraag er niet bij?`
followed by the link `Stel hem ons direct`, to `#contactformulier`, prefilling
`vraag`.

Each question is a native `details.faq-item` with a `summary`. The native
element gives keyboard and screen reader support without script. All items
start closed.

| Question | Answer |
|---|---|
| `Is een offerte vrijblijvend?` | `Ja. Een offerte van NewCONet is vrijblijvend. U vraagt hem aan via het formulier onderaan deze pagina, per e-mail of telefonisch.` |
| `Werkt NewCONet ook voor een bedrijf met één kantoor?` | `Ja. Of het nu gaat om een enkel kantoor of meerdere vestigingen, wij zorgen voor een netwerk dat meegroeit met uw organisatie.` |
| `Kunnen jullie meerdere vestigingen met elkaar verbinden?` | `Ja. Met Cloud & connectiviteit koppelen wij uw netwerk aan cloudomgevingen en aan uw andere vestigingen.` |
| `Wat doe ik bij een storing?` | `Bel ons op +31 (0)00 000 00 00. Bij een storing zijn wij 24/7 telefonisch bereikbaar. Meld een urgente storing niet via het formulier of per e-mail.` The number is a `tel:` link. |
| `Werken jullie met standaardpakketten?` | `Nee. Wij leveren maatwerk in plaats van standaardoplossingen, afgestemd op uw pand en uw groeiplannen.` |
| `Wanneer zijn jullie bereikbaar?` | `Op werkdagen, van maandag tot en met vrijdag, van 08:30 tot 17:30. Bij een storing zijn wij 24/7 telefonisch bereikbaar.` |
| `Krijg ik een callcenter aan de lijn?` | `Nee. Bij NewCONet heeft u persoonlijk contact, geen callcenter.` |

### Outage band

The outage band is a full-width dark section on `--color-primary-dark`.

| Element | Copy |
|---|---|
| h2 | `Storing? Bel ons direct` |
| Paragraph | `Bij een storing zijn wij 24/7 telefonisch bereikbaar, ook buiten kantoortijden en in het weekend.` |
| Key message, bold white | `Meld een urgente storing altijd telefonisch, niet via het contactformulier of per e-mail.` |
| Button | `Bel +31 (0)00 000 00 00`, to `tel:+31000000000`, class `btn btn-alert` |

### Neem contact op

The contact section keeps the source's two columns: details on the left, the
form on the right. The h2 is `Neem contact op` and the intro is the source's
`Heeft u vragen over uw bedrijfsnetwerk of wilt u een vrijblijvende offerte?
Neem gerust contact op.`

The details list keeps the source's four entries, with one addition under the
phone number.

| Label | Value | Extra line |
|---|---|---|
| `Telefoon` | `+31 (0)00 000 00 00` as a `tel:` link | `24/7 bereikbaar bij storing` |
| `E-mail` | `info@newconet.nl` as a `mailto:` link | none |
| `Adres` | `Straatnaam 1, 0000 AA Plaatsnaam` | none |
| `Openingstijden` | `Ma–vr: 08:30 – 17:30` | none |

The form is specified in its own section below.

### Footer

The footer has three columns above 960px, two at 960px and below, and one at
720px and below.

| Column | Content |
|---|---|
| Brand | The `NewCONet` logotype and `Netwerkoplossingen voor bedrijven: aanleg, beheer en beveiliging.` |
| Contact | h2 `Contact`, then `Telefoon: +31 (0)00 000 00 00` as a link, `E-mail: info@newconet.nl` as a link, the address, `Ma–vr: 08:30 – 17:30` and `Storing: 24/7 telefonisch bereikbaar` |
| Links | `nav` with `aria-label="Voettekst"`, h2 `Snel naar`, and the five nav links from the header |

Below the columns sits `© <jaar> NewCONet. Alle rechten voorbehouden.` The year
is in `span#jaar`. The script sets it to the current year, and the HTML carries
the build year as its fallback text.

### Sticky contact bar

At 720px and below a bar is fixed to the bottom of the viewport. It is a `nav`
with `aria-label="Snel contact"` holding three equal links.

| Link | Target |
|---|---|
| `Bellen` | `tel:+31000000000` |
| `Mailen` | `mailto:info@newconet.nl` |
| `Offerte` | `#contactformulier`, prefills `offerte`; accent background |

The bar is 64px tall plus the bottom safe-area inset. The `body` gets the same
bottom padding, so the bar never covers the footer. Above 720px the bar is
`display: none`.

## The contact form

The site has no backend, and the form never pretends to send anything.
Submitting a valid form opens the visitor's own email program with a prefilled
message to `info@newconet.nl`. The visitor sends that email themselves. The form
says so before and after submitting, and it keeps every entered value, so
nothing is lost when no email program opens.

### Fields

The form is `form#contactformulier.contact-form` with `novalidate`,
`tabindex="-1"` and `aria-labelledby="formulier-titel"`. Its heading is h3
`Stuur ons een bericht`, with `id="formulier-titel"`. The intro paragraph under
it reads: `Dit formulier verstuurt zelf niets. Het zet uw bericht klaar in een
e-mail aan info@newconet.nl, die u vanuit uw eigen e-mailprogramma verstuurt.`

| Order | Label | Control | Required | Attributes |
|---|---|---|---|---|
| 1 | Legend `Waarmee kunnen wij u helpen?` | Three radios, `name="onderwerp"`: `Offerte of advies` (`offerte`), `Storing melden` (`storing`), `Algemene vraag` (`vraag`) | Yes | `fieldset#onderwerp-groep`, none checked by default |
| 2 | `Over welke dienst gaat het? (optioneel)` | `select#dienst`, first option `Nog niet bekend` with value `""`, then the six services with the card `data-dienst` values and card titles as labels | No | none |
| 3 | `Naam` | `input#naam`, type `text` | Yes | `autocomplete="name"` |
| 4 | `Bedrijfsnaam (optioneel)` | `input#bedrijf`, type `text` | No | `autocomplete="organization"` |
| 5 | `E-mailadres` | `input#email`, type `email` | Yes | `autocomplete="email"` |
| 6 | `Telefoonnummer (optioneel)` | `input#telefoon`, type `tel` | No | `autocomplete="tel"`, hint `Handig als wij u terug willen bellen.` |
| 7 | `Bericht` | `textarea#bericht`, 5 rows | Yes | `maxlength="1500"`, hint `Maximaal 1500 tekens.` |
| 8 | none | Submit button `Open e-mail met uw bericht` | none | `btn btn-primary` |

The word `(optioneel)` sits inside the label in `span.field-optional`, so it is
part of the accessible name. Every hint and error is linked to its control
through `aria-describedby`. Each error element is `p.field-error` with the id
`<field>-fout`, for example `naam-fout`, and is `hidden` while empty.

The radios stack vertically as full-width option tiles (`label.keuze-optie`),
so each is a large target at every width. No radio starts checked, because the
choice decides the email subject and whether the outage notice shows.

After the submit button come the status region `p#formulier-status.form-status`
with `role="status"`, then the confirmation panel, then a `noscript` message.

The message is capped at 1500 characters because the whole message travels
inside the mailto link, and mail programs differ in the link length they
accept.

### Prefilling from links

Any link carrying `data-onderwerp` prefills the form when it is clicked. The
link's own `href="#contactformulier"` still scrolls to the form, with or
without script.

1. The click checks the radio whose value equals `data-onderwerp`.
2. When the link also carries `data-dienst`, the click selects that option in `#dienst`.
3. The outage notice shows or hides to match the new request type.
4. Focus is not moved into a field, so a phone keyboard does not pop up over the form.

The form carries `scroll-margin-top` of the header height plus 16px, so the
sticky header never covers the form's heading after the jump.

| Link | `data-onderwerp` | `data-dienst` |
|---|---|---|
| Header `Offerte aanvragen` | `offerte` | none |
| Hero `Vraag een offerte aan` | `offerte` | none |
| Route card `Offerte aanvragen` | `offerte` | none |
| Route card `Stuur een bericht` | `vraag` | none |
| Service card `Offerte aanvragen voor <dienst>` | `offerte` | the card's value |
| Process `Vraag een offerte aan` | `offerte` | none |
| FAQ `Stel hem ons direct` | `vraag` | none |
| Sticky bar `Offerte` | `offerte` | none |

### The outage notice inside the form

When `Storing melden` is checked, `div#storing-melding.storing-melding` shows
directly below the radio group. It hides again as soon as another type is
checked.

| Element | Copy |
|---|---|
| Heading line, alert colour | `Urgente storing? Bel ons direct.` |
| Paragraph | `Wij zijn 24/7 bereikbaar op +31 (0)00 000 00 00. Meld een urgente storing niet via dit formulier of per e-mail.` |
| Button | `Bel +31 (0)00 000 00 00`, to `tel:+31000000000`, class `btn btn-alert` |
| Closing line | `Is de storing niet urgent? Dan kunt u hieronder toch een e-mail klaarzetten.` |

When the visitor checks `Storing melden` themselves, the status region
announces `Bel bij een urgente storing direct +31 (0)00 000 00 00.` The
notice appears visually, so the announcement makes the change audible too. The
rest of the form stays usable, since a non-urgent outage may still go by email.

### Validation

The form validates in script with Dutch messages, and `novalidate` suppresses
the browser's own bubbles. Every value is trimmed first, so whitespace alone
counts as empty.

| Field | Rule | Message |
|---|---|---|
| Request type | One radio checked | `Kies waarmee wij u kunnen helpen.` |
| Naam | Not empty | `Vul uw naam in.` |
| E-mailadres | Not empty | `Vul uw e-mailadres in.` |
| E-mailadres | Matches `^[^\s@]+@[^\s@]+\.[^\s@]+$` | `Vul een geldig e-mailadres in, bijvoorbeeld naam@bedrijf.nl.` |
| Telefoonnummer | Empty, or only digits, spaces, `+`, `-`, `(` and `)` with at least 8 digits | `Vul een geldig telefoonnummer in, of laat dit veld leeg.` |
| Bericht | Not empty | `Vul uw bericht in.` |

On submit with any invalid field, the form does the following.

1. Each invalid field shows its message in its `-fout` element and gets `aria-invalid="true"`; the request-type fieldset gets it on the fieldset.
2. The status region shows `Het formulier is nog niet compleet. Controleer de gemarkeerde velden.` in the error colour.
3. Focus moves to the first invalid field in form order, which for the request type is its first radio.
4. No mailto link opens and no confirmation shows.

After the first failed submit, each field re-validates as the visitor types or
changes it. A fixed field loses its message and its `aria-invalid` at once.
Before the first submit, nothing is validated, so a visitor is never scolded
mid-typing.

### Building the email

A valid submit builds one mailto URL to `info@newconet.nl` with a `subject` and
a `body` parameter. Both are encoded with `encodeURIComponent`, so a space
becomes `%20` and never `+`.

The subject depends on the request type, with `: <dienst label>` appended when
a service is chosen.

| Request type | Subject without a service | Subject with Zakelijk WiFi |
|---|---|---|
| `offerte` | `Offerteaanvraag via de website` | `Offerteaanvraag via de website: Zakelijk WiFi` |
| `vraag` | `Vraag via de website` | `Vraag via de website: Zakelijk WiFi` |
| `storing` | `Storing (niet urgent) via de website` | `Storing (niet urgent) via de website: Zakelijk WiFi` |

The body joins its lines with CRLF (`\r\n`). A line for an empty optional field
is left out, and the `Dienst` line is left out when `Nog niet bekend` is
chosen. For a full form the body reads as follows.

```text
Onderwerp: Offerte of advies
Dienst: Zakelijk WiFi
Naam: Jan de Vries
Bedrijf: Voorbeeld BV
E-mailadres: jan@voorbeeld.nl
Telefoon: 06 12345678

Bericht:
Wij zoeken dekkend WiFi voor twee verdiepingen kantoor.
```

The `Onderwerp` line uses the radio's visible label: `Offerte of advies`,
`Storing melden` or `Algemene vraag`. For the example above, the finished link
starts with
`mailto:info@newconet.nl?subject=Offerteaanvraag%20via%20de%20website%3A%20Zakelijk%20WiFi&body=Onderwerp%3A%20Offerte%20of%20advies%0D%0A`.

The mail building and validation live in pure functions that the ES module
exports, so tests can call them without a browser. The DOM wiring runs only
when the module loads in a page.

| Export | Takes | Returns |
|---|---|---|
| `validate(fields)` | `{ onderwerp, dienst, naam, bedrijf, email, telefoon, bericht }`, raw strings | An object mapping each invalid field name to its Dutch message; empty when valid |
| `buildMailto(fields)` | The same object, already valid | `{ subject, body, href }` |

### Confirmation and fallback

After a valid submit, the page sets `window.location.href` to the mailto URL
and shows the confirmation panel. The page cannot know whether an email
program opened, because a browser reports nothing back from a mailto link. The
confirmation therefore describes the next step and offers a fallback in the
same view.

1. The status region announces `Uw e-mailprogramma wordt geopend. Verstuur de e-mail om uw bericht bij ons te krijgen.`
2. `div#formulier-bevestiging.form-bevestiging` becomes visible below the submit button.
3. Focus moves to its heading `h4#bevestiging-titel`, which has `tabindex="-1"`.
4. The form keeps every value; nothing resets.

| Element | Copy |
|---|---|
| h4 | `Nog één stap: verstuur de e-mail` |
| Paragraph | `Uw e-mailprogramma opent een nieuwe e-mail aan info@newconet.nl met uw bericht erin. Pas als u die e-mail verstuurt, ontvangen wij uw bericht.` |
| Paragraph | `Opende er geen e-mail? Kopieer dan uw bericht en mail het naar info@newconet.nl, of bel ons op +31 (0)00 000 00 00.` The address and number are links. |
| Read-only textarea `#bericht-kopie` | The exact email body, with the visually hidden label `Uw bericht` |
| Button `#kopieer-bericht` | `Kopieer bericht` |
| Link `#mailto-opnieuw` | `Open de e-mail opnieuw`, whose `href` is the same mailto URL |

`Kopieer bericht` writes the body to the clipboard. On success the status
region shows `Bericht gekopieerd.` When the clipboard refuses, the textarea's
text is selected and the status region shows `Kopiëren lukte niet. Selecteer
de tekst en kopieer hem zelf.` in the error colour.

A second valid submit rebuilds the body, the link and the textarea from the
current values.

### Without JavaScript

The phone, email and anchor links all work without script. The form does not,
so a `noscript` paragraph inside the form reads `Dit formulier werkt alleen met
JavaScript. Mail ons op info@newconet.nl of bel +31 (0)00 000 00 00.`

## States the page shows

The page fetches nothing, so it has no loading state and no empty state. Its
states are the form's states, the menu, and the page at its densest.

| State | What the visitor sees | Frame |
|---|---|---|
| Default, desktop | Every section in order, header with nav and both buttons | `desktop-1440.png` |
| Default, tablet | Collapsed nav, `Storing?` and `Offerte aanvragen` in the header, steps stacked | `tablet-768.png` |
| Default, phone | Header with `Storing?` and the toggle, sticky bar at the bottom, no horizontal scroll | `phone-360.png` |
| First screen, phone | Hero with both buttons and the outage line, sticky bar visible | `phone-360-first-screen.png` |
| Skip link focused | `Direct naar de inhoud` over the header | `phone-360-skip-link.png` |
| Menu open | Five links below the header, focus on `Diensten` | `phone-360-menu-open.png` |
| Form reached from the sticky bar | Form heading below the header, `Offerte of advies` checked | `phone-360-offerte-from-bar.png` |
| Form prefilled from a service card | `Offerte of advies` checked, `Zakelijk WiFi` selected | `form-prefilled-offerte.png` |
| Outage type chosen | Alert notice with the call button under the radios, status line below the submit button | `form-storing.png` |
| Validation errors | Messages under each invalid field, red borders, status line | `form-errors.png` |
| Confirmation | Status line, panel with next step, fallback, message copy and actions | `form-confirmation.png` |
| Dense FAQ | All seven answers open | `faq-all-open.png` |

The dense form case is a 1500-character message with a long company name and
`Glasvezel & bekabeling` chosen. The textarea grows no wider than its column,
the confirmation textarea scrolls inside itself, and the encoded `&` in the
service name survives into the subject as `%26`.

## Accessibility

The page meets WCAG 2.2 AA. Beyond the behaviour above, these requirements
hold.

| Area | Requirement |
|---|---|
| Language | `<html lang="nl">` |
| Landmarks | One `header`, one `main#inhoud`, one `footer`; the three `nav` elements have distinct labels `Hoofdmenu`, `Voettekst` and `Snel contact` |
| Headings | One h1; sections use h2; cards, steps and the form heading use h3; the confirmation uses h4 |
| Focus | Every interactive element shows a 3px `:focus-visible` outline in `--color-focus`, offset 3px; the source's `outline: none` on inputs is removed |
| Focus on dark ground | The hero, the outage band and the footer set `--color-focus` to white |
| Labels | Every control has a visible `label` or `legend`; placeholders are not used |
| Live region | `#formulier-status` has `role="status"` and is present in the DOM from page load, so its changes are announced |
| Link names | Every link has a unique, descriptive accessible name; repeated service links carry the hidden service suffix |
| Decorative content | The emoji icons, the logo SVG and the step numbers from CSS are hidden from assistive technology |
| Targets | Buttons, sticky bar links and radio tiles are at least 44 by 44 CSS pixels |
| Motion | Under `prefers-reduced-motion: reduce`, smooth scrolling, transitions and hover lifts are off |
| Reflow | No horizontal scroll at 360px wide or at 400% zoom of a 1280px window |

The source site's colours fail contrast in three places, and this spec fixes
them without changing the palette.

| Source pairing | Ratio | Fix in this spec |
|---|---|---|
| White text on the accent button | 2.4:1 | Primary button text becomes `--color-primary-dark`, 6.1:1 |
| Accent links on white | 2.4:1 | Links use `--color-primary` and an underline, 11.4:1 |
| Accent stat numbers | 2.4:1 | Stat numbers use `--color-primary` |
| Input border `#e1e8ec` on the field ground | 1.2:1 | Inputs use `--color-border-strong`, 3.3:1 |

The accent stays on the logo's `CO`, the primary button fill, route card top
borders and the sticky bar's `Offerte` cell.

## Responsive behaviour

The layout has four breakpoints, each triggered by a real collision in the
prototype.

| Width | Change |
|---|---|
| Above 960px | Inline nav, five steps in a row, three-column footer |
| 960px and below | Nav behind the toggle, steps stacked, two-column footer |
| 860px and below | About and contact become one column; the details come before the form |
| 720px and below | Sticky contact bar shows; the header's `Offerte aanvragen` hides; sections pad 64px; hero pads 64px top; one-column footer |
| 400px and below | Container side padding drops from 24px to 16px; the logo shrinks to 30px so `Storing?` and the toggle fit at 360px |

Every section carries `scroll-margin-top: var(--header-height)`, so anchor
jumps land below the sticky header.

## Tokens and classes

### Tokens

Tokens marked "source" are copied from the source stylesheet unchanged. Each
new token exists because no source token covers its job.

| Token | Value | Origin | Use |
|---|---|---|---|
| `--color-bg` | `#f7f9fb` | source | Page ground, field ground |
| `--color-surface` | `#ffffff` | source | Cards, header, form |
| `--color-primary` | `#0b3d5c` | source | Links, secondary buttons, stat numbers |
| `--color-primary-dark` | `#082a40` | source | Headings, outage band, footer, primary button text |
| `--color-accent` | `#1fb6d4` | source | Primary button fill, logo accent |
| `--color-accent-hover` | `#17a0bc` | source literal, now a token | Primary button hover |
| `--color-text` | `#1c2b33` | source | Body text |
| `--color-text-muted` | `#5b6b74` | source | Paragraphs, hints |
| `--color-text-on-dark` | `#d3e3ec` | source literal, now a token | Text on the hero, outage band and footer |
| `--color-border` | `#e1e8ec` | source | Card and section borders |
| `--color-border-strong` | `#7b8c96` | new | Input and radio tile borders; meets 3:1 against the field ground |
| `--color-selected-bg` | `#e8f1f6` | new | Checked radio tile, confirmation panel |
| `--color-alert` | `#b45309` | new | Outage buttons, notice border and heading; 5.0:1 on white |
| `--color-alert-bg` | `#fff7ed` | new | Outage route card and notice ground |
| `--color-alert-hover` | `#92400e` | new | Outage button hover |
| `--color-error` | `#b42318` | new | Field errors and the error status; 6.6:1 on white |
| `--color-focus` | `#0b3d5c` | new | Focus outline; white on dark sections |
| `--radius` | `10px` | source | Cards, buttons |
| `--shadow` | `0 10px 30px rgba(11, 61, 92, 0.08)` | source | Cards, form |
| `--container-width` | `1120px` | source | Content width |
| `--header-height` | `72px` | source literal, now a token | Header height and scroll margins |
| `--contact-bar-height` | `64px` | new | Sticky bar height and body padding |

The alert colour is new because the brand has no signal colour, and an outage
needs to read differently from the cyan quote action. Amber is used rather than
red, so the outage route reads as urgent without reading as an error.

The site loads no external fonts. The font stack stays the source's `"Segoe
UI", Roboto, Helvetica, Arial, sans-serif`.

### Classes

The source classes carry over with their rules: `container`, `site-header`,
`header-inner`, `logo`, `logo-icon`, `logo-text`, `main-nav`, `nav-toggle`,
`btn`, `btn-primary`, `btn-secondary`, `hero`, `hero-inner`, `hero-sub`,
`hero-cta`, `section-intro`, `diensten`, `diensten-grid`, `dienst-card`,
`dienst-icon`, `over-ons`, `over-ons-inner`, `over-ons-tekst`,
`over-ons-punten`, `over-ons-stats`, `stat`, `stat-num`, `stat-label`,
`contact`, `contact-inner`, `contact-info`, `contact-details`, `contact-form`,
`site-footer`, `footer-inner` and `footer-nav`. Their rules change only where
the contrast and focus fixes above require it.

The new classes are these.

| Class | Purpose |
|---|---|
| `skip-link`, `visually-hidden` | Skip link and screen-reader-only text |
| `header-actions`, `btn-small`, `btn-storing`, `btn-alert` | Header buttons and the outage call buttons |
| `hero-storing` | The hero's outage line |
| `routes`, `routes-grid`, `route-card`, `route-card--storing`, `route-extra` | Route chooser |
| `dienst-link` | The quote link on each service card |
| `werkwijze`, `stappen`, `stap` | Process steps with a CSS counter |
| `faq`, `faq-list`, `faq-item` | FAQ accordion on native `details` |
| `storing`, `storing-kern` | Outage band and its key message |
| `detail-hint` | The 24/7 line under the phone number |
| `form-intro`, `form-field`, `field-optional`, `field-hint`, `field-error` | Form layout, hints and errors |
| `keuze-groep`, `keuze-opties`, `keuze-optie` | Request-type fieldset and radio tiles |
| `storing-melding`, `storing-melding-rest` | Outage notice in the form |
| `form-status`, `is-error` | Status region and its error colour |
| `form-bevestiging`, `bevestiging-acties` | Confirmation panel |
| `footer-contact`, `footer-bottom` | Footer contact list and copyright row |
| `contact-bar` | Sticky contact bar |

The source's `form-note` class and its fake "Bedankt voor uw bericht!" message
go away with the fake submit.

## How the site is delivered

The site is static and served by the existing nginx container.

| File | Role |
|---|---|
| `site/index.html` | The whole page |
| `site/css/style.css` | The one stylesheet |
| `site/js/main.js` | The one script, loaded with `<script type="module" src="js/main.js">` |
| `site/assets/favicon.svg` | The source favicon, unchanged |

The page uses no framework, no CDN, no external font and no analytics, and it
sets no cookies. The `Dockerfile` copies the whole `site/` directory into
`/usr/share/nginx/html/`, so the repository root keeps only its documents and
configuration.

The page title is `NewCONet | Netwerkoplossingen voor bedrijven`, and the meta
description is the source's.

## UX acceptance criteria

These are the behaviours tests pin down. Each is observable in a browser
without reading the code.

| Area | Criterion |
|---|---|
| Reach | At 360px, `Storing?` is visible in the header without opening the menu |
| Reach | At 360px, the sticky bar shows `Bellen` to `tel:+31000000000`, `Mailen` to `mailto:info@newconet.nl` and `Offerte` to `#contactformulier` |
| Reach | Above 720px the sticky bar is not displayed |
| Reach | `Storing?` links to `#storing`, whose section holds a `tel:+31000000000` link named `Bel +31 (0)00 000 00 00` |
| Reach | The hero holds a `tel:` link to the phone number |
| Structure | Sections appear in the order of the structure table, with the exact h1 and h2 texts |
| Structure | The route chooser has three cards with the exact h3s and actions |
| Structure | The services section has six cards, each with a link named `Offerte aanvragen voor <dienst>` |
| Structure | The process section is an ordered list of five steps with the exact h3s |
| Structure | The FAQ has seven `details` items with the exact questions, all closed on load |
| Prefill | Clicking a service card link checks `Offerte of advies` and selects that service |
| Prefill | Clicking `Stuur een bericht` checks `Algemene vraag` |
| Outage | Checking `Storing melden` shows the notice with a call link; checking another type hides it |
| Outage | Checking `Storing melden` writes the storing sentence to `#formulier-status` |
| Validation | Submitting an empty form shows the four required-field messages, sets `aria-invalid`, fills the status region and focuses the first radio |
| Validation | `naam@bedrijf` shows the invalid-email message; `12ab` in Telefoonnummer shows the phone message |
| Validation | Whitespace-only Naam or Bericht counts as empty |
| Validation | After a failed submit, fixing a field removes its message and `aria-invalid` without resubmitting |
| Email | A valid submit navigates to a mailto URL for `info@newconet.nl` whose decoded subject and body match the tables above |
| Email | Empty optional fields and a `Nog niet bekend` service produce no line in the body |
| Email | `buildMailto` and `validate` are exported and return the shapes in the exports table |
| Confirmation | A valid submit shows `#formulier-bevestiging`, focuses its heading, keeps all field values and fills `#bericht-kopie` with the body |
| Confirmation | `#mailto-opnieuw` carries the same mailto URL |
| Confirmation | `Kopieer bericht` reports `Bericht gekopieerd.`, or the failure message when the clipboard refuses |
| Menu | The toggle's `aria-expanded` and label follow the open state; opening focuses `Diensten` |
| Menu | Escape closes the menu and returns focus to the toggle; a menu link closes it |
| Access | The first Tab stop is `Direct naar de inhoud`, which moves focus to `main#inhoud` |
| Access | Every form control has an accessible name; `#formulier-status` exists at load with `role="status"` |
| Access | At 360px, `document.documentElement.scrollWidth` equals 360 |
| Access | Under reduced motion, `html` has `scroll-behavior: auto` |
| Honesty | No code path shows a sent or thank-you message; no element has the text `Bedankt voor uw bericht` |
| Placeholders | The phone, address and email strings appear exactly as in the placeholder table |
| Footer | The footer repeats phone, email, address, hours and the 24/7 outage line; `#jaar` shows the current year |

## Open questions for the owner

1. Is the 24/7 outage line the same number as the general number? The page assumes one number for both, because the source lists only one.
2. Do the five process steps match how a job runs, and is the beheer step part of every job or an optional service?
3. The service emoji render differently per operating system, and the thread emoji for Glasvezel reads oddly. A small inline SVG icon set in the logo's line style would fix this, but it is new artwork and needs the owner's agreement.
4. Does the owner want the darker button text and link colours that the contrast fixes introduce? They keep the palette but change how the cyan buttons look.
