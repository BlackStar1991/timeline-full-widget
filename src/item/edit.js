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
		showMedia,
		mediaUrl,
		videoPoster,
		imageAlt,
		mediaType,
		mediaMime,
		mediaId,
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
		position,
	} = attributes;

	const [ isLinkPickerOpen, setIsLinkPickerOpen ] = useState( false );
	const [ activeField, setActiveField ] = useState( null );

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

	const direction =
		typeof parentDirection !== 'undefined'
			? parentDirection
			: attributes.direction;

	const computedFallbackPosition = useMemo( () => {
		if ( typeof direction === 'undefined' ) return 'timeline-left';
		const even = blockIndex % 2 === 0;
		return direction
			? even
				? 'timeline-inverted'
				: 'timeline-left'
			: even
			? 'timeline-left'
			: 'timeline-inverted';
	}, [ direction, blockIndex ] );

	const liClass = useMemo(
		() => position || computedFallbackPosition,
		[ position, computedFallbackPosition ]
	);

	useEffect( () => {
		const updates = {};

		const computedPosition = onTheOneSide
			? direction
				? 'timeline-inverted'
				: 'timeline-left'
			: computedFallbackPosition;
		if ( position !== computedPosition ) {
			updates.position = computedPosition;
		}

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
	}, [
		blockIndex,
		direction,
		onTheOneSide,
		computedFallbackPosition,
		position,
		titleInlineStyle,
		titleFontSize,
		titleFontWeight,
		titleMarginTop,
		titleMarginBottom,
		titleColor,
		setAttributes,
	] );

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
				mediaUrl: media.url,
				imageAlt: media.alt || '',
				mediaId: media.id,
				mediaType: media.type,
				mediaMime: media.mime,
			} );
		},
		[ setAttributes ]
	);

	const linkProps = useMemo(
		() => getSafeLinkAttributes( linkUrl, rel, linkTarget ),
		[ linkUrl, rel, linkTarget ]
	);

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

	const isVideo = useMemo(
		() =>
			mediaType === 'video' ||
			( typeof mediaMime === 'string' &&
				mediaMime.indexOf( 'video/' ) === 0 ) ||
			( typeof mediaUrl === 'string' &&
				/\.(mp4|webm|ogv|ogg)(?:[\?#]|$)/i.test( mediaUrl ) ),
		[ mediaType, mediaMime, mediaUrl ]
	);

	const mediaSettings = useMemo( () => {
		if ( ! showMedia || ! mediaUrl || isBlobURL( mediaUrl ) ) return null;

		return (
			<PanelBody title={ __( 'Media Settings', 'za' ) }>
				{ isVideo ? (
					<PanelBody title={ __( 'Video Poster', 'za' ) }>
						{ videoPoster ? (
							<div className="video-poster-preview">
								<img
									src={ videoPoster }
									alt={ __( 'Video poster', 'za' ) }
									style={ { maxWidth: '100%' } }
								/>
								<ToolbarButton
									icon="trash"
									label={ __( 'Remove poster', 'za' ) }
									onClick={ () =>
										setAttributes( { videoPoster: '' } )
									}
								/>
							</div>
						) : (
							<MediaPlaceholder
								onSelect={ ( poster ) =>
									setAttributes( { videoPoster: poster.url } )
								}
								accept="image/*"
								allowedTypes={ [ 'image' ] }
								labels={ {
									title: __( 'Select video poster', 'za' ),
								} }
							/>
						) }
					</PanelBody>
				) : (
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
				) }
			</PanelBody>
		);
	}, [ showMedia, mediaUrl, isVideo, videoPoster, imageAlt, setAttributes ] );

	const blockToolbarForMedia = useMemo( () => {
		if ( ! showMedia || ! mediaUrl ) return null;
		return (
			<BlockControls>
				<MediaReplaceFlow
					name={ __( 'Replace Media File', 'za' ) }
					onSelect={ onSelect }
					accept="image/*"
					allowedTypes={ [ 'image', 'video' ] }
					mediaId={ mediaId }
					mediaUrl={ mediaUrl }
					mediaAlt={ imageAlt }
				/>
				<ToolbarButton
					onClick={ () =>
						setAttributes( {
							mediaId: undefined,
							mediaUrl: undefined,
							imageAlt: '',
							mediaType: '',
							mediaMime: '',
						} )
					}
					isDisabled={ ! mediaUrl }
					icon="trash"
					title={ __( 'Remove Media File', 'za' ) }
				>
					{ __( 'Remove Media File', 'za' ) }
				</ToolbarButton>
			</BlockControls>
		);
	}, [ showMedia, mediaUrl, onSelect, mediaId, imageAlt, setAttributes ] );

	const linkPopover = useMemo( () => {
		if ( ! isLinkPickerOpen ) return null;
		return (
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
						{ id: 'rel', title: __( 'Add rel attribute', 'za' ) },
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
		);
	}, [ isLinkPickerOpen, linkUrl, linkTarget, rel, setAttributes ] );

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

				{ mediaSettings }

				<PanelBody
					title={ __( 'Typography', 'za' ) }
					initialOpen={ true }
				>
					<FontSizePicker

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
                        __next40pxDefaultSize={ true }
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
						onChange={ ( value ) =>
							setAttributes( { titleFontWeight: value } )
						}
						__nextHasNoMarginBottom={ true }
						__next40pxDefaultSize={ true }
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

			{ blockToolbarForMedia }

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

			{ linkPopover }

			{ activeField === 'title' && (
				<BlockControls group="block">
					<AlignmentToolbar
						value={ titleAlign }
						onChange={ ( newAlign ) =>
							setAttributes( { titleAlign: newAlign || 'left' } )
						}
					/>
				</BlockControls>
			) }

			{ activeField === 'sideText' && (
				<BlockControls group="block">
					<AlignmentToolbar
						value={ sideTextAlign }
						onChange={ ( newAlign ) =>
							setAttributes( {
								sideTextAlign: newAlign || 'left',
							} )
						}
					/>
				</BlockControls>
			) }

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
							onFocus={ () => setActiveField( 'sideText' ) }
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
							{ showMedia && mediaUrl ? (
								<div
									className={ `timeline_pic ${
										isBlobURL( mediaUrl )
											? 'image-loading'
											: 'loaded'
									}` }
								>
									{ isVideo ? (
										<video
											id={
												mediaId
													? `video_${ mediaId }`
													: undefined
											}
											autoPlay
											muted
											loop
											playsInline
											preload="metadata"
											poster={ videoPoster || undefined }
											style={ {
												width: '100%',
												height: 'auto',
											} }
										>
											<source
												src={ mediaUrl }
												type={ mediaMime || undefined }
											/>
											{ __(
												'Your browser does not support the video tag.',
												'za'
											) }
										</video>
									) : (
										<img
											id={
												mediaId
													? `img_${ mediaId }`
													: undefined
											}
											src={ mediaUrl }
											alt={ imageAlt || '' }
										/>
									) }
									{ isBlobURL( mediaUrl ) && <Spinner /> }
								</div>
							) : (
								showMedia && (
									<MediaPlaceholder
										onSelect={ onSelect }
										accept="image/*"
										allowedTypes={ [ 'image', 'video' ] }
									/>
								)
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
									onFocus={ () => setActiveField( 'title' ) }
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
									onFocus={ () => setActiveField( 'title' ) }
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
