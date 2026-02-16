export type Theme = 'gitbook' | 'material' | 'minimal' | 'slate' | 'modern';

export interface CliOptions {
  output?: string;
  noChat?: boolean;
  config?: string;
  verbose?: boolean;
  theme?: Theme;
}

export const defaultOptions: Partial<CliOptions> = {
  output: 'output',
  noChat: false,
  verbose: false,
  theme: 'gitbook',
};
