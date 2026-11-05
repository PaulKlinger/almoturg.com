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
      if (range) {
        // The request asked for a byte range: answer 206 Partial
        // Content. (Decide on the request's Range header, not on
        // object.range — R2 reports the full range there even for a
        // whole-file get, which used to turn every response into a 206.)
        const served = object.range || {
          offset: range.offset,
          length: range.length === undefined ? object.size - range.offset : range.length,
        };
        const start = served.offset;
        const end = start + served.length - 1;
        headers.set("content-range", `bytes ${start}-${end}/${object.size}`);
        headers.set("content-length", String(served.length));
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
