import { createServer, IncomingMessage, ServerResponse } from 'http';
import { promises as fs } from 'fs';
import { join, resolve, sep, extname } from 'path';

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

export interface RunningServer {
  url: string;
  port: number;
  close(): Promise<void>;
}

export async function startServer(rootDir: string, port = 0): Promise<RunningServer> {
  const root = resolve(rootDir);

  const server = createServer((req, res) => {
    handleRequest(req, res, root).catch(() => {
      respond(res, 500, 'text/plain; charset=utf-8', 'Internal server error');
    });
  });

  return new Promise((resolveStart, rejectStart) => {
    server.once('error', rejectStart);
    server.listen(port, '127.0.0.1', () => {
      const address = server.address();
      const actualPort = typeof address === 'object' && address ? address.port : port;
      resolveStart({
        url: `http://127.0.0.1:${actualPort}`,
        port: actualPort,
        close: () => new Promise<void>((done) => server.close(() => done())),
      });
    });
  });
}

async function handleRequest(
  req: IncomingMessage,
  res: ServerResponse,
  root: string
): Promise<void> {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    respond(res, 405, 'text/plain; charset=utf-8', 'Method not allowed');
    return;
  }

  let urlPath: string;
  try {
    urlPath = decodeURIComponent(new URL(req.url ?? '/', 'http://localhost').pathname);
  } catch {
    respond(res, 400, 'text/plain; charset=utf-8', 'Bad request');
    return;
  }

  // Complete mediation: every request resolves inside the site root or it
  // never touches the filesystem.
  const filePath = resolve(root, `.${sep}${urlPath}`);
  if (filePath !== root && !filePath.startsWith(root + sep)) {
    respond(res, 403, 'text/plain; charset=utf-8', 'Forbidden');
    return;
  }

  let target = filePath;
  try {
    const stat = await fs.stat(target);
    if (stat.isDirectory()) {
      target = join(target, 'index.html');
    }
    const body = await fs.readFile(target);
    respond(res, 200, MIME_TYPES[extname(target).toLowerCase()] ?? 'application/octet-stream', body);
  } catch {
    respond(res, 404, 'text/plain; charset=utf-8', 'Not found');
  }
}

function respond(res: ServerResponse, status: number, contentType: string, body: string | Buffer): void {
  res.writeHead(status, { 'Content-Type': contentType });
  res.end(body);
}
