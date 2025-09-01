import {
	useBlockProps,
	InnerBlocks,
	InspectorControls,
} from '@wordpress/block-editor';
import { PanelBody, ToggleControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { useEffect, useCallback } from '@wordpress/element';

export default function Edit( { attributes, setAttributes, clientId } ) {
	const { showImages = true, direction = false } = attributes;

	const { updateBlockAttributes } = useDispatch( 'core/block-editor' );

	const innerBlocks = useSelect(
		( select ) => select( 'core/block-editor' ).getBlocks( clientId ) || [],
		[ clientId ]
	);

	const syncToChildren = useCallback(
		( attrs ) => {
			if ( ! Array.isArray( innerBlocks ) || innerBlocks.length === 0 ) {
				return;
			}
			innerBlocks.forEach( ( block ) => {
				updateBlockAttributes( block.clientId, attrs );
			} );
		},
		[ innerBlocks, updateBlockAttributes ]
	);

	useEffect( () => {
		syncToChildren( { showImages } );
	}, [ showImages, syncToChildren ] );

	useEffect( () => {
		syncToChildren( { direction } );
	}, [ direction, syncToChildren ] );

	const handleDirectionChange = ( val ) => {
		setAttributes( { direction: val } );
		syncToChildren( { direction: val } );
	};

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
					/>
					<ToggleControl
						label={ __( 'Direction', 'za' ) }
						help={
							direction ? __( 'Right', 'za' ) : __( 'Left', 'za' )
						}
						checked={ direction }
						onChange={ handleDirectionChange }
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
								direction,
							},
						],
						[
							'za/timeline-item',
							{
								title: __( 'Timeline Item #2', 'za' ),
								showImages,
								direction,
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
