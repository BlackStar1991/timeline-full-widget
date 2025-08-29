import {
	InspectorControls,
	useBlockProps,
	InnerBlocks,
} from '@wordpress/block-editor';
import { PanelBody, TextControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

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
					template={ [
						[
							'za/timeline-item',
							{
								title: __( 'Timeline Item #1', 'za' ),
								description: __( 'Content for item #1', 'za' ),
							},
						],
						[
							'za/timeline-item',
							{
								title: __( 'Timeline Item #2', 'za' ),
								description: __( 'Content for item #2', 'za' ),
							},
						],
					] }
					templateLock={ false }
					renderAppender={ InnerBlocks.ButtonBlockAppender }
				/>
			</ul>
		</div>
	);
}
