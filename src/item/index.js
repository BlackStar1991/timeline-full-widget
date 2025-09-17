import { registerBlockType } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';
import Edit from './edit';
import Save from './save';

registerBlockType( 'za/timeline-item', {
	title: __( 'Timeline Item', 'za' ),
	description: __( 'Timeline Item Description', 'za' ),
	icon: 'universal-access',
	parent: [ 'za/timeline-full-widget' ],
	supports: {
		html: false,
		reusable: false,
		spacing: {
			margin: true,
		},
	},
	attributes: {
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
			type: 'string',
			default: '',
		},
		titleFontWeight: {
			type: 'string',
			default: '',
		},
		titleAlign: {
			type: 'string',
			default: 'left',
		},
		titleMarginTop: {
			type: 'number',
			default: 0,
		},
		titleMarginBottom: {
			type: 'number',
			default: 0,
		},

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
		position: {
			type: 'string',
			default: 'timeline-left',
		},
		onTheOneSide: {
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
	},
	edit: Edit,
	save: Save,
} );
