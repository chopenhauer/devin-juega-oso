import { createVisitHandler } from './_visita.js';
import { redisStore } from './_store.js';

const handle = createVisitHandler(
  redisStore(
    process.env.KV_REST_API_URL,
    process.env.KV_REST_API_TOKEN,
    `${process.env.VERCEL_ENV ?? 'development'}:`,
  ),
);

export const POST = handle;
