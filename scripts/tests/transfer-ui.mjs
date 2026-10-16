import { readFileSync } from 'node:fs';
/** Browser-adapter flow smoke test with minimal, dependency-free editor API doubles. */
import assert from 'node:assert/strict';
import { createTransfer } from '../../assets/js/transfer/transfer-core.js';

const placeholder = 'https://receiver.test/wp-content/plugins/timeline-full-widget/assets/images/media-placeholder.svg';
let assertions = 0;
function verify( name, condition ) {
    assert( condition, name );
    console.log( 'PASS: ' + name );
    assertions++;
}
const nodes = [];
const clickHandlers = {};
const captureOptions = {};
let download;
let latestBlob;
URL.createObjectURL = ( blob ) => { latestBlob = blob; return 'blob:local-test'; };
URL.revokeObjectURL = () => {};
function domNode( tag ) {
    const node = {
        tagName: tag, dataset: {}, children: [], style: {}, value: '', checked: false,
        setAttribute(name,value){ this[name] = value; },
        addEventListener( name, listener ) { this.handlers ??= {}; this.handlers[ name ] = listener; },
        append( ...values ) { this.children.push( ...values ); },
        appendChild( value ) { this.children.push( value ); },
        remove() {this.removed=true;}, focus() {document.activeElement=this;},
        click() {
            if ( tag === 'a' ) download = this.download;
            else this.handlers?.click?.( { target: this } );
        },
    };
    nodes.push( node );
    return node;
}
globalThis.document = {
    activeElement: {focus(){}},
    body: {appendChild(){},append(){}},
    querySelector: (selector)=>selector === '.tfw-transfer-overlay' ? nodes.findLast((node)=>node.className === 'tfw-transfer-overlay' && !node.removed) : null,
    createElement: domNode,
    createTextNode: ( text ) => text,
    addEventListener: ( event, handler, capture ) => { clickHandlers[ event ] = handler; captureOptions[ event ] = capture; },
};
const elementorSettings = {
    _element_id: 'do-not-auto-import', _css_classes: 'portable-custom',
    _margin: {top:'12',unit:'px'},timeline_marker_size:{size:40,unit:'px'},
    custom_css:'selector {color: #f09;}',
    list:[{_id:'abc123',list_title:'A',media_type:'image',media_image:{id:22,url:'https://donor.test/img.jpg'}}],
};
const modelSettings = { toJSON: () => elementorSettings, set: ( patch ) => Object.assign(elementorSettings,patch) };
const elementModel = { get: ( key ) => key === 'widgetType' ? 'za-timeline' : key === 'settings' ? modelSettings : key === 'id' ? 'elementor-test-id' : undefined };
const elementView = { getEditModel: () => elementModel, getContainer: () => ({id:'elementor-container-1'}) };
let committedElementor;
globalThis.window = {
    timelineTransferConfig:{placeholderUrl:placeholder},
    alert:(message)=>{throw new Error(message);},
    elementor:{getPanelView:()=>({getCurrentPageView:()=>({getOption:()=>elementView})})},
    $e:{run:(cmd,payload)=>{ committedElementor={cmd,payload}; }},
};
// Elementor sometimes executes widget scripts as classics; run the exact
// shipped classic loader in Node's classic Script VM, with its native import()
// importing the real ESM entrypoint. This catches the original SyntaxError
// instead of directly importing an ES module in a test-only happy path.
const loaderURL = new URL('../../assets/js/transfer/elementor-editor-loader.js', import.meta.url);
document.currentScript = {src: loaderURL.href + '?ver=4.0.5'};
const classicLoader = new Function( readFileSync(loaderURL, 'utf8') );
classicLoader();
for (let attempt=0; !clickHandlers.click && attempt<50; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 10));
}
verify('Classic Elementor loader dynamically imports entrypoint and binds click listener', typeof clickHandlers.click === 'function');
const animationClassicSource = readFileSync(new URL('../../assets/js/adapters/elementor-loader.js', import.meta.url), 'utf8');
verify('Elementor widget animation bootstrap also parses as a classic script', typeof new Function(animationClassicSource) === 'function');
verify('Elementor action interception uses capture before panel event handlers', typeof clickHandlers.click === 'function' && captureOptions.click===true);
const dispatchElementorAction = ( kind ) => clickHandlers.click({ target: {closest:()=>({dataset:{tfwAction:kind}})},preventDefault(){} });
dispatchElementorAction('export');
verify('Elementor export starts a local JSON download with clear filename', /^timeline-elementor-.*\.tfw\.json$/.test(download));
const exported = JSON.parse( await latestBlob.text() );
verify('Elementor export captures Advanced settings', exported.data.custom_css==='selector {color: #f09;}' && exported.data._css_classes==='portable-custom');
verify('Elementor export does not include donor media URL', exported.data.list[0].media_image.url==='tfw://media-placeholder');
dispatchElementorAction('import');
const upload = nodes.findLast((node)=>node.tagName==='input' && node.type==='file');
verify('Elementor import invokes the system file picker', !!upload);
upload.files=[{size:JSON.stringify(exported).length,text:async()=>JSON.stringify(exported)}];
await upload.handlers.change();
const confirmation = nodes.findLast((node)=>node.tagName==='button' && node.textContent==='Apply selected properties');
verify('Elementor offers a configurable confirmation dialog', !!confirmation);
confirmation.click();
verify('Elementor applies new native settings through editor command', committedElementor.cmd==='document/elements/settings');
verify('Elementor defaults to not copying HTML ID but keeps CSS selector IDs', !('_element_id' in committedElementor.payload.settings) && committedElementor.payload.settings.list[0]._id==='abc123');
verify('Elementor import resolves media placeholder to receiver site', committedElementor.payload.settings.list[0].media_image.url===placeholder);
const selectedOnly = { model: elementModel, getContainer:()=>({id:'selected-elementor-container'}) };
window.elementor.getPanelView=()=>null;
window.elementor.selection={getElements:()=>[selectedOnly]};
dispatchElementorAction('export');
verify('Elementor selection fallback works when panel view is unavailable', download.startsWith('timeline-elementor-'));
// Modern Elementor keeps the widget directly in currentPageView.model.
window.elementor.getPanelView=()=>({currentPageView:{model:elementModel}});
window.elementor.getContainer=()=>({id:'modern-container',model:elementModel});
dispatchElementorAction('export');
verify('Elementor modern currentPageView.model is resolved without editedElementView', /^timeline-elementor/.test(download));
// Real Gutenberg-to-Elementor portable file with distinct property naming.
const fromGutenberg={format:'timeline-full-widget',schemaVersion:1,origin:'gutenberg',elementType:'za/timeline-full-widget',mediaPolicy:'placeholder-only',pluginVersion:'4.0.1',data:{name:'za/timeline-full-widget',attributes:{onTheOneSide:false,lineWidth:6,markerSize:40},innerBlocks:[{name:'za/timeline-item',attributes:{onTheOneSide:false},innerBlocks:[{name:'za/timeline-item-content',attributes:{mediaType:'image',mediaUrl:'tfw://media-placeholder'},innerBlocks:[{name:'core/heading',attributes:{content:'Bridge headline'},innerBlocks:[]},{name:'core/paragraph',attributes:{content:'Bridge paragraph'},innerBlocks:[]}]}]}]}};
dispatchElementorAction('import');
const crossUpload=nodes.findLast((node)=>node.tagName==='input' && node.type==='file');
const crossText=JSON.stringify(fromGutenberg);
crossUpload.files=[{name:'timeline-gutenberg.tfw.json',size:crossText.length,text:async()=>crossText}];
await crossUpload.handlers.change();
nodes.findLast((node)=>node.tagName==='button' && node.textContent==='Apply selected properties').click();
verify('Elementor accepts Gutenberg exports and maps headline, line width and marker size',committedElementor.payload.settings.list[0].list_title==='Bridge headline' && committedElementor.payload.settings.timeline_line_width.size===6 && committedElementor.payload.settings.timeline_marker_size.size===40);



