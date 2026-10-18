import { createLabHandler } from './_lab.js';
import { redisStore } from './_store.js';

const handle = createLabHandler(
  redisStore(
    process.env.KV_REST_API_URL,
    process.env.KV_REST_API_TOKEN,
    `${process.env.VERCEL_ENV ?? 'development'}:`,
  ),
  { password: process.env.LAB_PASSWORD },
);

export const GET = handle;
export const POST = handle;
