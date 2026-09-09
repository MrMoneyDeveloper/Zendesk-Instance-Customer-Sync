/// <reference types="vite/client" />

interface Window {
  ZAFClient?: {
    init: () => ZafClient;
  };
}

interface ZafClient {
  get(path: string): Promise<Record<string, unknown>>;
  invoke(path: string, ...args: unknown[]): Promise<unknown>;
  request(options: string | Record<string, unknown>): Promise<unknown>;
}
