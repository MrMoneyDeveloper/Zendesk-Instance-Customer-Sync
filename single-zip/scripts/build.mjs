import { copyFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
const root = fileURLToPath(new URL('..', import.meta.url));
const out = join(root, 'zendesk-app', 'assets');
const vendor = join(root, 'vendor');
await mkdir(out, { recursive: true });
await mkdir(vendor, { recursive: true });
for (const f of ['zis.js','health.js','reports.js','app.js','styles.css','record-overrides.css','health.css','iframe.html']) await copyFile(join(root,'src',f), join(out,f));
for (const f of ['react.production.min.js','react-dom.production.min.js']) {
  const packageName = f.startsWith('react-dom') ? 'react-dom' : 'react';
  const source = join(root,'node_modules',packageName,'umd',f);
  await copyFile(source, join(vendor,f));
  await copyFile(source, join(out,f));
}
await copyFile(join(root,'node_modules','jspdf','dist','jspdf.umd.min.js'),join(out,'jspdf.umd.min.js'));
await copyFile(join(root,'node_modules','jspdf-autotable','dist','jspdf.plugin.autotable.min.js'),join(out,'jspdf.plugin.autotable.min.js'));
console.log('Built Zendesk client-side assets into zendesk-app/assets');
