(function (root, factory) {
  var api = factory(root || {});
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.CXEReports = api;
})(typeof self !== 'undefined' ? self : this, function (root) {
  'use strict';

  var deps = {};
  var EXPLORE_VALIDATION_NOTE = 'Zendesk Explore is the authoritative full-population reporting surface for these KPIs. The public Zendesk API reference does not expose an Explore query-results endpoint to this single-ZIP app. Validate reply time, resolution time, requester wait, CSAT and rated ratio in the Support and Messaging Explore datasets before final client use; API and Explore results can differ because their calculations, date filters, processing and refresh timing differ.';
  var COLORS = {
    ink: [31, 41, 51],
    muted: [104, 115, 125],
    navy: [3, 54, 61],
    teal: [48, 170, 188],
    blue: [31, 115, 183],
    pale: [237, 247, 248],
    line: [216, 220, 222],
    white: [255, 255, 255],
    green: [3, 129, 83],
    amber: [217, 130, 0],
    red: [204, 51, 64]
  };

  function configure(next) { deps = Object.assign({}, deps, next || {}); return api; }
  function arr(value) { return Array.isArray(value) ? value : []; }
  function text(value) { return value == null ? '' : String(value); }
  function ascii(value) {
    return text(value)
      .replace(/[\u2010-\u2015]/g, '-')
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201c\u201d]/g, '"')
      .replace(/\u00b7/g, ' - ')
      .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, '');
  }
  function slug(value) { return ascii(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'zendesk'; }
  function csvEscape(value) { var s=text(value); return /[",\r\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s; }
  function csv(rows) { return rows.map(function (row) { return row.map(csvEscape).join(','); }).join('\r\n'); }
  function scoreLabel(status) { return status==='yes'?'Yes':status==='no'?'No':status==='na'?'Not applicable':status==='unavailable'?'Unavailable':'Needs review'; }
  function percent(value) { return value == null ? 'No data' : Number(value).toFixed(1)+'%'; }
  function formatMinutes(value) {
    if (value == null) return 'No data';
    var minutes=Math.round(Number(value));
    if (minutes<60) return minutes+' min';
    if (minutes<1440) return Math.floor(minutes/60)+'h '+(minutes%60)+'m';
    return Math.floor(minutes/1440)+'d '+Math.floor((minutes%1440)/60)+'h';
  }
  function generated(report) { try { return new Date(report.generatedAt).toLocaleString('en-ZA'); } catch (e) { return text(report.generatedAt); } }

  function metricRows(report) {
    var channels=report&&report.operational&&report.operational.byChannel||{}, email=channels.email_web||{}, messaging=channels.messaging||{};
    return [
      ['Tickets Created Monthly (average over last '+(report&&report.periodMonths||12)+' months)',email.averageCreatedPerMonth==null?'No data':email.averageCreatedPerMonth,messaging.averageCreatedPerMonth==null?'No data':messaging.averageCreatedPerMonth],
      ['First Reply Time (median, calendar)',formatMinutes(email.firstReplyCalendar&&email.firstReplyCalendar.medianMinutes),formatMinutes(messaging.firstReplyCalendar&&messaging.firstReplyCalendar.medianMinutes)],
      ['Full Resolution Time (median, calendar)',formatMinutes(email.fullResolutionCalendar&&email.fullResolutionCalendar.medianMinutes),formatMinutes(messaging.fullResolutionCalendar&&messaging.fullResolutionCalendar.medianMinutes)],
      ['Requester Wait Time (median, calendar)',formatMinutes(email.requesterWaitCalendar&&email.requesterWaitCalendar.medianMinutes),formatMinutes(messaging.requesterWaitCalendar&&messaging.requesterWaitCalendar.medianMinutes)],
      ['Satisfaction Score',percent(email.satisfactionPercent),percent(messaging.satisfactionPercent)],
      ['% Tickets Rated (of solved tickets)',percent(email.percentSolvedTicketsRated),percent(messaging.percentSolvedTicketsRated)]
    ];
  }

  function operationalCsv(clientName, report) {
    var op=report.operational||{}, rows=[['Client','Report','Section','Item','Email / Web Form','Messaging','Value','Additional detail']];
    rows.push([clientName,'Operational Health','Methodology','Ticket volume source','','','Zendesk Search Count','Exact monthly Email/Web Form and native Messaging counts; not limited by Search result pagination']);
    rows.push([clientName,'Operational Health','Methodology','Duration and satisfaction source','','','Bounded stratified Zendesk API sample',text(op.dataCoverage&&op.dataCoverage.samplingDescription)]);
    rows.push([clientName,'Operational Health','Methodology','Full-population KPI validation','','','Zendesk Explore required',EXPLORE_VALIDATION_NOTE]);
    rows.push([clientName,'Operational Health','Methodology','Metric-set coverage','','',text(op.dataCoverage&&op.dataCoverage.metricSets||0)+' of '+text(op.dataCoverage&&op.dataCoverage.tickets||0)+' sampled tickets',percent(op.dataCoverage&&op.dataCoverage.metricCoveragePercent)]);
    metricRows(report).forEach(function (row) { rows.push([clientName,'Operational Health','Channel metrics',row[0],row[1],row[2],'','']); });
    [['Unsolved',op.counts&&op.counts.unsolved],['Stale unsolved >7d',op.counts&&op.counts.staleUnsolved],['Stale pending >7d',op.counts&&op.counts.stalePending],['Negative CSAT',op.counts&&op.counts.negativeCsat],['Suspended',op.counts&&op.counts.suspended]].forEach(function(row){rows.push([clientName,'Operational Health','Queue risks',row[0],'','',row[1],'']);});
    var agents=op.agents||{};
    [['Active agents',agents.active],['Light agents',agents.lightAgents],['With signatures',agents.withSignature]].forEach(function(row){rows.push([clientName,'Operational Health','Agent and licence signals',row[0],'','',row[1],'']);});
    arr(agents.licenceBreakdown).forEach(function(item){rows.push([clientName,'Operational Health','Active seats by licence type',item.licenceType,'','',item.count,'Active users']);});
    arr(agents.roleBreakdown).forEach(function(item){rows.push([clientName,'Operational Health','Active people by Zendesk role',item.role,'','',item.count,item.licenceType]);});
    arr(report.adminSignals&&report.adminSignals.topMacros).forEach(function(item){rows.push([clientName,'Operational Health','Top macros',item.title,'','',item.usage30d,item.active?'Active':'Inactive']);});
    arr(op.months).forEach(function(month){var item=op.monthly&&op.monthly[month]||{};rows.push([clientName,'Operational Health','Monthly volume',month,item.email_web==null?'Not available':item.email_web,item.messaging==null?'Not available':item.messaging,'','Exact Search Count']);});
    [['By brand (sample)',op.byBrand],['By group (sample)',op.byGroup],['By agent (sample)',op.byAgent]].forEach(function(section){arr(section[1]).forEach(function(item){rows.push([clientName,'Operational Health',section[0],item.name,'','',item.ticketsCreated,'Solved: '+item.solvedTickets+'; FRT median: '+formatMinutes(item.firstReplyCalendar&&item.firstReplyCalendar.medianMinutes)+'; One-touch: '+item.oneTouchTickets+'; CSAT: '+percent(item.satisfactionPercent)]);});});
    arr(report.limitations).forEach(function(item){rows.push([clientName,'Operational Health','Limitations',item,'','','','']);});
    return csv(rows);
  }

  function scorecardCsv(clientName, report) {
    var rows=[['Client','Report','Item','Answer','Detected answer','Weight','Phase','Business plan category','Plan dependent','Evidence','Source','Benefit']];
    arr(report&&report.scorecard&&report.scorecard.rows).forEach(function(row){rows.push([clientName,'Capability Scorecard',row.item,scoreLabel(row.status),scoreLabel(row.detectedStatus),row.weight,row.phase,row.category,row.plan,row.evidence,row.source,row.benefit]);});
    arr(report&&report.limitations).forEach(function(item){rows.push([clientName,'Capability Scorecard','Data limitation','Unavailable','','','','','',''+item,'Zendesk API diagnostic','']);});
    return csv(rows);
  }

  function combinedCsv(clientName, report) {
    var rows=[['Client','Report','Section','Item','Status / channel','Value','Additional detail']];
    var coverage=report&&report.operational&&report.operational.dataCoverage||{};
    rows.push([clientName,'Combined Executive Report','Methodology','Ticket volume','Exact Search Count',coverage.exactVolumeTickets==null?'Not available':coverage.exactVolumeTickets,'Email/Web Form and native Messaging only; monthly counts are not limited by Search result pagination']);
    rows.push([clientName,'Combined Executive Report','Methodology','Duration and satisfaction metrics','Bounded API sample',coverage.tickets||0,text(coverage.samplingDescription)+' Metric-set coverage '+text(coverage.metricSets||0)+' ('+percent(coverage.metricCoveragePercent)+')']);
    rows.push([clientName,'Combined Executive Report','Methodology','Full-population KPI validation','Zendesk Explore required','',EXPLORE_VALIDATION_NOTE]);
    metricRows(report).forEach(function(row){rows.push([clientName,'Operational Health','Channel metrics',row[0],'Email / Web Form',row[1],'']);rows.push([clientName,'Operational Health','Channel metrics',row[0],'Messaging',row[2],'']);});
    var op=report.operational||{};
    [['Unsolved',op.counts&&op.counts.unsolved],['Stale unsolved >7d',op.counts&&op.counts.staleUnsolved],['Stale pending >7d',op.counts&&op.counts.stalePending],['Negative CSAT',op.counts&&op.counts.negativeCsat],['Suspended',op.counts&&op.counts.suspended]].forEach(function(row){rows.push([clientName,'Operational Health','Queue risks',row[0],'',row[1],'']);});
    var agents=op.agents||{};
    [['Active agents',agents.active],['Light agents',agents.lightAgents],['With signatures',agents.withSignature]].forEach(function(row){rows.push([clientName,'Operational Health','Agent and licence signals',row[0],'',row[1],'']);});
    arr(agents.licenceBreakdown).forEach(function(item){rows.push([clientName,'Operational Health','Active seats by licence type',item.licenceType,'',item.count,'Active users']);});
    arr(agents.roleBreakdown).forEach(function(item){rows.push([clientName,'Operational Health','Active people by Zendesk role',item.role,item.licenceType,item.count,'Active users']);});
    arr(op.months).forEach(function(month){var item=op.monthly&&op.monthly[month]||{};rows.push([clientName,'Operational Health','Monthly volume',month,'Email/Web | Messaging',text(item.email_web==null?'Not available':item.email_web)+' | '+text(item.messaging==null?'Not available':item.messaging),'Exact Search Count']);});
    arr(report.scorecard&&report.scorecard.rows).forEach(function(row){rows.push([clientName,'Capability Scorecard',row.phase,row.item,scoreLabel(row.status),row.weight,row.category+'; '+row.evidence+'; Source: '+row.source]);});
    arr(report.limitations).forEach(function(item){rows.push([clientName,'Combined Executive Report','Data limitation',item,'Unavailable','','Contact Farhaan / CX Experts Support with the diagnostic reference.']);});
    return csv(rows);
  }

  function getPdf() {
    var Ctor=deps.jsPDF || root.jspdf&&root.jspdf.jsPDF;
    if (!Ctor) throw new Error('The PDF runtime was not loaded.');
    return new Ctor({orientation:'portrait',unit:'mm',format:'a4',compress:true});
  }
  function table(doc, options) {
    var fn=deps.autoTable || (doc.autoTable&&function(d,o){d.autoTable(o);}) || root.jspdfAutoTable;
    if (!fn) throw new Error('The PDF table runtime was not loaded.');
    if (fn===deps.autoTable || fn===root.jspdfAutoTable) fn(doc,options); else fn(doc,options);
    return doc.lastAutoTable&&doc.lastAutoTable.finalY || options.startY || 20;
  }
  function setText(doc,color){doc.setTextColor.apply(doc,color);}
  function sectionTitle(doc,title,y) {
    if(y>272){doc.addPage();y=19;}
    doc.setFillColor.apply(doc,COLORS.navy);doc.roundedRect(14,y,182,10,2,2,'F');setText(doc,COLORS.white);doc.setFont('helvetica','bold');doc.setFontSize(12);doc.text(ascii(title),19,y+6.6);return y+14;
  }
  function pageSection(doc,title,y) {
    if(y>25){doc.addPage();y=19;}
    return sectionTitle(doc,title,y);
  }
  function addCover(doc, clientName, title, subtitle, report) {
    doc.setFillColor.apply(doc,COLORS.navy);doc.rect(0,0,210,58,'F');
    doc.setFillColor.apply(doc,COLORS.teal);doc.rect(0,58,210,3,'F');
    setText(doc,COLORS.white);doc.setFont('helvetica','bold');doc.setFontSize(11);doc.text('CX EXPERTS',15,16);
    doc.setFontSize(25);doc.text(ascii(title),15,34);
    doc.setFont('helvetica','normal');doc.setFontSize(11);doc.text(ascii(subtitle),15,46);
    setText(doc,COLORS.ink);doc.setFont('helvetica','bold');doc.setFontSize(19);doc.text(ascii(clientName),15,79);
    doc.setFont('helvetica','normal');doc.setFontSize(10);setText(doc,COLORS.muted);doc.text('Generated: '+ascii(generated(report)),15,89);doc.text('Reporting window: '+text(report.periodMonths||12)+' months',15,96);
    doc.setFillColor.apply(doc,COLORS.pale);doc.roundedRect(15,107,180,28,3,3,'F');setText(doc,COLORS.navy);doc.setFont('helvetica','bold');doc.setFontSize(10);doc.text('READ-ONLY ZENDESK ASSESSMENT',22,117);doc.setFont('helvetica','normal');doc.setFontSize(9);doc.text('Configuration and operational signals are collected through Zendesk-hosted',22,125);doc.text('integration services. The report does not include ticket subjects or comments.',22,131);
    return 150;
  }
  function kpis(doc, items, y) {
    var width=(182-(items.length-1)*4)/items.length;
    items.forEach(function(item,index){var x=14+index*(width+4);doc.setFillColor.apply(doc,COLORS.pale);doc.setDrawColor.apply(doc,COLORS.line);doc.roundedRect(x,y,width,25,2,2,'FD');setText(doc,COLORS.navy);doc.setFont('helvetica','bold');doc.setFontSize(14);doc.text(ascii(item[0]),x+4,y+9);setText(doc,COLORS.muted);doc.setFont('helvetica','normal');doc.setFontSize(7.5);doc.text(doc.splitTextToSize(ascii(item[1]),width-8),x+4,y+16);});
    return y+31;
  }
  function baseTable(head,body,y,columns) {
    return {startY:y,head:[head.map(ascii)],body:body.map(function(row){return row.map(ascii);}),theme:'grid',margin:{left:14,right:14,top:18,bottom:16},styles:{font:'helvetica',fontSize:7.4,textColor:COLORS.ink,cellPadding:2,overflow:'linebreak',lineColor:COLORS.line,lineWidth:.15},headStyles:{fillColor:COLORS.navy,textColor:COLORS.white,fontStyle:'bold'},alternateRowStyles:{fillColor:[248,249,249]},columnStyles:columns||{},showHead:'everyPage'};
  }
  function addFooters(doc, clientName, reportTitle) {
    var pages=doc.getNumberOfPages();
    for(var i=1;i<=pages;i++){doc.setPage(i);doc.setDrawColor.apply(doc,COLORS.line);doc.line(14,285,196,285);doc.setFont('helvetica','normal');doc.setFontSize(7);setText(doc,COLORS.muted);doc.text('CX Experts | '+ascii(reportTitle)+' | '+ascii(clientName),14,290);doc.text('Page '+i+' of '+pages,196,290,{align:'right'});}
  }
  function addOperational(doc, clientName, report, startY, includeTitle) {
    var op=report.operational||{},score=report.scorecard||{},coverage=op.dataCoverage||{},y=startY;
    if(includeTitle)y=pageSection(doc,'Operational health summary',y);
    y=kpis(doc,[[text(coverage.exactVolumeTickets==null?'N/A':coverage.exactVolumeTickets),'Exact channel volume'],[text(op.counts&&op.counts.unsolved==null?'N/A':op.counts.unsolved),'Unsolved tickets'],[percent(score.scoreWithinAssessed),'Verified capability score'],[text(score.manualQuestionCount||0),'Questions need review']],y);
    y=pageSection(doc,'Operational metrics by channel',y);
    y=table(doc,baseTable(['Metric','Email / Web Form','Messaging'],metricRows(report),y,{0:{cellWidth:88},1:{cellWidth:47},2:{cellWidth:47}}))+7;
    y=pageSection(doc,'Methodology and coverage',y);
    y=table(doc,baseTable(['Control','Result'],[['Ticket volume source','Exact monthly Zendesk Search Count for Email/Web Form and native Messaging'],['Duration and satisfaction source',text(coverage.samplingDescription||'Bounded Zendesk API sample')],['Full-population KPI validation',EXPLORE_VALIDATION_NOTE],['Metric-set coverage',text(coverage.metricSets||0)+' of '+text(coverage.tickets||0)+' sampled tickets ('+percent(coverage.metricCoveragePercent)+')'],['Time statistic','Calendar-time median; average and sample size remain in the app detail'],['Scoring guardrail','Unverifiable configuration, usage, process or unavailable API claims remain Needs review and earn no automatic points']],y,{0:{cellWidth:58},1:{cellWidth:124}}))+7;
    y=pageSection(doc,'Queue and experience risks',y);
    y=table(doc,baseTable(['Signal','Value'],[['Unsolved',op.counts&&op.counts.unsolved],['Stale unsolved >7d',op.counts&&op.counts.staleUnsolved],['Stale pending >7d',op.counts&&op.counts.stalePending],['Negative CSAT',op.counts&&op.counts.negativeCsat],['Suspended',op.counts&&op.counts.suspended]],y,{0:{cellWidth:130},1:{cellWidth:52}}))+7;
    var agents=op.agents||{};y=pageSection(doc,'Agent and licence signals',y);
    y=table(doc,baseTable(['Signal','Value'],[['Active agents',agents.active],['Light agents',agents.lightAgents],['With signatures',agents.withSignature]],y,{0:{cellWidth:130},1:{cellWidth:52}}))+7;
    if(arr(agents.licenceBreakdown).length){y=pageSection(doc,'Active seats by licence type',y);y=table(doc,baseTable(['Licence type','Active users'],arr(agents.licenceBreakdown).map(function(item){return[item.licenceType,item.count];}),y,{0:{cellWidth:130},1:{cellWidth:52}}))+7;}
    if(arr(agents.roleBreakdown).length){y=pageSection(doc,'Active people by Zendesk role',y);y=table(doc,baseTable(['Role / custom role','Licence type','Active users'],arr(agents.roleBreakdown).map(function(item){return[item.role,item.licenceType,item.count];}),y,{0:{cellWidth:86},1:{cellWidth:66},2:{cellWidth:30}}))+7;}
    y=pageSection(doc,'Monthly ticket volume',y);
    y=table(doc,baseTable(['Month','Email/Web Form','Native Messaging'],arr(op.months).map(function(month){var row=op.monthly&&op.monthly[month]||{};return[month,row.email_web==null?'Not available':row.email_web,row.messaging==null?'Not available':row.messaging];}),y,{0:{cellWidth:70},1:{cellWidth:56},2:{cellWidth:56}}))+7;
    if(arr(report.adminSignals&&report.adminSignals.topMacros).length){y=pageSection(doc,'Top macros by 30-day usage',y);y=table(doc,baseTable(['Macro','Usage','Status'],arr(report.adminSignals.topMacros).map(function(item){return[item.title,item.usage30d,item.active?'Active':'Inactive'];}),y,{0:{cellWidth:120}}))+7;}
    [['By brand (sample)',op.byBrand],['By group (sample)',op.byGroup],['By agent (sample)',op.byAgent]].forEach(function(section){y=pageSection(doc,'Operational breakdown - '+section[0].slice(3),y);y=table(doc,baseTable(['Name','Created','Solved','FRT median','One-touch','CSAT'],arr(section[1]).map(function(item){return[item.name,item.ticketsCreated,item.solvedTickets,formatMinutes(item.firstReplyCalendar&&item.firstReplyCalendar.medianMinutes),item.oneTouchTickets,percent(item.satisfactionPercent)];}),y,{0:{cellWidth:62}}))+7;});
    if(arr(report.limitations).length){y=pageSection(doc,'Data limitations',y);y=table(doc,baseTable(['Source / limitation'],arr(report.limitations).map(function(item){return[item];}),y))+7;}
    return y;
  }
  function addScorecard(doc, report, startY, includeTitle) {
    var score=report.scorecard||{},y=startY;
    if(includeTitle)y=pageSection(doc,'Capability scorecard summary',y);
    y=kpis(doc,[[text(score.achievedPoints||0)+' / '+text(score.assessedPoints||0),'Verified points'],[percent(score.scoreWithinAssessed),'Score within assessed'],[percent(score.automationCoveragePercent),'Automation coverage'],[text(score.manualQuestionCount||0),'Questions need review']],y);
    y=pageSection(doc,'Score by business category',y);
    y=table(doc,baseTable(['Category','Score','Available','Verified %','Coverage %'],arr(score.byCategory).map(function(item){return[item.name,item.score,item.outOf,percent(item.percentOfTotal),percent(item.percentWithinAssessed)];}),y,{0:{cellWidth:82}}))+7;
    y=pageSection(doc,'Score by maturity phase',y);
    y=table(doc,baseTable(['Phase','Score','Available','Verified %','Coverage %'],arr(score.byPhase).map(function(item){return[item.name,item.score,item.outOf,percent(item.percentOfTotal),percent(item.percentWithinAssessed)];}),y,{0:{cellWidth:82}}))+7;
    y=pageSection(doc,'Detailed 258-point assessment',y);
    y=table(doc,baseTable(['Question','Answer','Weight','Phase / category','Evidence and source'],arr(score.rows).map(function(row){return[row.item,scoreLabel(row.status),row.weight,row.phase+' / '+row.category,row.evidence+' Source: '+row.source];}),y,{0:{cellWidth:52},1:{cellWidth:20},2:{cellWidth:14},3:{cellWidth:37},4:{cellWidth:59}}))+7;
    return y;
  }
  function createOperationalPdf(clientName, report) { var doc=getPdf(),y=addCover(doc,clientName,'Zendesk Operational Health','Service performance, demand, queue and workforce signals',report);addOperational(doc,clientName,report,y,false);addFooters(doc,clientName,'Operational Health Report');return doc; }
  function createScorecardPdf(clientName, report) { var doc=getPdf(),y=addCover(doc,clientName,'Zendesk Capability Scorecard','Configuration maturity and consultant-verifiable controls',report);addScorecard(doc,report,y,false);addFooters(doc,clientName,'Capability Scorecard');return doc; }
  function createCombinedPdf(clientName, report) { var doc=getPdf(),y=addCover(doc,clientName,'Zendesk Success Review','Combined operational health and capability assessment',report);y=addOperational(doc,clientName,report,y,false);doc.addPage();y=19;y=sectionTitle(doc,'Capability scorecard',y);addScorecard(doc,report,y,false);addFooters(doc,clientName,'Combined Executive Report');return doc; }
  function filename(clientName,kind,extension){return slug(clientName)+'-zendesk-'+kind+'-report.'+extension;}
  function savePdf(clientName,report,kind){var doc=kind==='operational'?createOperationalPdf(clientName,report):kind==='scorecard'?createScorecardPdf(clientName,report):createCombinedPdf(clientName,report);doc.save(filename(clientName,kind==='combined'?'combined-executive':kind, 'pdf'));}

  var api={configure:configure,metricRows:metricRows,operationalCsv:operationalCsv,scorecardCsv:scorecardCsv,combinedCsv:combinedCsv,createOperationalPdf:createOperationalPdf,createScorecardPdf:createScorecardPdf,createCombinedPdf:createCombinedPdf,savePdf:savePdf,filename:filename};
  return api;
});
