// Contract under test (docs/design/specs/customer-contact-site.md):
//   validate(fields)     -> { [fieldName]: dutchMessage }, empty object when valid
//   buildMailto(fields)  -> { subject, body, href }
//   init(doc, { navigate, clipboard })
//     navigate(href)  is called with the mailto URL on a valid submit
//     clipboard       is { writeText(text): Promise<void> }; defaults to doc.defaultView.navigator.clipboard
//   fields = { onderwerp, dienst, naam, bedrijf, email, telefoon, bericht }
//     onderwerp: 'offerte' | 'storing' | 'vraag' | ''    dienst: a data-dienst value or ''
// Hidden elements (field errors, #storing-melding, #formulier-bevestiging) use the `hidden` attribute.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { JSDOM } from 'jsdom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildMailto, init, validate } from './main.js';

const INDEX_HTML = resolve(process.cwd(), 'site/index.html');
const PHONE = '+31 (0)00 000 00 00';
const TEL = 'tel:+31000000000';
const MAIL = 'mailto:info@newconet.nl';

const FULL = {
  onderwerp: 'offerte',
  dienst: 'zakelijk-wifi',
  naam: 'Jan de Vries',
  bedrijf: 'Voorbeeld BV',
  email: 'jan@voorbeeld.nl',
  telefoon: '06 12345678',
  bericht: 'Wij zoeken dekkend WiFi voor twee verdiepingen kantoor.',
};
const FULL_BODY = [
  'Onderwerp: Offerte of advies',
  'Dienst: Zakelijk WiFi',
  'Naam: Jan de Vries',
  'Bedrijf: Voorbeeld BV',
  'E-mailadres: jan@voorbeeld.nl',
  'Telefoon: 06 12345678',
  '',
  'Bericht:',
  'Wij zoeken dekkend WiFi voor twee verdiepingen kantoor.',
].join('\r\n');

const MSG = {
  onderwerp: 'Kies waarmee wij u kunnen helpen.',
  naam: 'Vul uw naam in.',
  emailLeeg: 'Vul uw e-mailadres in.',
  emailFout: 'Vul een geldig e-mailadres in, bijvoorbeeld naam@bedrijf.nl.',
  telefoon: 'Vul een geldig telefoonnummer in, of laat dit veld leeg.',
  bericht: 'Vul uw bericht in.',
  formulier: 'Het formulier is nog niet compleet. Controleer de gemarkeerde velden.',
  storing: 'Bel bij een urgente storing direct +31 (0)00 000 00 00.',
  geopend: 'Uw e-mailprogramma wordt geopend. Verstuur de e-mail om uw bericht bij ons te krijgen.',
  gekopieerd: 'Bericht gekopieerd.',
  kopieerFout: 'Kopiëren lukte niet. Selecteer de tekst en kopieer hem zelf.',
};

const DIENSTEN = [
  ['netwerkaanleg', 'Netwerkaanleg'],
  ['zakelijk-wifi', 'Zakelijk WiFi'],
  ['glasvezel-bekabeling', 'Glasvezel & bekabeling'],
  ['beheer-onderhoud', 'Beheer & onderhoud'],
  ['netwerkbeveiliging', 'Netwerkbeveiliging'],
  ['cloud-connectiviteit', 'Cloud & connectiviteit'],
];

const decode = (href) => {
  const query = href.slice(href.indexOf('?') + 1);
  const parts = Object.fromEntries(query.split('&').map((p) => p.split('=')));
  return { subject: decodeURIComponent(parts.subject), body: decodeURIComponent(parts.body) };
};

// ---------------------------------------------------------------- pure functions

describe('validate', () => {
  it('returns an empty object for a complete valid form', () => {
    expect(validate(FULL)).toEqual({});
  });

  it('asks for the four required fields when everything is empty', () => {
    const empty = { onderwerp: '', dienst: '', naam: '', bedrijf: '', email: '', telefoon: '', bericht: '' };
    expect(validate(empty)).toEqual({
      onderwerp: MSG.onderwerp,
      naam: MSG.naam,
      email: MSG.emailLeeg,
      bericht: MSG.bericht,
    });
  });

  it.each(['naam', 'bericht'])('treats whitespace-only %s as empty', (field) => {
    const errors = validate({ ...FULL, [field]: '   \t ' });
    expect(errors[field]).toBe(field === 'naam' ? MSG.naam : MSG.bericht);
  });

  it('treats a whitespace-only e-mail address as empty', () => {
    expect(validate({ ...FULL, email: '   ' }).email).toBe(MSG.emailLeeg);
  });

  it.each(['naam@bedrijf', 'naam bedrijf@voorbeeld.nl', '@voorbeeld.nl', 'naam@.nl', 'naam@@voorbeeld.nl'])(
    'rejects the e-mail address %j with the invalid-address message',
    (email) => {
      expect(validate({ ...FULL, email }).email).toBe(MSG.emailFout);
    },
  );

  it('accepts an e-mail address with surrounding whitespace', () => {
    expect(validate({ ...FULL, email: '  jan@voorbeeld.nl ' })).toEqual({});
  });

  it.each(['12ab', '1234567', '06 1234 5678 ext', '06.12345678'])(
    'rejects the phone number %j',
    (telefoon) => {
      expect(validate({ ...FULL, telefoon }).telefoon).toBe(MSG.telefoon);
    },
  );

  it.each(['', '   ', '06 12345678', '+31 (0)20-123 4567', '12345678'])(
    'accepts the phone number %j',
    (telefoon) => {
      expect(validate({ ...FULL, telefoon })).toEqual({});
    },
  );

  it('does not require the optional company and service fields', () => {
    expect(validate({ ...FULL, bedrijf: '', dienst: '' })).toEqual({});
  });

  it('rejects a request type that is not one of the three options', () => {
    expect(validate({ ...FULL, onderwerp: 'anders' }).onderwerp).toBe(MSG.onderwerp);
  });
});

