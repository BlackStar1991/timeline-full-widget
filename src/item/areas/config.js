import { __ } from '@wordpress/i18n';

export const SIDE_AREA_BLOCK = 'za/timeline-item-side';
export const CONTENT_AREA_BLOCK = 'za/timeline-item-content';

export const DEFAULT_TIMELINE_ITEM_TITLE = __(
	'Timeline Item',
	'timeline-full-widget'
);
export const TIMELINE_ITEM_TITLE_TEMPLATE = [
	'core/heading',
	{
		level: 3,
		content: DEFAULT_TIMELINE_ITEM_TITLE,
		className: 'tl-title',
	},
];

export const TIMELINE_ITEM_PARAGRAPH_TEMPLATE = [
	'core/paragraph',
	{
		placeholder: __( 'Add content', 'timeline-full-widget' ),
	},
];

export const TIMELINE_ITEM_AREA_BLOCKS = [
	SIDE_AREA_BLOCK,
	CONTENT_AREA_BLOCK,
];

export const CONTENT_AREA_TEMPLATE = [
	TIMELINE_ITEM_TITLE_TEMPLATE,
	TIMELINE_ITEM_PARAGRAPH_TEMPLATE,
];

export const TIMELINE_ITEM_AREA_TEMPLATE = [
	[ SIDE_AREA_BLOCK ],
	[ CONTENT_AREA_BLOCK, {}, CONTENT_AREA_TEMPLATE ],
];

export const SIDE_AREA_ATTRIBUTE_NAMES = [ 'showOtherSide', 'sideTextAlign' ];

export const CONTENT_AREA_ATTRIBUTE_NAMES = [
	'descriptionColor',
	'itemBackgroundColor',
	'linkUrl',
	'linkTarget',
	'rel',
	'mediaLinkUrl',
	'mediaLinkTarget',
	'mediaLinkRel',
	'isMediaWrapToLink',
	'showMedia',
	'mediaUrl',
	'videoPoster',
	'imageAlt',
	'mediaWidth',
	'mediaId',
	'mediaType',
	'mediaMime',
	'horizontalContentLayout',
	'reverseMediaContent',
];

export function pickAttributes( attributes = {}, attributeNames = [] ) {
	return attributeNames.reduce( ( picked, name ) => {
		if ( Object.prototype.hasOwnProperty.call( attributes, name ) ) {
			picked[ name ] = attributes[ name ];
		}

		return picked;
	}, {} );
}

export function getSideAreaAttributes( attributes = {} ) {
	return pickAttributes( attributes, SIDE_AREA_ATTRIBUTE_NAMES );
}

export function getContentAreaAttributes( attributes = {} ) {
	return pickAttributes( attributes, CONTENT_AREA_ATTRIBUTE_NAMES );
}

export function shallowEqualAttributes( left = {}, right = {} ) {
	const keys = Array.from(
		new Set( [ ...Object.keys( left ), ...Object.keys( right ) ] )
	);

	return keys.every( ( key ) => {
		const leftValue = left[ key ];
		const rightValue = right[ key ];

		if ( leftValue === rightValue ) {
			return true;
		}

		return JSON.stringify( leftValue ) === JSON.stringify( rightValue );
	} );
}
