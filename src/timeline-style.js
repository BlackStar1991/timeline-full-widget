const DEFAULTS = {
	lineColor: '#F6F6F8',
	lineWidth: 4,
	markerColor: '#F6F6F8',
	markerSize: 30,
	animationLineColor: '#F37321',
	animationMarkerColor: '#F37321',
};

function getPositiveNumber( value, fallback ) {
	return Math.max( 1, Number( value ) || fallback );
}

export function getTimelineWrapperStyle( attributes = {} ) {
	const markerSize = getPositiveNumber(
		attributes.markerSize,
		DEFAULTS.markerSize
	);

	const style = {
		'--timeline-line-color': attributes.lineColor || DEFAULTS.lineColor,
		'--timeline-line-width': `${ getPositiveNumber(
			attributes.lineWidth,
			DEFAULTS.lineWidth
		) }px`,
		'--timeline-marker-color':
			attributes.markerColor || DEFAULTS.markerColor,
		'--timeline-line-active-color':
			attributes.animationLineColor || DEFAULTS.animationLineColor,
		'--timeline-marker-active-color':
			attributes.animationMarkerColor || DEFAULTS.animationMarkerColor,
	};

	if ( markerSize !== DEFAULTS.markerSize ) {
		style[ '--marker-size' ] = `${ markerSize }px`;
	}

	// Elementor widget-level background settings are portable only when
	// represented as a sanitized color or a local placeholder URL.
	const bgColor = attributes.timelineBackgroundColor || '';
	if ( /^(?:#[0-9a-f]{3,8}|rgba?\([0-9.,%\s]+\))$/i.test( bgColor ) ) {
		style.backgroundColor = bgColor;
	}
	const bgImage = attributes.timelineBackgroundImage || '';
	if ( /^(?:https?:\/\/[^\s"'()<>]+|\/[a-z0-9_/%+.\-]+)$/i.test( bgImage ) ) {
		style.backgroundImage = `url("${ bgImage }")`;
		style.backgroundSize = [ 'cover', 'contain', 'auto' ].includes( attributes.timelineBackgroundSize )
			? attributes.timelineBackgroundSize : 'cover';
		style.backgroundPosition = /^[a-z\s%0-9.-]+$/i.test( attributes.timelineBackgroundPosition || '' )
			? attributes.timelineBackgroundPosition : 'center center';
		style.backgroundRepeat = 'no-repeat';
	}
	return style;
}
