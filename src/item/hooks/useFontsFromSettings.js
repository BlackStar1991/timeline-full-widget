// item/hooks/useFontsFromSettings.js
import { useSelect } from '@wordpress/data';
import { useState, useEffect } from '@wordpress/element';

function normalizeFontEntry( f ) {
    const name = f?.name || f?.label || f?.title || '';
    const slug = f?.slug || null;
    const family = f?.fontFamily || null;
    const cleanFamily = family ? String(family).replace(/^["']|["']$/g, '') : null;
    const value = slug || cleanFamily || name;
    return { name: name || value, slug, family: cleanFamily, value };
}

function extractFontsFromSettings( settings ) {
    if ( ! settings ) return [];
    const candidates = [
        settings.typography,
        settings?.settings?.typography,
        settings?.theme?.settings?.typography,
        settings?.__experimentalFeatures?.typography,
        settings?.settings?.__experimentalFeatures?.typography,
        settings.fontFamilies,
    ];

    let found = [];
    const pushFonts = ( maybe ) => {
        if ( ! maybe ) return;
        if ( Array.isArray( maybe ) ) { found.push( ...maybe ); return; }
        if ( maybe.fontFamilies ) {
            if ( Array.isArray( maybe.fontFamilies ) ) found.push( ...maybe.fontFamilies );
            else if ( typeof maybe.fontFamilies === 'object' ) {
                Object.values( maybe.fontFamilies ).forEach( v => { if ( Array.isArray(v) ) found.push( ...v ); } );
            }
        }
        if ( maybe.fontFamilies?.theme && Array.isArray( maybe.fontFamilies.theme ) ) {
            found.push( ...maybe.fontFamilies.theme );
        }
    };
    candidates.forEach( pushFonts );

    const normalized = ( found || [] ).filter(Boolean).map( normalizeFontEntry );
    const map = new Map();
    normalized.forEach( f => { if ( f.value && ! map.has( f.value ) ) map.set( f.value, f ); } );
    return Array.from( map.values() );
}

export default function useFontsFromSettings() {
    const fontsFromStore = useSelect( ( select ) => {
        const s1 = select('core/block-editor')?.getSettings?.() || null;
        const s2 = select('core/editor')?.getEditorSettings?.() || null;
        const settings = s1 || s2 || {};
        return extractFontsFromSettings( settings );
    }, [] );

    const [ fonts, setFonts ] = useState( fontsFromStore || [] );

    useEffect(() => {
        if ( fontsFromStore && fontsFromStore.length ) {
            setFonts( fontsFromStore );
            return;
        }
        let tries = 0;
        const timer = setInterval( () => {
            try {
                const raw = ( typeof window !== 'undefined' && window.wp && window.wp.data && window.wp.data.select )
                    ? ( window.wp.data.select('core/block-editor')?.getSettings?.() || window.wp.data.select('core/editor')?.getEditorSettings?.() )
                    : null;
                if ( raw ) {
                    const parsed = extractFontsFromSettings( raw );
                    if ( parsed.length ) {
                        setFonts( parsed );
                        clearInterval( timer );
                        return;
                    }
                }
            } catch ( e ) {}
            if ( ++tries > 30 ) clearInterval( timer );
        }, 250 );
        return () => clearInterval( timer );
    }, [ fontsFromStore ] );

    return fonts;
}
