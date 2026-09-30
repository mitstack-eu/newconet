import { expect, test } from '@playwright/test';

const PHONE = '+31 (0)00 000 00 00';
const TEL = 'tel:+31000000000';
const MAIL = 'mailto:info@newconet.nl';
const PHONE_WIDTH = { width: 360, height: 740 };

const goto = async (page, size) => {
  if (size) await page.setViewportSize(size);
  await page.goto('/');
};

test.describe('reaching the right contact route on a phone', () => {
  test('shows Storing? in the header at 360px without opening the menu', async ({ page }) => {
    await goto(page, PHONE_WIDTH);
    const storing = page.locator('header.site-header').getByRole('link', { name: 'Storing?', exact: true });
    await expect(storing).toBeVisible();
    await expect(storing).toHaveAttribute('href', '#storing');
    await expect(page.locator('button#nav-toggle')).toHaveAttribute('aria-expanded', 'false');
  });

  test('Storing? lands on a section with a call link named after the number', async ({ page }) => {
    await goto(page, PHONE_WIDTH);
    await page.locator('header.site-header').getByRole('link', { name: 'Storing?', exact: true }).click();
    const band = page.locator('section#storing');
    const call = band.getByRole('link', { name: `Bel ${PHONE}` });
    await expect(call).toHaveAttribute('href', TEL);
    await expect(call).toBeInViewport();
    const top = await band.evaluate((el) => el.getBoundingClientRect().top);
    expect(top).toBeGreaterThanOrEqual(0);
  });

  test('shows the sticky bar with Bellen, Mailen and Offerte at 360px', async ({ page }) => {
    await goto(page, PHONE_WIDTH);
    const bar = page.getByRole('navigation', { name: 'Snel contact' });
    await expect(bar).toBeVisible();
    await expect(bar.getByRole('link', { name: 'Bellen' })).toHaveAttribute('href', TEL);
    await expect(bar.getByRole('link', { name: 'Mailen' })).toHaveAttribute('href', MAIL);
    await expect(bar.getByRole('link', { name: 'Offerte' })).toHaveAttribute('href', '#contactformulier');
  });

  test('pins the sticky bar to the bottom of the viewport at 64px tall', async ({ page }) => {
    await goto(page, PHONE_WIDTH);
    const box = await page.getByRole('navigation', { name: 'Snel contact' }).boundingBox();
    expect(box.height).toBeGreaterThanOrEqual(64);
    expect(Math.round(box.y + box.height)).toBe(PHONE_WIDTH.height);
  });

  test('shows the sticky bar at 720px and hides it at 721px', async ({ page }) => {
    const bar = page.getByRole('navigation', { name: 'Snel contact' });
    await goto(page, { width: 720, height: 800 });
    await expect(bar).toBeVisible();
    await page.setViewportSize({ width: 721, height: 800 });
    await expect(bar).toBeHidden();
  });

  test('hides the header quote button at 720px and shows it at 721px', async ({ page }) => {
    const quote = page.locator('header.site-header').getByRole('link', { name: 'Offerte aanvragen' });
    await goto(page, { width: 720, height: 800 });
    await expect(quote).toBeHidden();
    await page.setViewportSize({ width: 721, height: 800 });
    await expect(quote).toBeVisible();
  });

  test('puts a tel link in the hero on the first screen at 360px', async ({ page }) => {
    await goto(page, PHONE_WIDTH);
    const call = page.locator('section.hero#top').getByRole('link', { name: PHONE });
    await expect(call).toHaveAttribute('href', TEL);
    await expect(call).toBeInViewport();
  });
});

