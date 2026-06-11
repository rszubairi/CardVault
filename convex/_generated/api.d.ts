/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 */

import type { ApiFromModules, FilterApi, FunctionReference } from 'convex/server';
import type * as contacts from '../contacts.js';
import type * as events from '../events.js';
import type * as interactions from '../interactions.js';
import type * as notes from '../notes.js';
import type * as subscriptions from '../subscriptions.js';
import type * as users from '../users.js';

type Mods = typeof import('../_generated/api');
export type API = ApiFromModules<{
  contacts: typeof contacts;
  events: typeof events;
  interactions: typeof interactions;
  notes: typeof notes;
  subscriptions: typeof subscriptions;
  users: typeof users;
}>;

declare const fullApi: FilterApi<typeof fullApiWithMounts, FunctionReference<any, 'public'>>;
declare const fullApiWithMounts: API;

export declare const api: typeof fullApi;
export declare const internal: FilterApi<typeof fullApiWithMounts, FunctionReference<any, 'internal'>>;
