/**
 * Regression checks: theme controls Gutenberg block alignwide / alignfull.
 * Avoid width/max-width declarations on Timeline's OUTER block root.
 * The internal timeline wrapper should still use all available block width.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');
const block = JSON.parse(read('block.json'));
assert.deepEqual(block.supports.align, ['wide', 'full']);
const registration = read('src/index.js');
assert.match(registration, /align:\s*\[\s*'wide',\s*'full'\s*\]/);
for (const path of ['src/save.js', 'src/edit.js']) {
  assert.match(read(path), /useBlockProps(?:\.save)?\s*\(/, `${path} must preserve align class through block props`);
}
const rootSelector = /(?:^|[\n}])\s*\.wp-block-za-timeline-full-widget\s*\{([^}]*)\}/g;
for (const path of ['src/style.scss', 'assets/css/core/style.css', 'build/style-index.css', 'build/style-index-rtl.css']) {
  const css = read(path);
  for (const match of css.matchAll(rootSelector)) {
    assert.doesNotMatch(match[1], /(?:^|;)\s*(?:max-)?width\s*:/, `${path} must not override theme width`);
  }
  assert.doesNotMatch(css, /\.wp-block-za-timeline-full-widget\s*\{\s*width\s*:\s*100%\s*\}/, `${path} root width override`);
}
for (const path of ['src/editor.scss', 'build/index.css', 'build/index-rtl.css']) {
  const css = read(path);
  for (const match of css.matchAll(/\.editor-styles-wrapper\s+\.wp-block-za-timeline-full-widget\s*\{([^}]*)\}/g)) {
    assert.doesNotMatch(match[1], /(?:^|;)\s*(?:max-)?width\s*:/, `${path} must not cap Gutenberg aligned block`);
  }
}
assert.match(read('src/style.scss'), /\.wp-block-za-timeline-full-widget\s+\.timeline-wrapper\s*\{[^}]*width:\s*100%/);
// Astra's Page Builder Template deliberately removes direct-child max-width.
// Our theme-scoped selector must win without touching alignfull or other themes.
for (const path of ['src/style.scss', 'build/style-index.css', 'build/style-index-rtl.css']) {
  const css = read(path);
  const match = css.match(/\.ast-page-builder-template\s+\.entry-content\[data-ast-blocks-layout\]\s*>\s*\.wp-block-za-timeline-full-widget\.alignwide\s*\{([^}]*)\}/);
  assert.ok(match, `${path}: missing Astra alignwide compatibility selector`);
  assert.match(match[1], /max-width:\s*var\(--wp--custom--ast-wide-width-size/, `${path}: must honor Astra configurable width`);
  assert.match(match[1], /margin-inline:\s*auto/, `${path}: must center constrained block`);
  assert.doesNotMatch(match[1], /!important|1200px/, `${path}: hardcoded size or !important is forbidden`);
  assert.doesNotMatch(css, /\.ast-page-builder-template[^\{]*\.wp-block-za-timeline-full-widget\.alignfull\s*\{/, `${path}: alignfull must remain unconstrained`);
}
console.log('PASS Gutenberg wide/full alignment, Astra Page Builder specificity and fallback isolation.');
