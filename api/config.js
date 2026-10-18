import { createConfigHandler } from './_lab.js';
import { redisStore } from './_store.js';

const handle = createConfigHandler(
  redisStore(
    process.env.KV_REST_API_URL,
    process.env.KV_REST_API_TOKEN,
    `${process.env.VERCEL_ENV ?? 'development'}:`,
  ),
);

export const GET = handle;
