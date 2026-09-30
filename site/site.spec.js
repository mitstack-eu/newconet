import { expect, test } from '@playwright/test';

const PHONE = '+31 (0)6 21 10 55 02';
const TEL = 'tel:+31621105502';
const MAIL = 'mailto:info@newconet.nl';
const PHONE_WIDTH = { width: 360, height: 740 };
const NARROW_WIDTH = { width: 320, height: 640 };
const H1_NL = 'Internet voor het hele gebouw. Geregeld door één partner.';
const H1_EN = 'Internet for the whole building. Arranged by one partner.';
const SUBMIT_NL = 'Open dit bericht in uw e-mailprogramma';
const LANGUAGES = [
  ['Dutch', '/', 'Storing?', 'Switch to English (EN)'],
  ['English', '/?lang=en', 'Outage?', 'Schakel naar Nederlands (NL)'],
];

const goto = async (page, size, path = '/') => {
  if (size) await page.setViewportSize(size);
  await page.goto(path);
};
const header = (page) => page.locator('header.site-header');
const scrollWidth = (page) => page.evaluate(() => document.documentElement.scrollWidth);

test.describe('reaching the right contact route on a phone', () => {
  for (const [label, path, outage, languageLabel] of LANGUAGES) {
    for (const size of [PHONE_WIDTH, NARROW_WIDTH]) {
      test(`shows ${outage}, the language button and the menu toggle at ${size.width}px in ${label} without opening the menu`, async ({ page }) => {
        await goto(page, size, path);
        const storing = header(page).getByRole('link', { name: outage, exact: true });
        await expect(storing).toBeVisible();
        await expect(storing).toHaveAttribute('href', '#storing');
        await expect(header(page).getByRole('button', { name: languageLabel, exact: true })).toBeVisible();
        const toggle = page.locator('button#nav-toggle');
        await expect(toggle).toBeVisible();
        await expect(toggle).toHaveAttribute('aria-expanded', 'false');
        const box = await toggle.boundingBox();
        expect(Math.round(box.width)).toBe(44);
      });

      test(`fits the header without horizontal scroll at ${size.width}px in ${label}`, async ({ page }) => {
        await goto(page, size, path);
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
        expect(await scrollWidth(page)).toBe(size.width);
        const edges = await header(page).evaluate((el) =>
          [...el.querySelectorAll('.header-actions > *, .nav-toggle, a.logo')]
            .filter((child) => child.getClientRects().length > 0)
            .map((child) => {
              const { left, right } = child.getBoundingClientRect();
              return { left: Math.round(left), right: Math.round(right) };
            }),
        );
        expect(edges.length).toBeGreaterThanOrEqual(4);
        for (const edge of edges) {
          expect(edge.left).toBeGreaterThanOrEqual(0);
          expect(edge.right).toBeLessThanOrEqual(size.width);
        }
      });
    }
  }

  test('fits the English header at 961px, where the English nav is widest', async ({ page }) => {
    await goto(page, { width: 961, height: 800 }, '/?lang=en');
    await expect(page.getByRole('heading', { level: 1, name: H1_EN })).toBeVisible();
    expect(await scrollWidth(page)).toBe(961);
    await expect(header(page).getByRole('navigation', { name: 'Main menu' })).toBeVisible();
  });

  test('Storing? lands on a section with a call link named after the number', async ({ page }) => {
    await goto(page, PHONE_WIDTH);
    await header(page).getByRole('link', { name: 'Storing?', exact: true }).click();
    const band = page.locator('section#storing');
    const call = band.getByRole('link', { name: `Bel ${PHONE}` });
    await expect(call).toHaveAttribute('href', TEL);
    await expect(call).toBeInViewport();
    const top = await band.evaluate((el) => el.getBoundingClientRect().top);
    expect(top).toBeGreaterThanOrEqual(0);
  });

  test('shows the sticky bar with Bellen, Mailen and Contact at 360px', async ({ page }) => {
    await goto(page, PHONE_WIDTH);
    const bar = page.getByRole('navigation', { name: 'Snel contact' });
    await expect(bar).toBeVisible();
    await expect(bar.getByRole('link', { name: 'Bellen' })).toHaveAttribute('href', TEL);
    await expect(bar.getByRole('link', { name: 'Mailen' })).toHaveAttribute('href', MAIL);
    await expect(bar.getByRole('link', { name: 'Contact', exact: true })).toHaveAttribute('href', '#contactformulier');
  });

  test('pins the sticky bar to the bottom of the viewport at 64px tall', async ({ page }) => {
    await goto(page, PHONE_WIDTH);
    const box = await page.getByRole('navigation', { name: 'Snel contact' }).boundingBox();
    expect(box.height).toBeGreaterThanOrEqual(64);
    expect(Math.round(box.y + box.height)).toBe(PHONE_WIDTH.height);
  });

  test('shows the contact bar at 720px and hides it at 721px', async ({ page }) => {
    const bar = page.getByRole('navigation', { name: 'Snel contact' });
    await goto(page, { width: 720, height: 800 });
    await expect(bar).toBeVisible();
    await page.setViewportSize({ width: 721, height: 800 });
    await expect(bar).toBeHidden();
  });

  test('hides the header contact button at 720px and shows it at 721px', async ({ page }) => {
    const contact = header(page).getByRole('link', { name: 'Neem contact op' });
    await goto(page, { width: 720, height: 800 });
    await expect(contact).toBeHidden();
    await page.setViewportSize({ width: 721, height: 800 });
    await expect(contact).toBeVisible();
    await expect(contact).toHaveAttribute('href', '#contact');
  });

  test('puts the introduction button in the hero on the first screen at 360px', async ({ page }) => {
    await goto(page, PHONE_WIDTH);
    const cta = page.locator('section.hero#top').getByRole('link', { name: 'Plan een kennismaking' });
    await expect(cta).toHaveAttribute('href', '#contactformulier');
    await expect(cta).toBeInViewport();
  });
});

