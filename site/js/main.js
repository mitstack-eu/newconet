import { EN, TEKSTEN, TITELS } from './i18n.js';

const MAIL_TO = 'info@newconet.nl';
const STORAGE_KEY = 'newconet-taal';
const TALEN = ['nl', 'en'];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[\d\s+\-()]+$/;
const MIN_PHONE_DIGITS = 8;

/** Form order, which decides which invalid field receives focus. */
const FIELDS = ['rol', 'onderwerp', 'naam', 'bedrijf', 'email', 'telefoon', 'bericht'];

const clean = (fields) =>
  Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, String(value ?? '').trim()]));

const isValidPhone = (value) =>
  PHONE_PATTERN.test(value) && value.replace(/\D/g, '').length >= MIN_PHONE_DIGITS;

const isKnown = (table, value) => Object.hasOwn(table, value);

export function validate(fields, taal = 'nl') {
  const { rol, onderwerp, naam, bedrijf, email, telefoon, bericht } = clean(fields);
  const { fouten, rollen, onderwerpen } = TEKSTEN[taal];
  const errors = {};
  if (!isKnown(rollen, rol)) errors.rol = fouten.rol;
  else if (rol === 'bewoner') errors.rol = fouten.rolBewoner;
  if (!isKnown(onderwerpen, onderwerp)) errors.onderwerp = fouten.onderwerp;
  if (!naam) errors.naam = fouten.naam;
  if (!bedrijf) errors.bedrijf = fouten.bedrijf;
  if (!email) errors.email = fouten.emailLeeg;
  else if (!EMAIL_PATTERN.test(email)) errors.email = fouten.emailFout;
  if (telefoon && !isValidPhone(telefoon)) errors.telefoon = fouten.telefoon;
  if (!bericht) errors.bericht = fouten.bericht;
  return errors;
}

