import { createBlock } from '@wordpress/blocks';

import { DEFAULT_TIMELINE_ITEM_TITLE } from './areas/config';

// Temporary 3.x compatibility layer for Timeline Item titles saved before 3.0.0.
// TODO(4.0.0): Remove this legacy title migration after users have had a full
// major release cycle to open and save old Timeline blocks in the editor.
export const LEGACY_TITLE_ATTRIBUTES = {
	title: {
		type: 'string',
		source: 'html',
		selector: '.tl-title',
	},
	titleInlineStyle: {
		type: 'string',
		source: 'attribute',
		selector: '.tl-title',
		attribute: 'style',
		default: '',
	},
	titleTag: {
		type: 'string',
		default: 'h3',
	},
	titleColor: {
		type: 'string',
		default: '',
	},
	titleFontSize: {
		type: 'object',
		default: {
			desktop: 22,
			tablet: null,
			mobile: null,
		},
	},
	titleFontUnit: {
		type: 'string',
		default: 'px',
	},
	titleFontWeight: {
		type: 'string',
		default: '',
	},
	titleAlign: {
		type: 'string',
		default: 'left',
	},
	titleFontFamily: {
		type: 'string',
		default: '',
	},
	titleLineHeight: {
		type: 'string',
		default: '1.5',
	},
	titleLetterSpacing: {
		type: 'string',
		default: '',
	},
	titleMarginTop: {
		type: 'string',
		default: '10px',
	},
	titleMarginBottom: {
		type: 'string',
		default: '0px',
	},
};

const LEGACY_TITLE_DEFAULTS = {
	fontSize: '22px',
	fontWeight: '700',
	fontFamily: '',
	lineHeight: '1.5',
	letterSpacing: '',
	marginTop: '10px',
	marginBottom: '0px',
	color: '',
	align: 'left',
	level: 3,
};

function normalizeString( value ) {
	if ( value === undefined || value === null ) {
		return '';
	}

	return String( value ).trim();
}

function normalizeLength( value, unit = 'px' ) {
	const normalized = normalizeString( value );

	if ( normalized === '' ) {
		return '';
	}

	if ( /^(?:-?\d+(?:\.\d+)?(?:px|rem|em|%)|0)$/i.test( normalized ) ) {
		return normalized;
	}

	return `${ normalized }${ unit }`;
}

function normalizeFontSize( value, unit = 'px' ) {
	if ( value && typeof value === 'object' ) {
		const responsiveValue =
			value.desktop ?? value.tablet ?? value.mobile ?? undefined;
		return normalizeLength( responsiveValue, unit || 'px' );
	}

	return normalizeLength( value, unit || 'px' );
}

function normalizeFontFamily( value ) {
	const fontFamily = normalizeString( value );

	if ( ! fontFamily ) {
		return '';
	}

	return /^[a-z0-9\-_]+$/i.test( fontFamily )
		? `var(--wp--preset--font-family--${ fontFamily }, sans-serif)`
		: fontFamily;
}

function normalizeStyleValue( property, value ) {
	if ( property === 'fontSize' ) {
		return normalizeLength( value );
	}

	if ( property === 'fontWeight' || property === 'lineHeight' ) {
		return normalizeString( value );
	}

	if ( property === 'letterSpacing' || property === 'marginTop' || property === 'marginBottom' ) {
		return normalizeLength( value );
	}

	return normalizeString( value );
}

function parseLegacyStyleString( styleString ) {
	if ( ! styleString || typeof styleString !== 'string' ) {
		return {};
	}

	return styleString.split( ';' ).reduce( ( acc, pair ) => {
		const trimmed = normalizeString( pair );
		const separatorIndex = trimmed.indexOf( ':' );

		if ( separatorIndex === -1 ) {
			return acc;
		}

		const rawProperty = trimmed.slice( 0, separatorIndex ).trim();
		const rawValue = trimmed.slice( separatorIndex + 1 ).trim();

		if ( ! rawProperty || ! rawValue ) {
			return acc;
		}

		const property = rawProperty.replace( /-([a-z])/g, ( match, letter ) =>
			letter.toUpperCase()
		);
		acc[ property ] = normalizeStyleValue( property, rawValue );

		return acc;
	}, {} );
}

