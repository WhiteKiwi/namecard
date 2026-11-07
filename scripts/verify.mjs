import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const html = await fs.readFile('dist/index.html', 'utf8');
assert.ok(!html.includes('{{'));
assert.ok(html.includes('https://namecard.whitekiwi.link/assets/og.png'));
assert.ok(!html.includes('chatgpt.site'));
for (const [,url] of html.matchAll(/(?:src|href)="([^"#]+)"/g)) {
  if (/^(https?:|mailto:|tel:|\.\/)/.test(url)) continue;
  assert.ok((await fs.stat(`dist/${url}`)).isFile(), `Missing public resource ${url}`);
}
for (const [file,width,height] of [['og.png',1200,630],['namecard-front.png',1800,1100],['namecard-back.png',1800,1100]]) {
  const png = await fs.readFile(`dist/assets/${file}`);
  assert.equal(png.subarray(1,4).toString(), 'PNG');
  assert.equal(png.readUInt32BE(16), width); assert.equal(png.readUInt32BE(20), height);
}
console.log('Canonical, social metadata, public links, image dimensions verified.');
