/**
 * Gutenberg editor-only sidecar. This uses stable wp.* APIs, rather than touching
 * the generated Gutenberg bundle; it stays available when npm is not installed.
 * @package TimelineFullWidget
 */
import {
    createTransfer, parseTransfer, prepareImport, downloadTransfer,
    readTransferFile, transferFilename,
} from './transfer-core.js';

const { createElement: h, Fragment, useRef, useState } = window.wp.element;
const { PanelBody, Button, Notice } = window.wp.components;
const { InspectorControls } = window.wp.blockEditor;
const { useDispatch, useSelect } = window.wp.data;
const { createBlock, getBlockType } = window.wp.blocks;
const translate = window.wp.i18n.__;
const t = ( value ) => translate( value, 'timeline-full-widget' );

import { openImportDialog } from './import-dialog.js';

function serializeAttributes( value, key = '' ) {
    // Gutenberg RichTextData serializes to {} through JSON.stringify. Export
    // its HTML representation explicitly or real paragraph/heading text is lost.
    if ( value && typeof value === 'object' && typeof value.toHTMLString === 'function' ) {
        return value.toHTMLString();
    }
    if ( key === 'content' && value && typeof value === 'object' &&
        !Array.isArray( value ) && typeof value.text === 'string' &&
        typeof window.wp.richText?.toHTMLString === 'function' ) {
        return window.wp.richText.toHTMLString( { value } );
    }
    if ( Array.isArray( value ) ) return value.map( ( part ) => serializeAttributes( part ) );
    if ( value && typeof value === 'object' ) return Object.fromEntries(
        Object.entries( value ).map( ( [ k, v ] ) => [ k, serializeAttributes( v, k ) ] )
    );
    return value;
}

function pack( block ) {
    return {
        name: block.name,
        attributes: serializeAttributes( block.attributes || {} ),
        innerBlocks: ( block.innerBlocks || [] ).map( pack ),
    };
}

function unpack( block, depth = 0 ) {
    if ( depth > 32 || !block || typeof block.name !== 'string' ||
        !getBlockType( block.name ) ||
        !( block.name.startsWith( 'core/' ) || block.name.startsWith( 'za/timeline-' ) ) ||
        !Array.isArray( block.innerBlocks ) ) {
        throw new Error( 'Unknown or invalid nested block in the Timeline import.' );
    }
    return createBlock( block.name, block.attributes || {}, block.innerBlocks.map( ( child ) => unpack( child, depth + 1 ) ) );
}

