(function () {
  'use strict';

  var integrations=[];
  var zisConnections={};
  var configs={};
  var connectionRecords=[];
  var jobRecords=[];
  var clients=[
    {id:'client-001',name:'Aquasure',external_id:'aquasure',custom_object_fields:{}},
    {id:'client-002',name:'BetterMeRX',external_id:'bettermrx',custom_object_fields:{}},
    {id:'client-003',name:'Inspire Uplift',external_id:'inspire-uplift',custom_object_fields:{}}
  ];
  var connectionFields=[
    {key:'cxe_client',type:'lookup',relationship_target_type:'zen:custom_object:client'},
    {key:'cxe_domain',type:'text'},{key:'cxe_api_email',type:'text'},{key:'cxe_auth_type',type:'dropdown'},
    {key:'cxe_credential_envelope',type:'textarea'},{key:'cxe_zis_connection_name',type:'text'},
    {key:'cxe_enabled',type:'checkbox'},{key:'cxe_connection_status',type:'dropdown'},
    {key:'cxe_last_test_at',type:'text'},{key:'cxe_last_sync_at',type:'text'},
    {key:'cxe_last_health_at',type:'text'},{key:'cxe_health_overrides',type:'textarea'},
    {key:'cxe_health_window_months',type:'integer'},
    {key:'cxe_last_http_status',type:'integer'},{key:'cxe_last_error',type:'textarea'},
    {key:'cxe_credential_updated_at',type:'text'},{key:'cxe_auth_version',type:'text'}
  ];
  var jobFields=['cxe_job_client_id','cxe_job_run_id','cxe_job_scope','cxe_job_key','cxe_job_root','cxe_job_url','cxe_job_requested_at'].map(function(key){return {key:key,type:'text'};});

  function body(options){return options.data?JSON.parse(options.data):{};}
  function parsed(url){return new URL(url,'https://pdi-cx-experts.zendesk.com');}
  function externalId(url){return parsed(url).searchParams.get('external_id');}
  function ago(days){return new Date(Date.now()-days*86400000).toISOString();}
  function resultFor(url){
    var target=parsed(url), path=target.pathname;
    if(path==='/api/v2/users/me.json')return {user:{id:1001,name:'Mock client API admin'}};
    if(path==='/api/v2/incremental/tickets/cursor.json')return {
      tickets:[
        {id:101,created_at:ago(8),status:'solved',group_id:10,assignee_id:21,brand_id:31,via:{channel:'email'},satisfaction_rating:{score:'good'}},
        {id:102,created_at:ago(25),status:'solved',group_id:10,assignee_id:22,brand_id:31,via:{channel:'web'},satisfaction_rating:{score:'bad'}},
        {id:103,created_at:ago(40),status:'solved',group_id:11,assignee_id:21,brand_id:31,via:{channel:'messaging'},from_messaging_channel:true,satisfaction_rating:{score:'unoffered'}},
        {id:104,created_at:ago(70),status:'open',group_id:11,assignee_id:null,brand_id:31,via:{channel:'api'},satisfaction_rating:{score:'unoffered'}}
      ],
      metric_sets:[
        {ticket_id:101,solved_at:ago(7),replies:1,reply_time_in_minutes:{calendar:18},full_resolution_time_in_minutes:{calendar:210},requester_wait_time_in_minutes:{calendar:160}},
        {ticket_id:102,solved_at:ago(23),replies:3,reply_time_in_minutes:{calendar:42},full_resolution_time_in_minutes:{calendar:950},requester_wait_time_in_minutes:{calendar:620}},
        {ticket_id:103,solved_at:ago(39),replies:2,reply_time_in_minutes:{calendar:1},full_resolution_time_in_minutes:{calendar:88},requester_wait_time_in_minutes:{calendar:70}}
      ],
      end_of_stream:true,
      after_cursor:'mock-final-cursor'
    };
    if(path==='/api/v2/account/settings.json')return {settings:{tickets:{agent_collision:true,maximum_personal_views_to_list:20},chat:{enabled:true},brands:{enabled:true},user:{organization_self_service:true},api:{enabled:true},lotus:{customer_satisfaction:true},billing:{subscription:{plan:{name:'Enterprise Plus'}}}}};
    if(path==='/api/v2/security_settings')return {security_settings:{agent_session_timeout:30,end_user_session_timeout:60,ip_restrictions:false}};
    if(path==='/api/v2/apps/installations.json')return {installations:[{id:501,enabled:true,app:{name:'Time Tracking'}}],next_page:null};
    if(path==='/api/v2/guide/theming/themes')return {themes:[{id:601,name:'CXE Custom Theme',live:true}],meta:{has_more:false}};
    if(path==='/api/v2/custom_roles.json')return {custom_roles:[{id:701,name:'Team lead',description:'Limited team lead role'}],next_page:null};
    if(path==='/api/v2/suspended_tickets.json')return {suspended_tickets:[{id:801,cause:'Detected as spam'}],next_page:null};
    if(path==='/api/v2/search/count.json'){
      var query=target.searchParams.get('query')||'';
      return {count:query.indexOf('satisfaction:bad')>=0?7:query.indexOf('status:pending')>=0?12:query.indexOf('updated<')>=0?19:245};
    }
    if(path==='/api/v2/help_center/locales.json')return {locales:['en-us'],default_locale:'en-us'};
    var help={categories:'categories',sections:'sections',articles:'articles'};
    for(var name in help)if(new RegExp('/help_center/en-us/'+name+'\\.json$').test(path)){var item={id:name+'-001',name:'Example '+name};if(name==='articles')item.title='Example article';var output={next_page:null};output[help[name]]=[item];return output;}
    if(/\/custom_objects\/device\/fields$/.test(path))return {custom_object_fields:[{id:401,key:'serial_number',title:'Serial number',type:'text'}],links:{next:null}};
    if(path==='/api/v2/custom_objects')return {custom_objects:[{id:400,key:'device',title:'Device'}],links:{next:null}};
    if(path==='/api/v2/groups.json')return {groups:[{id:10,name:'Customer Care',active:true},{id:11,name:'Escalations',active:true}],next_page:null};
    if(path==='/api/v2/users.json')return {users:[{id:21,name:'Amina Agent',active:true,role:'agent',role_type:0,custom_role_id:701,last_login_at:ago(1),signature:'Customer Care'},{id:22,name:'Liam Lead',active:true,role:'admin',role_type:0,last_login_at:ago(4),signature:'Team Lead'},{id:23,name:'Lee Light',active:true,role:'agent',role_type:1,last_login_at:ago(2),signature:''}],next_page:null};
    if(path==='/api/v2/brands.json')return {brands:[{id:31,name:'Aquasure',active:true}],next_page:null};
    if(path==='/api/v2/macros.json')return {macros:[{id:41,title:'Shipping status',active:true,usage_30d:94},{id:42,title:'Returns',active:true,usage_30d:61}],next_page:null};
    if(path==='/api/v2/ticket_forms.json')return {ticket_forms:[{id:51,name:'Customer request',active:true},{id:52,name:'Warranty request',active:true,restricted_brand_ids:[31]}],next_page:null};
    if(path==='/api/v2/ticket_fields.json')return {ticket_fields:[{id:61,title:'Contact reason',type:'tagger',active:true},{id:62,title:'Order number',type:'text',active:true}],next_page:null};
    var roots={
      '/api/v2/groups.json':'groups','/api/v2/views.json':'views','/api/v2/users.json':'users',
      '/api/v2/recipient_addresses.json':'recipient_addresses','/api/v2/business_hours/schedules.json':'schedules',
      '/api/v2/ticket_forms.json':'ticket_forms','/api/v2/ticket_fields.json':'ticket_fields','/api/v2/tags.json':'tags',
      '/api/v2/custom_statuses.json':'custom_statuses','/api/v2/slas/policies.json':'sla_policies',
      '/api/v2/automations.json':'automations','/api/v2/triggers.json':'triggers','/api/v2/trigger_categories':'trigger_categories',
      '/api/v2/user_fields.json':'user_fields',
      '/api/v2/organization_fields.json':'organization_fields'
    };
    var root=roots[path], data={next_page:null};
    if(root){data[root]=[{id:root+'-001',name:'Example '+root.replace(/_/g,' '),active:true}];return data;}
    return {error:'Not found'};
  }

  function request(input){
    var options=typeof input==='string'?{url:input,type:'GET'}:input;
    var url=options.url, method=(options.type||'GET').toUpperCase(), path=parsed(url).pathname;

    if(path==='/api/services/zis/registry/integrations'&&method==='GET')return Promise.resolve({integrations:integrations});
    if(/^\/api\/services\/zis\/registry\/cxe_config_sync$/.test(path)&&method==='POST'){
      integrations=[{name:'cxe_config_sync',description:'Local mock'}];return Promise.resolve(integrations[0]);
    }
    if(/\/api\/services\/zis\/registry\/cxe_config_sync\/bundles$/.test(path)&&method==='POST')return Promise.resolve({});
    if(/\/api\/services\/zis\/registry\/job_specs\/install$/.test(path)&&method==='POST')return Promise.resolve({});
    if(/\/api\/services\/zis\/integrations\/cxe_config_sync\/connections\/basic_auth$/.test(path)&&method==='POST'){
      var credential=body(options);zisConnections[credential.name]=Object.assign({},credential,{password:'*****'});return Promise.resolve({basic_auth:zisConnections[credential.name]});
    }
    if(/\/api\/services\/zis\/integrations\/cxe_config_sync\/connections\/bearer_token$/.test(path)&&method==='POST'){
      var bearer=body(options);zisConnections[bearer.name]=Object.assign({},bearer,{token:'*****'});return Promise.resolve({bearer_token:zisConnections[bearer.name]});
    }
    var connectionMatch=path.match(/\/connections\/(?:basic_auth|bearer_token)\/([^/]+)$/);
    if(connectionMatch&&method==='DELETE'){delete zisConnections[decodeURIComponent(connectionMatch[1])];return Promise.resolve({});}
    if(/\/api\/services\/zis\/integrations\/cxe_config_sync\/configs$/.test(path)&&method==='POST'){
      var createConfig=body(options);configs[createConfig.scope]=createConfig.config;return Promise.resolve({});
    }
    var configMatch=path.match(/\/configs\/([^/]+)$/);
    if(configMatch&&method==='PUT'){configs[decodeURIComponent(configMatch[1])]=body(options).config;return Promise.resolve({});}
    if(configMatch&&method==='DELETE'){delete configs[decodeURIComponent(configMatch[1])];return Promise.resolve({});}
    if(/\/api\/services\/zis\/integrations\/cxe_config_sync\/configs$/.test(path)&&method==='GET'){
      var filter=parsed(url).searchParams.get('filter[scope]')||'', prefix=filter.replace(/\*$/,'');
      return Promise.resolve({configs:Object.keys(configs).filter(function(scope){return scope.indexOf(prefix)===0;}).map(function(scope,index){return {id:index+1,scope:scope,config:configs[scope]};}),meta:{has_more:false}});
    }

    if(/\/custom_objects\/client\/records/.test(url))return Promise.resolve({custom_object_records:clients,meta:{has_more:false}});
    if(/\/custom_objects\/cxe_zd_sync_connection\/records/.test(url)&&method==='GET')return Promise.resolve({custom_object_records:connectionRecords,meta:{has_more:false}});
    if(/\/custom_objects\/cxe_zd_sync_connection\/records/.test(url)&&method==='PATCH'){
      var recordBody=body(options).custom_object_record, id=externalId(url), existing=connectionRecords.findIndex(function(record){return record.external_id===id;});
      var record={id:existing>=0?connectionRecords[existing].id:'connection-'+(connectionRecords.length+1),external_id:id,name:recordBody.name,custom_object_fields:recordBody.custom_object_fields};
      if(existing>=0)connectionRecords[existing]=record;else connectionRecords.push(record);return Promise.resolve({custom_object_record:record});
    }
    if(/\/custom_objects\/cxe_zd_sync_connection\/records/.test(url)&&method==='DELETE'){
      var deleteId=externalId(url);connectionRecords=connectionRecords.filter(function(record){return record.external_id!==deleteId;});return Promise.resolve({});
    }
    if(/\/custom_objects\/cxe_zd_sync_job\/records$/.test(path)&&method==='POST'){
      var job=body(options).custom_object_record, jf=job.custom_object_fields;
      var jobRecord={id:'job-'+(jobRecords.length+1),name:job.name,custom_object_fields:jf};jobRecords.push(jobRecord);
      configs[jf.cxe_job_scope]={run_id:jf.cxe_job_run_id,status:'complete',key:jf.cxe_job_key,root:jf.cxe_job_root,response:resultFor(jf.cxe_job_url)};
      return Promise.resolve({custom_object_record:jobRecord});
    }
    if(/\/custom_objects\/cxe_zd_sync_job\/records\/[^/]+$/.test(path)&&method==='DELETE'){jobRecords=jobRecords.filter(function(job){return job.id!==path.split('/').pop();});return Promise.resolve({});}
    if(/\/custom_objects\/cxe_zd_sync_connection\/fields$/.test(path))return Promise.resolve({custom_object_fields:connectionFields});
    if(/\/custom_objects\/cxe_zd_sync_job\/fields$/.test(path))return Promise.resolve({custom_object_fields:jobFields});
    if(/\/custom_objects\/(client|cxe_zd_sync_connection|cxe_zd_sync_job)$/.test(path))return Promise.resolve({custom_object:{key:path.split('/').pop()}});
    if(path==='/api/v2/custom_objects'&&method==='POST')return Promise.resolve({custom_object:body(options).custom_object});
    if(/\/custom_objects\/[^/]+\/fields$/.test(path)&&method==='POST')return Promise.resolve({custom_object_field:body(options).custom_object_field});
    if(/\/custom_objects\/cxe_zd_sync_connection\/fields\/cxe_auth_type$/.test(path)&&method==='PATCH'){
      var update=body(options).custom_object_field||{},auth=connectionFields.find(function(field){return field.key==='cxe_auth_type';});Object.assign(auth,update);return Promise.resolve({custom_object_field:auth});
    }
    return Promise.resolve({});
  }

  window.ZAFClient={init:function(){return {
    get:function(){return Promise.resolve({currentUser:{id:'admin-001',name:'Amina Dlamini',role:'admin'}});},
    invoke:function(){return Promise.resolve();},
    request:request
  };}};
})();
