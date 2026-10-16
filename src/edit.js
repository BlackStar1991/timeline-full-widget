import {
	useBlockProps,
	InnerBlocks,
	InspectorControls,
	PanelColorSettings,
} from '@wordpress/block-editor';
import { PanelBody, RangeControl, ToggleControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import {
	useEffect,
	useCallback,
	useRef,
	useLayoutEffect,
} from '@wordpress/element';

import { convertMarginAttrToStyle } from './item/utils';
import { getTimelineWrapperStyle } from './timeline-style';
import { getLegacyTemplateProps } from './block-template-compat';
import {
	ITEM_ATTRIBUTE_EXCLUSIONS,
	collectDescendantStyleUpdates,
	getInheritableAttributes,
} from './item/style-inheritance';
import { TIMELINE_TEMPLATE } from './timeline-template';
import { initTimelineAnimation } from '../assets/js/core/animation.js';


function haveDifferentAttributes( blockAttributes = {}, nextAttributes = {} ) {
	return Object.keys( nextAttributes ).some(
		( key ) =>
			JSON.stringify( blockAttributes?.[ key ] ) !==
			JSON.stringify( nextAttributes[ key ] )
	);
}

function hasTimelineItemAreas( block = {} ) {
	const childNames = new Set(
		( block.innerBlocks || [] ).map( ( childBlock ) => childBlock.name )
	);

	return (
		childNames.has( 'za/timeline-item-side' ) &&
		childNames.has( 'za/timeline-item-content' )
	);
}

export default function Edit( { attributes, setAttributes, clientId } ) {
	const {
		showMedia = true,
		direction = false,
		onTheOneSide,
		lineColor,
		lineWidth = 4,
		markerSize = 30,
		markerColor,
		showOtherSide,
		animationTimeline,
		animationLineColor,
		showMarker,
		animationMarker,
		markerUnique,
		showStepNumbers,
		animationMarkerColor,
		animationOtherSideSticky,
	} = attributes;

	const hasAnimatedMarkers =
		showMarker && animationTimeline && animationMarker;

	const wrapperRef = useRef( null );
	const { updateBlockAttributes } = useDispatch( 'core/block-editor' );

	const innerBlocks = useSelect(
		( select ) => select( 'core/block-editor' ).getBlocks( clientId ) || [],
		[ clientId ]
	);

	const timelineItemBlocks = innerBlocks.filter(
		( block ) => block.name === 'za/timeline-item'
	);
	const knownTimelineItemClientIdsRef = useRef( null );
	const pendingInitialStyleInheritanceRef = useRef( new Map() );

	const syncToChildren = useCallback(
		( attrs = {} ) => {
			if ( ! innerBlocks.length ) {
				return;
			}

			const parentDirection = attrs.direction ?? direction;
			const parentOneSide = attrs.onTheOneSide ?? onTheOneSide;

			innerBlocks.forEach( ( block, index ) => {
				const updates = { ...attrs };

				if ( parentOneSide ) {
					updates.position = parentDirection
						? 'timeline-inverted'
						: 'timeline-left';
				} else {
					const isEven = index % 2 === 0;
					updates.position = parentDirection
						? isEven
							? 'timeline-inverted'
							: 'timeline-left'
						: isEven
						? 'timeline-left'
						: 'timeline-inverted';
				}

				const needsUpdate = Object.keys( updates ).some(
					( key ) => block.attributes?.[ key ] !== updates[ key ]
				);

				if ( needsUpdate ) {
					updateBlockAttributes( block.clientId, updates );
				}
			} );
		},
		[ innerBlocks, updateBlockAttributes, direction, onTheOneSide ]
	);

	useLayoutEffect( () => {
		syncToChildren( {
			showOtherSide,
			showMedia,
			lineColor,
			lineWidth,
			markerColor,
			markerSize,
			direction,
			onTheOneSide,
			animationTimeline,
			animationLineColor,
			showMarker,
			markerUnique,
			showStepNumbers,
			animationMarker,
			animationMarkerColor,
			animationOtherSideSticky,
		} );
	}, [
		showOtherSide,
		showMedia,
		lineColor,
		lineWidth,
		markerColor,
		markerSize,
		direction,
		onTheOneSide,
		animationTimeline,
		animationLineColor,
		showMarker,
		markerUnique,
		showStepNumbers,
		animationMarker,
		animationMarkerColor,
		animationOtherSideSticky,
		syncToChildren,
	] );



	useLayoutEffect( () => {
		const itemClientIds = timelineItemBlocks.map(
			( block ) => block.clientId
		);

		if ( knownTimelineItemClientIdsRef.current === null ) {
			knownTimelineItemClientIdsRef.current = itemClientIds;
			return;
		}

		const knownClientIds = new Set(
			knownTimelineItemClientIdsRef.current
		);

		timelineItemBlocks.forEach( ( block, index ) => {
			if ( knownClientIds.has( block.clientId ) || index < 1 ) {
				return;
			}

			const previousItem = timelineItemBlocks[ index - 1 ];

			if ( previousItem ) {
				pendingInitialStyleInheritanceRef.current.set(
					block.clientId,
					previousItem.clientId
				);
			}
		} );

		knownTimelineItemClientIdsRef.current = itemClientIds;
	}, [ timelineItemBlocks ] );

	useLayoutEffect( () => {
		const pendingInheritance = pendingInitialStyleInheritanceRef.current;

		if ( ! pendingInheritance.size ) {
			return;
		}

		const itemBlocksByClientId = new Map(
			timelineItemBlocks.map( ( block ) => [ block.clientId, block ] )
		);

		pendingInheritance.forEach( ( sourceClientId, targetClientId ) => {
			const sourceBlock = itemBlocksByClientId.get( sourceClientId );
			const targetBlock = itemBlocksByClientId.get( targetClientId );

			if ( ! sourceBlock || ! targetBlock ) {
				pendingInheritance.delete( targetClientId );
				return;
			}

			const itemStyleAttributes = getInheritableAttributes(
				sourceBlock.attributes || {},
				ITEM_ATTRIBUTE_EXCLUSIONS
			);

			if (
				Object.keys( itemStyleAttributes ).length &&
				haveDifferentAttributes(
					targetBlock.attributes || {},
					itemStyleAttributes
				)
			) {
				updateBlockAttributes( targetClientId, itemStyleAttributes );
			}

			collectDescendantStyleUpdates( sourceBlock, targetBlock ).forEach(
				( { clientId: descendantClientId, attributes: descendantAttributes } ) => {
					updateBlockAttributes(
						descendantClientId,
						descendantAttributes
					);
				}
			);

			if ( hasTimelineItemAreas( targetBlock ) ) {
				pendingInheritance.delete( targetClientId );
			}
		} );
	}, [ timelineItemBlocks, updateBlockAttributes ] );

	// The visibility and color of markers belong to block attributes, not to
	// the animation lifecycle. In particular, adding an item must not reset
	// scroll progress by destroying/recreating the whole animation.
	useEffect( () => {
		if ( ! showMarker && animationMarker ) {
			setAttributes( { animationMarker: false } );
		}
	}, [ showMarker, animationMarker, setAttributes ] );

	useEffect( () => {
		if ( ! animationTimeline || ! wrapperRef.current ) {
			return undefined;
		}

		try {
			// React owns this particular wrapper; don't initialize every Timeline
			// in the document. InnerBlocks changes are handled by MutationObserver.
			return initTimelineAnimation( wrapperRef.current ) || undefined;
		} catch ( error ) {
			console.error( 'Timeline animation init failed', error );
			return undefined;
		}
	}, [ animationTimeline ] );

	const marginStyle = convertMarginAttrToStyle( attributes.style );
	const outerProps = useBlockProps( { style: marginStyle } );

	return (
		<div { ...outerProps }>
			<div
				className="timeline-wrapper"
				ref={ wrapperRef }
				style={ getTimelineWrapperStyle( attributes ) }
			>
				<InspectorControls>
					<PanelBody
						title={ __(
							'Timeline Settings',
							'timeline-full-widget'
						) }
					>
						{ [
							{
								label: __(
									'Show Media',
									'timeline-full-widget'
								),
								help: showMedia
									? __( 'On', 'timeline-full-widget' )
									: __( 'Off', 'timeline-full-widget' ),
								checked: showMedia,
								onChange: ( val ) =>
									setAttributes( { showMedia: val } ),
							},
							{
								label: __(
									'Timeline Direction',
									'timeline-full-widget'
								),
								help: direction
									? __( 'Right', 'timeline-full-widget' )
									: __( 'Left', 'timeline-full-widget' ),
								checked: direction,
								onChange: ( val ) =>
									setAttributes( { direction: val } ),
							},
							{
								label: __(
									'Single Side Layout',
									'timeline-full-widget'
								),
								help: onTheOneSide
									? __( 'Yes', 'timeline-full-widget' )
									: __( 'No', 'timeline-full-widget' ),
								checked: onTheOneSide,
								onChange: ( val ) =>
									setAttributes( { onTheOneSide: val } ),
							},
							{
								label: __(
									'Display Opposite Side',
									'timeline-full-widget'
								),
								help: showOtherSide
									? __( 'Yes', 'timeline-full-widget' )
									: __( 'No', 'timeline-full-widget' ),
								checked: showOtherSide,
								onChange: ( val ) =>
									setAttributes( { showOtherSide: val } ),
							},
							{
								label: __(
									'Animate Timeline Line',
									'timeline-full-widget'
								),
								help: animationTimeline
									? __( 'Yes', 'timeline-full-widget' )
									: __( 'No', 'timeline-full-widget' ),
								checked: animationTimeline,
								onChange: ( val ) =>
									setAttributes( { animationTimeline: val } ),
							},
							{
								label: __(
									'Show Timeline Marker',
									'timeline-full-widget'
								),
								help: showMarker
									? __( 'Yes', 'timeline-full-widget' )
									: __( 'No', 'timeline-full-widget' ),
								checked: showMarker,
								onChange: ( val ) =>
									setAttributes( { showMarker: val } ),
							},
							showOtherSide && {
								label: __(
									'Sticky Side Content',
									'timeline-full-widget'
								),
								help: animationOtherSideSticky
									? __( 'Yes', 'timeline-full-widget' )
									: __( 'No', 'timeline-full-widget' ),
								checked: animationOtherSideSticky,
								onChange: ( val ) =>
									setAttributes( {
										animationOtherSideSticky: val,
									} ),
							},
						]
							.filter( Boolean )
							.map( ( ctrl, i ) => (
								<ToggleControl
									key={ i }
									{ ...ctrl }
									__nextHasNoMarginBottom
								/>
							) ) }

						<RangeControl
							label={ __( 'Line Width', 'timeline-full-widget' ) }
							help={ __(
								'Minimum value is 1px.',
								'timeline-full-widget'
							) }
							value={ lineWidth }
							onChange={ ( value ) =>
								setAttributes( {
									lineWidth: Math.max(
										1,
										Number( value ) || 4
									),
								} )
							}
							min={ 1 }
							max={ 20 }
							step={ 1 }
							__nextHasNoMarginBottom
						/>

						<RangeControl
							label={ __(
								'Marker Size',
								'timeline-full-widget'
							) }
							help={ __(
								'Minimum value is 2px.',
								'timeline-full-widget'
							) }
							value={ markerSize }
							onChange={ ( value ) =>
								setAttributes( {
									markerSize: Math.max(
										1,
										Number( value ) || 30
									),
								} )
							}
							min={ 2 }
							max={ 80 }
							step={ 1 }
							__nextHasNoMarginBottom
						/>

						<PanelColorSettings
							title={ __(
								'Timeline Colors',
								'timeline-full-widget'
							) }
							colorSettings={ [
								{
									value: lineColor,
									onChange: ( color ) =>
										setAttributes( { lineColor: color } ),
									label: __(
										'Line Color',
										'timeline-full-widget'
									),
								},
								showMarker && ! markerUnique
									? {
											value: markerColor,
											onChange: ( color ) =>
												setAttributes( {
													markerColor: color,
												} ),
											label: __(
												'Marker Color',
												'timeline-full-widget'
											),
									  }
									: null,
							].filter( Boolean ) }
						/>

						{ animationTimeline && (
							<PanelColorSettings
								title={ __(
									'Timeline Animation Colors',
									'timeline-full-widget'
								) }
								colorSettings={ [
									{
										value: animationLineColor,
										onChange: ( color ) =>
											setAttributes( {
												animationLineColor: color,
											} ),
										label: __(
											'Animation Line Color',
											'timeline-full-widget'
										),
									},
									showMarker &&
									animationMarker &&
									! markerUnique
										? {
												value: animationMarkerColor,
												onChange: ( color ) =>
													setAttributes( {
														animationMarkerColor:
															color,
													} ),
												label: __(
													'Animation Marker Color',
													'timeline-full-widget'
												),
										  }
										: null,
								].filter( Boolean ) }
							/>
						) }
					</PanelBody>
					{ showMarker && (
						<PanelBody
							title={ __(
								'Marker Settings',
								'timeline-full-widget'
							) }
						>
							{ [
								{
									label: __(
										'Sticky timeline markers',
										'timeline-full-widget'
									),
									help: animationMarker
										? __( 'Yes', 'timeline-full-widget' )
										: __( 'No', 'timeline-full-widget' ),
									checked: animationMarker,
									onChange: ( val ) =>
										setAttributes( {
											animationMarker: val,
										} ),
								},
								{
									label: __(
										'Use custom marker',
										'timeline-full-widget'
									),
									help: markerUnique
										? __( 'Yes', 'timeline-full-widget' )
										: __( 'No', 'timeline-full-widget' ),
									checked: markerUnique,
									onChange: ( val ) =>
										setAttributes( {
											markerUnique: val,
										} ),
								},
								{
									label: __(
										'Show step numbers',
										'timeline-full-widget'
									),
									help: showStepNumbers
										? __( 'Yes', 'timeline-full-widget' )
										: __( 'No', 'timeline-full-widget' ),
									checked: showStepNumbers,
									onChange: ( val ) =>
										setAttributes( {
											showStepNumbers: val,
										} ),
								},
							]
								.filter( Boolean )
								.map( ( ctrl, i ) => (
									<ToggleControl
										key={ i }
										{ ...ctrl }
										__nextHasNoMarginBottom
									/>
								) ) }
						</PanelBody>
					) }
				</InspectorControls>

				{ animationTimeline && (
					<div className="timeline-line-animation" />
				) }

				<ul
					className={ [
						'timeline',
						hasAnimatedMarkers && 'timeline-animation-marker',
						animationOtherSideSticky &&
							'timeline-animation-other-side-sticky',
						showStepNumbers && 'timeline-numbers',
					]
						.filter( Boolean )
						.join( ' ' ) }
				>
					<InnerBlocks
						allowedBlocks={ [ 'za/timeline-item' ] }
						{ ...getLegacyTemplateProps( TIMELINE_TEMPLATE ) }
						templateLock={ false }
						renderAppender={ InnerBlocks.ButtonBlockAppender }
					/>
				</ul>
			</div>
		</div>
	);
}
