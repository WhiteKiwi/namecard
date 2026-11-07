import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const sha = execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const version = JSON.parse(await fs.readFile('package.json')).version;
if (process.env.GITHUB_REF_TYPE === 'tag' && process.env.GITHUB_REF_NAME !== `v${version}`) throw new Error('Release tag/version mismatch');
const files=[];
async function walk(dir,prefix='') { for (const entry of (await fs.readdir(dir,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name))) {
 const path=prefix+entry.name; if(entry.isDirectory()) await walk(`${dir}/${entry.name}`,`${path}/`);
 else if(entry.isFile()) files.push({path,sha256:createHash('sha256').update(await fs.readFile(`${dir}/${entry.name}`)).digest('hex')});
 else throw new Error('Only regular release files are allowed');
} }
await walk('dist'); await fs.mkdir('release',{recursive:true});
const manifest={version,source:sha,files};
await fs.writeFile('release/manifest.json',JSON.stringify(manifest,null,2)+'\n');
execFileSync('tar',['--sort=name','--mtime=@0','--owner=0','--group=0','--numeric-owner','-czf','release/namecard.tar.gz','-C','dist','.']);
const checks=[];for(const name of ['namecard.tar.gz','manifest.json']) checks.push(createHash('sha256').update(await fs.readFile(`release/${name}`)).digest('hex')+'  '+name);
await fs.writeFile('release/SHA256SUMS',checks.join('\n')+'\n');
console.log(`Packed v${version} from ${sha}; ${files.length} public files.`);
