/** No dependency installation required: test the shipping pure modules. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('../..', import.meta.url)));
let count = 0;
function check(name, fn) {
	fn();
	count++;
	console.log(`PASS: ${name}`);
}
async function loadModule(relative, imports = []) {
	let source = readFileSync(resolve(root, relative), 'utf8');
	for (const [find, replace] of imports) {
		assert(source.includes(find), `${relative} must contain declared dependency`);
		source = source.replace(find, replace);
	}
	return import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
}
const style = await loadModule('src/timeline-style.js');
check('Gutenberg shared variables follow canonical default values', () => {
	const vars = style.getTimelineWrapperStyle();
	assert.equal(vars['--timeline-line-color'], '#F6F6F8');
	assert.equal(vars['--timeline-line-width'], '4px');
	assert.equal(vars['--timeline-marker-color'], '#F6F6F8');
	assert.equal(vars['--timeline-line-active-color'], '#F37321');
	assert.equal(vars['--timeline-marker-active-color'], '#F37321');
	assert.equal(vars['--marker-size'], undefined);
});
check('Gutenberg overrides map to shared CSS property names', () => {
	const vars = style.getTimelineWrapperStyle({
		lineColor: '#101010', lineWidth: 12, markerColor:'#202020', markerSize: 45,
		animationLineColor: '#aabbcc', animationMarkerColor: '#ddeeff',
	});
	assert.equal(vars['--timeline-line-width'],'12px');
	assert.equal(vars['--marker-size'],'45px');
	assert.equal(vars['--timeline-line-color'],'#101010');
	assert.equal(vars['--timeline-marker-color'],'#202020');
	assert.equal(vars['--timeline-line-active-color'],'#aabbcc');
	assert.equal(vars['--timeline-marker-active-color'],'#ddeeff');
});
check('Invalid zero/nonnumeric dimensions do not leak into CSS variables', () => {
	const vars = style.getTimelineWrapperStyle({ lineWidth:0, markerSize:'NaN' });
	assert.equal(vars['--timeline-line-width'], '4px');
	assert.equal(vars['--marker-size'], undefined);
});
const inherit = await loadModule('src/item/style-inheritance.js', [
	["import { __ } from '@wordpress/i18n';", "const __ = (message) => message;"],
]);
check('Copying styles never copies media/content/ID fields', () => {
	const source = {descriptionColor:'#123', style:{color:{text:'#abc'}}, linkUrl:'/private',
		mediaId:456, markerUrl:'/marker.png', otherSiteTitle:'My private text', position:'timeline-left'};
	const dest = inherit.getInheritableAttributes(source);
	assert.deepEqual(dest, {descriptionColor:'#123', style:{color:{text:'#abc'}}});
	source.style.color.text = '#fff';
	assert.equal(dest.style.color.text, '#abc');
});
check('Nested style inheritance copies only matching descendant paths and names', () => {
	const source = {innerBlocks:[{name:'za/timeline-item-content',clientId:'a',attributes:{style:{spacing:{margin:{top:'10px'}}},content:'source'},innerBlocks:[
		{name:'core/heading',clientId:'b',attributes:{style:{color:{text:'#f00'}},content:'Old title',level:2}},
	]}]};
	const target = {innerBlocks:[{name:'za/timeline-item-content',clientId:'x',attributes:{},innerBlocks:[
		{name:'core/heading',clientId:'y',attributes:{content:'Keep this',level:3}},
	]}]};
	const updates = inherit.collectDescendantStyleUpdates(source,target);
	assert.deepEqual(updates, [
		{clientId:'x',attributes:{style:{spacing:{margin:{top:'10px'}}}}},
		{clientId:'y',attributes:{style:{color:{text:'#f00'}}}},
	]);
});
check('Mismatched nested block types do not inherit unrelated attributes', () => {
	const source = {innerBlocks:[{name:'core/heading',clientId:'a',attributes:{style:{color:'red'}}}]};
	const target = {innerBlocks:[{name:'core/paragraph',clientId:'b',attributes:{}}]};
	assert.deepEqual(inherit.collectDescendantStyleUpdates(source,target),[]);
});
const compatible = await loadModule('src/block-template-compat.js', [
	["import { getBlockType } from '@wordpress/blocks';", "const getBlockType = () => globalThis.__testBlockType;"],
]);
check('Older WordPress fallback keeps InnerBlocks template', () => {
	globalThis.__testBlockType = {};
	assert.deepEqual(compatible.getLegacyTemplateProps(['a']),{template:['a']});
});
check('WordPress block-type templates suppress redundant InnerBlocks template', () => {
	globalThis.__testBlockType = {template:['core/list-item']};
	assert.deepEqual(compatible.getLegacyTemplateProps(['a']),{});
	delete globalThis.__testBlockType;
});
const meta = JSON.parse(readFileSync(resolve(root,'block.json'),'utf8'));
const pkg = JSON.parse(readFileSync(resolve(root,'package.json'),'utf8'));
const coreCSS = readFileSync(resolve(root,'assets/css/core/style.css'),'utf8');
const elementor = readFileSync(resolve(root,'includes/Elementor/TimelineWidget.php'),'utf8');
const classicJS = readFileSync(resolve(root,'assets/js/adapters/classic-adapters.js'),'utf8');
check('Elementor repeater exposes independent, default-off layout switches without global control registration', () => {
    const horizontal = elementor.slice(elementor.indexOf("'item_content_layout'"), elementor.indexOf("'tl_card_change_direction'"));
    const reverse = elementor.slice(elementor.indexOf("'tl_card_change_direction'"), elementor.indexOf("'media_heading'"));
    assert(horizontal.includes('Controls_Manager::SWITCHER'));
    assert(horizontal.includes("'return_value' => 'horizontal'"));
    assert(horizontal.includes("'default'      => ''"));
    assert(reverse.includes('Controls_Manager::SWITCHER'));
    assert(reverse.includes("'default'      => ''"));
    assert(!horizontal.includes("'inherit_item_styles!'"));
    assert(!reverse.includes("'inherit_item_styles!'"));
    assert(!/\$this->add_control\(\s*'tl_content_horizontal_layout'/.test(elementor));
    assert(!/\$this->add_control\(\s*'shared_reverse_media_content'/.test(elementor));
});
check('Both editors expose all six shared styling properties', () => {
	const attrNames = [
		'--timeline-line-color','--timeline-line-width','--timeline-marker-color',
		'--marker-size','--timeline-line-active-color','--timeline-marker-active-color',
	];
	for (const name of attrNames) {
		assert(coreCSS.includes(name), `Core CSS missing ${name}`);
		assert(elementor.includes(name), `Elementor control missing ${name}`);
	}
});
check('Classic Editor module uses a relocatable animation URL', () => {
	assert(classicJS.includes("new URL( '../core/animation.js', import.meta.url )"));
	assert(!classicJS.includes("location.origin +\n\t\t\t'/wp-content/plugins/"));
});
check('Gutenberg persisted identifiers / metadata remain stable', () => {
	assert.equal(meta.name,'za/timeline-full-widget');
	assert.equal(meta.textdomain,'timeline-full-widget');
	assert.equal(pkg.version,'4.0.0');
	for (const marker of ['za/timeline-item', 'za/timeline-item-side', 'za/timeline-item-content']) {
		assert(readFileSync(resolve(root,'src/item/index.js'),'utf8').includes('za/timeline-item'));
		assert(readFileSync(resolve(root,'src/item/areas/config.js'),'utf8').includes(marker.replace('za/timeline-item','za/timeline-item')) || marker === 'za/timeline-item');
	}
});
check('Old Gutenberg blocks retain deprecation/migration registration', () => {
	const src = readFileSync(resolve(root,'src/item/index.js'),'utf8');
	assert(src.includes('deprecated: [') && src.includes('migrate: ( attributes, innerBlocks )'));
	assert(src.includes("import DeprecatedV2Save from './deprecated-v2-save'"));
});
check('Marker colors are scroll-driven, not nearest/selected Gutenberg block', () => {
  const source = readFileSync(resolve(root,'assets/js/core/animation.js'),'utf8');
  const bundle = readFileSync(resolve(root,'build/index.js'),'utf8');
  // Source stays human-readable, while webpack minifies variable names and
  // conditions in build/index.js. Do not demand exact source identifiers in
  // an optimized bundle: assert the equivalent generated marker transition.
  assert(!source.includes('const isCurrent = it === best'));
  assert(!source.includes('passed || isCurrent'));
  assert(source.includes('if (passed && !currently)') || source.includes('if ( passed && ! currently )'));
  assert(source.includes('MutationObserver'));
  assert(bundle.includes('MutationObserver'));
  assert(/classList\.contains\(\"is-stuck\"\)/.test(bundle));
  assert(/classList\.add\(\"is-stuck\"\)/.test(bundle));
  assert(/classList\.remove\(\"is-stuck\"\)/.test(bundle));
  assert(!bundle.includes('const isCurrent = it === best'));
  assert(!bundle.includes('passed || isCurrent'));
  const editor = readFileSync(resolve(root,'src/edit.js'),'utf8');
  for(const property of ['animationMarkerColor','animationLineColor','markerSize']) assert(editor.includes(property));
});
check('Imported Elementor background has registered Gutenberg attributes and matching bundled styles',()=>{
  const rootAttr = meta.attributes;
  for(const name of ['timelineBackgroundColor','timelineBackgroundImage','timelineBackgroundSize','timelineBackgroundPosition']){
    assert.equal(rootAttr[name].type,'string');
    assert(readFileSync(resolve(root,'src/timeline-style.js'),'utf8').includes('attributes.'+name));
    // webpack minifies the attributes variable, not the property names.
    assert(readFileSync(resolve(root,'build/index.js'),'utf8').includes('.'+name));
  }
});
check('Gutenberg editor animation uses the clipped iframe viewport in source and shipped bundle', () => {
  const source = readFileSync(resolve(root,'assets/js/core/animation.js'),'utf8');
  const built = readFileSync(resolve(root,'build/index.js'),'utf8');
  for (const token of ['iframeRect.bottom','window.frameElement.parentElement','bottom = Math.min( bottom, bounds.bottom )']) {
    assert(source.includes(token), `missing animation viewport logic: ${token}`);
  }
  assert(built.includes('Math.min(a.innerHeight,e.bottom)'), 'Gutenberg shipped bundle must clip to iframe');
  assert(/\b[a-z]=Math\.min\([a-z],e\.bottom\)/.test(built), 'Gutenberg shipped bundle must clip ancestor scrollers');
});
check('Timeline toolbar controls are grouped using modern WordPress API', () => {
  const build = readFileSync(resolve(root,'build/index.js'),'utf8');
  assert.equal((build.match(/\(s\.ToolbarGroup,\{children:/g)||[]).length,3);
  for(const path of ['src/item/edit.js','src/item/areas/content.js']) {
    const src = readFileSync(resolve(root,path),'utf8');
    assert(src.includes('<ToolbarGroup>') && src.includes('</ToolbarGroup>'));
  }
});
console.log(`PASS: ${count} JavaScript/contract assertions.`);
