/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');

const args = process.argv.slice(2);
const port = parseInt(args[args.indexOf('--port') + 1]) || 9201;
const target = args[args.indexOf('--target') + 1] || 'http://localhost:9200';

const BLOCKED_PATTERNS = [
  /^\/+([^/]+\/+)?_search\/*$/,
  /^\/+([^/]+\/+)?_msearch\/*$/,
  /^\/+_search\/+scroll(\/+.*)?\/*/,
  /^\/+([^/]+\/+)?_search\/+point_in_time(\/+.*)?\/*/,
  /^\/+[^/]+\/+_explain\/+.+$/,
  /^\/+([^/]+\/+)?_validate\/+query\/*/,
  /^\/+([^/]+\/+)?_count\/*/,
  /^\/+([^/]+\/+)?_async_search(\/+.*)?\/*/,
  /^\/+([^/]+\/+)?_rank_eval\/*/,
  /^\/+_cat\/+count(\/+.*)?\/*/,
  /^\/+[^/]+\/+_update(\/+.*)?\/*/,
  /^\/+[^/]+\/+_delete_by_query\/*/,
];

function isBlocked(pathname) {
  return BLOCKED_PATTERNS.some((re) => re.test(pathname));
}

const server = http.createServer((req, res) => {
  const pathname = req.url.split('?')[0];

  if (isBlocked(pathname)) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        error: {
          root_cause: [
            { type: 'blocked_by_proxy', reason: `API blocked: ${pathname}` },
          ],
          type: 'blocked_by_proxy',
          reason: `API blocked: ${pathname}`,
        },
        status: 500,
      })
    );
    console.log(`[BLOCKED] ${req.method} ${req.url}`);
    return;
  }

  const parsed = new URL(target);
  const mod = parsed.protocol === 'https:' ? https : http;
  const opts = {
    hostname: parsed.hostname,
    port: parsed.port,
    path: req.url,
    method: req.method,
    headers: req.headers,
    rejectUnauthorized: false,
  };
  opts.headers.host = `${parsed.hostname}:${parsed.port}`;

  const proxyReq = mod.request(opts, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        error: { type: 'proxy_error', reason: err.message },
        status: 502,
      })
    );
  });

  req.pipe(proxyReq);
});

server.listen(port, () => {
  console.log(`OpenSearch proxy listening on :${port} -> ${target}`);
  console.log(`Blocking ${BLOCKED_PATTERNS.length} API patterns`);
});
