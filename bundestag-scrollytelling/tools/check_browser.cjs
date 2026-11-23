// Browserprüfung der statischen App. Optionales Argument: lokale HTTP-Vorschau.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');

const app = path.resolve(__dirname, '..');
const local = pathToFileURL(path.join(app, 'site/index.html')).href;
const url = process.argv[2] || local;
const output = path.resolve(app, '../outputs/bundestag-qa');
fs.mkdirSync(output, { recursive: true });

async function verify(page, size, name) {
  await page.setViewportSize(size);
  await page.goto(url);
  await page.locator('#history-plot svg').waitFor();
  assert.equal(await page.locator('#history-plot circle').count(), 15);
  await page.screenshot({ path: path.join(output, name + '-start.png') });
  if (name === 'mobil') await page.locator('.history-panel').screenshot({ path: path.join(output, 'mobil-zeitreihe.png') });

  const form = page.locator('#prediction');
  await form.getByRole('button').click();
  assert.equal(await form.locator('input:invalid').count(), 3);
  await form.locator('[value=nominierung]').check();
  await form.locator('textarea').fill('Auch ein guter Listenplatz kann den Einzug ermöglichen.');
  await form.getByRole('button').click();
  assert.ok(await form.locator('fieldset').isHidden());
  assert.ok((await page.locator('#recall').innerText()).includes('guter Listenplatz'));

  await page.locator('.links a[href="#wege"]').click();
  for (const [route, hits, category] of [['district', 1, 'umkämpft'], ['list', 2, 'umkämpft'], ['both', 3, 'sicher']]) {
    await page.locator(`.route-options label:has(input[value=${route}]) span`).click();
    assert.equal(await page.locator('#route-body tr').count(), 3);
    assert.equal(await page.locator('#route-body td:last-child').filter({ hasText: /^Ja$/ }).count(), hits);
    assert.match(await page.locator('#route-result').innerText(), new RegExp(hits + ' von 3.*' + category));
  }
  for (const id of ['wege', 'wahlerfolg', 'gruppen', 'modell', 'transfer', 'quellen']) {
    await page.locator('#' + id).evaluate(el => el.scrollIntoView());
    await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), name + ' Überbreite ' + id);
    if (['wahlerfolg', 'gruppen', 'modell'].includes(id)) {
      let figure = page.locator('#current-chart .chart-box');
      if (await figure.isVisible()) {
        assert.equal(await page.locator('.chart-nav a[aria-current]').getAttribute('href'), '#' + id);
        const rect = await page.locator('.sticky-figure').boundingBox();
        assert.ok(rect.y + rect.height <= size.height + 2, name + ' stehende Grafik unten verdeckt: ' + (rect.y + rect.height));
      } else {
        figure = page.locator('#' + id + ' .inline-chart .chart-box');
      }
      assert.ok(await figure.isVisible());
      if (id === 'modell') assert.deepEqual(await figure.locator('.bar-label strong').allTextContents(),
        ['40 % (31–49 %)', '50 % · gesetzt', '62 % (52–71 %)']);
      if (id === 'gruppen') assert.equal(await figure.locator('svg image').count(), 2);
      await figure.screenshot({ path: path.join(output, name + '-' + id + '.png') });
    }
    if (id === 'wege') await page.locator('.lab').screenshot({ path: path.join(output, name + '-wege.png') });
  }
  await page.locator('#transfer-answer summary').focus();
  await page.keyboard.press('Enter');
  assert.equal(await page.locator('#transfer-answer').getAttribute('open'), '');
  const mechanism = page.locator('#mechanismus');
  await mechanism.locator('summary').focus();
  await page.keyboard.press('Enter');
  assert.ok(await mechanism.getByText(/Stunden pro Woche/).isVisible());
  if (name === 'desktop' || name === 'mobil') {
    await mechanism.screenshot({ path: path.join(output, name + '-mechanismus.png') });
  }
  await page.keyboard.press('Enter');
  await page.locator('#model-method summary').click();
  assert.ok((await page.locator('#model-method-body').innerText()).includes('Kovarianzmatrix'));

  await page.locator('#einstieg').evaluate(el => el.scrollIntoView());
  await page.locator('#present').click();
  for (let i = 1; i <= 8; i++) {
    assert.equal(await page.locator('#position').innerText(), i + ' / 8');
    if (i === 6 && name === 'beamer') await page.screenshot({ path: path.join(output, 'beamer-modellansicht.png') });
    if (i < 8) await page.keyboard.press('ArrowRight');
  }
  assert.equal(await page.locator('#forward').isDisabled(), true);
  await page.keyboard.press('ArrowLeft');
  assert.equal(await page.locator('#position').innerText(), '7 / 8');
  await page.keyboard.press('Escape');
  assert.ok(await page.locator('#present-bar').isHidden());
  await page.reload();
  assert.equal(await page.locator('#recall').isHidden(), true);
  await page.locator('.links a[href="#transfer"]').click();
  assert.ok(await page.locator('#transfer-answer summary').isVisible());
}

async function main() {
  const windowsChrome = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
  const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ||
    (fs.existsSync(windowsChrome) ? windowsChrome : undefined);
  const browser = await chromium.launch({ headless: true, executablePath });
  const errors = [];
  try {
    const sizes = { desktop: [1440, 900], beamer: [1280, 720], tablet: [1024, 768], mobil: [390, 844], schmal: [320, 700] };
    for (const [name, [width, height]] of Object.entries(sizes)) {
      const page = await browser.newPage({ reducedMotion: 'reduce' });
      page.on('pageerror', e => errors.push(e.message));
      page.on('requestfailed', req => errors.push(req.url()));
      page.on('response', res => { if (res.status() >= 400) errors.push(res.url()); });
      page.on('request', req => {
        if (new URL(req.url()).origin !== new URL(url).origin) errors.push('Externe Anfrage ' + req.url());
      });
      await verify(page, { width, height }, name);
      await page.close();
      console.log(name, width, height, 'OK');
    }
    assert.deepEqual(errors, []);
    const offline = await browser.newPage();
    await offline.goto(local);
    await offline.locator('.links a[href="#wahlerfolg"]').click();
    assert.equal(await offline.locator('#current-chart .fill').count(), 3);
    assert.equal(await offline.locator('img').first().evaluate(image => image.naturalWidth > 0), true);
    console.log('Datei-Einstieg OK');
    const standalone = pathToFileURL(path.join(app, 'bundestag-entwurf.html')).href;
    const single = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    const requests = [];
    single.on('pageerror', e => errors.push(e.message));
    single.on('request', request => requests.push(request.url()));
    await single.goto(standalone);
    assert.equal(await single.locator('#history-plot circle').count(), 15);
    await single.locator('#gruppen').evaluate(el => el.scrollIntoView());
    const firstImage = single.locator('#current-chart image').first();
    await firstImage.waitFor();
    assert.match(await firstImage.getAttribute('href'), /^data:image\/png;base64,/);
    await single.locator('#current-chart').screenshot({ path: path.join(output, 'offline-gruppen.png') });
    await single.locator('.route-options label:has(input[value=both]) span').click();
    assert.match(await single.locator('#route-result').innerText(), /3 von 3/);
    assert.deepEqual(requests.filter(value => !value.startsWith('data:')), [standalone]);
    assert.deepEqual(errors, []);
    console.log('Transportable Einzeldatei ohne externe Ressourcen OK');
  } finally {
    await browser.close();
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
