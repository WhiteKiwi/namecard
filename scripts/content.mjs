export function escapeHtml(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
}
export function validateConfig(c) {
  for (const key of ['name','englishName','role','team','company','phone','email','address','siteUrl','gaMeasurementId']) {
    if (typeof c[key] !== 'string' || /[\r\n\0]/.test(c[key])) throw new Error(`Invalid ${key}`);
  }
  const url = new URL(c.siteUrl);
  if (url.protocol !== 'https:' || c.siteUrl !== url.origin || url.username || url.password) throw new Error('siteUrl must be an HTTPS origin');
  if (!/^010\d{8}$/.test(c.phone) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email)) throw new Error('Invalid contact');
  if (c.gaMeasurementId && !/^G-[A-Z0-9]+$/.test(c.gaMeasurementId)) throw new Error('Invalid GA4 measurement ID');
  if (!Array.isArray(c.links)) throw new Error('Invalid links');
  for (const link of c.links) {
    const u = new URL(link.url);
    if (!link.label || typeof link.label !== 'string' || u.protocol !== 'https:' || u.username || u.password) throw new Error('Links must have a label and HTTPS URL');
  }
  return c;
}
const escapeVcard = s => s.replaceAll('\\','\\\\').replaceAll(';','\\;').replaceAll(',','\\,').replaceAll('\n','\\n');
export function vcard(c) {
  const lines = ['BEGIN:VCARD','VERSION:3.0','N:Jang;Jihoon;;;',`FN:${escapeVcard(c.name)} (${escapeVcard(c.englishName)})`,`ORG:${escapeVcard(c.company)};${escapeVcard(c.team)}`,`TITLE:${escapeVcard(c.role)}`,`TEL;TYPE=CELL:+82${c.phone.slice(1)}`,`EMAIL;TYPE=WORK:${c.email}`,`ADR;TYPE=WORK:;;${escapeVcard(c.address)};;;;`,`URL:${c.siteUrl}`,'END:VCARD'];
  return lines.map(s => { let out = '', line = ''; for (const ch of s) { if (Buffer.byteLength(line + ch) > 74) { out += line + '\r\n'; line = ' '; } line += ch; } return out + line; }).join('\r\n') + '\r\n';
}
