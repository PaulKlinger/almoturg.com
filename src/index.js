export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // The two sprog PDFs are each ~45 MB, over Cloudflare's 25 MiB
    // per-file limit for Workers Static Assets, so they live in R2 and
    // are served from here at their usual URLs.
    if (url.pathname === "/sprog.pdf" || url.pathname === "/sprog_small.pdf") {
      const object = await env.SPROG_PDFS.get(url.pathname.slice(1));
      if (!object) {
        return new Response("Not found", { status: 404 });
      }
      const headers = new Headers();
      object.writeHttpMetadata(headers);
      headers.set("etag", object.httpEtag);
      headers.set("content-type", "application/pdf");
      return new Response(object.body, { headers });
    }

    return env.ASSETS.fetch(request);
  },
};
