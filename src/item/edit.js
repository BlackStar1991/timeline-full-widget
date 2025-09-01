import {
	AlignmentToolbar,
	useBlockProps,
	RichText,
	InspectorControls,
	BlockControls,
	MediaPlaceholder,
	MediaReplaceFlow,
	InnerBlocks,
	LinkControl,
	PanelColorSettings,
} from '@wordpress/block-editor';
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
import { isBlobURL } from '@wordpress/blob';
import { useState, useEffect } from '@wordpress/element';
import { link as linkIcon } from '@wordpress/icons';

// import { getComputedRel } from './utils'; TODO rel doesn't work / add true to rel

export default function Edit( { clientId, attributes, setAttributes } ) {
	const {
		align,
		title,
		titleTag,
		titleColor,
		descriptionColor,
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

	const parentAttrs = useSelect(
		( select ) => {
			const parentId =
				select( 'core/block-editor' ).getBlockRootClientId( clientId );
			if ( ! parentId ) return {};
			const parent = select( 'core/block-editor' ).getBlock( parentId );
			return parent?.attributes || {};
		},
		[ clientId ]
	);

	const direction =
		typeof parentAttrs?.direction !== 'undefined'
			? parentAttrs.direction
			: attributes.direction;

	const liClass = direction
		? blockIndex % 2 === 0
			? 'timeline-inverted'
			: 'timeline-left'
		: blockIndex % 2 === 0
		? 'timeline-left'
		: 'timeline-inverted';

	useEffect( () => {
		if ( attributes.position !== liClass ) {
			setAttributes( { position: liClass } );
		}
	}, [ liClass ] );

	const blockProps = useBlockProps( {
		tagName: 'li',
		className: `${ liClass } ${ align ? `has-text-align-${ align }` : '' }`,
	} );

	const onSelect = ( media ) => {
		setAttributes( {
			imageUrl: media.url,
			imageAlt: media.alt,
			imageId: media.id,
		} );
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

					<AlignmentToolbar
						onChange={ ( val ) => setAttributes( { align: val } ) }
						value={ align }
					/>
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
							setAttributes( {
								linkUrl: newVal.url,
								linkTarget: newVal.opensInNewTab
									? '_blank'
									: '',
								rel: newVal.rel || '',
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
									href={ linkUrl || undefined }
									target={ linkTarget || undefined }
									{ ...( titleColor
										? { style: { color: titleColor } }
										: {} ) }
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
									{ ...( titleColor
										? { style: { color: titleColor } }
										: {} ) }
								/>
							) }

							<div
								className="tl-desc-short"
								{ ...( descriptionColor
									? { style: { color: descriptionColor } }
									: {} ) }
							>
								<InnerBlocks
									allowedBlocks={ [ 'core/freeform' ] }
									template={ [ [ 'core/freeform' ] ] }
									templateLock={ false }
								/>
							</div>
						</div>
					</div>
				</div>
			</li>
		</>
	);
}
