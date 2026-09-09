import fs from 'node:fs';
import path from 'node:path';

const appUrl = process.env.APP_URL?.trim().replace(/\/$/, '');
if (!appUrl) {
  throw new Error('APP_URL is required. Set it to the deployed HTTPS service URL.');
}

let parsedUrl;
try {
  parsedUrl = new URL(appUrl);
} catch {
  throw new Error('APP_URL must be a valid URL.');
}

if (parsedUrl.protocol !== 'https:' || parsedUrl.username || parsedUrl.password || parsedUrl.search || parsedUrl.hash) {
  throw new Error('APP_URL must be an HTTPS origin or base path without credentials, query parameters, or a fragment.');
}

const configPath = path.join(process.cwd(), 'zendesk', 'zcli.apps.config.json');
let existing = {};
if (fs.existsSync(configPath)) {
  existing = JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

const appIdFromEnvironment = process.env.ZENDESK_APP_ID ? Number(process.env.ZENDESK_APP_ID) : undefined;
if (process.env.ZENDESK_APP_ID && !Number.isSafeInteger(appIdFromEnvironment)) {
  throw new Error('ZENDESK_APP_ID must be an integer.');
}

const output = {
  ...existing,
  ...(appIdFromEnvironment ? { app_id: appIdFromEnvironment } : {}),
  parameters: {
    ...(existing.parameters ?? {}),
    service_url: appUrl
  }
};

fs.writeFileSync(configPath, `${JSON.stringify(output, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 });
console.log(`Configured Zendesk package for ${appUrl}`);
