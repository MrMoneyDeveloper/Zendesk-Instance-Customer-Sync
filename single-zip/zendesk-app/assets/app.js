(function () {
  'use strict';

  var h = React.createElement;
  var ZIS_CORE = window.CXEZIS;
  var HEALTH = window.CXEHealth;
  var REPORTS = window.CXEReports;
  var CONNECTION_OBJECT = 'cxe_zd_sync_connection';
  var CLIENT_OBJECT = 'client';
  var JOB_OBJECT = ZIS_CORE && ZIS_CORE.JOB_OBJECT || 'cxe_zd_sync_job';
  var API_TOKEN_STORAGE_VERSION = 'zis-basic-auth-v1';
  var OAUTH_STORAGE_VERSION = 'zis-bearer-token-v1';
  var MAX_PAGES = 200;
  var ZIS_RUNTIME_BATCH_SIZE = 4;
  var ZAF = window.ZAFClient ? window.ZAFClient.init() : null;

  var SOURCE_DEFS = [
    { key:'groups', label:'Groups', endpoint:'/api/v2/groups.json', root:'groups' },
    { key:'views', label:'Views', endpoint:'/api/v2/views.json', root:'views' },
    { key:'agents', label:'Agents', endpoint:'/api/v2/users.json?role%5B%5D=agent&role%5B%5D=admin', root:'users' },
    { key:'recipient_addresses', label:'Inbound Channels', endpoint:'/api/v2/recipient_addresses.json', root:'recipient_addresses' },
    { key:'business_hours', label:'Operating Hours', endpoint:'/api/v2/business_hours/schedules.json', root:'schedules' },
    { key:'custom_objects', label:'Custom Objects', endpoint:'/api/v2/custom_objects', root:'custom_objects', optional:true },
    { key:'ticket_forms', label:'Forms', endpoint:'/api/v2/ticket_forms.json', root:'ticket_forms' },
    { key:'ticket_fields', label:'Fields', endpoint:'/api/v2/ticket_fields.json', root:'ticket_fields' },
    { key:'tags', label:'Tags', endpoint:'/api/v2/tags.json', root:'tags', optional:true },
    { key:'custom_statuses', label:'Statuses', endpoint:'/api/v2/custom_statuses.json', root:'custom_statuses', optional:true },
    { key:'sla_policies', label:'SLA', endpoint:'/api/v2/slas/policies.json', root:'sla_policies', optional:true },
    { key:'automations', label:'Automations', endpoint:'/api/v2/automations.json', root:'automations' },
    { key:'triggers', label:'Triggers', endpoint:'/api/v2/triggers.json', root:'triggers' },
    { key:'trigger_categories', label:'Trigger Categories', endpoint:'/api/v2/trigger_categories', root:'trigger_categories', optional:true },
    { key:'macros', label:'Macros', endpoint:'/api/v2/macros.json', root:'macros' },
    { key:'brands', label:'Brands', endpoint:'/api/v2/brands.json', root:'brands', optional:true },
    { key:'user_fields', label:'User Fields', endpoint:'/api/v2/user_fields.json', root:'user_fields', optional:true },
    { key:'organization_fields', label:'Organization Fields', endpoint:'/api/v2/organization_fields.json', root:'organization_fields', optional:true }
  ];

  var GENERATED_DEFS = [
    { key:'custom_object_fields', label:'Custom Object Fields', generated:'custom_object_fields' },
    { key:'help_centre_categories', label:'Help Centre Categories', helpCentre:'categories' },
    { key:'help_centre_sections', label:'Help Centre Sections', helpCentre:'sections' },
    { key:'help_centre_articles', label:'Help Centre Articles', helpCentre:'articles' }
  ];

  var REQUIRED_FIELDS = [
    {key:'cxe_client',title:'Client',type:'lookup',relationship_target_type:'zen:custom_object:client'},
    {key:'cxe_domain',title:'Zendesk Domain',type:'text'},
    {key:'cxe_api_email',title:'API / Integration Email',type:'text'},
    {key:'cxe_auth_type',title:'Authentication Type',type:'dropdown',custom_field_options:[{name:'Zendesk API token',value:'api_token'},{name:'Zendesk OAuth access token',value:'oauth'}]},
    {key:'cxe_credential_envelope',title:'Legacy Credential Envelope',type:'textarea'},
    {key:'cxe_zis_connection_name',title:'Zendesk ZIS Connection Name',type:'text'},
    {key:'cxe_enabled',title:'Enabled',type:'checkbox'},
    {key:'cxe_connection_status',title:'Connection Status',type:'dropdown',custom_field_options:[{name:'Connected',value:'connected'},{name:'Credential invalid',value:'invalid'},{name:'Disabled',value:'disabled'},{name:'Permission issue',value:'permission_issue'},{name:'Error',value:'error'}]},
    {key:'cxe_last_test_at',title:'Last Connection Test',type:'text'},
    {key:'cxe_last_sync_at',title:'Last Successful Sync',type:'text'},
    {key:'cxe_last_health_at',title:'Last Health Report',type:'text'},
    {key:'cxe_health_overrides',title:'Health Scorecard Overrides',type:'textarea'},
    {key:'cxe_health_window_months',title:'Health Reporting Window',type:'integer'},
    {key:'cxe_last_http_status',title:'Last HTTP Status',type:'integer'},
    {key:'cxe_last_error',title:'Last Error',type:'textarea'},
    {key:'cxe_credential_updated_at',title:'Credential Updated At',type:'text'},
    {key:'cxe_auth_version',title:'Credential Storage Version',type:'text'}
  ];

  var REQUIRED_JOB_FIELDS = [
    {key:'cxe_job_client_id',title:'Client Record ID',type:'text'},
    {key:'cxe_job_run_id',title:'Run ID',type:'text'},
    {key:'cxe_job_scope',title:'Temporary Result Scope',type:'text'},
    {key:'cxe_job_key',title:'Configuration Section Key',type:'text'},
    {key:'cxe_job_root',title:'Response Root Key',type:'text'},
    {key:'cxe_job_url',title:'Read-only Zendesk URL',type:'text'},
    {key:'cxe_job_requested_at',title:'Requested At',type:'text'}
  ];

  function nowIso(){ return new Date().toISOString(); }
  function arr(x){ return Array.isArray(x) ? x : []; }
  function safeString(v){ return v == null ? '' : String(v); }
  function humanTime(v){ if(!v) return 'Never'; try{return new Date(v).toLocaleString();}catch(e){return v;} }
  function objectName(x){ return safeString(x && (x.name || x.title || x.raw_title || x.key || x.id)) || 'Untitled'; }
  function rollingMonthWindows(count){
    var now=new Date(),output=[];
    for(var offset=Number(count||12)-1;offset>=0;offset--){
      var start=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth()-offset,1)),end=new Date(Date.UTC(start.getUTCFullYear(),start.getUTCMonth()+1,1));
      output.push({key:start.toISOString().slice(0,7),start:start.toISOString().slice(0,10),end:end.toISOString().slice(0,10)});
    }
    return output;
  }

  function normalizeDomain(value){
    var s=safeString(value).trim().toLowerCase().replace(/^https?:\/\//,'').replace(/\/$/,'');
    s=s.split('/')[0];
    if(!/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.zendesk\.com$/.test(s)) throw new Error('Enter a valid Zendesk subdomain such as client.zendesk.com.');
    return s;
  }

  function sectionDef(key){
    return SOURCE_DEFS.concat(GENERATED_DEFS).find(function(def){return def.key===key;});
  }

  function expectedFieldType(field){
    if(!field) return '';
    return field.key==='cxe_client' ? field.type+'|'+safeString(field.relationship_target_type) : field.type;
  }

  function zafRequest(url, method, body){
    if(!ZAF) return Promise.reject(new Error('This operation requires the app to run inside Zendesk.'));
    var opts={url:url,type:method||'GET'};
    if(body!==undefined){ opts.contentType='application/json'; opts.data=JSON.stringify(body); }
    return ZAF.request(opts);
  }

  function sleep(milliseconds){ return new Promise(function(resolve){setTimeout(resolve,milliseconds);}); }

  function requestError(error,fallback){
    var payload=error && error.responseJSON, message=payload && (payload.message || payload.error && payload.error.message) || error && error.responseText || error && error.message || fallback || 'Zendesk request failed.';
    var result=new Error(typeof message==='string'?message:JSON.stringify(message));
    result.status=error && error.status || 0;
    return result;
  }

  function displayError(error,fallback){
    if(!error)return fallback||'Zendesk request failed.';
    if(typeof error==='string')return error;
    if(typeof error.message==='string'&&error.message)return error.message;
    try{var rendered=JSON.stringify(error.message||error);if(rendered&&rendered!=='{}')return rendered;}catch(ignore){}
    return fallback||'Zendesk request failed. Contact Farhaan / CX Experts Support at support@cxexperts.co.za.';
  }

  async function zisManagementRequest(url,method,body,fallback){
    for(var attempt=0;attempt<4;attempt++){
      try{return await zafRequest(url,method,body);}catch(error){
        var wrapped=requestError(error,fallback),retryable=wrapped.status===429||wrapped.status>=500||/throttl|temporar|rate.?limit/i.test(wrapped.message);
        if(!retryable||attempt===3)throw wrapped;
        await sleep([1000,3000,8000,15000][attempt]);
      }
    }
  }

  async function zisIntegrationExists(){
    if(!ZIS_CORE) throw new Error('The Zendesk-hosted ZIS runtime was not loaded.');
    var path='/api/services/zis/registry/integrations', listing;
    try{listing=await zafRequest(path,'GET');}catch(error){var denied=requestError(error,'Zendesk Integration Services is unavailable.');if(denied.status===403)denied.message='Zendesk Integration Services is not enabled for this account or this user is not an administrator.';throw denied;}
    return arr(listing.integrations).some(function(item){return item.name===ZIS_CORE.INTEGRATION_KEY;});
  }

  async function ensureZisIntegration(){
    var exists=await zisIntegrationExists();
    if(!exists) await zafRequest('/api/services/zis/registry/'+encodeURIComponent(ZIS_CORE.INTEGRATION_KEY),'POST',{description:'CX Experts Zendesk configuration sync'});
    return true;
  }

  function zisMappings(records,override){
    var mapped={};
    arr(records).forEach(function(record){
      var fields=record.custom_object_fields||{}, clientId=safeString(fields.cxe_client), name=safeString(fields.cxe_zis_connection_name);
      if(clientId&&name&&fields.cxe_domain)mapped[clientId]={clientId:clientId,connectionName:name,domain:fields.cxe_domain};
    });
    if(override&&override.clientId)mapped[override.clientId]=override;
    return Object.keys(mapped).map(function(key){return mapped[key];});
  }

  async function installZisBundle(records,override){
    var mappings=zisMappings(records,override);
    if(!mappings.length)return false;
    var bundle=ZIS_CORE.buildBundle(mappings);
    await zafRequest('/api/services/zis/registry/'+encodeURIComponent(ZIS_CORE.INTEGRATION_KEY)+'/bundles','POST',bundle);
    try{
      await zafRequest('/api/services/zis/registry/job_specs/install?job_spec_name='+encodeURIComponent('zis:'+ZIS_CORE.INTEGRATION_KEY+':job_spec:'+ZIS_CORE.JOB_SPEC_NAME),'POST');
    }catch(error){if(!(error&&error.status===409))throw requestError(error,'The ZIS sync job could not be installed.');}
    return true;
  }

  async function createZisConnection(clientId,domain,email,token,authType){
    var name=ZIS_CORE.connectionName(clientId);
    var type=authType==='oauth'?'oauth':'api_token', endpoint=type==='oauth'?'bearer_token':'basic_auth';
    var payload={name:name,allowed_domain:ZIS_CORE.normalizeDomain(domain)};
    if(type==='oauth')payload.token=safeString(token).trim();
    else{payload.username=safeString(email).trim()+'/token';payload.password=safeString(token).trim();}
    await zafRequest('/api/services/zis/integrations/'+encodeURIComponent(ZIS_CORE.INTEGRATION_KEY)+'/connections/'+endpoint,'POST',payload);
    return name;
  }

  async function deleteZisConnection(name,authType){
    if(!name)return;
    var endpoint=authType==='oauth'?'bearer_token':'basic_auth';
    try{await zafRequest('/api/services/zis/integrations/'+encodeURIComponent(ZIS_CORE.INTEGRATION_KEY)+'/connections/'+endpoint+'/'+encodeURIComponent(name),'DELETE');}catch(error){if(!(error&&error.status===404))throw error;}
  }

  async function putRunConfig(scope,runId){
    var path='/api/services/zis/integrations/'+encodeURIComponent(ZIS_CORE.INTEGRATION_KEY)+'/configs';
    try{await zisManagementRequest(path,'POST',{scope:scope,config:{run_id:runId,status:'pending'}},'Could not prepare temporary ZIS result storage.');}
    catch(error){if(error&&error.status===422)await zisManagementRequest(path+'/'+encodeURIComponent(scope),'PUT',{config:{run_id:runId,status:'pending'}},'Could not update temporary ZIS result storage.');else throw requestError(error,'Could not prepare temporary ZIS result storage.');}
  }

  async function removeRunConfig(scope){
    try{await zafRequest('/api/services/zis/integrations/'+encodeURIComponent(ZIS_CORE.INTEGRATION_KEY)+'/configs/'+encodeURIComponent(scope),'DELETE');}catch(ignore){}
  }

  async function readRunConfigs(prefix){
    var url='/api/services/zis/integrations/'+encodeURIComponent(ZIS_CORE.INTEGRATION_KEY)+'/configs?filter%5Bscope%5D='+encodeURIComponent(prefix+'*')+'&page%5Bsize%5D=100';
    var response=await zisManagementRequest(url,'GET',undefined,'Could not read temporary ZIS results.'), output={};
    arr(response.configs).forEach(function(item){output[item.scope]=item.config||{};});
    return output;
  }

  function zisFailure(config){
    var raw='';try{raw=JSON.stringify(config&&config.error||{});}catch(ignore){raw=safeString(config&&config.error);}
    var statusMatch=raw.match(/(?:status(?:\s+code)?|http)[^0-9]{0,12}([45][0-9]{2})/i)||raw.match(/\b(401|403|404|429|5[0-9]{2})\b/),status=statusMatch?Number(statusMatch[1]):0;
    var error=new Error(status===401||/unauthor/i.test(raw)?'The Zendesk credential is invalid, expired, or revoked.':status===403||/forbidden/i.test(raw)?'The Zendesk user does not have permission to read this configuration.':'Zendesk ZIS could not complete the client request. '+raw.slice(0,500));
    error.status=status||(/unauthor/i.test(raw)?401:/forbidden/i.test(raw)?403:0);
    error.code=error.status===401?'CREDENTIAL_INVALID':error.status===403?'PERMISSION_DENIED':/payload is larger than 2mb/i.test(raw)?'PAYLOAD_TOO_LARGE':'ZIS_ACTION_ERROR';
    return error;
  }

  function reducePageSize(value){
    var url;try{url=new URL(value);}catch(ignore){return '';}
    var key=url.searchParams.has('per_page')?'per_page':url.searchParams.has('page[size]')?'page[size]':'';
    if(!key)return '';
    var current=Number(url.searchParams.get(key));
    if(!Number.isFinite(current)||current<=1)return '';
    url.searchParams.set(key,String(Math.max(1,Math.floor(current/2))));
    return url.toString();
  }

  function sourceDiagnostic(spec,error){
    var target='';try{var parsed=new URL(spec&&spec.url);target=parsed.pathname;}catch(ignore){target=safeString(spec&&spec.url).split('?')[0];}
    var status=error&&error.status?String(error.status):'unknown', stamp=nowIso(), reference='CXE-'+stamp.slice(0,10).replace(/-/g,'')+'-'+ZIS_CORE.hash(safeString(spec&&spec.key)+'|'+target+'|'+status).slice(0,6).toUpperCase();
    var reason=safeString(error&&error.message||'Zendesk returned an unexpected response.').replace(/(authorization\s*[:=]\s*)([^\s,;]+)/ig,'$1[redacted]').slice(0,500);
    return '['+reference+'] '+safeString(spec&&spec.key||'unknown_source')+' ('+target+') failed at '+stamp+'; HTTP '+status+'. '+reason+' Contact Farhaan / CX Experts Support at support@cxexperts.co.za and include reference '+reference+'.';
  }

  async function executeZisBatch(clientId,specs){
    if(!specs.length)return[];
    if(specs.length>ZIS_CORE.MAX_BATCH_REQUESTS)throw new Error('The ZIS batch is too large.');
    var runId=(window.crypto&&window.crypto.randomUUID?window.crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2));
    var requests=specs.map(function(spec,index){return ZIS_CORE.makeRequest(clientId,runId,index,spec.key,spec.root,spec.url);});
    var prefix=ZIS_CORE.CONFIG_PREFIX+ZIS_CORE.hash(clientId)+'_'+ZIS_CORE.hash(runId)+'_', jobRecords=[];
    try{
      for(var setupIndex=0;setupIndex<requests.length;setupIndex++)await putRunConfig(requests[setupIndex].scope,runId);
      var created=[];
      for(var createIndex=0;createIndex<requests.length;createIndex++){
        var request=requests[createIndex];
        created.push(await zisManagementRequest('/api/v2/custom_objects/'+encodeURIComponent(JOB_OBJECT)+'/records','POST',{custom_object_record:{name:'CXE sync '+runId.slice(0,8)+' '+(createIndex+1),custom_object_fields:{cxe_job_client_id:clientId,cxe_job_run_id:runId,cxe_job_scope:request.scope,cxe_job_key:request.key,cxe_job_root:request.root,cxe_job_url:request.url,cxe_job_requested_at:nowIso()}}},'Could not queue a Zendesk ZIS read job.'));
      }
      jobRecords=created.map(function(item){return item&&item.custom_object_record;}).filter(Boolean);
      for(var attempt=0;attempt<120;attempt++){
        var configs=await readRunConfigs(prefix), finished=requests.every(function(request){var config=configs[request.scope];return config&&config.run_id===runId&&config.status!=='pending';});
        if(finished)return requests.map(function(request,index){return {spec:specs[index],request:request,config:configs[request.scope]};});
        await sleep(1000);
      }
      throw new Error('Zendesk ZIS did not finish the configuration request within two minutes.');
    }finally{
      for(var cleanupIndex=0;cleanupIndex<requests.length;cleanupIndex++)await removeRunConfig(requests[cleanupIndex].scope);
      for(var jobIndex=0;jobIndex<jobRecords.length;jobIndex++)await zafRequest('/api/v2/custom_objects/'+encodeURIComponent(JOB_OBJECT)+'/records/'+encodeURIComponent(jobRecords[jobIndex].id),'DELETE').catch(function(){});
    }
  }

  async function fetchZisSpecs(clientId,domain,specs,onProgress){
    var pending=specs.slice(), items={}, errors={}, raw={}, pageCounts={}, truncated={};
    while(pending.length){
      var batch=pending.splice(0,Math.min(ZIS_RUNTIME_BATCH_SIZE,ZIS_CORE.MAX_BATCH_REQUESTS));
      if(onProgress)onProgress('Zendesk is reading '+batch.length+' request'+(batch.length===1?'':'s')+' through ZIS…');
      var results=await executeZisBatch(clientId,batch);
      var retryDelay=0;
      results.forEach(function(result){
        var spec=result.spec, config=result.config||{};
        if(config.status==='error'){
          var failure=zisFailure(config);
          var retryAttempt=Number(spec.retryAttempt||0);
          if(failure.code==='PAYLOAD_TOO_LARGE'){
            var reducedUrl=reducePageSize(spec.url),payloadRetryAttempt=Number(spec.payloadRetryAttempt||0);
            if(reducedUrl&&payloadRetryAttempt<7){
              pending.unshift(Object.assign({},spec,{url:reducedUrl,payloadRetryAttempt:payloadRetryAttempt+1}));
              if(onProgress)onProgress('Zendesk returned an oversized page. Retrying the same cursor with a smaller page size…');
              return;
            }
          }
          if((failure.status===429||failure.status>=500)&&retryAttempt<3){
            pending.push(Object.assign({},spec,{retryAttempt:retryAttempt+1}));
            retryDelay=Math.max(retryDelay,[5000,15000,40000][retryAttempt]);
            return;
          }
          failure.message=sourceDiagnostic(spec,failure);
          if(!spec.optional||failure.status===401)throw failure;
          errors[spec.key]=failure.message;return;
        }
        var response=config.response||{}, values=arr(response[spec.root]).map(sanitize);
        if(!Object.prototype.hasOwnProperty.call(response,spec.root)){
          var schemaFailure=new Error('The expected response field "'+spec.root+'" was missing. Zendesk may have changed this endpoint or response format.');schemaFailure.status=200;schemaFailure.message=sourceDiagnostic(spec,schemaFailure);
          if(!spec.optional)throw schemaFailure;errors[spec.key]=schemaFailure.message;return;
        }
        if(spec.parentKey)values=values.map(function(value){return Object.assign({},value,{_parent_custom_object_key:spec.parentKey,_parent_custom_object_title:spec.parentTitle||spec.parentKey});});
        items[spec.key]=(items[spec.key]||[]).concat(values);raw[spec.key]=response;
        if(spec.sideRoots)Object.keys(spec.sideRoots).forEach(function(rootName){var targetKey=spec.sideRoots[rootName];items[targetKey]=(items[targetKey]||[]).concat(arr(response[rootName]).map(sanitize));});
        var countKey=spec.key+'|'+safeString(spec.parentKey), count=(pageCounts[countKey]||0)+1;pageCounts[countKey]=count;
        var next=ZIS_CORE.nextPage(response,spec.url,domain),pageLimit=Number(spec.maxPages||MAX_PAGES);
        if(next){if(count>=pageLimit)truncated[spec.key]=true;else pending.push(Object.assign({},spec,{url:next}));}
      });
      if(retryDelay){
        if(onProgress)onProgress('Zendesk rate-limited a request. Retrying automatically in '+Math.round(retryDelay/1000)+' seconds…');
        await sleep(retryDelay);
      }
    }
    return {items:items,errors:errors,raw:raw,truncated:truncated};
  }

  async function fetchConfiguration(clientId,domain,requestedKeys,onProgress){
    var requested=arr(requestedKeys), wanted={};requested.forEach(function(key){wanted[key]=true;});
    var data={}, errors={}, baseDefs=SOURCE_DEFS.filter(function(def){return wanted[def.key]||def.key==='custom_objects'&&wanted.custom_object_fields;});
    if(baseDefs.length){
      var base=await fetchZisSpecs(clientId,domain,baseDefs.map(function(def){return {key:def.key,root:def.root,url:ZIS_CORE.withPageSize(domain,def.endpoint),optional:!!def.optional};}),onProgress);
      Object.assign(data,base.items);Object.assign(errors,base.errors);
    }
    var helpDefs=GENERATED_DEFS.filter(function(def){return def.helpCentre&&wanted[def.key];});
    if(helpDefs.length){
      var localeResult=await fetchZisSpecs(clientId,domain,[{key:'__locales',root:'locales',url:ZIS_CORE.withPageSize(domain,'/api/v2/help_center/locales.json'),optional:true}],onProgress);
      var localeBody=localeResult.raw.__locales||{}, locale=safeString(localeBody.default_locale||arr(localeBody.locales)[0]||'en-us').toLowerCase();
      var help=await fetchZisSpecs(clientId,domain,helpDefs.map(function(def){return {key:def.key,root:def.helpCentre,url:ZIS_CORE.withPageSize(domain,'/api/v2/help_center/'+encodeURIComponent(locale)+'/'+def.helpCentre+'.json'),optional:true};}),onProgress);
      Object.assign(data,help.items);Object.assign(errors,help.errors);
    }
    if(wanted.custom_object_fields){
      var objects=arr(data.custom_objects), fieldSpecs=objects.filter(function(object){return object&&object.key;}).map(function(object){return {key:'custom_object_fields',root:'custom_object_fields',url:ZIS_CORE.withPageSize(domain,'/api/v2/custom_objects/'+encodeURIComponent(object.key)+'/fields?include_standard_fields=true'),optional:true,parentKey:object.key,parentTitle:object.title};});
      data.custom_object_fields=[];
      if(fieldSpecs.length){var fields=await fetchZisSpecs(clientId,domain,fieldSpecs,onProgress);data.custom_object_fields=fields.items.custom_object_fields||[];if(fields.errors.custom_object_fields)errors.custom_object_fields=fields.errors.custom_object_fields;}
    }
    if(!wanted.custom_objects)delete data.custom_objects;
    requested.forEach(function(key){if(!data[key])data[key]=[];});
    return {data:data,errors:errors,syncedAt:nowIso()};
  }

  function safeClientUrl(domain,path){return ZIS_CORE.assertSafeUrl(new URL(path,'https://'+normalizeDomain(domain)).toString(),domain);}

  function summarizeAgentUsage(agents,customRoles){
    var all=arr(agents),active=all.filter(function(agent){return agent&&agent.active!==false;}),roleNames={};
    arr(customRoles).forEach(function(role){if(role&&role.id!=null)roleNames[safeString(role.id)]=safeString(role.name||role.title||role.id);});
    var grouped={},licences={};
    active.forEach(function(agent){
      if(!agent)return;var isLight=Number(agent.role_type)===1||/light/.test(safeString(agent.role).toLowerCase()),licence=isLight?'Light agent':agent.role==='admin'?'Administrator (full agent)':'Full agent';
      var role=roleNames[safeString(agent.custom_role_id)]||(agent.role==='admin'?'Administrator':isLight?'Light agent':safeString(agent.role||'Agent').replace(/_/g,' ').replace(/\b\w/g,function(letter){return letter.toUpperCase();}));
      var key=role+'|'+licence;if(!grouped[key])grouped[key]={role:role,licenceType:licence,count:0};grouped[key].count+=1;
      if(!licences[licence])licences[licence]={licenceType:licence,count:0};licences[licence].count+=1;
    });
    return {records:all.length,active:active.length,lightAgents:active.filter(function(agent){return Number(agent.role_type)===1||/light/.test(safeString(agent.role).toLowerCase());}).length,withSignature:active.filter(function(agent){return safeString(agent.signature).trim();}).length,licenceBreakdown:Object.keys(licences).map(function(key){return licences[key];}).sort(function(a,b){return b.count-a.count;}),roleBreakdown:Object.keys(grouped).map(function(key){return grouped[key];}).sort(function(a,b){return b.count-a.count||a.role.localeCompare(b.role);})};
  }

  async function fetchHealthSources(connection,onProgress){
    var cutoff=new Date(Date.now()-7*86400000).toISOString().slice(0,10),domain=connection.domain,windows=rollingMonthWindows(12);
    var sampleIndexes=[0,3,6,9,11],specs=sampleIndexes.map(function(index){
      var window=windows[index],startTime=Math.floor(Date.parse(window.start+'T00:00:00Z')/1000);
      return {key:'health_tickets',root:'tickets',sideRoots:{metric_sets:'health_metric_sets'},url:safeClientUrl(domain,'/api/v2/incremental/tickets/cursor.json?start_time='+startTime+'&include=metric_sets&support_type_scope=all&exclude_deleted=true&per_page=60'),maxPages:1,optional:true};
    }).concat([
      {key:'health_account',root:'settings',url:safeClientUrl(domain,'/api/v2/account/settings.json')},
      {key:'health_security',root:'security_settings',url:safeClientUrl(domain,'/api/v2/security_settings'),optional:true},
      {key:'health_macros',root:'macros',url:safeClientUrl(domain,'/api/v2/macros.json?include=usage_30d&sort_by=usage_30d&sort_order=desc&per_page=100'),optional:true},
      {key:'health_apps',root:'installations',url:safeClientUrl(domain,'/api/v2/apps/installations.json?include=app&per_page=100'),optional:true},
      {key:'health_themes',root:'themes',url:safeClientUrl(domain,'/api/v2/guide/theming/themes'),optional:true},
      {key:'health_roles',root:'custom_roles',url:safeClientUrl(domain,'/api/v2/custom_roles.json?per_page=100'),optional:true},
      {key:'health_suspended',root:'suspended_tickets',url:safeClientUrl(domain,'/api/v2/suspended_tickets.json?per_page=100'),optional:true},
      {key:'count_unsolved',root:'count',url:safeClientUrl(domain,'/api/v2/search/count.json?query='+encodeURIComponent('type:ticket status<solved'))},
      {key:'count_stale_unsolved',root:'count',url:safeClientUrl(domain,'/api/v2/search/count.json?query='+encodeURIComponent('type:ticket status<solved updated<'+cutoff))},
      {key:'count_stale_pending',root:'count',url:safeClientUrl(domain,'/api/v2/search/count.json?query='+encodeURIComponent('type:ticket status:pending updated<'+cutoff))},
      {key:'count_negative_csat',root:'count',url:safeClientUrl(domain,'/api/v2/search/count.json?query='+encodeURIComponent('type:ticket satisfaction:bad'))}
    ]);
    windows.forEach(function(window){
      var base='type:ticket created>='+window.start+' created<'+window.end;
      specs.push({key:'count_month_'+window.key.replace('-','')+'_email_web',root:'count',url:safeClientUrl(domain,'/api/v2/search/count.json?query='+encodeURIComponent(base+' via:mail via:web')),optional:true});
      specs.push({key:'count_month_'+window.key.replace('-','')+'_messaging',root:'count',url:safeClientUrl(domain,'/api/v2/search/count.json?query='+encodeURIComponent(base+' via:native_messaging')),optional:true});
    });
    if(onProgress)onProgress('Zendesk is reading operational metrics, queues, account settings and app evidence…');
    var fetched=await fetchZisSpecs(connection.clientId,domain,specs,onProgress),raw=fetched.raw||{},items=fetched.items||{};
    function count(key){var value=raw[key]&&raw[key].count;return value==null?null:Number(value);}
    function uniqueBy(values,key){var seen={};return arr(values).filter(function(item){var id=safeString(item&&item[key]);if(!id||seen[id])return false;seen[id]=true;return true;});}
    var monthlyCounts={};windows.forEach(function(window){var prefix='count_month_'+window.key.replace('-','_').replace('_','');monthlyCounts[window.key]={email_web:count(prefix+'_email_web'),messaging:count(prefix+'_messaging')};});
    return {
      tickets:uniqueBy(items.health_tickets,'id'),
      metricSets:uniqueBy(items.health_metric_sets,'ticket_id'),
      accountSettings:raw.health_account&&raw.health_account.settings||{},
      securitySettings:raw.health_security&&raw.health_security.security_settings||null,
      macros:items.health_macros||[],
      appInstallations:items.health_apps||[],
      guideThemes:items.health_themes||[],
      customRoles:items.health_roles||[],
      suspendedTickets:items.health_suspended||[],
      counts:{unsolved:count('count_unsolved'),staleUnsolved:count('count_stale_unsolved'),stalePending:count('count_stale_pending'),negativeCsat:count('count_negative_csat'),suspended:(items.health_suspended||[]).length},
      monthlyCounts:monthlyCounts,
      sampled:true,
      truncated:Boolean(fetched.truncated&&fetched.truncated.health_tickets),
      samplingDescription:'Bounded stratified API sample: up to 60 tickets from five monthly cohorts across the 12-month window. Monthly Email/Web and Messaging volumes use exact Zendesk Search Count queries.',
      errors:fetched.errors||{}
    };
  }

  async function listCustomRecords(objectKey){
    var out=[], cursor='';
    for(var p=0;p<MAX_PAGES;p++){
      var url='/api/v2/custom_objects/'+encodeURIComponent(objectKey)+'/records?page[size]=100'+(cursor?'&page[after]='+encodeURIComponent(cursor):'');
      var data=await zafRequest(url,'GET');
      out=out.concat(arr(data.custom_object_records));
      if(!(data.meta && data.meta.has_more && data.meta.after_cursor)) break;
      cursor=data.meta.after_cursor;
    }
    return out;
  }

  async function upsertConnection(clientRecord, fields){
    var externalId='cxe-config:'+clientRecord.id;
    var body={custom_object_record:{name:'Config connection - '+clientRecord.name,custom_object_fields:fields}};
    return zafRequest('/api/v2/custom_objects/'+CONNECTION_OBJECT+'/records?external_id='+encodeURIComponent(externalId),'PATCH',body);
  }

  async function deleteConnection(clientRecord){
    var externalId='cxe-config:'+clientRecord.id;
    return zafRequest('/api/v2/custom_objects/'+CONNECTION_OBJECT+'/records?external_id='+encodeURIComponent(externalId),'DELETE');
  }

  function connectionFailure(error){
    var status=error && error.status;
    var patch={
      cxe_last_http_status:status||null,
      cxe_last_error:safeString(error && error.message).slice(0,1500)
    };
    if(error && error.code==='CREDENTIAL_INVALID') patch.cxe_connection_status='invalid';
    if(error && error.code==='PERMISSION_DENIED') patch.cxe_connection_status='permission_issue';
    return patch;
  }

  function sanitize(value){
    var secret=/token|secret|password|authorization|credential|api[_ -]?key|client_secret/i;
    if(Array.isArray(value)) return value.map(sanitize);
    if(value && typeof value==='object'){
      var o={}; Object.keys(value).forEach(function(k){ if(!secret.test(k)) o[k]=sanitize(value[k]); }); return o;
    }
    return value;
  }

  function readableValue(v, depth){
    depth=depth||0;
    if(v==null || v==='') return '';
    if(typeof v==='string' || typeof v==='number' || typeof v==='boolean') return String(v);
    if(depth>3) return JSON.stringify(v);
    if(Array.isArray(v)) return v.map(function(x,i){return (i+1)+'. '+readableValue(x,depth+1);}).join('\n');
    return Object.keys(v).map(function(k){return k+': '+readableValue(v[k],depth+1);}).join('\n');
  }

  function itemSummary(item){
    var keys=['id','name','title','key','active','position','type','default','created_at','updated_at'];
    var pairs=[];
    keys.forEach(function(k){ if(item && item[k]!==undefined && item[k]!==null && item[k]!=='') pairs.push([k,item[k]]); });
    return pairs;
  }

  function markdownForSection(clientName,label,items){
    var lines=['# Zendesk Configuration','','Client: '+clientName,'Section: '+label,'Captured: '+nowIso(),''];
    arr(items).forEach(function(item){
      lines.push('## '+objectName(item));
      Object.keys(sanitize(item||{})).forEach(function(k){
        var val=readableValue(sanitize(item[k]));
        if(val) lines.push('**'+k+'**: '+val.replace(/\n/g,'\n  '));
      });
      lines.push('');
    });
    return lines.join('\n');
  }

  function csvEscape(v){ var s=typeof v==='string'?v:JSON.stringify(v==null?'':v); return /[",\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s; }
  function sectionToCsv(items){
    items=arr(items); if(!items.length) return '';
    var keys=[]; items.forEach(function(x){Object.keys(x||{}).forEach(function(k){if(keys.indexOf(k)<0)keys.push(k);});});
    return keys.map(csvEscape).join(',')+'\n'+items.map(function(x){return keys.map(function(k){return csvEscape(x[k]);}).join(',');}).join('\n');
  }

  function parseHealthOverrides(value){
    if(!value)return{};
    try{var parsed=typeof value==='string'?JSON.parse(value):value;return parsed&&typeof parsed==='object'&&!Array.isArray(parsed)?parsed:{};}catch(error){return{};}
  }

  function metricValue(summary){return HEALTH&&HEALTH.formatMinutes?HEALTH.formatMinutes(summary&&summary.medianMinutes):'No data';}
  function metricDetail(summary){return summary&&summary.count?'Median · average '+HEALTH.formatMinutes(summary.averageMinutes)+' · n='+summary.count:'No matching ticket metrics';}
  function percentText(value){return value==null?'No data':Number(value).toFixed(1)+'%';}
  function scoreStatusLabel(status){return status==='yes'?'Yes':status==='no'?'No':status==='na'?'Not applicable':status==='unavailable'?'Unavailable':'Needs review';}

  function healthMetricsRows(report){
    var channels=report&&report.operational&&report.operational.byChannel||{},email=channels.email_web||{},messaging=channels.messaging||{};
    return [
      ['Tickets Created Monthly (average over last '+(report&&report.periodMonths||12)+' months)',email.averageCreatedPerMonth==null?'No data':email.averageCreatedPerMonth,messaging.averageCreatedPerMonth==null?'No data':messaging.averageCreatedPerMonth],
      ['First Reply Time (median, calendar)',metricValue(email.firstReplyCalendar),metricValue(messaging.firstReplyCalendar)],
      ['Full Resolution Time (median, calendar)',metricValue(email.fullResolutionCalendar),metricValue(messaging.fullResolutionCalendar)],
      ['Requester Wait Time (median, calendar)',metricValue(email.requesterWaitCalendar),metricValue(messaging.requesterWaitCalendar)],
      ['Satisfaction Score',percentText(email.satisfactionPercent),percentText(messaging.satisfactionPercent)],
      ['% Tickets Rated (of solved tickets)',percentText(email.percentSolvedTicketsRated),percentText(messaging.percentSolvedTicketsRated)]
    ];
  }

  function healthReportCsv(report){
    var rows=[['Metric','Email / Web Form','Messaging']].concat(healthMetricsRows(report));
    return rows.map(function(row){return row.map(csvEscape).join(',');}).join('\n');
  }

  function scorecardCsv(report){
    var rows=[['Item','Answer','Detected answer','Weight','Phase','Business plan category','Plan dependent','Evidence','Benefit']];
    arr(report&&report.scorecard&&report.scorecard.rows).forEach(function(row){rows.push([row.item,scoreStatusLabel(row.status),scoreStatusLabel(row.detectedStatus),row.weight,row.phase,row.category,row.plan,row.evidence,row.benefit]);});
    return rows.map(function(row){return row.map(csvEscape).join(',');}).join('\n');
  }

  function healthReportMarkdown(clientName,report){
    var op=report.operational||{},score=report.scorecard||{},lines=['# Zendesk Health Report','','Client: '+clientName,'Generated: '+report.generatedAt,'Window: '+report.periodMonths+' months','','## Operational metrics','','| Metric | Email / Web Form | Messaging |','|---|---:|---:|'];
    healthMetricsRows(report).forEach(function(row){lines.push('| '+row[0]+' | '+row[1]+' | '+row[2]+' |');});
    lines.push('','## Queue risks','','- Unsolved tickets: '+safeString(op.counts&&op.counts.unsolved),'- Unsolved and stale over 7 days: '+safeString(op.counts&&op.counts.staleUnsolved),'- Pending and stale over 7 days: '+safeString(op.counts&&op.counts.stalePending),'- Negative CSAT tickets: '+safeString(op.counts&&op.counts.negativeCsat),'- Suspended tickets: '+safeString(op.counts&&op.counts.suspended),'','## Capability scorecard','','Verified score: '+score.achievedPoints+' / '+score.assessedPoints+' assessed points ('+percentText(score.scoreWithinAssessed)+')','Automation coverage: '+percentText(score.automationCoveragePercent),'Needs review: '+score.manualQuestionCount+' question(s)','','| Question | Answer | Weight | Evidence |','|---|---|---:|---|');
    arr(score.rows).forEach(function(row){lines.push('| '+row.item.replace(/\|/g,'/')+' | '+scoreStatusLabel(row.status)+' | '+row.weight+' | '+safeString(row.evidence).replace(/\|/g,'/')+' |');});
    if(arr(report.limitations).length){lines.push('','## Data limitations and support diagnostics','');arr(report.limitations).forEach(function(item){lines.push('- '+item);});}
    return lines.join('\n');
  }

  function downloadText(filename,text,type){
    var blob=new Blob([text],{type:type||'text/plain;charset=utf-8'}), url=URL.createObjectURL(blob), a=document.createElement('a');
    a.href=url; a.download=filename; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function(){URL.revokeObjectURL(url);},1000);
  }

  async function copyText(text){
    if(navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text);
    var ta=document.createElement('textarea'); ta.value=text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove();
  }

  function statusInfo(connection){
    if(!connection) return {label:'Not connected',color:'gray'};
    var f=connection.custom_object_fields||{};
    if(f.cxe_enabled===false || f.cxe_enabled==='false') return {label:'Disabled',color:'amber'};
    var s=safeString(f.cxe_connection_status).toLowerCase();
    if(s.indexOf('invalid')>=0 || s.indexOf('auth')>=0 && s.indexOf('fail')>=0) return {label:'Credential invalid',color:'red'};
    if(s.indexOf('permission')>=0 || s.indexOf('error')>=0) return {label:'Attention',color:'amber'};
    if(s==='connected' || s==='healthy') return {label:'Connected',color:'green'};
    return {label:safeString(f.cxe_connection_status)||'Connected',color:'blue'};
  }

  function Modal(props){
    return h('div',{className:'modal-backdrop',onMouseDown:function(e){if(e.target===e.currentTarget)props.onClose();}},
      h('div',{className:'modal'},
        h('div',{className:'modal-head'},h('div',{className:'modal-title'},props.title),h('button',{className:'close',onClick:props.onClose,'aria-label':'Close dialog'},'×')),
        h('div',{className:'modal-body'},props.children),
        props.footer?h('div',{className:'modal-foot'},props.footer):null));
  }

  function ClientList(props){
    return h('aside',{className:'sidebar'},
      h('input',{className:'search',placeholder:'Search clients…',value:props.filter,onChange:function(e){props.onFilter(e.target.value);}}),
      h('div',{className:'client-list'},props.clients.map(function(c){
        var si=statusInfo(props.connections[c.id]);
        return h('button',{key:c.id,className:'client-card'+(props.selected===c.id?' active':''),onClick:function(){props.onSelect(c.id);}},
          h('span',{className:'client-name',title:c.name},c.name),
          h('span',{className:'status-label'},h('span',{className:'status-dot '+si.color}),si.label));
      })));
  }

  function Overview(props){
    var data=props.data||{}, defs=props.defs;
    var diagnostics=Object.keys(props.errors||{}).map(function(key){return {key:key,message:props.errors[key]};});
    var cards=defs.map(function(d){return h('div',{className:'stat',key:d.key},h('div',{className:'stat-value'},arr(data[d.key]).length),h('div',{className:'stat-label'},d.label));});
    return h('div',null,
      diagnostics.length?h('div',{className:'notice error support-diagnostic'},h('strong',null,'Sync completed with '+diagnostics.length+' source issue'+(diagnostics.length===1?'':'s')+'.'),h('div',null,'The details below are safe to send to Farhaan / CX Experts Support at support@cxexperts.co.za.'),h('ul',null,diagnostics.map(function(item){return h('li',{key:item.key},item.message);}))) : null,
      h('div',{className:'stats'},cards),
      h('div',{className:'panel'},h('div',{className:'panel-head'},h('div',{className:'panel-title'},'Current sync summary')),
        h('div',{className:'panel-body'},
          props.progress?h('div',{className:'notice'},h('span',{className:'spinner'}),props.progress):null,
          h('div',{className:'help'},'Configuration lives only in the current app session. No snapshot or ticket data is stored. Use Copy or Export when you need to move the current configuration into an LLM or working document.'))));
  }

  function SectionView(props){
    var items=arr(props.items), q=(props.search||'').toLowerCase();
    var filtered=q?items.filter(function(x){try{return JSON.stringify(x).toLowerCase().indexOf(q)>=0;}catch(e){return false;}}):items;
    return h('div',{className:'panel'},
      h('div',{className:'panel-head'},
        h('div',null,h('div',{className:'panel-title'},props.label+' ('+items.length+')'),props.error?h('div',{className:'help',style:{color:'#b4232f'}},props.error):null),
        h('div',{className:'button-row'},
          h('input',{className:'search section-search',placeholder:'Search this section…',value:props.search||'',onChange:function(e){props.onSearch(e.target.value);}}),
          h('button',{className:'btn',onClick:props.onRefresh,disabled:props.busy},'Refresh'),
          h('button',{className:'btn',onClick:function(){props.onCopy('md');}},'Copy Markdown / AI'),
          h('button',{className:'btn',onClick:function(){props.onCopy('json');}},'Copy JSON'),
          h('button',{className:'btn',onClick:function(){props.onExport('csv');}},'CSV'),
          h('button',{className:'btn',onClick:function(){props.onExport('json');}},'JSON'))),
      h('div',{className:'panel-body'},
        filtered.length===0?h('div',{className:'empty'},h('h3',null,'No configuration records'),h('div',null,q?'Nothing matches this search.':'Zendesk returned no records for this area.')):
        h('div',null,filtered.slice(0,500).map(function(item,idx){
          var clean=sanitize(item||{});
          return h('details',{className:'record',key:(item.id||item.key||idx)},
            h('summary',{className:'record-summary'},h('span',{className:'record-title'},objectName(item)),h('span',{className:'record-meta'},item.id?'ID '+item.id:'Record '+(idx+1))),
            h('div',{className:'kv'},Object.keys(clean).map(function(key){
              return [h('div',{className:'kv-key',key:key+'k'},key),h('pre',{className:'kv-val record-value',key:key+'v'},readableValue(clean[key]))];
            }))
          );
        }),filtered.length>500?h('div',{className:'notice warning'},'Showing first 500 matching records. Export JSON for the complete section.'):null)));
  }

  function SetupView(props){
    return h('div',{className:'panel'},
      h('div',{className:'panel-head'},h('div',{className:'panel-title'},'Setup / Repair'),h('button',{className:'btn primary',onClick:props.onRepair,disabled:props.busy},props.busy?'Checking…':'Run Setup / Repair')),
      h('div',{className:'panel-body'},
        h('div',{className:'notice'},'Normal installs provision the app-owned connection and temporary job objects from requirements.json. Repair also registers the Zendesk-hosted ZIS integration and refreshes its bundle. It is idempotent and never deletes connection data.'),
        h('div',{className:'setup-list'},(props.checks||[]).map(function(x){return h('div',{className:'setup-row',key:x.label},h('span',null,x.label),h('strong',{className:x.ok?'setup-ok':'setup-bad'},x.ok?'OK':x.detail||'Missing'));})),
        props.lastResult?h('div',{className:props.lastResult.ok?'notice success':'notice error',style:{marginTop:'14px'}},props.lastResult.message):null));
  }

  function HealthSummary(props){
    var report=props.report,op=report&&report.operational||{},score=report&&report.scorecard||{},coverage=op.dataCoverage||{},agents=op.agents||{},admin=report&&report.adminSignals||{},metrics=healthMetricsRows(report);
    var risks=[
      ['Unsolved',op.counts&&op.counts.unsolved],
      ['Stale unsolved >7d',op.counts&&op.counts.staleUnsolved],
      ['Stale pending >7d',op.counts&&op.counts.stalePending],
      ['Negative CSAT',op.counts&&op.counts.negativeCsat],
      ['Suspended',op.counts&&op.counts.suspended]
    ];
    return h('div',null,
      arr(report.limitations).length?h('div',{className:'notice error support-diagnostic'},h('strong',null,'This report contains '+report.limitations.length+' data limitation'+(report.limitations.length===1?'':'s')+'.'),h('div',null,'Incomplete sources are listed in every export. Contact Farhaan / CX Experts Support at support@cxexperts.co.za and include the reference shown.'),h('ul',null,arr(report.limitations).map(function(item,index){return h('li',{key:index},item);}))) : null,
      h('div',{className:'stats health-stats'},
        h('div',{className:'stat'},h('div',{className:'stat-value'},score.achievedPoints==null?'—':score.achievedPoints+'/'+score.assessedPoints),h('div',{className:'stat-label'},'Verified score · '+percentText(score.scoreWithinAssessed))),
        h('div',{className:'stat'},h('div',{className:'stat-value'},percentText(score.automationCoveragePercent)),h('div',{className:'stat-label'},'Scorecard coverage')),
        h('div',{className:'stat'},h('div',{className:'stat-value'},coverage.exactVolumeTickets==null?'—':coverage.exactVolumeTickets),h('div',{className:'stat-label'},'Exact Email/Web + Messaging volume')),
        h('div',{className:'stat'},h('div',{className:'stat-value'},score.manualQuestionCount==null?'—':score.manualQuestionCount),h('div',{className:'stat-label'},'Questions needing review'))),
      coverage.sampled?h('div',{className:'notice warning'},
        h('strong',null,'API sample - Explore validation required.'),
        h('div',null,coverage.samplingDescription||'Duration and satisfaction metrics use a bounded Zendesk API sample. Exact monthly channel volumes use Search Count.'),
        h('div',null,'Zendesk Explore is the authoritative full-population reporting surface for reply time, resolution time, requester wait, satisfaction and rated ratio. This single-ZIP app cannot read Explore query results through a documented public endpoint, and API results can differ from Explore because of calculation rules, date filters, processing and refresh timing. Validate these KPIs in the Support and Messaging Explore datasets before final client use.')):null,
      h('div',{className:'panel'},h('div',{className:'panel-head'},h('div',null,h('div',{className:'panel-title'},'Operational metrics by channel'),h('div',{className:'help'},'Rolling '+report.periodMonths+' months. Ticket volume is exact where Search Count is available; duration and satisfaction metrics are calendar-time medians from the labelled API sample and are not represented as full-population Explore results.'))),
        h('div',{className:'panel-body table-wrap'},h('table',{className:'health-table'},h('thead',null,h('tr',null,h('th',null,'Metric'),h('th',null,'Email / Web Form'),h('th',null,'Messaging'))),h('tbody',null,metrics.map(function(row,index){
          var detailEmail=index===1?metricDetail(op.byChannel.email_web.firstReplyCalendar):index===2?metricDetail(op.byChannel.email_web.fullResolutionCalendar):index===3?metricDetail(op.byChannel.email_web.requesterWaitCalendar):'';
          var detailMessaging=index===1?metricDetail(op.byChannel.messaging.firstReplyCalendar):index===2?metricDetail(op.byChannel.messaging.fullResolutionCalendar):index===3?metricDetail(op.byChannel.messaging.requesterWaitCalendar):'';
          return h('tr',{key:row[0]},h('td',null,row[0]),h('td',{title:detailEmail},row[1]),h('td',{title:detailMessaging},row[2]));
        }))))),
      h('div',{className:'panel'},h('div',{className:'panel-head'},h('div',{className:'panel-title'},'Queue and experience risks')),
        h('div',{className:'panel-body'},h('div',{className:'risk-grid'},risks.map(function(item){return h('div',{className:'risk-card',key:item[0]},h('div',{className:'risk-value'},item[1]==null?'—':item[1]),h('div',{className:'risk-label'},item[0]));})),
          h('div',{className:'help',style:{marginTop:'12px'}},'Stale means no update for more than seven days. Counts come from Zendesk Search Count, so they are not limited by the 1,000-result Search API cap.'))),
      h('div',{className:'panel'},h('div',{className:'panel-head'},h('div',{className:'panel-title'},'Agent and licence signals')),
        h('div',{className:'panel-body'},h('div',{className:'risk-grid'},[
          ['Active agents',agents.active],['Light agents',agents.lightAgents],['With signatures',agents.withSignature]
        ].map(function(item){return h('div',{className:'risk-card',key:item[0]},h('div',{className:'risk-value'},item[1]==null?'—':item[1]),h('div',{className:'risk-label'},item[0]));})),
        arr(agents.licenceBreakdown).length?h('div',{className:'role-table-block'},h('h3',null,'Active seats by licence type'),h('div',{className:'help'},'Use these active-user counts for licence-based commercial pricing; this report does not apply a rate.'),h('div',{className:'table-wrap'},h('table',{className:'health-table compact'},h('thead',null,h('tr',null,h('th',null,'Licence type'),h('th',null,'Active users'))),h('tbody',null,arr(agents.licenceBreakdown).map(function(row){return h('tr',{key:row.licenceType},h('td',null,row.licenceType),h('td',null,row.count));}))))):null,
        arr(agents.roleBreakdown).length?h('div',{className:'role-table-block'},h('h3',null,'Active people by Zendesk role'),h('div',{className:'table-wrap'},h('table',{className:'health-table compact'},h('thead',null,h('tr',null,h('th',null,'Role / custom role'),h('th',null,'Licence type'),h('th',null,'Active users'))),h('tbody',null,arr(agents.roleBreakdown).map(function(row){return h('tr',{key:row.role+'|'+row.licenceType},h('td',null,row.role),h('td',null,row.licenceType),h('td',null,row.count));}))))):null)),
      arr(admin.topMacros).length?h('div',{className:'panel'},h('div',{className:'panel-head'},h('div',null,h('div',{className:'panel-title'},'Top macros by 30-day usage'),h('div',{className:'help'},'Use this list to prioritise the weekly macro quality review.'))),
        h('div',{className:'panel-body table-wrap'},h('table',{className:'health-table compact'},h('thead',null,h('tr',null,h('th',null,'Macro'),h('th',null,'Usage (30d)'),h('th',null,'Status'))),h('tbody',null,arr(admin.topMacros).map(function(macro){return h('tr',{key:macro.id||macro.title},h('td',null,macro.title),h('td',null,macro.usage30d),h('td',null,macro.active?'Active':'Inactive'));}))))):null,
      h('div',{className:'panel'},h('div',{className:'panel-head'},h('div',null,h('div',{className:'panel-title'},'Monthly volume'),h('div',{className:'help'},'Exact Search Count results for tickets created through Email/Web Form and Zendesk native Messaging.'))),
        h('div',{className:'panel-body table-wrap'},h('table',{className:'health-table compact'},h('thead',null,h('tr',null,h('th',null,'Month'),h('th',null,'Email/Web'),h('th',null,'Messaging'))),h('tbody',null,arr(op.months).map(function(month){var row=op.monthly[month]||{};return h('tr',{key:month},h('td',null,month),h('td',null,row.email_web==null?'Not available':row.email_web),h('td',null,row.messaging==null?'Not available':row.messaging));}))))),
      h(HealthBreakdowns,{operational:op}));
  }

  function HealthBreakdowns(props){
    var op=props.operational||{};
    function table(title,rows){return h('details',{className:'record health-breakdown'},h('summary',{className:'record-summary'},h('span',{className:'record-title'},title),h('span',{className:'record-meta'},arr(rows).length+' rows')),h('div',{className:'table-wrap'},h('table',{className:'health-table compact'},h('thead',null,h('tr',null,h('th',null,'Name'),h('th',null,'Created'),h('th',null,'Solved'),h('th',null,'FRT median'),h('th',null,'One-touch'),h('th',null,'CSAT'))),h('tbody',null,arr(rows).slice(0,100).map(function(row){return h('tr',{key:row.id},h('td',null,row.name),h('td',null,row.ticketsCreated),h('td',null,row.solvedTickets),h('td',null,metricValue(row.firstReplyCalendar)),h('td',null,row.oneTouchTickets),h('td',null,percentText(row.satisfactionPercent)));})))));}
    return h('div',{className:'panel'},h('div',{className:'panel-head'},h('div',null,h('div',{className:'panel-title'},'Operational breakdowns'),h('div',{className:'help'},'Brand, group and agent breakdowns describe the bounded metric sample, not the full ticket population.'))),h('div',{className:'panel-body'},table('By brand (sample)',op.byBrand),table('By group (sample)',op.byGroup),table('By agent (sample)',op.byAgent)));
  }

  function HealthScorecard(props){
    var score=props.report&&props.report.scorecard||{};
    return h('div',null,
      h('div',{className:'stats health-stats'},arr(score.byCategory).map(function(item){return h('div',{className:'stat',key:item.name},h('div',{className:'stat-value'},item.score+'/'+item.outOf),h('div',{className:'stat-label'},item.name+' · '+percentText(item.percentOfTotal)));})),
      h('div',{className:'panel'},h('div',{className:'panel-head'},h('div',null,h('div',{className:'panel-title'},'258-point capability scorecard'),h('div',{className:'help'},'Detected answers include API evidence. Use an override only after a consultant verifies a manual/process question.')),
        h('button',{className:'btn primary',onClick:props.onSave,disabled:props.busy},props.busy?'Saving…':'Save manual answers')),
        h('div',{className:'panel-body table-wrap'},
          h('table',{className:'health-table scorecard-table'},
            h('thead',null,h('tr',null,h('th',null,'Question'),h('th',null,'Answer'),h('th',null,'Weight'),h('th',null,'Phase / category'),h('th',null,'Evidence'))),
            h('tbody',null,arr(score.rows).map(function(row){
              return h('tr',{key:row.id,className:'score-'+row.status},
                h('td',null,h('div',{className:'score-question'},row.item),h('div',{className:'help'},row.benefit)),
                h('td',null,h('select',{value:props.overrides[row.id]||'',onChange:function(event){props.onOverride(row.id,event.target.value);}},h('option',{value:''},'Auto: '+scoreStatusLabel(row.detectedStatus)),h('option',{value:'yes'},'Yes'),h('option',{value:'no'},'No'),h('option',{value:'na'},'N/A'))),
                h('td',null,row.weight),
                h('td',null,h('div',null,row.phase),h('div',{className:'help'},row.category+(row.plan&&row.plan!=='No'?' · '+row.plan:''))),
                h('td',null,h('span',{className:'score-pill '+row.status},scoreStatusLabel(row.status)),h('div',{className:'help',style:{marginTop:'6px'}},row.evidence),h('div',{className:'source-note'},'Source: '+(row.source||'Manual verification')))
              );
            }))
          )
        )
      )
    );
  }

  function HealthView(props){
    if(!props.report)return h('div',{className:'panel'},h('div',{className:'panel-body empty'},props.progress?h('div',null,h('span',{className:'spinner'}),props.progress):h('div',null,h('h3',null,'No health report in this session'),h('div',null,'Run a Health Report to calculate operational metrics and the capability scorecard from the connected Zendesk instance.'))));
    return h('div',null,
      props.progress?h('div',{className:'notice'},h('span',{className:'spinner'}),props.progress):null,
      h('div',{className:'subtabs'},h('button',{className:'tab'+(props.section==='summary'?' active':''),onClick:function(){props.onSection('summary');}},'Operational report'),h('button',{className:'tab'+(props.section==='scorecard'?' active':''),onClick:function(){props.onSection('scorecard');}},'Capability scorecard')),
      props.section==='scorecard'?h(HealthScorecard,{report:props.report,overrides:props.overrides,onOverride:props.onOverride,onSave:props.onSave,busy:props.busy}):h(HealthSummary,{report:props.report}));
  }

  function ReportDownloadCenter(props){
    var reports=[
      {key:'operational',number:'1',title:'Operational Health Report',description:'Channel performance, queue risks, monthly volume, workforce signals and operational breakdowns.'},
      {key:'scorecard',number:'2',title:'Capability Scorecard',description:'The full 258-point assessment, detected answers, manual decisions, evidence and maturity breakdowns.'},
      {key:'combined',number:'3',title:'Combined Executive Report',description:'One complete document combining operational health with the detailed capability scorecard.'}
    ];
    return h('section',{className:'download-center','aria-label':'Report downloads'},
      h('div',{className:'download-center-head'},h('div',null,h('h2',null,'Download report pack'),h('p',null,'Each report is available as a styled PDF for sharing and a CSV for analysis.')),h('span',{className:'badge'},props.generatedAt?'Ready · '+humanTime(props.generatedAt):'Run a report first')),
      h('div',{className:'report-download-grid'},reports.map(function(report){return h('article',{className:'report-download-card',key:report.key},
        h('div',{className:'report-number'},report.number),
        h('div',{className:'report-card-copy'},h('h3',null,report.title),h('p',null,report.description)),
        h('div',{className:'report-format-actions'},h('button',{className:'btn primary',disabled:!props.ready,onClick:function(){props.onExport(report.key,'pdf');}},'Download PDF'),h('button',{className:'btn',disabled:!props.ready,onClick:function(){props.onExport(report.key,'csv');}},'Download CSV'))
      );})),
      h('div',{className:'report-utility-row'},h('button',{className:'btn ghost',disabled:!props.ready,onClick:props.onCopy},'Copy for AI'),h('button',{className:'btn ghost',disabled:!props.ready,onClick:function(){props.onExport('combined','json');}},'Download source JSON'),h('span',{className:'help'},'PDFs contain summary data and report evidence only; no ticket subjects, comments or requester data are included.')));
  }

  function ConnectionModal(props){
    var c=props.connection&&props.connection.custom_object_fields||{};
    var isReplace=!!props.connection;
    var isOauth=props.form.authType==='oauth';
    return h(Modal,{title:(isReplace?'Replace':'Connect')+' Zendesk credential',onClose:props.onClose,footer:[h('button',{className:'btn',key:'cancel',onClick:props.onClose},'Cancel'),h('button',{className:'btn primary',key:'save',onClick:props.onSubmit,disabled:props.busy},props.busy?'Testing…':'Test & '+(isReplace?'Replace':'Connect'))]},
      h('div',{className:'notice success'},'Zendesk stores the credential in its ZIS Connection Service and redacts it after submission. This app stores only the connection name and authentication type. No external relay or vault passphrase is used.'),
      h('div',{className:'grid'},
        h('div',{className:'field',style:{gridColumn:'1 / -1'}},h('label',{htmlFor:'connection-auth'},'Authentication method'),h('select',{id:'connection-auth',value:props.form.authType,onChange:function(e){props.set('authType',e.target.value);}},h('option',{value:'api_token'},'Zendesk API token'),h('option',{value:'oauth'},'Zendesk OAuth access token')),h('div',{className:'help'},isOauth?'Use an OAuth access token issued by the client Zendesk account. ZIS sends it as an Authorization Bearer header.':'Use the established API email and token method. ZIS sends them with Zendesk token-based Basic authentication.')),
        h('div',{className:'field'},h('label',{htmlFor:'connection-domain'},'Zendesk domain'),h('input',{id:'connection-domain',value:props.form.domain,onChange:function(e){props.set('domain',e.target.value);},placeholder:'client.zendesk.com'})),
        !isOauth?h('div',{className:'field'},h('label',{htmlFor:'connection-email'},'Zendesk API email'),h('input',{id:'connection-email',type:'email',value:props.form.email,onChange:function(e){props.set('email',e.target.value);},placeholder:'admin@example.com'})):h('div',{className:'field'},h('label',null,'OAuth identity'),h('div',{className:'readonly-field'},'The authenticated Zendesk user is detected during the connection test.')),
        h('div',{className:'field',style:{gridColumn:'1 / -1'}},h('label',{htmlFor:'connection-token'},isOauth?'Zendesk OAuth access token':'Zendesk API token'),h('input',{id:'connection-token',type:'password',value:props.form.token,onChange:function(e){props.set('token',e.target.value);},autoComplete:'new-password',placeholder:isOauth?'Paste Zendesk OAuth access token':'Paste Zendesk API token'}),h('div',{className:'help'},'Zendesk ZIS tests the credential against /api/v2/users/me.json before the saved connection is replaced.'))));
  }

  class App extends React.Component {
    constructor(props){
      super(props);
      this.state={clients:[],connections:{},selected:null,filter:'',loading:true,busy:false,error:'',toast:'',tab:'overview',sectionSearch:'',syncData:{},syncErrors:{},progress:'',modal:null,connectionForm:{authType:'api_token',domain:'',email:'',token:''},checks:[],setupResult:null,currentUser:null,healthReport:null,healthContext:null,healthSection:'summary',healthProgress:'',manualAnswers:{}};
      this.load=this.load.bind(this); this.selectClient=this.selectClient.bind(this); this.syncAll=this.syncAll.bind(this); this.syncSection=this.syncSection.bind(this); this.runRepair=this.runRepair.bind(this);this.runHealthReport=this.runHealthReport.bind(this);this.saveHealthAnswers=this.saveHealthAnswers.bind(this);
    }
    componentDidMount(){ this.load(); }
    notify(msg){ var self=this; this.setState({toast:msg}); if(ZAF) try{ZAF.invoke('notify',msg);}catch(ignore){} setTimeout(function(){if(self.state.toast===msg)self.setState({toast:''});},3200); }
    async load(){
      this.setState({loading:true,error:''});
      try{
        var user=null; try{var ud=await ZAF.get('currentUser'); user=ud.currentUser;}catch(ignore){}
        var results=await Promise.all([listCustomRecords(CLIENT_OBJECT),listCustomRecords(CONNECTION_OBJECT).catch(function(){return [];})]);
        var clients=results[0].sort(function(a,b){return safeString(a.name).localeCompare(safeString(b.name));}), conns={};
        results[1].forEach(function(r){var id=r.custom_object_fields&&r.custom_object_fields.cxe_client;if(id)conns[id]=r;});
        var selected=this.state.selected||(clients[0]&&clients[0].id),selectedFields=conns[selected]&&conns[selected].custom_object_fields||{};
        this.setState({clients:clients,connections:conns,selected:selected,loading:false,currentUser:user,manualAnswers:parseHealthOverrides(selectedFields.cxe_health_overrides)});
        this.verifySchema();
      }catch(e){ this.setState({loading:false,error:e.message||String(e)}); }
    }
    async verifySchema(){
      var checks=[];
      try{await zafRequest('/api/v2/custom_objects/'+CLIENT_OBJECT,'GET');checks.push({label:'Existing client object',ok:true});}catch(e){checks.push({label:'Existing client object',ok:false,detail:'Missing'});}
      try{
        await zafRequest('/api/v2/custom_objects/'+CONNECTION_OBJECT,'GET'); checks.push({label:'CXE connection object',ok:true});
        var fd=await zafRequest('/api/v2/custom_objects/'+CONNECTION_OBJECT+'/fields','GET'); var found={}; arr(fd.custom_object_fields).forEach(function(x){found[x.key]=x;});
        REQUIRED_FIELDS.forEach(function(x){
          var actual=found[x.key], expected=expectedFieldType(x), received=expectedFieldType(actual), ok=!!actual && received===expected;
          checks.push({label:'Field '+x.key,ok:ok,detail:actual?'Expected '+expected+', found '+received:'Missing'});
        });
      }catch(e){ checks.push({label:'CXE connection object',ok:false,detail:'Missing'}); }
      try{
        await zafRequest('/api/v2/custom_objects/'+JOB_OBJECT,'GET');checks.push({label:'CXE temporary sync job object',ok:true});
        var jd=await zafRequest('/api/v2/custom_objects/'+JOB_OBJECT+'/fields','GET'), jobFound={};arr(jd.custom_object_fields).forEach(function(x){jobFound[x.key]=x;});
        REQUIRED_JOB_FIELDS.forEach(function(x){var actual=jobFound[x.key],ok=!!actual&&actual.type===x.type;checks.push({label:'Job field '+x.key,ok:ok,detail:actual?'Expected '+x.type+', found '+actual.type:'Missing'});});
      }catch(e){checks.push({label:'CXE temporary sync job object',ok:false,detail:'Missing'});}
      try{var hasZis=await zisIntegrationExists();checks.push({label:'Zendesk Integration Services',ok:hasZis,detail:hasZis?'':'Run Setup / Repair to register the app integration.'});}catch(e){checks.push({label:'Zendesk Integration Services',ok:false,detail:e.message||'Unavailable'});}
      this.setState({checks:checks}); return checks;
    }
    async runRepair(){
      this.setState({busy:true,setupResult:null});
      try{
        var isAdmin=this.state.currentUser && (this.state.currentUser.role==='admin' || this.state.currentUser.role==='account_owner');
        var exists=true; try{await zafRequest('/api/v2/custom_objects/'+CONNECTION_OBJECT,'GET');}catch(e){exists=false;}
        if(!exists){
          if(!isAdmin) throw new Error('The app-owned custom object is missing. An administrator must run Setup / Repair or reinstall the package so requirements.json can provision it.');
          await zafRequest('/api/v2/custom_objects','POST',{custom_object:{key:CONNECTION_OBJECT,title:'CXE Zendesk Config Connection',title_pluralized:'CXE Zendesk Config Connections',include_in_list_view:false}});
        }
        var fd=await zafRequest('/api/v2/custom_objects/'+CONNECTION_OBJECT+'/fields','GET'); var found={}; arr(fd.custom_object_fields).forEach(function(x){found[x.key]=x;});
        if(isAdmin){
          for(var i=0;i<REQUIRED_FIELDS.length;i++){
            var spec=REQUIRED_FIELDS[i]; if(found[spec.key]) continue;
            await zafRequest('/api/v2/custom_objects/'+CONNECTION_OBJECT+'/fields','POST',{custom_object_field:spec});
          }
          var authField=found.cxe_auth_type, desiredAuth=REQUIRED_FIELDS.find(function(field){return field.key==='cxe_auth_type';});
          if(authField&&desiredAuth){
            var authOptions=arr(authField.custom_field_options).map(function(option){return {name:option.name,value:option.value};}), authValues=authOptions.map(function(option){return option.value;});
            desiredAuth.custom_field_options.forEach(function(option){if(authValues.indexOf(option.value)<0)authOptions.push(option);});
            if(authOptions.length!==arr(authField.custom_field_options).length)await zafRequest('/api/v2/custom_objects/'+CONNECTION_OBJECT+'/fields/'+encodeURIComponent(authField.key||authField.id),'PATCH',{custom_object_field:{custom_field_options:authOptions}});
          }
        }
        var jobExists=true;try{await zafRequest('/api/v2/custom_objects/'+JOB_OBJECT,'GET');}catch(e){jobExists=false;}
        if(!jobExists){
          if(!isAdmin)throw new Error('The temporary sync job object is missing. An administrator must run Setup / Repair.');
          await zafRequest('/api/v2/custom_objects','POST',{custom_object:{key:JOB_OBJECT,title:'CXE Zendesk Config Sync Job',title_pluralized:'CXE Zendesk Config Sync Jobs',include_in_list_view:false}});
        }
        var jd=await zafRequest('/api/v2/custom_objects/'+JOB_OBJECT+'/fields','GET'),jobFound={};arr(jd.custom_object_fields).forEach(function(x){jobFound[x.key]=x;});
        if(isAdmin){for(var j=0;j<REQUIRED_JOB_FIELDS.length;j++){var jobSpec=REQUIRED_JOB_FIELDS[j];if(!jobFound[jobSpec.key])await zafRequest('/api/v2/custom_objects/'+JOB_OBJECT+'/fields','POST',{custom_object_field:jobSpec});}}
        await ensureZisIntegration();
        var connectionRecords=await listCustomRecords(CONNECTION_OBJECT).catch(function(){return [];});
        if(zisMappings(connectionRecords).length)await installZisBundle(connectionRecords);
        var checks=await this.verifySchema(); var bad=checks.filter(function(x){return !x.ok;});
        if(bad.length) throw new Error('Schema still has '+bad.length+' issue(s). '+(!isAdmin?'Ask an administrator to run repair.':'Review the failed fields.'));
        this.setState({setupResult:{ok:true,message:'Schema and Zendesk-hosted ZIS are healthy. Existing records were preserved and no external service is required.'}}); this.notify('Setup / Repair completed.'); await this.load();
      }catch(e){this.setState({setupResult:{ok:false,message:e.message||String(e)}});} finally{this.setState({busy:false});}
    }
    selectedClient(){return this.state.clients.find(function(c){return c.id===this.state.selected;}.bind(this));}
    selectedConnection(){return this.state.connections[this.state.selected];}
    selectClient(id){var fields=this.state.connections[id]&&this.state.connections[id].custom_object_fields||{};this.setState({selected:id,tab:'overview',sectionSearch:'',syncData:{},syncErrors:{},progress:'',healthReport:null,healthContext:null,healthProgress:'',healthSection:'summary',manualAnswers:parseHealthOverrides(fields.cxe_health_overrides)});}
    openConnect(){var conn=this.selectedConnection(), f=conn&&conn.custom_object_fields||{};this.setState({modal:'connect',connectionForm:{authType:f.cxe_auth_type==='oauth'?'oauth':'api_token',domain:f.cxe_domain||'',email:f.cxe_api_email||'',token:''}});}
    async submitConnection(){
      var clientRec=this.selectedClient(), form=this.state.connectionForm; if(!clientRec)return;
      this.setState({busy:true,error:''});
      var candidateName='', candidateType=form.authType==='oauth'?'oauth':'api_token', oldName='', oldType='api_token', connectionRecords=[];
      try{
        var domain=normalizeDomain(form.domain); if(candidateType==='api_token'&&!form.email)throw new Error('Enter the Zendesk API email.'); if(!form.token)throw new Error(candidateType==='oauth'?'Enter a Zendesk OAuth access token.':'Enter a Zendesk API token.');
        var existing=this.selectedConnection(), old=existing&&existing.custom_object_fields||{};
        oldName=safeString(old.cxe_zis_connection_name);
        oldType=old.cxe_auth_type==='oauth'?'oauth':'api_token';
        try{await zafRequest('/api/v2/custom_objects/'+JOB_OBJECT,'GET');}catch(ignore){throw new Error('Run Setup / Repair once before connecting a client.');}
        await ensureZisIntegration();
        candidateName=await createZisConnection(clientRec.id,domain,form.email,form.token,candidateType);
        connectionRecords=await listCustomRecords(CONNECTION_OBJECT).catch(function(){return [];});
        await installZisBundle(connectionRecords,{clientId:clientRec.id,connectionName:candidateName,domain:domain});
        this.setState({progress:'Zendesk ZIS is testing the '+(candidateType==='oauth'?'OAuth access token':'API token')+'…'});
        var tested=await fetchZisSpecs(clientRec.id,domain,[{key:'__test__',root:'user',url:ZIS_CORE.withPageSize(domain,'/api/v2/users/me.json'),optional:false}]);
        var testUser=tested.raw.__test__&&tested.raw.__test__.user;
        if(!testUser)throw new Error('Zendesk ZIS did not return the authenticated user.');
        var fields={cxe_client:clientRec.id,cxe_domain:domain,cxe_api_email:candidateType==='api_token'?form.email.trim():'',cxe_auth_type:candidateType,cxe_credential_envelope:'',cxe_zis_connection_name:candidateName,cxe_enabled:true,cxe_connection_status:'connected',cxe_last_test_at:nowIso(),cxe_last_sync_at:old.cxe_last_sync_at||'',cxe_last_http_status:200,cxe_last_error:'',cxe_credential_updated_at:nowIso(),cxe_auth_version:candidateType==='oauth'?OAUTH_STORAGE_VERSION:API_TOKEN_STORAGE_VERSION};
        await upsertConnection(clientRec,fields);
        if(oldName&&oldName!==candidateName)await deleteZisConnection(oldName,oldType);
        this.setState({modal:null,progress:'',connectionForm:{authType:'api_token',domain:'',email:'',token:''}}); await this.load(); this.notify('Connection tested and stored securely in Zendesk ZIS.');
      }catch(e){
        if(candidateName)try{await deleteZisConnection(candidateName,candidateType);}catch(ignore){}
        if(connectionRecords.length)try{await installZisBundle(connectionRecords);}catch(ignore){}
        this.setState({progress:'',error:e.message||String(e)});
      } finally{this.setState({busy:false});}
    }
    async getZisConnection(){
      var conn=this.selectedConnection(); if(!conn)throw new Error('Connect this client first.'); var f=conn.custom_object_fields||{};
      if(f.cxe_enabled===false || f.cxe_enabled==='false')throw new Error('This connection is disabled.');
      if(!f.cxe_zis_connection_name)throw new Error('This connection uses an older credential format. Replace the credential once to move it into Zendesk ZIS.');
      return {clientId:this.state.selected,domain:normalizeDomain(f.cxe_domain),email:f.cxe_api_email,authType:f.cxe_auth_type==='oauth'?'oauth':'api_token',connectionName:f.cxe_zis_connection_name};
    }
    async updateConnectionFields(patch){
      var clientRec=this.selectedClient(), conn=this.selectedConnection(); if(!clientRec||!conn)return; var f=Object.assign({},conn.custom_object_fields||{},patch); await upsertConnection(clientRec,f); await this.load();
    }
    async toggleEnabled(){
      var conn=this.selectedConnection(); if(!conn)return; var f=conn.custom_object_fields||{}, enabled=!(f.cxe_enabled===false||f.cxe_enabled==='false');
      this.setState({busy:true}); try{await this.updateConnectionFields({cxe_enabled:!enabled,cxe_connection_status:!enabled?'connected':'disabled'});this.notify(!enabled?'Connection enabled.':'Connection disabled.');}catch(e){this.setState({error:e.message});}finally{this.setState({busy:false});}
    }
    async removeConnection(){
      var clientRec=this.selectedClient(); if(!clientRec)return; if(!confirm('Remove the saved connection for '+clientRec.name+'? The Client record is not deleted.'))return;
      var conn=this.selectedConnection(),fields=conn&&conn.custom_object_fields||{},name=fields.cxe_zis_connection_name,authType=fields.cxe_auth_type==='oauth'?'oauth':'api_token';
      this.setState({busy:true}); try{await deleteConnection(clientRec);var remaining=await listCustomRecords(CONNECTION_OBJECT).catch(function(){return [];});if(zisMappings(remaining).length)await installZisBundle(remaining);await deleteZisConnection(name,authType);this.setState({syncData:{}});await this.load();this.notify('Connection and its Zendesk ZIS credential were removed.');}catch(e){this.setState({error:e.message});}finally{this.setState({busy:false});}
    }
    async testConnection(){
      var conn=this.selectedConnection(); if(!conn)return; this.setState({busy:true,error:''});
      try{var connection=await this.getZisConnection();this.setState({progress:'Zendesk ZIS is testing the connection…'});var tested=await fetchZisSpecs(connection.clientId,connection.domain,[{key:'__test__',root:'user',url:ZIS_CORE.withPageSize(connection.domain,'/api/v2/users/me.json'),optional:false}]);if(!(tested.raw.__test__&&tested.raw.__test__.user))throw new Error('Zendesk ZIS did not return the authenticated user.');await this.updateConnectionFields({cxe_connection_status:'connected',cxe_last_test_at:nowIso(),cxe_last_http_status:200,cxe_last_error:''});this.notify('Connection test successful.');}
      catch(e){try{await this.updateConnectionFields(Object.assign({cxe_last_test_at:nowIso()},connectionFailure(e)));}catch(ignore){} this.setState({error:e.message});}
      finally{this.setState({busy:false,progress:''});}
    }
    async syncAll(){
      var conn=this.selectedConnection(), clientRec=this.selectedClient(); if(!conn||!clientRec)return; this.setState({busy:true,error:'',syncErrors:{},progress:'Preparing sync…'});
      try{
        var self=this,connection=await this.getZisConnection(), sectionKeys=SOURCE_DEFS.concat(GENERATED_DEFS).map(function(d){return d.key;}), result=await fetchConfiguration(connection.clientId,connection.domain,sectionKeys,function(message){self.setState({progress:message});}), data=result.data||{}, errors=result.errors||{};
        var errorKeys=Object.keys(errors), summary=errorKeys.length?errorKeys.length+' section(s) could not be read: '+errorKeys.join(', '):'';
        await this.updateConnectionFields({cxe_connection_status:'connected',cxe_last_sync_at:result.syncedAt||nowIso(),cxe_last_test_at:nowIso(),cxe_last_http_status:200,cxe_last_error:summary});
        this.setState({syncData:data,syncErrors:errors,progress:'',tab:'overview'}); this.notify('Configuration sync completed.');
      }catch(e){try{await this.updateConnectionFields(connectionFailure(e));}catch(ignore){}this.setState({progress:'',error:e.message||String(e)});} finally{this.setState({busy:false});}
    }
    async syncSection(key){
      var d=sectionDef(key); if(!d)return; var conn=this.selectedConnection(); this.setState({busy:true,error:'',progress:'Syncing '+d.label+'…'});
      try{
        var self=this,connection=await this.getZisConnection(), result=await fetchConfiguration(connection.clientId,connection.domain,[key],function(message){self.setState({progress:message});}), items=result.data&&result.data[key]||[], data=Object.assign({},this.state.syncData);
        data[key]=items;var errs=Object.assign({},this.state.syncErrors);delete errs[key];this.setState({syncData:data,syncErrors:errs,progress:''});
        await this.updateConnectionFields({cxe_connection_status:'connected',cxe_last_sync_at:nowIso(),cxe_last_http_status:200,cxe_last_error:''});this.notify(d.label+' refreshed.');
      }
      catch(e){try{await this.updateConnectionFields(connectionFailure(e));}catch(ignore){}var er=Object.assign({},this.state.syncErrors);er[key]=e.message;this.setState({syncErrors:er,progress:'',error:e.message});} finally{this.setState({busy:false});}
    }
    async runHealthReport(){
      var conn=this.selectedConnection(),clientRec=this.selectedClient();if(!conn||!clientRec)return;
      this.setState({busy:true,error:'',healthProgress:'Preparing the Zendesk health report…',healthSection:'summary'});
      try{
        if(!HEALTH)throw new Error('The health-report runtime was not loaded.');
        var self=this,connection=await this.getZisConnection(),keys=SOURCE_DEFS.concat(GENERATED_DEFS).map(function(def){return def.key;});
        var configResult=await fetchConfiguration(connection.clientId,connection.domain,keys,function(message){self.setState({healthProgress:message});});
        var sources=await fetchHealthSources(connection,function(message){self.setState({healthProgress:message});}),config=configResult.data||{};
        if(sources.macros.length)config.macros=sources.macros;
        var agentUsage=summarizeAgentUsage(config.agents,sources.customRoles),limitations=Object.keys(configResult.errors||{}).concat(Object.keys(sources.errors||{})).map(function(key){return key+': '+safeString((configResult.errors||{})[key]||(sources.errors||{})[key]);});
        var input={months:12,tickets:sources.tickets,metricSets:sources.metricSets,monthlyCounts:sources.monthlyCounts,sampled:sources.sampled,truncated:sources.truncated,samplingDescription:sources.samplingDescription,groups:config.groups,agents:config.agents,brands:config.brands,counts:sources.counts,agentUsage:agentUsage,config:config,accountSettings:sources.accountSettings,securitySettings:sources.securitySettings,guideThemes:sources.guideThemes,customRoles:sources.customRoles,appInstallations:sources.appInstallations,manualAnswers:this.state.manualAnswers,limitations:limitations};
        var report=HEALTH.buildReport(input),extra={guideThemes:sources.guideThemes,customRoles:sources.customRoles,appInstallations:sources.appInstallations,securitySettings:sources.securitySettings,agentUsage:agentUsage,channelEvidence:HEALTH.channelEvidence(sources.tickets)};
        var context={config:config,operational:report.operational,accountSettings:sources.accountSettings,extra:extra};
        await this.updateConnectionFields({cxe_connection_status:'connected',cxe_last_health_at:report.generatedAt,cxe_last_sync_at:configResult.syncedAt||nowIso(),cxe_health_window_months:12,cxe_last_test_at:nowIso(),cxe_last_http_status:200,cxe_last_error:limitations.join('; ').slice(0,1500)});
        this.setState({syncData:config,syncErrors:configResult.errors||{},healthReport:report,healthContext:context,healthProgress:'',tab:'health'});this.notify('Health report completed.');
      }catch(e){try{await this.updateConnectionFields(connectionFailure(e));}catch(ignore){}this.setState({healthProgress:'',error:displayError(e,'The Zendesk health report could not be completed.')});}finally{this.setState({busy:false});}
    }
    setHealthOverride(id,value){
      var answers=Object.assign({},this.state.manualAnswers);if(value)answers[id]=value;else delete answers[id];
      var report=this.state.healthReport;if(report&&this.state.healthContext){report=Object.assign({},report,{scorecard:HEALTH.scorecardAssessment(this.state.healthContext,answers)});}
      this.setState({manualAnswers:answers,healthReport:report});
    }
    async saveHealthAnswers(){
      this.setState({busy:true,error:''});
      try{await this.updateConnectionFields({cxe_health_overrides:JSON.stringify(this.state.manualAnswers)});this.notify('Manual scorecard answers saved.');}
      catch(e){this.setState({error:e.message||String(e)});}finally{this.setState({busy:false});}
    }
    async copyHealth(){var client=this.selectedClient(),report=this.state.healthReport;if(!client||!report)return;await copyText(healthReportMarkdown(client.name,report));this.notify('Health report copied for AI.');}
    exportHealth(kind,format){
      var client=this.selectedClient(),report=this.state.healthReport;if(!client||!report)return;
      if(format==='pdf'){REPORTS.savePdf(client.name,report,kind);this.notify('PDF downloaded.');return;}
      if(format==='csv'){
        var csvText=kind==='operational'?REPORTS.operationalCsv(client.name,report):kind==='scorecard'?REPORTS.scorecardCsv(client.name,report):REPORTS.combinedCsv(client.name,report);
        downloadText(REPORTS.filename(client.name,kind==='combined'?'combined-executive':kind,'csv'),csvText,'text/csv;charset=utf-8');this.notify('CSV downloaded.');return;
      }
      downloadText(REPORTS.filename(client.name,'combined-source','json'),JSON.stringify(sanitize(report),null,2),'application/json');this.notify('Source JSON downloaded.');
    }
    async copySection(kind){
      var clientRec=this.selectedClient(), key=this.state.tab, d=sectionDef(key); if(!d)return; var items=this.state.syncData[key]||[];
      var text=kind==='json'?JSON.stringify(sanitize(items),null,2):markdownForSection(clientRec.name,d.label,items); await copyText(text);this.notify(kind==='json'?'JSON copied.':'LLM-friendly Markdown copied.');
    }
    exportSection(kind){
      var clientRec=this.selectedClient(), key=this.state.tab, d=sectionDef(key); if(!d)return;var items=this.state.syncData[key]||[],base=clientRec.name.toLowerCase().replace(/[^a-z0-9]+/g,'-')+'-'+key;
      if(kind==='csv')downloadText(base+'.csv',sectionToCsv(items),'text/csv;charset=utf-8');else downloadText(base+'.json',JSON.stringify(sanitize(items),null,2),'application/json');
    }
    async copyWhole(){var c=this.selectedClient(); if(!c)return; var clean={capturedAt:nowIso(),configuration:sanitize(this.state.syncData),diagnostics:sanitize(this.state.syncErrors)};await copyText('# Zendesk Configuration\n\nClient: '+c.name+'\nCaptured: '+clean.capturedAt+'\n\n```json\n'+JSON.stringify(clean,null,2)+'\n```');this.notify('Whole configuration copied for AI.');}
    exportWhole(){var c=this.selectedClient();if(!c)return;downloadText(c.name.toLowerCase().replace(/[^a-z0-9]+/g,'-')+'-zendesk-config.json',JSON.stringify({capturedAt:nowIso(),configuration:sanitize(this.state.syncData),diagnostics:sanitize(this.state.syncErrors)},null,2),'application/json');}
    render(){
      var self=this, s=this.state, clients=s.clients.filter(function(c){return safeString(c.name).toLowerCase().indexOf(s.filter.toLowerCase())>=0;}), selected=this.selectedClient(), conn=this.selectedConnection(), cf=conn&&conn.custom_object_fields||{}, si=statusInfo(conn);
      var configDefs=SOURCE_DEFS.concat(GENERATED_DEFS), allTabs=[{key:'overview',label:'Config overview'},{key:'health',label:'Health Reports'}].concat(configDefs.map(function(d){return {key:d.key,label:d.label};}));
      allTabs.push({key:'setup',label:'Setup / Repair'});
      var currentDef=sectionDef(s.tab);
      return h('div',{className:'shell'},
        h('header',{className:'topbar'},h('div',{className:'brand'},h('div',{className:'brand-mark'},'CX'),h('div',null,h('div',{className:'brand-title'},'Zendesk Success Management'),h('div',{className:'brand-sub'},'CX Experts · configuration sync and health reports'))),h('div',{className:'top-actions'},h('span',{className:'badge muted'},s.currentUser?s.currentUser.name:'Zendesk session'),h('button',{className:'btn',onClick:function(){self.setState({tab:'setup'});}},'Setup / Repair'),h('button',{className:'btn',onClick:function(){self.load();}},'Reload clients'))),
        h('div',{className:'content'},
          h(ClientList,{clients:clients,connections:s.connections,selected:s.selected,filter:s.filter,onFilter:function(v){self.setState({filter:v});},onSelect:this.selectClient}),
          h('main',{className:'main'},
            s.loading?h('div',{className:'empty'},h('span',{className:'spinner'}),'Loading Zendesk clients…'):
            s.error&&!selected?h('div',{className:'notice error'},s.error):
            !selected?h('div',{className:'empty'},h('h3',null,'No client selected'),h('div',null,'Select a Client record from the left.')):
            h('div',null,
              h('div',{className:'page-head'},h('div',null,h('h1',{className:'page-title'},selected.name),h('div',{className:'page-meta'},h('span',{className:'status-dot '+si.color}), ' '+si.label+(cf.cxe_domain?' · '+cf.cxe_domain:'')+(cf.cxe_last_sync_at?' · Last sync '+humanTime(cf.cxe_last_sync_at):''))),
                h('div',{className:'button-row'},
                  !conn?h('button',{className:'btn primary',onClick:function(){self.openConnect();}},'Connect Zendesk'):null,
                  conn?h('button',{className:'btn primary',onClick:this.runHealthReport,disabled:s.busy||cf.cxe_enabled===false||cf.cxe_enabled==='false'},s.busy?h('span',null,h('span',{className:'spinner'}),'Working…'):'Run Health Report'):null,
                  conn?h('button',{className:'btn',onClick:this.syncAll,disabled:s.busy||cf.cxe_enabled===false||cf.cxe_enabled==='false'},'Sync config'):null,
                  conn?h('button',{className:'btn',onClick:function(){self.testConnection();},disabled:s.busy},'Test'):null,
                  conn?h('button',{className:'btn',onClick:function(){self.openConnect();},disabled:s.busy},'Replace credential'):null,
                  conn?h('button',{className:'btn',onClick:function(){self.toggleEnabled();},disabled:s.busy},(cf.cxe_enabled===false||cf.cxe_enabled==='false')?'Enable':'Disable'):null,
                  conn?h('button',{className:'btn danger',onClick:function(){self.removeConnection();},disabled:s.busy},'Remove'):null)),
              s.error?h('div',{className:'notice error'},s.error,h('button',{className:'close',style:{float:'right'},onClick:function(){self.setState({error:''});}},'×')):null,
              conn?h('div',{className:'tabs'},allTabs.map(function(t){return h('button',{key:t.key,className:'tab'+(s.tab===t.key?' active':''),onClick:function(){self.setState({tab:t.key,sectionSearch:''});}},t.label);})):null,
              s.tab==='setup'?h(SetupView,{checks:s.checks,lastResult:s.setupResult,busy:s.busy,onRepair:this.runRepair}):
              !conn?h('div',{className:'panel'},h('div',{className:'panel-body empty'},h('h3',null,'Not connected'),h('div',null,'This Client record exists in CX Zendesk but has no Zendesk connection yet.'),h('div',{className:'footer-note'},'Connect it once with either a Zendesk API token or OAuth access token. Zendesk ZIS keeps the credential and uses it for configuration sync and read-only health reporting.'))):
              s.tab==='overview'?h('div',null,h('div',{className:'button-row',style:{marginBottom:'12px'}},h('button',{className:'btn',onClick:function(){self.copyWhole();},disabled:!Object.keys(s.syncData).length},'Copy whole config for AI'),h('button',{className:'btn',onClick:function(){self.exportWhole();},disabled:!Object.keys(s.syncData).length},'Export whole JSON')),h(Overview,{data:s.syncData,defs:configDefs,progress:s.progress,errors:s.syncErrors})):
              s.tab==='health'?h('div',null,h(ReportDownloadCenter,{ready:!!s.healthReport,generatedAt:s.healthReport&&s.healthReport.generatedAt,onCopy:function(){self.copyHealth();},onExport:function(kind,format){self.exportHealth(kind,format);}}),h(HealthView,{report:s.healthReport,progress:s.healthProgress,section:s.healthSection,onSection:function(section){self.setState({healthSection:section});},overrides:s.manualAnswers,onOverride:function(id,value){self.setHealthOverride(id,value);},onSave:this.saveHealthAnswers,busy:s.busy})):
              currentDef?h(SectionView,{label:currentDef.label,items:s.syncData[s.tab]||[],error:s.syncErrors[s.tab],search:s.sectionSearch,onSearch:function(v){self.setState({sectionSearch:v});},busy:s.busy,onRefresh:function(){self.syncSection(s.tab);},onCopy:function(k){self.copySection(k);},onExport:function(k){self.exportSection(k);}}):null
            ))),
        s.modal==='connect'?h(ConnectionModal,{connection:conn,form:s.connectionForm,busy:s.busy,onClose:function(){self.setState({modal:null,error:''});},set:function(k,v){var f=Object.assign({},s.connectionForm);f[k]=v;self.setState({connectionForm:f});},onSubmit:function(){self.submitConnection();}}):null,
        s.toast?h('div',{className:'toast'},s.toast):null);
    }
  }

  if(!window.React || !window.ReactDOM || !window.CXEZIS || !window.CXEHealth || !window.CXEReports){ document.getElementById('root').innerHTML='<div style="padding:24px;font-family:sans-serif">The app runtime could not be loaded.</div>'; return; }
  ReactDOM.createRoot(document.getElementById('root')).render(h(App));
})();
