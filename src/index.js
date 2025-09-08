import { registerBlockType } from '@wordpress/blocks';

import './item';
import Edit from './edit';
import Save from './save';

import './../assets/elementor/style.css';
import './style.scss';
import './editor.scss';

registerBlockType( 'za/timeline-full-widget', {
	title: 'Timeline',
	icon: 'schedule',
	category: 'widgets',
	edit: Edit,
	save: Save,
} );
