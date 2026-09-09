import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import {
  Activity, AlertCircle, ArrowLeft, ArrowUpRight, BookOpen, Boxes, Building2, Check, CheckCircle2, ChevronDown,
  ChevronRight, CircleHelp, Clipboard, Clock3, Code2, Copy, Database, Download, FileJson, FileSpreadsheet,
  Gauge, KeyRound, Layers3, LoaderCircle, LockKeyhole, Menu, MoreHorizontal, PanelLeftClose, Play, Plus, RefreshCw,
  Search, Settings2, ShieldCheck, Sparkles, Trash2, Users, Wifi, WifiOff, X, Zap
} from 'lucide-react';
import { ApiError, getSession, syncConfiguration, testAndEncrypt, testSavedCredential } from './lib/api';
import { createDataSource, type AppDataSource } from './lib/dataSource';
import {
  downloadFile, formatDate, formatDuration, humanize, itemTitle, itemToMarkdown, sanitizeForAI, sectionToCsv,
  sectionToMarkdown, sectionToText
} from './lib/formatters';
import type {
  AuthType, ClientWithConnection, ConfigItem, ConnectionRecord, ConnectionStatus, SchemaCheck, SectionKey,
  SectionResult, SessionInfo, SyncResults
} from './types';
import { sectionDefinitions } from './types';

const statusMeta: Record<ConnectionStatus, { label: string; tone: string }> = {
  connected: { label: 'Connected', tone: 'positive' },
  not_connected: { label: 'Not connected', tone: 'neutral' },
  invalid: { label: 'Credential invalid', tone: 'critical' },
  disabled: { label: 'Disabled', tone: 'muted' },
  permission_issue: { label: 'Permission issue', tone: 'warning' },
  error: { label: 'Connection error', tone: 'critical' }
};

const prioritySections: SectionKey[] = ['groups', 'views', 'ticket_forms', 'ticket_fields', 'triggers', 'automations', 'macros', 'sla_policies', 'brands', 'custom_objects', 'help_centre'];

interface ToastState { message: string; tone: 'positive' | 'critical' | 'info' }

