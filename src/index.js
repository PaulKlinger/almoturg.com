export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // The two sprog PDFs are each ~45 MB, over Cloudflare's 25 MiB
    // per-file limit for Workers Static Assets, so they live in R2 and
    // are served from here at their usual URLs.
    if (url.pathname === "/sprog.pdf" || url.pathname === "/sprog_small.pdf") {
      const key = url.pathname.slice(1);
      const range = parseRange(request.headers.get("range"));
      const object = range
        ? await env.SPROG_PDFS.get(key, { range })
        : await env.SPROG_PDFS.get(key);
      if (!object) {
        return new Response("Not found", { status: 404 });
      }
      const headers = new Headers();
      object.writeHttpMetadata(headers);
      headers.set("etag", object.httpEtag);
      headers.set("content-type", "application/pdf");
      headers.set("accept-ranges", "bytes");
      if (object.range) {
        // R2 served a byte range: answer 206 Partial Content so PDF
        // viewers can seek instead of downloading the whole file
        // (and aborting it, which the Worker logged as an exception).
        const start = object.range.offset;
        const end = start + object.range.length - 1;
        headers.set("content-range", `bytes ${start}-${end}/${object.size}`);
        headers.set("content-length", String(object.range.length));
        return new Response(object.body, { status: 206, headers });
      }
      return new Response(object.body, { headers });
    }

    return env.ASSETS.fetch(request);
  },
};

// Parses "bytes=START-" and "bytes=START-END" (the forms PDF viewers
// send) into the { offset, length } shape the R2 binding accepts.
// Anything else returns null and the whole file is served with a 200.
function parseRange(header) {
  if (!header) return null;
  const m = /^bytes=(\d+)-(\d*)$/.exec(header.trim());
  if (!m) return null;
  const offset = Number(m[1]);
  const length = m[2] === "" ? undefined : Number(m[2]) - offset + 1;
  if (length !== undefined && length <= 0) return null;
  return length === undefined ? { offset } : { offset, length };
}
