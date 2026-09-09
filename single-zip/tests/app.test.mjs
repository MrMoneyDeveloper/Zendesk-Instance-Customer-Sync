import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const root=fileURLToPath(new URL('..',import.meta.url));
const require=createRequire(import.meta.url);
const zis=require(join(root,'src','zis.js'));
const health=require(join(root,'src','health.js'));
const reports=require(join(root,'src','reports.js'));
const {jsPDF}=require('jspdf');
const {autoTable}=require('jspdf-autotable');
reports.configure({jsPDF,autoTable});
const app=await readFile(join(root,'src','app.js'),'utf8');
const req=JSON.parse(await readFile(join(root,'zendesk-app','requirements.json'),'utf8'));
const manifest=JSON.parse(await readFile(join(root,'zendesk-app','manifest.json'),'utf8'));
const sample=zis.buildBundle([{clientId:'client-001',connectionName:'cxe_12345678_sample',domain:'client.zendesk.com'}]);

test('is a private nav-bar Zendesk app with no runtime settings',()=>{
  assert.equal(manifest.private,true);
  assert.equal(manifest.location.support.nav_bar,'assets/iframe.html');
  assert.deepEqual(manifest.parameters,[]);
});

test('provisions connection metadata and temporary job objects',()=>{
  const objects=req.custom_objects_v2.objects.map(object=>object.key);
  assert.deepEqual(objects,['cxe_zd_sync_connection','cxe_zd_sync_job']);
  const fields=req.custom_objects_v2.object_fields;
  assert.equal(fields.find(field=>field.key==='cxe_client').relationship_target_type,'zen:custom_object:client');
  for(const key of ['cxe_zis_connection_name','cxe_last_health_at','cxe_health_overrides','cxe_health_window_months','cxe_job_client_id','cxe_job_run_id','cxe_job_scope','cxe_job_key','cxe_job_root','cxe_job_url']){
    assert.ok(fields.some(field=>field.key===key),key+' is required');
  }
});

test('stores API tokens and OAuth bearer tokens only in redacted Zendesk ZIS connections',()=>{
  assert.match(app,/'bearer_token':'basic_auth'/);
  assert.match(app,/cxe_auth_type:candidateType/);
  assert.match(app,/cxe_zis_connection_name/);
  assert.doesNotMatch(app,/cxe_access_token|PBKDF2|AES-256-GCM/);
  assert.doesNotMatch(app,/relay_url|relay_secret|\/v1\/sync|test-and-seal/);
});

test('builds three PDF and CSV report packages without a backend',()=>{
  const report=health.buildReport({now:'2026-09-07T09:00:00.000Z',months:12,tickets:[],metricSets:[],counts:{unsolved:4,staleUnsolved:1},agentUsage:{active:3,lightAgents:1},config:{macros:[{id:1,title:'Welcome',usage_30d:12}]},limitations:['[CXE-20260907-ABC123] example endpoint issue. Contact Farhaan / CX Experts Support at support@cxexperts.co.za.']});
  assert.match(reports.operationalCsv('Example',report),/Operational Health/);
  assert.match(reports.scorecardCsv('Example',report),/Capability Scorecard/);
  assert.match(reports.combinedCsv('Example',report),/Operational Health[\s\S]*Capability Scorecard/);
  const pdfs=[reports.createOperationalPdf('Example',report),reports.createScorecardPdf('Example',report),reports.createCombinedPdf('Example',report)];
  for(const pdf of pdfs){
    assert.ok(pdf.output('arraybuffer').byteLength>5000);
  }
  assert.ok(pdfs[0].getNumberOfPages()>=8,'operational PDF gives each major section its own page');
  assert.ok(pdfs[1].getNumberOfPages()>=4,'scorecard PDF gives each major section its own page');
  assert.ok(pdfs[2].getNumberOfPages()>=11,'combined PDF preserves section page breaks');
});

test('ZIS bundle routes a short-lived custom-object job to a client action',()=>{
  const resources=sample.resources;
  const action=resources[zis.actionName('client-001')];
  const flow=resources[zis.FLOW_NAME].properties.definition;
  const job=resources[zis.JOB_SPEC_NAME].properties;
  assert.equal(action.properties.definition.connectionName,'cxe_12345678_sample');
  assert.equal(action.properties.definition['url.$'],'$.url');
  assert.equal(job.event_source,'support');
  assert.equal(job.event_type,'customobject.CustomObjectRecordCreated');
  assert.equal(flow.States[zis.fetchStateName('client-001')].ActionName,'zis:cxe_config_sync:action:'+zis.actionName('client-001'));
  assert.equal(flow.States[zis.fetchStateName('client-001')].Type,'Action');
  assert.equal(flow.States[zis.fetchStateName('client-001')].Next,'PostFetch');
  assert.equal(flow.States.PostFetch.Choices[0].Next,'MinimiseHealthTickets');
  assert.match(flow.States.MinimiseHealthTickets.Parameters.expr,/satisfaction_rating/);
  assert.match(flow.States.MinimiseHealthTickets.Parameters.expr,/reply_time_in_seconds/);
  assert.match(flow.States.MinimiseHealthTickets.Parameters.expr,/if \.end_of_stream == null then true else \.end_of_stream end/);
  assert.doesNotMatch(flow.States.MinimiseHealthTickets.Parameters.expr,/description|subject|requester_id|submitter_id|comment/);
  assert.ok(!Object.values(flow.States).some(state=>state.Type==='Map'));
});

