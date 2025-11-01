/**
 * Type definitions for Cloudflare Pages Functions
 */

export interface PagesFunctionContext<Env = any> {
  request: Request;
  env: Env;
  params: Record<string, string>;
  waitUntil?: (promise: Promise<any>) => void;
  next?: () => Promise<Response>;
  data?: any;
}

