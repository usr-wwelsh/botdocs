import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TemplateEngine } from './template-engine.js';

test('render substitutes flat variables', () => {
  const engine = new TemplateEngine();
  const result = engine.render('Hello {{name}}!', { name: 'World' });
  assert.equal(result, 'Hello World!');
});

test('render leaves unknown variables untouched', () => {
  const engine = new TemplateEngine();
  const result = engine.render('Hello {{name}}!', {});
  assert.equal(result, 'Hello {{name}}!');
});

test('renderAdvanced resolves dotted paths', () => {
  const engine = new TemplateEngine();
  const result = engine.renderAdvanced('{{user.name}} is {{user.age}}', {
    user: { name: 'Ada', age: 30 },
  });
  assert.equal(result, 'Ada is 30');
});

test('renderAdvanced leaves a path unresolved when an intermediate value is missing', () => {
  const engine = new TemplateEngine();
  const result = engine.renderAdvanced('{{user.name}}', {});
  assert.equal(result, '{{user.name}}');
});

test('renderWithConditionals keeps content when the condition is truthy', () => {
  const engine = new TemplateEngine();
  const result = engine.renderWithConditionals('{{#if show}}visible{{/if}}', { show: true });
  assert.equal(result, 'visible');
});

test('renderWithConditionals drops content when the condition is falsy', () => {
  const engine = new TemplateEngine();
  const result = engine.renderWithConditionals('{{#if show}}visible{{/if}}', { show: false });
  assert.equal(result, '');
});

test('renderWithLoops expands each block per item with interpolation', () => {
  const engine = new TemplateEngine();
  const result = engine.renderWithLoops('{{#each items}}<li>{{title}}</li>{{/each}}', {
    items: [{ title: 'One' }, { title: 'Two' }],
  });
  assert.equal(result, '<li>One</li><li>Two</li>');
});

test('renderWithLoops supports conditionals inside each item', () => {
  const engine = new TemplateEngine();
  const result = engine.renderWithLoops(
    '{{#each items}}{{#if starred}}*{{/if}}{{title}}{{/each}}',
    { items: [{ title: 'One', starred: true }, { title: 'Two', starred: false }] }
  );
  assert.equal(result, '*OneTwo');
});

test('renderWithLoops renders nothing for a non-array value', () => {
  const engine = new TemplateEngine();
  const result = engine.renderWithLoops('{{#each items}}{{title}}{{/each}}', { items: 'nope' });
  assert.equal(result, '');
});
