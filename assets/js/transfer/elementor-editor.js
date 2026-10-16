/** Elementor editor adapter: native widget settings, local files, no server upload. */
import {
    createTransfer, prepareImport, parseTransfer, transferFilename,
    downloadTransfer, readTransferFile, PLACEHOLDER_TOKEN,
} from './transfer-core.js';

const panelSelector = '.tfw-timeline-transfer';
import { openImportDialog } from './import-dialog.js';

/**
 * Elementor's edited element is exposed through more than one panel API across
 * versions. In modern editors the active panel view itself owns the model;
 * older versions put it in editedElementView. Avoid DOM/iframe scraping.
 */
let recentlyEditedModel = null;
let hookRegistered = false;
function registerEditorHook() {
    if ( hookRegistered || typeof window.elementor?.hooks?.addAction !== 'function' ) return;
    window.elementor.hooks.addAction( 'panel/open_editor/widget', ( panel, model ) => {
        if ( model ) recentlyEditedModel = model;
    } );
    hookRegistered = true;
}

function modelGet( model, key ) {
    return typeof model?.get === 'function' ? model.get( key ) : model?.[ key ];
}

function getWidgetContext() {
    const editor = window.elementor;
    if ( !editor ) return null;
    registerEditorHook();
    const candidates = [];
    let panel = null;
    try { panel = editor.getPanelView?.(); } catch ( error ) { /* Optional API. */ }
    let page = panel?.currentPageView;
    try { page = page || panel?.getCurrentPageView?.(); } catch ( error ) { /* Optional API. */ }
    // Modern Elementor: currentPageView.model is the active widget.
    candidates.push( page?.model, page?.getEditModel?.(), page?.view );
    try { candidates.push( page?.getOption?.( 'editedElementView' ), page?.getOption?.( 'editedElement' ) ); } catch ( error ) { /* Older editor. */ }
    candidates.push( recentlyEditedModel );
    try { candidates.push( editor.getCurrentElement?.() ); } catch ( error ) { /* Optional API. */ }
    try {
        const selection = editor.selection?.getElements?.() || editor.selection?.getSelectedElements?.() || [];
        candidates.push( ...( Array.isArray( selection ) ? selection : [ selection ] ) );
    } catch ( error ) { /* Optional API. */ }

    for ( const candidate of candidates ) {
        if ( !candidate ) continue;
        try {
            const view = candidate.view || candidate;
            const model = view.getEditModel?.() || view.model || candidate.model || candidate;
            const id = modelGet( model, 'id' );
            const container = view.getContainer?.() || view.container || candidate.container ||
                ( id ? editor.getContainer?.( id ) : null );
            const actualModel = modelGet( model, 'widgetType' ) ? model : container?.model || model;
            if ( modelGet( actualModel, 'widgetType' ) !== 'za-timeline' ) continue;
            const settings = modelGet( actualModel, 'settings' ) || container?.settings;
            if ( settings && typeof settings === 'object' ) {
                return { view, model: actualModel, settings, container };
            }
        } catch ( error ) { /* Try the other supported editor selection APIs. */ }
    }
    return null;
}

function readSettings( context ) {
    const settings = context.settings;
    return typeof settings.toJSON === 'function' ? settings.toJSON() : { ...settings };
}

function applySettings( context, imported ) {
    const { settings, container, view } = context;
    const editor = window.elementor;
    const id = modelGet( context.model, 'id' );
    const resolvedContainer = container || ( id ? editor?.getContainer?.( id ) : null );
    if ( typeof window.$e?.run === 'function' && resolvedContainer ) {
        // Elementor document command handles history, live preview and dirty state.
        window.$e.run( 'document/elements/settings', {
            container: resolvedContainer, settings: imported,
            options: { external: true, debounce: false },
        } );
        return;
    }
    if ( typeof settings.set !== 'function' ) {
        throw new Error( 'The selected Elementor widget does not support updating settings. Please refresh the editor.' );
    }
    settings.set( imported );
    view.render?.();
    editor?.saver?.setFlagEditorChange?.( true );
}

registerEditorHook();

function importWidget( context ) {
    const input = document.createElement( 'input' );
    input.type = 'file';
    input.accept = '.tfw.json,.json,application/json';
    input.addEventListener( 'change', async () => {
        if ( !input.files?.length ) return;
        try {
            const transfer = parseTransfer( await readTransferFile( input.files[ 0 ] ), 'elementor' );
            openImportDialog( { transfer, filename: input.files[ 0 ].name || 'Timeline JSON', destination: 'elementor', onAccept: ( options ) => {
                const asset = window.timelineTransferConfig?.placeholderUrl || PLACEHOLDER_TOKEN;
                const imported = prepareImport( transfer, 'elementor', options, asset, readSettings( context ) );
                applySettings( context, imported );
            } } );
        } catch ( error ) { window.alert( 'Timeline import: ' + error.message ); }
    }, { once: true } );
    input.click();
}

function exportWidget( context ) {
    const transfer = createTransfer( 'elementor', readSettings( context ) );
    downloadTransfer( transfer, transferFilename( 'elementor' ) );
}

// Use capture: recent Elementor versions stop propagation on panel controls.
// The transfer buttons are always in the Elementor panel (not its preview iframe).
document.addEventListener( 'click', ( event ) => {
    const button = event.target?.closest?.( `${ panelSelector } [data-tfw-action]` );
    if ( !button ) return;
    event.preventDefault();
    event.stopPropagation?.();
    try {
        const context = getWidgetContext();
        if ( !context ) throw new Error( 'Timeline widget was not detected. Select the widget in Navigator, reopen its settings, then retry.' );
        if ( button.dataset.tfwAction === 'export' ) exportWidget( context );
        if ( button.dataset.tfwAction === 'import' ) importWidget( context );
    } catch ( error ) { window.alert( 'Timeline transfer: ' + error.message ); }
}, true );