test('bundle contains no client credentials or domain allowlist bypass',()=>{
  const json=JSON.stringify(sample);
  assert.doesNotMatch(json,/password|api[_-]?token|support@/i);
  assert.throws(()=>zis.assertSafeUrl('https://evil.example/api/v2/groups.json','client.zendesk.com'),/unsafe/);
  assert.equal(new URL(zis.withPageSize('client.zendesk.com','/api/v2/groups.json')).searchParams.get('per_page'),'25');
});

test('pagination remains on the configured client Zendesk host',()=>{
  assert.equal(zis.nextPage({next_page:'https://client.zendesk.com/api/v2/groups.json?page=2'},'https://client.zendesk.com/api/v2/groups.json','client.zendesk.com'),'https://client.zendesk.com/api/v2/groups.json?page=2');
  assert.equal(zis.nextPage({end_of_stream:false,after_url:'https://client.zendesk.com/api/v2/incremental/tickets/cursor?cursor=abc'},'https://client.zendesk.com/api/v2/incremental/tickets/cursor?start_time=1','client.zendesk.com'),'https://client.zendesk.com/api/v2/incremental/tickets/cursor?cursor=abc');
  assert.equal(zis.nextPage({end_of_stream:true,after_cursor:'finished'},'https://client.zendesk.com/api/v2/incremental/tickets/cursor.json','client.zendesk.com'),'');
  assert.throws(()=>zis.nextPage({links:{next:'https://other.zendesk.com/api/v2/groups.json'}},'https://client.zendesk.com/api/v2/groups.json','client.zendesk.com'),/unsafe/);
});

test('sync engine keeps all configuration areas and adds read-only health sources',()=>{
  for(const key of ['groups','views','ticket_fields','automations','triggers','macros','brands','custom_object_fields','help_centre_articles']){
    assert.match(app,new RegExp("key:'"+key+"'"));
  }
  assert.match(app,/incremental\/tickets\/cursor\.json\?start_time=/);
  assert.match(app,/include=metric_sets/);
  assert.match(app,/maxPages:1/);
  assert.match(app,/via:mail via:web/);
  assert.match(app,/via:native_messaging/);
  assert.match(app,/Bounded stratified API sample/);
  assert.match(app,/\/api\/v2\/search\/count\.json/);
  assert.match(app,/\/api\/v2\/account\/settings\.json/);
  assert.doesNotMatch(app,/\/api\/v2\/tickets\.json/);
  assert.match(app,/failure\.status===429/);
  assert.match(app,/statusMatch=raw\.match/);
  assert.match(app,/401\|403\|404\|429\|5\[0-9\]/);
  assert.match(app,/\[5000,15000,40000\]/);
  assert.match(app,/PAYLOAD_TOO_LARGE/);
  assert.match(app,/reducePageSize\(spec\.url\)/);
  assert.match(app,/Retrying the same cursor with a smaller page size/);
  assert.match(app,/Active seats by licence type/);
  assert.match(app,/Active people by Zendesk role/);
  assert.doesNotMatch(app,/Inactive >30d/);
});

test('health scorecard preserves the supplied 258-point structure',()=>{
  assert.equal(health.SCORECARD.length,61);
  assert.equal(health.SCORECARD.reduce((sum,row)=>sum+row.weight,0),258);
  assert.deepEqual([...new Set(health.SCORECARD.map(row=>row.phase))],['Set Strong Foundations','Getting Good','Getting Great','Becoming Best in Class']);
});

