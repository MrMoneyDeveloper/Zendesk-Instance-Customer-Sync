(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.CXEZIS = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  var INTEGRATION_KEY = 'cxe_config_sync';
  var BUNDLE_NAME = 'CXE Zendesk Config Sync';
  var FLOW_NAME = 'cxe_sync_flow';
  var JOB_SPEC_NAME = 'cxe_sync_jobs';
  var JOB_OBJECT = 'cxe_zd_sync_job';
  var CONFIG_PREFIX = 'cxe_run_';
  var MAX_BATCH_REQUESTS = 30;

  function safeString(value) {
    return value == null ? '' : String(value);
  }

  function normalizeDomain(value) {
    var domain = safeString(value).trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '').split('/')[0];
    if (!/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.zendesk\.com$/.test(domain)) {
      throw new Error('Enter a valid Zendesk domain such as client.zendesk.com.');
    }
    return domain;
  }

  function hash(value) {
    var input = safeString(value);
    var result = 2166136261;
    for (var index = 0; index < input.length; index += 1) {
      result ^= input.charCodeAt(index);
      result = Math.imul(result, 16777619);
    }
    return (result >>> 0).toString(16).padStart(8, '0');
  }

  function actionName(clientId) {
    return 'fetch_' + hash(clientId);
  }

  function fetchStateName(clientId) {
    return 'Fetch_' + hash(clientId);
  }

  function connectionName(clientId, suffix) {
    var tail = safeString(suffix || Date.now().toString(36)).toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(-20);
    return ('cxe_' + hash(clientId) + '_' + tail).slice(0, 64);
  }

  function assertSafeUrl(value, expectedDomain) {
    var url;
    try { url = new URL(value); } catch (error) { throw new Error('Zendesk returned an invalid pagination URL.'); }
    if (url.protocol !== 'https:' || url.hostname !== normalizeDomain(expectedDomain) || url.username || url.password) {
      throw new Error('Zendesk returned an unsafe pagination URL.');
    }
    return url.toString();
  }

  function withPageSize(domain, path) {
    var url = new URL(path, 'https://' + normalizeDomain(domain));
    if (!url.searchParams.has('per_page') && !url.searchParams.has('page[size]')) url.searchParams.set('per_page', '25');
    return assertSafeUrl(url.toString(), domain);
  }

  function nextPage(response, currentUrl, domain) {
    if (response && response.end_of_stream === true) return '';
    var supplied = response && (response.next_page || response.after_url || response.links && response.links.next);
    if (supplied) return assertSafeUrl(new URL(supplied, currentUrl).toString(), domain);
    if (response && response.meta && response.meta.has_more && response.meta.after_cursor) {
      var next = new URL(currentUrl);
      next.searchParams.set('page[after]', response.meta.after_cursor);
      return assertSafeUrl(next.toString(), domain);
    }
    return '';
  }

  function requestScope(clientId, runId, index) {
    return CONFIG_PREFIX + hash(clientId) + '_' + hash(runId) + '_' + Number(index || 0).toString(36);
  }

  function normalizeConnections(connections) {
    var seenClients = {};
    var seenActions = {};
    return (Array.isArray(connections) ? connections : []).map(function (connection) {
      var item = {
        clientId: safeString(connection && connection.clientId),
        connectionName: safeString(connection && connection.connectionName),
        domain: normalizeDomain(connection && connection.domain)
      };
      if (!item.clientId || !/^[A-Za-z0-9_-]{3,64}$/.test(item.connectionName)) throw new Error('Invalid ZIS connection mapping.');
      var action = actionName(item.clientId);
      if (seenClients[item.clientId] || seenActions[action]) throw new Error('Duplicate ZIS client mapping.');
      seenClients[item.clientId] = true;
      seenActions[action] = true;
      item.actionName = action;
      item.fetchState = fetchStateName(item.clientId);
      return item;
    });
  }

  function buildBundle(connections) {
    var mapped = normalizeConnections(connections);
    if (!mapped.length) throw new Error('At least one client connection is required to build the ZIS bundle.');

    var resources = {};
    var states = {
      ParseJob: {
        Type: 'Action',
        ActionName: 'zis:common:transform:Jq',
        Parameters: {
          expr: '.custom_object_event.custom_object_record as $r | {object_key:$r.custom_object_key, client_id:($r.custom_object_fields.cxe_job_client_id|tostring), run_id:($r.custom_object_fields.cxe_job_run_id|tostring), scope:($r.custom_object_fields.cxe_job_scope|tostring), key:($r.custom_object_fields.cxe_job_key|tostring), root:($r.custom_object_fields.cxe_job_root|tostring), url:($r.custom_object_fields.cxe_job_url|tostring)}',
          'data.$': '$.input'
        },
        ResultPath: '$.job',
        Next: 'CheckObject'
      },
      CheckObject: {
        Type: 'Choice',
        Choices: [{ Variable: '$.job.object_key', StringEquals: JOB_OBJECT, Next: 'RouteClient' }],
        Default: 'Ignore'
      },
      RouteClient: { Type: 'Choice', Choices: [], Default: 'Ignore' },
      Ignore: { Type: 'Succeed', Message: 'Event does not belong to an active CXE Config Sync connection.' },
      PostFetch: {
        Type: 'Choice',
        Choices: [{ Variable: '$.job.key', StringEquals: 'health_tickets', Next: 'MinimiseHealthTickets' }],
        Default: 'Store'
      },
      MinimiseHealthTickets: {
        Type: 'Action',
        ActionName: 'zis:common:transform:Jq',
        Parameters: {
          expr: '{tickets:[(.tickets // [])[] | {id:.id,created_at:.created_at,status:.status,group_id:.group_id,assignee_id:.assignee_id,brand_id:.brand_id,via:{channel:(.via.channel // null)},from_messaging_channel:(.from_messaging_channel // false),satisfaction_rating:{score:(.satisfaction_rating.score // null)}}],metric_sets:[(.metric_sets // [])[] | {ticket_id:.ticket_id,solved_at:.solved_at,replies:.replies,reply_time_in_minutes:{calendar:(.reply_time_in_minutes.calendar // null)},reply_time_in_seconds:{calendar:(.reply_time_in_seconds.calendar // null)},full_resolution_time_in_minutes:{calendar:(.full_resolution_time_in_minutes.calendar // null)},requester_wait_time_in_minutes:{calendar:(.requester_wait_time_in_minutes.calendar // null)}}],end_of_stream:(if .end_of_stream == null then true else .end_of_stream end),after_url:(.after_url // null),after_cursor:(.after_cursor // null)}',
          'data.$': '$.response'
        },
        ResultPath: '$.response',
        Next: 'Store'
      },
      Store: {
        Type: 'Action',
        ActionName: 'zis:common:action:PatchConfig',
        Parameters: {
          'scope.$': '$.job.scope',
          config: {
            'run_id.$': '$.job.run_id',
            status: 'complete',
            'key.$': '$.job.key',
            'root.$': '$.job.root',
            'response.$': '$.response'
          }
        },
        Next: 'Complete'
      },
      StoreError: {
        Type: 'Action',
        ActionName: 'zis:common:action:PatchConfig',
        Parameters: {
          'scope.$': '$.job.scope',
          config: {
            'run_id.$': '$.job.run_id',
            status: 'error',
            'key.$': '$.job.key',
            'root.$': '$.job.root',
            'error.$': '$.failure'
          }
        },
        Next: 'Complete'
      },
      Complete: { Type: 'Succeed', Message: 'CXE configuration request batch completed.' }
    };

    mapped.forEach(function (connection) {
      resources[connection.actionName] = {
        type: 'ZIS::Action::Http',
        properties: {
          name: connection.actionName,
          definition: {
            method: 'GET',
            'url.$': '$.url',
            connectionName: connection.connectionName,
            headers: [{ key: 'Accept', value: 'application/json' }]
          }
        }
      };
      states.RouteClient.Choices.push({ Variable: '$.job.client_id', StringEquals: connection.clientId, Next: connection.fetchState });
      states[connection.fetchState] = {
        Type: 'Action',
        ActionName: 'zis:' + INTEGRATION_KEY + ':action:' + connection.actionName,
        Parameters: { 'url.$': '$.job.url' },
        ResultPath: '$.response',
        Next: 'PostFetch',
        Catch: [{ ErrorEquals: ['States.ALL'], ResultPath: '$.failure', Next: 'StoreError' }]
      };
    });

    resources.cxe_sync_flow = {
      type: 'ZIS::Flow',
      properties: {
        name: FLOW_NAME,
        definition: { StartAt: 'ParseJob', States: states }
      }
    };
    resources.cxe_sync_jobs = {
      type: 'ZIS::JobSpec',
      properties: {
        name: JOB_SPEC_NAME,
        event_source: 'support',
        event_type: 'customobject.CustomObjectRecordCreated',
        flow_name: 'zis:' + INTEGRATION_KEY + ':flow:' + FLOW_NAME
      }
    };

    return {
      name: BUNDLE_NAME,
      description: 'Zendesk-hosted cross-instance configuration and health reads for CX Experts.',
      zis_template_version: '2019-10-14',
      resources: resources
    };
  }

  function makeRequest(clientId, runId, index, key, rootName, url, extra) {
    var request = {
      run_id: safeString(runId),
      scope: requestScope(clientId, runId, index),
      key: safeString(key),
      root: safeString(rootName),
      url: safeString(url)
    };
    if (!request.run_id || !request.key || !request.root) throw new Error('Invalid ZIS sync request.');
    var additions = extra && typeof extra === 'object' ? extra : {};
    Object.keys(additions).forEach(function (name) { request[name] = additions[name]; });
    return request;
  }

  return {
    INTEGRATION_KEY: INTEGRATION_KEY,
    BUNDLE_NAME: BUNDLE_NAME,
    FLOW_NAME: FLOW_NAME,
    JOB_SPEC_NAME: JOB_SPEC_NAME,
    JOB_OBJECT: JOB_OBJECT,
    CONFIG_PREFIX: CONFIG_PREFIX,
    MAX_BATCH_REQUESTS: MAX_BATCH_REQUESTS,
    normalizeDomain: normalizeDomain,
    hash: hash,
    actionName: actionName,
    fetchStateName: fetchStateName,
    connectionName: connectionName,
    assertSafeUrl: assertSafeUrl,
    withPageSize: withPageSize,
    nextPage: nextPage,
    requestScope: requestScope,
    buildBundle: buildBundle,
    makeRequest: makeRequest
  };
});
