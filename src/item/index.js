import { registerBlockType } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';
import Edit from './edit';
import Save from './save';

registerBlockType( 'za/timeline-item', {
	title: __( 'Timeline Item Title', 'za' ),
	description: __( 'Timeline Item Description', 'za' ),
	icon: 'universal-access',
	parent: [ 'za/timeline-full-widget' ],
	supports: {
		html: false,
		reusable: false,
		align: true,
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
		titleFontSize: { type: 'string', default: '' },
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
		linkUrl: { type: 'string', default: '' },
		linkTarget: { type: 'string', default: '' },
		rel: { type: 'string', default: '' },
		position: {
			type: 'string',
			default: 'timeline-left',
		},
		align: {
			type: 'string',
			default: '',
		},
		textAlignClass: {
			type: 'string',
			default: '',
		},
		showImages: {
			type: 'boolean',
			default: true,
		},
		imageUrl: {
			type: 'string',
			source: 'attribute',
			selector: '.timeline_pic img',
			attribute: 'src',
		},
		imageAlt: {
			type: 'string',
			source: 'attribute',
			selector: '.timeline_pic img',
			attribute: 'alt',
			default: '',
		},
		imageId: {
			type: 'number',
		},
	},
	edit: Edit,
	save: Save,
} );
