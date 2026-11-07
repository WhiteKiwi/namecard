import fs from 'node:fs/promises';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const sharp = require(process.env.SHARP_MODULE || 'sharp');
const c = JSON.parse(await fs.readFile('config.json','utf8'));
const esc = s => String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
const data = async file => 'data:image/png;base64,'+(await fs.readFile(file)).toString('base64');
const symbol = await data('public/assets/toss-symbol-tight.png');
const logo = await data('public/assets/toss-income-tight.png');
const start = '<svg xmlns="http://www.w3.org/2000/svg" width="1800" height="1100" viewBox="0 0 900 550"><rect width="900" height="550" fill="#fff"/>';
const font = 'font-family="Noto Sans CJK KR, sans-serif" fill="#17191c"';
const front = start+`<image href="${symbol}" x="350" y="175" width="200" height="200"/></svg>`;
const back = start+`<image href="${logo}" x="580" y="42" width="276" height="60"/><g ${font} font-size="27"><text x="46" y="72" font-weight="700">${esc(c.name)}</text><text x="46" y="110" font-weight="700">${esc(c.englishName)}</text><text x="46" y="148">${esc(c.role)}</text><text x="46" y="186">${esc(c.team)}</text><text x="46" y="273">${esc(c.phone.replace(/^(\d{3})(\d{4})(\d{4})$/, '$1 $2 $3'))}</text><text x="46" y="311">${esc(c.email)}</text></g><g ${font} font-size="20"><text x="46" y="467" font-weight="700">${esc(c.company)}</text><text x="46" y="498">${esc(c.address)}</text></g></svg>`;
for(const [side,svg] of [['front',front],['back',back]]){
  await fs.writeFile(`public/assets/namecard-${side}.svg`,svg);
  await sharp(Buffer.from(svg)).png().toFile(`public/assets/namecard-${side}.png`);
}
const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><rect width="1200" height="630" fill="#f4f5ef"/><path d="M48 78H1152M48 550H1152" stroke="#cfd2c7"/><rect x="642" y="168" width="480" height="294" fill="#fff"/><image href="${symbol}" x="822" y="255" width="120" height="120"/><g ${font}><text x="48" y="48" font-size="17">WHITEKIWI / NAMECARD</text><text x="44" y="262" font-size="68" font-weight="700">${esc(c.name)}</text><text x="48" y="330" font-size="42">${esc(c.englishName)}.</text><text x="48" y="412" font-size="23">${esc(c.role)}</text><text x="48" y="450" font-size="21" fill="#62685e">${esc(c.team)}</text><text x="48" y="592" font-size="17">${esc(new URL(c.siteUrl).host)}</text></g><rect x="1006" y="28" width="146" height="26" rx="2" fill="#c6ff4a"/></svg>`;
await sharp(Buffer.from(og)).png().toFile('public/assets/og.png');
await sharp('public/assets/toss-symbol-tight.png').resize(64,64,{fit:'contain',background:'#fff'}).png().toFile('public/assets/favicon.png');