describe('buildMailto', () => {
  it('builds the subject, body and href for a full form', () => {
    const result = buildMailto(FULL);
    expect(result.subject).toBe('Offerteaanvraag via de website: Zakelijk WiFi');
    expect(result.body).toBe(FULL_BODY);
    expect(Object.keys(result).sort()).toEqual(['body', 'href', 'subject']);
  });

  it('starts the href exactly as the spec shows', () => {
    expect(buildMailto(FULL).href.startsWith(
      'mailto:info@newconet.nl?subject=Offerteaanvraag%20via%20de%20website%3A%20Zakelijk%20WiFi&body=Onderwerp%3A%20Offerte%20of%20advies%0D%0A',
    )).toBe(true);
  });

  it('encodes subject and body with encodeURIComponent and never uses a plus for a space', () => {
    const { subject, body, href } = buildMailto(FULL);
    expect(href).toBe(`${MAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
    expect(href).not.toContain('+');
  });

  it.each([
    ['offerte', 'Offerteaanvraag via de website', 'Onderwerp: Offerte of advies'],
    ['vraag', 'Vraag via de website', 'Onderwerp: Algemene vraag'],
    ['storing', 'Storing (niet urgent) via de website', 'Onderwerp: Storing melden'],
  ])('uses the %s subject and first body line', (onderwerp, subject, firstLine) => {
    const withoutService = buildMailto({ ...FULL, onderwerp, dienst: '' });
    expect(withoutService.subject).toBe(subject);
    expect(withoutService.body.split('\r\n')[0]).toBe(firstLine);
    expect(buildMailto({ ...FULL, onderwerp }).subject).toBe(`${subject}: Zakelijk WiFi`);
  });

  it('leaves out the lines for empty optional fields and an unknown service', () => {
    const { body } = buildMailto({ ...FULL, dienst: '', bedrijf: '', telefoon: '' });
    expect(body).toBe(
      [
        'Onderwerp: Offerte of advies',
        'Naam: Jan de Vries',
        'E-mailadres: jan@voorbeeld.nl',
        '',
        'Bericht:',
        FULL.bericht,
      ].join('\r\n'),
    );
  });

  it('joins every body line with CRLF and never a bare line feed', () => {
    const { body } = buildMailto(FULL);
    expect(body.replace(/\r\n/g, '')).not.toMatch(/[\r\n]/);
  });

  it.each(DIENSTEN)('maps the service value %s to the label %s in the subject', (dienst, label) => {
    expect(buildMailto({ ...FULL, dienst }).subject).toBe(`Offerteaanvraag via de website: ${label}`);
  });

  it('keeps an ampersand in the service name as %26 in the href', () => {
    const { href } = buildMailto({ ...FULL, dienst: 'glasvezel-bekabeling' });
    expect(href).toContain('Glasvezel%20%26%20bekabeling');
    expect(decode(href).subject).toBe('Offerteaanvraag via de website: Glasvezel & bekabeling');
  });

  it('trims surrounding whitespace from every value in the body', () => {
    const { body } = buildMailto({ ...FULL, naam: '  Jan de Vries ', bericht: ' Hallo \n' });
    expect(body).toContain('Naam: Jan de Vries\r\n');
    expect(body.endsWith('Bericht:\r\nHallo')).toBe(true);
  });
});

describe('buildMailto with hostile input', () => {
  const hostile = [
    ['ampersand', 'Jan & Piet'],
    ['hash', 'Kamer #4'],
    ['percent', '100% zeker %0D%0A'],
    ['question mark', 'Wat? Waarom?'],
    ['equals sign', 'a=b&body=nep'],
    ['line breaks', 'regel een\r\nregel twee\nregel drie'],
    ['script tag', '<script>alert(1)</script>'],
    ['subject injection', 'x&subject=Nep'],
  ];
  const cases = ['naam', 'bedrijf', 'bericht'].flatMap((field) =>
    hostile.map(([label, value]) => [field, label, value]),
  );

  it.each(cases)('keeps %s value with %s intact in the decoded body', (field, _label, value) => {
    const fields = { ...FULL, [field]: value };
    const { href, body } = buildMailto(fields);
    const literal = {
      naam: `Naam: ${fields.naam}`,
      bedrijf: `Bedrijf: ${fields.bedrijf}`,
      bericht: `Bericht:\r\n${fields.bericht.replace(/\r?\n/g, "\r\n")}`,
    }[field];
    expect(body).toContain(literal);
    expect(decode(href).body).toBe(body);
    expect(href.split('?subject=')).toHaveLength(2);
    expect(href.split('&body=')).toHaveLength(2);
    expect(href.split('?')).toHaveLength(2);
  });

  it('builds the exact expected body from literal strings for a message full of reserved characters', () => {
    const bericht = 'A & B # C % D ? E = F <script>alert(1)</script>';
    const { href } = buildMailto({ ...FULL, dienst: '', bedrijf: '', telefoon: '', bericht });
    expect(decode(href).body).toBe(
      'Onderwerp: Offerte of advies\r\nNaam: Jan de Vries\r\nE-mailadres: jan@voorbeeld.nl\r\n\r\nBericht:\r\nA & B # C % D ? E = F <script>alert(1)</script>',
    );
  });
});

describe('the dense form case', () => {
  it('carries a 1500-character message and the encoded ampersand in the subject', () => {
    const bericht = 'x'.repeat(1499) + '&';
    expect(bericht).toHaveLength(1500);
    const fields = { ...FULL, dienst: 'glasvezel-bekabeling', bedrijf: 'Een Zeer Lange Bedrijfsnaam BV '.repeat(4).trim(), bericht };
    expect(validate(fields)).toEqual({});
    const { href, body } = buildMailto(fields);
    expect(href).toContain('subject=Offerteaanvraag%20via%20de%20website%3A%20Glasvezel%20%26%20bekabeling&body=');
    const decoded = decode(href);
    expect(decoded.subject).toBe('Offerteaanvraag via de website: Glasvezel & bekabeling');
    expect(decoded.body).toBe(body);
    expect(decoded.body.endsWith(`Bericht:\r\n${bericht}`)).toBe(true);
  });
});

// ---------------------------------------------------------------- DOM wiring

const norm = (s) => s.replace(/\s+/g, ' ').trim();
const visibleText = (node) => {
  if (node.nodeType === 3) return node.data;
  if (node.nodeType !== 1 || node.getAttribute('aria-hidden') === 'true') return '';
  return [...node.childNodes].map(visibleText).join('');
};
const nameOf = (el) => norm(el.getAttribute('aria-label') ?? visibleText(el));
const controlName = (el) => {
  const by = el.getAttribute('aria-labelledby');
  if (by) return norm(by.split(/\s+/).map((id) => visibleText(el.ownerDocument.getElementById(id))).join(' '));
  if (el.getAttribute('aria-label')) return norm(el.getAttribute('aria-label'));
  if (el.labels?.length) return norm([...el.labels].map(visibleText).join(' '));
  if (el.tagName === 'BUTTON') return nameOf(el);
  return '';
};

const openDoms = [];
afterEach(() => {
  while (openDoms.length) openDoms.pop().window.close();
});

function loadPage({ clipboard, jaarFallback } = {}) {
  let html = readFileSync(INDEX_HTML, 'utf8');
  if (jaarFallback) {
    html = html.replace(/(<span[^>]*id="jaar"[^>]*>)[^<]*(<\/span>)/, (_, a, b) => `${a}${jaarFallback}${b}`);
  }
  const dom = new JSDOM(html, { pretendToBeVisual: true });
  openDoms.push(dom);
  const doc = dom.window.document;
  const navigate = vi.fn();
  init(doc, { navigate, clipboard });
  return { doc, win: dom.window, navigate };
}

const $ = (scope, selector) => scope.querySelector(selector);
const link = (scope, name) => {
  const found = [...scope.querySelectorAll('a')].filter((a) => nameOf(a) === name);
  expect(found, `link named "${name}"`).toHaveLength(1);
  return found[0];
};
const radio = (doc, value) => $(doc, `input[name="onderwerp"][value="${value}"]`);
const status = (doc) => $(doc, '#formulier-status');
const form = (doc) => $(doc, 'form#contactformulier');
const submitButton = (doc) =>
  [...form(doc).querySelectorAll('button')].find((b) => nameOf(b) === 'Open e-mail met uw bericht');

function type(doc, selector, value) {
  const el = $(doc, selector);
  el.value = value;
  el.dispatchEvent(new doc.defaultView.Event('input', { bubbles: true }));
  el.dispatchEvent(new doc.defaultView.Event('change', { bubbles: true }));
}
function fillForm(doc, fields = FULL) {
  if (fields.onderwerp) radio(doc, fields.onderwerp).click();
  type(doc, '#dienst', fields.dienst);
  type(doc, '#naam', fields.naam);
  type(doc, '#bedrijf', fields.bedrijf);
  type(doc, '#email', fields.email);
  type(doc, '#telefoon', fields.telefoon);
  type(doc, '#bericht', fields.bericht);
}
const submit = (doc) => submitButton(doc).click();
const isInvalid = (el) => el.getAttribute('aria-invalid') === 'true';

describe('page markup', () => {
  it('declares Dutch as the page language and the spec title', () => {
    const { doc } = loadPage();
    expect(doc.documentElement.getAttribute('lang')).toBe('nl');
    expect(doc.title).toBe('NewCONet | Netwerkoplossingen voor bedrijven');
  });

  it('loads the one script as an ES module and nothing external', () => {
    const { doc } = loadPage();
    expect($(doc, 'script[type="module"][src="js/main.js"]')).not.toBeNull();
    expect(doc.querySelectorAll('script[src^="http"], link[href^="http"], link[href^="//"]')).toHaveLength(0);
    expect($(doc, 'link[rel="stylesheet"][href="css/style.css"]')).not.toBeNull();
  });

  it('holds one header, one main#inhoud with tabindex -1 and one footer', () => {
    const { doc } = loadPage();
    expect(doc.querySelectorAll('header')).toHaveLength(1);
    expect(doc.querySelectorAll('main')).toHaveLength(1);
    expect($(doc, 'main#inhoud').getAttribute('tabindex')).toBe('-1');
    expect(doc.querySelectorAll('footer')).toHaveLength(1);
  });

  it('puts the skip link first in the document, pointing at #inhoud', () => {
    const { doc } = loadPage();
    const first = [...doc.querySelectorAll('a[href], button')][0];
    expect(nameOf(first)).toBe('Direct naar de inhoud');
    expect(first.getAttribute('href')).toBe('#inhoud');
    expect(first.classList.contains('skip-link')).toBe(true);
  });

  it('labels the three navigation landmarks distinctly', () => {
    const { doc } = loadPage();
    const labels = [...doc.querySelectorAll('nav')].map((n) => n.getAttribute('aria-label'));
    expect(labels.sort()).toEqual(['Hoofdmenu', 'Snel contact', 'Voettekst']);
    expect($(doc, 'nav#hoofdmenu').getAttribute('aria-label')).toBe('Hoofdmenu');
  });

  it('uses exactly one h1', () => {
    const { doc } = loadPage();
    expect(doc.querySelectorAll('h1')).toHaveLength(1);
  });

  it('gives the logo link its accessible name and hides the decorative parts', () => {
    const { doc } = loadPage();
    const logo = $(doc, 'header a.logo');
    expect(logo.getAttribute('href')).toBe('#top');
    expect(logo.getAttribute('aria-label')).toBe('NewCONet, naar het begin van de pagina');
  });

  it('lists six service cards, five process steps and seven closed FAQ items', () => {
    const { doc } = loadPage();
    expect(doc.querySelectorAll('article.dienst-card')).toHaveLength(6);
    expect(doc.querySelectorAll('ol.stappen > li.stap')).toHaveLength(5);
    const items = doc.querySelectorAll('details.faq-item');
    expect(items).toHaveLength(7);
    expect([...items].every((d) => !d.hasAttribute('open'))).toBe(true);
  });

  it('marks up the about stats as a list of three', () => {
    const { doc } = loadPage();
    expect(doc.querySelectorAll('ul.over-ons-stats > li.stat')).toHaveLength(3);
  });
});

describe('contact form markup', () => {
  it('is a novalidate form named by its heading', () => {
    const { doc } = loadPage();
    const f = form(doc);
    expect(f.classList.contains('contact-form')).toBe(true);
    expect(f.hasAttribute('novalidate')).toBe(true);
    expect(f.getAttribute('tabindex')).toBe('-1');
    expect(f.getAttribute('aria-labelledby')).toBe('formulier-titel');
    expect($(doc, '#formulier-titel').textContent.trim()).toBe('Stuur ons een bericht');
  });

  it('explains before submitting that the form sends nothing itself', () => {
    const { doc } = loadPage();
    expect(norm(form(doc).textContent)).toContain(
      'Dit formulier verstuurt zelf niets. Het zet uw bericht klaar in een e-mail aan info@newconet.nl, die u vanuit uw eigen e-mailprogramma verstuurt.',
    );
  });

  it('offers three request types and checks none of them by default', () => {
    const { doc } = loadPage();
    const radios = [...doc.querySelectorAll('input[name="onderwerp"]')];
    expect(radios.map((r) => [r.value, controlName(r)])).toEqual([
      ['offerte', 'Offerte of advies'],
      ['storing', 'Storing melden'],
      ['vraag', 'Algemene vraag'],
    ]);
    expect(radios.some((r) => r.checked)).toBe(false);
    expect($(doc, 'fieldset#onderwerp-groep legend').textContent.trim()).toBe('Waarmee kunnen wij u helpen?');
  });

  it('lists the unknown option and the six services in the service select', () => {
    const { doc } = loadPage();
    const options = [...$(doc, 'select#dienst').options].map((o) => [o.value, o.textContent.trim()]);
    expect(options).toEqual([['', 'Nog niet bekend'], ...DIENSTEN]);
    expect($(doc, 'select#dienst').value).toBe('');
  });

  it('caps the message at 1500 characters with a hint and uses autocomplete tokens', () => {
    const { doc } = loadPage();
    expect($(doc, 'textarea#bericht').getAttribute('maxlength')).toBe('1500');
    expect($(doc, 'textarea#bericht').getAttribute('rows')).toBe('5');
    expect(norm(form(doc).textContent)).toContain('Maximaal 1500 tekens.');
    expect(norm(form(doc).textContent)).toContain('Handig als wij u terug willen bellen.');
    expect($(doc, '#naam').getAttribute('autocomplete')).toBe('name');
    expect($(doc, '#bedrijf').getAttribute('autocomplete')).toBe('organization');
    expect($(doc, '#email').getAttribute('autocomplete')).toBe('email');
    expect($(doc, '#email').getAttribute('type')).toBe('email');
    expect($(doc, '#telefoon').getAttribute('autocomplete')).toBe('tel');
    expect($(doc, '#telefoon').getAttribute('type')).toBe('tel');
  });

  it('has one empty hidden error element per field, linked through aria-describedby', () => {
    const { doc } = loadPage();
    for (const field of ['naam', 'email', 'telefoon', 'bericht']) {
      const error = $(doc, `p.field-error#${field}-fout`);
      expect(error, `${field}-fout`).not.toBeNull();
      expect(error.hidden).toBe(true);
      expect(error.textContent.trim()).toBe('');
      expect($(doc, `#${field}`).getAttribute('aria-describedby').split(/\s+/)).toContain(`${field}-fout`);
    }
    const group = $(doc, 'p.field-error#onderwerp-fout');
    expect(group.hidden).toBe(true);
  });

  it('names every form control, including the optional marker in the label', () => {
    const { doc } = loadPage();
    const controls = [...form(doc).querySelectorAll('input, select, textarea, button')];
    expect(controls.length).toBeGreaterThanOrEqual(10);
    for (const control of controls) {
      expect(controlName(control), `${control.tagName} #${control.id}`).not.toBe('');
    }
    expect(controlName($(doc, '#dienst'))).toBe('Over welke dienst gaat het? (optioneel)');
    expect(controlName($(doc, '#naam'))).toBe('Naam');
    expect(controlName($(doc, '#bedrijf'))).toBe('Bedrijfsnaam (optioneel)');
    expect(controlName($(doc, '#email'))).toBe('E-mailadres');
    expect(controlName($(doc, '#telefoon'))).toBe('Telefoonnummer (optioneel)');
    expect(controlName($(doc, '#bericht'))).toBe('Bericht');
    expect(controlName($(doc, '#bericht-kopie'))).toBe('Uw bericht');
    expect(controlName($(doc, '#kopieer-bericht'))).toBe('Kopieer bericht');
  });

  it('has a polite status region in the DOM from page load, with the form initially quiet', () => {
    const { doc } = loadPage();
    const region = status(doc);
    expect(region.getAttribute('role')).toBe('status');
    expect(region.classList.contains('form-status')).toBe(true);
    expect(region.textContent.trim()).toBe('');
    expect(region.classList.contains('is-error')).toBe(false);
  });

  it('shows the no-JavaScript fallback in a noscript paragraph inside the form', () => {
    const { doc } = loadPage();
    expect(form(doc).innerHTML).toContain('<noscript>');
    expect(norm(form(doc).innerHTML)).toContain(
      'Dit formulier werkt alleen met JavaScript. Mail ons op info@newconet.nl of bel +31 (0)00 000 00 00.',
    );
  });

  it('starts with the outage notice and the confirmation hidden', () => {
    const { doc } = loadPage();
    expect($(doc, '#storing-melding').hidden).toBe(true);
    expect($(doc, '#formulier-bevestiging').hidden).toBe(true);
  });
});