test.describe('the language button', () => {
  test('switches the visible page to English and back', async ({ page }) => {
    await goto(page, { width: 1280, height: 800 });
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(H1_NL);
    await expect(page.locator('html')).toHaveAttribute('lang', 'nl');

    await page.getByRole('button', { name: 'Switch to English (EN)' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(H1_EN);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page).toHaveTitle('NewCONet | Internet and wifi for multi-tenant office buildings and complete apartment complexes');
    const button = page.getByRole('button', { name: 'Schakel naar Nederlands (NL)' });
    await expect(button).toHaveText('NL');
    await expect(button).toHaveAttribute('lang', 'nl');
    await expect(page.getByRole('navigation', { name: 'Main menu' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Outage?', exact: true })).toBeVisible();

    await button.click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(H1_NL);
    await expect(page.locator('html')).toHaveAttribute('lang', 'nl');
    await expect(page).toHaveTitle('NewCONet | Internet en wifi voor multi-tenant kantoorgebouwen en complete appartementencomplexen');
    await expect(page.getByRole('button', { name: 'Switch to English (EN)' })).toHaveText('EN');
  });

  test('keeps the chosen language after a reload', async ({ page }) => {
    await goto(page, { width: 1280, height: 800 });
    await page.getByRole('button', { name: 'Switch to English (EN)' }).click();
    await page.reload();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(H1_EN);
    expect(await page.evaluate(() => localStorage.getItem('newconet-taal'))).toBe('en');
  });

  test('opens English from ?lang=en without storing the choice', async ({ page }) => {
    await goto(page, { width: 1280, height: 800 }, '/?lang=en');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(H1_EN);
    expect(await page.evaluate(() => localStorage.getItem('newconet-taal'))).toBeNull();
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(H1_NL);
  });

  test('removes the lang parameter from the address when the visitor switches', async ({ page }) => {
    await goto(page, { width: 1280, height: 800 }, '/?lang=en');
    await page.getByRole('button', { name: 'Schakel naar Nederlands (NL)' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(H1_NL);
    expect(new URL(page.url()).searchParams.has('lang')).toBe(false);
    await page.reload();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(H1_NL);
  });

  test('renders the form errors in English after switching', async ({ page }) => {
    await goto(page, { width: 1280, height: 800 });
    await page.getByRole('button', { name: SUBMIT_NL }).click();
    await expect(page.locator('#naam-fout')).toHaveText('Vul uw naam in.');
    await page.getByRole('button', { name: 'Switch to English (EN)' }).click();
    await expect(page.locator('#naam-fout')).toHaveText('Enter your name.');
    await expect(page.locator('#formulier-status')).toHaveText('The form is not complete yet. Check the highlighted fields.');
  });

  test('labels the open menu toggle Close menu after switching at 360px', async ({ page }) => {
    await goto(page, PHONE_WIDTH);
    const toggle = page.locator('button#nav-toggle');
    await toggle.click();
    await page.getByRole('button', { name: 'Switch to English (EN)' }).click();
    await expect(toggle).toHaveAttribute('aria-label', 'Close menu');
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  });
});

test.describe('residents and tenants', () => {
  test('stops a resident before any field is reachable, and restores the form for another role', async ({ page }) => {
    await goto(page, { width: 1280, height: 800 });
    await page.getByLabel('Naam', { exact: true }).fill('Jan de Vries');
    await page.getByLabel('Wie bent u?').selectOption('bewoner');

    await expect(page.locator('#bewoner-melding')).toBeVisible();
    await expect(page.getByText('Neem contact op met uw eigenaar, beheerder of VvE')).toBeVisible();
    await expect(page.locator('#formulier-rest')).toBeHidden();
    await expect(page.getByLabel('Naam', { exact: true })).toBeHidden();
    await expect(page.getByRole('button', { name: SUBMIT_NL })).toBeHidden();
    await expect(page.locator('#formulier-status')).toHaveText(
      'NewCONet maakt geen afspraken met individuele bewoners of huurders. Neem contact op met de eigenaar, de beheerder of de VvE van uw gebouw.',
    );

    await page.getByLabel('Wie bent u?').selectOption('eigenaar');
    await expect(page.locator('#bewoner-melding')).toBeHidden();
    await expect(page.getByRole('button', { name: SUBMIT_NL })).toBeVisible();
    await expect(page.getByLabel('Naam', { exact: true })).toHaveValue('Jan de Vries');
  });

  test('refuses a forced submit for a resident and opens no email', async ({ page }) => {
    await goto(page, { width: 1280, height: 800 });
    await page.getByLabel('Naam', { exact: true }).fill('Jan de Vries');
    await page.getByLabel('Wie bent u?').selectOption('bewoner');
    await page.locator('#contactformulier').evaluate((el) => el.requestSubmit());
    await expect(page.locator('#formulier-bevestiging')).toBeHidden();
    await expect(page.locator('#formulier-status')).not.toHaveText('Uw e-mailprogramma wordt geopend. Verstuur de e-mail, dan ontvangen wij uw bericht.');
    await expect(page.locator('#mailto-opnieuw')).not.toHaveAttribute('href', /mailto:/);
  });
});

test.describe('page structure', () => {
  test('orders the sections as the structure table says', async ({ page }) => {
    await goto(page);
    const order = await page.evaluate(() => {
      const ids = ['top', 'wat-wilt-u-doen', 'diensten', 'voor-wie', 'werkwijze', 'over-ons', 'vragen', 'storing', 'contact'];
      const els = ids.map((id) => document.getElementById(id));
      const inMain = els.every((el) => el && el.closest('main#inhoud'));
      const sorted = [...els].sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
      return { inMain, same: els.every((el, i) => el === sorted[i]) };
    });
    expect(order).toEqual({ inMain: true, same: true });
  });

  test('shows the exact h1 and section h2 texts', async ({ page }) => {
    await goto(page);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('h1')).toHaveText(H1_NL);
    await expect(page.locator('main h2')).toHaveText([
      'Wat wilt u doen?',
      'Onze diensten',
      'Voor wie wij werken',
      'Zo werken wij',
      'Over NewCONet',
      'Veelgestelde vragen',
      'Storing? Bel ons op werkdagen',
      'Neem contact op',
    ]);
    await expect(page.locator('footer.site-footer h2')).toHaveText(['Contact', 'Snel naar']);
  });

  test('offers three route cards with their actions', async ({ page }) => {
    await goto(page);
    const cards = page.locator('section#wat-wilt-u-doen article.route-card');
    await expect(cards).toHaveCount(3);
    await expect(cards.locator('h3')).toHaveText(['Multi-tenant kantoorgebouw', 'Compleet appartementencomplex', 'Klant met een storing of vraag']);
    await expect(cards.nth(0).getByRole('link', { name: 'Plan een kennismaking' })).toHaveAttribute('href', '#contactformulier');
    await expect(cards.nth(1).getByRole('link', { name: 'Plan een kennismaking' })).toHaveAttribute('href', '#contactformulier');
    await expect(cards.nth(2).getByRole('link', { name: `Bel ${PHONE}` })).toHaveAttribute('href', TEL);
    await expect(cards.nth(2)).toHaveClass(/route-card--storing/);
    await expect(cards.nth(2).getByRole('link', { name: 'info@newconet.nl' })).toHaveAttribute('href', MAIL);
  });

  test('offers eight service cards, each with a uniquely named link', async ({ page }) => {
    await goto(page);
    const cards = page.locator('section#diensten article.dienst-card');
    await expect(cards).toHaveCount(8);
    await expect(cards.first()).toHaveClass(/dienst-card--uitgelicht/);
    await expect(cards.first().locator('p.badge')).toHaveText('Ons specialisme');
    const names = await page.locator('a.dienst-link').evaluateAll((links) => links.map((a) => a.textContent.replace(/\s+/g, ' ').trim()));
    expect(new Set(names).size).toBe(8);
    await expect(
      page.getByRole('link', { name: 'Offerte aanvragen voor internet in een multi-tenant kantoorgebouw', exact: true }),
    ).toHaveCount(1);
  });

  test('shows three persona cards and two who-we-serve cards', async ({ page }) => {
    await goto(page);
    await expect(page.locator('section#voor-wie article.persona-card h3')).toHaveText(['Eigenaren', 'Beheerders', 'VvE’s']);
    await expect(page.locator('section#voor-wie article.voor-wie-card h3')).toHaveText([
      'Multi-tenant kantoorgebouwen',
      'Complete appartementencomplexen',
    ]);
  });

  test('lists the process as an ordered list of five steps', async ({ page }) => {
    await goto(page);
    const steps = page.locator('section#werkwijze ol.stappen > li.stap');
    await expect(steps).toHaveCount(5);
    await expect(steps.locator('h3')).toHaveText([
      'Kennismaking',
      'Het gebouw in kaart brengen',
      'Voorstel op maat',
      'Aansluiten',
      'Ondersteuning en onderhoud',
    ]);
  });

  test('lists fourteen FAQ questions, all closed on load', async ({ page }) => {
    await goto(page);
    const items = page.locator('section#vragen details.faq-item');
    await expect(items).toHaveCount(14);
    await expect(items.first().locator('summary')).toHaveText('Welke internetdiensten levert NewCONet?');
    const open = await items.evaluateAll((els) => els.filter((d) => d.open).length);
    expect(open).toBe(0);
  });

  test('opens a FAQ answer on click', async ({ page }) => {
    await goto(page);
    const item = page.locator('details.faq-item', { hasText: 'Wanneer is NewCONet bereikbaar?' });
    await item.locator('summary').click();
    await expect(item).toHaveJSProperty('open', true);
    await expect(item).toContainText('Buiten kantoortijden biedt NewCONet standaard geen ondersteuning.');
  });

  test('shows the hero illustration as a named image followed by a four-item legend', async ({ page }) => {
    await goto(page, { width: 1280, height: 800 });
    await expect(page.getByRole('img', { name: /Doorsnede van een kantoorgebouw/ })).toBeVisible();
    await expect(page.locator('figure.hero-visual ol.hero-legenda > li')).toHaveCount(4);
  });

  test('carries no 24/7 claim and no privacy link anywhere on the page', async ({ page }) => {
    await goto(page);
    await expect(page.locator('body')).not.toContainText('24/7');
    await expect(page.locator('a[href*="privacy" i]')).toHaveCount(0);
    await expect(page.locator('.mock-banner, .mock-todo')).toHaveCount(0);
  });
});

test.describe('keyboard and mobile menu', () => {
  test('makes Direct naar de inhoud the first Tab stop and moves focus into main#inhoud', async ({ page }) => {
    await goto(page);
    await page.keyboard.press('Tab');
    const skip = page.getByRole('link', { name: 'Direct naar de inhoud' });
    await expect(skip).toBeFocused();
    await expect(skip).toBeInViewport();
    await page.keyboard.press('Enter');
    await expect(page.locator('main#inhoud')).toBeFocused();
  });

  test('keeps the menu links out of the tab order at 800px until the toggle opens it', async ({ page }) => {
    await goto(page, { width: 800, height: 900 });
    const nav = page.getByRole('navigation', { name: 'Hoofdmenu' });
    await expect(nav).toBeHidden();
    await page.locator('button#nav-toggle').click();
    await expect(nav).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Diensten' })).toBeFocused();
  });

  test('closes the open menu on Escape at 360px and returns focus to the toggle', async ({ page }) => {
    await goto(page, PHONE_WIDTH);
    const toggle = page.locator('button#nav-toggle');
    const nav = page.getByRole('navigation', { name: 'Hoofdmenu' });
    await toggle.click();
    await expect(nav.getByRole('link', { name: 'Diensten' })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(nav).toBeHidden();
    await expect(toggle).toBeFocused();
  });

  test('resets an open menu to closed when the window widens past 960px', async ({ page }) => {
    await goto(page, { width: 800, height: 900 });
    await page.locator('button#nav-toggle').click();
    await expect(page.locator('button#nav-toggle')).toHaveAttribute('aria-expanded', 'true');
    await page.setViewportSize({ width: 1200, height: 900 });
    await expect(page.locator('button#nav-toggle')).toBeHidden();
    await expect(page.locator('button#nav-toggle')).toHaveAttribute('aria-expanded', 'false');
    await expect(page.getByRole('navigation', { name: 'Hoofdmenu' })).toBeVisible();
  });
});

test.describe('layout and motion', () => {
  test('has no horizontal scroll at 360px', async ({ page }) => {
    await goto(page, PHONE_WIDTH);
    await expect(page.getByRole('heading', { level: 1, name: H1_NL })).toBeVisible();
    expect(await scrollWidth(page)).toBe(360);
  });

  test('turns smooth scrolling off under reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await goto(page);
    await expect(page.getByRole('heading', { level: 1, name: H1_NL })).toBeVisible();
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe('auto');
  });

  test('scrolls smoothly when the visitor has no reduced-motion preference', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await goto(page);
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe('smooth');
  });
});

test.describe('quote flow', () => {
  test('prefills the form from the office route card and ends in a mailto confirmation', async ({ page }) => {
    await goto(page, { width: 1280, height: 800 });
    await page
      .locator('section#wat-wilt-u-doen article.route-card')
      .first()
      .getByRole('link', { name: 'Plan een kennismaking' })
      .click();

    await expect(page).toHaveURL(/#contactformulier$/);
    await expect(page.getByRole('radio', { name: 'Kennismaking of offerte voor mijn gebouw' })).toBeChecked();
    await expect(page.getByLabel('Om welk type gebouw gaat het? (optioneel)')).toHaveValue('kantoor');
    await expect(page.locator('#storing-melding')).toBeHidden();

    const heading = page.getByRole('heading', { name: 'Stuur ons een bericht' });
    await expect(heading).toBeInViewport();
    const top = await heading.evaluate((el) => el.getBoundingClientRect().top);
    expect(top).toBeGreaterThanOrEqual(72);

    await page.getByLabel('Wie bent u?').selectOption('eigenaar');
    await page.getByLabel('Naam', { exact: true }).fill('Jan de Vries');
    await page.getByLabel('Naam van uw organisatie of VvE').fill('Voorbeeld Vastgoed BV');
    await page.getByLabel('E-mailadres').fill('jan@voorbeeld.nl');
    await page.getByLabel('Bericht', { exact: true }).fill('Wij zoeken internet voor de huurders in ons kantoorgebouw.');
    await page.getByRole('button', { name: SUBMIT_NL }).click();

    await expect(page.locator('#formulier-bevestiging')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Nog één stap: verstuur de e-mail' })).toBeFocused();
    await expect(page.locator('#formulier-status')).toHaveText('Uw e-mailprogramma wordt geopend. Verstuur de e-mail, dan ontvangen wij uw bericht.');
    const href = await page.locator('#mailto-opnieuw').getAttribute('href');
    expect(
      href.startsWith(`${MAIL}?subject=Kennismaking%20of%20offerte%20via%20de%20website%3A%20Multi-tenant%20kantoorgebouw&body=`),
    ).toBe(true);
    expect(decodeURIComponent(href)).toContain('Organisatie: Voorbeeld Vastgoed BV');
    await expect(page.getByLabel('Naam', { exact: true })).toHaveValue('Jan de Vries');
    await expect(page.locator('body')).not.toContainText('Bedankt voor uw bericht');
  });

  test('builds the English email after switching language', async ({ page }) => {
    await goto(page, { width: 1280, height: 800 }, '/?lang=en');
    await page.getByLabel('Who are you?').selectOption('vve');
    await page.getByRole('radio', { name: 'General question' }).check();
    await page.getByLabel('Name', { exact: true }).fill('Anna Jansen');
    await page.getByLabel('Name of your organisation or owners’ association').fill('VvE Voorbeeld');
    await page.getByLabel('Email address').fill('anna@voorbeeld.nl');
    await page.getByLabel('Message', { exact: true }).fill('Do you work for apartment complexes?');
    await page.getByRole('button', { name: 'Open this message in your email app' }).click();

    await expect(page.locator('#formulier-status')).toHaveText('Your email app is opening. Send the email and we will receive your message.');
    const href = await page.locator('#mailto-opnieuw').getAttribute('href');
    expect(href.startsWith(`${MAIL}?subject=Question%20via%20the%20website&body=`)).toBe(true);
    expect(decodeURIComponent(href)).toContain('Role: Board of an owners’ association (VvE)');
  });

  test('shows the error state on an empty submit and focuses the role select', async ({ page }) => {
    await goto(page, { width: 1280, height: 800 });
    await page.getByRole('button', { name: SUBMIT_NL }).click();
    await expect(page.locator('#formulier-status')).toHaveText('Het formulier is nog niet compleet. Controleer de gemarkeerde velden.');
    await expect(page.locator('#rol-fout')).toHaveText('Kies uw rol.');
    await expect(page.getByLabel('Wie bent u?')).toBeFocused();
    await expect(page.locator('#formulier-bevestiging')).toBeHidden();
  });

  test('shows the outage notice with a call button when Storing of ondersteuning is chosen', async ({ page }) => {
    await goto(page, { width: 1280, height: 800 });
    await page.getByRole('radio', { name: 'Storing of ondersteuning' }).check();
    const notice = page.locator('#storing-melding');
    await expect(notice).toBeVisible();
    await expect(notice.getByRole('link', { name: `Bel ${PHONE}` })).toHaveAttribute('href', TEL);
  });
});
