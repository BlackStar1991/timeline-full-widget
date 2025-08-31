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
		linkUrl: { type: 'string', default: '' },
		linkTarget: { type: 'string', default: '' },
		rel: { type: 'string', default: '' },
		position: {
			type: 'string',
			default: 'timeline-left',
		},
		align: {
			type: 'string',
			source: 'attribute',
			default: 'left',
		},
		image_url: {
			type: 'string',
			source: 'attribute',
			selector: 'img',
			attribute: 'src',
		},
		image_alt: {
			type: 'string',
			source: 'attribute',
			selector: 'img',
			attribute: 'alt',
			default: '',
		},
		image_id: {
			type: 'number',
		},
	},
	edit: Edit,
	save: Save,
} );
