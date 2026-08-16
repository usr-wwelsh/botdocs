export type Theme = 'classic' | 'material' | 'minimal' | 'slate' | 'modern';

export interface BotdocsConfig {
  title?: string;
  description?: string;
  theme?: Theme;
  customCss?: string;
  attribution?: boolean;
  chat?: {
    enabled?: boolean;
    welcomeMessage?: string;
  };
  build?: {
    chunkSize?: number;
    chunkOverlap?: number;
    minChunkSize?: number;
    topK?: number;
    minScore?: number;
  };
}

export interface BuildOptions {
  inputDir: string;
  outputDir: string;
  chatEnabled: boolean;
  configPath?: string;
  verbose: boolean;
  theme?: Theme;
}

export const defaultConfig: BotdocsConfig = {
  title: 'Documentation',
  description: 'Project documentation',
  theme: 'classic',
  attribution: true,
  chat: {
    enabled: true,
    welcomeMessage: 'Ask me anything about the docs!',
  },
  build: {
    chunkSize: 500,
    chunkOverlap: 50,
    minChunkSize: 15,
    topK: 3,
    minScore: 0.5,
  },
};