export function buildMailto(fields, taal = 'nl') {
  const { rol, onderwerp, gebouw, naam, bedrijf, email, telefoon, bericht } = clean(fields);
  const { rollen, onderwerpen, gebouwen, regels } = TEKSTEN[taal];
  const gebouwLabel = isKnown(gebouwen, gebouw) ? gebouwen[gebouw] : '';
  const base = onderwerpen[onderwerp].subject;
  const subject = gebouwLabel && gebouw !== 'anders' ? `${base}: ${gebouwLabel}` : base;
  const line = (label, value) => (value ? `${label}: ${value}` : null);
  const body = [
    line(regels.rol, rollen[rol]),
    line(regels.onderwerp, onderwerpen[onderwerp].label),
    line(regels.gebouw, gebouwLabel),
    line(regels.naam, naam),
    line(regels.organisatie, bedrijf),
    line(regels.email, email),
    line(regels.telefoon, telefoon),
    '',
    `${regels.bericht}:`,
    bericht.replace(/\r?\n/g, '\r\n'),
  ]
    .filter((entry) => entry !== null)
    .join('\r\n');
  const href = `mailto:${MAIL_TO}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  return { subject, body, href };
}

/**
 * Decides the opening language, switches the page between Dutch and English and
 * tells subscribers when the language changes. The Dutch markup is recorded
 * before any language is applied, so switching back restores it exactly.
 */
function initLanguage(doc, win) {
  const dutchHtml = [...doc.querySelectorAll('[data-i18n]')].map((el) => [el, el.innerHTML]);
  const dutchAria = [...doc.querySelectorAll('[data-i18n-aria]')].map((el) => [el, el.getAttribute('aria-label')]);
  const button = doc.getElementById('taal-toggle');
  const buttonText = doc.getElementById('taal-toggle-tekst');
  const listeners = [];
  let current = 'nl';

  const readStored = () => {
    try {
      return win.localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  };
  const store = (taal) => {
    try {
      win.localStorage.setItem(STORAGE_KEY, taal);
    } catch {
      // Storage is unavailable: the choice lasts until the page reloads.
    }
  };
  const dropLangParameter = () => {
    const url = new URL(win.location.href);
    if (!url.searchParams.has('lang')) return;
    url.searchParams.delete('lang');
    try {
      win.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
    } catch {
      // The address keeps its lang parameter; the switch itself still worked.
    }
  };

  const apply = (taal) => {
    const english = taal === 'en';
    current = taal;
    doc.documentElement.lang = taal;
    doc.title = TITELS[taal];
    dutchHtml.forEach(([el, html]) => {
      el.innerHTML = english ? EN[el.dataset.i18n] : html;
    });
    dutchAria.forEach(([el, label]) => {
      el.setAttribute('aria-label', english ? EN[el.dataset.i18nAria] : label);
    });
    const { tekst, lang, label } = TEKSTEN[taal].taalKnop;
    buttonText.textContent = tekst;
    button.lang = lang;
    button.setAttribute('aria-label', label);
    listeners.forEach((listener) => listener(taal));
  };

  button.addEventListener('click', () => {
    apply(current === 'en' ? 'nl' : 'en');
    store(current);
    dropLangParameter();
  });

  return {
    taal: () => current,
    onChange: (listener) => listeners.push(listener),
    start() {
      const requested = new URLSearchParams(win.location.search).get('lang');
      apply([requested, readStored()].find((taal) => TALEN.includes(taal)) ?? 'nl');
    },
  };
}

function initMenu(doc, win, language) {
  const toggle = doc.getElementById('nav-toggle');
  const menu = doc.getElementById('hoofdmenu');
  const isOpen = () => toggle.getAttribute('aria-expanded') === 'true';
  const renderLabel = () => {
    const { menu: labels } = TEKSTEN[language.taal()];
    toggle.setAttribute('aria-label', isOpen() ? labels.sluiten : labels.openen);
  };
  const setOpen = (open) => {
    menu.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
    renderLabel();
  };
  const closeToToggle = () => {
    setOpen(false);
    toggle.focus();
  };

  language.onChange(renderLabel);
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

function initForm(doc, { go, clipboard }, language) {
  const form = doc.getElementById('contactformulier');
  const byId = (id) => doc.getElementById(id);
  const status = byId('formulier-status');
  const outageNotice = byId('storing-melding');
  const residentNotice = byId('bewoner-melding');
  const rest = byId('formulier-rest');
  const confirmation = byId('formulier-bevestiging');
  const copyField = byId('bericht-kopie');
  const reopen = byId('mailto-opnieuw');
  const radios = [...form.querySelectorAll('input[name="onderwerp"]')];
  let submitted = false;
  let lastBody = '';
  let statusKey = null;
  let statusIsError = false;

  const texts = () => TEKSTEN[language.taal()];

  const readFields = () => ({
    rol: byId('rol').value,
    onderwerp: radios.find((radio) => radio.checked)?.value ?? '',
    gebouw: byId('gebouw').value,
    naam: byId('naam').value,
    bedrijf: byId('bedrijf').value,
    email: byId('email').value,
    telefoon: byId('telefoon').value,
    bericht: byId('bericht').value,
  });

  const renderStatus = () => {
    status.textContent = statusKey ? texts().status[statusKey] : '';
    status.classList.toggle('is-error', statusIsError);
  };

  const setStatus = (key, isError = false) => {
    statusKey = key;
    statusIsError = isError;
    renderStatus();
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
    const errors = validate(readFields(), language.taal());
    showError(field, errors[field]);
    if (!Object.keys(errors).length && statusKey === 'onvolledig') setStatus(null);
  };

  const syncRole = () => {
    const isResident = byId('rol').value === 'bewoner';
    residentNotice.hidden = !isResident;
    rest.hidden = isResident;
    if (isResident) setStatus('bewoner');
    else if (statusKey === 'bewoner') setStatus(null);
  };

  const syncType = () => {
    const isStoring = readFields().onderwerp === 'storing';
    outageNotice.hidden = !isStoring;
    if (isStoring) setStatus('storing');
    else if (statusKey === 'storing') setStatus(null);
  };

  const fieldOf = (target) => (target.name === 'onderwerp' ? 'onderwerp' : target.id);

  const onEdit = (event) => {
    const field = fieldOf(event.target);
    if (submitted && FIELDS.includes(field)) revalidate(field);
  };
  form.addEventListener('input', onEdit);
  form.addEventListener('change', (event) => {
    if (event.target.name === 'onderwerp') syncType();
    if (event.target.id === 'rol') syncRole();
    onEdit(event);
  });

  doc.addEventListener('click', (event) => {
    const link = event.target.closest('[data-onderwerp]');
    if (!link) return;
    const radio = radios.find((candidate) => candidate.value === link.dataset.onderwerp);
    if (!radio) return;
    radio.checked = true;
    if (link.dataset.gebouw) byId('gebouw').value = link.dataset.gebouw;
    syncType();
    onEdit({ target: radio });
  });

  language.onChange(() => {
    renderStatus();
    const errors = validate(readFields(), language.taal());
    FIELDS.filter((field) => !byId(`${field}-fout`).hidden).forEach((field) => showError(field, errors[field]));
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const fields = readFields();
    const errors = validate(fields, language.taal());
    FIELDS.forEach((field) => showError(field, errors[field]));
    const firstInvalid = FIELDS.find((field) => errors[field]);
    if (firstInvalid) {
      submitted = true;
      confirmation.hidden = true;
      setStatus('onvolledig', true);
      focusField(firstInvalid);
      return;
    }
    const { body, href } = buildMailto(fields, language.taal());
    lastBody = body;
    copyField.value = body;
    reopen.setAttribute('href', href);
    go(href);
    confirmation.hidden = false;
    setStatus('geopend');
    byId('bevestiging-titel').focus();
  });

  byId('kopieer-bericht').addEventListener('click', async () => {
    try {
      await clipboard.writeText(lastBody);
      setStatus('gekopieerd');
    } catch {
      copyField.select();
      setStatus('kopieerFout', true);
    }
  });
}

export function init(doc, { navigate, clipboard } = {}) {
  const win = doc.defaultView;
  doc.getElementById('jaar').textContent = String(new Date().getFullYear());
  const language = initLanguage(doc, win);
  initMenu(doc, win, language);
  initForm(
    doc,
    {
      go: navigate ?? ((href) => win.location.assign(href)),
      clipboard: clipboard ?? win.navigator.clipboard,
    },
    language,
  );
  language.start();
}

if (typeof document !== 'undefined' && document.getElementById('contactformulier')) init(document);
