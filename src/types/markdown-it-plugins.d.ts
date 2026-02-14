// Type declarations for markdown-it plugins without official @types packages

declare module 'markdown-it-task-lists' {
  import MarkdownIt from 'markdown-it';
  interface TaskListsOptions {
    enabled?: boolean;
    label?: boolean;
    labelAfter?: boolean;
  }
  const taskLists: (md: MarkdownIt, options?: TaskListsOptions) => void;
  export default taskLists;
}

declare module 'markdown-it-footnote' {
  import MarkdownIt from 'markdown-it';
  const footnote: (md: MarkdownIt) => void;
  export default footnote;
}

declare module 'markdown-it-emoji' {
  import MarkdownIt from 'markdown-it';
  const plugin: (md: MarkdownIt) => void;
  export const full: typeof plugin;
  export const light: typeof plugin;
  export const bare: typeof plugin;
}

declare module 'markdown-it-sub' {
  import MarkdownIt from 'markdown-it';
  const sub: (md: MarkdownIt) => void;
  export default sub;
}

declare module 'markdown-it-sup' {
  import MarkdownIt from 'markdown-it';
  const sup: (md: MarkdownIt) => void;
  export default sup;
}

declare module 'markdown-it-github-alerts' {
  import MarkdownIt from 'markdown-it';
  const alerts: (md: MarkdownIt) => void;
  export default alerts;
}
