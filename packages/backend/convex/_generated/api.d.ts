/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as _helpers_apiSecrets from "../_helpers/apiSecrets.js";
import type * as _helpers_auth from "../_helpers/auth.js";
import type * as _helpers_cryptoEnvelope from "../_helpers/cryptoEnvelope.js";
import type * as _helpers_featureFlag from "../_helpers/featureFlag.js";
import type * as _helpers_log from "../_helpers/log.js";
import type * as _helpers_rateLimit from "../_helpers/rateLimit.js";
import type * as _helpers_requestId from "../_helpers/requestId.js";
import type * as _helpers_stripeBookingRest from "../_helpers/stripeBookingRest.js";
import type * as _helpers_stripeWebhook from "../_helpers/stripeWebhook.js";
import type * as adminMcp from "../adminMcp.js";
import type * as crons from "../crons.js";
import type * as extensionAuth from "../extensionAuth.js";
import type * as http from "../http.js";
import type * as marketplaces from "../marketplaces.js";
import type * as notifications from "../notifications.js";
import type * as reservedSlugs from "../reservedSlugs.js";
import type * as scheduling_antiAbuse from "../scheduling/antiAbuse.js";
import type * as scheduling_availability from "../scheduling/availability.js";
import type * as scheduling_availableSlots from "../scheduling/availableSlots.js";
import type * as scheduling_booking from "../scheduling/booking.js";
import type * as scheduling_bookingAdmin from "../scheduling/bookingAdmin.js";
import type * as scheduling_calcomAdmin from "../scheduling/calcomAdmin.js";
import type * as scheduling_calcomIdMaps from "../scheduling/calcomIdMaps.js";
import type * as scheduling_calcomUsers from "../scheduling/calcomUsers.js";
import type * as scheduling_caldavCalendar from "../scheduling/caldavCalendar.js";
import type * as scheduling_calendarCredentialsRead from "../scheduling/calendarCredentialsRead.js";
import type * as scheduling_calendarOauth from "../scheduling/calendarOauth.js";
import type * as scheduling_calendarService from "../scheduling/calendarService.js";
import type * as scheduling_eventTypes from "../scheduling/eventTypes.js";
import type * as scheduling_freebusy from "../scheduling/freebusy.js";
import type * as scheduling_googleCalendar from "../scheduling/googleCalendar.js";
import type * as scheduling_googleOAuth from "../scheduling/googleOAuth.js";
import type * as scheduling_holds from "../scheduling/holds.js";
import type * as scheduling_lottery from "../scheduling/lottery.js";
import type * as scheduling_notify from "../scheduling/notify.js";
import type * as scheduling_payments from "../scheduling/payments.js";
import type * as scheduling_polls from "../scheduling/polls.js";
import type * as scheduling_publicApi from "../scheduling/publicApi.js";
import type * as scheduling_reminders from "../scheduling/reminders.js";
import type * as scheduling_schedules from "../scheduling/schedules.js";
import type * as scheduling_sync from "../scheduling/sync.js";
import type * as webhooks from "../webhooks.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "_helpers/apiSecrets": typeof _helpers_apiSecrets;
  "_helpers/auth": typeof _helpers_auth;
  "_helpers/cryptoEnvelope": typeof _helpers_cryptoEnvelope;
  "_helpers/featureFlag": typeof _helpers_featureFlag;
  "_helpers/log": typeof _helpers_log;
  "_helpers/rateLimit": typeof _helpers_rateLimit;
  "_helpers/requestId": typeof _helpers_requestId;
  "_helpers/stripeBookingRest": typeof _helpers_stripeBookingRest;
  "_helpers/stripeWebhook": typeof _helpers_stripeWebhook;
  adminMcp: typeof adminMcp;
  crons: typeof crons;
  extensionAuth: typeof extensionAuth;
  http: typeof http;
  marketplaces: typeof marketplaces;
  notifications: typeof notifications;
  reservedSlugs: typeof reservedSlugs;
  "scheduling/antiAbuse": typeof scheduling_antiAbuse;
  "scheduling/availability": typeof scheduling_availability;
  "scheduling/availableSlots": typeof scheduling_availableSlots;
  "scheduling/booking": typeof scheduling_booking;
  "scheduling/bookingAdmin": typeof scheduling_bookingAdmin;
  "scheduling/calcomAdmin": typeof scheduling_calcomAdmin;
  "scheduling/calcomIdMaps": typeof scheduling_calcomIdMaps;
  "scheduling/calcomUsers": typeof scheduling_calcomUsers;
  "scheduling/caldavCalendar": typeof scheduling_caldavCalendar;
  "scheduling/calendarCredentialsRead": typeof scheduling_calendarCredentialsRead;
  "scheduling/calendarOauth": typeof scheduling_calendarOauth;
  "scheduling/calendarService": typeof scheduling_calendarService;
  "scheduling/eventTypes": typeof scheduling_eventTypes;
  "scheduling/freebusy": typeof scheduling_freebusy;
  "scheduling/googleCalendar": typeof scheduling_googleCalendar;
  "scheduling/googleOAuth": typeof scheduling_googleOAuth;
  "scheduling/holds": typeof scheduling_holds;
  "scheduling/lottery": typeof scheduling_lottery;
  "scheduling/notify": typeof scheduling_notify;
  "scheduling/payments": typeof scheduling_payments;
  "scheduling/polls": typeof scheduling_polls;
  "scheduling/publicApi": typeof scheduling_publicApi;
  "scheduling/reminders": typeof scheduling_reminders;
  "scheduling/schedules": typeof scheduling_schedules;
  "scheduling/sync": typeof scheduling_sync;
  webhooks: typeof webhooks;
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