test.describe('page structure', () => {
  test('orders the sections as the structure table says', async ({ page }) => {
    await goto(page);
    const order = await page.evaluate(() => {
      const ids = ['top', 'wat-wilt-u-doen', 'diensten', 'werkwijze', 'over-ons', 'vragen', 'storing', 'contact'];
      const els = ids.map((id) => document.getElementById(id));
      const inMain = els.every((el) => el && el.closest('main#inhoud'));
      const sorted = [...els].sort((a, b) =>
        a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1,
      );
      return { inMain, same: els.every((el, i) => el === sorted[i]) };
    });
    expect(order).toEqual({ inMain: true, same: true });
  });

  test('shows the exact h1 and section h2 texts', async ({ page }) => {
    await goto(page);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('h1')).toHaveText('Stevige netwerken. Zonder gedoe.');
    await expect(page.locator('main h2')).toHaveText([
      'Wat wilt u doen?',
      'Onze diensten',
      'Zo werken wij',
      'Over NewCONet',
      'Veelgestelde vragen',
      'Storing? Bel ons direct',
      'Neem contact op',
    ]);
    await expect(page.locator('footer.site-footer h2')).toHaveText(['Contact', 'Snel naar']);
  });

  test('offers three route cards with their actions', async ({ page }) => {
    await goto(page);
    const cards = page.locator('section#wat-wilt-u-doen article.route-card');
    await expect(cards).toHaveCount(3);
    await expect(cards.locator('h3')).toHaveText(['Advies of een offerte', 'Storing melden', 'Een vraag stellen']);
    await expect(cards.nth(0).getByRole('link', { name: 'Offerte aanvragen' })).toHaveAttribute('href', '#contactformulier');
    await expect(cards.nth(1).getByRole('link', { name: `Bel ${PHONE}` })).toHaveAttribute('href', TEL);
    await expect(cards.nth(1)).toHaveClass(/route-card--storing/);
    await expect(cards.nth(2).getByRole('link', { name: 'Stuur een bericht' })).toHaveAttribute('href', '#contactformulier');
    await expect(cards.nth(2).getByRole('link', { name: 'info@newconet.nl' })).toHaveAttribute('href', MAIL);
  });

  test('offers six service cards, each with a uniquely named quote link', async ({ page }) => {
    await goto(page);
    const cards = page.locator('section#diensten article.dienst-card');
    await expect(cards).toHaveCount(6);
    await expect(cards.locator('h3')).toHaveText([
      'Netwerkaanleg',
      'Zakelijk WiFi',
      'Glasvezel & bekabeling',
      'Beheer & onderhoud',
      'Netwerkbeveiliging',
      'Cloud & connectiviteit',
    ]);
    for (const dienst of ['Netwerkaanleg', 'Zakelijk WiFi', 'Glasvezel & bekabeling', 'Beheer & onderhoud', 'Netwerkbeveiliging', 'Cloud & connectiviteit']) {
      await expect(page.getByRole('link', { name: `Offerte aanvragen voor ${dienst}`, exact: true })).toHaveCount(1);
    }
  });

  test('lists the process as an ordered list of five steps', async ({ page }) => {
    await goto(page);
    const steps = page.locator('section#werkwijze ol.stappen > li.stap');
    await expect(steps).toHaveCount(5);
    await expect(steps.locator('h3')).toHaveText([
      'Contact',
      'Kennismaking en inventarisatie',
      'Voorstel en offerte',
      'Aanleg',
      'Beheer',
    ]);
  });

  test('lists seven FAQ questions, all closed on load', async ({ page }) => {
    await goto(page);
    const items = page.locator('section#vragen details.faq-item');
    await expect(items).toHaveCount(7);
    await expect(items.locator('summary')).toHaveText([
      'Is een offerte vrijblijvend?',
      'Werkt NewCONet ook voor een bedrijf met één kantoor?',
      'Kunnen jullie meerdere vestigingen met elkaar verbinden?',
      'Wat doe ik bij een storing?',
      'Werken jullie met standaardpakketten?',
      'Wanneer zijn jullie bereikbaar?',
      'Krijg ik een callcenter aan de lijn?',
    ]);
    const open = await items.evaluateAll((els) => els.filter((d) => d.open).length);
    expect(open).toBe(0);
  });

  test('opens a FAQ answer on click and offers a tel link in the storing answer', async ({ page }) => {
    await goto(page);
    const item = page.locator('details.faq-item', { hasText: 'Wat doe ik bij een storing?' });
    await item.locator('summary').click();
    await expect(item).toHaveJSProperty('open', true);
    await expect(item.getByRole('link', { name: PHONE })).toHaveAttribute('href', TEL);
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
    await expect(page.getByRole('heading', { level: 1, name: 'Stevige netwerken. Zonder gedoe.' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(360);
  });

  test('turns smooth scrolling off under reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await goto(page);
    await expect(page.getByRole('heading', { level: 1, name: 'Stevige netwerken. Zonder gedoe.' })).toBeVisible();
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe('auto');
  });

  test('scrolls smoothly when the visitor has no reduced-motion preference', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await goto(page);
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe('smooth');
  });
});

test.describe('service card quote flow', () => {
  test('prefills the form from a service card and ends in a mailto confirmation', async ({ page }) => {
    await goto(page, { width: 1280, height: 800 });
    await page.getByRole('link', { name: 'Offerte aanvragen voor Zakelijk WiFi' }).click();

    await expect(page).toHaveURL(/#contactformulier$/);
    await expect(page.getByRole('radio', { name: 'Offerte of advies' })).toBeChecked();
    await expect(page.getByLabel('Over welke dienst gaat het? (optioneel)')).toHaveValue('zakelijk-wifi');
    await expect(page.locator('#storing-melding')).toBeHidden();

    const heading = page.getByRole('heading', { name: 'Stuur ons een bericht' });
    await expect(heading).toBeInViewport();
    const top = await heading.evaluate((el) => el.getBoundingClientRect().top);
    expect(top).toBeGreaterThanOrEqual(72);

    await page.getByLabel('Naam', { exact: true }).fill('Jan de Vries');
    await page.getByLabel('E-mailadres').fill('jan@voorbeeld.nl');
    await page.getByLabel('Bericht', { exact: true }).fill('Wij zoeken dekkend WiFi voor twee verdiepingen kantoor.');
    await page.getByRole('button', { name: 'Open e-mail met uw bericht' }).click();

    await expect(page.locator('#formulier-bevestiging')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Nog één stap: verstuur de e-mail' })).toBeFocused();
    await expect(page.locator('#formulier-status')).toHaveText(
      'Uw e-mailprogramma wordt geopend. Verstuur de e-mail om uw bericht bij ons te krijgen.',
    );
    const href = await page.locator('#mailto-opnieuw').getAttribute('href');
    expect(href.startsWith(`${MAIL}?subject=Offerteaanvraag%20via%20de%20website%3A%20Zakelijk%20WiFi&body=`)).toBe(true);
    expect(decodeURIComponent(href)).toContain('Naam: Jan de Vries');
    await expect(page.getByLabel('Naam', { exact: true })).toHaveValue('Jan de Vries');
    await expect(page.locator('body')).not.toContainText('Bedankt voor uw bericht');
  });

  test('shows the error state on an empty submit and focuses the first radio', async ({ page }) => {
    await goto(page, { width: 1280, height: 800 });
    await page.getByRole('button', { name: 'Open e-mail met uw bericht' }).click();
    await expect(page.locator('#formulier-status')).toHaveText(
      'Het formulier is nog niet compleet. Controleer de gemarkeerde velden.',
    );
    await expect(page.getByRole('radio', { name: 'Offerte of advies' })).toBeFocused();
    await expect(page.locator('#formulier-bevestiging')).toBeHidden();
  });
});
