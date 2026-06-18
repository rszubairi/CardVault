/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as contacts from "../contacts.js";
import type * as crons from "../crons.js";
import type * as enrichment from "../enrichment.js";
import type * as events from "../events.js";
import type * as http from "../http.js";
import type * as interactions from "../interactions.js";
import type * as notes from "../notes.js";
import type * as notifications from "../notifications.js";
import type * as ocr from "../ocr.js";
import type * as organizations from "../organizations.js";
import type * as subscriptions from "../subscriptions.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  contacts: typeof contacts;
  crons: typeof crons;
  enrichment: typeof enrichment;
  events: typeof events;
  http: typeof http;
  interactions: typeof interactions;
  notes: typeof notes;
  notifications: typeof notifications;
  ocr: typeof ocr;
  organizations: typeof organizations;
  subscriptions: typeof subscriptions;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
