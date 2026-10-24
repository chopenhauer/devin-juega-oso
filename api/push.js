import { createPushHandler } from './_push.js';
import { redisStore } from './_store.js';

const handle = createPushHandler(
  redisStore(
    process.env.KV_REST_API_URL,
    process.env.KV_REST_API_TOKEN,
    `${process.env.VERCEL_ENV ?? 'development'}:`,
  ),
  { publicKey: process.env.VAPID_PUBLIC_KEY },
);

export const GET = handle;
export const POST = handle;
