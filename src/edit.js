import {
	useBlockProps,
	InnerBlocks,
	InspectorControls,
} from '@wordpress/block-editor';
import { PanelBody, ToggleControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export default function Edit( { attributes, setAttributes } ) {
	const { direction } = attributes;

	const handleDirectionChange = ( newValue ) => {
		setAttributes( { direction: newValue } );
	};

	return (
		<div { ...useBlockProps() }>
			<InspectorControls>
				<PanelBody title={ __( 'Timeline Direction', 'za' ) }>
					<ToggleControl
						label={ __( 'Direction', 'za' ) }
						help={
							direction ? __( 'Right', 'za' ) : __( 'Left', 'za' )
						}
						checked={ direction }
						onChange={ handleDirectionChange }
                        __nextHasNoMarginBottom={true}
					/>
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
