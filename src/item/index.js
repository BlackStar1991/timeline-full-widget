// item/index.js
import { createBlock, registerBlockType } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';
import { Edit } from './edit';
import Save from './save';
import DeprecatedV2Save from './deprecated-v2-save';
import {
	CONTENT_AREA_BLOCK,
	SIDE_AREA_BLOCK,
	TIMELINE_ITEM_PARAGRAPH_TEMPLATE,
	pickAttributes,
	getContentAreaAttributes,
	getSideAreaAttributes,
} from './areas/config';
import {
	LEGACY_TITLE_ATTRIBUTES,
	createLegacyTitleHeadingBlock,
} from './legacy-title-migration';
import './areas';

function createEmptyParagraphBlock() {
	return createBlock(
		TIMELINE_ITEM_PARAGRAPH_TEMPLATE[ 0 ],
		TIMELINE_ITEM_PARAGRAPH_TEMPLATE[ 1 ]
	);
}

function getDefaultContentInnerBlocks( attributes = {} ) {
	return [ createLegacyTitleHeadingBlock( attributes ), createEmptyParagraphBlock() ];
}

const timelineItemAttributes = {
	descriptionColor: {
		type: 'string',
		default: '',
	},
	itemBackgroundColor: {
		type: 'string',
		default: '',
	},
	linkUrl: {
		type: 'string',
		default: '',
	},
	linkTarget: {
		type: 'string',
		default: '',
	},
	rel: {
		type: 'string',
		default: '',
	},
	mediaLinkUrl: {
		type: 'string',
		default: '',
	},
	mediaLinkTarget: {
		type: 'string',
		default: '',
	},
	mediaLinkRel: {
		type: 'string',
		default: '',
	},
	isMediaWrapToLink: {
		type: 'boolean',
		default: false,
	},
	position: {
		type: 'string',
		default: 'timeline-left',
	},
	onTheOneSide: {
		type: 'boolean',
		default: false,
	},
	horizontalContentLayout: {
		type: 'boolean',
		default: false,
	},
	reverseMediaContent: {
		type: 'boolean',
		default: false,
	},
	showMedia: {
		type: 'boolean',
		default: true,
	},
	mediaUrl: { type: 'string', default: '' },
	videoPoster: {
		type: 'string',
		source: 'attribute',
		selector: '.timeline_pic video',
		attribute: 'poster',
		default: '',
	},
	imageAlt: {
		type: 'string',
		source: 'attribute',
		selector: '.timeline_pic img',
		attribute: 'alt',
		default: '',
	},
	mediaWidth: {
		type: 'string',
		default: '',
	},
	mediaId: {
		type: 'number',
	},
	mediaType: { type: 'string', default: '' },
	mediaMime: { type: 'string', default: '' },
	showOtherSide: {
		type: 'boolean',
		default: true,
	},
	otherSiteTitle: {
		type: 'string',
		selector: '.timeline-side p',
		default: '',
	},
	sideTextAlign: {
		type: 'string',
		default: 'left',
	},
	showMarker: {
		type: 'boolean',
		default: true,
	},
	markerUnique: {
		type: 'boolean',
		default: false,
	},
	markerUrl: { type: 'string', default: '' },
	markerId: { type: 'number' },
	markerAlt: { type: 'string', default: '' },
};

const deprecatedTimelineItemAttributes = {
	...LEGACY_TITLE_ATTRIBUTES,
	...timelineItemAttributes,
};


function getCurrentTimelineItemAttributes( attributes = {} ) {
	return pickAttributes( attributes, Object.keys( timelineItemAttributes ) );
}

registerBlockType( 'za/timeline-item', {
	apiVersion: 3,
	title: __( 'Timeline Item', 'timeline-full-widget' ),
	description: __( 'Timeline item description', 'timeline-full-widget' ),
	icon: 'universal-access',
	parent: [ 'za/timeline-full-widget' ],
	supports: {
		html: false,
		reusable: false,
		spacing: {
			margin: true,
		},
		color: {
			text: true,
			background: true,
			link: true,
		},
		typography: {
			fontSize: true,
			lineHeight: true,
		},
	},
	attributes: timelineItemAttributes,
	edit: Edit,
	save: Save,
	deprecated: [
		{
			attributes: deprecatedTimelineItemAttributes,
			save: DeprecatedV2Save,
			migrate: ( attributes, innerBlocks ) => [
				attributes,
				[
					createBlock(
						SIDE_AREA_BLOCK,
						getSideAreaAttributes( attributes ),
						attributes.otherSiteTitle
							? [
								createBlock( 'core/paragraph', {
									content: attributes.otherSiteTitle,
								} ),
							  ]
							: []
					),
					createBlock(
						CONTENT_AREA_BLOCK,
						getContentAreaAttributes( attributes ),
						innerBlocks.length
							? [ createLegacyTitleHeadingBlock( attributes ), ...innerBlocks ]
							: getDefaultContentInnerBlocks( attributes )
					),
				],
			],
		},
	],
} );
