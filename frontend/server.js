/**
 * Temporary placeholder for the Next.js frontend.
 *
 * Block A ships only the NestJS backend foundation; the supervisor is wired to
 * run a `frontend` process on port 3000, so we run this tiny zero-dependency
 * Node server to keep supervisor happy and give the user a visible status page.
 *
 * Block D replaces this file with `next dev`.
 */

const http = require('http');

const PORT = Number(process.env.PORT) || 3000;

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>LearnDeck — Backend Foundation Online</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;background:#0a0a0f;color:#e8e8f0;min-height:100vh;display:grid;place-items:center;padding:2rem}
    main{max-width:640px;width:100%}
    .badge{display:inline-block;padding:.35rem .75rem;border:1px solid #f59e0b;color:#f59e0b;border-radius:999px;font-size:.75rem;letter-spacing:.1em;text-transform:uppercase;margin-bottom:1.5rem}
    h1{font-size:clamp(1.75rem,4vw,2.5rem);font-weight:600;letter-spacing:-.02em;line-height:1.1;margin-bottom:1rem}
    h1 span{color:#f59e0b}
    p{color:#a8a8b8;line-height:1.6;margin-bottom:1.25rem;font-family:ui-sans-serif,system-ui,sans-serif}
    ul{list-style:none;padding:0;margin:1.5rem 0}
    li{padding:.6rem 0;border-bottom:1px solid #1f1f2e;font-size:.9rem;display:flex;justify-content:space-between;align-items:center;gap:1rem}
    li:last-child{border:0}
    li code{color:#8be9fd;font-size:.85rem}
    li .ok{color:#50fa7b;font-size:.75rem}
    li .pending{color:#6272a4;font-size:.75rem}
    a{color:#8be9fd;text-decoration:none}
    a:hover{text-decoration:underline}
    footer{margin-top:2rem;padding-top:1.5rem;border-top:1px solid #1f1f2e;color:#6272a4;font-size:.8rem;font-family:ui-sans-serif,system-ui,sans-serif}
  </style>
</head>
<body>
  <main>
    <span class="badge">Phase 2 · Block A</span>
    <h1>Backend foundation <span>online.</span></h1>
    <p>The NestJS 11 API is running on port 8001 with Helmet, Pino logging, strict validation, structured errors, throttling, and a Gemini AI adapter wired behind a provider-agnostic interface.</p>
    <p>Frontend (Next.js 15) lands in <strong>Execution Block D</strong>.</p>
    <ul>
      <li><code>GET&nbsp;&nbsp;/api</code><span class="ok">READY</span></li>
      <li><code>GET&nbsp;&nbsp;/api/health</code><span class="ok">READY</span></li>
      <li><code>GET&nbsp;&nbsp;/api/docs</code><span class="ok">READY</span></li>
      <li><code>GET&nbsp;&nbsp;/api/ai/ping</code><span class="ok">READY</span></li>
      <li><code>POST /api/ai/generate</code><span class="ok">READY · needs GEMINI_API_KEY</span></li>
      <li><code>POST /api/auth/*</code><span class="pending">BLOCK B</span></li>
      <li><code>*** /api/courses,flashcards,notes,...</code><span class="pending">BLOCK C</span></li>
    </ul>
    <footer>LearnDeck · NestJS 11 · Mongoose 8 · Next.js 15 · Gemini · Jitsi</footer>
  </main>
</body>
</html>`;

const server = http.createServer((req, res) => {
  if (req.url === '/healthz') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', placeholder: true }));
    return;
  }
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
});

server.listen(PORT, '0.0.0.0', () => {
  // eslint-disable-next-line no-console
  console.log(`[frontend-placeholder] listening on http://0.0.0.0:${PORT}`);
});
