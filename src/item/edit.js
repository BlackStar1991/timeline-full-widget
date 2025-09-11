import {
	useBlockProps,
	RichText,
	InspectorControls,
	BlockControls,
	MediaPlaceholder,
	MediaReplaceFlow,
	InnerBlocks,
	LinkControl,
	PanelColorSettings,
	FontSizePicker,
    AlignmentToolbar,
} from '@wordpress/block-editor';
import {
	getSafeLinkAttributes,
	parseStyleString,
	buildStyleObject,
} from './utils';
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import {
	PanelBody,
	SelectControl,
	ToolbarGroup,
	ToolbarButton,
	Popover,
	Spinner,
	TextControl,
	RangeControl,
} from '@wordpress/components';
import { isBlobURL } from '@wordpress/blob';
import { useState, useEffect, useMemo, useCallback } from '@wordpress/element';
import { link as linkIcon } from '@wordpress/icons';

export default function Edit( { clientId, attributes, setAttributes } ) {
	const {
        titleAlign,
		title,
		titleTag,
		descriptionColor,
		itemBackgroundColor,
		linkUrl,
		linkTarget,
		rel,
		showImages,
		imageUrl,
		imageAlt,
		imageId,
		onTheOneSide,
		titleInlineStyle,
		titleFontSize,
        titleFontWeight,
		titleMarginTop,
		titleMarginBottom,
		titleColor,
        showOtherSide,
        otherSiteTitle,
        sideTextAlign,
	} = attributes;

	const [ isLinkPickerOpen, setIsLinkPickerOpen ] = useState( false );

	// Combine selects into one to avoid multiple selectors and reduce re-renders
	const { blockIndex, parentDirection } = useSelect(
		( select ) => {
			const editor = select( 'core/block-editor' );
			const parentId = editor.getBlockRootClientId( clientId );
			if ( ! parentId )
				return { blockIndex: 0, parentDirection: undefined };

			const innerBlocks = editor.getBlocks( parentId );
			const idx = innerBlocks.findIndex(
				( b ) => b.clientId === clientId
			);
			const parent = editor.getBlock( parentId );
			return {
				blockIndex: idx,
				parentDirection: parent?.attributes?.direction,
			};
		},
		[ clientId ]
	);

	// Use parent's direction if available, otherwise local attribute (backwards compatible)
	const direction =
		typeof parentDirection !== 'undefined'
			? parentDirection
			: attributes.direction;

	// Fallback position computed from direction + index
	const computedFallbackPosition = useMemo( () => {
		return direction
			? blockIndex % 2 === 0
				? 'timeline-inverted'
				: 'timeline-left'
			: blockIndex % 2 === 0
			? 'timeline-left'
			: 'timeline-inverted';
	}, [ direction, blockIndex ] );

	// final li class (prefer stored attribute position if present)
	const liClass = attributes.position || computedFallbackPosition;

	// ensure attributes.position (and parsed inline style) get set once when needed
	useEffect( () => {
		const updates = {};

		// determine what position *should* be according to parent-level flags
		const computedPosition = onTheOneSide
			? direction
				? 'timeline-inverted'
				: 'timeline-left'
			: computedFallbackPosition;

		if ( attributes.position !== computedPosition ) {
			updates.position = computedPosition;
		}

		// parse inline style once and map to separate attributes (if they aren't present)
		const parsed = parseStyleString( titleInlineStyle || '' );

		if ( parsed.fontSize && ! titleFontSize ) {
			const m = parsed.fontSize.match( /^([\d.]+)(px|rem|em|%)?$/ );
			updates.titleFontSize = m ? m[ 1 ] : parsed.fontSize;
		}
        if ( parsed.fontWeight && ! titleFontWeight ) {
            updates.titleFontWeight = parsed.fontWeight;
        }

		if ( parsed.marginTop && ! titleMarginTop ) {
			updates.titleMarginTop = parsed.marginTop.replace( /px$/, '' );
		}
		if ( parsed.marginBottom && ! titleMarginBottom ) {
			updates.titleMarginBottom = parsed.marginBottom.replace(
				/px$/,
				''
			);
		}
		if ( parsed.color && ! titleColor ) {
			updates.titleColor = parsed.color;
		}

		if ( Object.keys( updates ).length ) {
			setAttributes( updates );
		}
		// Only run when important inputs change
	}, [
		blockIndex,
		direction,
		onTheOneSide,
		attributes.position,
		titleInlineStyle,
		titleFontSize,
        titleFontWeight,
		titleMarginTop,
		titleMarginBottom,
		titleColor,
		setAttributes,
	] );

	// Memoize computed editor class name
	const editorClassName = useMemo( () => {
		const classes = [ liClass, 'timeline-item' ];
		return Array.from( new Set( classes ) ).join( ' ' );
	}, [ liClass ] );

	const blockProps = useBlockProps( {
		tagName: 'li',
		className: editorClassName,
	} );

	const onSelect = useCallback(
		( media ) => {
			setAttributes( {
				imageUrl: media.url,
				imageAlt: media.alt,
				imageId: media.id,
			} );
		},
		[ setAttributes ]
	);

	const linkProps = useMemo(
		() => getSafeLinkAttributes( linkUrl, rel, linkTarget ),
		[ linkUrl, rel, linkTarget ]
	);

	// title style object (memoized)
	const titleStyle = useMemo(
		() =>
			buildStyleObject( {
				titleInlineStyle,
				titleFontSize,
                titleFontWeight,
				titleMarginTop,
				titleMarginBottom,
				titleColor,
			} ),
		[
			titleInlineStyle,
			titleFontSize,
            titleFontWeight,
			titleMarginTop,
			titleMarginBottom,
			titleColor,
		]
	);
    const [ activeField, setActiveField ] = useState(null);

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Title Settings', 'za' ) }>
					<SelectControl
						label={ __( 'Title Tag', 'za' ) }
						value={ titleTag }
						options={ [
							{ label: 'H1', value: 'h1' },
							{ label: 'H2', value: 'h2' },
							{ label: 'H3', value: 'h3' },
							{ label: 'H4', value: 'h4' },
							{ label: 'H5', value: 'h5' },
							{ label: 'H6', value: 'h6' },
							{ label: 'Paragraph', value: 'p' },
							{ label: 'Div', value: 'div' },
							{ label: 'Span', value: 'span' },
							{ label: 'Link (a)', value: 'a' },
						] }
						onChange={ ( val ) =>
							setAttributes( { titleTag: val } )
						}
						__nextHasNoMarginBottom={ true }
						__next40pxDefaultSize={ true }
					/>

					<PanelColorSettings
						title={ __( 'Color settings', 'za' ) }
						colorSettings={ [
							{
								value: titleColor,
								onChange: ( color ) =>
									setAttributes( { titleColor: color } ),
								label: __( 'Title color', 'za' ),
							},
							{
								value: descriptionColor,
								onChange: ( color ) =>
									setAttributes( {
										descriptionColor: color,
									} ),
								label: __( 'Description color', 'za' ),
							},
							{
								value: itemBackgroundColor,
								onChange: ( color ) =>
									setAttributes( {
										itemBackgroundColor: color,
									} ),
								label: __( 'Item background color', 'za' ),
							},
						] }
					/>
				</PanelBody>

				{ showImages && imageUrl && ! isBlobURL( imageUrl ) && (
					<PanelBody title={ __( 'Image Settings', 'za' ) }>
						<TextControl
							label={ __( 'Image Alt', 'za' ) }
							value={ imageAlt }
							help={ __( 'Add alt text for the image.', 'za' ) }
							onChange={ ( val ) =>
								setAttributes( { imageAlt: val } )
							}
							__next40pxDefaultSize={ true }
							__nextHasNoMarginBottom={ true }
						/>
					</PanelBody>
				) }

				<PanelBody
					title={ __( 'Typography', 'za' ) }
					initialOpen={ true }
				>
					<FontSizePicker
						__next40pxDefaultSize
						fontSizes={ [
							{ name: 'Small', size: 12, slug: 'small' },
							{ name: 'Normal', size: 16, slug: 'normal' },
							{ name: 'Big', size: 26, slug: 'big' },
						] }
						value={
							titleFontSize
								? parseFloat( titleFontSize )
								: undefined
						}
						onChange={ ( newSize ) => {
							if ( newSize === undefined ) {
								setAttributes( {
									titleFontSize: '22',
									titleFontUnit: 'px',
								} );
								return;
							}
							setAttributes( {
								titleFontSize: String( newSize ),
								titleFontUnit: 'px',
							} );
						} }
						withSlider
					/>
                    <SelectControl
                        label={ __( 'Title font weight', 'za' ) }
                        value={ titleFontWeight || '' }
                        options={ [
                            { label: __( 'Default', 'za' ), value: '' },
                            { label: '100', value: '100' },
                            { label: '200', value: '200' },
                            { label: '300', value: '300' },
                            { label: '400', value: '400' },
                            { label: '500', value: '500' },
                            { label: '600', value: '600' },
                            { label: '700', value: '700' },
                            { label: '800', value: '800' },
                            { label: '900', value: '900' },
                        ] }
                        onChange={ ( value ) => setAttributes( { titleFontWeight: value } ) }
                    />
				</PanelBody>

				<PanelBody
					title={ __( 'Title Spacing', 'za' ) }
					initialOpen={ false }
				>
					<RangeControl
						label={ __( 'Margin Top (px)', 'za' ) }
						value={ Number( titleMarginTop ) || 0 }
						onChange={ ( value ) =>
							setAttributes( { titleMarginTop: String( value ) } )
						}
						min={ 0 }
						max={ 100 }
						__next40pxDefaultSize={ true }
					/>
					<RangeControl
						label={ __( 'Margin Bottom (px)', 'za' ) }
						value={ Number( titleMarginBottom ) || 0 }
						onChange={ ( value ) =>
							setAttributes( {
								titleMarginBottom: String( value ),
							} )
						}
						min={ 0 }
						max={ 100 }
						__next40pxDefaultSize={ true }
					/>
				</PanelBody>
			</InspectorControls>

			{ showImages && imageUrl && (
				<BlockControls>
					<MediaReplaceFlow
						name={ __( 'Replace Image', 'za' ) }
						onSelect={ onSelect }
						accept="image/*"
						allowedTypes={ [ 'image', 'video' ] }
						mediaId={ imageId }
						mediaUrl={ imageUrl }
						mediaAlt={ imageAlt }
					/>
					<ToolbarButton
						onClick={ () =>
							setAttributes( {
								imageId: undefined,
								imageUrl: undefined,
								imageAlt: '',
							} )
						}
						isDisabled={ ! imageUrl }
						icon="trash"
						title={ __( 'Remove Image', 'za' ) }
					>
						{ __( 'Remove Image', 'za' ) }
					</ToolbarButton>
				</BlockControls>
			) }

			<BlockControls>
				<ToolbarGroup>
					{ titleTag === 'a' && (
						<ToolbarButton
							icon={ linkIcon }
							label={ __( 'Edit link', 'za' ) }
							onClick={ () =>
								setIsLinkPickerOpen( ( prev ) => ! prev )
							}
							isPressed={ isLinkPickerOpen }
						/>
					) }
				</ToolbarGroup>
			</BlockControls>

			{ isLinkPickerOpen && (
				<Popover
					position="bottom center"
					onClose={ () => setIsLinkPickerOpen( false ) }
				>
					<LinkControl
						value={ {
							url: linkUrl,
							opensInNewTab: linkTarget === '_blank',
							rel,
						} }
						settings={ [
							{
								id: 'opensInNewTab',
								title: __( 'Open in new tab', 'za' ),
							},
							{
								id: 'rel',
								title: __( 'Add rel attribute', 'za' ),
							},
						] }
						onChange={ ( newVal ) => {
							const linkAttrs = getSafeLinkAttributes(
								newVal.url,
								newVal.rel,
								newVal.opensInNewTab ? '_blank' : ''
							);
							setAttributes( {
								linkUrl: linkAttrs.href,
								linkTarget: linkAttrs.target,
								rel: linkAttrs.rel,
							} );
						} }
					/>
				</Popover>
			) }

            { activeField === 'title' && (
                <BlockControls group="block">
                    <AlignmentToolbar
                        value={ titleAlign }
                        onChange={ ( newAlign ) =>
                            setAttributes( { titleAlign: newAlign || 'left' } )
                        }
                    />
                </BlockControls>
            )}

            { activeField === 'sideText' && (
                <BlockControls group="block">
                    <AlignmentToolbar
                        value={ sideTextAlign }
                        onChange={ ( newAlign ) =>
                            setAttributes( { sideTextAlign: newAlign || 'left' } )
                        }
                    />
                </BlockControls>
            )}

            <li { ...blockProps }>
				<div className="timeline-side">
					{ showOtherSide && (
						<RichText
							tagName="p"
                            className={ `t-text-align-${ sideTextAlign } ` }
							value={ otherSiteTitle }
							onChange={ ( val ) =>
								setAttributes( { otherSiteTitle: val } )
							}
                            
                            onFocus={ () => setActiveField('sideText') }
							placeholder={ __( 'Add other side text', 'za' ) }
						/>
					) }
				</div>

				<div className="tl-trigger" />
				<div className="tl-circ" />
				<div
					className="timeline-panel"
					{ ...( itemBackgroundColor
						? { style: { backgroundColor: itemBackgroundColor } }
						: {} ) }
				>
					<div className="tl-content">
						<div className="tl-desc">
							{ showImages && imageUrl && (
								<div
									className={ `timeline_pic ${
										isBlobURL( imageUrl )
											? 'image-loading'
											: 'loaded'
									}` }
								>
									<img
										id={ `img_${ imageId }` }
										src={ imageUrl }
										alt={ imageAlt }
									/>
									{ isBlobURL( imageUrl ) && <Spinner /> }
								</div>
							) }

							{ showImages && ! imageUrl && (
								<MediaPlaceholder
									onSelect={ onSelect }
									accept="image/*"
									allowedTypes={ [ 'image' ] }
								/>
							) }

							{ titleTag === 'a' ? (
								<RichText
									tagName="a"
                                    className={ `t-text-align-${ titleAlign } tl-title` }
									value={ title }
									allowedFormats={ [] }
									onChange={ ( val ) =>
										setAttributes( { title: val } )
									}
                                    onFocus={ () => setActiveField('title') }

									placeholder={ __( 'Add link text…', 'za' ) }
									{ ...linkProps }
									style={ titleStyle }
								/>
							) : (
								<RichText
									tagName={ titleTag }
                                    className={ `t-text-align-${ titleAlign } tl-title` }
									value={ title }
									allowedFormats={ [] }
									onChange={ ( val ) =>
										setAttributes( { title: val } )
									}
                                    onFocus={ () => setActiveField('title') }

									style={ titleStyle }
								/>
							) }

							<div
								className="tl-desc-short"
								{ ...( descriptionColor
									? { style: { color: descriptionColor } }
									: {} ) }
							>
								<InnerBlocks
									template={ [ [ 'core/freeform' ] ] }
								/>
							</div>
						</div>
					</div>
				</div>
			</li>
		</>
	);
}
