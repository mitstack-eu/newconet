const MAIL_TO = 'info@newconet.nl';

const ONDERWERPEN = {
  offerte: { label: 'Offerte of advies', subject: 'Offerteaanvraag via de website' },
  storing: { label: 'Storing melden', subject: 'Storing (niet urgent) via de website' },
  vraag: { label: 'Algemene vraag', subject: 'Vraag via de website' },
};

const DIENSTEN = {
  netwerkaanleg: 'Netwerkaanleg',
  'zakelijk-wifi': 'Zakelijk WiFi',
  'glasvezel-bekabeling': 'Glasvezel & bekabeling',
  'beheer-onderhoud': 'Beheer & onderhoud',
  netwerkbeveiliging: 'Netwerkbeveiliging',
  'cloud-connectiviteit': 'Cloud & connectiviteit',
};

const MESSAGES = {
  onderwerp: 'Kies waarmee wij u kunnen helpen.',
  naam: 'Vul uw naam in.',
  emailLeeg: 'Vul uw e-mailadres in.',
  emailFout: 'Vul een geldig e-mailadres in, bijvoorbeeld naam@bedrijf.nl.',
  telefoon: 'Vul een geldig telefoonnummer in, of laat dit veld leeg.',
  bericht: 'Vul uw bericht in.',
};

const STATUS = {
  onvolledig: 'Het formulier is nog niet compleet. Controleer de gemarkeerde velden.',
  storing: 'Bel bij een urgente storing direct +31 (0)00 000 00 00.',
  geopend: 'Uw e-mailprogramma wordt geopend. Verstuur de e-mail om uw bericht bij ons te krijgen.',
  gekopieerd: 'Bericht gekopieerd.',
  kopieerFout: 'Kopiëren lukte niet. Selecteer de tekst en kopieer hem zelf.',
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[\d\s+\-()]+$/;
const MIN_PHONE_DIGITS = 8;

/** Form order, which decides which invalid field receives focus. */
const FIELDS = ['onderwerp', 'naam', 'email', 'telefoon', 'bericht'];

const clean = (fields) =>
  Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, String(value ?? '').trim()]));

const isValidPhone = (value) =>
  PHONE_PATTERN.test(value) && value.replace(/\D/g, '').length >= MIN_PHONE_DIGITS;

export function validate(fields) {
  const { onderwerp, naam, email, telefoon, bericht } = clean(fields);
  const errors = {};
  if (!(onderwerp in ONDERWERPEN)) errors.onderwerp = MESSAGES.onderwerp;
  if (!naam) errors.naam = MESSAGES.naam;
  if (!email) errors.email = MESSAGES.emailLeeg;
  else if (!EMAIL_PATTERN.test(email)) errors.email = MESSAGES.emailFout;
  if (telefoon && !isValidPhone(telefoon)) errors.telefoon = MESSAGES.telefoon;
  if (!bericht) errors.bericht = MESSAGES.bericht;
  return errors;
}

