#!/usr/bin/env node

/**
 * Test script to compare e5-small-v2 vs bge-small-en-v1.5
 * Run with: node test-embeddings.js
 */

import { pipeline } from '@xenova/transformers';
import { readFileSync } from 'fs';
import { join } from 'path';

const TEST_QUERIES = [
  "How do I install the package?",
  "What is authentication?",
  "How can I configure settings?",
  "Performance optimization tips",
  "API reference methods"
];

const TEST_DOCS = [
  "You can install via npm using the command npm install my-package",
  "Authentication involves using a username and password to get a token",
  "Create a config.json file with your API key and debug settings",
  "Use caching, enable compression, and minimize API calls for better performance",
  "The main API methods are authenticate() and fetchData() for data retrieval"
];

async function testModel(modelName, docs, queries) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing: ${modelName}`);
  console.log('='.repeat(60));

  const startLoad = Date.now();
  const embedder = await pipeline('feature-extraction', modelName);
  const loadTime = Date.now() - startLoad;
  console.log(`✓ Model loaded in ${loadTime}ms`);

  // Embed documents
  const startDocEmbed = Date.now();
  const docEmbeddings = [];
  for (const doc of docs) {
    const output = await embedder(doc, { pooling: 'mean', normalize: true });
    docEmbeddings.push(Array.from(output.data));
  }
  const docEmbedTime = Date.now() - startDocEmbed;
  console.log(`✓ Embedded ${docs.length} docs in ${docEmbedTime}ms (${(docEmbedTime/docs.length).toFixed(1)}ms/doc)`);

  // Test queries
  const results = [];
  let totalQueryTime = 0;

  for (const query of queries) {
    const startQuery = Date.now();
    const queryOutput = await embedder(query, { pooling: 'mean', normalize: true });
    const queryEmbedding = Array.from(queryOutput.data);
    const queryTime = Date.now() - startQuery;
    totalQueryTime += queryTime;

    // Find best match
    const scores = docEmbeddings.map((docEmb, idx) => ({
      doc: docs[idx],
      score: cosineSimilarity(queryEmbedding, docEmb)
    }));
    scores.sort((a, b) => b.score - a.score);

    results.push({
      query,
      queryTime,
      topMatch: scores[0],
      allScores: scores
    });
  }

  console.log(`✓ Processed ${queries.length} queries in ${totalQueryTime}ms (${(totalQueryTime/queries.length).toFixed(1)}ms/query)\n`);

  // Display results
  console.log('Results:');
  results.forEach((r, i) => {
    console.log(`\n${i + 1}. Query: "${r.query}"`);
    console.log(`   Best match (${(r.topMatch.score * 100).toFixed(1)}%): "${r.topMatch.doc.slice(0, 60)}..."`);
    console.log(`   Query time: ${r.queryTime}ms`);
  });

  return {
    modelName,
    loadTime,
    docEmbedTime,
    avgQueryTime: totalQueryTime / queries.length,
    results
  };
}

function cosineSimilarity(a, b) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (normA * normB);
}

async function main() {
  console.log('\n🔬 Embeddings Model Comparison Test');
  console.log('Testing: e5-small-v2 vs bge-small-en-v1.5\n');

  try {
    const e5Results = await testModel('Xenova/e5-small-v2', TEST_DOCS, TEST_QUERIES);
    const bgeResults = await testModel('Xenova/bge-small-en-v1.5', TEST_DOCS, TEST_QUERIES);

    // Comparison
    console.log(`\n${'='.repeat(60)}`);
    console.log('📊 COMPARISON SUMMARY');
    console.log('='.repeat(60));

    console.log('\n⏱️  Speed:');
    console.log(`  E5-Small:  ${e5Results.avgQueryTime.toFixed(1)}ms/query`);
    console.log(`  BGE-Small: ${bgeResults.avgQueryTime.toFixed(1)}ms/query`);
    const faster = e5Results.avgQueryTime < bgeResults.avgQueryTime ? 'E5' : 'BGE';
    const speedup = Math.abs(e5Results.avgQueryTime - bgeResults.avgQueryTime).toFixed(1);
    console.log(`  → ${faster} is ${speedup}ms faster per query`);

    console.log('\n🎯 Accuracy (Average Confidence):');
    const e5AvgScore = e5Results.results.reduce((sum, r) => sum + r.topMatch.score, 0) / e5Results.results.length;
    const bgeAvgScore = bgeResults.results.reduce((sum, r) => sum + r.topMatch.score, 0) / bgeResults.results.length;
    console.log(`  E5-Small:  ${(e5AvgScore * 100).toFixed(1)}% avg confidence`);
    console.log(`  BGE-Small: ${(bgeAvgScore * 100).toFixed(1)}% avg confidence`);
    const moreConfident = e5AvgScore > bgeAvgScore ? 'E5' : 'BGE';
    console.log(`  → ${moreConfident} has higher confidence scores`);

    console.log('\n🏆 Recommendation:');
    if (faster === 'E5' && moreConfident === 'E5') {
      console.log('  → E5-Small wins on both speed AND accuracy! 🎉');
    } else if (faster === 'BGE' && moreConfident === 'BGE') {
      console.log('  → BGE-Small wins on both speed AND accuracy! 🎉');
    } else if (faster === 'E5') {
      console.log('  → E5-Small: Faster but slightly lower confidence');
      console.log('  → BGE-Small: More confident but slower');
      console.log('  → For real-time docs search, speed matters more → E5-Small ✓');
    } else {
      console.log('  → E5-Small: More confident but slower');
      console.log('  → BGE-Small: Faster but slightly lower confidence');
      console.log('  → For better accuracy → E5-Small ✓');
    }

    console.log('\n');
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

main();
