export interface CliOptions {
  output?: string;
  noChat?: boolean;
  config?: string;
  verbose?: boolean;
}

export const defaultOptions: Partial<CliOptions> = {
  output: 'output',
  noChat: false,
  verbose: false,
};
