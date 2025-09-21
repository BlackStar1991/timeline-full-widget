/**
 * Return safe link attributes for use in editor and save.
 *
 * url   - string|null
 * rel   - string|boolean|undefined  (LinkControl can return true)
 * target- string|undefined ('_blank' или undefined)
 * options:
 *   - addNoFollowForExternal  boolean, default true  (add nofollow to external links)
 *   - siteOrigin              string|undefined (for example https://example.com)
 *
 */
export function getSafeLinkAttributes(
	url,
	rel,
	target,
	{ addNoFollowForExternal = true, siteOrigin } = {}
) {
	const attrs = {};

	if ( url ) {
		attrs.href = url;
	}

	if ( target ) {
		attrs.target = target;
	}

	const userRel =
		typeof rel === 'string' && rel.trim().toLowerCase() !== 'true'
			? rel.trim()
			: '';

	let baseOrigin = siteOrigin;
	if ( ! baseOrigin && typeof window !== 'undefined' && window.location ) {
		baseOrigin = window.location.origin;
	}

	let isExternal = false;
	if ( url ) {
		try {
			const parsed = new URL( url, baseOrigin || undefined );
			const proto = parsed.protocol ? parsed.protocol.toLowerCase() : '';
			if ( proto === 'http:' || proto === 'https:' ) {
				if ( baseOrigin ) {
					isExternal = parsed.origin !== baseOrigin;
				} else if ( typeof window !== 'undefined' && window.location ) {
					isExternal = parsed.origin !== window.location.origin;
				} else {
					isExternal = true;
				}
			} else {
				isExternal = false;
			}
		} catch ( e ) {
			isExternal = false;
		}
	}

	const tokens = new Set();

	if ( userRel ) {
		userRel.split( /\s+/ ).forEach( ( t ) => t && tokens.add( t ) );
	}

	if ( isExternal ) {
		if ( addNoFollowForExternal ) {
			tokens.add( 'nofollow' );
		}
		if ( target === '_blank' ) {
			tokens.add( 'noopener' );
			tokens.add( 'noreferrer' );
		}
	} else {
		if ( target === '_blank' ) {
			tokens.add( 'noopener' );
			tokens.add( 'noreferrer' );
		}
	}

	if ( tokens.size ) {
		attrs.rel = Array.from( tokens ).join( ' ' );
	}

	return attrs;
}

/* ---------- Style utilities ---------- */

/**
 * Parse a CSS style string into a JS-style object.
 * Handles url(...) with colons by splitting on the first ':' in each pair.
 * Last occurrence of the same property wins (like CSS).
 *
 * Example:
 *  "margin-top:10px; color: red" -> { marginTop: "10px", color: "red" }
 *
 * @param {string|undefined|null} styleString
 * @returns {Object}
 */

export function parseStyleString( styleString ) {
	if ( ! styleString || typeof styleString !== 'string' ) return {};
	return styleString.split( ';' ).reduce( ( acc, pair ) => {
		// trim each pair first
		const trimmed = String( pair ).trim();
		if ( ! trimmed ) return acc;

		// split on FIRST ':' to allow values containing ':' (e.g. url(...))
		const idx = trimmed.indexOf( ':' );
		if ( idx === -1 ) return acc;

		const rawProp = trimmed.slice( 0, idx ).trim();
		const rawVal = trimmed.slice( idx + 1 ).trim();
		if ( ! rawProp || ! rawVal ) return acc;

		// convert CSS property-name to JS camelCase key
		const jsKey = rawProp.replace( /-([a-z])/g, ( m, p1 ) =>
			p1.toUpperCase()
		);
		if ( jsKey ) acc[ jsKey ] = rawVal;

		return acc;
	}, {} );
}

/**
 * Build a style object merging a saved inline style string and separate attributes.
 * Separate attributes override style-string values.
 */
export function buildStyleObject( attrs = {} ) {
	// attrs: { titleInlineStyle, titleFontSize, titleFontWeight, titleMarginTop, titleMarginBottom, titleColor }
	const styleFromAttr = parseStyleString( attrs.titleInlineStyle );
	const result = { ...styleFromAttr }; // base from stored style-str

	// explicitly override if we have separate attributes (so newer UI wins)
	if ( attrs.titleColor ) result.color = attrs.titleColor;

	if ( attrs.titleFontSize ) {
		const size = String( attrs.titleFontSize );
		result.fontSize = /px|rem|em|%/.test( size ) ? size : `${ size }px`;
	}

	// Font weight handling: allow 'normal'/'bold' or numeric '400'..'900'
	if (
		attrs.titleFontWeight !== undefined &&
		attrs.titleFontWeight !== null &&
		attrs.titleFontWeight !== ''
	) {
		// ensure it's a string (CSS accepts '700' or 'bold')
		result.fontWeight = String( attrs.titleFontWeight );
	} else if ( styleFromAttr.fontWeight ) {
		// keep parsed inline font-weight if separate attr not set
		result.fontWeight = styleFromAttr.fontWeight;
	}

	if ( attrs.titleMarginTop )
		result.marginTop = String( attrs.titleMarginTop ).endsWith( 'px' )
			? String( attrs.titleMarginTop )
			: `${ attrs.titleMarginTop }px`;

	if ( attrs.titleMarginBottom )
		result.marginBottom = String( attrs.titleMarginBottom ).endsWith( 'px' )
			? String( attrs.titleMarginBottom )
			: `${ attrs.titleMarginBottom }px`;

	return result;
}

export function convertMarginAttrToStyle( attrStyle ) {
    if ( ! attrStyle || ! attrStyle.spacing || ! attrStyle.spacing.margin ) {
        return {};
    }
    const m = attrStyle.spacing.margin;
    const toCss = (v) => {
        if ( v === undefined || v === null || v === '' ) return undefined;
        if ( typeof v === 'string' && /[a-z%]$/i.test( v.trim() ) ) return v;
        return String(v) + 'px';
    };

    const style = {};
    const top = toCss(m.top); if ( top ) style.marginTop = top;
    const right = toCss(m.right); if ( right ) style.marginRight = right;
    const bottom = toCss(m.bottom); if ( bottom ) style.marginBottom = bottom;
    const left = toCss(m.left); if ( left ) style.marginLeft = left;
    return style;
}

