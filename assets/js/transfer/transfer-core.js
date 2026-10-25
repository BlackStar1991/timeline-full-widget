/**
 * Timeline Full Widget portable transfer contract (v1).
 * Editor-neutral, with native per-builder snapshots for lossless same-editor settings.
 * This module deliberately has no WordPress/Elementor dependencies.
 * @package TimelineFullWidget
 */
export const FORMAT = 'timeline-full-widget';
export const SCHEMA_VERSION = 1;
export const MAX_FILE_BYTES = 5 * 1024 * 1024;
export const PLACEHOLDER_TOKEN = 'tfw://media-placeholder';
export const BLOCK_NAME = 'za/timeline-full-widget';
export const ELEMENTOR_WIDGET_NAME = 'za-timeline';

export const IMPORT_OPTIONS = Object.freeze( {
    margin: true,
    padding: true,
    gap: true,
    identifiers: false,
    classes: true,
    customStyles: true,
    animation: true,
    links: true,
    responsive: true,
    typography: true,
    background: true,
    content: true,
} );

// Preserve saved native property names; these keys describe only the common semantic
// contract. Do not rename either builder's persisted attribute/control identifiers.
export const STYLE_KEYS = Object.freeze( {
    lineColor: { gutenberg: 'lineColor', elementor: 'timeline_line_color' },
    lineWidth: { gutenberg: 'lineWidth', elementor: 'timeline_line_width' },
    markerColor: { gutenberg: 'markerColor', elementor: 'timeline_marker_color' },
    markerSize: { gutenberg: 'markerSize', elementor: 'timeline_marker_size' },
    animationLineColor: { gutenberg: 'animationLineColor', elementor: 'timeline_line_animation_color' },
    animationMarkerColor: { gutenberg: 'animationMarkerColor', elementor: 'timeline_marker_animation_color' },
} );

/** WordPress's standard block palette for backward-compatible v1 exports.
 * New exports additionally include a captured theme palette because custom
 * palette slugs cannot be assumed to mean the same color on another website.
 */
export const WP_CORE_PALETTE = Object.freeze( {
    black: '#000000', white: '#ffffff', 'cyan-bluish-gray': '#abb8c3',
    'pale-pink': '#f78da7', 'vivid-red': '#cf2e2e',
    'luminous-vivid-orange': '#ff6900', 'luminous-vivid-amber': '#fcb900',
    'light-green-cyan': '#7bdcb5', 'vivid-green-cyan': '#00d084',
    'pale-cyan-blue': '#8ed1fc', 'vivid-cyan-blue': '#0693e3',
    'vivid-purple': '#9b51e0',
} );