const replacementCalls=[];
const inspectorRegistration=[];
let hookStates=[];
let cursor=0;
const rendered = ( type, props, ...children ) => ({type,props:props||{},children});
const nativeChildren=[{name:'za/timeline-item',attributes:{itemBackgroundColor:'#abc',backgroundColor:'brand-accent'},innerBlocks:[{name:'za/timeline-item-content',attributes:{mediaType:'image',mediaUrl:'https://donor.test/card.jpg',mediaWidth:'210px'},innerBlocks:[{name:'core/heading',attributes:{content:'Original headline'},innerBlocks:[]},{name:'core/paragraph',attributes:{content:'Existing destination text'},innerBlocks:[]}]}]}];
window.timelineTransferGutenberg={placeholderUrl:placeholder};
window.wp={
    element:{ createElement:rendered,Fragment:'Fragment',useRef:(v)=>({current:v}),useState(initial) {
        const i=cursor++;
        if (!(i in hookStates)) hookStates[i]=initial;
        return [hookStates[i],(v)=>{ hookStates[i] = typeof v === 'function' ? v(hookStates[i]) : v; }];
    }},
    components:{PanelBody:'PanelBody',Button:'Button',CheckboxControl:'CheckboxControl',Notice:'Notice'},
    blockEditor:{InspectorControls:'InspectorControls'},
    data:{useSelect:()=>nativeChildren,useDispatch:()=>({replaceBlocks:(old,updated)=>replacementCalls.push({old,updated})}),select:()=>({getSettings:()=>({colors:[{slug:'brand-accent',color:'#125678'}]})})},
    blocks:{createBlock:(name,attributes,innerBlocks)=>({name,attributes,innerBlocks,clientId:'new-'+name}),getBlockType:()=>({name:'found'})},
    hooks:{addFilter:(name,namespace,fn)=>inspectorRegistration.push({name,namespace,fn})},
    i18n:{__:(text)=>text},
};
// Gutenberg used to be directly enqueued with type=text/javascript in some WP installs.
// Evaluate its shipped classic bootstrap exactly like the Elementor bootstrap,
// rather than importing the actual entrypoint directly in a test-only path.
const gutenbergLoaderURL = new URL('../../assets/js/transfer/gutenberg-editor-loader.js', import.meta.url);
document.currentScript = {src: gutenbergLoaderURL.href + '?ver=4.0.5'};
new Function(readFileSync(gutenbergLoaderURL, 'utf8'))();
for (let attempt=0; !inspectorRegistration.length && attempt<50; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 10));
}
verify('Classic Gutenberg loader dynamically imports the module and registers editor.BlockEdit', inspectorRegistration[0]?.name==='editor.BlockEdit');
const Wrapper = inspectorRegistration[0].fn( (props)=>rendered('OriginalEdit',props) );
const wrapTree=Wrapper({name:'za/timeline-full-widget',clientId:'old-parent',attributes:{lineWidth:4,markerSize:40}});
const panelComponent=wrapTree.children.find((node)=>node?.type?.name==='TransferPanel');
verify('Gutenberg sidebar only inserts for Timeline blocks', !!panelComponent && !Wrapper({name:'core/paragraph'}).children.find((node)=>node?.type?.name==='TransferPanel'));
function panelTree() {cursor=0;return panelComponent.type(panelComponent.props);}
function flatten(node) {if(!node || typeof node!=='object')return [];return [node,...(node.children||[]).flatMap(flatten)];}
let tree=panelTree();
const exportButton=flatten(tree).find((node)=>node.type==='Button'&&node.children.includes('Export Gutenberg Timeline'));
exportButton.props.onClick();
verify('Gutenberg export downloads editor-identified filename', /^timeline-gutenberg-.*\.tfw\.json$/.test(download));
const file=JSON.parse(await latestBlob.text());
verify('Gutenberg exports complete nested tree', file.data.innerBlocks[0].innerBlocks[0].name==='za/timeline-item-content');
verify('Gutenberg exports custom source color palette for cross-site Elementor background fidelity',file.palette['brand-accent']==='#125678');
// RichTextData is an object; plain JSON.stringify discards its contents.
const originalRichText=nativeChildren[0].innerBlocks[0].innerBlocks[1].attributes.content;
nativeChildren[0].innerBlocks[0].innerBlocks[1].attributes.content={toHTMLString:()=>'<strong>Styled heading</strong>'};
exportButton.props.onClick();
const richExport=JSON.parse(await latestBlob.text());
verify('Gutenberg export serializes RichTextData as HTML, not an empty object',richExport.data.innerBlocks[0].innerBlocks[0].innerBlocks[1].attributes.content==='<strong>Styled heading</strong>');
nativeChildren[0].innerBlocks[0].innerBlocks[1].attributes.content=originalRichText;

