/**
 * Collapse markdown links and images down to their visible text. Used
 * where a doc-sourced snippet is about to be nested inside a link built
 * elsewhere, so a pre-existing `[text](url)` or badge image in the source
 * prose can't collide with the wrapping link.
 */
export function stripInlineLinks(text: string): string {
  // A single pass only unwraps the outermost link/image; a badge-style
  // image-inside-link (`[![alt](img-url)](link-url)`) leaves an inner
  // `![alt](img-url)` behind, so repeat until nothing changes.
  let result = text;
  let previous: string;
  do {
    previous = result;
    result = result.replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1');
  } while (result !== previous);
  return result;
}
