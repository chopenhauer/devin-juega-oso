import { createPushCron } from './_push.js';
import { redisStore } from './_store.js';

const handle = createPushCron(
  redisStore(
    process.env.KV_REST_API_URL,
    process.env.KV_REST_API_TOKEN,
    `${process.env.VERCEL_ENV ?? 'development'}:`,
  ),
  {
    secret: process.env.CRON_SECRET,
    vapid: {
      publicKey: process.env.VAPID_PUBLIC_KEY,
      privateKey: process.env.VAPID_PRIVATE_KEY,
      subject: 'mailto:hola@juegaoso.com',
    },
  },
);

export const GET = handle;
