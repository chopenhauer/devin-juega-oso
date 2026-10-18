import { createLabDataHandler } from './_labdata.js';

const account = process.env.GA4_SERVICE_ACCOUNT_JSON;

export const GET = createLabDataHandler({
  password: process.env.LAB_PASSWORD,
  account: account ? JSON.parse(account) : null,
});
