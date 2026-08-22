import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { setTimeout as sleep } from 'timers/promises';
import { watchDocs, WatchedChange } from './watcher.js';

function makeDocs(): string {
  const dir = mkdtempSync(join(tmpdir(), 'botdocs-watch-'));
  writeFileSync(join(dir, 'guide.md'), '# Guide\n');
  return dir;
}

function onceChanged(timeoutMs = 5000): {
  promise: Promise<WatchedChange[]>;
  onChange(changes: WatchedChange[]): void;
} {
  let resolvePromise: (changes: WatchedChange[]) => void = () => {};
  const promise = new Promise<WatchedChange[]>((res) => {
    resolvePromise = res;
  });
  return {
    promise: Promise.race([
      promise,
      sleep(timeoutMs).then(() => {
        throw new Error('watcher did not fire within timeout');
      }),
    ]),
    onChange: resolvePromise,
  };
}

test('fires debounced callback when a markdown file changes', async () => {
  const dir = makeDocs();
  try {
    const { promise, onChange } = onceChanged();
    const watcher = watchDocs(dir, onChange, 150);
    try {
      writeFileSync(join(dir, 'other.md'), '# Other\n');
      const changes = await promise;
      assert.ok(
        changes.some((c) => c.path.endsWith('other.md')),
        `expected other.md in ${JSON.stringify(changes)}`
      );
      assert.ok(changes.every((c) => c.path.endsWith('.md')));
    } finally {
      watcher.close();
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('fires when botdocs.config.json changes', async () => {
  const dir = makeDocs();
  try {
    const { promise, onChange } = onceChanged();
    const watcher = watchDocs(dir, onChange, 150);
    try {
      writeFileSync(join(dir, 'botdocs.config.json'), '{"title":"New"}');
      const changes = await promise;
      assert.ok(changes.some((c) => c.path.endsWith('botdocs.config.json')));
    } finally {
      watcher.close();
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('ignores changes to files that do not affect the build', async () => {
  const dir = makeDocs();
  try {
    let calls = 0;
    const watcher = watchDocs(dir, () => calls++, 150);
    try {
      writeFileSync(join(dir, 'notes.txt'), 'not docs');
      await sleep(600);
      assert.equal(calls, 0);
    } finally {
      watcher.close();
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('coalesces a burst of edits into one rebuild', async () => {
  const dir = makeDocs();
  try {
    let calls = 0;
    const watcher = watchDocs(dir, () => calls++, 300);
    try {
      for (let i = 0; i < 5; i++) {
        writeFileSync(join(dir, `page-${i}.md`), `# Page ${i}\n`);
      }
      await sleep(900);
      assert.ok(calls <= 2, `expected coalesced rebuilds, got ${calls}`);
    } finally {
      watcher.close();
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