describe('service cards', () => {
  it.each(DIENSTEN)('offers "Offerte aanvragen voor %s" with unique name and data attributes', (value, label) => {
    const { doc } = loadPage();
    const anchor = link(doc, `Offerte aanvragen voor ${label}`);
    expect(anchor.classList.contains('dienst-link')).toBe(true);
    expect(anchor.getAttribute('href')).toBe('#contactformulier');
    expect(anchor.dataset.onderwerp).toBe('offerte');
    expect(anchor.dataset.dienst).toBe(value);
    expect(anchor.closest('article.dienst-card').querySelector('h3').textContent.trim()).toBe(label);
  });

  it.each(DIENSTEN)('checks "Offerte of advies" and selects %s when its card link is clicked', (value) => {
    const { doc } = loadPage();
    $(doc, `a.dienst-link[data-dienst="${value}"]`).click();
    expect(radio(doc, 'offerte').checked).toBe(true);
    expect($(doc, '#dienst').value).toBe(value);
  });

  it('does not move focus into a field when a card link prefills the form', () => {
    const { doc } = loadPage();
    $(doc, 'a.dienst-link[data-dienst="zakelijk-wifi"]').click();
    expect(['INPUT', 'SELECT', 'TEXTAREA']).not.toContain(doc.activeElement.tagName);
  });
});

