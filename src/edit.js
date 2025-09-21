import {
	useBlockProps,
	InnerBlocks,
	InspectorControls,
	PanelColorSettings,
} from '@wordpress/block-editor';
import { PanelBody, ToggleControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import {
	useEffect,
	useCallback,
	useRef,
	useLayoutEffect,
} from '@wordpress/element';

import { convertMarginAttrToStyle } from './item/utils';
import { initTimelineAnimation, initAllWidgets } from '../assets/js/core/animation.js';

export default function Edit( { attributes, setAttributes, clientId } ) {
	const {
		showMedia = true,
		direction = false,
		onTheOneSide,
		lineColor,
		showOtherSide,
		animationTimeline,
		animationTimelineColor,
		animationMarker,
	} = attributes;

	const wrapperRef = useRef( null );
	const { updateBlockAttributes } = useDispatch( 'core/block-editor' );

	const innerBlocks = useSelect(
		( select ) => select( 'core/block-editor' ).getBlocks( clientId ) || [],
		[ clientId ]
	);

	const syncToChildren = useCallback(
		( attrs = {} ) => {
			if ( ! innerBlocks.length ) return;

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
			direction,
			onTheOneSide,
			animationTimeline,
			animationTimelineColor,
			animationMarker,
		} );
	}, [
		showOtherSide,
		showMedia,
		lineColor,
		direction,
		onTheOneSide,
		animationTimeline,
		animationTimelineColor,
		animationMarker,
		syncToChildren,
	] );

    useEffect(() => {
        if ( ! animationTimeline || ! wrapperRef.current ) return;

        let destroyFn;

        try {
            const el = wrapperRef.current;
            if ( typeof initTimelineAnimation === 'function' ) {
                destroyFn = initTimelineAnimation( el );
            } else if ( typeof initAllWidgets === 'function' ) {
                destroyFn = initAllWidgets( el );
            }
        } catch ( err ) {
            console.error( 'Timeline animation init failed', err );
        }

        return () => {
            if ( typeof destroyFn === 'function' ) destroyFn();
        };
    }, [ animationTimeline, innerBlocks.length ] );





    const outerProps = useBlockProps();
    const marginStyle = convertMarginAttrToStyle( attributes.style );
    const mergedOuterStyle = {
        ...( outerProps.style || {} ),
        ...marginStyle,
    };

	return (

        <div {...outerProps} style={ mergedOuterStyle }>
            <div className="timeline-wrapper" ref={ wrapperRef }
                 style={{
                     '--timeline-color': lineColor || '#F6F6F8',
                     '--timeline-color-animation': animationTimelineColor || '#F37321',
                 }}>
				<InspectorControls>
					<PanelBody title={ __( 'Timeline Settings', 'za' ) }>
						{ [
							{
								label: __( 'Show Images', 'za' ),
								help: showMedia
									? __( 'On', 'za' )
									: __( 'Off', 'za' ),
								checked: showMedia,
								onChange: ( val ) =>
									setAttributes( { showMedia: val } ),
							},
							{
								label: __( 'Direction', 'za' ),
								help: direction
									? __( 'Right', 'za' )
									: __( 'Left', 'za' ),
								checked: direction,
								onChange: ( val ) =>
									setAttributes( { direction: val } ),
							},
							{
								label: __( 'Single Side Layout', 'za' ),
								help: onTheOneSide
									? __( 'Yes', 'za' )
									: __( 'No', 'za' ),
								checked: onTheOneSide,
								onChange: ( val ) =>
									setAttributes( { onTheOneSide: val } ),
							},
							{
								label: __( 'Show other side', 'za' ),
								help: showOtherSide
									? __( 'Yes', 'za' )
									: __( 'No', 'za' ),
								checked: showOtherSide,
								onChange: ( val ) =>
									setAttributes( { showOtherSide: val } ),
							},
							{
								label: __( 'Enable Line Animation', 'za' ),
								help: animationTimeline
									? __( 'Yes', 'za' )
									: __( 'No', 'za' ),
								checked: animationTimeline,
								onChange: ( val ) =>
									setAttributes( { animationTimeline: val } ),
							},
							{
								label: __( 'Enable Animation Marker', 'za' ),
								help: animationMarker
									? __( 'Yes', 'za' )
									: __( 'No', 'za' ),
								checked: animationMarker,
								onChange: ( val ) =>
									setAttributes( { animationMarker: val } ),
							},
						].map( ( ctrl, i ) => (
							<ToggleControl
								key={ i }
								{ ...ctrl }
								__nextHasNoMarginBottom
							/>
						) ) }

						<PanelColorSettings
							title={ __( 'Timeline color', 'za' ) }
							colorSettings={ [
								{
									value: lineColor,
									onChange: ( color ) =>
										setAttributes( { lineColor: color } ),
									label: __( 'Line & mark color', 'za' ),
								},
							] }
						/>
						{ animationTimeline && (
							<PanelColorSettings
								title={ __( 'Timeline Animation Color', 'za' ) }
								colorSettings={ [
									{
										value: animationTimelineColor,
										onChange: ( color ) =>
											setAttributes( {
												animationTimelineColor: color,
											} ),
										label: __( 'Animation Color', 'za' ),
									},
								] }
							/>
						) }
					</PanelBody>
				</InspectorControls>

				{ animationTimeline && (
					<div className="timeline-line-animation" />
				) }

				<ul
					className={
						animationMarker
							? 'timeline-animation-marker timeline'
							: 'timeline'
					}
				>
					<InnerBlocks
						allowedBlocks={ [ 'za/timeline-item' ] }
						template={ [
							[
								'za/timeline-item',
								{
									title: __( 'Timeline Item #1', 'za' ),
									showMedia,
									direction,
									showOtherSide,
								},
							],
							[
								'za/timeline-item',
								{
									title: __( 'Timeline Item #2', 'za' ),
									showMedia,
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
		</div>
	);
}
