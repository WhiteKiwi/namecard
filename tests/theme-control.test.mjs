import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { pipThemeBootstrap, pipThemeControlScript, themeControlMarkup } from '@whitekiwi/ui/theme';

const html = fs.readFileSync(new URL('../src/index.html', import.meta.url), 'utf8');
const app = fs.readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');
const pkg = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const ui = JSON.parse(fs.readFileSync(new URL('../node_modules/@whitekiwi/ui/package.json', import.meta.url), 'utf8'));
const tokens = JSON.parse(fs.readFileSync(new URL('../node_modules/@whitekiwi/tokens/package.json', import.meta.url), 'utf8'));

test('ThemeControl 0.2.6 markup and bootstrap are embedded before CSS', () => {
  assert.equal(pkg.devDependencies['@whitekiwi/ui'], '0.2.6');
  assert.equal(pkg.devDependencies['@whitekiwi/tokens'], '0.2.6');
  assert.equal(ui.version, '0.2.6');
  assert.equal(tokens.version, '0.2.6');
  assert.ok(html.includes(themeControlMarkup({ id: 'namecard-theme' })));
  assert.equal(html.match(/<script id="pip-theme-bootstrap">([\s\S]*?)<\/script>/)[1].trim(), pipThemeBootstrap('namecard-theme'));
  assert.ok(html.includes('class="kiwi-theme kiwi-theme--icon"'));
  assert.equal(html.includes('class="kiwi-segmented kiwi-theme"'), false);
  assert.ok(html.includes('name="card-side"'));
  assert.ok(html.includes(pipThemeControlScript('namecard-theme')));
  assert.ok(html.indexOf('id="pip-theme-bootstrap"') < html.indexOf('href="pip.css"'));
  assert.equal(html.includes('value="system"'), false);
  assert.equal(html.includes('data-theme="auto"'), false);
  assert.equal(html.includes('data-theme="system"'), false);
  assert.equal(app.includes('localStorage'), false);
  assert.equal(app.includes('namecard-theme'), false);
});

function boot({ stored = {}, prefersDark = false } = {}) {
  const map = new Map(Object.entries(stored));
  const writes = [];
  const localStorage = {
    getItem(key) { return map.has(key) ? map.get(key) : null; },
    setItem(key, value) { writes.push(['set', key, value]); map.set(key, String(value)); },
    removeItem(key) { writes.push(['remove', key]); map.delete(key); },
  };
  const attrs = {};
  const themeSets = [];
  const meta = {
    name: 'theme-color',
    content: '#f4f5ef',
    setAttribute(name, value) { this[name] = value; },
  };
  const buttonAttrs = {};
  const button = {
    disabled: false,
    setAttribute(name, value) { buttonAttrs[name] = value; },
    getAttribute(name) { return buttonAttrs[name] ?? null; },
    closest(selector) { return selector === 'button.kiwi-theme--icon' ? this : null; },
    classList: { add() {} },
  };
  const listeners = {};
  let mediaChange;
  const media = { matches: prefersDark, addEventListener(type, fn) { mediaChange = fn; } };
  const document = {
    documentElement: {
      setAttribute(name, value) { themeSets.push([name, value]); attrs[name] = value; },
      removeAttribute(name) { delete attrs[name]; },
    },
    head: { appendChild() {} },
    querySelector(selector) { return selector === 'meta[name="theme-color"]' ? meta : null; },
    querySelectorAll(selector) { return selector === 'button.kiwi-theme--icon' ? [button] : []; },
    createElement() { return { setAttribute() {} }; },
    addEventListener(type, fn) { listeners[type] = fn; },
  };
  const window = {
    localStorage,
    document,
    matchMedia() { return media; },
    requestAnimationFrame(fn) { fn(); },
    addEventListener(type, fn) { listeners[type] = fn; },
  };
  const context = vm.createContext({ document, window, localStorage });
  vm.runInContext(pipThemeBootstrap('namecard-theme'), context);
  vm.runInContext(pipThemeControlScript('namecard-theme'), context);
  return { map, writes, attrs, themeSets, meta, listeners, button, buttonAttrs,
    changeSystem(dark) { media.matches = dark; mediaChange(); },
  };
}

