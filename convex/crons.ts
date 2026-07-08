import { cronJobs } from 'convex/server';
import { internal } from './_generated/api';

const crons = cronJobs();

// 8 AM UTC+8 (Singapore / Malaysia / HK) = 00:00 UTC
crons.daily(
  'follow-up-reminders',
  { hourUTC: 0, minuteUTC: 0 },
  internal.notifications.checkFollowUpsAndNotify,
);

// Purge accounts whose 30-day deletion grace period has elapsed
crons.daily(
  'purge-expired-account-deletions',
  { hourUTC: 1, minuteUTC: 0 },
  internal.users.purgeExpiredDeletions,
);

export default crons;