// Shared modal must replace all sidebar-only import settings. Test both
// editors with the actual same local DOM implementation.
const activeDialog=()=>document.querySelector('.tfw-transfer-overlay');
function dialogChildren(node) {
    return node && typeof node === 'object'
        ? [node,...(node.children||[]).flatMap(dialogChildren)] : [];
}
function dialogButton(name) {
    return dialogChildren(activeDialog()).find((node)=>node.tagName==='button'&&node.textContent===name);
}
function dialogCheckbox(labelText) {
    const label=dialogChildren(activeDialog()).find((node)=>node.tagName==='label'&&
        node.children.some((part)=>typeof part==='string' && part.includes(labelText)));
    return label?.children.find((node)=>node.tagName==='input' && node.type==='checkbox');
}
const importFile={...file,data:{...file.data,attributes:{...file.data.attributes,anchor:'incoming-id'},
 innerBlocks:[{...file.data.innerBlocks[0],innerBlocks:[{...file.data.innerBlocks[0].innerBlocks[0],innerBlocks:[{name:'core/heading',attributes:{content:'Donor headline'},innerBlocks:[]},{name:'core/paragraph',attributes:{content:'Imported paragraph'},innerBlocks:[]}]}]}]}};
const fileText=JSON.stringify(importFile);
const input=flatten(tree).find((node)=>node.type==='input');
await input.props.onChange({target:{files:[{name:'first.tfw.json',size:fileText.length,text:async()=>fileText}],value:'fake.json'}});
tree=panelTree();
verify('Gutenberg opens the existing shared import dialog after validating its file',
    !!activeDialog() && !!dialogButton('Apply selected properties'));