function getLegacyHeadingLevel( titleTag ) {
	const levelMatch = normalizeString( titleTag ).match( /^h([1-6])$/i );

	if ( ! levelMatch ) {
		return LEGACY_TITLE_DEFAULTS.level;
	}

	return Number( levelMatch[ 1 ] );
}

function collectLegacyTitleStyles( attributes = {} ) {
	const styles = parseLegacyStyleString( attributes.titleInlineStyle );
	const fontUnit = attributes.titleFontUnit || 'px';
	const fontSize = normalizeFontSize( attributes.titleFontSize, fontUnit );

	if ( fontSize ) {
		styles.fontSize = fontSize;
	}

	if ( attributes.titleFontWeight ) {
		styles.fontWeight = normalizeString( attributes.titleFontWeight );
	}

	if ( attributes.titleFontFamily ) {
		styles.fontFamily = normalizeFontFamily( attributes.titleFontFamily );
	}

	if ( attributes.titleLineHeight ) {
		styles.lineHeight = normalizeString( attributes.titleLineHeight );
	}

	if ( attributes.titleLetterSpacing ) {
		styles.letterSpacing = normalizeLength( attributes.titleLetterSpacing );
	}

	if ( attributes.titleMarginTop ) {
		styles.marginTop = normalizeLength( attributes.titleMarginTop );
	}

	if ( attributes.titleMarginBottom ) {
		styles.marginBottom = normalizeLength( attributes.titleMarginBottom );
	}

	if ( attributes.titleColor ) {
		styles.color = normalizeString( attributes.titleColor );
	}

	return styles;
}

function applyIfCustomized( target, property, value, defaultValue ) {
	const normalized = normalizeString( value );

	if ( ! normalized || normalized === normalizeString( defaultValue ) ) {
		return;
	}

	target[ property ] = normalized;
}

export function getLegacyTitleHeadingAttributes( attributes = {} ) {
	const legacyStyles = collectLegacyTitleStyles( attributes );
	const typography = {};
	const color = {};
	const margin = {};

	applyIfCustomized(
		typography,
		'fontSize',
		legacyStyles.fontSize,
		LEGACY_TITLE_DEFAULTS.fontSize
	);
	applyIfCustomized(
		typography,
		'fontWeight',
		legacyStyles.fontWeight,
		LEGACY_TITLE_DEFAULTS.fontWeight
	);
	applyIfCustomized(
		typography,
		'fontFamily',
		legacyStyles.fontFamily,
		LEGACY_TITLE_DEFAULTS.fontFamily
	);
	applyIfCustomized(
		typography,
		'lineHeight',
		legacyStyles.lineHeight,
		LEGACY_TITLE_DEFAULTS.lineHeight
	);
	applyIfCustomized(
		typography,
		'letterSpacing',
		legacyStyles.letterSpacing,
		LEGACY_TITLE_DEFAULTS.letterSpacing
	);
	applyIfCustomized( color, 'text', legacyStyles.color, LEGACY_TITLE_DEFAULTS.color );
	applyIfCustomized(
		margin,
		'top',
		legacyStyles.marginTop,
		LEGACY_TITLE_DEFAULTS.marginTop
	);
	applyIfCustomized(
		margin,
		'bottom',
		legacyStyles.marginBottom,
		LEGACY_TITLE_DEFAULTS.marginBottom
	);

	const style = {};

	if ( Object.keys( typography ).length ) {
		style.typography = typography;
	}

	if ( Object.keys( color ).length ) {
		style.color = color;
	}

	if ( Object.keys( margin ).length ) {
		style.spacing = { margin };
	}

	const headingAttributes = {
		level: getLegacyHeadingLevel( attributes.titleTag ),
		content: attributes.title || DEFAULT_TIMELINE_ITEM_TITLE,
		className: 'tl-title',
	};

	if (
		attributes.titleAlign &&
		attributes.titleAlign !== LEGACY_TITLE_DEFAULTS.align
	) {
		headingAttributes.textAlign = attributes.titleAlign;
	}

	if ( Object.keys( style ).length ) {
		headingAttributes.style = style;
	}

	return headingAttributes;
}

export function createLegacyTitleHeadingBlock( attributes = {} ) {
	return createBlock( 'core/heading', getLegacyTitleHeadingAttributes( attributes ) );
}