describe('prefilling from other links', () => {
  const cases = [
    ['header "Offerte aanvragen"', 'header', 'Offerte aanvragen', 'offerte'],
    ['hero "Vraag een offerte aan"', 'section.hero', 'Vraag een offerte aan', 'offerte'],
    ['route card "Offerte aanvragen"', 'section.routes', 'Offerte aanvragen', 'offerte'],
    ['route card "Stuur een bericht"', 'section.routes', 'Stuur een bericht', 'vraag'],
    ['process "Vraag een offerte aan"', 'section.werkwijze', 'Vraag een offerte aan', 'offerte'],
    ['FAQ "Stel hem ons direct"', 'section.faq', 'Stel hem ons direct', 'vraag'],
    ['sticky bar "Offerte"', 'nav.contact-bar', 'Offerte', 'offerte'],
  ];

  it.each(cases)('%s checks the matching request type', (_label, scope, name, onderwerp) => {
    const { doc } = loadPage();
    const anchor = link($(doc, scope), name);
    expect(anchor.getAttribute('href')).toBe('#contactformulier');
    expect(anchor.dataset.onderwerp).toBe(onderwerp);
    anchor.click();
    expect(radio(doc, onderwerp).checked).toBe(true);
  });

  it('checks "Algemene vraag" when "Stuur een bericht" is clicked', () => {
    const { doc } = loadPage();
    link($(doc, 'section.routes'), 'Stuur een bericht').click();
    expect(controlName(radio(doc, 'vraag'))).toBe('Algemene vraag');
    expect(radio(doc, 'vraag').checked).toBe(true);
    expect($(doc, '#dienst').value).toBe('');
  });

  it('hides the outage notice again when a link switches the type away from storing', () => {
    const { doc } = loadPage();
    radio(doc, 'storing').click();
    expect($(doc, '#storing-melding').hidden).toBe(false);
    link($(doc, 'section.routes'), 'Stuur een bericht').click();
    expect($(doc, '#storing-melding').hidden).toBe(true);
  });
});

