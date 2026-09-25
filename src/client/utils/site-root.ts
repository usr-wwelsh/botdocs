import { relativeUrl } from '../../shared/site-root.js';

export function fromSiteRoot(url: string): string {
  const root = document.querySelector<HTMLMetaElement>('meta[name="botdocs-root"]')?.content ?? '/';
  return relativeUrl(root, url);
}
