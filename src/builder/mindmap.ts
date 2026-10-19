interface MindNode {
  text: string;
  children: MindNode[];
  w: number;
  x: number;
  y: number;
  color: string;
}

const NODE_H = 32;
const V_GAP = 12;
const H_GAP = 48;
const PAD = 16;
const CHAR_W = 7.6;
const SHAPED = /^[^\s()[\]{}]*(?:\(\(|\)\)|\{\{|\(|\[)(.*?)(?:\)\)|\(\(|\}\}|\)|\])$/;

const escapeXml = (text: string): string =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const labelOf = (raw: string): string => {
  const text = (SHAPED.exec(raw)?.[1] ?? raw).trim().replace(/^"(.*)"$/, '$1');
  return text.replace(/<br\s*\/?>/gi, ' ');
};

const parse = (source: string): MindNode => {
  const lines = source.replace(/\t/g, '    ').split('\n').filter((line) => line.trim());
  if (lines.shift()?.trim() !== 'mindmap') throw new Error('not a mindmap');
  let root: MindNode | null = null;
  const stack: { indent: number; node: MindNode }[] = [];
  for (const line of lines) {
    const raw = line.trim();
    if (raw.startsWith('::')) continue;
    const text = labelOf(raw);
    const node: MindNode = { text, children: [], w: text.length * CHAR_W + 24, x: 0, y: 0, color: '' };
    const indent = line.length - line.trimStart().length;
    while (stack.length && stack[stack.length - 1].indent >= indent) stack.pop();
    if (stack.length) stack[stack.length - 1].node.children.push(node);
    else if (root) throw new Error('mindmap has more than one root');
    else root = node;
    stack.push({ indent, node });
  }
  if (!root) throw new Error('mindmap has no nodes');
  return root;
};

const leaves = (node: MindNode): number =>
  node.children.length ? node.children.reduce((sum, child) => sum + leaves(child), 0) : 1;

const extent = (node: MindNode): number =>
  Math.max(
    NODE_H + V_GAP,
    node.children.reduce((sum, child) => sum + extent(child), 0)
  );

const columnWidths = (nodes: MindNode[], widths: number[] = [], depth = 0): number[] => {
  for (const node of nodes) {
    widths[depth] = Math.max(widths[depth] ?? 0, node.w);
    columnWidths(node.children, widths, depth + 1);
  }
  return widths;
};

const place = (nodes: MindNode[], dir: 1 | -1, edge: number, top: number, widths: number[], depth = 0): void => {
  let cursor = top;
  for (const node of nodes) {
    const span = extent(node);
    const childSpan = node.children.reduce((sum, child) => sum + extent(child), 0);
    node.y = cursor + span / 2;
    node.x = dir === 1 ? edge : edge - node.w;
    place(node.children, dir, edge + dir * (widths[depth] + H_GAP), cursor + (span - childSpan) / 2, widths, depth + 1);
    cursor += span;
  }
};

const layout = (root: MindNode): { left: MindNode[]; right: MindNode[] } => {
  const total = root.children.reduce((sum, child) => sum + leaves(child), 0);
  const right: MindNode[] = [];
  let seen = 0;
  for (const child of root.children) {
    if (right.length && seen >= total / 2) break;
    right.push(child);
    seen += leaves(child);
  }
  const left = root.children.slice(right.length);
  root.children.forEach((child, i) => paint(child, `hsl(${(210 + i * 67) % 360} 55% 50%)`));
  root.x = -root.w / 2;
  root.y = 0;
  for (const [side, dir] of [[right, 1], [left, -1]] as const) {
    const widths = columnWidths(side);
    const height = side.reduce((sum, child) => sum + extent(child), 0);
    place(side, dir, dir === 1 ? root.w / 2 + H_GAP : -root.w / 2 - H_GAP, -height / 2, widths);
  }
  return { left, right };
};

const paint = (node: MindNode, color: string): void => {
  node.color = color;
  node.children.forEach((child) => paint(child, color));
};

const walk = (node: MindNode, visit: (node: MindNode) => void): void => {
  visit(node);
  node.children.forEach((child) => walk(child, visit));
};

export const renderMindmapSVG = (source: string): string => {
  const root = parse(source);
  const { left } = layout(root);
  const nodes: MindNode[] = [];
  walk(root, (node) => nodes.push(node));

  const reach = Math.ceil(Math.max(...nodes.map((n) => Math.max(-n.x, n.x + n.w))) + PAD);
  const minX = -reach;
  const maxX = reach;
  const minY = Math.min(...nodes.map((n) => n.y - NODE_H / 2)) - PAD;
  const maxY = Math.max(...nodes.map((n) => n.y + NODE_H / 2)) + PAD;
  const leftSide = new Set<MindNode>();
  left.forEach((child) => walk(child, (n) => leftSide.add(n)));

  const edges: string[] = [];
  const boxes: string[] = [];
  const connect = (parent: MindNode, child: MindNode): void => {
    const toLeft = leftSide.has(child);
    const x1 = toLeft ? parent.x : parent.x + parent.w;
    const x2 = toLeft ? child.x + child.w : child.x;
    const mid = (x1 + x2) / 2;
    edges.push(
      `<path d="M${x1} ${parent.y}C${mid} ${parent.y} ${mid} ${child.y} ${x2} ${child.y}" fill="none" stroke="${child.color}" stroke-width="2"/>`
    );
    child.children.forEach((grandchild) => connect(child, grandchild));
  };
  root.children.forEach((child) => connect(root, child));

  for (const node of nodes) {
    const isRoot = node === root;
    const fill = isRoot ? 'var(--link-color)' : node.color;
    const textFill = isRoot ? '#fff' : 'var(--text-primary)';
    boxes.push(
      `<rect x="${node.x}" y="${node.y - NODE_H / 2}" width="${node.w}" height="${NODE_H}" rx="8" fill="${fill}" fill-opacity="${isRoot ? 1 : 0.18}" stroke="${fill}" stroke-width="1.5"/>` +
        `<text x="${node.x + node.w / 2}" y="${node.y}" text-anchor="middle" dominant-baseline="central" fill="${textFill}">${escapeXml(node.text)}</text>`
    );
  }

  const width = Math.ceil(maxX - minX);
  const height = Math.ceil(maxY - minY);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${minX} ${minY} ${width} ${height}" width="${width}" height="${height}" font-family="inherit" font-size="14" role="img">${edges.join('')}${boxes.join('')}</svg>`;
};
