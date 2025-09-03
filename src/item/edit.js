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
} from '@wordpress/block-editor';
import { getSafeLinkAttributes } from './utils';
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
} from '@wordpress/components';
import { __experimentalUnitControl as UnitControl } from '@wordpress/components';
import { isBlobURL } from '@wordpress/blob';
import { useState, useEffect } from '@wordpress/element';
import { link as linkIcon } from '@wordpress/icons';

export default function Edit( { clientId, attributes, setAttributes } ) {
	const {
		align,
		textAlignClass,
		title,
		titleTag,
		titleColor,
		titleFontSize,
		descriptionColor,
		itemBackgroundColor,
		linkUrl,
		linkTarget,
		rel,
		showImages,
		imageUrl,
		imageAlt,
		imageId,
	} = attributes;
	const [ isLinkPickerOpen, setIsLinkPickerOpen ] = useState( false );

	const blockIndex = useSelect(
		( select ) => {
			const parentId =
				select( 'core/block-editor' ).getBlockRootClientId( clientId );
			if ( ! parentId ) return 0;
			const innerBlocks =
				select( 'core/block-editor' ).getBlocks( parentId );
			return innerBlocks.findIndex( ( b ) => b.clientId === clientId );
		},
		[ clientId ]
	);

	const parentDirection = useSelect(
		( select ) => {
			const parentId =
				select( 'core/block-editor' ).getBlockRootClientId( clientId );
			if ( ! parentId ) return undefined; // нет родителя
			const parent = select( 'core/block-editor' ).getBlock( parentId );
			return parent?.attributes?.direction;
		},
		[ clientId ]
	);

	const direction =
		typeof parentDirection !== 'undefined'
			? parentDirection
			: attributes.direction;

	const liClass = direction
		? blockIndex % 2 === 0
			? 'timeline-inverted'
			: 'timeline-left'
		: blockIndex % 2 === 0
		? 'timeline-left'
		: 'timeline-inverted';

	useEffect( () => {
		const updates = {};
		if ( attributes.position !== liClass ) updates.position = liClass;
		const newVal = align ? String( align ).trim() : '';
		if ( textAlignClass !== newVal ) updates.textAlignClass = newVal;

		if ( Object.keys( updates ).length > 0 ) {
			setAttributes( updates );
		}
	}, [ liClass, align, attributes.position, textAlignClass, setAttributes ] );

	const editorClasses = [ liClass ];
	if ( textAlignClass )
		editorClasses.push( `t-text-align-${ textAlignClass }` );

	const editorClassName = Array.from( new Set( editorClasses ) ).join( ' ' );

	const blockProps = useBlockProps( {
		tagName: 'li',
		className: editorClassName,
	} );

	const onSelect = ( media ) => {
		setAttributes( {
			imageUrl: media.url,
			imageAlt: media.alt,
			imageId: media.id,
		} );
	};
	const linkProps = getSafeLinkAttributes( linkUrl, rel, linkTarget );

	const titleStyle = {
		color: titleColor || undefined,
		fontSize: titleFontSize
			? String( titleFontSize ).match( /px|rem|em|%/ )
				? titleFontSize
				: `${ titleFontSize }px`
			: undefined,
	};

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
					/>

					<PanelColorSettings
						title={ __( 'Color settings', 'za' ) }
						colorSettings={ [
							{
								value: attributes.titleColor,
								onChange: ( color ) =>
									setAttributes( { titleColor: color } ),
								label: __( 'Title color', 'za' ),
							},
							{
								value: attributes.descriptionColor,
								onChange: ( color ) =>
									setAttributes( {
										descriptionColor: color,
									} ),
								label: __( 'Description color', 'za' ),
							},
							{
								value: attributes.itemBackgroundColor,
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
						/>
					</PanelBody>
				) }

				<PanelBody
					title={ __( 'Typography', 'za' ) }
					initialOpen={ true }
				>
					<FontSizePicker
						value={
							titleFontSize
								? parseFloat( titleFontSize )
								: undefined
						}
						onChange={ ( newSize ) => {
							if ( newSize === undefined ) {
								setAttributes( {
									titleFontSize: '',
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
				</PanelBody>
			</InspectorControls>

			{ showImages && imageUrl && (
				<BlockControls>
					<MediaReplaceFlow
						name={ __( 'Replace Image', 'za' ) }
						onSelect={ onSelect }
						accept="image/*"
						allowedTypes={ [ 'image' ] }
						mediaId={ imageId }
						mediaUrl={ imageUrl }
						mediaAlt={ imageAlt }
					/>
					<ToolbarButton
						onClick={ () => {
							setAttributes( {
								imageId: undefined,
								imageUrl: undefined,
								imageAlt: '',
							} );
						} }
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

			<li { ...blockProps }>
				<div className="timeline-side" />
				<div className="tl-trigger" />
				<div className="tl-circ" />
				<div className="timeline-panel">
					<div
						className="tl-content"
						{ ...( itemBackgroundColor
							? {
									style: {
										backgroundColor: itemBackgroundColor,
									},
							  }
							: {} ) }
					>
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
							{ showImages && (
								<MediaPlaceholder
									onSelect={ onSelect }
									accept="image/*"
									allowedTypes={ [ 'image' ] }
									disableMediaButtons={ !! imageUrl }
								/>
							) }
							{ titleTag === 'a' ? (
								<RichText
									tagName="a"
									className="tl-title"
									value={ title }
									allowedFormats={ [] }
									onChange={ ( val ) =>
										setAttributes( { title: val } )
									}
									placeholder={ __( 'Add link text…', 'za' ) }
									{ ...linkProps }
									style={ titleStyle }
								/>
							) : (
								<RichText
									tagName={ titleTag }
									className="tl-title"
									value={ title }
									allowedFormats={ [] }
									onChange={ ( val ) =>
										setAttributes( { title: val } )
									}
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
