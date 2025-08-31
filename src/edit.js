import {
	useBlockProps,
	InnerBlocks,
	InspectorControls,
} from '@wordpress/block-editor';
import { PanelBody, ToggleControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { useEffect } from '@wordpress/element';

export default function Edit( { attributes, setAttributes, clientId } ) {
	const { showImages } = attributes;
	const { updateBlockAttributes } = useDispatch( 'core/block-editor' );

	const innerBlocks = useSelect(
		( select ) => {
			return select( 'core/block-editor' ).getBlocks( clientId ) || [];
		},
		[ clientId ]
	);

	useEffect( () => {
		if ( ! Array.isArray( innerBlocks ) || innerBlocks.length === 0 ) {
			return;
		}

		innerBlocks.forEach( ( block ) => {
			updateBlockAttributes( block.clientId, { showImages } );
		} );
	}, [ showImages, innerBlocks ] );

	return (
		<div { ...useBlockProps() }>
			<InspectorControls>
				<PanelBody title={ __( 'Timeline Settings', 'za' ) }>
					<ToggleControl
						label={ __( 'Show Images', 'za' ) }
						help={
							showImages ? __( 'On', 'za' ) : __( 'Off', 'za' )
						}
						checked={ showImages }
						onChange={ ( val ) =>
							setAttributes( { showImages: val } )
						}
						__nextHasNoMarginBottom={ true }
					/>
				</PanelBody>
			</InspectorControls>

			<div className="timeline-line-animation" />
			<ul className="timeline">
				<InnerBlocks
					allowedBlocks={ [ 'za/timeline-item' ] }
					template={ [
						[
							'za/timeline-item',
							{
								title: __( 'Timeline Item #1', 'za' ),
								showImages,
							},
						],
						[
							'za/timeline-item',
							{
								title: __( 'Timeline Item #2', 'za' ),
								showImages,
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
