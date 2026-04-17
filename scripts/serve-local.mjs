import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";

const ROOT_DIR = process.cwd();
const SITE_DIR = path.join(ROOT_DIR, "site");
const PORT = Number(process.env.PORT || 8787);

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8"
};

function isSafePath(basePath, candidatePath) {
  const relative = path.relative(basePath, candidatePath);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

async function sendFile(response, filePath) {
  const buffer = await fs.readFile(filePath);
  response.writeHead(200, {
    "content-type": MIME_TYPES[path.extname(filePath)] || "application/octet-stream; charset=utf-8",
    "cache-control": "no-cache"
  });
  response.end(buffer);
}

async function handler(request, response) {
  try {
    const requestUrl = new URL(request.url || "/", `http://${request.headers.host}`);
    const pathname = decodeURIComponent(requestUrl.pathname);

    if (pathname === "/catalogo-media.md") {
      await sendFile(response, path.join(ROOT_DIR, "catalogo-media.md"));
      return;
    }

    const sitePath = pathname === "/" ? "/index.html" : pathname;
    const candidatePath = path.join(SITE_DIR, sitePath);

    if (!isSafePath(SITE_DIR, candidatePath)) {
      response.writeHead(403, { "content-type": "text/plain; charset=utf-8" });
      response.end("Forbidden");
      return;
    }

    await sendFile(response, candidatePath);
  } catch {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
}

http.createServer(handler).listen(PORT, "127.0.0.1", () => {
  console.log(`Sito catalogo disponibile su http://127.0.0.1:${PORT}`);
});
