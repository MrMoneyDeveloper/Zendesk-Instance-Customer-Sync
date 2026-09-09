import { readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root=fileURLToPath(new URL('..',import.meta.url));
const app=join(root,'zendesk-app');
const required=['manifest.json','requirements.json','translations/en.json','assets/iframe.html','assets/zis.js','assets/health.js','assets/reports.js','assets/app.js','assets/styles.css','assets/record-overrides.css','assets/health.css','assets/icon_nav_bar.svg','assets/logo.png','assets/logo-small.png','assets/react.production.min.js','assets/react-dom.production.min.js','assets/jspdf.umd.min.js','assets/jspdf.plugin.autotable.min.js'];
let failed=false;

for(const file of required){
  try{await stat(join(app,file));console.log('OK ',file);}catch{console.error('MISS',file);failed=true;}
}
for(const file of ['manifest.json','requirements.json','translations/en.json']){
  try{JSON.parse(await readFile(join(app,file),'utf8'));}catch(error){console.error('JSON',file,error.message);failed=true;}
}

const manifest=JSON.parse(await readFile(join(app,'manifest.json'),'utf8'));
if(manifest.location?.support?.nav_bar!=='assets/iframe.html'){console.error('Manifest nav_bar must point to assets/iframe.html');failed=true;}
if((manifest.parameters||[]).length){console.error('Single-ZIP app must not require external service settings');failed=true;}

const requirements=JSON.parse(await readFile(join(app,'requirements.json'),'utf8'));
const objects=requirements.custom_objects_v2?.objects||[];
const fields=requirements.custom_objects_v2?.object_fields||[];
for(const key of ['cxe_zd_sync_connection','cxe_zd_sync_job']){
  if(!objects.some(object=>object.key===key)){console.error('Missing '+key+' requirement');failed=true;}
  if(fields.filter(field=>field.object_key===key).length>20){console.error(key+' exceeds the 20-field requirement limit');failed=true;}
}
const lookup=fields.find(field=>field.key==='cxe_client');
if(!lookup||lookup.relationship_target_type!=='zen:custom_object:client'){console.error('Client lookup relationship is missing or targets the wrong object');failed=true;}

for(const file of ['assets/app.js','assets/zis.js','assets/health.js','assets/reports.js']){
  const syntax=spawnSync(process.execPath,['--check',join(app,file)],{encoding:'utf8'});
  if(syntax.status!==0){console.error(syntax.stderr);failed=true;}else console.log('OK  '+file+' syntax');
}
const appSource=await readFile(join(app,'assets','app.js'),'utf8');
if(/[ÃƒÃ‚Ã¢]/.test(appSource)){console.error('Application JavaScript contains mojibake characters');failed=true;}
if(/relay_url|relay_secret|\/v1\/sync|test-and-seal/.test(appSource)){console.error('Obsolete relay runtime code remains');failed=true;}

const packageJson=JSON.parse(await readFile(join(root,'package.json'),'utf8'));
const reactSource=await readFile(join(app,'assets','react.production.min.js'));
const reactDomSource=await readFile(join(app,'assets','react-dom.production.min.js'));
const expectedReact=await readFile(join(root,'node_modules','react','umd','react.production.min.js'));
const expectedReactDom=await readFile(join(root,'node_modules','react-dom','umd','react-dom.production.min.js'));
if(packageJson.devDependencies?.react!=='18.3.1'||packageJson.devDependencies?.['react-dom']!=='18.3.1'||!reactSource.equals(expectedReact)||!reactDomSource.equals(expectedReactDom)){
  console.error('Expected matched React and ReactDOM 18.3.1 production runtimes');failed=true;
}
if(packageJson.devDependencies?.jspdf!=='3.0.2'||packageJson.devDependencies?.['jspdf-autotable']!=='5.0.2'){
  console.error('Expected pinned jsPDF and AutoTable runtimes for in-app PDF generation');failed=true;
}
if(failed)process.exit(1);
console.log('Local structural validation passed. Run npm run zendesk:validate for official ZCLI validation.');
