/** Dependency-free portable Timeline transfer contract tests. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  createTransfer, parseTransfer, prepareImport, transferFilename, FORMAT,
  IMPORT_OPTIONS, STYLE_KEYS, PLACEHOLDER_TOKEN, MAX_FILE_BYTES, resolveGutenbergColor,
} from '../../assets/js/transfer/transfer-core.js';

let checks = 0;
function check( name, run ) { run(); checks++; console.log( 'PASS: ' + name ); }
const local = 'https://receiver.test/wp-content/plugins/timeline-full-widget/assets/images/media-placeholder.svg';
const e = {
  _element_id: 'old-id', _css_classes: 'custom showcase', _margin: {top:'15',unit:'px'},
  _padding: {bottom:'20',unit:'px'}, _margin_tablet: {top:'9',unit:'px'},
  custom_css: 'selector::before { background-image: url(https://donor.test/uploads/hero.jpg); }',
  _background_image: {id:88,url:'https://donor.test/uploads/banner.jpg',width:1200,height:300},
  timeline_line_width: {size: 10,unit:'px'}, timeline_marker_size: {size: 40,unit:'px'},
  timeline_line_color: '#123456', _animation: 'fadeIn',
  _typography_font_family: 'Roboto', _background_video_link:'https://donor.test/uploads/bg-video.mp4',
  list: [
    {_id:'abcdefgh',media_type:'image',list_title:'A',media_image:{id:12,url:'https://donor.test/uploads/image.jpg',width:100,height:160},
      marker_image:{id:19,url:'https://donor.test/uploads/marker.svg',width:40,height:40}, media_link_url:{url:'https://example.com/story'},
      inherit_item_styles:'',item_title_color:'#ee8899', item_title_alignment:'center',
      list_content:'<p><img width="150" height="200" srcset="https://donor.test/1.jpg 1x" src="https://donor.test/1.jpg"></p>'},
    {_id:'qwert123',media_type:'video',media_video:{id:70,url:'https://donor.test/uploads/v.mp4'},
      posterURL:{id:99,url:'https://donor.test/uploads/poster.jpg'}, list_title:'Video'},
  ],
};
const g = {
  name:'za/timeline-full-widget', attributes: { lineWidth: 7, markerSize: 40, anchor:'duplicate', className:'bg-test', style: {spacing:{margin:{top:'15px'}, padding:{top:'10px'},blockGap:'3px'},color:{text:'#ff0'}} },
  innerBlocks:[{ name:'za/timeline-item', attributes: {markerUrl:'https://donor.test/marker.webp',markerId:8,mediaUrl:'relative/photo.jpg',mediaId:13,mediaWidth:'250px',className:'special-item'}, innerBlocks:[
    {name:'za/timeline-item-content',attributes:{mediaType:'video',mediaUrl:'https://donor.test/video.mp4',videoPoster:'https://donor.test/poster.jpg',mediaMime:'video/mp4',mediaWidth:'400px'},innerBlocks:[
       {name:'core/image',attributes:{url:'https://donor.test/image.jpg',id:201,alt:'Keep alt',width:40,height:40},innerBlocks:[]},
       {name:'core/paragraph',attributes:{content:'<a href="https://example.com">link</a> <img src="https://donor.test/a.png" width="60">'},innerBlocks:[]},
       {name:'core/video',attributes:{src:'https://donor.test/a.mp4',id:44,poster:'https://donor.test/p.jpg'},innerBlocks:[]},
       {name:'core/cover',attributes:{url:'https://donor.test/cover.jpg',id:88,dimRatio:40},innerBlocks:[]}
    ]}
  ]}]
};
const ep = createTransfer('elementor',e);
const gp = createTransfer('gutenberg',g);
check('Format version and origin metadata are explicit',()=>{assert.equal(ep.format,FORMAT);assert.equal(ep.schemaVersion,1);assert.equal(ep.origin,'elementor');assert.equal(gp.origin,'gutenberg');assert.equal(ep.elementType,'za-timeline');assert.equal(gp.elementType,'za/timeline-full-widget');});
check('File names identify which editor created the export',()=>{assert.match(transferFilename('elementor'),/^timeline-elementor-.*\.tfw\.json$/);assert.match(transferFilename('gutenberg'),/^timeline-gutenberg-.*\.tfw\.json$/);});
check('No donor image/video/marker URLs survive export',()=>{assert(!JSON.stringify(ep).includes('donor.test'));assert(!JSON.stringify(gp).includes('donor.test'));});
check('Elementor snapshot retains complete Advanced and per-item controls',()=>{assert.equal(ep.data._element_id,'old-id');assert.equal(ep.data._css_classes,'custom showcase');assert.equal(ep.data.list[0]._id,'abcdefgh');assert.equal(ep.data.list[0].item_title_color,'#ee8899');});
check('Elementor marker and image keep explicit original dimensions',()=>{assert.equal(ep.data.list[0].marker_image.width,40);assert.equal(ep.data.list[0].marker_image.height,40);assert.equal(ep.data.list[0].media_image.width,100);assert.equal(ep.data.list[0].media_image.height,160);});
check('Imported elementor media points to destination plugin, not donor',()=>{const imported=prepareImport(ep,'elementor',{},local);assert.equal(imported.list[0].media_image.url,local);assert.equal(imported.list[0].media_image.id,0);assert.equal(imported.list[0].marker_image.url,local);assert.equal(imported._background_image.url,local);});
check('Video media type retained with local poster and blank source (Elementor)',()=>{const item=prepareImport(ep,'elementor',{},local).list[1];assert.equal(item.media_type,'video');assert.equal(item.media_video.url,'');assert.equal(item.media_video.id,0);assert.equal(item.posterURL.url,local);});
check('Elementor custom CSS rules preserve selectors and replace image URLs',()=>{const css=prepareImport(ep,'elementor',{},local).custom_css;assert(css.includes('selector::before'));assert(css.includes(local));});
check('Gutenberg snapshot carries full hierarchy, alt text and dimensions',()=>{const b=gp.data.innerBlocks[0].innerBlocks[0].innerBlocks[0];assert.equal(b.attributes.alt,'Keep alt');assert.equal(b.attributes.width,40);assert.equal(gp.data.innerBlocks[0].attributes.mediaWidth,'250px');});
check('Gutenberg media IDs removed and media links replaced, relative or absolute',()=>{const b=gp.data.innerBlocks[0].attributes;assert.equal(b.markerId,0);assert.equal(b.mediaId,0);assert.equal(b.mediaUrl,PLACEHOLDER_TOKEN);assert.equal(b.markerUrl,PLACEHOLDER_TOKEN);});
check('Gutenberg video remains video with local poster and placeholder source',()=>{const b=prepareImport(gp,'gutenberg',{},local).innerBlocks[0].innerBlocks[0];assert.equal(b.attributes.mediaType,'video');assert.equal(b.attributes.videoPoster,local);assert.equal(b.attributes.mediaUrl,local);assert.equal(b.attributes.mediaWidth,'400px');});
check('Nested image/video blocks do not reference donor attachments',()=>{const children=prepareImport(gp,'gutenberg',{},local).innerBlocks[0].innerBlocks[0].innerBlocks;assert.equal(children[0].attributes.id,0);assert.equal(children[0].attributes.url,local);assert.equal(children[2].attributes.src,local);assert.equal(children[2].attributes.poster,local);});
check('Nested cover background media receives receiver-local placeholder',()=>{const cover=prepareImport(gp,'gutenberg',{},local).innerBlocks[0].innerBlocks[0].innerBlocks[3];assert.equal(cover.attributes.url,local);assert.equal(cover.attributes.id,0);assert.equal(cover.attributes.dimRatio,40);});
check('Elementor Advanced background video URL is never transferred',()=>{assert.equal(ep.data._background_video_link,'');});
check('Rich-text images/srcset converted while regular links retained',()=>{const html=prepareImport(gp,'gutenberg',{},local).innerBlocks[0].innerBlocks[0].innerBlocks[1].attributes.content;assert(html.includes('href="https://example.com"'));assert(html.includes(local));assert(!html.includes('donor.test'));});
check('Omitted custom CSS, HTML IDs, margins, and classes are actually excluded',()=>{const s=prepareImport(ep,'elementor',{customStyles:false,margin:false,classes:false},local);assert(!('custom_css' in s));assert(!('_margin' in s));assert(!('_margin_tablet' in s));assert(!('_css_classes' in s));assert(!('_element_id' in s));});
check('Margin, padding and gaps are independent selective options',()=>{const b=prepareImport(gp,'gutenberg',{margin:false,gap:false},local).attributes;assert(!('margin' in (b.style.spacing||{})));assert(!('blockGap' in (b.style.spacing||{})));assert.equal(b.style.spacing.padding.top,'10px');assert.equal(b.style.color.text,'#ff0');});
check('HTML IDs are excluded by default but can be retained deliberately',()=>{assert.equal(IMPORT_OPTIONS.identifiers,false);assert(!('anchor' in prepareImport(gp,'gutenberg').attributes));assert.equal(prepareImport(gp,'gutenberg',{identifiers:true}).attributes.anchor,'duplicate');});
check('Elementor repeater internal IDs remain stable for CSS selectors',()=>{const imported=prepareImport(ep,'elementor',{identifiers:false,classes:false},local);assert.equal(imported.list[0]._id,'abcdefgh');assert.equal(imported.list[0].item_title_alignment,'center');});
check('Responsive override, animation and typography can be excluded separately',()=>{const o=prepareImport(ep,'elementor',{responsive:false,animation:false,typography:false},local);assert(!('_margin_tablet' in o));assert(!('_animation' in o));assert(!('_typography_font_family' in o));assert.equal(o.timeline_marker_size.size,40);});
check('The same six canonical style mappings refer to real Elementor controls',()=>{const php=readFileSync(resolve('includes/Elementor/TimelineWidget.php'),'utf8');for(const pair of Object.values(STYLE_KEYS)){assert(php.includes(`'${pair.elementor}'`));assert(g.attributes[pair.gutenberg]!==undefined || pair.gutenberg in JSON.parse(readFileSync('block.json','utf8')).attributes);}});
check('Invalid format or unsupported destination is rejected, both editor sources are accepted',()=>{assert.throws(()=>parseTransfer('{}','elementor'));assert.equal(parseTransfer(ep,'gutenberg').origin,'elementor');assert.equal(parseTransfer(gp,'elementor').origin,'gutenberg');assert.throws(()=>parseTransfer(ep,'unknown'),/Unknown Timeline destination/);assert.throws(()=>createTransfer('unknown',{}));});
check('Future incompatible document format is rejected rather than silently degrading',()=>{assert.throws(()=>parseTransfer({...ep,schemaVersion:99},'elementor'),/unsupported/);});
check('Unsafe prototype pollution keys are rejected',()=>{const unsafe=JSON.stringify(ep).replace('"data":{','"data":{"__proto__":{"admin":true},');assert.throws(()=>parseTransfer(unsafe,'elementor'),/Unsafe property/);});
check('Files larger than 5MB are rejected',()=>{assert.throws(()=>parseTransfer(' '.repeat(MAX_FILE_BYTES+1),'gutenberg'),/too large/);});
check('Gutenberg transfers heading and paragraph text into new block hierarchy',()=>{
 const cloned=prepareImport(gp,'gutenberg',{},local);
 assert.equal(cloned.innerBlocks[0].innerBlocks[0].innerBlocks[1].attributes.content.includes('example.com'),true);
 const sample=JSON.parse(readFileSync('assets/blueprints/samples/timeline-gutenberg-demo.tfw.json','utf8'));
 const imported=prepareImport(sample,'gutenberg',{},local);
 assert.equal(imported.innerBlocks[0].innerBlocks[1].innerBlocks[0].attributes.content,'The First Milestone');
 assert.equal(imported.innerBlocks[1].innerBlocks[1].innerBlocks[1].attributes.content,'Edit this imported timeline and replace the media placeholders.');
});
check('Disabling content preserves target Gutenberg text but imports source styles',()=>{
 const donor=createTransfer('gutenberg',{name:'za/timeline-full-widget',attributes:{lineWidth:11},innerBlocks:[{name:'za/timeline-item',attributes:{markerSize:40},innerBlocks:[{name:'core/paragraph',attributes:{content:'DONOR',textColor:'red'},innerBlocks:[]}]}]});
 const receiver={name:'za/timeline-full-widget',attributes:{lineWidth:3},innerBlocks:[{name:'za/timeline-item',attributes:{markerSize:20},innerBlocks:[{name:'core/paragraph',attributes:{content:'RECEIVER',textColor:'blue'},innerBlocks:[]}]}]};
 const result=prepareImport(donor,'gutenberg',{content:false},local,receiver);
 assert.equal(result.attributes.lineWidth,11);
 assert.equal(result.innerBlocks[0].attributes.markerSize,40);
 assert.equal(result.innerBlocks[0].innerBlocks[0].attributes.content,'RECEIVER');
 assert.equal(result.innerBlocks[0].innerBlocks[0].attributes.textColor,'red');
});
check('Disabling content keeps Elementor target text but imports item styling',()=>{
 const receiver={list:[{list_title:'RECEIVER',list_content:'Current copy',item_title_color:'#000'}]};
 const result=prepareImport(ep,'elementor',{content:false},local,receiver);
 assert.equal(result.list[0].list_title,'RECEIVER');
 assert.equal(result.list[0].list_content,'Current copy');
 assert.equal(result.list[0].item_title_color,'#ee8899');
});
check('Rejects unsafe script HTML, CSS imports and executable URL schemes',()=>{
 assert.throws(()=>parseTransfer({...gp,data:{...gp.data,innerBlocks:[{name:'core/paragraph',attributes:{content:'<script>alert(1)</script>'},innerBlocks:[]}] }},'gutenberg'),/disallowed executable HTML/);
 assert.throws(()=>parseTransfer({...ep,data:{...ep.data,custom_css:'@import url(https://evil.test/x.css);'}},'elementor'),/Unsafe CSS/);
 assert.throws(()=>parseTransfer({...ep,data:{...ep.data,list:[{list_title:'click',title_link_url:{url:'javascript:alert(1)'}}]}},'elementor'),/Unsafe URL/);
 assert.throws(()=>parseTransfer({...gp,data:{...gp.data,innerBlocks:[{name:'core/html',attributes:{content:'<p>hi</p>'},innerBlocks:[]}] }},'gutenberg'),/Unsupported block type/);
 assert.throws(()=>parseTransfer({...gp,data:{...gp.data,innerBlocks:[{name:'core/paragraph',attributes:{content:'<img onerror=alert(1) src=x>'},innerBlocks:[]}] }},'gutenberg'),/unsafe HTML/i);
});
check('Transfer refuses unsafe receiver placeholder URLs and keeps content transfer enabled by default',()=>{
 assert.equal(IMPORT_OPTIONS.content,true);
 assert.throws(()=>prepareImport(ep,'elementor',{},'javascript:alert(1)'),/Invalid local media/);
});
check('Transfer file with forged media policy is rejected',()=>{assert.throws(()=>parseTransfer({...ep,mediaPolicy:'copy-source-media'},'elementor'),/privacy policy/);});
check('Gutenberg sidebar and Elementor control wires are present',()=>{const php=readFileSync('includes/Elementor/TimelineWidget.php','utf8');const panel=readFileSync('assets/js/transfer/gutenberg-editor.js','utf8');assert(php.includes('tfw_transfer_section'));assert(panel.includes('editor.BlockEdit'));assert(panel.includes('replaceBlocks'));});
check('onTheOneSide from actual exported Gutenberg attributes is safe, but event handler names remain blocked',()=>{
 const legacy=createTransfer('gutenberg',{name:'za/timeline-full-widget',attributes:{onTheOneSide:false},innerBlocks:[{name:'za/timeline-item',attributes:{onTheOneSide:true},innerBlocks:[]}]});
 assert.equal(parseTransfer(legacy,'gutenberg').data.innerBlocks[0].attributes.onTheOneSide,true);
 assert.throws(()=>parseTransfer({...legacy,data:{...legacy.data,attributes:{onclick:'alert(1)'}}},'gutenberg'),/Unsafe transfer property/);
 assert.throws(()=>parseTransfer({...legacy,data:{...legacy.data,attributes:{onTheOneSide:'alert(1)'}}},'gutenberg'),/Unsafe transfer property/);
});
check('Legacy Gutenberg content objects are accepted as empty content with a warning',()=>{
 const legacy=createTransfer('gutenberg',{name:'za/timeline-full-widget',attributes:{},innerBlocks:[{name:'core/heading',attributes:{content:{}},innerBlocks:[]}]});
 const result=parseTransfer(legacy,'gutenberg');
 assert(result.warnings?.length);
 assert.equal(result.data.innerBlocks[0].attributes.content,'');
});
check('Gutenberg transfer imports into Elementor with mapped native controls and repeater text',()=>{
 const donor=createTransfer('gutenberg',{name:'za/timeline-full-widget',attributes:{lineColor:'#123456',lineWidth:6,markerSize:40,showStepNumbers:true,onTheOneSide:false,className:'shared-class'},innerBlocks:[{name:'za/timeline-item',attributes:{otherSiteTitle:'Side title'},innerBlocks:[{name:'za/timeline-item-side',attributes:{},innerBlocks:[{name:'core/paragraph',attributes:{content:'Sidebar text'},innerBlocks:[]}]},{name:'za/timeline-item-content',attributes:{mediaType:'video',mediaUrl:'https://donor.test/video.webm'},innerBlocks:[{name:'core/heading',attributes:{content:'Donor title'},innerBlocks:[]},{name:'core/paragraph',attributes:{content:'Donor body'},innerBlocks:[]}]}]}]});
 const parsed=parseTransfer(donor,'elementor');
 const converted=prepareImport(parsed,'elementor',{},local);
 assert.equal(converted.timeline_line_width.size,6);assert.equal(converted.timeline_marker_size.size,40);
 assert.equal(converted.tl_show_step_numbers,'yes');assert.equal(converted.list.length,1);
 assert.equal(converted.list[0].list_title,'Donor title');assert.equal(converted.list[0].list_content,'<p>Donor body</p>');
 assert.equal(converted.list[0].side_content,'<p>Sidebar text</p>');
 assert.equal(converted.list[0].media_type,'video'); assert.equal(converted.list[0].media_video.url,'');
 assert.equal(converted.list[0].posterURL.url,local);
 assert.equal(converted._css_classes,'shared-class');
});
check('WordPress standard Gutenberg color slugs resolve to actual colors for Elementor', () => {
 const source = createTransfer('gutenberg', {name:'za/timeline-full-widget',attributes:{},innerBlocks:[
  {name:'za/timeline-item',attributes:{backgroundColor:'vivid-green-cyan'},innerBlocks:[
   {name:'za/timeline-item-content',attributes:{},innerBlocks:[
    {name:'core/heading',attributes:{content:'First',textColor:'vivid-red'},innerBlocks:[]},
    {name:'core/paragraph',attributes:{content:'Description',style:{color:{text:'var:preset|color|vivid-green-cyan'}}},innerBlocks:[]},
   ]},
  ]},
  {name:'za/timeline-item',attributes:{backgroundColor:'pale-cyan-blue'},innerBlocks:[]},
 ]});
 const imported=prepareImport(source,'elementor',{},local);
 assert.equal(imported.list[0].li_bg_color,'#00d084');
 assert.equal(imported.list[1].li_bg_color,'#8ed1fc');
 assert.equal(imported.list[0].item_title_color,'#cf2e2e');
 assert.equal(imported.list[0].item_content_color,'#00d084');
 assert.equal(imported.list[0].inherit_item_styles,'no');
 assert.equal(imported.list[1].inherit_item_styles,'no');
});
check('Source site custom theme palette values transfer to Elementor and take precedence', () => {
 const data={name:'za/timeline-full-widget',attributes:{},innerBlocks:[
  {name:'za/timeline-item',attributes:{backgroundColor:'vivid-green-cyan'},innerBlocks:[]},
  {name:'za/timeline-item',attributes:{backgroundColor:'brand-accent'},innerBlocks:[]},
 ]};
 const file=createTransfer('gutenberg',data,{palette:{'vivid-green-cyan':'#1abc9c','brand-accent':'#aabbcc'}});
 const imported=prepareImport(file,'elementor',{},local);
 assert.equal(imported.list[0].li_bg_color,'#1abc9c');
 assert.equal(imported.list[1].li_bg_color,'#aabbcc');
 assert.equal(resolveGutenbergColor('var:preset|color|brand-accent',file.palette),'#aabbcc');
});
check('Unsafe CSS palette properties and executable values are rejected', () => {
 const file=createTransfer('gutenberg',{name:'za/timeline-full-widget',attributes:{},innerBlocks:[]});
 file.palette={'brand': 'url(javascript:alert(1))'};
 assert.throws(()=>parseTransfer(file,'elementor'), /palette/);
 file.palette={'__proto__':'#000000'};
 file.palette=JSON.parse('{"__proto__":"#000000"}');
 assert.throws(()=>parseTransfer(file,'elementor'), /Unsafe|prototype/);
});
check('Disabling background transfer omits per-item Elementor background colors', () => {
 const file=createTransfer('gutenberg',{name:'za/timeline-full-widget',attributes:{},innerBlocks:[
  {name:'za/timeline-item',attributes:{backgroundColor:'vivid-green-cyan'},innerBlocks:[]}
 ]});
 const imported=prepareImport(file,'elementor',{background:false},local);
 assert.equal('li_bg_color' in imported.list[0],false);
});
check('Elementor to Gutenberg rebuilds nested content, preserves media types and effective layouts',()=>{
 const source=createTransfer('elementor',{
  tl_change_direction:'left',tl_content_horizontal_layout:'yes',shared_reverse_media_content:'',
  tl_is_marker_unique:'yes',timeline_marker_size:{size:40,unit:'px'},
  shared_item_background_color:'#aabbcc',title_color:'#123456',blocks_color:'#654321',
  list:[
   {inherit_item_styles:'yes',tl_card_change_direction:'yes',list_title:'First',list_content:'<p>Paragraph <strong>content</strong></p>',side_content:'<ul><li>One</li><li>Two</li></ul>',
    media_type:'image',media_image:{id:42,url:'https://donor.test/test.jpg',width:220}, marker_image:{id:2,url:'https://donor.test/icon.jpg'}},
   {inherit_item_styles:'no',item_content_layout:'vertical',tl_card_change_direction:'yes',li_bg_color:'#00d084',
    list_title:'Second',list_content:'<p>Body</p>',media_type:'video',media_video:{id:45,url:'https://donor.test/movie.mp4'},posterURL:{id:33,url:'https://donor.test/poster.jpg'}},
  ],
 });
 const out=prepareImport(source,'gutenberg',{},local);
 assert.equal(out.name,'za/timeline-full-widget');assert.equal(out.innerBlocks.length,2);
 assert.equal(out.attributes.markerSize,40);
 const [first,second]=out.innerBlocks;
 assert.equal(first.attributes.horizontalContentLayout,true);
 assert.equal(first.attributes.reverseMediaContent,true,'layout is independent of visual style inheritance');
 assert.equal(first.attributes.itemBackgroundColor,'#aabbcc');
 assert.equal(first.innerBlocks[0].innerBlocks[0].name,'core/list');
 assert.equal(first.innerBlocks[0].innerBlocks[0].innerBlocks.length,2);
 assert.equal(first.innerBlocks[1].innerBlocks[0].attributes.content,'First');
 assert.equal(first.innerBlocks[1].innerBlocks[1].attributes.content,'Paragraph <strong>content</strong>');
 assert.equal(first.innerBlocks[1].attributes.mediaUrl,local);
 assert.equal(first.attributes.markerUrl,local);
 assert.equal(first.innerBlocks[1].attributes.mediaWidth,'220px');
 assert.equal(second.attributes.horizontalContentLayout,false);
 assert.equal(second.attributes.reverseMediaContent,true);
 assert.equal(second.attributes.itemBackgroundColor,'#00d084');
 assert.equal(second.innerBlocks[1].attributes.mediaType,'video');
 assert.equal(second.innerBlocks[1].attributes.videoPoster,local);
 assert.equal(second.innerBlocks[1].attributes.mediaUrl,local);
});
check('Cross-editor selective import can omit text, IDs, colors, spacing, and classes',()=>{
 const donor=createTransfer('elementor',{_element_id:'unsafe-duplicate',_css_classes:'imported',_margin:{top:'17',unit:'px'},
  tl_content_horizontal_layout:'yes',list:[{list_title:'Donor',list_content:'<p>Incoming</p>',li_bg_color:'#aabbcc',inherit_item_styles:'no'}]});
 const current={name:'za/timeline-full-widget',attributes:{},innerBlocks:[{name:'za/timeline-item',attributes:{},innerBlocks:[
  {name:'za/timeline-item-side',attributes:{},innerBlocks:[]},
  {name:'za/timeline-item-content',attributes:{},innerBlocks:[{name:'core/heading',attributes:{content:'Receiver'},innerBlocks:[]},{name:'core/paragraph',attributes:{content:'Existing'},innerBlocks:[]}]},
 ]}]};
 const out=prepareImport(donor,'gutenberg',{content:false,background:false,margin:false,classes:false},local,current);
 assert(!('anchor' in out.attributes));assert(!('className' in out.attributes));
 assert(!('spacing' in (out.attributes.style||{})));
 assert(!('itemBackgroundColor' in out.innerBlocks[0].attributes));
 assert.equal(out.innerBlocks[0].innerBlocks[1].innerBlocks[0].attributes.content,'Receiver');
 assert.equal(out.innerBlocks[0].innerBlocks[1].innerBlocks[1].attributes.content,'Existing');
});
check('Elementor paragraph titles keep receiver Gutenberg heading text when content is excluded',()=>{
 const src=createTransfer('elementor',{header_tag:'p',list:[{list_title:'Donor',list_content:'<p>Replacement</p>'}]});
 const receiver={name:'za/timeline-full-widget',attributes:{},innerBlocks:[{name:'za/timeline-item',attributes:{},innerBlocks:[
  {name:'za/timeline-item-side',attributes:{},innerBlocks:[]},
  {name:'za/timeline-item-content',attributes:{},innerBlocks:[
   {name:'core/heading',attributes:{content:'Keep headline'},innerBlocks:[]},
   {name:'core/paragraph',attributes:{content:'Keep paragraph'},innerBlocks:[]},
  ]},
 ]}]};
 const out=prepareImport(src,'gutenberg',{content:false},local,receiver);
 assert.equal(out.innerBlocks[0].innerBlocks[1].innerBlocks[0].name,'core/heading');
 assert.equal(out.innerBlocks[0].innerBlocks[1].innerBlocks[0].attributes.content,'Keep headline');
 assert.equal(out.innerBlocks[0].innerBlocks[1].innerBlocks[1].attributes.content,'Keep paragraph');
});
check('Gutenberg -> Elementor uses authoritative parent layout, not stale nested mirrors',()=>{
 const file=createTransfer('gutenberg',{name:'za/timeline-full-widget',attributes:{},innerBlocks:[
  {name:'za/timeline-item',attributes:{horizontalContentLayout:true,reverseMediaContent:true},innerBlocks:[
    {name:'za/timeline-item-content',attributes:{horizontalContentLayout:false,reverseMediaContent:false,mediaType:'image',mediaUrl:''},innerBlocks:[]}]},
  {name:'za/timeline-item',attributes:{horizontalContentLayout:false,reverseMediaContent:false},innerBlocks:[
    {name:'za/timeline-item-content',attributes:{horizontalContentLayout:true,reverseMediaContent:true,mediaType:'image',mediaUrl:''},innerBlocks:[]}]},
 ]});
 const out=prepareImport(file,'elementor',{},local);
 assert.equal('tl_content_horizontal_layout' in out,false);
 assert.equal(out.list[0].item_content_layout,'horizontal');
 assert.equal(out.list[0].tl_card_change_direction,'yes');
 assert.equal(out.list[0].inherit_item_styles,undefined,'layout switches do not force unique visual styling');
 assert.equal(out.list[1].item_content_layout,'vertical');
 assert.equal(out.list[1].media_image.url,'');
 assert.equal(out.list[0].marker_image.url,'');
});
check('Gutenberg first paragraph remains Elementor title and later heading stays in body',()=>{
 const source=createTransfer('gutenberg',{name:'za/timeline-full-widget',attributes:{},innerBlocks:[
  {name:'za/timeline-item',attributes:{horizontalContentLayout:true,reverseMediaContent:true},innerBlocks:[
   {name:'za/timeline-item-side',attributes:{},innerBlocks:[{name:'core/heading',attributes:{content:'Opposite side',level:2},innerBlocks:[]}]},
   {name:'za/timeline-item-content',attributes:{horizontalContentLayout:false,reverseMediaContent:false},innerBlocks:[
    {name:'core/paragraph',attributes:{content:'Horizontal block first'},innerBlocks:[]},
    {name:'core/heading',attributes:{content:'Reverse right',level:2},innerBlocks:[]}]}
  ]}
 ]});
 const out=prepareImport(source,'elementor',{},local);
 assert.equal(out.list[0].list_title,'Horizontal block first');
 assert.equal(out.list[0].list_content,'<h2>Reverse right</h2>');
 assert.equal(out.list[0].side_content,'<h2>Opposite side</h2>');
 assert.equal(out.list[0].item_content_layout,'horizontal');
 assert.equal(out.list[0].tl_card_change_direction,'yes');
});
check('Elementor -> Gutenberg retains separate title, linked rich content and receiver-local background',()=>{
 const source=createTransfer('elementor',{
  _background_background:'classic', _background_color:'#aabbcc',
  _background_image:{url:'https://source.test/big-photo.jpg',id:5},
  tl_content_horizontal_layout:'yes', header_tag:'p', blocks_color:'#f31114',
  list:[{list_title:'The Lord of the Rings',list_content:'<p>Opening <a href="https://example.com/story">linked words</a> afterward</p>',
    side_content:'<p>Opposite side text</p>',inherit_item_styles:'yes'}]
 });
 const out=prepareImport(source,'gutenberg',{},local);
 assert.equal(out.attributes.timelineBackgroundColor,'#aabbcc');
 assert.equal(out.attributes.timelineBackgroundImage,local);
 const item=out.innerBlocks[0];
 const content=item.innerBlocks.find(i=>i.name==='za/timeline-item-content');
 assert.equal(content.innerBlocks[0].name,'core/heading');
 assert.equal(content.innerBlocks[0].attributes.content,'The Lord of the Rings');
 assert(content.innerBlocks[1].attributes.content.includes('href="https://example.com/story"'));
 assert.equal(item.horizontalContentLayout,undefined);
 assert.equal(item.attributes.horizontalContentLayout,true);
 assert.equal(content.innerBlocks[1].attributes.style.color.text,'#f31114');
 assert.equal(item.innerBlocks[0].innerBlocks[0].attributes.content,'Opposite side text');
});
check('Elementor title hyperlink is kept independently of paragraph hyperlink',()=>{
 const source=createTransfer('elementor',{header_tag:'a',list:[{
  list_title:'Linked title',title_link_url:{url:'https://example.com/title'},
  list_content:'<p>Body <a href="https://example.com/body">body link</a></p>'
 }]});
 const out=prepareImport(source,'gutenberg',{},local).innerBlocks[0].innerBlocks[1].innerBlocks;
 assert.equal(out[0].name,'core/heading');
 assert(out[0].attributes.content.includes('href="https://example.com/title"'));
 assert(out[1].attributes.content.includes('href="https://example.com/body"'));
});
check('Empty Elementor media controls remain empty instead of producing invented images',()=>{
 const file=createTransfer('elementor',{list:[{media_type:'image',media_image:{url:'',id:0},marker_image:{url:'',id:0},posterURL:{url:'',id:0},list_title:'No image'}]});
 const out=prepareImport(file,'elementor',{},local);
 assert.equal(out.list[0].media_image.url,'');assert.equal(out.list[0].marker_image.url,'');
 assert.equal(out.list[0].posterURL.url,'');
});
check('Imported marker SVG placeholder has explicit bounded marker size in shared and compiled CSS',()=>{
 const core=readFileSync('assets/css/core/style.css','utf8');
 const generated=readFileSync('build/style-index.css','utf8');
 assert(core.includes('.timeline .tl-mark img[src*="media-placeholder.svg"]'));
 assert(core.includes('max-width: var(--marker-size, 30px) !important'));
 assert(generated.includes('max-width:var(--marker-size,30px)!important'));
});
console.log(`PASS: ${checks} portable transfer assertions.`);

check('Elementor layout switches are per item, default off, and independent of shared visual styles',()=>{
 const file=createTransfer('elementor',{list:[
  {list_title:'Horizontal',inherit_item_styles:'yes',item_content_layout:'horizontal',tl_card_change_direction:'yes'},
  {list_title:'Normal',inherit_item_styles:'yes',item_content_layout:'',tl_card_change_direction:''},
  {list_title:'Unique color',inherit_item_styles:'no',item_content_layout:'',tl_card_change_direction:'',li_bg_color:'#aaa'},
 ]});
 assert.equal('tl_content_horizontal_layout' in file.data,false);
 assert.equal('shared_reverse_media_content' in file.data,false);
 const e=prepareImport(file,'elementor',{},local);
 assert.equal(e.list[0].item_content_layout,'horizontal');
 assert.equal(e.list[0].tl_card_change_direction,'yes');
 assert.equal(e.list[0].inherit_item_styles,'yes');
 const g=prepareImport(file,'gutenberg',{},local);
 assert.deepEqual(g.innerBlocks.map(item=>item.attributes.horizontalContentLayout),[true,false,false]);
 assert.deepEqual(g.innerBlocks.map(item=>item.attributes.reverseMediaContent),[true,false,false]);
});
check('Gutenberg flags round-trip through Elementor without changing shared visual style inheritance',()=>{
 const g={name:'za/timeline-full-widget',attributes:{},innerBlocks:[
  {name:'za/timeline-item',attributes:{horizontalContentLayout:true,reverseMediaContent:false},innerBlocks:[]},
  {name:'za/timeline-item',attributes:{horizontalContentLayout:false,reverseMediaContent:true},innerBlocks:[]},
 ]};
 const el=prepareImport(createTransfer('gutenberg',g),'elementor',{},local);
 assert.equal('tl_content_horizontal_layout' in el,false);
 assert.deepEqual(el.list.map(i=>i.item_content_layout),['horizontal','vertical']);
 assert.deepEqual(el.list.map(i=>i.tl_card_change_direction),['no','yes']);
 assert(el.list.every(i=>i.inherit_item_styles===undefined));
 const back=prepareImport(createTransfer('elementor',el),'gutenberg',{},local);
 assert.deepEqual(back.innerBlocks.map(i=>i.attributes.horizontalContentLayout),[true,false]);
 assert.deepEqual(back.innerBlocks.map(i=>i.attributes.reverseMediaContent),[false,true]);
});
check('Old widget-wide layout JSON is normalized only at the transfer boundary',()=>{
 const old={list:[{list_title:'Legacy',inherit_item_styles:'yes',item_content_layout:'global'},
                  {list_title:'Explicit',item_content_layout:'vertical',tl_card_change_direction:''}],
            tl_content_horizontal_layout:'yes',shared_reverse_media_content:'yes'};
 const file=createTransfer('elementor',old);
 assert.equal(file.pluginVersion,'4.0.0');
 assert.equal(file.data.tl_content_horizontal_layout,undefined);
 assert.equal(file.data.shared_reverse_media_content,undefined);
 assert.equal(file.data.list[0].item_content_layout,'horizontal');
 assert.equal(file.data.list[0].tl_card_change_direction,'yes');
 assert.equal(file.data.list[1].item_content_layout,'vertical');
 assert.equal(file.data.list[1].tl_card_change_direction,'');
 // Emulate original 4.0.5 export bypassing the new createTransfer() normalizer.
 const legacyFile={...file,data:old};
 assert.equal(prepareImport(legacyFile,'elementor',{},local).list[0].item_content_layout,'horizontal');
 assert.equal(prepareImport(legacyFile,'gutenberg',{},local).innerBlocks[0].attributes.reverseMediaContent,true);
});

console.log("PASS: updated transfer assertions completed.");
