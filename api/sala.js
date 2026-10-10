import { createHandler } from './_sala.js';
import { redisStore } from './_store.js';

const handle = createHandler(
  redisStore(
    process.env.KV_REST_API_URL,
    process.env.KV_REST_API_TOKEN,
    `${process.env.VERCEL_ENV ?? 'development'}:`,
  ),
);

export const GET = handle;
export const POST = handle;