describe('outage notice', () => {
  it('shows the notice with a call link when "Storing melden" is checked', () => {
    const { doc } = loadPage();
    radio(doc, 'storing').click();
    const notice = $(doc, '#storing-melding');
    expect(notice.hidden).toBe(false);
    const text = norm(notice.textContent);
    expect(text).toContain('Urgente storing? Bel ons direct.');
    expect(text).toContain(
      'Wij zijn 24/7 bereikbaar op +31 (0)00 000 00 00. Meld een urgente storing niet via dit formulier of per e-mail.',
    );
    expect(text).toContain('Is de storing niet urgent? Dan kunt u hieronder toch een e-mail klaarzetten.');
    const call = link(notice, `Bel ${PHONE}`);
    expect(call.getAttribute('href')).toBe(TEL);
    expect(call.classList.contains('btn-alert')).toBe(true);
  });

  it('sits directly below the radio group', () => {
    const { doc } = loadPage();
    const group = $(doc, 'fieldset#onderwerp-groep');
    expect(group.nextElementSibling.id).toBe('storing-melding');
  });

  it.each(['offerte', 'vraag'])('hides the notice when "%s" is checked afterwards', (other) => {
    const { doc } = loadPage();
    radio(doc, 'storing').click();
    radio(doc, other).click();
    expect($(doc, '#storing-melding').hidden).toBe(true);
  });

  it('announces the storing sentence in the status region when the visitor checks "Storing melden"', () => {
    const { doc } = loadPage();
    radio(doc, 'storing').click();
    expect(status(doc).textContent.trim()).toBe(MSG.storing);
  });
});

