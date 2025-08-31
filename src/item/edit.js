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
		linkUrl,
		linkTarget,
		rel,
		image_url,
		image_alt,
		image_id,
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

	const showImagesFromParent = parentAttrs?.showImages ?? false;
	const direction =
		typeof parentAttrs !== 'undefined' ? parentAttrs : attributes.direction;

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
			image_url: media.url,
			image_alt: media.alt,
			image_id: media.id,
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
							{
								label: 'H3',
								value: 'h3',
							},
							{ label: 'H4', value: 'h4' },
							{ label: 'H5', value: 'h5' },
							{
								label: 'H6',
								value: 'h6',
							},
							{ label: 'Paragraph', value: 'p' },
							{ label: 'Div', value: 'div' },
							{
								label: 'Span',
								value: 'span',
							},
							{ label: 'Link (a)', value: 'a' },
						] }
						onChange={ ( val ) =>
							setAttributes( { titleTag: val } )
						}
					/>
				</PanelBody>

				{ showImagesFromParent &&
					image_url &&
					! isBlobURL( image_url ) && (
						<PanelBody title={ __( 'Image Settings', 'za' ) }>
							<TextControl
								label={ __( 'Image Alt', 'za' ) }
								value={ image_alt }
								help={ __(
									'Add alt text for the image.',
									'za'
								) }
								onChange={ ( val ) =>
									setAttributes( { image_alt: val } )
								}
							/>
						</PanelBody>
					) }
			</InspectorControls>

			{ showImagesFromParent && image_url && (
				<BlockControls>
					<MediaReplaceFlow
						name={ __( 'Replace Image', 'za' ) }
						onSelect={ onSelect }
						accept="image/*"
						allowedTypes={ [ 'image' ] }
						mediaId={ image_id }
						mediaUrl={ image_url }
						mediaAlt={ image_alt }
					/>
					<ToolbarButton
						onClick={ () => {
							setAttributes( {
								image_id: undefined,
								image_url: undefined,
								image_alt: '',
							} );
						} }
						isDisabled={ ! image_url }
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
							{ showImagesFromParent && image_url && (
								<div
									className={ `timeline_pic ${
										isBlobURL( image_url )
											? 'image-loading'
											: 'loaded'
									}` }
								>
									<img
										id={ `img_${ image_id }` }
										src={ image_url }
										alt={ image_alt }
									/>
									{ isBlobURL( image_url ) && <Spinner /> }
								</div>
							) }
							{ showImagesFromParent && (
								<MediaPlaceholder
									onSelect={ onSelect }
									accept="image/*"
									allowedTypes={ [ 'image' ] }
									disableMediaButtons={ !! image_url }
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
								/>
							) }

							<div className="tl-desc-short">
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
