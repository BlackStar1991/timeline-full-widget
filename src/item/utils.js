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

	if (url) {
		attrs.href = url;
	}

	if (target) {
		attrs.target = target;
	}

	const userRel =
		typeof rel === 'string' && rel.trim().toLowerCase() !== 'true'
			? rel.trim()
			: '';

	let baseOrigin = siteOrigin;
	if (!baseOrigin && typeof window !== 'undefined' && window.location) {
		baseOrigin = window.location.origin;
	}

	let isExternal = false;
	if (url) {
		try {
			const parsed = new URL(url, baseOrigin || undefined);
			const proto = parsed.protocol ? parsed.protocol.toLowerCase() : '';
			if (proto === 'http:' || proto === 'https:') {
				if (baseOrigin) {
					isExternal = parsed.origin !== baseOrigin;
				} else if (typeof window !== 'undefined' && window.location) {
					isExternal = parsed.origin !== window.location.origin;
				} else {
					isExternal = true;
				}
			} else {
				isExternal = false;
			}
		} catch (e) {
			isExternal = false;
		}
	}

	const tokens = new Set();

	if (userRel) {
		userRel.split(/\s+/).forEach((t) => t && tokens.add(t));
	}

	if (isExternal) {
		if (addNoFollowForExternal) {
			tokens.add('nofollow');
		}
		if (target === '_blank') {
			tokens.add('noopener');
			tokens.add('noreferrer');
		}
	} else {
		if (target === '_blank') {
			tokens.add('noopener');
			tokens.add('noreferrer');
		}
	}

	if (tokens.size) {
		attrs.rel = Array.from(tokens).join(' ');
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

export function parseStyleString(styleString) {
	if (!styleString || typeof styleString !== 'string') return {};
	return styleString.split(';').reduce((acc, pair) => {
		// trim each pair first
		const trimmed = String(pair).trim();
		if (!trimmed) return acc;

		// split on FIRST ':' to allow values containing ':' (e.g. url(...))
		const idx = trimmed.indexOf(':');
		if (idx === -1) return acc;

		const rawProp = trimmed.slice(0, idx).trim();
		const rawVal = trimmed.slice(idx + 1).trim();
		if (!rawProp || !rawVal) return acc;

		// convert CSS property-name to JS camelCase key
		const jsKey = rawProp.replace(/-([a-z])/g, (m, p1) => p1.toUpperCase());
		if (jsKey) acc[jsKey] = rawVal;

		return acc;
	}, {});
}

/**
 * Build a style object merging a saved inline style string and separate attributes.
 * Separate attributes override style-string values.
 */
export function buildStyleObject(attrs = {}) {
	// attrs: { titleInlineStyle, titleFontSize, titleFontWeight, titleMarginTop, titleMarginBottom, titleColor }
	const styleFromAttr = parseStyleString(attrs.titleInlineStyle);
	const result = { ...styleFromAttr }; // base from stored style-str

	// explicitly override if we have separate attributes (so newer UI wins)
	if (attrs.titleColor) result.color = attrs.titleColor;

	if (attrs.titleFontSize) {
		const size = String(attrs.titleFontSize);
		result.fontSize = /px|rem|em|%/.test(size) ? size : `${size}px`;
	}

	// Font weight handling: allow 'normal'/'bold' or numeric '400'..'900'
	if (
		attrs.titleFontWeight !== undefined &&
		attrs.titleFontWeight !== null &&
		attrs.titleFontWeight !== ''
	) {
		// ensure it's a string (CSS accepts '700' or 'bold')
		result.fontWeight = String(attrs.titleFontWeight);
	} else if (styleFromAttr.fontWeight) {
		// keep parsed inline font-weight if separate attr not set
		result.fontWeight = styleFromAttr.fontWeight;
	}

    if (attrs.titleFontFamily) {
        const tf = String(attrs.titleFontFamily).trim();
        const isSlug = /^[a-z0-9\-_]+$/i.test(tf);
        if (isSlug) {
            result.fontFamily = `var(--wp--preset--font-family--${tf}, sans-serif)`;
        } else {
            result.fontFamily = tf;
        }
    }

	if (attrs.titleMarginTop)
		result.marginTop = String(attrs.titleMarginTop).endsWith('px')
			? String(attrs.titleMarginTop)
			: `${attrs.titleMarginTop}px`;

	if (attrs.titleMarginBottom)
		result.marginBottom = String(attrs.titleMarginBottom).endsWith('px')
			? String(attrs.titleMarginBottom)
			: `${attrs.titleMarginBottom}px`;

	if (
		attrs.titleLineHeight !== undefined &&
		attrs.titleLineHeight !== null &&
		String(attrs.titleLineHeight).trim() !== ''
	) {
		const raw = String(attrs.titleLineHeight).trim();
		if (/^\d+(\.\d+)?px$/.test(raw)) {
			result.lineHeight = raw;
		} else if (/^\d+(\.\d+)?$/.test(raw)) {
			result.lineHeight = `${raw}px`;
		} else {
			if (/^\d+(\.\d+)?(rem|em|%)$/.test(raw)) {
				result.lineHeight = raw;
			} else {
				result.lineHeight = raw;
			}
		}
	} else if (styleFromAttr.lineHeight) {
		const inlineVal = String(styleFromAttr.lineHeight).trim();
		if (/^\d+(\.\d+)?px$/.test(inlineVal)) {
			result.lineHeight = inlineVal;
		} else if (/^\d+(\.\d+)?$/.test(inlineVal)) {
			result.lineHeight = `${inlineVal}px`;
		} else {
			result.lineHeight = inlineVal;
		}
	}

	return result;
}

export function convertMarginAttrToStyle(style = {}) {
	const result = {};
	if (!style) return result;

	const spacing = style.spacing ?? style;
	const normalize = (v) => {
		if (v == null) return null;

		if (typeof v === 'number') return `${v}px`;

		if (typeof v === 'string') {
			if (v === '0' || v === '0px' || v === '0rem') return '0';
			if (/^(?:-?\d+(\.\d+)?(px|rem|em|%)|var\(|--)/.test(v)) return v;
			const wpVarMatch = v.match(/^var:preset\|([^\|]+)\|(.+)$/);
			if (wpVarMatch) {
				const group = wpVarMatch[1];
				const name = wpVarMatch[2];
				return `var(--wp--preset--${group}--${name})`;
			}

			if (/^-?\d+(\.\d+)?$/.test(v)) return `${v}px`;
			return v;
		}
		return null;
	};

	if (
		spacing &&
		typeof spacing.margin === 'object' &&
		!Array.isArray(spacing.margin)
	) {
		const m = spacing.margin;
		if (m.top != null) result.marginTop = normalize(m.top);
		if (m.right != null) result.marginRight = normalize(m.right);
		if (m.bottom != null) result.marginBottom = normalize(m.bottom);
		if (m.left != null) result.marginLeft = normalize(m.left);

		if (m.vertical != null) {
			const v = normalize(m.vertical);
			if (v) {
				result.marginTop = result.marginTop ?? v;
				result.marginBottom = result.marginBottom ?? v;
			}
		}
		if (m.horizontal != null) {
			const h = normalize(m.horizontal);
			if (h) {
				result.marginLeft = result.marginLeft ?? h;
				result.marginRight = result.marginRight ?? h;
			}
		}
	}

	if (spacing && Array.isArray(spacing.margin)) {
		const [t, r, b, l] = spacing.margin;
		if (t != null) result.marginTop = normalize(t);
		if (r != null) result.marginRight = normalize(r);
		if (b != null) result.marginBottom = normalize(b);
		if (l != null) result.marginLeft = normalize(l);
	}

	['marginTop', 'marginRight', 'marginBottom', 'marginLeft'].forEach((k) => {
		const v = spacing?.[k] ?? style?.[k];
		if (v != null) result[k] = normalize(v);
	});

	if (!Object.keys(result).length) {
		if (typeof spacing === 'string' || typeof spacing === 'number') {
			const v = normalize(spacing);
			if (v != null) result.margin = v;
		}
	}

	Object.keys(result).forEach((k) => {
		if (result[k] == null) delete result[k];
	});

	return result;
}
