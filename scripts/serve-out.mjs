#!/usr/bin/env node
/**
 * Zero-dependency preview server for the static export in out/.
 *
 * It intentionally does not use `npx serve`: previewing a production build
 * should not need network access, especially when the point is to test offline
 * mode. Service workers only run on localhost or HTTPS, so this server binds
 * to 127.0.0.1 by default.
 */
import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(new URL("../out", import.meta.url)));
const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || "127.0.0.1";
const LOCAL_HOSTS = new Set(["127.0.0.1", "localhost", "::1"]);

if (!existsSync(join(ROOT, "index.html"))) {
  console.error("CarePath preview: out/ is missing. Run `npm run build` first.");
  process.exit(1);
}

const MIME = {
  ".css": "text/css; charset=utf-8",
  ".geojson": "application/geo+json; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".woff2": "font/woff2",
};

function isFile(file) {
  try {
    return statSync(file).isFile();
  } catch {
    return false;
  }
}

function isDirectory(file) {
  try {
    return statSync(file).isDirectory();
  } catch {
    return false;
  }
}

function safePath(pathname) {
  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return null;
  }
  if (decoded.includes("\0")) return null;

  const full = resolve(ROOT, decoded.replace(/^\/+/, ""));
  if (full !== ROOT && !full.startsWith(ROOT + sep)) return null;
  return full;
}

function sendFile(req, res, file, status = 200) {
  const stat = statSync(file);
  const isServiceWorker = file.endsWith(`${sep}sw.js`);
  const isHtml = extname(file).toLowerCase() === ".html";

  const headers = {
    "Content-Type": MIME[extname(file).toLowerCase()] || "application/octet-stream",
    "Content-Length": stat.size,
    "Cache-Control":
      isServiceWorker || isHtml ? "no-store" : "public, max-age=0, must-revalidate",
    "X-Content-Type-Options": "nosniff",
  };

  if (isServiceWorker) {
    headers["Service-Worker-Allowed"] = "/";
  }

  res.writeHead(status, headers);
  if (req.method === "HEAD") {
    res.end();
    return;
  }
  createReadStream(file).pipe(res);
}

function sendNotFound(req, res) {
  const fallback = join(ROOT, "404.html");
  if (isFile(fallback)) {
    sendFile(req, res, fallback, 404);
    return;
  }
  res.writeHead(404, {
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end("404 — الصفحة غير موجودة");
}

const server = createServer((req, res) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, {
      Allow: "GET, HEAD",
      "Content-Type": "text/plain; charset=utf-8",
    });
    res.end("Method Not Allowed");
    return;
  }

  let url;
  try {
    url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  } catch {
    res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Bad Request");
    return;
  }

  const { pathname, search } = url;

  // Directory-style route: /facility/ -> /facility/index.html
  if (pathname.endsWith("/")) {
    const file = safePath(`${pathname}index.html`);
    if (file && isFile(file)) {
      sendFile(req, res, file);
      return;
    }
    sendNotFound(req, res);
    return;
  }

  const file = safePath(pathname);

  if (file && isFile(file)) {
    sendFile(req, res, file);
    return;
  }

  // /facility -> /facility/ (preserve ?id=...), matching trailingSlash: true.
  if (file && isDirectory(file)) {
    res.writeHead(308, {
      Location: `${pathname}/${search}`,
      "Cache-Control": "no-store",
    });
    res.end();
    return;
  }

  sendNotFound(req, res);
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`CarePath preview: port ${PORT} is already in use. Try PORT=4173 npm run preview.`);
  } else {
    console.error("CarePath preview:", error);
  }
  process.exit(1);
});

server.listen(PORT, HOST, () => {
  const displayHost = LOCAL_HOSTS.has(HOST) ? "localhost" : HOST;
  console.log("");
  console.log("CarePath preview");
  console.log(`  URL:  http://${displayHost}:${PORT}`);
  console.log(`  Root: ${ROOT}`);
  console.log("");
  console.log("  Offline mode is active in this production build.");
  console.log("  Test it: open the URL, wait for the first load, then DevTools > Network > Offline and reload.");
  console.log("  Service workers require localhost or HTTPS; plain HTTP on a LAN IP will not work.");
  console.log("");

  if (!LOCAL_HOSTS.has(HOST)) {
    console.warn(
      `  Warning: HOST=${HOST} is not localhost. Browsers disable service workers on non-HTTPS origins.`
    );
    console.warn("");
  }
});

function shutdown() {
  server.close(() => process.exit(0));
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
