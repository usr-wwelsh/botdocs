export function rootPrefix(pageUrl: string): string {
  const depth = pageUrl.split('/').length - 2;
  return depth <= 0 ? './' : '../'.repeat(depth);
}

export function relativeUrl(root: string, url: string): string {
  if (!url.startsWith('/') || url.startsWith('//')) return url;
  return root + (url === '/' ? 'index.html' : url.slice(1));
}