test('health report separates email/web from messaging and calculates calendar metrics',()=>{
  const now='2026-09-06T12:00:00.000Z';
  const tickets=[
    {id:1,created_at:'2026-09-01T10:00:00Z',status:'solved',via:{channel:'email'},satisfaction_rating:{score:'good'}},
    {id:2,created_at:'2026-08-01T10:00:00Z',status:'solved',via:{channel:'web'},satisfaction_rating:{score:'bad'}},
    {id:3,created_at:'2026-07-01T10:00:00Z',status:'solved',via:{channel:'messaging'},from_messaging_channel:true,satisfaction_rating:{score:'unoffered'}}
  ];
  const metricSets=[
    {ticket_id:1,solved_at:'2026-09-02T10:00:00Z',replies:1,reply_time_in_minutes:{calendar:10},full_resolution_time_in_minutes:{calendar:100},requester_wait_time_in_minutes:{calendar:80}},
    {ticket_id:2,solved_at:'2026-08-02T10:00:00Z',replies:2,reply_time_in_minutes:{calendar:30},full_resolution_time_in_minutes:{calendar:300},requester_wait_time_in_minutes:{calendar:220}},
    {ticket_id:3,solved_at:'2026-07-02T10:00:00Z',replies:2,reply_time_in_minutes:{calendar:null},reply_time_in_seconds:{calendar:120},full_resolution_time_in_minutes:{calendar:50},requester_wait_time_in_minutes:{calendar:40}},
    {ticket_id:999,solved_at:'2024-01-01T00:00:00Z',reply_time_in_minutes:{calendar:5}}
  ];
  const report=health.buildReport({now,months:12,tickets,metricSets,counts:{unsolved:9},config:{macros:[{id:5,title:'Popular',usage_30d:20},{id:6,title:'Unused',usage_30d:0}]}});
  assert.equal(report.operational.byChannel.email_web.ticketsCreated,2);
  assert.equal(report.operational.byChannel.messaging.ticketsCreated,1);
  assert.equal(report.operational.byChannel.email_web.firstReplyCalendar.medianMinutes,20);
  assert.equal(report.operational.byChannel.messaging.firstReplyCalendar.medianMinutes,2);
  assert.equal(report.operational.byChannel.email_web.satisfactionPercent,50);
  assert.equal(report.operational.dataCoverage.metricSets,3);
  assert.equal(report.operational.dataCoverage.metricCoveragePercent,100);
  assert.equal(report.operational.counts.unsolved,9);
  assert.equal(report.adminSignals.topMacros[0].title,'Popular');
});

test('health report uses exact monthly Search Count volumes and labels sampled metrics',()=>{
  const now='2026-09-06T12:00:00.000Z';
  const months=health.rollingMonths(12,now),monthlyCounts={};
  months.forEach((month,index)=>{monthlyCounts[month]={email_web:100+index,messaging:10+index};});
  const report=health.buildReport({now,months:12,tickets:[],metricSets:[],monthlyCounts,sampled:true,truncated:true,samplingDescription:'Bounded stratified API sample for tests.'});
  assert.equal(report.operational.monthly[months[0]].email_web,100);
  assert.equal(report.operational.byChannel.email_web.ticketsCreated,months.reduce((sum,month)=>sum+monthlyCounts[month].email_web,0));
  assert.equal(report.operational.byChannel.messaging.ticketsCreated,months.reduce((sum,month)=>sum+monthlyCounts[month].messaging,0));
  assert.equal(report.operational.dataCoverage.exactVolumeTickets,months.reduce((sum,month)=>sum+monthlyCounts[month].email_web+monthlyCounts[month].messaging,0));
  assert.equal(report.operational.dataCoverage.sampled,true);
  assert.match(reports.operationalCsv('Example',report),/Exact Search Count/);
  assert.match(reports.combinedCsv('Example',report),/Bounded API sample/);
  assert.match(reports.operationalCsv('Example',report),/Zendesk Explore required/);
  assert.match(reports.operationalCsv('Example',report),/authoritative full-population reporting surface/);
});

test('unverifiable scorecard questions stay manual until explicitly answered',()=>{
  const assessment=health.scorecardAssessment({config:{},operational:{dataCoverage:{}},accountSettings:{},extra:{}},{});
  assert.ok(assessment.manualQuestionCount>0);
  assert.ok(assessment.rows.some(row=>row.status==='manual'));
  assert.equal(assessment.assessedPoints,assessment.achievedPoints+assessment.failedPoints);
});

test('scorecard uses conservative evidence for configuration-versus-usage claims',()=>{
  const assessment=health.scorecardAssessment({
    config:{ticket_fields:[{title:'Contact reason'},{title:'Intent'},{title:'Sentiment'},{title:'Language'}],recipient_addresses:[{address:'support@example.com'}]},
    operational:{dataCoverage:{metricSets:20},byChannel:{email_web:{ratedTickets:1},messaging:{ticketsCreated:5,ratedTickets:0}}},
    accountSettings:{active_features:{customer_satisfaction:true},ai:{enabled:true}},
    extra:{guideThemes:[{},{}],appInstallations:[{name:'CRM and Workforce Management'}]}
  },{});
  for(const phrase of ['custom theme','custom email addresses','advanced ai agent','custom-build crm zaf','capturing contact drivers','tracking/monitoring kpio','systems requests','workforce management']){
    const row=assessment.rows.find(item=>item.item.toLowerCase().includes(phrase));
    assert.equal(row.status,'manual',phrase);
  }
});

test('connection identity is deterministic and repair is additive',()=>{
  assert.match(app,/cxe-config:'\+clientRecord\.id/);
  assert.doesNotMatch(app,/DELETE \/api\/v2\/custom_objects/);
});

test('application strings contain no mojibake',()=>{
  assert.doesNotMatch(app,/[ÃƒÃ‚Ã¢]/);
  assert.match(app,/Contact Farhaan \/ CX Experts Support/);
});
