import { parse } from 'yaml';
import type { DocumentMetadata } from '../types/document.js';

export interface FrontMatter {
  data: DocumentMetadata;
  content: string;
}

const BLOCK = /^---[ \t]*\r?\n(?:([\s\S]*?)\r?\n)?---[ \t]*(?:\r?\n|$)/;

export function parseFrontMatter(input: string): FrontMatter {
  const source = input.charCodeAt(0) === 0xfeff ? input.slice(1) : input;
  const match = BLOCK.exec(source);
  if (!match) return { data: {}, content: input };

  const parsed: unknown = parse(match[1] ?? '', { schema: 'core' });
  const data =
    parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as DocumentMetadata)
      : {};
  return { data, content: source.slice(match[0].length) };
}
