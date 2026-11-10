import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const config = JSON.parse(await fs.readFile('config.json', 'utf8'));
const html = await fs.readFile('dist/index.html', 'utf8');
assert.ok(!html.includes('{{'));
assert.ok(html.includes(`${config.siteUrl}/assets/og.png`));
assert.ok(html.includes(`${config.name} · ${config.englishName}`));
assert.ok(html.includes(`${config.role} · ${config.team} — 연락처와 명함을 한곳에서.`));
assert.ok(html.includes('property="og:site_name" content="WHITEKIWI"'));
assert.ok(html.includes('name="twitter:card" content="summary_large_image"'));
assert.ok(html.includes('rel="icon" href="assets/favicon.png"'));
assert.ok(html.includes('rel="apple-touch-icon" href="assets/apple-touch-icon.png" sizes="180x180"'));
assert.ok(html.includes('id="pip-theme-bootstrap"'));
assert.ok(html.indexOf('id="pip-theme-bootstrap"') < html.indexOf('href="pip.css"'));
assert.ok(html.includes('class="kiwi-segmented kiwi-theme"'));
assert.ok(html.includes('namecard-theme'));
assert.equal(html.includes('theme.js'), false);
assert.equal(html.includes('data-theme="auto"'), false);
assert.equal(html.includes('data-theme="system"'), false);
assert.equal(html.includes('value="system"'), false);
assert.ok(!html.includes('chatgpt.site'));
for (const [,url] of html.matchAll(/(?:src|href)="([^"#]+)"/g)) {
  if (/^(https?:|mailto:|tel:|\.\/)/.test(url)) continue;
  assert.ok((await fs.stat(`dist/${url}`)).isFile(), `Missing public resource ${url}`);
}
for (const [file,width,height] of [['og.png',1200,630],['namecard-front.png',1800,1100],['namecard-back.png',1800,1100],['apple-touch-icon.png',180,180],['favicon.png',64,64]]) {
  const png = await fs.readFile(`dist/assets/${file}`);
  assert.equal(png.subarray(1,4).toString(), 'PNG');
  assert.equal(png.readUInt32BE(16), width); assert.equal(png.readUInt32BE(20), height);
}
console.log('Canonical, social metadata, public links, image dimensions verified.');
