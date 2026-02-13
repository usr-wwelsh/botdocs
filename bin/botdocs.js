#!/usr/bin/env node

import('../dist/src/cli/index.js').catch((err) => {
  console.error('Failed to load botdocs CLI:', err);
  process.exit(1);
});