test('icon selections set data-theme; clearing storage restores system preference', () => {
  const page = boot();
  page.listeners.click({ target: page.button });
  assert.equal(page.attrs['data-theme'], 'dark');
  assert.equal(page.map.get('namecard-theme'), 'dark');
  assert.equal(page.meta.content, '#0e0e0e');

  page.listeners.click({ target: page.button });
  assert.equal(page.attrs['data-theme'], 'light');
  assert.equal(page.map.get('namecard-theme'), 'light');
  assert.equal(page.meta.content, '#f4f5ef');

  // A different tab clears the explicit preference; the icon has no auto option.
  page.map.delete('namecard-theme');
  page.listeners.storage({ key: 'namecard-theme' });
  assert.equal('data-theme' in page.attrs, false);
  assert.equal(page.map.has('namecard-theme'), false);
  assert.equal(page.buttonAttrs['data-resolved-theme'], 'light');
  assert.equal(page.buttonAttrs['aria-label'], '어둡게 전환');
  assert.equal(page.meta.content, '#f4f5ef');
  assert.ok(page.writes.every((entry) => entry[2] !== 'auto' && entry[2] !== 'system'));
  assert.ok(page.themeSets.every((entry) => entry[0] !== 'data-theme' || (entry[1] === 'light' || entry[1] === 'dark')));
});

test('stored auto and system are deleted; an unrelated key is ignored', () => {
  for (const legacy of ['auto', 'system', 'Auto']) {
    const page = boot({ stored: { 'namecard-theme': legacy, theme: 'dark' }, prefersDark: false });
    assert.equal(page.map.has('namecard-theme'), false, legacy);
    assert.equal(page.map.get('theme'), 'dark');
    assert.equal('data-theme' in page.attrs, false);
    assert.equal(page.buttonAttrs['data-resolved-theme'], 'light');
    assert.equal(page.meta.content, '#f4f5ef');
  }
  const kept = boot({ stored: { 'namecard-theme': 'light' }, prefersDark: true });
  assert.equal(kept.attrs['data-theme'], 'light');
  assert.equal(kept.map.get('namecard-theme'), 'light');
  assert.equal(kept.meta.content, '#f4f5ef');
  assert.equal(kept.buttonAttrs['data-resolved-theme'], 'light');
});

test('auto follows prefers-color-scheme without a data-theme attribute', () => {
  const dark = boot({ prefersDark: true });
  assert.equal('data-theme' in dark.attrs, false);
  assert.equal(dark.meta.content, '#0e0e0e');
  assert.equal(dark.map.has('namecard-theme'), false);
  const light = boot({ prefersDark: false });
  assert.equal(light.meta.content, '#f4f5ef');
});

test('icon clicks toggle the resolved theme and update the action label', () => {
  for (const prefersDark of [false, true]) {
    const page = boot({ prefersDark });
    assert.equal(page.buttonAttrs['data-resolved-theme'], prefersDark ? 'dark' : 'light');
    assert.equal(page.buttonAttrs['aria-label'], prefersDark ? '밝게 전환' : '어둡게 전환');
    // SVG descendants resolve to the same native button.
    const target = { closest: (selector) => page.button.closest(selector) };
    page.listeners.click({ target });
    const selected = prefersDark ? 'light' : 'dark';
    assert.equal(page.attrs['data-theme'], selected);
    assert.equal(page.map.get('namecard-theme'), selected);
    assert.equal(page.meta.content, prefersDark ? '#f4f5ef' : '#0e0e0e');
    assert.equal(page.buttonAttrs['aria-label'], prefersDark ? '어둡게 전환' : '밝게 전환');
    assert.equal(page.buttonAttrs.title, page.buttonAttrs['aria-label']);
    page.listeners.click({ target });
    assert.equal(page.attrs['data-theme'], prefersDark ? 'dark' : 'light');
    page.button.disabled = true;
    page.listeners.click({ target });
    assert.equal(page.attrs['data-theme'], prefersDark ? 'dark' : 'light');
  }
});

test('system and cross-tab changes synchronize the icon without auto attribute writes', () => {
  const page = boot();
  page.changeSystem(true);
  assert.equal('data-theme' in page.attrs, false);
  assert.equal(page.buttonAttrs['data-resolved-theme'], 'dark');
  assert.equal(page.meta.content, '#0e0e0e');
  page.map.set('namecard-theme', 'light');
  page.listeners.storage({ key: 'namecard-theme' });
  assert.equal(page.buttonAttrs['data-resolved-theme'], 'light');
  page.changeSystem(false);
  page.changeSystem(true);
  assert.equal(page.attrs['data-theme'], 'light');
  page.map.delete('namecard-theme');
  page.listeners.storage({ key: null });
  assert.equal('data-theme' in page.attrs, false);
  assert.equal(page.buttonAttrs['data-resolved-theme'], 'dark');
  assert.ok(page.themeSets.every(([name, value]) => name !== 'data-theme' || ['light', 'dark'].includes(value)));
});
