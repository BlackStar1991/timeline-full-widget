/**
 * Regression check for the actual shipped Gutenberg MediaSettingsPanel code.
 * Uses the compiled component with mocked WordPress React primitives, so no
 * browser, plugin activation or node_modules are needed.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
const source = read('../../src/item/components/MediaSettingsPanel.js');
const editor = read('../../src/item/edit.js');
const content = read('../../src/item/areas/content.js');
const js = read('../../build/index.js');

const start = js.indexOf('function MediaSettingsPanel({');
assert.ok(start > -1, 'shipped bundle contains MediaSettingsPanel');
const end = js.indexOf('\n}\n\n/***/ },', start);
assert.ok(end > start, 'shipped bundle contains the full panel implementation');
const implementation = js.slice(start, end + 2);

const JSX = {
    Fragment: 'Fragment',
    jsx: (type, props) => ({ type: typeof type === 'function' ? type.name : type, props }),
    jsxs: (type, props) => ({ type: typeof type === 'function' ? type.name : type, props }),
};
const stub = (name) => ({[name]: function () {}})[name];
const create = new Function(
    '_wordpress_blob__WEBPACK_IMPORTED_MODULE_2__',
    '_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__',
    '_wordpress_components__WEBPACK_IMPORTED_MODULE_0__',
    'react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__',
    'VideoPosterControl',
    'ImageAltControl',
    'WidthOfMedia',
    'UniqueMarkerPanel',
    implementation + '\nreturn MediaSettingsPanel;'
);
const MediaSettingsPanel = create(
    { isBlobURL: (url) => typeof url === 'string' && url.startsWith('blob:') },
    { __: (text) => text },
    { PanelBody: 'PanelBody' },
    JSX,
    stub('VideoPosterControl'),
    stub('ImageAltControl'),
    stub('WidthOfMedia'),
    stub('UniqueMarkerPanel')
);
const common = { mediaUrl: '', mediaMime: '', markerUnique: false, setAttributes: () => {} };
function collect(node, found = []) {
    if (!node || typeof node !== 'object') return found;
    found.push(node.type);
    for (const child of [].concat(node.props?.children ?? [])) collect(child, found);
    return found;
}
function types(attributes) {
    return collect(MediaSettingsPanel({ ...common, ...attributes }));
}
function verify(attributes, present, absent) {
    const emitted = types(attributes);
    for (const type of present) assert.ok(emitted.includes(type), `${type} must be shown: ${JSON.stringify(attributes)}`);
    for (const type of absent) assert.ok(!emitted.includes(type), `${type} must be hidden: ${JSON.stringify(attributes)}`);
}

verify({}, [], ['PanelBody', 'ImageAltControl', 'VideoPosterControl', 'UniqueMarkerPanel']);
verify({ mediaUrl: 'https://example.com/image.jpg' }, ['PanelBody', 'ImageAltControl', 'WidthOfMedia'], ['VideoPosterControl', 'UniqueMarkerPanel']);
verify({ mediaUrl: 'https://example.com/movie.webm' }, ['PanelBody', 'VideoPosterControl', 'WidthOfMedia'], ['ImageAltControl']);
verify({ mediaUrl: 'https://example.com/media?id=7', mediaMime: 'video/mp4' }, ['PanelBody', 'VideoPosterControl'], ['ImageAltControl']);
verify({ mediaUrl: 'blob:temporary' }, [], ['PanelBody']);
verify({ markerUnique: true }, ['UniqueMarkerPanel'], ['PanelBody', 'WidthOfMedia']);
verify({ markerUnique: true, mediaUrl: 'https://example.com/image.jpg' }, ['UniqueMarkerPanel', 'PanelBody', 'WidthOfMedia'], []);
verify({ markerUnique: true, mediaUrl: '' }, ['UniqueMarkerPanel'], ['PanelBody']);
verify({ mediaUrl: 'https://example.com/image.jpg', showMedia: false }, ['PanelBody'], []);
verify({ mediaUrl: '' }, [], ['PanelBody']);

assert.match(source, /const hasMedia = Boolean\( mediaUrl && ! isBlobURL\( mediaUrl \) \)/);
assert.match(source, /\{ hasMedia && \(\s*<PanelBody/);
assert.match(source, /\{ markerUnique && \(\s*<UniqueMarkerPanel/);
for (const caller of [editor, content]) {
    assert.match(caller, /<MediaSettingsPanel/);
    assert.doesNotMatch(caller, /<MediaSettingsPanel\s*\n\s*showMedia=/);
}
assert.equal((js.match(/_components_MediaSettingsPanel__WEBPACK_IMPORTED_MODULE_\d+__\["default"\], \{/g) ?? []).length, 2);
console.log('PASS: Gutenberg media settings are conditional in both source and shipped build, image/video/removal/blob/custom marker scenarios verified');
