import {
    InspectorControls,
    useBlockProps,
    InnerBlocks,
} from '@wordpress/block-editor';
import { PanelBody, TextControl } from '@wordpress/components';

import './editor.css';

export default function Edit( { attributes, setAttributes } ) {
	const blockProps = useBlockProps( { className: 'timeline-wrapper' } );

	return (
		<div { ...blockProps }>
			<InspectorControls>
				<PanelBody title="Style" initialOpen>
					<TextControl />
				</PanelBody>
			</InspectorControls>

			<div className="timeline-line-animation"></div>
			<ul className="timeline">
				<InnerBlocks
					allowedBlocks={ [ 'za/timeline-item' ] }
					templateLock={ false }
					renderAppender={ InnerBlocks.ButtonBlockAppender }
				/>
			</ul>
		</div>
	);
}
