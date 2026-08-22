import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'child_process';
import { mkdtempSync, writeFileSync, readFileSync, rmSync, mkdirSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { setTimeout as sleep } from 'timers/promises';

const CLI_ENTRY = join(import.meta.dirname ?? '', '../../src/cli/index.ts');

interface WatchProcess {
  url: string;
  stop(): Promise<void>;
}

async function startWatchMode(inputDir: string, outputDir: string): Promise<WatchProcess> {
  const child = spawn(
    process.execPath,
    [
      '--import',
      'tsx',
      CLI_ENTRY,
      inputDir,
      '-o',
      outputDir,
      '--watch',
      '--port',
      '0',
      '--no-chat',
    ],
    { stdio: ['ignore', 'pipe', 'pipe'] }
  );

  let stdout = '';
  const url = await new Promise<string>((resolvePromise, rejectPromise) => {
    const deadline = Date.now() + 90_000;
    child.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString();
      const match = stdout.match(/http:\/\/127\.0\.0\.1:(\d+)/);
      if (match) resolvePromise(`http://127.0.0.1:${match[1]}`);
    });
    child.on('exit', () => rejectPromise(new Error(`CLI exited early:\n${stdout}`)));
    const tick = setInterval(() => {
      if (Date.now() > deadline) {
        clearInterval(tick);
        rejectPromise(new Error(`server never came up:\n${stdout}`));
      }
    }, 250);
  });

  return {
    url,
    stop: () =>
      new Promise<void>((done) => {
        child.kill('SIGTERM');
        child.on('exit', () => done());
        setTimeout(() => {
          child.kill('SIGKILL');
          done();
        }, 5000);
      }),
  };
}

test('watch mode serves the site and rebuilds when docs change', async () => {
  const base = mkdtempSync(join(tmpdir(), 'botdocs-watch-e2e-'));
  const inputDir = join(base, 'input');
  const outputDir = join(base, 'output');
  mkdirSync(inputDir, { recursive: true });
  writeFileSync(
    join(inputDir, 'README.md'),
    '---\ntitle: Watch Home\n---\n# Watch Home\n\nversion one\n'
  );

  const proc = await startWatchMode(inputDir, outputDir);
  try {
    const first = await fetch(`${proc.url}/`);
    assert.equal(first.status, 200);
    const firstHtml = await first.text();
    assert.match(firstHtml, /version one/);

    writeFileSync(
      join(inputDir, 'README.md'),
      '---\ntitle: Watch Home\n---\n# Watch Home\n\nversion two\n'
    );

    const deadline = Date.now() + 60_000;
    let rebuilt = false;
    while (Date.now() < deadline) {
      await sleep(500);
      try {
        const html = await (await fetch(`${proc.url}/`)).text();
        if (html.includes('version two')) {
          rebuilt = true;
          break;
        }
      } catch {
        // server restarting or transient error — keep polling
      }
    }
    assert.ok(rebuilt, 'site never picked up the edited markdown');

    const outHtml = readFileSync(join(outputDir, 'index.html'), 'utf-8');
    assert.match(outHtml, /version two/);
  } finally {
    await proc.stop();
    rmSync(base, { recursive: true, force: true });
  }
});
