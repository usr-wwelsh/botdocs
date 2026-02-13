import { Command } from 'commander';
import { build } from '../builder/index.js';
import { CliOptions, defaultOptions } from './options.js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read package.json for version
// From dist/src/cli/index.js, go up 3 levels to project root
const packageJson = JSON.parse(
  readFileSync(resolve(__dirname, '../../../package.json'), 'utf-8')
);

const program = new Command();

program
  .name('botdocs')
  .description('Convert markdown documentation into a static website with AI chatbot')
  .version(packageJson.version)
  .argument('<input>', 'Input directory containing markdown files')
  .option('-o, --output <dir>', 'Output directory for generated site', defaultOptions.output)
  .option('--no-chat', 'Disable AI chatbot functionality')
  .option('-c, --config <file>', 'Path to config file (botdocs.config.json)')
  .option('-v, --verbose', 'Enable verbose logging')
  .action(async (input: string, options: CliOptions) => {
    try {
      const inputDir = resolve(process.cwd(), input);
      const outputDir = resolve(process.cwd(), options.output || defaultOptions.output!);

      if (options.verbose) {
        console.log('Botdocs starting...');
        console.log(`Input: ${inputDir}`);
        console.log(`Output: ${outputDir}`);
        console.log(`Chat enabled: ${!options.noChat}`);
      }

      await build({
        inputDir,
        outputDir,
        chatEnabled: !options.noChat,
        configPath: options.config,
        verbose: options.verbose || false,
      });

      console.log('Build complete!');
      console.log(`Site generated at: ${outputDir}`);
    } catch (error) {
      console.error('Build failed:', error);
      process.exit(1);
    }
  });

program.parse();
