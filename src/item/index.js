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
	},
	spacing: {
		margin: { top: '0', bottom: '0' },
		units: [ 'px', 'em', 'rem', 'vh', 'vw', '%' ],
	},
	attributes: {
		title: {
			type: 'string',
			source: 'html',
			selector: '.tl-title',
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
		titleMarginTop: { type: 'string', default: '' },
		titleMarginBottom: { type: 'string', default: '' },

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
