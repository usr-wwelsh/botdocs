import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { startServer } from './server.js';

function makeSite(): string {
  const root = mkdtempSync(join(tmpdir(), 'botdocs-server-'));
  writeFileSync(join(root, 'index.html'), '<html>home</html>');
  const css = join(root, 'assets', 'css');
  mkdirSync(css, { recursive: true });
  writeFileSync(join(css, 'bundle.css'), 'body {}');
  writeFileSync(join(root, 'data.json'), '{"ok":true}');
  return root;
}

test('server serves index.html at / with html content type', async () => {
  const root = makeSite();
  const server = await startServer(root);
  try {
    const res = await fetch(`${server.url}/`);
    assert.equal(res.status, 200);
    assert.match(res.headers.get('content-type') || '', /text\/html/);
    assert.equal(await res.text(), '<html>home</html>');
  } finally {
    await server.close();
    rmSync(root, { recursive: true, force: true });
  }
});

test('server serves nested assets with correct content types', async () => {
  const root = makeSite();
  const server = await startServer(root);
  try {
    const css = await fetch(`${server.url}/assets/css/bundle.css`);
    assert.equal(css.status, 200);
    assert.match(css.headers.get('content-type') || '', /text\/css/);

    const json = await fetch(`${server.url}/data.json`);
    assert.equal(json.status, 200);
    assert.match(json.headers.get('content-type') || '', /application\/json/);
  } finally {
    await server.close();
    rmSync(root, { recursive: true, force: true });
  }
});

test('server returns 404 for missing paths', async () => {
  const root = makeSite();
  const server = await startServer(root);
  try {
    const res = await fetch(`${server.url}/nope.html`);
    assert.equal(res.status, 404);
  } finally {
    await server.close();
    rmSync(root, { recursive: true, force: true });
  }
});

test('server blocks path traversal outside the site root', async () => {
  const root = makeSite();
  const secret = join(tmpdir(), `botdocs-secret-${Date.now()}.txt`);
  writeFileSync(secret, 'secret');
  const server = await startServer(root);
  try {
    for (const attempt of [
      `${server.url}/../${secret.split('/').pop()}`,
      `${server.url}/%2e%2e/${secret.split('/').pop()}`,
      `${server.url}/..%2f..%2fetc%2fpasswd`,
    ]) {
      const res = await fetch(attempt);
      assert.ok(res.status === 403 || res.status === 404, `expected block for ${attempt}`);
      assert.notEqual(await res.text(), 'secret');
    }
  } finally {
    await server.close();
    rmSync(root, { recursive: true, force: true });
    rmSync(secret, { force: true });
  }
});

test('close stops the server', async () => {
  const root = makeSite();
  const server = await startServer(root);
  const url = server.url;
  await server.close();
  await assert.rejects(() => fetch(url), Error);
  rmSync(root, { recursive: true, force: true });
});