verify('Gutenberg inspector no longer renders the legacy checkbox/confirmation form',
    !flatten(tree).some((node)=>node.type==='CheckboxControl' || (node.type==='Button'&&node.children.includes('Apply selected properties'))));
verify('Gutenberg modal offers content, ID and styling settings (HTML IDs off)',
    dialogCheckbox('Headings, text')?.checked===true &&
    dialogCheckbox('HTML IDs')?.checked===false && dialogCheckbox('Typography')?.checked===true);
verify('Gutenberg modal includes imported filename as text',
    dialogChildren(activeDialog()).some((node)=>node.tagName==='p' && node.textContent?.includes('first.tfw.json')));
dialogButton('Apply selected properties').click();
const changed=replacementCalls[0];
verify('Gutenberg replaces the entire parent, avoiding new-item inheritance race', changed?.old[0]==='old-parent' && changed.updated[0].name==='za/timeline-full-widget');
verify('Gutenberg imported nested styles and dimensions survive replacement', changed.updated[0].innerBlocks[0].attributes.itemBackgroundColor==='#abc' && changed.updated[0].innerBlocks[0].innerBlocks[0].attributes.mediaWidth==='210px');
verify('Gutenberg defaults to omitting donor HTML ID', !('anchor' in changed.updated[0].attributes));
verify('Gutenberg resolves placeholder to local receiver file', changed.updated[0].innerBlocks[0].innerBlocks[0].attributes.mediaUrl===placeholder);
verify('Gutenberg imports donor heading and paragraph content', changed.updated[0].innerBlocks[0].innerBlocks[0].innerBlocks[0].attributes.content==='Donor headline' && changed.updated[0].innerBlocks[0].innerBlocks[0].innerBlocks[1].attributes.content==='Imported paragraph');
verify('Modal closes after successful Gutenberg replacement', !activeDialog());

