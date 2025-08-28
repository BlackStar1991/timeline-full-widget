import { registerBlockType } from '@wordpress/blocks';

import './item';
import Edit from './edit';
import Save from './save';
import './style.css';

registerBlockType( 'za/timeline-full-widget', {
	title: 'Timeline',
	icon: 'schedule',
	category: 'widgets',

	edit: Edit,
	save: Save,
} );