describe('validation on submit', () => {
  it('shows the four required-field messages for an empty form', () => {
    const { doc, navigate } = loadPage();
    submit(doc);
    expect($(doc, '#onderwerp-fout').textContent.trim()).toBe(MSG.onderwerp);
    expect($(doc, '#naam-fout').textContent.trim()).toBe(MSG.naam);
    expect($(doc, '#email-fout').textContent.trim()).toBe(MSG.emailLeeg);
    expect($(doc, '#bericht-fout').textContent.trim()).toBe(MSG.bericht);
    expect($(doc, '#telefoon-fout').textContent.trim()).toBe('');
    for (const id of ['onderwerp-fout', 'naam-fout', 'email-fout', 'bericht-fout']) {
      expect($(doc, `#${id}`).hidden).toBe(false);
    }
    expect(navigate).not.toHaveBeenCalled();
  });

  it('sets aria-invalid on the invalid controls and on the fieldset, not on valid ones', () => {
    const { doc } = loadPage();
    submit(doc);
    expect(isInvalid($(doc, 'fieldset#onderwerp-groep'))).toBe(true);
    expect(isInvalid($(doc, '#naam'))).toBe(true);
    expect(isInvalid($(doc, '#email'))).toBe(true);
    expect(isInvalid($(doc, '#bericht'))).toBe(true);
    expect(isInvalid($(doc, '#telefoon'))).toBe(false);
    expect(isInvalid($(doc, '#bedrijf'))).toBe(false);
  });

  it('fills the status region with the incomplete-form message in the error style', () => {
    const { doc } = loadPage();
    submit(doc);
    expect(status(doc).textContent.trim()).toBe(MSG.formulier);
    expect(status(doc).classList.contains('is-error')).toBe(true);
  });

  it('focuses the first radio when the request type is missing', () => {
    const { doc } = loadPage();
    submit(doc);
    expect(doc.activeElement).toBe(radio(doc, 'offerte'));
  });

  it('focuses the first invalid field in form order once the request type is chosen', () => {
    const { doc } = loadPage();
    radio(doc, 'vraag').click();
    type(doc, '#naam', 'Jan');
    submit(doc);
    expect(doc.activeElement).toBe($(doc, '#email'));
  });

  it('shows no confirmation and no mailto after a failed submit', () => {
    const { doc, navigate } = loadPage();
    submit(doc);
    expect($(doc, '#formulier-bevestiging').hidden).toBe(true);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('shows the invalid-address message for naam@bedrijf', () => {
    const { doc } = loadPage();
    fillForm(doc, { ...FULL, email: 'naam@bedrijf' });
    submit(doc);
    expect($(doc, '#email-fout').textContent.trim()).toBe(MSG.emailFout);
    expect(isInvalid($(doc, '#email'))).toBe(true);
    expect(doc.activeElement).toBe($(doc, '#email'));
  });

  it('shows the phone message for 12ab', () => {
    const { doc } = loadPage();
    fillForm(doc, { ...FULL, telefoon: '12ab' });
    submit(doc);
    expect($(doc, '#telefoon-fout').textContent.trim()).toBe(MSG.telefoon);
    expect(isInvalid($(doc, '#telefoon'))).toBe(true);
  });

  it.each([
    ['naam', '#naam', 'naam-fout', MSG.naam],
    ['bericht', '#bericht', 'bericht-fout', MSG.bericht],
  ])('counts whitespace-only %s as empty', (_name, selector, errorId, message) => {
    const { doc, navigate } = loadPage();
    fillForm(doc, FULL);
    type(doc, selector, '   ');
    submit(doc);
    expect($(doc, `#${errorId}`).textContent.trim()).toBe(message);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('does not validate before the first submit', () => {
    const { doc } = loadPage();
    type(doc, '#email', 'naam@bedrijf');
    type(doc, '#naam', '');
    expect($(doc, '#email-fout').textContent.trim()).toBe('');
    expect(isInvalid($(doc, '#email'))).toBe(false);
    expect($(doc, '#naam-fout').textContent.trim()).toBe('');
  });
});

describe('re-validation after a failed submit', () => {
  it.each([
    ['naam', '#naam', 'Jan'],
    ['email', '#email', 'jan@voorbeeld.nl'],
    ['bericht', '#bericht', 'Een vraag'],
  ])('clears the %s message and aria-invalid as soon as the field is fixed', (field, selector, value) => {
    const { doc, navigate } = loadPage();
    submit(doc);
    expect(isInvalid($(doc, selector))).toBe(true);
    type(doc, selector, value);
    expect($(doc, `#${field}-fout`).textContent.trim()).toBe('');
    expect($(doc, `#${field}-fout`).hidden).toBe(true);
    expect(isInvalid($(doc, selector))).toBe(false);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('clears the request-type error when a radio is chosen', () => {
    const { doc } = loadPage();
    submit(doc);
    radio(doc, 'vraag').click();
    expect($(doc, '#onderwerp-fout').textContent.trim()).toBe('');
    expect(isInvalid($(doc, 'fieldset#onderwerp-groep'))).toBe(false);
  });

  it('shows a new message when the visitor types an invalid value after a failed submit', () => {
    const { doc } = loadPage();
    submit(doc);
    type(doc, '#email', 'naam@bedrijf');
    expect($(doc, '#email-fout').textContent.trim()).toBe(MSG.emailFout);
    expect(isInvalid($(doc, '#email'))).toBe(true);
  });

  it('leaves the other invalid fields marked while one is fixed', () => {
    const { doc } = loadPage();
    submit(doc);
    type(doc, '#naam', 'Jan');
    expect(isInvalid($(doc, '#email'))).toBe(true);
    expect($(doc, '#bericht-fout').textContent.trim()).toBe(MSG.bericht);
  });
});

describe('valid submit', () => {
  it('navigates once to a mailto for info@newconet.nl and prevents the native submit', () => {
    const { doc, win, navigate } = loadPage();
    fillForm(doc);
    let prevented = false;
    form(doc).addEventListener('submit', (event) => {
      prevented = event.defaultPrevented;
    });
    submit(doc);
    expect(navigate).toHaveBeenCalledTimes(1);
    const href = navigate.mock.calls[0][0];
    expect(href.startsWith(`${MAIL}?subject=`)).toBe(true);
    expect(prevented).toBe(true);
    expect(win.location.href).not.toContain('mailto');
  });

  it('navigates to the href buildMailto returns for the entered values', () => {
    const { doc, navigate } = loadPage();
    fillForm(doc);
    submit(doc);
    expect(navigate.mock.calls[0][0]).toBe(buildMailto(FULL).href);
  });

  it('decodes to the spec subject and CRLF-joined body for the full example', () => {
    const { doc, navigate } = loadPage();
    fillForm(doc);
    submit(doc);
    const { subject, body } = decode(navigate.mock.calls[0][0]);
    expect(subject).toBe('Offerteaanvraag via de website: Zakelijk WiFi');
    expect(body).toBe(FULL_BODY);
  });

  it('leaves out empty optional fields and an unknown service', () => {
    const { doc, navigate } = loadPage();
    fillForm(doc, { ...FULL, onderwerp: 'vraag', dienst: '', bedrijf: '', telefoon: '' });
    submit(doc);
    const { subject, body } = decode(navigate.mock.calls[0][0]);
    expect(subject).toBe('Vraag via de website');
    expect(body).toBe(
      ['Onderwerp: Algemene vraag', 'Naam: Jan de Vries', 'E-mailadres: jan@voorbeeld.nl', '', 'Bericht:', FULL.bericht].join('\r\n'),
    );
  });

  it('uses the not-urgent subject for a storing message', () => {
    const { doc, navigate } = loadPage();
    fillForm(doc, { ...FULL, onderwerp: 'storing', dienst: '' });
    submit(doc);
    expect(decode(navigate.mock.calls[0][0]).subject).toBe('Storing (niet urgent) via de website');
  });

  it('trims the entered values before building the body', () => {
    const { doc, navigate } = loadPage();
    fillForm(doc, { ...FULL, naam: '  Jan de Vries  ' });
    submit(doc);
    expect(decode(navigate.mock.calls[0][0]).body).toContain('Naam: Jan de Vries\r\n');
  });

  it('shows the confirmation panel and moves focus to its heading', () => {
    const { doc } = loadPage();
    fillForm(doc);
    submit(doc);
    const panel = $(doc, '#formulier-bevestiging');
    expect(panel.hidden).toBe(false);
    const heading = $(panel, 'h4#bevestiging-titel');
    expect(heading.textContent.trim()).toBe('Nog één stap: verstuur de e-mail');
    expect(heading.getAttribute('tabindex')).toBe('-1');
    expect(doc.activeElement).toBe(heading);
  });

  it('explains the next step and offers the address and number as links', () => {
    const { doc } = loadPage();
    fillForm(doc);
    submit(doc);
    const panel = $(doc, '#formulier-bevestiging');
    const text = norm(panel.textContent);
    expect(text).toContain(
      'Uw e-mailprogramma opent een nieuwe e-mail aan info@newconet.nl met uw bericht erin. Pas als u die e-mail verstuurt, ontvangen wij uw bericht.',
    );
    expect(text).toContain('Opende er geen e-mail? Kopieer dan uw bericht en mail het naar info@newconet.nl, of bel ons op +31 (0)00 000 00 00.');
    expect([...panel.querySelectorAll(`a[href="${TEL}"]`)].length).toBeGreaterThanOrEqual(1);
    expect([...panel.querySelectorAll(`a[href^="${MAIL}"]`)].length).toBeGreaterThanOrEqual(1);
  });

  it('announces that the e-mail program opens, without an error style', () => {
    const { doc } = loadPage();
    fillForm(doc);
    submit(doc);
    expect(status(doc).textContent.trim()).toBe(MSG.geopend);
    expect(status(doc).classList.contains('is-error')).toBe(false);
  });

  it('keeps every entered value', () => {
    const { doc } = loadPage();
    fillForm(doc);
    submit(doc);
    expect($(doc, '#naam').value).toBe(FULL.naam);
    expect($(doc, '#bedrijf').value).toBe(FULL.bedrijf);
    expect($(doc, '#email').value).toBe(FULL.email);
    expect($(doc, '#telefoon').value).toBe(FULL.telefoon);
    expect($(doc, '#bericht').value).toBe(FULL.bericht);
    expect($(doc, '#dienst').value).toBe(FULL.dienst);
    expect(radio(doc, 'offerte').checked).toBe(true);
  });

  it('fills the read-only copy textarea with the exact e-mail body', () => {
    const { doc } = loadPage();
    fillForm(doc);
    submit(doc);
    const copy = $(doc, 'textarea#bericht-kopie');
    expect(copy.readOnly).toBe(true);
    // A textarea's value API normalises CRLF to LF.
    expect(copy.value).toBe(FULL_BODY.replace(/\r\n/g, '\n'));
  });

  it('points "Open de e-mail opnieuw" at the same mailto URL', () => {
    const { doc, navigate } = loadPage();
    fillForm(doc);
    submit(doc);
    const again = $(doc, 'a#mailto-opnieuw');
    expect(nameOf(again)).toBe('Open de e-mail opnieuw');
    expect(again.getAttribute('href')).toBe(navigate.mock.calls[0][0]);
  });

  it('rebuilds the link, the copy and the navigation on a second submit', () => {
    const { doc, navigate } = loadPage();
    fillForm(doc);
    submit(doc);
    type(doc, '#naam', 'Piet Jansen');
    submit(doc);
    expect(navigate).toHaveBeenCalledTimes(2);
    const second = navigate.mock.calls[1][0];
    expect(decode(second).body).toContain('Naam: Piet Jansen');
    expect($(doc, '#mailto-opnieuw').getAttribute('href')).toBe(second);
    expect($(doc, '#bericht-kopie').value).toContain('Naam: Piet Jansen');
  });

  it('does not navigate on page load', () => {
    const { navigate } = loadPage();
    expect(navigate).not.toHaveBeenCalled();
  });
});

describe('markup in submitted values', () => {
  const payload = '<script>alert(1)</script><img src=x onerror="alert(2)">';

  it('creates no element from a script or img value and shows it as text in the copy textarea', () => {
    const { doc, navigate } = loadPage();
    fillForm(doc, { ...FULL, bericht: payload });
    const before = doc.querySelectorAll('*').length;
    submit(doc);
    expect(navigate).toHaveBeenCalledTimes(1);
    expect(doc.querySelectorAll('*').length).toBe(before);
    expect(doc.querySelectorAll('img[onerror], img[src="x"]')).toHaveLength(0);
    expect([...doc.querySelectorAll('script')].some((sc) => sc.textContent.includes('alert'))).toBe(false);
    expect($(doc, '#bericht-kopie').value).toContain(payload);
    expect(decode(navigate.mock.calls[0][0]).body).toContain(payload);
  });

  it('shows a hostile name as text everywhere it appears after submit', () => {
    const { doc } = loadPage();
    fillForm(doc, { ...FULL, naam: payload });
    submit(doc);
    expect(doc.querySelectorAll('img[onerror]')).toHaveLength(0);
    expect($(doc, '#bericht-kopie').value).toContain(`Naam: ${payload}`);
  });
});

describe('copying the message', () => {
  const submitValid = (page) => {
    fillForm(page.doc);
    submit(page.doc);
    return $(page.doc, '#kopieer-bericht');
  };

  it('writes the body to the clipboard and reports success', async () => {
    const clipboard = { writeText: vi.fn().mockResolvedValue(undefined) };
    const page = loadPage({ clipboard });
    submitValid(page).click();
    await vi.waitFor(() => expect(status(page.doc).textContent.trim()).toBe(MSG.gekopieerd));
    expect(clipboard.writeText).toHaveBeenCalledWith(FULL_BODY);
    expect(status(page.doc).classList.contains('is-error')).toBe(false);
  });

  it('selects the textarea text and reports the Dutch failure when the clipboard refuses', async () => {
    const clipboard = { writeText: vi.fn().mockRejectedValue(new Error('denied')) };
    const page = loadPage({ clipboard });
    submitValid(page).click();
    await vi.waitFor(() => expect(status(page.doc).textContent.trim()).toBe(MSG.kopieerFout));
    expect(status(page.doc).classList.contains('is-error')).toBe(true);
    const copy = $(page.doc, '#bericht-kopie');
    expect(copy.selectionStart).toBe(0);
    expect(copy.selectionEnd).toBe(copy.value.length);
  });

  it('reports the Dutch failure when the browser offers no clipboard', async () => {
    const page = loadPage();
    submitValid(page).click();
    await vi.waitFor(() => expect(status(page.doc).textContent.trim()).toBe(MSG.kopieerFout));
    expect(status(page.doc).classList.contains('is-error')).toBe(true);
  });
});

describe('mobile menu', () => {
  const toggle = (doc) => $(doc, 'button#nav-toggle');
  const escape = (doc, target) =>
    target.dispatchEvent(new doc.defaultView.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

  it('starts closed with the "Menu openen" label and controls the main menu', () => {
    const { doc } = loadPage();
    expect(toggle(doc).getAttribute('aria-controls')).toBe('hoofdmenu');
    expect(toggle(doc).getAttribute('aria-expanded')).toBe('false');
    expect(nameOf(toggle(doc))).toBe('Menu openen');
  });

  it('opens on activation, updates state and label, and focuses "Diensten"', () => {
    const { doc } = loadPage();
    toggle(doc).click();
    expect(toggle(doc).getAttribute('aria-expanded')).toBe('true');
    expect(nameOf(toggle(doc))).toBe('Menu sluiten');
    expect(doc.activeElement).toBe(link($(doc, 'nav#hoofdmenu'), 'Diensten'));
  });

  it('closes on a second activation and leaves focus on the toggle', () => {
    const { doc } = loadPage();
    toggle(doc).click();
    toggle(doc).click();
    expect(toggle(doc).getAttribute('aria-expanded')).toBe('false');
    expect(nameOf(toggle(doc))).toBe('Menu openen');
    expect(doc.activeElement).toBe(toggle(doc));
  });

  it('closes on Escape and returns focus to the toggle', () => {
    const { doc } = loadPage();
    toggle(doc).click();
    escape(doc, doc.activeElement);
    expect(toggle(doc).getAttribute('aria-expanded')).toBe('false');
    expect(doc.activeElement).toBe(toggle(doc));
  });

  it('leaves focus alone when Escape is pressed with the menu closed', () => {
    const { doc } = loadPage();
    const field = $(doc, '#naam');
    field.focus();
    escape(doc, field);
    expect(doc.activeElement).toBe(field);
  });

  it('closes when a menu link is followed', () => {
    const { doc } = loadPage();
    toggle(doc).click();
    link($(doc, 'nav#hoofdmenu'), 'Werkwijze').click();
    expect(toggle(doc).getAttribute('aria-expanded')).toBe('false');
    expect(nameOf(toggle(doc))).toBe('Menu openen');
  });

  it('holds the five menu links with their targets', () => {
    const { doc } = loadPage();
    const links = [...$(doc, 'nav#hoofdmenu').querySelectorAll('a')].map((a) => [nameOf(a), a.getAttribute('href')]);
    expect(links).toEqual([
      ['Diensten', '#diensten'],
      ['Werkwijze', '#werkwijze'],
      ['Over ons', '#over-ons'],
      ['Vragen', '#vragen'],
      ['Contact', '#contact'],
    ]);
  });
});

describe('contact details', () => {
  it('shows the phone, address and email exactly as the placeholder table says', () => {
    const { doc } = loadPage();
    const text = norm($(doc, 'section.contact').textContent);
    expect(text).toContain(PHONE);
    expect(text).toContain('Straatnaam 1, 0000 AA Plaatsnaam');
    expect(text).toContain('info@newconet.nl');
    expect(text).toContain('Ma–vr: 08:30 – 17:30');
    expect(text).toContain('24/7 bereikbaar bij storing');
    expect(link($(doc, 'section.contact'), PHONE).getAttribute('href')).toBe(TEL);
    expect(link($(doc, 'section.contact'), 'info@newconet.nl').getAttribute('href')).toBe(MAIL);
  });

  it('uses only the placeholder number and address in every tel: and mailto: link', () => {
    const { doc } = loadPage();
    const tels = [...doc.querySelectorAll('a[href^="tel:"]')];
    expect(tels.length).toBeGreaterThanOrEqual(6);
    expect(new Set(tels.map((a) => a.getAttribute('href')))).toEqual(new Set([TEL]));
    const mails = [...doc.querySelectorAll('a[href^="mailto:"]')];
    expect(mails.length).toBeGreaterThanOrEqual(3);
    expect(mails.every((a) => a.getAttribute('href') === MAIL)).toBe(true);
  });

  it('shows the placeholder phone text wherever a tel: link shows a number', () => {
    const { doc } = loadPage();
    const numeric = [...doc.querySelectorAll('a[href^="tel:"]')].map(nameOf).filter((n) => /\d/.test(n));
    expect(numeric.length).toBeGreaterThan(0);
    expect(numeric.every((n) => n === PHONE || n === `Bel ${PHONE}`)).toBe(true);
  });

  it('gives the outage band and the hero a call link', () => {
    const { doc } = loadPage();
    expect(link($(doc, 'section.storing#storing'), `Bel ${PHONE}`).getAttribute('href')).toBe(TEL);
    expect(link($(doc, 'section.hero'), PHONE).getAttribute('href')).toBe(TEL);
  });

  it('links the header outage button to the outage band', () => {
    const { doc } = loadPage();
    expect(link($(doc, 'header'), 'Storing?').getAttribute('href')).toBe('#storing');
  });
});

describe('footer', () => {
  it('repeats phone, email, address, hours and the 24/7 outage line', () => {
    const { doc } = loadPage();
    const footer = $(doc, 'footer.site-footer');
    const text = norm(footer.textContent);
    expect(text).toContain(`Telefoon: ${PHONE}`);
    expect(text).toContain('E-mail: info@newconet.nl');
    expect(text).toContain('Straatnaam 1, 0000 AA Plaatsnaam');
    expect(text).toContain('Ma–vr: 08:30 – 17:30');
    expect(text).toContain('Storing: 24/7 telefonisch bereikbaar');
    expect(link(footer, PHONE).getAttribute('href')).toBe(TEL);
    expect(link(footer, 'info@newconet.nl').getAttribute('href')).toBe(MAIL);
  });

  it('carries the brand line, the two h2s and the labelled link column', () => {
    const { doc } = loadPage();
    const footer = $(doc, 'footer.site-footer');
    expect(norm(footer.textContent)).toContain('Netwerkoplossingen voor bedrijven: aanleg, beheer en beveiliging.');
    expect([...footer.querySelectorAll('h2')].map((h) => h.textContent.trim())).toEqual(['Contact', 'Snel naar']);
    expect(footer.querySelectorAll('nav[aria-label="Voettekst"] a')).toHaveLength(5);
  });

  it('sets the copyright year to the current year, replacing the fallback text', () => {
    const { doc } = loadPage({ jaarFallback: '1999' });
    expect($(doc, 'span#jaar').textContent.trim()).toBe(String(new Date().getFullYear()));
    expect(norm($(doc, 'footer.site-footer').textContent)).toContain(
      `© ${new Date().getFullYear()} NewCONet. Alle rechten voorbehouden.`,
    );
  });

  it('carries the build year as fallback text in the HTML', () => {
    const html = readFileSync(INDEX_HTML, 'utf8');
    expect(html).toMatch(/<span[^>]*id="jaar"[^>]*>\s*20\d\d\s*<\/span>/);
  });
});

describe('honesty about sending', () => {
  const claimsSent = /bedankt|verzonden|is verstuurd|succesvol|hebben uw bericht ontvangen/i;

  it('never shows a thank-you or sent message on load', () => {
    const { doc } = loadPage();
    expect(doc.body.textContent).not.toContain('Bedankt voor uw bericht');
    expect(doc.body.textContent).not.toMatch(claimsSent);
  });

  it('never shows a thank-you or sent message after a valid submit or a copy', async () => {
    const clipboard = { writeText: vi.fn().mockResolvedValue(undefined) };
    const { doc } = loadPage({ clipboard });
    fillForm(doc);
    submit(doc);
    $(doc, '#kopieer-bericht').click();
    await vi.waitFor(() => expect(status(doc).textContent.trim()).toBe(MSG.gekopieerd));
    expect(doc.body.textContent).not.toContain('Bedankt voor uw bericht');
    expect(doc.body.textContent).not.toMatch(claimsSent);
  });
});
