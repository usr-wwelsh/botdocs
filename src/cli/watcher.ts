import { FSWatcher, watch } from 'fs';

export interface WatchedChange {
  path: string;
}

export interface DocWatcher {
  close(): void;
}

const WATCHED_EXTENSIONS = ['.md', '.markdown'];
const WATCHED_FILES = ['botdocs.config.json'];

function isWatchedPath(path: string): boolean {
  if (WATCHED_EXTENSIONS.some((ext) => path.endsWith(ext))) return true;
  return WATCHED_FILES.some((file) => path === file || path.endsWith(`/${file}`));
}

export function watchDocs(
  inputDir: string,
  onChange: (changes: WatchedChange[]) => void,
  debounceMs = 300
): DocWatcher {
  let pending = new Map<string, WatchedChange>();
  let timer: NodeJS.Timeout | undefined;

  const flush = () => {
    timer = undefined;
    const changes = [...pending.values()];
    pending = new Map();
    if (changes.length > 0) {
      onChange(changes);
    }
  };

  const schedule = (path: string) => {
    pending.set(path, { path });
    if (!timer) {
      timer = setTimeout(flush, debounceMs);
    }
  };

  const watcher: FSWatcher = watch(
    inputDir,
    { recursive: true },
    (_eventType, filename) => {
      const path = filename ?? '';
      // Some platforms report no filename — treat as a full rebuild trigger.
      if (!path || isWatchedPath(path)) {
        schedule(path);
      }
    }
  );

  return {
    close: () => {
      if (timer) clearTimeout(timer);
      watcher.close();
    },
  };
}
