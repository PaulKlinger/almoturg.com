# almoturg.com

Static site for almoturg.com — the landing page, the Poem_for_your_sprog
collection (`/sprog/`, with the collection PDFs and RSS feeds) and the
Goodreads library statistics app (`/bookstats/`, a client-side React app
with its bundled Goodreads export CSV).

## Setup

Same setup as paulklinger.com: static files in this repo, deployed with
Cloudflare Workers Static Assets (`wrangler.toml`, assets directory
`./content`), custom domain almoturg.com, DNS on Cloudflare.

## History

Mirrored from the Namecheap shared hosting on 2026-11-05, the day before
that hosting package (Value Plan, $55.88/yr) expired on 6 Nov 2026. The
domain itself is registered with NameCheap until 28 Oct 2027 and was kept;
only the hosting moved. All files are static — no server-side code.
