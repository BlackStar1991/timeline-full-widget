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
