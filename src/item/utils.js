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
		const [ rawProp, rawVal ] = pair.split( ':' ) || [];
		if ( ! rawProp || ! rawVal ) return acc;
		const prop = rawProp.trim();
		const val = rawVal.trim();
		// convert CSS property-name to JS camelCase key
		const jsKey = prop.replace( /-([a-z])/g, ( m, p1 ) =>
			p1.toUpperCase()
		);
		if ( jsKey ) acc[ jsKey ] = val;
		return acc;
	}, {} );
}
/**
 * Build a style object merging a saved inline style string and separate attributes.
 * Separate attributes override style-string values.
 *
 * attrs example:
 *  {
 *    titleInlineStyle: 'font-size:12px; color: blue;',
 *    titleFontSize: '20',
 *    titleMarginTop: '10',
 *    titleMarginBottom: '5',
 *    titleColor: '#333'
 *  }
 *
 * @param {Object} attrs
 * @returns {Object} JS style object (suitable for React style={...})
 */
export function buildStyleObject( attrs ) {
	// attrs: { titleInlineStyle, titleFontSize, titleMarginTop, titleMarginBottom, titleColor }
	const styleFromAttr = parseStyleString( attrs.titleInlineStyle );
	const result = { ...styleFromAttr }; // base from stored style-str

	// explicitly override if we have separate attributes (so newer UI wins)
	if ( attrs.titleColor ) result.color = attrs.titleColor;
	if ( attrs.titleFontSize ) {
		// allow user to store units in the attr (if already contains units)
		const size = String( attrs.titleFontSize );
		result.fontSize = /px|rem|em|%/.test( size ) ? size : `${ size }px`;
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
