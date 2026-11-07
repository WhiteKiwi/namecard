import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validateConfig, vcard} from '../scripts/content.mjs';
const config = JSON.parse(fs.readFileSync('config.json'));
test('reject unsafe links, injected vCard lines and noncanonical URLs', () => {
  for (const change of [{links:[{label:'bad',url:'javascript:alert(1)'}]}, {name:'x\nTEL:123'}, {siteUrl:'https://a.test/?secret=x'}, {siteUrl:'http://a.test'}, {gaMeasurementId:'G-<script>'}]) assert.throws(() => validateConfig({...config,...change}));
});
test('vCard is Unicode-safe, CRLF-folded and retains contact semantics', () => {
  const c = {...config, company:'회사, 이름; 조직', address:'서울'.repeat(80)};
  const output = vcard(c);
  for (const line of output.split('\r\n')) assert.ok(Buffer.byteLength(line) <= 74);
  const unfolded = output.replaceAll('\r\n ', '');
  assert.ok(unfolded.includes('ORG:회사\\, 이름\\; 조직;'));
  assert.ok(unfolded.includes(c.address));
  assert.ok(unfolded.includes('TEL;TYPE=CELL:+821058007614'));
  assert.ok(!output.replaceAll('\r\n','').includes('\n'));
});