export default function App() {
  const source = useMemo(() => createDataSource(), []);
  const [clients, setClients] = useState<ClientWithConnection[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [activeSection, setActiveSection] = useState<'overview' | SectionKey>('overview');
  const [syncByClient, setSyncByClient] = useState<Record<string, SyncResults>>({});
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<SectionKey[] | null>(null);
  const [schema, setSchema] = useState<SchemaCheck | null>(null);
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [showSystem, setShowSystem] = useState(false);
  const [connectMode, setConnectMode] = useState<'connect' | 'replace' | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [railOpen, setRailOpen] = useState(true);
  const demoBootstrapped = useRef(false);

  const notify = useCallback((message: string, tone: ToastState['tone'] = 'positive') => {
    setToast({ message, tone });
    window.setTimeout(() => setToast(null), 3600);
  }, []);

  const reload = useCallback(async () => {
    const [clientRecords, connections, check, sessionInfo] = await Promise.all([
      source.listClients(), source.listConnections(), source.checkSchema(), getSession()
    ]);
    const byClient = new Map(connections.map((connection) => [connection.clientId, connection]));
    const joined: ClientWithConnection[] = clientRecords
      .map((client) => {
        const connection = byClient.get(client.id);
        const status: ConnectionStatus = connection ? connection.status : 'not_connected';
        return { ...client, connection, status };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
    setClients(joined);
    setSchema(check);
    setSession(sessionInfo);
    setSelectedId((current) => current || joined.find((client) => client.status === 'connected')?.id || joined[0]?.id || '');
    setLoading(false);
  }, [source]);

  useEffect(() => {
    reload().catch((error) => {
      setLoading(false);
      notify(error instanceof Error ? error.message : 'The app could not load.', 'critical');
    });
  }, [reload, notify]);

  const selected = clients.find((client) => client.id === selectedId);
  const results = selected ? syncByClient[selected.id] ?? {} : {};

  const runSync = useCallback(async (keys: SectionKey[]) => {
    if (!selected?.connection) return setConnectMode('connect');
    if (!selected.connection.enabled) return notify('Enable this connection before syncing.', 'critical');
    setSyncing(keys);
    try {
      const response = await syncConfiguration(selected.connection, keys);
      setSyncByClient((current) => ({
        ...current,
        [selected.id]: { ...current[selected.id], ...Object.fromEntries(response.sections.map((section) => [section.key, section])) }
      }));
      const syncedAt = new Date().toISOString();
      const updated: ConnectionRecord = { ...selected.connection, status: 'connected', lastSyncAt: syncedAt, lastTestAt: syncedAt, lastHttpStatus: 200, lastError: null };
      await source.saveConnection(updated);
      setClients((current) => current.map((client) => client.id === selected.id ? { ...client, status: 'connected', connection: updated } : client));
      notify(keys.length === sectionDefinitions.length ? 'All configuration is up to date.' : `${sectionLabel(keys[0])} refreshed.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sync failed.';
      if (selected.connection && error instanceof ApiError && !['NETWORK_ERROR', 'SERVICE_ERROR', 'RATE_LIMITED'].includes(error.code ?? '')) {
        const status = error.status === 401 ? 'invalid' : error.status === 403 ? 'permission_issue' : 'error';
        const updated: ConnectionRecord = { ...selected.connection, status, lastHttpStatus: error.status, lastError: message };
        await source.saveConnection(updated).catch(() => undefined);
        setClients((current) => current.map((client) => client.id === selected.id ? { ...client, status, connection: updated } : client));
      }
      notify(message, 'critical');
    } finally {
      setSyncing(null);
    }
  }, [selected, notify, source]);

  useEffect(() => {
    if (source.mode !== 'demo' || demoBootstrapped.current || !selected?.connection || selected.status !== 'connected') return;
    demoBootstrapped.current = true;
    runSync(sectionDefinitions.map((section) => section.key));
  }, [source.mode, selected, runSync]);

  const saveConnection = async (connection: ConnectionRecord) => {
    const saved = await source.saveConnection(connection);
    setClients((current) => current.map((client) => client.id === connection.clientId ? { ...client, connection: saved, status: saved.status } : client));
    setConnectMode(null);
  };

  const toggleConnection = async () => {
    if (!selected?.connection) return;
    if (selected.connection.enabled) {
      const updated: ConnectionRecord = { ...selected.connection, enabled: false, status: 'disabled' };
      await saveConnection(updated);
      notify(`${selected.name} has been disabled.`, 'info');
      return;
    }
    try {
      setSyncing([]);
      const result = await testSavedCredential(selected.connection);
      const updated: ConnectionRecord = { ...selected.connection, enabled: true, status: 'connected', lastTestAt: result.testedAt, lastHttpStatus: result.httpStatus, lastError: null };
      await saveConnection(updated);
      notify(`${selected.name} is enabled and connected.`);
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Connection test failed.', 'critical');
    } finally {
      setSyncing(null);
    }
  };

  const testConnection = async () => {
    if (!selected?.connection) return;
    setSyncing([]);
    try {
      const result = await testSavedCredential(selected.connection);
      await saveConnection({ ...selected.connection, status: 'connected', lastTestAt: result.testedAt, lastHttpStatus: result.httpStatus, lastError: null });
      notify(`Connection verified${result.accountName ? ` as ${result.accountName}` : ''}.`);
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Connection test failed.', 'critical');
    } finally {
      setSyncing(null);
    }
  };

  const removeConnection = async () => {
    if (!selected?.connection || !window.confirm(`Remove the saved connection for ${selected.name}? The Client record will not be changed.`)) return;
    await source.deleteConnection(selected.connection);
    setClients((current) => current.map((client) => client.id === selected.id ? { ...client, connection: undefined, status: 'not_connected' } : client));
    setSyncByClient((current) => ({ ...current, [selected.id]: {} }));
    notify(`Connection removed. ${selected.name}'s Client record is unchanged.`, 'info');
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className={`app-shell ${railOpen ? '' : 'rail-collapsed'}`}>
      <header className="topbar">
        <div className="brand-lockup">
          <button className="icon-button mobile-only" onClick={() => setRailOpen((value) => !value)} aria-label="Toggle navigation"><Menu size={19} /></button>
          <BrandMark />
          <div>
            <div className="brand-name">CX Experts</div>
            <div className="brand-product">Config Sync</div>
          </div>
        </div>
        <div className="topbar-context">
          <div className="environment-pill"><LockKeyhole size={12} /> Private Zendesk app</div>
          {source.mode === 'demo' && <div className="demo-pill">Demo data</div>}
        </div>
        <div className="topbar-actions">
          <button className="icon-button" onClick={() => setShowSystem(true)} aria-label="System setup"><Settings2 size={18} /></button>
          <div className="avatar">AD</div>
          <div className="user-copy"><strong>{session?.user?.name ?? 'Zendesk user'}</strong><span>{session?.user?.role ?? 'Authorised staff'}</span></div>
        </div>
      </header>

      <ClientRail
        clients={clients}
        selectedId={selectedId}
        open={railOpen}
        schemaReady={schema?.ready ?? false}
        onToggle={() => setRailOpen((value) => !value)}
        onSelect={(id) => { setSelectedId(id); setActiveSection('overview'); if (window.innerWidth < 800) setRailOpen(false); }}
        onSystem={() => setShowSystem(true)}
      />

      <main className="workspace">
        {selected ? (
          <>
            <ClientHeader
              client={selected}
              syncing={syncing !== null}
              onConnect={() => setConnectMode(selected.connection ? 'replace' : 'connect')}
              onSync={() => runSync(sectionDefinitions.map((section) => section.key))}
              onTest={testConnection}
              onToggle={toggleConnection}
              onRemove={removeConnection}
            />
            <SectionNav active={activeSection} results={results} onSelect={setActiveSection} />
            <div className="workspace-content">
              {activeSection === 'overview' ? (
                <Overview
                  client={selected}
                  results={results}
                  syncing={syncing}
                  onSync={() => runSync(sectionDefinitions.map((section) => section.key))}
                  onOpenSection={(key) => setActiveSection(key)}
                  onConnect={() => setConnectMode('connect')}
                  notify={notify}
                />
              ) : (
                <SectionView
                  client={selected}
                  sectionKey={activeSection}
                  result={results[activeSection]}
                  syncing={syncing?.includes(activeSection) ?? false}
                  onRefresh={() => runSync([activeSection])}
                  notify={notify}
                />
              )}
            </div>
          </>
        ) : <EmptyState icon={<Users />} title="No client records found" body="Create a record in the existing client custom object, then reopen Config Sync." />}
      </main>

      {connectMode && selected && (
        <ConnectionModal
          client={selected}
          mode={connectMode}
          onClose={() => setConnectMode(null)}
          onSave={async (connection) => { await saveConnection(connection); notify(connectMode === 'replace' ? 'Credential replaced after a successful test.' : `${selected.name} is connected.`); }}
        />
      )}
      {showSystem && schema && <SystemPanel source={source} schema={schema} onClose={() => setShowSystem(false)} onUpdate={setSchema} notify={notify} />}
      {toast && <Toast state={toast} onClose={() => setToast(null)} />}
    </div>
  );
}

function BrandMark() {
  return <div className="brand-mark" aria-hidden="true"><span /><span /><span /></div>;
}

function LoadingScreen() {
  return <div className="loading-screen"><BrandMark /><LoaderCircle className="spin" size={22} /><span>Opening Config Sync…</span></div>;
}

function ClientRail({ clients, selectedId, open, schemaReady, onToggle, onSelect, onSystem }: {
  clients: ClientWithConnection[]; selectedId: string; open: boolean; schemaReady: boolean;
  onToggle: () => void; onSelect: (id: string) => void; onSystem: () => void;
}) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'connected' | 'attention'>('all');
  const visible = clients.filter((client) => {
    const matches = client.name.toLowerCase().includes(search.toLowerCase());
    return matches && (filter === 'all' || filter === 'connected' && client.status === 'connected' || filter === 'attention' && !['connected', 'not_connected'].includes(client.status));
  });
  const connectedCount = clients.filter((client) => client.status === 'connected').length;

  return (
    <aside className={`client-rail ${open ? 'open' : ''}`}>
      <div className="rail-heading">
        <div><span className="eyebrow">Client registry</span><h2>Clients <span>{clients.length}</span></h2></div>
        <button className="icon-button rail-toggle" onClick={onToggle} aria-label="Collapse client list"><PanelLeftClose size={17} /></button>
      </div>
      <div className="search-box"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find a client…" /></div>
      <div className="filter-row">
        {(['all', 'connected', 'attention'] as const).map((value) => <button key={value} className={filter === value ? 'active' : ''} onClick={() => setFilter(value)}>{humanize(value)}</button>)}
      </div>
      <div className="client-list">
        {visible.map((client) => (
          <button key={client.id} className={`client-row ${selectedId === client.id ? 'selected' : ''}`} onClick={() => onSelect(client.id)}>
            <span className="client-avatar">{initials(client.name)}</span>
            <span className="client-row-copy"><strong>{client.name}</strong><span>{client.connection?.domain ?? 'No Zendesk connection'}</span></span>
            <StatusDot status={client.status} />
          </button>
        ))}
        {!visible.length && <div className="rail-empty">No clients match this view.</div>}
      </div>
      <button className="system-health" onClick={onSystem}>
        <span className={`health-icon ${schemaReady ? 'ready' : 'issue'}`}>{schemaReady ? <ShieldCheck size={18} /> : <AlertCircle size={18} />}</span>
        <span><strong>{schemaReady ? 'System ready' : 'Setup required'}</strong><small>{connectedCount} of {clients.length} connected</small></span>
        <ChevronRight size={16} />
      </button>
    </aside>
  );
}

function ClientHeader({ client, syncing, onConnect, onSync, onTest, onToggle, onRemove }: {
  client: ClientWithConnection; syncing: boolean; onConnect: () => void; onSync: () => void; onTest: () => void; onToggle: () => void; onRemove: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="client-header">
      <div className="client-title-row">
        <div className="large-avatar">{initials(client.name)}</div>
        <div><span className="eyebrow">Zendesk configuration</span><h1>{client.name}</h1><div className="header-meta"><StatusPill status={client.status} />{client.connection && <><span>•</span><span>{client.connection.domain}</span><span>•</span><span>Last sync {formatDate(client.connection.lastSyncAt)}</span></>}</div></div>
      </div>
      <div className="header-actions">
        {client.connection ? <button className="button primary" disabled={syncing || !client.connection.enabled} onClick={onSync}>{syncing ? <LoaderCircle className="spin" size={16} /> : <RefreshCw size={16} />} Sync all</button> : <button className="button primary" onClick={onConnect}><Plus size={16} /> Connect Zendesk</button>}
        {client.connection && <div className="menu-wrap"><button className="button secondary square" onClick={() => setMenuOpen((value) => !value)} aria-label="Connection actions"><MoreHorizontal size={18} /></button>{menuOpen && <div className="action-menu">
          <button onClick={() => { setMenuOpen(false); onTest(); }}><Wifi size={15} /> Test connection</button>
          <button onClick={() => { setMenuOpen(false); onConnect(); }}><KeyRound size={15} /> Replace credential</button>
          <button onClick={() => { setMenuOpen(false); onToggle(); }}>{client.connection.enabled ? <WifiOff size={15} /> : <Wifi size={15} />}{client.connection.enabled ? 'Disable connection' : 'Enable connection'}</button>
          <hr /><button className="danger" onClick={() => { setMenuOpen(false); onRemove(); }}><Trash2 size={15} /> Remove connection</button>
        </div>}</div>}
      </div>
    </div>
  );
}

function SectionNav({ active, results, onSelect }: { active: 'overview' | SectionKey; results: SyncResults; onSelect: (key: 'overview' | SectionKey) => void }) {
  return <nav className="section-nav"><button className={active === 'overview' ? 'active' : ''} onClick={() => onSelect('overview')}><Gauge size={15} /> Overview</button>{sectionDefinitions.map((section) => <button key={section.key} className={active === section.key ? 'active' : ''} onClick={() => onSelect(section.key)}>{section.label}{results[section.key] && <span>{results[section.key]?.items.length}</span>}</button>)}</nav>;
}

function Overview({ client, results, syncing, onSync, onOpenSection, onConnect, notify }: {
  client: ClientWithConnection; results: SyncResults; syncing: SectionKey[] | null; onSync: () => void; onOpenSection: (key: SectionKey) => void; onConnect: () => void; notify: (message: string, tone?: ToastState['tone']) => void;
}) {
  const sections = Object.values(results).filter(Boolean) as SectionResult[];
  const total = sections.reduce((sum, section) => sum + section.items.length, 0);
  const latest = sections.map((section) => section.syncedAt).sort().at(-1);

  if (!client.connection) return <EmptyState icon={<KeyRound />} title={`Connect ${client.name}`} body="Test and securely save a credential to inspect this client's Zendesk configuration." action={<button className="button primary" onClick={onConnect}><Plus size={16} /> Connect Zendesk</button>} />;
  if (client.status === 'invalid') return <ErrorState title="Authentication failed" body="The saved credential is invalid, expired, revoked, or no longer accepted by the client Zendesk instance." action={<button className="button primary" onClick={onConnect}><KeyRound size={16} /> Replace credential</button>} />;
  if (client.status === 'disabled') return <ErrorState icon={<WifiOff />} title="Connection disabled" body="The encrypted credential and connection metadata are retained. Enable the connection to test or sync." tone="neutral" />;

  return (
    <div className="overview-layout">
      <section className="sync-hero">
        <div className="hero-copy"><span className="eyebrow">Current session snapshot</span><h2>{sections.length ? `${total.toLocaleString()} configuration items` : 'Ready for a live configuration read'}</h2><p>{sections.length ? `${sections.length} areas synced from ${client.connection.domain}. Nothing is retained by the secure service.` : 'Run a read-only sync to populate this workspace. No ticket or conversation data will be requested.'}</p></div>
        <div className="hero-action"><div className={`sync-orbit ${syncing ? 'running' : ''}`}><Database size={26} /><span><RefreshCw size={14} /></span></div><button className="button light" disabled={syncing !== null || !client.connection.enabled} onClick={onSync}>{syncing ? `Reading ${syncing.length || 1} area${syncing.length === 1 ? '' : 's'}…` : sections.length ? 'Sync again' : 'Sync all configuration'}<ArrowUpRight size={16} /></button><small>{latest ? `Updated ${formatDate(latest)}` : 'Read-only · no ticket data'}</small></div>
      </section>

      {sections.length > 0 && <div className="overview-toolbar"><div><h3>Configuration overview</h3><p>Counts from this app session</p></div><div className="overview-export"><button className="button secondary" onClick={() => copyFullForAI(client, results, notify)}><Sparkles size={15} /> Copy for AI</button><button className="button secondary" onClick={() => exportFull(client, results)}><FileJson size={15} /> Export JSON</button></div></div>}

      <div className="metric-grid">
        {prioritySections.map((key) => {
          const definition = sectionDefinitions.find((section) => section.key === key)!;
          const result = results[key];
          return <button key={key} className={`metric-card ${result ? '' : 'empty'}`} onClick={() => onOpenSection(key)}><span className="metric-icon">{sectionIcon(key)}</span><span className="metric-value">{result ? result.items.length.toLocaleString() : '—'}</span><span className="metric-label">{definition.label}</span><ChevronRight size={16} /></button>;
        })}
      </div>

      <div className="overview-bottom">
        <section className="panel recent-panel"><div className="panel-heading"><div><h3>Recently read</h3><p>Latest section responses in this session</p></div><Activity size={18} /></div>{sections.length ? <div className="recent-list">{sections.slice().sort((a, b) => b.syncedAt.localeCompare(a.syncedAt)).slice(0, 6).map((section) => <button key={section.key} onClick={() => onOpenSection(section.key)}><span className="recent-icon">{sectionIcon(section.key)}</span><span><strong>{section.label}</strong><small>{section.items.length} items · {formatDuration(section.durationMs)}</small></span>{section.warning ? <AlertCircle className="warning" size={16} /> : <CheckCircle2 className="success" size={16} />}</button>)}</div> : <div className="panel-empty">Sections will appear here after a sync.</div>}</section>
        <section className="panel assurance-panel"><div className="assurance-art"><ShieldCheck size={28} /></div><div><span className="eyebrow">Data assurance</span><h3>Configuration only. Always read-only.</h3><p>Tickets, comments, attachments, requesters and conversation history are excluded by design.</p><div className="assurance-tags"><span><Check size={13} /> Temporary session data</span><span><Check size={13} /> Sanitised AI copy</span><span><Check size={13} /> No credential exports</span></div></div></section>
      </div>
    </div>
  );
}

function SectionView({ client, sectionKey, result, syncing, onRefresh, notify }: {
  client: ClientWithConnection; sectionKey: SectionKey; result?: SectionResult; syncing: boolean; onRefresh: () => void; notify: (message: string, tone?: ToastState['tone']) => void;
}) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<ConfigItem | null>(null);
  const [view, setView] = useState<'readable' | 'json'>('readable');
  const definition = sectionDefinitions.find((section) => section.key === sectionKey)!;
  useEffect(() => { setQuery(''); setSelected(null); setView('readable'); }, [sectionKey]);
  const visible = (result?.items ?? []).filter((item) => JSON.stringify(item).toLowerCase().includes(query.toLowerCase()));

  if (!result && !syncing) return <EmptyState icon={sectionIcon(sectionKey, 28)} title={`${definition.label} have not been synced`} body={`Read only ${definition.label.toLowerCase()} from ${client.connection?.domain ?? 'this client'} without running a full sync.`} action={<button className="button primary" disabled={!client.connection?.enabled} onClick={onRefresh}><RefreshCw size={16} /> Refresh {definition.label}</button>} />;

  return (
    <div className="section-layout">
      <div className="section-heading"><div><span className="eyebrow">Configuration area</span><h2>{definition.label}</h2><p>{result ? `${result.items.length} items · Updated ${formatDate(result.syncedAt)} · ${formatDuration(result.durationMs)}` : 'Reading configuration…'}</p></div><div className="section-actions"><button className="button secondary" onClick={onRefresh} disabled={syncing}>{syncing ? <LoaderCircle className="spin" size={15} /> : <RefreshCw size={15} />} Refresh</button>{result && <ExportMenu client={client} result={result} notify={notify} />}</div></div>
      {result?.warning && <div className="inline-warning"><AlertCircle size={18} /><div><strong>Feature unavailable or restricted</strong><span>{result.warning}</span></div></div>}
      <div className="section-body">
        <div className="item-browser">
          <div className="browser-toolbar"><div className="search-box wide"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${definition.label.toLowerCase()}…`} /><kbd>⌘ K</kbd></div><span>{visible.length} shown</span></div>
          {syncing ? <div className="list-loading"><LoaderCircle className="spin" size={24} /><span>Reading {definition.label.toLowerCase()}…</span></div> : visible.length ? <div className="config-list">{visible.map((item, index) => <button key={String(item.id ?? index)} className={selected === item ? 'selected' : ''} onClick={() => setSelected(item)}><span className="item-order">{String(index + 1).padStart(2, '0')}</span><span className="item-copy"><strong>{itemTitle(item)}</strong><small>{itemSubtitle(item)}</small></span>{typeof item.active === 'boolean' && <span className={`active-tag ${item.active ? '' : 'inactive'}`}>{item.active ? 'Active' : 'Inactive'}</span>}<ChevronRight size={16} /></button>)}</div> : <div className="panel-empty">No matching items.</div>}
        </div>
        <div className={`detail-panel ${selected ? 'visible' : ''}`}>
          {selected ? <><div className="detail-heading"><div><span className="eyebrow">{definition.singular}</span><h3>{itemTitle(selected)}</h3></div><button className="icon-button" onClick={() => setSelected(null)}><X size={17} /></button></div><div className="view-toggle"><button className={view === 'readable' ? 'active' : ''} onClick={() => setView('readable')}>Readable</button><button className={view === 'json' ? 'active' : ''} onClick={() => setView('json')}>Raw JSON</button></div><div className="detail-scroll">{view === 'readable' ? <ReadableItem item={selected} /> : <pre>{JSON.stringify(selected, null, 2)}</pre>}</div><div className="detail-footer"><button className="button secondary" onClick={() => copyText(itemToMarkdown(selected), notify)}><Copy size={15} /> Copy item</button></div></> : <div className="detail-empty"><span>{sectionIcon(sectionKey, 24)}</span><h3>Select an item</h3><p>Choose a {definition.singular.toLowerCase()} to inspect its readable configuration and raw JSON.</p></div>}
        </div>
      </div>
    </div>
  );
}

function ReadableItem({ item }: { item: ConfigItem }) {
  return <div className="readable-item">{Object.entries(item).filter(([key]) => !['title', 'name'].includes(key)).map(([key, value]) => <div className={`field-block ${value && typeof value === 'object' ? 'complex' : ''}`} key={key}><dt>{humanize(key)}</dt><dd>{renderReadable(value)}</dd></div>)}</div>;
}

function renderReadable(value: unknown): ReactNode {
  if (value === null || value === undefined || value === '') return <span className="empty-value">None</span>;
  if (typeof value === 'boolean') return <span className={`boolean-value ${value ? 'yes' : 'no'}`}>{value ? 'Yes' : 'No'}</span>;
  if (Array.isArray(value)) return value.length ? <ol className="data-list">{value.map((entry, index) => <li key={index}>{typeof entry === 'object' ? renderReadable(entry) : String(entry)}</li>)}</ol> : <span className="empty-value">None</span>;
  if (typeof value === 'object') return <dl className="nested-data">{Object.entries(value as Record<string, unknown>).map(([key, child]) => <div key={key}><dt>{humanize(key)}</dt><dd>{renderReadable(child)}</dd></div>)}</dl>;
  return String(value);
}

function ExportMenu({ client, result, notify }: { client: ClientWithConnection; result: SectionResult; notify: (message: string, tone?: ToastState['tone']) => void }) {
  const [open, setOpen] = useState(false);
  return <div className="menu-wrap"><button className="button secondary" onClick={() => setOpen((value) => !value)}><Download size={15} /> Copy & export <ChevronDown size={14} /></button>{open && <div className="action-menu export-menu">
    <span>Copy</span>
    <button onClick={() => { setOpen(false); copyText(sectionToText(client.name, result), notify); }}><Clipboard size={15} /> Readable text</button>
    <button onClick={() => { setOpen(false); copyText(sectionToMarkdown(client.name, result), notify); }}><Code2 size={15} /> Markdown</button>
    <button onClick={() => { setOpen(false); copyText(sectionToMarkdown(client.name, result, true), notify); }}><Sparkles size={15} /> For AI — sanitised</button>
    <button onClick={() => { setOpen(false); copyText(JSON.stringify(result.items, null, 2), notify); }}><FileJson size={15} /> Raw JSON</button>
    <hr /><span>Download</span>
    <button onClick={() => { setOpen(false); downloadFile(`${slug(client.name)}-${result.key}.csv`, sectionToCsv(result), 'text/csv'); }}><FileSpreadsheet size={15} /> CSV file</button>
    <button onClick={() => { setOpen(false); downloadFile(`${slug(client.name)}-${result.key}.json`, JSON.stringify(result, null, 2), 'application/json'); }}><FileJson size={15} /> JSON file</button>
  </div>}</div>;
}

function ConnectionModal({ client, mode, onClose, onSave }: { client: ClientWithConnection; mode: 'connect' | 'replace'; onClose: () => void; onSave: (connection: ConnectionRecord) => Promise<void> }) {
  const [domain, setDomain] = useState(client.connection?.domain ?? '');
  const [email, setEmail] = useState(client.connection?.email ?? '');
  const [authType, setAuthType] = useState<AuthType>(client.connection?.authType ?? 'api_token');
  const [credential, setCredential] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true); setError('');
    try {
      const result = await testAndEncrypt({ clientId: client.id, clientName: client.name, domain, email, authType, credential });
      await onSave({
        ...client.connection,
        id: client.connection?.id,
        clientId: client.id,
        clientName: client.name,
        externalId: `cxe-config:${client.id}`,
        domain: domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, ''),
        email: email.trim(),
        authType,
        credentialEnvelope: result.credentialEnvelope,
        enabled: true,
        status: 'connected',
        lastTestAt: result.testedAt,
        lastSyncAt: client.connection?.lastSyncAt ?? null,
        lastHttpStatus: result.httpStatus,
        lastError: null,
        credentialUpdatedAt: new Date().toISOString(),
        authVersion: 'v1'
      });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'The credential could not be tested.');
    } finally {
      setSubmitting(false);
    }
  };

  return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><form className="modal-card" onSubmit={submit}>
    <div className="modal-accent"><KeyRound size={22} /></div>
    <div className="modal-heading"><div><span className="eyebrow">{mode === 'replace' ? 'Secure credential rotation' : 'New connection'}</span><h2>{mode === 'replace' ? 'Replace credential' : `Connect ${client.name}`}</h2><p>{mode === 'replace' ? 'The saved credential remains intact unless this replacement passes the connection test.' : 'The credential is tested first, then encrypted before the envelope is stored in Zendesk.'}</p></div><button type="button" className="icon-button" onClick={onClose}><X size={18} /></button></div>
    <div className="modal-body">
      <label><span>Zendesk domain</span><div className="input-shell"><Building2 size={16} /><input required value={domain} onChange={(event) => setDomain(event.target.value)} placeholder="customer.zendesk.com" autoFocus /></div><small>Only domains ending in .zendesk.com are accepted.</small></label>
      <label><span>Authentication method</span><div className="segmented-control"><button type="button" className={authType === 'api_token' ? 'active' : ''} onClick={() => setAuthType('api_token')}>API token <em>Legacy</em></button><button type="button" className={authType === 'oauth' ? 'active' : ''} onClick={() => setAuthType('oauth')}>OAuth token</button></div></label>
      <label><span>API email</span><div className="input-shell"><Users size={16} /><input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="admin@customer.com" /></div></label>
      <label><span>{authType === 'api_token' ? 'API token' : 'OAuth access token'}</span><div className="input-shell"><LockKeyhole size={16} /><input required type="password" value={credential} onChange={(event) => setCredential(event.target.value)} placeholder="Enter credential" autoComplete="new-password" /></div></label>
      {authType === 'api_token' && <div className="legacy-note"><Clock3 size={17} /><div><strong>Legacy compatibility</strong><span>Zendesk Support API tokens are being retired. Use OAuth for new connections wherever possible.</span></div></div>}
      {error && <div className="form-error"><AlertCircle size={17} /><span>{error}</span></div>}
    </div>
    <div className="modal-footer"><span><ShieldCheck size={15} /> AES-256-GCM · key stored separately</span><div><button type="button" className="button ghost" onClick={onClose}>Cancel</button><button className="button primary" disabled={submitting}>{submitting ? <LoaderCircle className="spin" size={16} /> : <Wifi size={16} />} {submitting ? 'Testing securely…' : 'Test & connect'}</button></div></div>
  </form></div>;
}

function SystemPanel({ source, schema, onClose, onUpdate, notify }: { source: AppDataSource; schema: SchemaCheck; onClose: () => void; onUpdate: (schema: SchemaCheck) => void; notify: (message: string, tone?: ToastState['tone']) => void }) {
  const [repairing, setRepairing] = useState(false);
  const repair = async () => {
    setRepairing(true);
    try { const result = await source.repairSchema(); onUpdate(result); notify('Setup / Repair completed without replacing existing data.'); }
    catch (error) { notify(error instanceof Error ? error.message : 'Setup / Repair failed.', 'critical'); }
    finally { setRepairing(false); }
  };
  return <div className="sidepanel-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><aside className="system-panel"><div className="system-heading"><div className={`system-shield ${schema.ready ? 'ready' : 'issue'}`}>{schema.ready ? <ShieldCheck /> : <AlertCircle />}</div><div><span className="eyebrow">Schema health</span><h2>{schema.ready ? 'System ready' : 'Setup required'}</h2><p>{schema.ready ? 'App-owned resources are present and compatible.' : 'One or more required resources need attention.'}</p></div><button className="icon-button" onClick={onClose}><X size={18} /></button></div><div className="check-list">{schema.checks.map((check) => <div key={check.key} className={check.ok ? 'ok' : 'failed'}>{check.ok ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}<span><strong>{check.label}</strong>{check.detail && <small>{check.detail}</small>}</span></div>)}</div><div className="repair-note"><Layers3 size={19} /><div><strong>Additive and idempotent</strong><span>Setup / Repair creates only missing resources. It never deletes fields, replaces the object, or clears connection records.</span></div></div><div className="system-footer"><button className="button primary" disabled={repairing || !schema.canRepair} onClick={repair}>{repairing ? <LoaderCircle className="spin" size={16} /> : <Settings2 size={16} />} Run Setup / Repair</button>{!schema.canRepair && <small>Zendesk administrator access is required.</small>}</div></aside></div>;
}

function EmptyState({ icon, title, body, action }: { icon: ReactNode; title: string; body: string; action?: ReactNode }) {
  return <div className="empty-state"><div className="empty-art"><span>{icon}</span><i /><i /></div><h2>{title}</h2><p>{body}</p>{action}</div>;
}

function ErrorState({ icon = <AlertCircle />, title, body, action, tone = 'critical' }: { icon?: ReactNode; title: string; body: string; action?: ReactNode; tone?: 'critical' | 'neutral' }) {
  return <div className={`error-state ${tone}`}><div>{icon}</div><span className="eyebrow">Connection status</span><h2>{title}</h2><p>{body}</p>{action}</div>;
}

function StatusPill({ status }: { status: ConnectionStatus }) { const meta = statusMeta[status]; return <span className={`status-pill ${meta.tone}`}><i />{meta.label}</span>; }
function StatusDot({ status }: { status: ConnectionStatus }) { return <span className={`status-dot ${statusMeta[status].tone}`} title={statusMeta[status].label} />; }

function Toast({ state, onClose }: { state: ToastState; onClose: () => void }) {
  return <div className={`toast ${state.tone}`}>{state.tone === 'positive' ? <CheckCircle2 size={19} /> : state.tone === 'critical' ? <AlertCircle size={19} /> : <CircleHelp size={19} />}<span>{state.message}</span><button onClick={onClose}><X size={15} /></button></div>;
}

function sectionIcon(key: SectionKey, size = 18): ReactNode {
  const props = { size };
  if (['groups', 'agents'].includes(key)) return <Users {...props} />;
  if (['custom_objects', 'custom_object_fields'].includes(key)) return <Boxes {...props} />;
  if (['triggers', 'automations'].includes(key)) return <Zap {...props} />;
  if (key === 'help_centre') return <BookOpen {...props} />;
  if (key === 'brands') return <Building2 {...props} />;
  if (['ticket_forms', 'ticket_fields', 'user_fields', 'organization_fields'].includes(key)) return <Layers3 {...props} />;
  return <Database {...props} />;
}

function sectionLabel(key: SectionKey): string { return sectionDefinitions.find((section) => section.key === key)?.label ?? key; }
function initials(value: string): string { return value.split(/\s+/).slice(0, 2).map((word) => word[0]).join('').toUpperCase(); }
function slug(value: string): string { return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
function itemSubtitle(item: ConfigItem): string { const parts = [item.category, item.type, item.key, item.role, item.position ? `Position ${item.position}` : null].filter(Boolean); return parts.length ? parts.slice(0, 2).join(' · ') : `ID ${item.id ?? '—'}`; }

async function copyText(value: string, notify: (message: string, tone?: ToastState['tone']) => void) {
  try { await navigator.clipboard.writeText(value); notify('Copied to clipboard.'); }
  catch { notify('Clipboard access was blocked by the browser.', 'critical'); }
}

function copyFullForAI(client: ClientWithConnection, results: SyncResults, notify: (message: string, tone?: ToastState['tone']) => void) {
  const sections = Object.values(results).filter(Boolean) as SectionResult[];
  const content = ['# Zendesk Configuration', '', `**Client:** ${client.name}`, `**Generated:** ${new Date().toISOString().slice(0, 10)}`, '**Mode:** AI-sanitised', '', ...sections.flatMap((section) => [`# ${section.label}`, '', ...sanitizeForAI(section.items).flatMap((item) => [itemToMarkdown(item, 2), ''])])].join('\n');
  copyText(content, notify);
}

function exportFull(client: ClientWithConnection, results: SyncResults) {
  const safe = Object.fromEntries(Object.entries(results).map(([key, section]) => [key, section ? { ...section, items: section.items } : section]));
  downloadFile(`${slug(client.name)}-zendesk-config.json`, JSON.stringify({ client: { id: client.id, name: client.name, domain: client.connection?.domain }, exportedAt: new Date().toISOString(), sections: safe }, null, 2), 'application/json');
}