const SAFE_COLOR = /^(?:#[0-9a-f]{3,8}|rgba?\(\s*[0-9.%\s,]+\s*\)|hsla?\(\s*[0-9.%\s,]+\s*\))$/i;
const SAFE_SLUG = /^[a-z0-9][a-z0-9-]{0,100}$/i;
/** Only CSS lengths supported by both Timeline editors, never expressions. */
export function normalizeMediaWidth( value ) {
    const text = String( value ?? '' ).trim();
    const match = /^(\d+(?:\.\d+)?)(px|%)$/i.exec( text );
    if ( !match ) return '';
    const number = Number( match[ 1 ] );
    return Number.isFinite( number ) && number > 0 && number <= ( match[ 2 ] === '%' ? 100 : 5000 )
        ? match[ 1 ] + match[ 2 ].toLowerCase() : '';
}


/** Convert block color slugs and WP preset variables to portable CSS colors. */
export function resolveGutenbergColor( value, palette = {} ) {
    if ( typeof value !== 'string' ) return '';
    const color = value.trim();
    if ( SAFE_COLOR.test( color ) ) return color;
    const slug = /^var:preset\|color\|([a-z0-9-]+)$/i.exec( color )?.[ 1 ] ||
        /^var\(\s*--wp--preset--color--([a-z0-9-]+)\s*\)$/i.exec( color )?.[ 1 ] ||
        ( SAFE_SLUG.test( color ) ? color : '' );
    if ( !slug ) return '';
    const customColor = Object.prototype.hasOwnProperty.call( palette, slug ) ? palette[ slug ] : null;
    if ( typeof customColor === 'string' && SAFE_COLOR.test( customColor.trim() ) ) return customColor.trim();
    return WP_CORE_PALETTE[ slug ] || '';
}

/** Sanitize exported palette values; never load executable CSS or external assets. */
function cleanPalette( data ) {
    if ( !data || typeof data !== 'object' || Array.isArray( data ) ) return {};
    const result = {};
    if ( Object.keys( data ).length > 128 ) throw new Error( 'Too many color palette entries.' );
    for ( const [ slug, value ] of Object.entries( data ) ) {
        if ( !SAFE_SLUG.test( slug ) || !['string'].includes( typeof value ) || !SAFE_COLOR.test( value.trim() ) ) {
            throw new Error( 'Invalid exported color palette.' );
        }
        result[ slug ] = value.trim();
    }
    return result;
}

const FORBIDDEN = new Set( [ '__proto__', 'prototype', 'constructor' ] );
const MARGIN = /(^|_)(margin)(_|$)/i;
const PADDING = /(^|_)(padding)(_|$)/i;
const GAP = /(^|_)(gap|blockGap)(_|$)/i;
const RESPONSIVE = /(_|^)(tablet|mobile|widescreen|laptop|tablet_extra|mobile_extra)(_|$)/i;
const TYPOGRAPHY = /typography|font|text_shadow|text_decoration|letter_spacing|line_height|text_transform/i;
const BACKGROUND = /background|border|box_shadow/i;
const IDENTIFIER = /^(anchor|id|_element_id|css_id|html_id)$/i;
const CLASSES = /^(className|_css_classes|css_classes|additionalClasses)$/i;
const CUSTOM = /^(custom_css|_custom_css|_elementor_custom_css|customCss|cssCode)$/i;
const ANIMATION = /(^|_)(animation|motion|transition|sticky|entrance)(_|$)/i;
const LINK = /^(linkUrl|linkTarget|rel|mediaLinkUrl|mediaLinkTarget|mediaLinkRel|isMediaWrapToLink|media_link_url|media_link_enabled|title_link_url)$/i;
const IMAGE_KEYS = /^(media_image|marker_image|posterURL|background_image|background_overlay_image|background_image_mobile|background_image_tablet|background_overlay_image_mobile|background_overlay_image_tablet|card_background_image)$/i;
const VIDEO_KEYS = /^(media_video)$/i;
const BACKGROUND_VIDEO_URL = /^(?:_)?background_video_(?:link|url)$/i;
const GUTENBERG_IMAGE_KEYS = /^(mediaUrl|markerUrl|videoPoster|poster|backgroundUrl|timelineBackgroundImage|cardBackgroundImage)$/i;
const MEDIA_ATTRIBUTE_IDS = /^(mediaId|markerId|media_id|marker_id)$/i;

export function jsonClone( value, depth = 0 ) {
    if ( depth > 64 ) throw new Error( 'Transfer data nesting exceeds limit.' );
    if ( value === null || typeof value === 'string' || typeof value === 'boolean' ) return value;
    if ( typeof value === 'number' ) return Number.isFinite( value ) ? value : null;
    if ( Array.isArray( value ) ) {
        if ( value.length > 10000 ) throw new Error( 'Transfer array exceeds limit.' );
        return value.map( ( entry ) => jsonClone( entry, depth + 1 ) );
    }
    if ( typeof value !== 'object' ) return undefined;
    const out = {};
    const keys = Object.keys( value );
    if ( keys.length > 5000 ) throw new Error( 'Transfer object exceeds limit.' );
    for ( const key of keys ) {
        if ( FORBIDDEN.has( key ) ) throw new Error( 'Unsafe property in transfer file.' );
        const safe = jsonClone( value[ key ], depth + 1 );
        if ( safe !== undefined ) out[ key ] = safe;
    }
    return out;
}

/** Replace media in rich HTML, preserving dimensions, alt text and non-media links. */
function scrubMarkup( text, placeholder ) {
    return text
        .replace( /(<img\b[^>]*\bsrc\s*=\s*)(["'])(.*?)\2/gi, ( all, prefix, quote ) => prefix + quote + placeholder + quote )
        .replace( /(<(?:img|source)\b[^>]*\b(?:srcset|data-srcset|data-src)\s*=\s*)(["'])(.*?)\2/gi, ( all, prefix, quote ) => prefix + quote + placeholder + quote )
        .replace( /(<video\b[^>]*\bposter\s*=\s*)(["'])(.*?)\2/gi, ( all, prefix, quote ) => prefix + quote + placeholder + quote )
        .replace( /(<source\b[^>]*\bsrc\s*=\s*)(["'])(.*?)\2/gi, ( all, prefix, quote ) => prefix + quote + quote )
        .replace( /(<iframe\b[^>]*\bsrc\s*=\s*)(["'])(.*?)\2/gi, ( all, prefix, quote ) => prefix + quote + quote )
        .replace( /(<video\b[^>]*\bsrc\s*=\s*)(["'])(.*?)\2/gi, ( all, prefix, quote ) => prefix + quote + quote );
}

function scrubImageStyles( text, placeholder ) {
    return text.replace( /url\(\s*(['"]?)([^)'"\s]+)\1\s*\)/gi, ( match, quote, url ) =>
        ! /^(?:#|data:font|data:application\/font)/i.test( url ) && ! /\.(?:woff2?|ttf|otf|eot)(?:[?#]|$)/i.test( url )
            ? `url("${ placeholder }")` : match );
}

function mediaPlaceholder( item, placeholder ) {
    // Do not turn an unset media control into a large placeholder image.
    // Existing v1 exports already contain the portable URL token.
    if ( !item || ( !item.url && !item.id ) ) return { ...( item || {} ), id: 0, url: '' };
    const result = { ...item, id: 0, url: placeholder, tfw_placeholder: true };
    delete result.source;
    // Keep width, height, dimension and CSS sizing metadata; remote attachment IDs don't travel.
    return result;
}

function scrubValue( value, key, source, placeholder, parent = '' ) {
    if ( value === null || value === undefined ) return value;
    if ( Array.isArray( value ) ) return value.map( ( v ) => scrubValue( v, '', source, placeholder, key ) );
    if ( typeof value === 'string' ) {
        if ( /<img\b|<video\b|<source\b/i.test( value ) ) return scrubMarkup( value, placeholder );
        if ( /url\(/i.test( value ) ) return scrubImageStyles( value, placeholder );
        if ( source === 'elementor' && BACKGROUND_VIDEO_URL.test( key ) ) return '';
        if ( source === 'gutenberg' && GUTENBERG_IMAGE_KEYS.test( key ) && value.trim() ) {
            if ( key === 'mediaUrl' && parent === 'video' ) return '';
            return placeholder;
        }
        return value;
    }
    if ( typeof value !== 'object' ) return value;
    if ( source === 'gutenberg' && key === 'backgroundImage' && typeof value.url === 'string' ) {
        return value.url ? { ...value, url: placeholder, id: 0, source: 'file' } : { ...value, url: '', id: 0 };
    }
    if ( source === 'elementor' ) {
        if ( VIDEO_KEYS.test( key ) ) return { ...value, id: 0, url: '' };
        if ( IMAGE_KEYS.test( key ) || ( value.url && ( typeof value.id === 'number' || typeof value.id === 'string' ) && !/link|title_link/i.test( key ) ) ) {
            return mediaPlaceholder( value, placeholder );
        }
    }
    const output = {};
    for ( const [ childKey, childValue ] of Object.entries( value ) ) {
        if ( FORBIDDEN.has( childKey ) ) throw new Error( 'Unsafe property.' );
        if ( source === 'gutenberg' && MEDIA_ATTRIBUTE_IDS.test( childKey ) ) {
            output[ childKey ] = 0;
        } else if ( source === 'gutenberg' && childKey === 'mediaUrl' && ( value.mediaType === 'video' || /^video\//.test( value.mediaMime || '' ) ) ) {
            output[ childKey ] = placeholder;
            output.videoPoster = placeholder;
        } else if ( source === 'gutenberg' && childKey === 'url' && value.mime && /^video\//.test( value.mime ) ) {
            output[ childKey ] = '';
            output.poster = placeholder;
        } else if ( source === 'elementor' && childKey === 'posterURL' ) {
            output[ childKey ] = mediaPlaceholder( childValue || {}, placeholder );
        } else {
            output[ childKey ] = scrubValue( childValue, childKey, source, placeholder, value.mediaType || value.mime || '' );
        }
    }
    if ( source === 'elementor' && value.media_type === 'video' ) {
        output.media_video = { id: 0, url: '' };
        output.posterURL = mediaPlaceholder( value.posterURL || {}, placeholder );
    }
    if ( source === 'gutenberg' && value.name === 'core/video' && value.attributes ) {
        output.attributes = { ...output.attributes, id: 0, src: placeholder, poster: placeholder };
    }
    if ( source === 'gutenberg' && value.name === 'core/cover' && value.attributes ) {
        output.attributes = { ...output.attributes, id: 0, url: placeholder };
    }
    if ( source === 'gutenberg' && value.name === 'core/image' && value.attributes ) {
        output.attributes = { ...output.attributes, id: 0, url: placeholder };
        // A copied image must not point at the donor's old featured image metadata.
        // Retain linking settings, but attachment IDs and external URLs are cleared.
    }
    return output;
}

export function scrubMedia( data, source, placeholder = PLACEHOLDER_TOKEN ) {
    if ( ! [ 'elementor', 'gutenberg' ].includes( source ) ) throw new Error( 'Unknown editor.' );
    return scrubValue( jsonClone( data ), '', source, placeholder );
}

/** Normalize deprecated widget-wide layout settings into item controls.
 * The historic fields remain readable only at this import/export boundary.
 * New files use item_content_layout and tl_card_change_direction exclusively.
 */
export function normalizeElementorItemLayouts( settings ) {
    if ( !settings || typeof settings !== 'object' || Array.isArray( settings ) ) return settings;
    const normalized = { ...settings };
    const inheritedHorizontal = settings.tl_content_horizontal_layout === 'yes';
    const inheritedReverse = settings.shared_reverse_media_content === 'yes';
    if ( Array.isArray( settings.list ) ) {
        normalized.list = settings.list.map( ( item ) => {
            const entry = { ...item };
            if ( !Object.prototype.hasOwnProperty.call( entry, 'item_content_layout' ) ||
                entry.item_content_layout === 'global' ) {
                entry.item_content_layout = inheritedHorizontal ? 'horizontal' : '';
            }
            if ( !Object.prototype.hasOwnProperty.call( entry, 'tl_card_change_direction' ) ) {
                entry.tl_card_change_direction = inheritedReverse ? 'yes' : '';
            }
            // Normalize old combined widths at the boundary, not in native
            // editor controls. Clear the legacy value so clearing the new
            // numeric input doesn't unexpectedly reactivate the old width.
            const oldWidth = normalizeMediaWidth( entry.media_width );
            if ( oldWidth && ( entry.media_width_value === '' || entry.media_width_value === undefined || entry.media_width_value === null ) ) {
                const parts = /^(\d+(?:\.\d+)?)(px|%)$/.exec( oldWidth );
                entry.media_width_value = Number( parts[1] );
                entry.media_width_unit = parts[2];
            }
            if ( oldWidth ) entry.media_width = '';
            return entry;
        } );
    }
    delete normalized.tl_content_horizontal_layout;
    delete normalized.shared_reverse_media_content;
    return normalized;
}

export function createTransfer( source, data, metadata = {} ) {
    if ( ! [ 'elementor', 'gutenberg' ].includes( source ) ) throw new Error( 'Unsupported transfer source.' );
    if ( ! data || typeof data !== 'object' || Array.isArray( data ) ) throw new Error( 'Missing native element data.' );
    const snapshot = scrubMedia( source === 'elementor' ? normalizeElementorItemLayouts( data ) : data, source, PLACEHOLDER_TOKEN );
    return {
        format: FORMAT,
        schemaVersion: SCHEMA_VERSION,
        origin: source,
        elementType: source === 'elementor' ? ELEMENTOR_WIDGET_NAME : BLOCK_NAME,
        pluginVersion: '4.0.0',
        mediaPolicy: 'placeholder-only',
        exportedAt: new Date().toISOString(),
        data: snapshot,
        ...( source === 'gutenberg' ? { palette: cleanPalette( metadata.palette || {} ) } : {} ),
    };
}

/** Reject executable markup, unsafe URL protocols, and CSS injection in imported data.
 * Browser HTML parsing uses an inert document; no imported script is executed.
 * Site admins may opt into transferring custom CSS, but executable constructs
 * and external CSS imports are never accepted from transfer files.
 */
const DANGEROUS_HTML = /<\s*\/?\s*(?:script|iframe|object|embed|svg|math|form|input|button|link|meta|base|style|template)\b/i;
const ACTIVE_CSS = /(?:@import\b|expression\s*\(|-moz-binding\s*:|behavior\s*:|<\s*\/\s*style\b)/i;
const URL_FIELD = /^(?:url|href|src|source|poster|linkUrl|linkTarget|mediaUrl|markerUrl|videoPoster|cardBackgroundImage|backgroundUrl|.*_url|.*_link|.*_src)$/i;
const HTML_FIELD = /^(?:content|caption|citation|value|list_content|side_content|otherSiteTitle|title_field|list_title|text|label|html)$/i;
const CONTENT_FIELD = /^(?:content|caption|citation|value|list_content|side_content|otherSiteTitle|title_field|list_title|text|label|alt|imageAlt|markerAlt|title|placeholder)$/i;
const SAFE_BLOCKS = new Set( [
    'za/timeline-full-widget', 'za/timeline-item', 'za/timeline-item-side', 'za/timeline-item-content',
    'core/paragraph', 'core/heading', 'core/list', 'core/list-item', 'core/image', 'core/video',
    'core/cover', 'core/buttons', 'core/button', 'core/group', 'core/columns', 'core/column',
    'core/separator', 'core/spacer', 'core/quote', 'core/table', 'core/gallery', 'core/audio',
    'core/pullquote', 'core/details',
] );

function safeUrl( url ) {
    if ( url === PLACEHOLDER_TOKEN ) return true;
    // Decode common entity encoding and discard controls/whitespace that mask protocols.
    const clean = url.replace( /&#(?:x([0-9a-f]+)|([0-9]+));?/gi, ( match, hex, dec ) =>
        String.fromCodePoint( parseInt( hex || dec, hex ? 16 : 10 ) ) ).trim();
    const compact = clean.replace( /[\u0000-\u0020\u007f]+/g, '' );
    if ( /^(?:javascript|vbscript|data|file|blob):/i.test( compact ) ) return false;
    if ( /^[a-z][a-z0-9+.-]*:/i.test( compact ) && ! /^(?:https?|mailto|tel):/i.test( compact ) ) return false;
    return true;
}

function safeHtml( html ) {
    if ( DANGEROUS_HTML.test( html ) ) throw new Error( 'Transfer contains disallowed executable HTML.' );
    // Use a DOM parser when the browser exposes one; text is never inserted into the live DOM.
    if ( typeof DOMParser === 'undefined' ) {
        if ( /\bon[a-z]+\s*=|javascript\s*:|vbscript\s*:|data\s*:/i.test( html ) ) {
            throw new Error( 'Transfer contains unsafe HTML attributes.' );
        }
        return html;
    }
    const documentFragment = new DOMParser().parseFromString( '<body>' + html + '</body>', 'text/html' );
    for ( const el of Array.from( documentFragment.body.querySelectorAll( '*' ) ) ) {
        if ( DANGEROUS_HTML.test( '<' + el.localName ) ) throw new Error( 'Unsafe HTML element.' );
        for ( const attr of Array.from( el.attributes ) ) {
            if ( /^on/i.test( attr.name ) || attr.name === 'srcdoc' ) {
                el.removeAttribute( attr.name );
            } else if ( /^(?:href|src|poster|action|formaction|xlink:href)$/i.test( attr.name ) && !safeUrl( attr.value ) ) {
                el.removeAttribute( attr.name );
            } else if ( attr.name === 'style' && ACTIVE_CSS.test( attr.value ) ) {
                el.removeAttribute( attr.name );
            }
        }
    }
    return documentFragment.body.innerHTML;
}

function cleanImportedData( value, key = '', depth = 0 ) {
    if ( depth > 64 ) throw new Error( 'Transfer nesting limit exceeded.' );
    if ( typeof value === 'string' ) {
        if ( value.length > 1000000 ) throw new Error( 'Transfer string exceeds size limit.' );
        if ( ( /css|style/i.test( key ) || /url\s*\(/i.test( value ) ) && ( ACTIVE_CSS.test( value ) || DANGEROUS_HTML.test( value ) ) ) {
            throw new Error( 'Unsafe CSS declaration in import.' );
        }
        if ( URL_FIELD.test( key ) && !safeUrl( value ) ) throw new Error( 'Unsafe URL in import.' );
        if ( HTML_FIELD.test( key ) || ( !/css|style/i.test( key ) && /<\s*[a-z][^>]*>/i.test( value ) ) ) return safeHtml( value );
        return value;
    }
    if ( Array.isArray( value ) ) return value.map( ( entry ) => cleanImportedData( entry, '', depth + 1 ) );
    if ( value && typeof value === 'object' ) {
        if ( key === 'content' && !Array.isArray( value ) && Object.keys( value ).length === 0 ) return '';
        const out = {};
        for ( const [ k, v ] of Object.entries( value ) ) {
            if ( FORBIDDEN.has( k ) || ( /^on[a-z]+$/i.test( k ) && k !== 'onTheOneSide' ) || k === 'srcdoc' || ( k === 'onTheOneSide' && typeof v !== 'boolean' ) ) {
                throw new Error( 'Unsafe transfer property.' );
            }
            if ( k === 'name' && typeof v === 'string' && !SAFE_BLOCKS.has( v ) && v.includes( '/' ) ) {
                throw new Error( 'Unsupported block type in transfer: ' + v );
            }
            out[ k ] = cleanImportedData( v, k, depth + 1 );
        }
        return out;
    }
    return value;
}

/** If content is disabled, keep target text/content while importing other settings.
 * Gutenberg text lives in the individual nested block attributes, while
 * Elementor stores text in repeater controls; preserve both by tree position.
 */
function preserveDestinationContent( incoming, existing, source ) {
    if ( source === 'gutenberg' && incoming?.name === BLOCK_NAME ) {
        return { ...incoming, innerBlocks: keepTextInBlocks( incoming.innerBlocks || [], existing?.innerBlocks || [] ) };
    }
    if ( source === 'elementor' ) {
        const copy = { ...incoming };
        if ( Array.isArray( copy.list ) ) {
            copy.list = copy.list.map( ( item, index ) => preserveTextAttributes( item, existing?.list?.[ index ] || {} ) );
        }
        return preserveTextAttributes( copy, existing || {} );
    }
    return incoming;
}

function preserveTextAttributes( incoming, original ) {
    const output = { ...incoming };
    for ( const key of Object.keys( output ) ) {
        if ( CONTENT_FIELD.test( key ) ) {
            if ( Object.prototype.hasOwnProperty.call( original, key ) ) output[ key ] = original[ key ];
            else delete output[ key ];
        }
    }
    for ( const [ key, val ] of Object.entries( original ) ) {
        if ( CONTENT_FIELD.test( key ) && !Object.prototype.hasOwnProperty.call( output, key ) ) output[ key ] = val;
    }
    return output;
}

function keepTextInBlocks( source, destination ) {
    return source.map( ( item, index ) => {
        const existing = destination[ index ];
        const textLike = ( name ) => name === 'core/heading' || name === 'core/paragraph';
        // Elementor may use a paragraph as the title while Gutenberg uses a
        // heading; these occupy the same semantic position for content:false.
        const sameType = existing?.name === item.name ||
            ( textLike( existing?.name ) && textLike( item.name ) );
        return {
            ...item,
            attributes: preserveTextAttributes( item.attributes || {}, sameType ? existing.attributes || {} : {} ),
            innerBlocks: keepTextInBlocks( item.innerBlocks || [], sameType ? existing.innerBlocks || [] : [] ),
        };
    } );
}

function hasLegacyRichText( node ) {
    if ( !node || typeof node !== 'object' ) return false;
    if ( Array.isArray( node ) ) return node.some( hasLegacyRichText );
    return Object.entries( node ).some( ( [ key, value ] ) =>
        ( key === 'content' && value && typeof value === 'object' && !Array.isArray( value ) && Object.keys( value ).length === 0 ) || hasLegacyRichText( value )
    );
}

export function parseTransfer( input, destination ) {
    if ( typeof input === 'string' && new TextEncoder().encode( input ).length > MAX_FILE_BYTES ) throw new Error( 'Transfer file is too large.' );
    const raw = typeof input === 'string' ? JSON.parse( input ) : input;
    const file = jsonClone( raw );
    if ( ! file || file.format !== FORMAT || file.schemaVersion !== SCHEMA_VERSION ||
        ! [ 'gutenberg', 'elementor' ].includes( file.origin ) || !file.data ||
        Array.isArray( file.data ) || typeof file.data !== 'object' ) {
        throw new Error( 'Invalid or unsupported Timeline transfer format.' );
    }
    if ( ![ 'gutenberg', 'elementor' ].includes( destination ) ) {
        throw new Error( 'Unknown Timeline destination editor.' );
    }
    if ( file.elementType !== ( file.origin === 'elementor' ? ELEMENTOR_WIDGET_NAME : BLOCK_NAME ) ) {
        throw new Error( 'Unexpected Timeline element type.' );
    }
    if ( file.mediaPolicy !== 'placeholder-only' ) throw new Error( 'Media privacy policy mismatch.' );
    if ( file.origin === 'gutenberg' && hasLegacyRichText( file.data ) ) {
        file.warnings = [ 'This older Gutenberg export contains empty RichText objects. The original text is absent from the file and cannot be recovered. Disable the content option to retain existing text.' ];
    }
    file.palette = cleanPalette( file.palette || {} );
    file.data = cleanImportedData( file.data );
    return file;
}

function shouldSkip( key, options ) {
    if ( !options.margin && MARGIN.test( key ) ) return true;
    if ( !options.padding && PADDING.test( key ) ) return true;
    if ( !options.gap && GAP.test( key ) ) return true;
    if ( !options.responsive && RESPONSIVE.test( key ) ) return true;
    if ( !options.typography && TYPOGRAPHY.test( key ) ) return true;
    if ( !options.background && ( BACKGROUND.test( key ) || key === 'li_bg_color' || key === 'shared_item_background_color' ) ) return true;
    if ( !options.identifiers && IDENTIFIER.test( key ) ) return true;
    if ( !options.classes && CLASSES.test( key ) ) return true;
    if ( !options.customStyles && CUSTOM.test( key ) ) return true;
    if ( !options.animation && ANIMATION.test( key ) ) return true;
    if ( !options.links && LINK.test( key ) ) return true;
    return false;
}

function filterOptions( value, options ) {
    if ( Array.isArray( value ) ) return value.map( ( item ) => filterOptions( item, options ) );
    if ( value && typeof value === 'object' ) {
        const out = {};
        for ( const [ key, entry ] of Object.entries( value ) ) {
            if ( shouldSkip( key, options ) ) {
                // WordPress media attachment IDs must remain zero, not disappear:
                // Elementor's Media control expects the attachment-ID property.
                if ( key === 'id' && entry === 0 && ( 'url' in value || 'src' in value ) ) {
                    out[ key ] = 0;
                }
                continue;
            }
            if ( key === 'style' && entry && typeof entry === 'object' && ( !options.margin || !options.padding || !options.gap || !options.typography || !options.background ) ) {
                // Preserve other Gutenberg visual styles (color, typography, border).
                const style = filterOptions( entry, options );
                if ( Object.keys( style ).length ) out[ key ] = style;
                continue;
            }
            const next = filterOptions( entry, options );
            if ( ( key === 'spacing' || key === 'style' ) && next && typeof next === 'object' && !Object.keys( next ).length ) continue;
            out[ key ] = next;
        }
        return out;
    }
    return value;
}


/**
 * Convert the common, supported Gutenberg Timeline properties to native Elementor
 * controls. This is an explicit best-effort adapter, not an opaque settings copy:
 * Gutenberg inner blocks and theme preset tokens have no 1:1 Elementor equivalent.
 * The portable file stays unchanged; we map only after safety validation.
 */
export function gutenbergToElementor( block, palette = {} ) {
    if ( block?.name !== BLOCK_NAME || !Array.isArray( block.innerBlocks ) ) {
        throw new Error( 'Expected a Gutenberg Timeline root block.' );
    }
    const attributes = block.attributes || {};
    const mapped = {};
    for ( const [ semantic, pair ] of Object.entries( STYLE_KEYS ) ) {
        const value = attributes[ semantic ];
        if ( value === undefined || value === null || value === '' ) continue;
        mapped[ pair.elementor ] = semantic === 'lineWidth' || semantic === 'markerSize'
            ? { size: Number( value ), unit: 'px' } : value;
    }
    const flag = ( value ) => value ? 'yes' : 'no';
    const booleanPairs = {
        onTheOneSide: 'tl_change_onside', showOtherSide: 'tl_show_other_side',
        showMarker: 'tl_show_marker', markerUnique: 'tl_is_marker_unique',
        showStepNumbers: 'tl_show_step_numbers', animationTimeline: 'tl_animation_timeline',
        animationMarker: 'tl_animation_marker', animationOtherSideSticky: 'tl_animation_other_side_sticky',
    };
    for ( const [ source, dest ] of Object.entries( booleanPairs ) ) {
        if ( typeof attributes[ source ] === 'boolean' ) mapped[ dest ] = flag( attributes[ source ] );
    }
    if ( !Object.prototype.hasOwnProperty.call( attributes, 'markerUnique' ) &&
        block.innerBlocks.some( ( item ) => item.attributes?.markerUnique ) ) mapped.tl_is_marker_unique = 'yes';
    // Saved per-item position is the DOM's effective layout. Older blocks may
    // retain a stale parent `direction` value after a layout change, so honor
    // the first item's actual position when deriving Elementor's global switch.
    const firstPosition = block.innerBlocks.find( ( part ) => part.name === 'za/timeline-item' )?.attributes?.position;
    if ( firstPosition === 'timeline-inverted' || firstPosition === 'timeline-left' ) {
        mapped.tl_change_direction = attributes.onTheOneSide
            ? ( firstPosition === 'timeline-inverted' ? 'right' : 'left' )
            : ( firstPosition === 'timeline-inverted' ? 'left' : 'right' );
    } else if ( typeof attributes.direction === 'boolean' ) {
        mapped.tl_change_direction = attributes.onTheOneSide
            ? ( attributes.direction ? 'right' : 'left' )
            : ( attributes.direction ? 'left' : 'right' );
    }
    // Gutenberg root Timeline background maps to Elementor Advanced > Background.
    // Source images have already been replaced by portable placeholders.
    const rootColor = resolveGutenbergColor(
        attributes.style?.color?.background || attributes.backgroundColor || attributes.timelineBackgroundColor || '', palette
    );
    const rootImage = attributes.style?.background?.backgroundImage?.url || attributes.timelineBackgroundImage || '';
    const rootSize = attributes.style?.background?.backgroundSize || attributes.timelineBackgroundSize || 'cover';
    const nativePosition = attributes.style?.background?.backgroundPosition || attributes.timelineBackgroundPosition || '';
    const rootPosition = {
        '50% 50%': 'center center', '50% 0%': 'center top',
        '50% 100%': 'center bottom', '0% 50%': 'left center',
        '100% 50%': 'right center',
    }[ nativePosition ] || nativePosition || 'center center';
    if ( rootColor || rootImage ) {
        mapped._background_background = 'classic';
        if ( rootColor ) mapped._background_color = rootColor;
        if ( rootImage ) {
            mapped._background_image = { url: rootImage, id: 0 };
            mapped._background_size = [ 'cover', 'contain', 'auto' ].includes( rootSize ) ? rootSize : 'cover';
            mapped._background_position = /^(?:center center|center top|center bottom|left center|right center)$/.test( rootPosition ) ? rootPosition : 'center center';
        }
    }
    if ( typeof attributes.anchor === 'string' ) mapped._element_id = attributes.anchor;
    if ( typeof attributes.className === 'string' ) mapped._css_classes = attributes.className;
    const spacing = attributes.style?.spacing || {};
    for ( const [ source, dest ] of [ [ 'margin', '_margin' ], [ 'padding', '_padding' ] ] ) {
        const sourceSpacing = spacing[ source ];
        if ( !sourceSpacing || typeof sourceSpacing !== 'object' ) continue;
        const values = {};
        for ( const side of [ 'top', 'right', 'bottom', 'left' ] ) {
            const raw = sourceSpacing[ side ];
            if ( raw === undefined ) { values[ side ] = ''; continue; }
            if ( typeof raw !== 'string' && typeof raw !== 'number' ) continue;
            if ( !/^\d+(?:\.\d+)?(?:px)?$/.test( String( raw ) ) ) continue;
            values[ side ] = String( raw ).replace( /px$/, '' );
        }
        if ( Object.keys( values ).length === 4 ) mapped[ dest ] = { ...values, unit: 'px', isLinked: false };
    }
    const timelineItems = block.innerBlocks.filter( ( item ) => item.name === 'za/timeline-item' );
    const firstCard = timelineItems[ 0 ]?.innerBlocks?.find( ( entry ) => entry.name === 'za/timeline-item-content' );
    const firstTitle = firstCard?.innerBlocks?.find( ( entry ) => entry.name === 'core/heading' || entry.attributes?.className?.split( /\s+/ ).includes( 'tl-title' ) );
    if ( firstTitle?.name === 'core/paragraph' ) mapped.header_tag = 'p';
    else if ( firstTitle?.name === 'core/heading' ) mapped.header_tag = 'h' + ( firstTitle.attributes?.level || 3 );
    // Gutenberg's Timeline Item attributes are authoritative for the live layout.
    // The nested content area can retain an older false mirror after the parent
    // was edited (real v4.0.5 exports exhibit exactly this divergence).
    const effectiveItemFlag = ( item, area, key ) =>
        typeof item?.attributes?.[ key ] === 'boolean' ? item.attributes[ key ] :
            area?.attributes?.[ key ] === true;
    mapped.list = timelineItems.map( ( item, index ) => {
        const a = item.attributes || {};
        const children = item.innerBlocks || [];
        const side = children.find( ( part ) => part.name === 'za/timeline-item-side' );
        const card = children.find( ( part ) => part.name === 'za/timeline-item-content' );
        const cardAttrs = card?.attributes || a;
        const styleColor = ( attrs, kind ) => resolveGutenbergColor(
            attrs?.style?.color?.[ kind ] || attrs?.[ kind === 'background' ? 'backgroundColor' : 'textColor' ] || '',
            palette
        );
        const textBlocks = card?.innerBlocks || [];
        // Preserve the actual authoring order: the first block is the title,
        // unless an explicit .tl-title marks another block as the title.
        // Selecting a later heading unconditionally used to reorder paragraphs.
        const title = textBlocks.find( ( part ) => part.attributes?.className?.split( /\s+/ ).includes( 'tl-title' ) ) || textBlocks[ 0 ];
        const contentBlocks = textBlocks.filter( ( part ) => part !== title );
        const html = ( part ) => {
            const value = part.attributes?.content;
            if ( typeof value !== 'string' ) return '';
            if ( part.name === 'core/paragraph' ) return '<p>' + value + '</p>';
            if ( part.name === 'core/heading' ) return '<h' + ( part.attributes?.level || 3 ) + '>' + value + '</h' + ( part.attributes?.level || 3 ) + '>';
            return value;
        };
        const plain = ( value ) => typeof value === 'string' ? value.replace( /<[^>]*>/g, '' ) : '';
        const sideHtml = ( side?.innerBlocks || [] ).map( html ).filter( Boolean ).join( '' );
        const listTitle = title ? plain( title.attributes?.content ) : '';
        const itemSettings = {
            _id: 'tfw' + Math.random().toString( 16 ).slice( 2, 10 ).padEnd( 8, '0' ),
            list_title: listTitle || plain( a.otherSiteTitle ) || 'Timeline item ' + ( index + 1 ),
            list_content: contentBlocks.map( html ).filter( Boolean ).join( '' ),
            side_content: sideHtml || ( a.otherSiteTitle ? '<p>' + a.otherSiteTitle + '</p>' : '' ),
            media_type: cardAttrs.mediaType === 'video' ? 'video' : 'image',
            media_image: { id: 0, url: cardAttrs.mediaType === 'video' ? '' : ( cardAttrs.mediaUrl || '' ) },
            media_video: { id: 0, url: '' },
            posterURL: { id: 0, url: cardAttrs.mediaType === 'video' && cardAttrs.showMedia !== false && ( cardAttrs.mediaUrl || cardAttrs.videoPoster ) ? ( cardAttrs.videoPoster || PLACEHOLDER_TOKEN ) : '' },
            show_media: flag( cardAttrs.showMedia !== false && !!( cardAttrs.mediaUrl || cardAttrs.videoPoster ) ),
            media_width: normalizeMediaWidth( cardAttrs.mediaWidth || a.mediaWidth ),
            media_width_value: '',
            media_width_unit: 'px',
            media_image_alt: cardAttrs.imageAlt || '',
            marker_image: { id: 0, url: a.markerUrl || '',
                ...( Number.isFinite( Number( a.markerSize ) ) && Number( a.markerSize ) > 0
                    ? { width: Number( a.markerSize ), height: Number( a.markerSize ) } : {} ) },
            marker_image_alt: a.markerAlt || '',
        };
        if ( itemSettings.media_width ) {
            const widthParts = /^(\d+(?:\.\d+)?)(px|%)$/.exec(itemSettings.media_width);
            if ( widthParts ) {
                itemSettings.media_width_value = Number(widthParts[1]);
                itemSettings.media_width_unit = widthParts[2];
            }
        }
        // Newly imported Elementor items rely on the numeric controls only.
        // Avoid resurrecting a hidden legacy value when input is cleared.
        itemSettings.media_width = '';
        if ( a.mediaLinkUrl || cardAttrs.mediaLinkUrl ) {
            itemSettings.media_link_url = {
                url: cardAttrs.mediaLinkUrl || a.mediaLinkUrl,
                is_external: ( cardAttrs.mediaLinkTarget || a.mediaLinkTarget ) === '_blank',
                nofollow: /\bnofollow\b/.test( cardAttrs.mediaLinkRel || a.mediaLinkRel || '' ),
            };
            itemSettings.media_link_enabled = flag( !!( cardAttrs.isMediaWrapToLink ?? a.isMediaWrapToLink ) );
        }
        // The parent item owns the effective flags. The nested MAIN CONTENT
        // attributes may be stale mirrors in pre-4.0.0 transfer files.
        const reverse = effectiveItemFlag( item, card, 'reverseMediaContent' );
        const horizontal = effectiveItemFlag( item, card, 'horizontalContentLayout' );
        itemSettings.tl_card_change_direction = flag( reverse );
        // The native WordPress Background control persists a preset slug in
        // `backgroundColor` (e.g. vivid-red). It is the SAME item's outer
        // background as the plugin's explicit color control; do not discard it.
        itemSettings.item_outer_background_color =
            resolveGutenbergColor( a.itemOuterBackgroundColor, palette ) ||
            styleColor( a, 'background' ) || '';
        itemSettings.card_background_image = { url: cardAttrs.cardBackgroundImage || a.cardBackgroundImage || '', id: 0 };
        itemSettings.item_content_layout = horizontal ? 'horizontal' : 'vertical';
        // Gutenberg uses either literal CSS colors or theme-palette slugs.
        // Elementor's repeater accepts actual CSS colors, not preset slugs.
        // Explicit per-item colors take precedence over block background presets.
        const itemBackground = resolveGutenbergColor( a.itemBackgroundColor, palette ) ||
            styleColor( a, 'background' ) || styleColor( cardAttrs, 'background' );
        const headingColor = styleColor( title?.attributes, 'text' );
        const description = contentBlocks.find( ( part ) => part.name === 'core/paragraph' ) || contentBlocks[ 0 ];
        const descriptionColor = resolveGutenbergColor( a.descriptionColor, palette ) ||
            styleColor( description?.attributes, 'text' );
        const titleAlignment = title?.attributes?.textAlign || title?.attributes?.style?.typography?.textAlign;
        // Gutenberg stores typography on each nested block, not on the Timeline parent.
        // Convert the actual block attributes to Elementor repeater settings so that
        // the destination uses the donor's sizes even with different global defaults.
        const sideBlock = ( side?.innerBlocks || [] ).find( ( part ) =>
            part.name === 'core/paragraph' || part.name === 'core/heading' || part.name === 'core/list' );
        const sideColor = styleColor( sideBlock?.attributes, 'text' );
        const fontSize = ( part ) => {
            const raw = part?.attributes?.style?.typography?.fontSize;
            if ( typeof raw !== 'string' ) return null;
            const match = /^(\d+(?:\.\d+)?)(px|em|rem)$/.exec( raw.trim() );
            if ( !match || Number( match[ 1 ] ) < 1 || Number( match[ 1 ] ) > 300 ) return null;
            return { size: Number( match[ 1 ] ), unit: match[ 2 ] };
        };
        const titleFontSize = fontSize( title );
        const contentFontSize = fontSize( description );
        const sideFontSize = fontSize( sideBlock );
        // Layout controls are ALWAYS per-item. Shared visual style inheritance
        // applies to background, typography and colors only.
        if ( itemBackground || headingColor || descriptionColor || sideColor ||
            titleFontSize || contentFontSize || sideFontSize ||
            [ 'left', 'center', 'right' ].includes( titleAlignment ) ) {
            itemSettings.inherit_item_styles = 'no';
            if ( itemBackground ) itemSettings.li_bg_color = itemBackground;
            if ( headingColor ) itemSettings.item_title_color = headingColor;
            if ( descriptionColor ) itemSettings.item_content_color = descriptionColor;
            if ( sideColor ) itemSettings.item_side_color = sideColor;
            if ( titleFontSize ) itemSettings.item_title_font_size = titleFontSize;
            if ( contentFontSize ) itemSettings.item_content_font_size = contentFontSize;
            if ( sideFontSize ) itemSettings.item_side_font_size = sideFontSize;
            if ( [ 'left', 'center', 'right' ].includes( titleAlignment ) ) itemSettings.item_title_alignment = titleAlignment;
        }
        // A width is a per-item CSS length, not an Elementor image crop size.
        // Old native files with media_image.width are supported by reverse conversion.
        return itemSettings;
    } );
    return mapped;
}

/**
 * Rebuild a Gutenberg Timeline from the Elementor repeater's effective styles.
 * The original Elementor snapshot is never changed. Gutenberg has no native
 * counterpart for Elementor Advanced animation controls or theme fonts; only
 * the explicitly supported Timeline layout/content contract is converted.
 */
function elementorFlag( value ) { return value === 'yes' || value === true; }
function elementorLength( value, fallback = 0 ) {
    const n = typeof value === 'object' ? Number( value?.size ) : Number( value );
    return Number.isFinite( n ) && n >= 0 ? n : fallback;
}
function transferBlock( name, attributes = {}, innerBlocks = [] ) {
    return { name, attributes, innerBlocks };
}

/** Keep Elementor's safe inline RichText markup without creating unsupported HTML blocks. */
function richHtmlBlocks( html, fallback = 'core/paragraph' ) {
    if ( typeof html !== 'string' || !html.trim() ) return [];
    const blocks = [];
    // DOMParser is safe here: parseTransfer has already sanitized the HTML.
    if ( typeof DOMParser !== 'undefined' ) {
        const dom = new DOMParser().parseFromString( '<body>' + html + '</body>', 'text/html' );
        const unpack = ( element ) => {
            const tag = element.tagName?.toLowerCase();
            if ( tag === 'ul' || tag === 'ol' ) {
                return transferBlock( 'core/list', { ordered: tag === 'ol' },
                    Array.from( element.children ).filter( ( entry ) => entry.tagName?.toLowerCase() === 'li' )
                        .map( ( entry ) => transferBlock( 'core/list-item', { content: entry.innerHTML }, [] ) ) );
            }
            if ( /^h[1-6]$/.test( tag || '' ) ) return transferBlock( 'core/heading', { content: element.innerHTML, level: Number( tag[ 1 ] ) } );
            return transferBlock( 'core/paragraph', { content: element.innerHTML } );
        };
        for ( const node of Array.from( dom.body.childNodes ) ) {
            if ( node.nodeType === 1 ) blocks.push( unpack( node ) );
            else if ( node.nodeType === 3 && node.textContent.trim() ) blocks.push( transferBlock( fallback, { content: node.textContent.trim() } ) );
        }
        return blocks;
    }
    // Safe, limited Node/CLI fallback used by standalone contract tests.
    const rx = /<(p|h[1-6]|ul|ol)\b[^>]*>([\s\S]*?)<\/\1>/gi;
    let match;
    while ( ( match = rx.exec( html ) ) ) {
        const tag = match[ 1 ].toLowerCase();
        if ( tag === 'ul' || tag === 'ol' ) {
            const li = Array.from( match[ 2 ].matchAll( /<li\b[^>]*>([\s\S]*?)<\/li>/gi ) )
                .map( ( entry ) => transferBlock( 'core/list-item', { content: entry[ 1 ] } ) );
            blocks.push( transferBlock( 'core/list', { ordered: tag === 'ol' }, li ) );
        } else if ( tag[ 0 ] === 'h' ) blocks.push( transferBlock( 'core/heading', { content: match[ 2 ], level: Number( tag[ 1 ] ) } ) );
        else blocks.push( transferBlock( 'core/paragraph', { content: match[ 2 ] } ) );
    }
    if ( !blocks.length ) blocks.push( transferBlock( fallback, { content: html } ) );
    return blocks;
}

export function elementorToGutenberg( rawSettings ) {
    const settings = normalizeElementorItemLayouts( rawSettings );
    if ( !settings || !Array.isArray( settings.list ) ) throw new Error( 'Elementor Timeline does not contain a valid item list.' );
    const attrs = {};
    for ( const [semantic, pair] of Object.entries( STYLE_KEYS ) ) {
        const val = settings[ pair.elementor ];
        if ( val === undefined || val === null || val === '' ) continue;
        attrs[ semantic ] = semantic === 'lineWidth' || semantic === 'markerSize' ? elementorLength( val, 4 ) : val;
    }
    const flagPairs = {
        tl_change_onside: 'onTheOneSide', tl_show_other_side: 'showOtherSide',
        tl_show_marker: 'showMarker', tl_is_marker_unique: 'markerUnique',
        tl_show_step_numbers: 'showStepNumbers', tl_animation_timeline: 'animationTimeline',
        tl_animation_marker: 'animationMarker', tl_animation_other_side_sticky: 'animationOtherSideSticky',
    };
    for ( const [src, dst] of Object.entries( flagPairs ) ) {
        if ( settings[src] !== undefined ) attrs[dst] = elementorFlag( settings[src] );
    }
    const useSingleSide = elementorFlag( settings.tl_change_onside );
    attrs.direction = useSingleSide ? settings.tl_change_direction !== 'left' : settings.tl_change_direction === 'left';
    attrs.position = attrs.direction ? 'timeline-inverted' : 'timeline-left';
    if ( typeof settings._css_classes === 'string' ) attrs.className = settings._css_classes;
    if ( typeof settings._element_id === 'string' ) attrs.anchor = settings._element_id;
    const spacing = {};
    for ( const [key, name] of [ ['_margin', 'margin'], ['_padding', 'padding'] ] ) {
        const value = settings[key];
        if ( !value || typeof value !== 'object' ) continue;
        const sides = {};
        for ( const side of ['top', 'right', 'bottom', 'left'] ) {
            const raw = value[side];
            if ( /^\d+(?:\.\d+)?$/.test( String( raw ) ) ) sides[side] = raw + ( value.unit || 'px' );
        }
        if ( Object.keys( sides ).length ) spacing[name] = sides;
    }
    if ( Object.keys( spacing ).length ) attrs.style = { ...attrs.style, spacing };
    // Elementor's widget-level background belongs on the Gutenberg root,
    // not on every Timeline Item. Media has already been scrubbed to the
    // destination site's local placeholder in prepareImport().
    if ( settings._background_background === 'classic' ) {
        if ( typeof settings._background_color === 'string' && SAFE_COLOR.test( settings._background_color ) ) {
            attrs.style = { ...attrs.style, color: { ...attrs.style?.color, background: settings._background_color } };
        }
        if ( settings._background_image?.url ) {
            const backgroundPosition = {
                'center center': '50% 50%', 'center top': '50% 0%',
                'center bottom': '50% 100%', 'left center': '0% 50%',
                'right center': '100% 50%',
            }[ settings._background_position ] || '50% 50%';
            attrs.style = {
                ...attrs.style,
                background: {
                    backgroundImage: { url: settings._background_image.url, id: 0, source: 'file' },
                    backgroundSize: [ 'cover', 'contain', 'auto' ].includes( settings._background_size ) ? settings._background_size : 'cover',
                    backgroundPosition,
                },
            };
        }
    }

    // A dedicated heading block guarantees Gutenberg doesn't insert an extra
    // migration heading when the Elementor title tag was <p> or <a>.
    const headingTag = 'core/heading';
    const elementorTypography = ( prefix ) => {
        const typo = {};
        const size = settings[ prefix + '_font_size' ];
        if ( Number.isFinite( Number( size?.size ) ) && Number( size.size ) > 0 ) {
            typo.fontSize = size.size + ( size.unit || 'px' );
        }
        for ( const [ setting, field ] of [
            [ 'font_weight', 'fontWeight' ], [ 'font_style', 'fontStyle' ],
            [ 'text_transform', 'textTransform' ], [ 'text_decoration', 'textDecoration' ],
        ] ) {
            const val = settings[ prefix + '_' + setting ];
            if ( typeof val === 'string' && val ) typo[field] = val;
        }
        const height = settings[ prefix + '_line_height' ];
        if ( Number.isFinite( Number( height?.size ) ) && Number( height.size ) > 0 ) {
            typo.lineHeight = String( height.size ) + ( height.unit === 'px' ? 'px' : '' );
        }
        return typo;
    };
    const headingTypography = elementorTypography( 'title_typography' );
    const bodyTypography = elementorTypography( 'list_content_typography' );
    const sideTypography = elementorTypography( 'side_content_typography' );
    const startLeft = settings.tl_change_direction === 'left';
    const items = settings.list.map( ( item, index ) => {
        const inherited = item.inherit_item_styles !== 'no';
        const horizontal = item.item_content_layout === 'horizontal';
        const reverse = elementorFlag( item.tl_card_change_direction );
        // Elementor starts on left if direction=left, then alternates.
        const isLeft = useSingleSide ? startLeft : ( index % 2 === 0 ? !startLeft : startLeft );
        const position = isLeft ? 'timeline-left' : 'timeline-inverted';
        const background = item.li_bg_color || settings.shared_item_background_color || '';
        const outerBackground = item.item_outer_background_color || '';
        const image = item.media_image || {};
        const video = item.media_video || {};
        const poster = item.posterURL || {};
        const mediaIsVideo = item.media_type === 'video';
        const mediaUrl = mediaIsVideo ? ( poster.url || video.url || '' ) : ( image.url || '' );
        const hasMedia = item.show_media !== 'no' && !!mediaUrl;
        const size = item.thumbnail_custom_dimension || {};
        const width = normalizeMediaWidth( item.media_width_value !== undefined && item.media_width_value !== '' && item.media_width_value !== null
            ? String(item.media_width_value) + (item.media_width_unit === '%' ? '%' : 'px') : item.media_width ) ||
            ( elementorLength( size.width || image.width, 0 ) ? `${elementorLength( size.width || image.width, 0 )}px` : '' );
        const marker = item.marker_image || {};
        const markerUrl = marker.url || '';
        const sideAttrs = { showOtherSide: attrs.showOtherSide !== false,
            sideTextAlign: 'left' };
        const sideBlocks = richHtmlBlocks( item.side_content || '' );
        const importedFontSize = ( input ) => {
            const size = Number( input?.size );
            const unit = input?.unit || 'px';
            return Number.isFinite( size ) && size >= 1 && size <= 300 && [ 'px', 'em', 'rem' ].includes( unit )
                ? `${size}${unit}` : '';
        };
        const sideSize = importedFontSize( item.item_side_font_size );
        const titleSize = importedFontSize( item.item_title_font_size );
        const bodySize = importedFontSize( item.item_content_font_size );
        const sideColor = inherited ? '' : item.item_side_color || '';
        for ( const part of sideBlocks ) {
            part.attributes.style = { ...( part.attributes.style || {} ),
                ...( sideColor ? { color: { ...( part.attributes.style?.color || {} ), text: sideColor } } : {} ),
                typography: { ...sideTypography, ...( sideSize ? { fontSize: sideSize } : {} ) },
            };
        }
        const originalTitle = String( item.list_title || '' );
        // Elementor's title hyperlink is separate from list_content links.
        // Embed it as RichText inside the target heading if its URL survived
        // strict transfer validation; no executable markup is introduced.
        const titleUrl = item.title_link_url?.url || '';
        const escapedTitle = originalTitle.replace( /&/g, '&amp;' ).replace( /</g, '&lt;' ).replace( />/g, '&gt;' ).replace( /"/g, '&quot;' );
        const titleContent = titleUrl && /^https?:\/\//i.test( titleUrl )
            ? '<a href="' + titleUrl.replace( /&/g, '&amp;' ).replace( /"/g, '&quot;' ) + '">' + escapedTitle + '</a>' : escapedTitle;
        const titleAttrs = { content: titleContent,
            level: /^h[1-6]$/.test( settings.header_tag || '' ) ? Number( settings.header_tag[1] ) : 3 };
        const titleColor = inherited ? settings.title_color : ( item.item_title_color || settings.title_color );
        const descColor = inherited ? settings.blocks_color : ( item.item_content_color || settings.blocks_color );
        if ( titleColor || Object.keys( headingTypography ).length || titleSize ) titleAttrs.style = {
            ...( titleColor ? { color: { text: titleColor } } : {} ),
            typography: { ...headingTypography, ...( titleSize ? { fontSize: titleSize } : {} ) },
        };
        const itemTitleAlign = inherited ? settings.title_alignment : ( item.item_title_alignment || settings.title_alignment );
        if ( [ 'left', 'center', 'right' ].includes( itemTitleAlign ) ) titleAttrs.textAlign = itemTitleAlign;
        const bodyBlocks = richHtmlBlocks( item.list_content || '' );
        for ( const part of bodyBlocks ) if ( descColor || Object.keys( bodyTypography ).length || bodySize ) {
            part.attributes.style = { ...( part.attributes.style || {} ),
                ...( descColor ? { color: { text: descColor } } : {} ),
                typography: { ...bodyTypography, ...( bodySize ? { fontSize: bodySize } : {} ) },
            };
        }
        const mainAttrs = {
            showMedia: hasMedia, mediaUrl: hasMedia ? mediaUrl : '', mediaId: 0, mediaType: mediaIsVideo ? 'video' : 'image',
            mediaMime: mediaIsVideo ? 'video/mp4' : 'image/svg+xml',
            imageAlt: item.media_image_alt || image.alt || '',
            videoPoster: hasMedia && mediaIsVideo ? ( poster.url || '' ) : '',
            mediaWidth: width,
            horizontalContentLayout: horizontal, reverseMediaContent: reverse,
            cardBackgroundImage: item.card_background_image?.url || '',
            mediaLinkUrl: item.media_link_url?.url || '',
            mediaLinkTarget: item.media_link_url?.is_external ? '_blank' : '',
            mediaLinkRel: item.media_link_url?.nofollow ? 'nofollow' : '',
            isMediaWrapToLink: elementorFlag( item.media_link_enabled ),
        };
        const itemAttrs = {
            position, onTheOneSide: useSingleSide, showOtherSide: attrs.showOtherSide !== false,
            showMarker: attrs.showMarker !== false, markerUnique: attrs.markerUnique === true,
            markerUrl, markerId: 0, markerAlt: item.marker_image_alt || marker.alt || '',
            horizontalContentLayout: horizontal, reverseMediaContent: reverse,
            itemBackgroundColor: background || '', itemOuterBackgroundColor: outerBackground,
            cardBackgroundImage: item.card_background_image?.url || '', descriptionColor: descColor || '',
            ...mainAttrs, otherSiteTitle: '',
        };
        if ( background ) itemAttrs.style = { color: { background } };
        return transferBlock( 'za/timeline-item', itemAttrs, [
            transferBlock( 'za/timeline-item-side', sideAttrs, sideBlocks ),
            transferBlock( 'za/timeline-item-content', mainAttrs, [
                transferBlock( headingTag, titleAttrs ), ...bodyBlocks,
            ] ),
        ] );
    } );
    return transferBlock( BLOCK_NAME, attrs, items );
}

/** Convert legacy root background fields to WordPress-native block supports on import.
 * Existing saved posts retain the old fields for backward compatibility; new
 * imports use the standard Background UI without duplicating controls.
 */
export function normalizeGutenbergRootBackground( block ) {
    if ( block?.name !== BLOCK_NAME ) return block;
    const attrs = { ...( block.attributes || {} ) };
    const style = { ...( attrs.style || {} ) };
    const legacyColor = attrs.timelineBackgroundColor;
    if ( legacyColor && !attrs.backgroundColor && !style.color?.background ) {
        style.color = { ...style.color, background: legacyColor };
    }
    const oldImage = attrs.timelineBackgroundImage;
    if ( oldImage && !style.background?.backgroundImage?.url ) {
        const position = {
            'center center': '50% 50%', 'center top': '50% 0%',
            'center bottom': '50% 100%', 'left center': '0% 50%',
            'right center': '100% 50%',
        }[ attrs.timelineBackgroundPosition ] || '50% 50%';
        style.background = {
            ...style.background,
            backgroundImage: { url: oldImage, id: 0, source: 'file' },
            backgroundSize: [ 'cover', 'contain', 'auto' ].includes( attrs.timelineBackgroundSize )
                ? attrs.timelineBackgroundSize : 'cover',
            backgroundPosition: position,
        };
    }
    for ( const key of [ 'timelineBackgroundColor', 'timelineBackgroundImage', 'timelineBackgroundSize', 'timelineBackgroundPosition' ] ) {
        delete attrs[ key ];
    }
    if ( Object.keys( style ).length ) attrs.style = style;
    return { ...block, attributes: attrs };
}

export function prepareImport( file, destination, selected = {}, placeholderUrl = PLACEHOLDER_TOKEN, currentData = null ) {
    const parsed = parseTransfer( file, destination );
    const options = { ...IMPORT_OPTIONS, ...selected };
    const safe = scrubMedia( parsed.data, parsed.origin, PLACEHOLDER_TOKEN );
    const native = parsed.origin === 'gutenberg' && destination === 'elementor'
        ? gutenbergToElementor( safe, parsed.palette )
        : parsed.origin === 'elementor' && destination === 'gutenberg'
            ? elementorToGutenberg( safe ) : parsed.origin === 'elementor' ? normalizeElementorItemLayouts( safe ) : normalizeGutenbergRootBackground( safe );
    const filtered = filterOptions( native, options );
    const merged = options.content ? filtered : preserveDestinationContent( filtered, currentData, destination );
    if ( !safeUrl( placeholderUrl ) ) throw new Error( 'Invalid local media placeholder.' );
    return replacePlaceholders( merged, placeholderUrl );
}

function replacePlaceholders( value, placeholderUrl ) {
    if ( typeof value === 'string' ) return value.split( PLACEHOLDER_TOKEN ).join( placeholderUrl );
    if ( Array.isArray( value ) ) return value.map( ( item ) => replacePlaceholders( item, placeholderUrl ) );
    if ( value && typeof value === 'object' ) {
        return Object.fromEntries( Object.entries( value ).map( ( [ key, entry ] ) => [ key, replacePlaceholders( entry, placeholderUrl ) ] ) );
    }
    return value;
}

export function transferFilename( source, date = new Date() ) {
    return `timeline-${ source }-${ date.toISOString().slice( 0, 10 ) }-v${ SCHEMA_VERSION }.tfw.json`;
}

export function downloadTransfer( transfer, name ) {
    const serialized = JSON.stringify( transfer, null, 2 );
    if ( new TextEncoder().encode( serialized ).length > MAX_FILE_BYTES ) throw new Error( 'Timeline exceeds the 5 MB transfer limit.' );
    const blob = new Blob( [ serialized ], { type: 'application/json' } );
    const url = URL.createObjectURL( blob );
    const link = document.createElement( 'a' );
    link.href = url;
    link.download = name;
    document.body.appendChild( link );
    link.click();
    link.remove();
    setTimeout( () => URL.revokeObjectURL( url ), 1500 );
}

export async function readTransferFile( file ) {
    if ( !file || !Number.isFinite( file.size ) || file.size > MAX_FILE_BYTES ) throw new Error( 'File must be smaller than 5 MB.' );
    if ( file.type && ![ 'application/json', 'text/plain', 'application/octet-stream' ].includes( file.type ) ) {
        throw new Error( 'Select a JSON Timeline export file.' );
    }
    return file.text();
}
