import { BuildOptions, BotdocsConfig, defaultConfig } from '../types/config.js';
import { SiteGenerator } from './site-generator.js';
import { VectorDBBuilder } from './vector-db-builder.js';
import { existsSync, readFileSync, writeFileSync, copyFileSync } from 'fs';
import fs from 'fs-extra';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Main build orchestrator
 */
export async function build(options: BuildOptions): Promise<void> {
  const { inputDir, outputDir, chatEnabled, configPath, verbose } = options;

  // Validate input directory
  if (!existsSync(inputDir)) {
    throw new Error(`Input directory does not exist: ${inputDir}`);
  }

  // Load config
  const config = loadConfig(configPath, inputDir);

  // Override chat enabled setting if specified in CLI
  if (chatEnabled !== undefined) {
    config.chat = config.chat || {};
    config.chat.enabled = chatEnabled;
  }

  if (verbose) {
    console.log('Configuration:', JSON.stringify(config, null, 2));
  }

  // Prepare output directory
  fs.ensureDirSync(outputDir);
  if (verbose) {
    console.log(`Cleaning output directory: ${outputDir}`);
  }

  // Create site generator
  const generator = new SiteGenerator();

  // Generate site
  const documents = await generator.generate(inputDir, outputDir, config);

  // Create assets directories
  const assetsDir = join(outputDir, 'assets');
  fs.ensureDirSync(join(assetsDir, 'css'));
  fs.ensureDirSync(join(assetsDir, 'js'));

  if (verbose) {
    console.log(`Processed ${documents.length} documents`);
  }

  // Phase 2: Generate vector database (if chat enabled)
  if (config.chat?.enabled) {
    const vectorDBBuilder = new VectorDBBuilder({
      chunkSize: config.build?.chunkSize,
      chunkOverlap: config.build?.chunkOverlap,
    });

    await vectorDBBuilder.build(documents, outputDir, verbose);
  }

  // Phase 3: Build client-side code with Vite
  console.log('Building client-side code...');
  // From dist/src/builder, go up 3 levels to project root
  const projectRoot = resolve(__dirname, '../../..');

  try {
    // Skip rebuild if already built
    const distClientDir = join(projectRoot, 'dist-client');
    const bundleExists = existsSync(join(distClientDir, 'bundle.js'));

    if (!bundleExists) {
      await execAsync('npm run build:client', { cwd: projectRoot });
    }

    // Copy bundled JS files
    if (existsSync(distClientDir)) {
      const jsOutputDir = join(assetsDir, 'js');

      if (verbose) {
        console.log(`Copying client code from: ${distClientDir}`);
        console.log(`Copying to: ${jsOutputDir}`);
      }

      // Copy bundle.js
      const sourceBundlePath = join(distClientDir, 'bundle.js');
      if (existsSync(sourceBundlePath)) {
        copyFileSync(sourceBundlePath, join(jsOutputDir, 'bundle.js'));
      }

      // Copy bundle.js.map if exists
      const sourceMapPath = join(distClientDir, 'bundle.js.map');
      if (existsSync(sourceMapPath)) {
        copyFileSync(sourceMapPath, join(jsOutputDir, 'bundle.js.map'));
      }

      // Copy assets folder (for code-split chunks)
      const distAssetsDir = join(distClientDir, 'assets');
      if (existsSync(distAssetsDir)) {
        const outputAssetsDir = join(jsOutputDir, 'assets');
        fs.copySync(distAssetsDir, outputAssetsDir);
        if (verbose) {
          console.log('Copied code-split chunks');
        }
      }

      if (verbose) {
        console.log('Client code copy complete');
      }
    } else if (verbose) {
      console.log(`dist-client directory not found: ${distClientDir}`);
    }
  } catch (error) {
    console.warn('Client build skipped (run npm run build:client manually)');
    if (verbose) {
      console.error(error);
    }
  }

  // Phase 4: Copy styles
  console.log('Copying styles...');
  // From dist/src/builder, go to project root, then to src/styles
  const stylesDir = resolve(__dirname, '../../../src/styles');
  const outputCssDir = join(assetsDir, 'css');

  // Combine all CSS files into one bundle
  const cssFiles = ['main.css', 'themes.css', 'chat.css'];
  let bundledCss = '';

  for (const cssFile of cssFiles) {
    const cssPath = join(stylesDir, cssFile);
    if (existsSync(cssPath)) {
      bundledCss += readFileSync(cssPath, 'utf-8') + '\n\n';
    }
  }

  writeFileSync(join(outputCssDir, 'bundle.css'), bundledCss, 'utf-8');

  if (verbose) {
    console.log('Styles copied');
  }

  console.log('Site generation complete!');
}

/**
 * Load configuration from file or use defaults
 */
function loadConfig(
  configPath: string | undefined,
  inputDir: string
): BotdocsConfig {
  // Try explicit config path
  if (configPath && existsSync(configPath)) {
    return JSON.parse(readFileSync(configPath, 'utf-8'));
  }

  // Try default config in input directory
  const defaultConfigPath = join(inputDir, 'botdocs.config.json');
  if (existsSync(defaultConfigPath)) {
    return JSON.parse(readFileSync(defaultConfigPath, 'utf-8'));
  }

  // Use defaults
  return { ...defaultConfig };
}
