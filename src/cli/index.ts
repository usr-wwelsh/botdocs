import { Command } from 'commander';
import { build } from '../builder/index.js';
import { CliOptions, defaultOptions } from './options.js';
import { startServer } from './server.js';
import { watchDocs } from './watcher.js';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read package.json for version. Walks up from this file so it resolves
// both from dist/src/cli (installed) and src/cli (tsx).
function findPackageJson(startDir: string): string {
  let dir = startDir;
  while (dir !== dirname(dir)) {
    const candidate = resolve(dir, 'package.json');
    if (existsSync(candidate)) return candidate;
    dir = dirname(dir);
  }
  throw new Error('package.json not found');
}

const packageJson = JSON.parse(readFileSync(findPackageJson(__dirname), 'utf-8'));

const program = new Command();

program
  .name('botdocs')
  .description('Convert markdown documentation into a static website with AI chatbot')
  .version(packageJson.version)
  .argument('<input>', 'Input directory containing markdown files')
  .option('-o, --output <dir>', 'Output directory for generated site', defaultOptions.output)
  .option('--no-chat', 'Disable AI chatbot functionality')
  .option('-c, --config <file>', 'Path to config file (botdocs.config.json)')
  .option('-t, --theme <theme>', 'Theme to use (classic, material, minimal, slate, modern); overrides config file if set')
  .option('-v, --verbose', 'Enable verbose logging')
  .option('-w, --watch', 'Rebuild on changes and serve the site for live preview')
  .option('-p, --port <number>', 'Port for the preview server (with --watch)', parseInt)
  .action(async (input: string, options: CliOptions) => {
    const inputDir = resolve(process.cwd(), input);
    const outputDir = resolve(process.cwd(), options.output || defaultOptions.output!);
    const verbose = options.verbose || false;

    const runBuild = async () => {
      await build({
        inputDir,
        outputDir,
        chatEnabled: !options.noChat,
        configPath: options.config,
        verbose,
        theme: options.theme,
      });
    };

    try {
      if (verbose) {
        console.log('Botdocs starting...');
        console.log(`Input: ${inputDir}`);
        console.log(`Output: ${outputDir}`);
        console.log(`Chat enabled: ${!options.noChat}`);
        console.log(`Theme override: ${options.theme || '(none — using config file or default)'}`);
      }

      await runBuild();

      if (options.watch) {
        const server = await startServer(outputDir, options.port ?? defaultOptions.port!);
        console.log(`Site generated at: ${outputDir}`);
        console.log(`Preview at: ${server.url}`);
        console.log('Watching for changes... Press Ctrl+C to stop.');

        const watcher = watchDocs(inputDir, (changes) => {
          const names = [...new Set(changes.map((c) => c.path.split('/').pop()))].join(', ');
          console.log(`Changed: ${names} — rebuilding...`);
          runBuild().catch((error) => {
            console.error('Rebuild failed:', error);
          });
        });

        let shuttingDown = false;
        const shutdown = () => {
          if (shuttingDown) return;
          shuttingDown = true;
          watcher.close();
          server.close().finally(() => process.exit(0));
        };
        process.on('SIGINT', shutdown);
        process.on('SIGTERM', shutdown);
      } else {
        console.log('Build complete!');
        console.log(`Site generated at: ${outputDir}`);
      }
    } catch (error) {
      console.error('Build failed:', error);
      process.exit(1);
    }
  });

program.parse();
