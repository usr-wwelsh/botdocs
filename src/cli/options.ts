export type Theme = 'classic' | 'material' | 'minimal' | 'slate' | 'modern';

export interface CliOptions {
  output?: string;
  noChat?: boolean;
  config?: string;
  verbose?: boolean;
  theme?: Theme;
  watch?: boolean;
  port?: number;
}

export const defaultOptions: Partial<CliOptions> = {
  output: 'output',
  noChat: false,
  verbose: false,
  watch: false,
  port: 3000,
};
