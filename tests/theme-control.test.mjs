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

test('ThemeControl 0.2.3 markup and bootstrap are embedded before CSS', () => {
  assert.equal(pkg.devDependencies['@whitekiwi/ui'], '0.2.3');
  assert.equal(pkg.devDependencies['@whitekiwi/tokens'], '0.2.3');
  assert.equal(ui.version, '0.2.3');
  assert.equal(tokens.version, '0.2.3');
  assert.ok(html.includes(themeControlMarkup()));
  assert.ok(html.includes(pipThemeBootstrap('namecard-theme')));
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
  const inputs = ['auto', 'light', 'dark'].map((value) => ({
    type: 'radio',
    value,
    checked: value === 'auto',
    closest(selector) { return selector === '.kiwi-theme' ? true : null; },
  }));
  const listeners = {};
  const document = {
    documentElement: {
      setAttribute(name, value) { themeSets.push([name, value]); attrs[name] = value; },
      removeAttribute(name) { delete attrs[name]; },
    },
    head: { appendChild() {} },
    querySelector(selector) { return selector === 'meta[name="theme-color"]' ? meta : null; },
    querySelectorAll() { return inputs; },
    createElement() { return { setAttribute() {} }; },
    addEventListener(type, fn) { listeners[type] = fn; },
  };
  const window = {
    localStorage,
    document,
    matchMedia() { return { matches: prefersDark, addEventListener() {} }; },
    addEventListener(type, fn) { listeners[type] = fn; },
  };
  const context = vm.createContext({ document, window, localStorage });
  vm.runInContext(pipThemeBootstrap('namecard-theme'), context);
  vm.runInContext(pipThemeControlScript('namecard-theme'), context);
  return { map, writes, attrs, themeSets, meta, inputs, listeners };
}

test('light and dark set data-theme; auto removes the attribute and the key', () => {
  const page = boot();
  page.listeners.change({ target: page.inputs[1] });
  assert.equal(page.attrs['data-theme'], 'light');
  assert.equal(page.map.get('namecard-theme'), 'light');
  assert.equal(page.meta.content, '#f4f5ef');
  assert.equal(page.inputs[1].checked, true);
  assert.equal(page.inputs[0].checked, false);

  page.listeners.change({ target: page.inputs[2] });
  assert.equal(page.attrs['data-theme'], 'dark');
  assert.equal(page.map.get('namecard-theme'), 'dark');
  assert.equal(page.meta.content, '#0e0e0e');

  page.listeners.change({ target: page.inputs[0] });
  assert.equal('data-theme' in page.attrs, false);
  assert.equal(page.map.has('namecard-theme'), false);
  assert.equal(page.inputs[0].checked, true);
  assert.ok(page.writes.every((entry) => entry[2] !== 'auto' && entry[2] !== 'system'));
  assert.ok(page.themeSets.every((entry) => entry[0] !== 'data-theme' || (entry[1] === 'light' || entry[1] === 'dark')));
});

test('stored auto and system are deleted; an unrelated key is ignored', () => {
  for (const legacy of ['auto', 'system', 'Auto']) {
    const page = boot({ stored: { 'namecard-theme': legacy, theme: 'dark' }, prefersDark: false });
    assert.equal(page.map.has('namecard-theme'), false, legacy);
    assert.equal(page.map.get('theme'), 'dark');
    assert.equal('data-theme' in page.attrs, false);
    assert.equal(page.inputs.find((input) => input.checked).value, 'auto');
    assert.equal(page.meta.content, '#f4f5ef');
  }
  const kept = boot({ stored: { 'namecard-theme': 'light' }, prefersDark: true });
  assert.equal(kept.attrs['data-theme'], 'light');
  assert.equal(kept.map.get('namecard-theme'), 'light');
  assert.equal(kept.meta.content, '#f4f5ef');
  assert.equal(kept.inputs.find((input) => input.checked).value, 'light');
});

test('auto follows prefers-color-scheme without a data-theme attribute', () => {
  const dark = boot({ prefersDark: true });
  assert.equal('data-theme' in dark.attrs, false);
  assert.equal(dark.meta.content, '#0e0e0e');
  assert.equal(dark.map.has('namecard-theme'), false);
  const light = boot({ prefersDark: false });
  assert.equal(light.meta.content, '#f4f5ef');
});
