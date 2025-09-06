import {
	useBlockProps,
	InnerBlocks,
	InspectorControls,
	PanelColorSettings,
} from '@wordpress/block-editor';
import { PanelBody, ToggleControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { useEffect, useCallback } from '@wordpress/element';

export default function Edit( { attributes, setAttributes, clientId } ) {
	const {
		showImages = true,
		direction = false,
		onTheOneSide,
		lineColor,
		showOtherSide,
	} = attributes;

	const { updateBlockAttributes } = useDispatch( 'core/block-editor' );

	const innerBlocks = useSelect(
		( select ) => select( 'core/block-editor' ).getBlocks( clientId ) || [],
		[ clientId ]
	);

	const syncToChildren = useCallback(
		( attrs = {} ) => {
			if ( ! Array.isArray( innerBlocks ) || innerBlocks.length === 0 )
				return;

			const parentDirection =
				typeof attrs.direction !== 'undefined'
					? attrs.direction
					: direction;
			const parentOneSide =
				typeof attrs.onTheOneSide !== 'undefined'
					? attrs.onTheOneSide
					: onTheOneSide;

			innerBlocks.forEach( ( block, index ) => {
				const updates = { ...attrs };

				if ( parentOneSide ) {
					updates.position = parentDirection
						? 'timeline-inverted'
						: 'timeline-left';
				} else {
					updates.position = parentDirection
						? index % 2 === 0
							? 'timeline-inverted'
							: 'timeline-left'
						: index % 2 === 0
						? 'timeline-left'
						: 'timeline-inverted';
				}

				updateBlockAttributes( block.clientId, updates );
			} );
		},
		[ innerBlocks, updateBlockAttributes, direction, onTheOneSide ]
	);
	useEffect( () => {
		syncToChildren( { showOtherSide } );
	}, [ showOtherSide, syncToChildren ] );

	useEffect( () => {
		syncToChildren( { showImages, lineColor } );
	}, [ showImages, lineColor, syncToChildren ] );

	useEffect( () => {
		syncToChildren( { direction, onTheOneSide } );
	}, [ direction, onTheOneSide, syncToChildren ] );

	const handleDirectionChange = ( val ) => {
		setAttributes( { direction: val } );
		syncToChildren( { direction: val } );
	};

	const handlePositionChange = ( val ) => {
		setAttributes( { onTheOneSide: val } );
		syncToChildren( { onTheOneSide: val } );
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
						__nextHasNoMarginBottom={ true }
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
					<ToggleControl
						label={ __( 'Single Side Layout', 'za' ) }
						help={
							onTheOneSide ? __( 'Yes', 'za' ) : __( 'No', 'za' )
						}
						checked={ onTheOneSide }
						onChange={ handlePositionChange }
						__nextHasNoMarginBottom={ true }
					/>

					<ToggleControl
						label={ __( 'Show other side', 'za' ) }
						help={
							showOtherSide ? __( 'Yes', 'za' ) : __( 'No', 'za' )
						}
						checked={ showOtherSide }
						onChange={ ( val ) =>
							setAttributes( { showOtherSide: val } )
						}
						__nextHasNoMarginBottom={ true }
					/>
					<PanelColorSettings
						title="Timeline colors"
						colorSettings={ [
							{
								value: lineColor,
								onChange: ( color ) =>
									setAttributes( { lineColor: color } ),
								label: 'Line & circle color',
							},
						] }
					/>
				</PanelBody>
			</InspectorControls>

			<div className="timeline-line-animation" />
			<ul
				className="timeline"
				style={ { '--timeline-color': lineColor || '#F6F6F8' } }
			>
				<InnerBlocks
					allowedBlocks={ [ 'za/timeline-item' ] }
					template={ [
						[
							'za/timeline-item',
							{
								title: __( 'Timeline Item #1', 'za' ),
								showImages,
								direction,
								showOtherSide,
							},
						],
						[
							'za/timeline-item',
							{
								title: __( 'Timeline Item #2', 'za' ),
								showImages,
								direction,
								showOtherSide,
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