export function buildMailto(fields) {
  const { onderwerp, dienst, naam, bedrijf, email, telefoon, bericht } = clean(fields);
  const dienstLabel = DIENSTEN[dienst];
  const base = ONDERWERPEN[onderwerp].subject;
  const subject = dienstLabel ? `${base}: ${dienstLabel}` : base;
  const line = (label, value) => (value ? `${label}: ${value}` : null);
  const body = [
    line('Onderwerp', ONDERWERPEN[onderwerp].label),
    line('Dienst', dienstLabel),
    line('Naam', naam),
    line('Bedrijf', bedrijf),
    line('E-mailadres', email),
    line('Telefoon', telefoon),
    '',
    'Bericht:',
    bericht.replace(/\r?\n/g, '\r\n'),
  ]
    .filter((entry) => entry !== null)
    .join('\r\n');
  const href = `mailto:${MAIL_TO}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  return { subject, body, href };
}

function initMenu(doc, win) {
  const toggle = doc.getElementById('nav-toggle');
  const menu = doc.getElementById('hoofdmenu');
  const isOpen = () => toggle.getAttribute('aria-expanded') === 'true';
  const setOpen = (open) => {
    menu.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Menu sluiten' : 'Menu openen');
  };
  const closeToToggle = () => {
    setOpen(false);
    toggle.focus();
  };

  toggle.addEventListener('click', () => {
    if (isOpen()) return closeToToggle();
    setOpen(true);
    menu.querySelector('a').focus();
  });
  doc.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isOpen()) closeToToggle();
  });
  menu.addEventListener('click', (event) => {
    if (event.target.closest('a')) setOpen(false);
  });
  win.matchMedia?.('(max-width: 960px)').addEventListener('change', (event) => {
    if (!event.matches) setOpen(false);
  });
}

function initForm(doc, { go, clipboard }) {
  const form = doc.getElementById('contactformulier');
  const byId = (id) => doc.getElementById(id);
  const status = byId('formulier-status');
  const notice = byId('storing-melding');
  const confirmation = byId('formulier-bevestiging');
  const copyField = byId('bericht-kopie');
  const reopen = byId('mailto-opnieuw');
  const radios = [...form.querySelectorAll('input[name="onderwerp"]')];
  let submitted = false;
  let lastBody = '';

  const readFields = () => ({
    onderwerp: radios.find((radio) => radio.checked)?.value ?? '',
    dienst: byId('dienst').value,
    naam: byId('naam').value,
    bedrijf: byId('bedrijf').value,
    email: byId('email').value,
    telefoon: byId('telefoon').value,
    bericht: byId('bericht').value,
  });

  const setStatus = (text, isError = false) => {
    status.textContent = text;
    status.classList.toggle('is-error', isError);
  };

  const showError = (field, message) => {
    const error = byId(`${field}-fout`);
    const control = field === 'onderwerp' ? byId('onderwerp-groep') : byId(field);
    error.textContent = message ?? '';
    error.hidden = !message;
    if (message) control.setAttribute('aria-invalid', 'true');
    else control.removeAttribute('aria-invalid');
  };

  const focusField = (field) => (field === 'onderwerp' ? radios[0] : byId(field)).focus();

  const revalidate = (field) => {
    const errors = validate(readFields());
    showError(field, errors[field]);
    if (!Object.keys(errors).length && status.textContent === STATUS.onvolledig) setStatus('');
  };

  const syncType = () => {
    const isStoring = readFields().onderwerp === 'storing';
    notice.hidden = !isStoring;
    if (isStoring) setStatus(STATUS.storing);
    else if (status.textContent === STATUS.storing) setStatus('');
  };

  const fieldOf = (target) => (target.name === 'onderwerp' ? 'onderwerp' : target.id);

  const onEdit = (event) => {
    const field = fieldOf(event.target);
    if (submitted && FIELDS.includes(field)) revalidate(field);
  };
  form.addEventListener('input', onEdit);
  form.addEventListener('change', (event) => {
    if (event.target.name === 'onderwerp') syncType();
    onEdit(event);
  });

  doc.addEventListener('click', (event) => {
    const link = event.target.closest('[data-onderwerp]');
    if (!link) return;
    const radio = radios.find((candidate) => candidate.value === link.dataset.onderwerp);
    radio.checked = true;
    if (link.dataset.dienst) byId('dienst').value = link.dataset.dienst;
    syncType();
    onEdit({ target: radio });
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const fields = readFields();
    const errors = validate(fields);
    FIELDS.forEach((field) => showError(field, errors[field]));
    const firstInvalid = FIELDS.find((field) => errors[field]);
    if (firstInvalid) {
      submitted = true;
      confirmation.hidden = true;
      setStatus(STATUS.onvolledig, true);
      focusField(firstInvalid);
      return;
    }
    const { body, href } = buildMailto(fields);
    lastBody = body;
    copyField.value = body;
    reopen.setAttribute('href', href);
    go(href);
    confirmation.hidden = false;
    setStatus(STATUS.geopend);
    byId('bevestiging-titel').focus();
  });

  byId('kopieer-bericht').addEventListener('click', async () => {
    try {
      await clipboard.writeText(lastBody);
      setStatus(STATUS.gekopieerd);
    } catch {
      copyField.select();
      setStatus(STATUS.kopieerFout, true);
    }
  });
}

export function init(doc, { navigate, clipboard } = {}) {
  const win = doc.defaultView;
  doc.getElementById('jaar').textContent = String(new Date().getFullYear());
  initMenu(doc, win);
  initForm(doc, {
    go: navigate ?? ((href) => win.location.assign(href)),
    clipboard: clipboard ?? win.navigator.clipboard,
  });
}

if (typeof document !== 'undefined' && document.getElementById('contactformulier')) init(document);
