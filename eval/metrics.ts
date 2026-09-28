export interface Target {
  sourceFile: string;
  headingId?: string;
}

export interface Summary {
  recall: number;
  mrr: number;
  falsePositiveRate: number;
}

export function matches(label: string, target: Target): boolean {
  const [file, anchor] = label.split('#');
  return file === target.sourceFile && (anchor === undefined || anchor === target.headingId);
}

export function recallAtK(expect: string[], ranked: Target[], k: number): number {
  const top = ranked.slice(0, k);
  const found = expect.filter((label) => top.some((target) => matches(label, target)));
  return found.length / expect.length;
}

export function reciprocalRank(expect: string[], ranked: Target[], k: number): number {
  const index = ranked
    .slice(0, k)
    .findIndex((target) => expect.some((label) => matches(label, target)));
  return index === -1 ? 0 : 1 / (index + 1);
}

const mean = (values: number[]): number =>
  values.length === 0 ? 0 : values.reduce((sum, v) => sum + v, 0) / values.length;

export function summarize(queries: { expect: string[] }[], results: Target[][], k: number): Summary {
  const answerable = queries.flatMap((q, i) => (q.expect.length > 0 ? [{ q, ranked: results[i] }] : []));
  const negatives = queries.flatMap((q, i) => (q.expect.length === 0 ? [results[i]] : []));

  return {
    recall: mean(answerable.map(({ q, ranked }) => recallAtK(q.expect, ranked, k))),
    mrr: mean(answerable.map(({ q, ranked }) => reciprocalRank(q.expect, ranked, k))),
    falsePositiveRate: mean(negatives.map((ranked) => (ranked.length > 0 ? 1 : 0))),
  };
}
