// Vercel Routing Middleware. Links to a room (/?sala=…) get public/sala.html: the same page with
// the invite share card, because WhatsApp and other apps only read the HTML. It has to be
// middleware: Vercel serves index.html for / before looking at the rewrites in vercel.json.
export const config = { matcher: '/' };

export default function middleware(request) {
  const url = new URL(request.url);
  if (!url.searchParams.has('sala')) return undefined;
  url.pathname = '/sala';
  return new Response(null, { headers: { 'x-middleware-rewrite': url.href } });
}