// Re-import with content disabled: original destination texts survive.
const inputAgain=flatten(panelTree()).find((node)=>node.type==='input');
await inputAgain.props.onChange({target:{files:[{name:'second.tfw.json',size:fileText.length,text:async()=>fileText}],value:'second.json'}});
verify('Reopening the modal resets options for each file',dialogCheckbox('Headings, text').checked===true);
dialogCheckbox('Headings, text').checked=false;
dialogButton('Apply selected properties').click();
const withoutContent=replacementCalls[1].updated[0].innerBlocks[0].innerBlocks[0].innerBlocks;
verify('Gutenberg preserves destination text when content is disabled', withoutContent[0].attributes.content==='Original headline' && withoutContent[1].attributes.content==='Existing destination text');

// Cancellation must not mutate the editor and must allow choosing the same file.
const initialReplaceCount=replacementCalls.length;
await inputAgain.props.onChange({target:{files:[{name:'cancel.tfw.json',size:fileText.length,text:async()=>fileText}],value:'cancel.json'}});
dialogButton('Cancel').click();
verify('Gutenberg Cancel discards uncommitted changes', replacementCalls.length===initialReplaceCount && !activeDialog());

// Reverse cross-editor direction: Elementor JSON accepted by Gutenberg.
const elementorDonor = createTransfer('elementor', {
    tl_content_horizontal_layout:'yes', shared_reverse_media_content:'',
    timeline_marker_size:{size:37,unit:'px'},
    list:[{_id:'abc987',list_title:'Elementor source title',list_content:'<p>Elementor body</p>',
        media_type:'image',media_image:{url:'https://donor.test/photo.jpg',id:52},
        inherit_item_styles:'no',item_content_layout:'vertical',tl_card_change_direction:'yes'}],
});
const reverseText=JSON.stringify(elementorDonor);
const reverseInput=flatten(panelTree()).find((node)=>node.type==='input');
await reverseInput.props.onChange({target:{files:[{name:'timeline-elementor-v1.tfw.json',size:reverseText.length,text:async()=>reverseText}],value:'reverse.json'}});
verify('Gutenberg shows cross-editor warnings inside modal',
    dialogChildren(activeDialog()).some((node)=>node.tagName==='p'&&node.textContent?.includes('Cross-editor import')));
dialogButton('Apply selected properties').click();
const reverseResult=replacementCalls.at(-1).updated[0];
verify('Elementor to Gutenberg import reconstructs native blocks with title, content, layout and media placeholder',
    reverseResult.innerBlocks[0].innerBlocks[1].innerBlocks[0].attributes.content==='Elementor source title' &&
    reverseResult.innerBlocks[0].innerBlocks[1].innerBlocks[1].attributes.content==='Elementor body' &&
    reverseResult.innerBlocks[0].innerBlocks[1].attributes.horizontalContentLayout===false &&
    reverseResult.innerBlocks[0].innerBlocks[1].attributes.reverseMediaContent===true &&
    reverseResult.innerBlocks[0].innerBlocks[1].attributes.mediaUrl===placeholder &&
    reverseResult.attributes.markerSize===37);
// Security/UX: filename is inserted as inert text; a failed application keeps
// the dialog open and exposes an accessible inline error, not a browser alert.
const { openImportDialog } = await import('../../assets/js/transfer/import-dialog.js');
let failedApplyCount=0;
openImportDialog({
    transfer: elementorDonor,
    filename: '<img src=x onerror=alert(1)>.tfw.json',
    destination: 'gutenberg',
    onAccept: () => { failedApplyCount++; throw new Error('Simulated destination failure'); },
});
verify('Transfer filename is inert text, never parsed as markup',
    dialogChildren(activeDialog()).some((node)=>node.tagName==='p'&&node.textContent?.includes('<img src=x')) &&
    !dialogChildren(activeDialog()).some((node)=>node.tagName==='img'));
verify('Modal is keyboard-accessible and labeled as a dialog',
    activeDialog().role==='dialog' && activeDialog()['aria-modal']==='true');
dialogButton('Apply selected properties').click();
verify('Failed import reports error and leaves modal open for retry',
    failedApplyCount===1 && !!activeDialog() &&
    dialogChildren(activeDialog()).some((node)=>node.role==='alert' && node.textContent==='Simulated destination failure'));
activeDialog().handlers.keydown({key:'Escape',preventDefault(){}});
verify('Escape dismisses modal without importing data', !activeDialog() && failedApplyCount===1);
console.log(`PASS: ${assertions} editor-adapter smoke assertions.`);