/** Resolve only colors used in this Timeline; avoid unrelated theme palette data. */
function getExportPalette( snapshot ) {
    const used = new Set();
    const walk = ( value, key = '' ) => {
        if ( typeof value === 'string' ) {
            const token = /^var:preset\|color\|([a-z0-9-]+)$/i.exec( value )?.[ 1 ] ||
                /^var\(--wp--preset--color--([a-z0-9-]+)\)$/i.exec( value )?.[ 1 ];
            if ( token ) used.add( token );
            if ( ( key === 'backgroundColor' || key === 'textColor' ) && /^[a-z0-9-]+$/i.test( value ) ) used.add( value );
            return;
        }
        if ( Array.isArray( value ) ) { value.forEach( ( entry ) => walk( entry ) ); return; }
        if ( value && typeof value === 'object' ) Object.entries( value ).forEach( ( [ k, v ] ) => walk( v, k ) );
    };
    walk( snapshot );
    const result = {};
    const safeColor = /^(?:#[0-9a-f]{3,8}|rgba?\(\s*[0-9.%\s,]+\s*\)|hsla?\(\s*[0-9.%\s,]+\s*\))$/i;
    const add = ( slug, color ) => {
        if ( used.has( slug ) && /^[a-z0-9-]{1,101}$/i.test( slug ) &&
            typeof color === 'string' && safeColor.test( color.trim() ) ) result[ slug ] = color.trim();
    };
    try {
        const colors = window.wp.data.select( 'core/block-editor' )?.getSettings?.()?.colors || [];
        for ( const entry of colors ) add( entry.slug, entry.color );
    } catch ( error ) { /* Older editor. CSS variables and defaults remain available. */ }
    // The editor iframe can have a different palette from the surrounding admin UI.
    try {
        const canvas = document.querySelector( 'iframe[name="editor-canvas"]' )?.contentDocument;
        const roots = [ canvas?.documentElement, canvas?.body, document.documentElement, document.body ];
        for ( const root of roots ) {
            if ( !root ) continue;
            const style = window.getComputedStyle( root );
            for ( const slug of used ) {
                const color = style.getPropertyValue( `--wp--preset--color--${ slug }` );
                if ( color ) add( slug, color );
            }
        }
    } catch ( error ) { /* Cross-origin frame or unavailable computed styles. */ }
    return result;
}

function TransferPanel( { clientId, attributes, setAttributes } ) {
    const [ feedback, setFeedback ] = useState( '' );
    const inputRef = useRef( null );
    const children = useSelect(
        ( select ) => select( 'core/block-editor' ).getBlocks( clientId ) || [],
        [ clientId ]
    );
    const { replaceBlocks } = useDispatch( 'core/block-editor' );
    const placeholderUrl = window.timelineTransferGutenberg?.placeholderUrl || '';

    const doExport = () => {
        try {
            const snapshot = {
                name: 'za/timeline-full-widget', attributes: serializeAttributes( attributes ),
                innerBlocks: children.map( pack ),
            };
            downloadTransfer( createTransfer( 'gutenberg', snapshot, {
                palette: getExportPalette( snapshot ),
            } ), transferFilename( 'gutenberg' ) );
            setFeedback( t( 'Timeline exported. Media has been replaced with portable placeholders.' ) );
        } catch ( error ) { setFeedback( error.message ); }
    };

    // All transfer choices are made in the shared modal, not the narrow sidebar.
    // Keep a validated file local to this handler; do not expose it to globals.
    const selectFile = async ( event ) => {
        const incoming = event.target.files?.[ 0 ];
        if ( !incoming ) return;
        // Reset the picker immediately so selecting the same file a second
        // time still triggers `change` after a cancelled import.
        event.target.value = '';
        try {
            const parsed = parseTransfer( await readTransferFile( incoming ), 'gutenberg' );
            if ( parsed.origin === 'gutenberg' &&
                ( parsed.data.name !== 'za/timeline-full-widget' || !Array.isArray( parsed.data.innerBlocks ) ) ) {
                throw new Error( 'The Timeline block hierarchy is invalid.' );
            }
            if ( parsed.origin === 'elementor' && !Array.isArray( parsed.data.list ) ) {
                throw new Error( 'The Elementor Timeline items are invalid.' );
            }
            setFeedback( '' );
            openImportDialog( {
                transfer: parsed,
                filename: incoming.name || 'Timeline JSON',
                destination: 'gutenberg',
                translate: t,
                onAccept: ( options ) => {
                    const imported = prepareImport( parsed, 'gutenberg', options, placeholderUrl, {
                        name: 'za/timeline-full-widget', attributes, innerBlocks: children.map( pack ),
                    } );
                    const blocks = imported.innerBlocks.map( ( block ) => unpack( block ) );
                    // Replace the entire parent as one editor transaction so
                    // initial sibling-style inheritance cannot override styles.
                    replaceBlocks( [ clientId ], [ createBlock( 'za/timeline-full-widget', imported.attributes, blocks ) ] );
                    setFeedback( t( 'Timeline successfully updated. You can use Undo to restore the previous version.' ) );
                },
            } );
        } catch ( error ) {
            setFeedback( error.message );
        }
    };

    return h( InspectorControls, null,
        h( PanelBody, { title: t( 'Import / Export Timeline' ), initialOpen: false },
            h( 'p', null, t( 'Move this Timeline to another site, including layout and styling. Source media is replaced with local placeholders.' ) ),
            h( Button, { variant: 'secondary', onClick: doExport }, t( 'Export Gutenberg Timeline' ) ),
            h( 'div', { style: { marginTop: 12 } },
                h( Button, { variant: 'secondary', onClick: () => inputRef.current?.click() }, t( 'Import Timeline file' ) ),
                h( 'input', { type: 'file', accept: '.json,application/json', ref: inputRef, onChange: selectFile,
                    style: { display: 'none' } } ) ),
            feedback && h( Notice, { status: 'info', isDismissible: true, onRemove: () => setFeedback( '' ) }, feedback )
        )
    );
}

window.wp.hooks.addFilter( 'editor.BlockEdit', 'timeline-full-widget/import-export', ( BlockEdit ) => {
    return function TimelineTransferBlockEdit( props ) {
        return h( Fragment, null,
            h( BlockEdit, props ),
            props.name === 'za/timeline-full-widget'
                ? h( TransferPanel, { clientId: props.clientId, attributes: props.attributes, setAttributes: props.setAttributes } )
                : null
        );
    };
} );
