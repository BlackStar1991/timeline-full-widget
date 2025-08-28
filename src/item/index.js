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
			selector: 'h3',
		},
		description: {
			type: 'string',
			source: 'html',
			selector: '.tl-desc',
		},
	},

    edit: Edit,
	save: Save,
} );
