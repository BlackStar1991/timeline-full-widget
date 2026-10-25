import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { persistTimelinePaletteColors } from '../../src/item/areas/color-helpers.js';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
const item = read('../../src/item/edit.js');
const content = read('../../src/item/areas/content.js');
const bundle = read('../../build/index.js');
const style = read('../../build/index.css');

assert.match(item, /\{\s*!!\s*mediaLinkUrl\s*&&\s*<ToolbarButton/);
assert.match(content, /\{\s*!!\s*mediaLinkUrl\s*&&\s*<ToolbarButton/);
assert.doesNotMatch(item + content, /isDisabled=\{ ! mediaLinkUrl \}/);
assert.equal((bundle.match(/Remove media link/g) || []).length, 2);
assert.ok((bundle.match(/Remove media link/g) || []).length >= 2);
assert.ok(bundle.includes('mediaLinkUrl'), 'compiled toolbar checks link URL');
console.log('PASS: both toolbars hide unlink action when no URL exists');

assert.match(content, /className="tl-media-empty-action"/);
assert.match(content, /<MediaUpload/);
assert.match(content, /Add image or video/);
assert.doesNotMatch(content, /<MediaPlaceholder\s+onSelect=\{ onSelect \}/);
assert.match(bundle, /tl-media-empty-action/);
assert.match(bundle, /MediaUpload/);
assert.match(style, /\.tl-media-empty-action\{/);
console.log('PASS: compact empty media picker is present in source, runtime bundle and CSS');

assert.match(bundle, /persistTimelinePaletteColors/);
const writes = [];
const records = [{
    name: 'core/heading', clientId: 'h',
    attributes: { textColor: 'accent-2', style: { typography: { fontSize: '21px' } } }, innerBlocks: [],
}, {
    name: 'core/group', clientId: 'g', attributes: {},
    innerBlocks: [{ name: 'core/paragraph', clientId: 'p', attributes: {textColor: 'accent-2',style:{color:{text:'#aabbcc'}}},innerBlocks:[] }],
}];
persistTimelinePaletteColors(records, [{slug:'accent-2', color:'#f4c2f4'}], (id,attrs) => writes.push([id,attrs]));
assert.equal(writes.length, 1);
assert.equal(writes[0][0],'h');
assert.equal(writes[0][1].style.color.text,'#f4c2f4');
assert.equal(writes[0][1].style.typography.fontSize,'21px');
assert.equal(writes[0][1].textColor,undefined);
console.log('PASS: palette color is made explicit without overwriting custom inline colors');

assert.match(content, /function isVideoPlaceholder/);
assert.match(content, /isVideo\s*&&\s*!\s*videoPlaceholder/);
assert.match(content, /mediaUrl: ''[\s\S]*?showMedia: false/);
assert.match(item, /mediaUrl: ''[\s\S]*?showMedia: false/);
assert.match(bundle, /isVideoPlaceholder/);
console.log('PASS: imported video SVG is an image poster and media deletion clears parent/child state');

const widgetControlsSource = readFileSync(new URL('../../includes/Elementor/TimelineWidget.php', import.meta.url),'utf8');
const nativeMediaBridge = readFileSync(new URL('../../assets/elementor/elementor-media-preview.js', import.meta.url),'utf8');
assert.ok( widgetControlsSource.includes("'media_width'") && widgetControlsSource.includes('mediaWidthCss(value)') && widgetControlsSource.includes('media_width_css( $value )'));
assert.ok( !nativeMediaBridge.includes('elementor.media.create =') && !nativeMediaBridge.includes("state.props.set('library'"));
assert.ok( nativeMediaBridge.includes('.elementor-control-media_image') && nativeMediaBridge.includes('.elementor-control-media_video') && nativeMediaBridge.includes("type === 'video'"));

const rootEdit = read('../../src/edit.js');
const blockRegistration = read('../../src/index.js');
const metadata = JSON.parse(read('../../block.json'));
assert.equal(metadata.supports.color.background, true);
assert.equal(metadata.supports.background.backgroundImage, true);
assert.equal(metadata.supports.background.backgroundSize, true);
assert.match(blockRegistration, /backgroundImage: true/);
assert.match(bundle, /backgroundImage: true/);
assert.doesNotMatch(rootEdit, /<PanelBody title=\{ __\( 'Timeline background'/);
assert.doesNotMatch(bundle, /'Timeline background', 'timeline-full-widget'/);
for (const key of ['timelineBackgroundColor', 'timelineBackgroundImage', 'timelineBackgroundSize', 'timelineBackgroundPosition']) {
    assert.equal(metadata.attributes[key].default, '', 'legacy attribute remains for saved post compatibility');
}
assert.match(widgetControlsSource,/media_width_value/);
assert.match(widgetControlsSource,/media_width_unit/);
assert.match(widgetControlsSource,/Controls_Manager::NUMBER/);
assert.match(widgetControlsSource,/Controls_Manager::SELECT/);
assert.doesNotMatch(widgetControlsSource,/260px \/ 45%/);
const coreCSS=read('../../assets/css/core/style.css');
assert.ok(coreCSS.includes('.timeline .tl-mark > img'));
assert.ok(coreCSS.includes('.timeline_pic.tfw-media-sized'));
console.log('PASS: native root background support, numeric Elementor media width and bounded markers are in runtime assets');
