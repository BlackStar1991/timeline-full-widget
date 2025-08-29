import { registerBlockType } from '@wordpress/blocks';

import './item';
import Edit from './edit';
import Save from './save';

import './../assets/elementor/style.css';
import './style.css';

// import './../assets/elementor/script.js';

registerBlockType( 'za/timeline-full-widget', {
	title: 'Timeline',
	icon: 'schedule',
	category: 'widgets',
	supports: {
		html: false,
		reusable: false,
	},
	edit: Edit,
	save: Save,
} );
