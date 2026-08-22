import { registerBlockType } from '@wordpress/blocks';
import {
	InnerBlocks,
	InspectorControls,
	BlockControls,
	MediaPlaceholder,
	MediaReplaceFlow,
	PanelColorSettings,
	RichText,
	LinkControl,
	useBlockProps,
} from '@wordpress/block-editor';
import { useSelect, useDispatch } from '@wordpress/data';
import {
	PanelBody,
	Popover,
	Spinner,
	ToolbarButton,
	ToggleControl,
} from '@wordpress/components';
import { isBlobURL } from '@wordpress/blob';
import { useCallback, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { link as linkIcon, linkOff as unlinkIcon } from '@wordpress/icons';

import MediaSettingsPanel from '../components/MediaSettingsPanel';
import {
	CONTENT_AREA_ATTRIBUTE_NAMES,
	CONTENT_AREA_TEMPLATE,
	pickAttributes,
} from './config';
import { getSafeLinkAttributes } from '../utils';
import {
	LEGACY_TITLE_ATTRIBUTES,
	createLegacyTitleHeadingBlock,
} from '../legacy-title-migration';

const CONTENT_AREA_ATTRIBUTES = {
	descriptionColor: {
		type: 'string',
		default: '',
	},
	itemBackgroundColor: {
		type: 'string',
		default: '',
	},
	linkUrl: {
		type: 'string',
		default: '',
	},
	linkTarget: {
		type: 'string',
		default: '',
	},
	rel: {
		type: 'string',
		default: '',
	},
	mediaLinkUrl: {
		type: 'string',
		default: '',
	},
	mediaLinkTarget: {
		type: 'string',
		default: '',
	},
	mediaLinkRel: {
		type: 'string',
		default: '',
	},
	isMediaWrapToLink: {
		type: 'boolean',
		default: false,
	},
	showMedia: {
		type: 'boolean',
		default: true,
	},
	mediaUrl: {
		type: 'string',
		default: '',
	},
	videoPoster: {
		type: 'string',
		default: '',
	},
	imageAlt: {
		type: 'string',
		default: '',
	},
	mediaWidth: {
		type: 'string',
		default: '',
	},
	mediaId: {
		type: 'number',
	},
	mediaType: {
		type: 'string',
		default: '',
	},
	mediaMime: {
		type: 'string',
		default: '',
	},
	horizontalContentLayout: {
		type: 'boolean',
		default: false,
	},
	reverseMediaContent: {
		type: 'boolean',
		default: false,
	},
};

const LEGACY_CONTENT_AREA_ATTRIBUTES = {
	...LEGACY_TITLE_ATTRIBUTES,
	...CONTENT_AREA_ATTRIBUTES,
};

function isVideoMedia( mediaType, mediaMime, mediaUrl ) {
	return (
		mediaType === 'video' ||
		( typeof mediaMime === 'string' &&
			mediaMime.indexOf( 'video/' ) === 0 ) ||
		( typeof mediaUrl === 'string' &&
			/\.(mp4|webm|ogv|ogg)(?:[\?#]|$)/i.test( mediaUrl ) )
	);
}

function getVideoSourceType( mediaMime, mediaUrl, isVideo ) {
	if ( mediaMime ) {
		return mediaMime;
	}

	if ( ! isVideo || ! mediaUrl ) {
		return undefined;
	}

	const extMatch = mediaUrl.match( /\.([0-9a-z]+)(?:[\?#]|$)/i );
	if ( ! extMatch ) {
		return undefined;
	}

	const ext = extMatch[ 1 ].toLowerCase();

	if ( ext === 'mp4' ) {
		return 'video/mp4';
	}

	if ( ext === 'webm' ) {
		return 'video/webm';
	}

	if ( ext === 'ogv' || ext === 'ogg' ) {
		return 'video/ogg';
	}

	return undefined;
}

function MediaPreview( {
	mediaUrl,
	mediaId,
	mediaType,
	mediaMime,
	mediaWidth,
	videoPoster,
	imageAlt,
	isMediaWrapToLink,
	mediaLinkUrl,
	mediaLinkRel,
	mediaLinkTarget,
	isEditor = false,
} ) {
	const isVideo = isVideoMedia( mediaType, mediaMime, mediaUrl );
	const sourceType = getVideoSourceType( mediaMime, mediaUrl, isVideo );
	const mediaLinkProps = getSafeLinkAttributes(
		mediaLinkUrl,
		mediaLinkRel,
		mediaLinkTarget
	);

	const mediaElement = (
		<div
			className={ `timeline_pic ${
				isBlobURL( mediaUrl ) ? 'image-loading' : 'loaded'
			}` }
		>
			{ isVideo ? (
				<video
					id={ mediaId ? `video_${ mediaId }` : undefined }
					autoPlay
					muted
					loop
					playsInline
					preload="metadata"
					poster={ videoPoster || undefined }
					style={ {
						width: mediaWidth || '100%',
						height: 'auto',
					} }
				>
					{ mediaUrl && (
						<source src={ mediaUrl } type={ sourceType } />
					) }
					{ __(
						'Your browser does not support the video tag.',
						'timeline-full-widget'
					) }
				</video>
			) : (
				<img
					id={ mediaId ? `img_${ mediaId }` : undefined }
					{ ...( mediaWidth
						? {
								style: {
									width: mediaWidth,
									height: 'auto',
								},
						  }
						: {} ) }
					src={ mediaUrl }
					alt={ imageAlt || '' }
				/>
			) }
			{ isEditor && isBlobURL( mediaUrl ) && <Spinner /> }
		</div>
	);

	if ( isMediaWrapToLink && mediaLinkProps.href ) {
		if ( isEditor ) {
			return (
				<div
					className="timeline-media-link"
					role="link"
					aria-label={ __(
						'Linked media preview',
						'timeline-full-widget'
					) }
				>
					{ mediaElement }
				</div>
			);
		}

		return (
			<a className="timeline-media-link" { ...mediaLinkProps }>
				{ mediaElement }
			</a>
		);
	}

	return mediaElement;
}


function hasHeadingBlock( innerBlocks = [] ) {
	return innerBlocks.some( ( block ) => block.name === 'core/heading' );
}

function migrateInnerBlocksWithTitle( attributes = {}, innerBlocks = [] ) {
	if ( hasHeadingBlock( innerBlocks ) ) {
		return innerBlocks;
	}

	if ( ! innerBlocks.length ) {
		return CONTENT_AREA_TEMPLATE;
	}

	return [ createLegacyTitleHeadingBlock( attributes ), ...innerBlocks ];
}

function TimelineItemContentEdit( { clientId, attributes, setAttributes } ) {
	const [ isMediaLinkPickerOpen, setIsMediaLinkPickerOpen ] =
		useState( false );
	const { updateBlockAttributes, replaceInnerBlocks } = useDispatch(
		'core/block-editor'
	);
	const { parentClientId, parentAttributes, innerBlocks } = useSelect(
		( select ) => {
			const editor = select( 'core/block-editor' );
			const currentParentClientId = editor.getBlockRootClientId( clientId );
			const parentBlock = currentParentClientId
				? editor.getBlock( currentParentClientId )
				: null;

			return {
				parentClientId: currentParentClientId,
				parentAttributes: parentBlock?.attributes || {},
				innerBlocks: editor.getBlocks( clientId ) || [],
			};
		},
		[ clientId ]
	);

	const mergedAttributes = useMemo(
		() => ( {
			...attributes,
			...parentAttributes,
		} ),
		[ attributes, parentAttributes ]
	);


	const setTimelineItemAttributes = useCallback(
		( nextAttributes ) => {
			const contentAttributes = pickAttributes(
				nextAttributes,
				CONTENT_AREA_ATTRIBUTE_NAMES
			);

			if ( Object.keys( contentAttributes ).length ) {
				setAttributes( contentAttributes );
			}

			if ( parentClientId ) {
				updateBlockAttributes( parentClientId, nextAttributes );
			}
		},
		[ parentClientId, setAttributes, updateBlockAttributes ]
	);

	const {
		descriptionColor,
		itemBackgroundColor,
		mediaLinkUrl,
		mediaLinkTarget,
		mediaLinkRel,
		isMediaWrapToLink,
		showMedia,
		mediaUrl,
		videoPoster,
		imageAlt,
		mediaWidth,
		mediaId,
		mediaType,
		mediaMime,
		horizontalContentLayout,
		reverseMediaContent,
		markerUnique,
		markerUrl,
		markerId,
		markerAlt,
	} = mergedAttributes;

	const contentClasses = [
		'tl-content',
		horizontalContentLayout ? 'tl-content-horizontal' : '',
		reverseMediaContent ? 'tl-reverse' : '',
	]
		.filter( Boolean )
		.join( ' ' );

	const blockProps = useBlockProps( {
		className: 'timeline-panel',
		style: itemBackgroundColor
			? { backgroundColor: itemBackgroundColor }
			: undefined,
	} );

	const onSelect = useCallback(
		( media ) =>
			setTimelineItemAttributes( {
				mediaUrl: media.url,
				imageAlt: media.alt || '',
				mediaId: media.id,
				mediaType: media.type,
				mediaMime: media.mime,
			} ),
		[ setTimelineItemAttributes ]
	);

	const blockToolbarForMedia = useMemo( () => {
		if ( ! showMedia || ! mediaUrl ) {
			return null;
		}

		return (
			<BlockControls group="block">
				<MediaReplaceFlow
					name={ __( 'Replace Media File', 'timeline-full-widget' ) }
					onSelect={ onSelect }
					accept="image/*,video/*"
					allowedTypes={ [ 'image', 'video' ] }
					mediaId={ mediaId }
					mediaURL={ mediaUrl }
				/>

				<ToolbarButton
					onClick={ () =>
						setTimelineItemAttributes( {
							mediaId: undefined,
							mediaUrl: undefined,
							imageAlt: '',
							mediaType: '',
							mediaMime: '',
							videoPoster: '',
							mediaLinkUrl: '',
							mediaLinkTarget: '',
							mediaLinkRel: '',
							isMediaWrapToLink: false,
						} )
					}
					isDisabled={ ! mediaUrl }
					icon="trash"
					label={ __( 'Remove Media File', 'timeline-full-widget' ) }
				/>

				<ToolbarButton
					icon={ linkIcon }
					label={ __( 'Media link', 'timeline-full-widget' ) }
					onClick={ () =>
						setIsMediaLinkPickerOpen( ( prev ) => ! prev )
					}
					isPressed={ isMediaLinkPickerOpen }
				/>

				<ToolbarButton
					icon={ unlinkIcon }
					label={ __( 'Remove media link', 'timeline-full-widget' ) }
					onClick={ () => {
						setTimelineItemAttributes( {
							mediaLinkUrl: '',
							mediaLinkTarget: '',
							mediaLinkRel: '',
							isMediaWrapToLink: false,
						} );
						setIsMediaLinkPickerOpen( false );
					} }
					isDisabled={ ! mediaLinkUrl }
				/>
			</BlockControls>
		);
	}, [
		showMedia,
		mediaUrl,
		onSelect,
		mediaId,
		mediaLinkUrl,
		isMediaLinkPickerOpen,
		setTimelineItemAttributes,
	] );

	const mediaLinkPopover = useMemo( () => {
		if ( ! isMediaLinkPickerOpen || ! showMedia || ! mediaUrl ) {
			return null;
		}

		return (
			<Popover
				position="bottom center"
				onClose={ () => setIsMediaLinkPickerOpen( false ) }
			>
				<LinkControl
					value={ {
						url: mediaLinkUrl,
						opensInNewTab: mediaLinkTarget === '_blank',
					} }
					settings={ [
						{
							id: 'opensInNewTab',
							title: __(
								'Open in new tab',
								'timeline-full-widget'
							),
						},
					] }
					onChange={ ( newVal = {} ) => {
						const nextUrl = newVal.url || '';
						const nextTarget = newVal.opensInNewTab ? '_blank' : '';
						const nextAttrs = getSafeLinkAttributes(
							nextUrl,
							'',
							nextTarget
						);
						setTimelineItemAttributes( {
							mediaLinkUrl: nextAttrs.href || '',
							mediaLinkTarget: nextAttrs.target || '',
							mediaLinkRel: nextAttrs.rel || '',
							isMediaWrapToLink: !! nextAttrs.href,
						} );
					} }
				/>
			</Popover>
		);
	}, [
		isMediaLinkPickerOpen,
		showMedia,
		mediaUrl,
		mediaLinkUrl,
		mediaLinkTarget,
		setTimelineItemAttributes,
	] );

	return (
		<>
			<InspectorControls>
				<PanelBody
					title={ __( 'Block Settings', 'timeline-full-widget' ) }
					initialOpen={ false }
				>
					<ToggleControl
						label={ __(
							'Use horizontal content layout',
							'timeline-full-widget'
						) }
						checked={ !! horizontalContentLayout }
						onChange={ ( value ) =>
							setTimelineItemAttributes( {
								horizontalContentLayout: value,
							} )
						}
					/>

					<ToggleControl
						label={ __(
							'Reverse media and content order',
							'timeline-full-widget'
						) }
						checked={ !! reverseMediaContent }
						onChange={ ( value ) =>
							setTimelineItemAttributes( {
								reverseMediaContent: value,
							} )
						}
					/>

					<PanelColorSettings
						title={ __( 'Color Settings', 'timeline-full-widget' ) }
						colorSettings={ [
							{
								value: descriptionColor,
								onChange: ( color ) =>
									setTimelineItemAttributes( {
										descriptionColor: color,
									} ),
								label: __( 'Content color', 'timeline-full-widget' ),
							},
							{
								value: itemBackgroundColor,
								onChange: ( color ) =>
									setTimelineItemAttributes( {
										itemBackgroundColor: color,
									} ),
								label: __(
									'Item background color',
									'timeline-full-widget'
								),
							},
						] }
					/>
				</PanelBody>
				<MediaSettingsPanel
					showMedia={ showMedia }
					mediaUrl={ mediaUrl }
					mediaMime={ mediaMime }
					videoPoster={ videoPoster }
					imageAlt={ imageAlt }
					mediaWidth={ mediaWidth }
					setAttributes={ setTimelineItemAttributes }
					markerUnique={ markerUnique }
					markerAlt={ markerAlt }
					markerUrl={ markerUrl }
					markerId={ markerId }
				/>
			</InspectorControls>

			{ blockToolbarForMedia }
			{ mediaLinkPopover }

			<div { ...blockProps }>
				<div className={ contentClasses }>
					{ showMedia && mediaUrl ? (
						<MediaPreview
							mediaUrl={ mediaUrl }
							mediaId={ mediaId }
							mediaType={ mediaType }
							mediaMime={ mediaMime }
							mediaWidth={ mediaWidth }
							videoPoster={ videoPoster }
							imageAlt={ imageAlt }
							isMediaWrapToLink={ isMediaWrapToLink }
							mediaLinkUrl={ mediaLinkUrl }
							mediaLinkRel={ mediaLinkRel }
							mediaLinkTarget={ mediaLinkTarget }
							isEditor
						/>
					) : (
						showMedia && (
							<MediaPlaceholder
								onSelect={ onSelect }
								accept="image/*,video/*"
								allowedTypes={ [ 'image', 'video' ] }
							/>
						)
					) }

					<div className="tl-desc">
						<div
							className="tl-desc-short"
							{ ...( descriptionColor
								? { style: { color: descriptionColor } }
								: {} ) }
						>
							<InnerBlocks
								template={ CONTENT_AREA_TEMPLATE }
								templateLock={ false }
								renderAppender={ InnerBlocks.ButtonBlockAppender }
							/>
						</div>
					</div>
				</div>
			</div>
		</>
	);
}

function TimelineItemContentSave( { attributes } ) {
	const {
		descriptionColor,
		itemBackgroundColor,
		mediaLinkUrl,
		mediaLinkTarget,
		mediaLinkRel,
		isMediaWrapToLink,
		showMedia,
		mediaUrl,
		videoPoster,
		imageAlt,
		mediaWidth,
		mediaId,
		mediaType,
		mediaMime,
		horizontalContentLayout,
		reverseMediaContent,
	} = attributes;

	const contentClasses = [
		'tl-content',
		horizontalContentLayout ? 'tl-content-horizontal' : '',
		reverseMediaContent ? 'tl-reverse' : '',
	]
		.filter( Boolean )
		.join( ' ' );
	const blockProps = useBlockProps.save( {
		className: 'timeline-panel',
		style: itemBackgroundColor
			? { backgroundColor: itemBackgroundColor }
			: undefined,
	} );

	return (
		<div { ...blockProps }>
			<div className={ contentClasses }>
				{ showMedia && mediaUrl && (
					<MediaPreview
						mediaUrl={ mediaUrl }
						mediaId={ mediaId }
						mediaType={ mediaType }
						mediaMime={ mediaMime }
						mediaWidth={ mediaWidth }
						videoPoster={ videoPoster }
						imageAlt={ imageAlt }
						isMediaWrapToLink={ isMediaWrapToLink }
						mediaLinkUrl={ mediaLinkUrl }
						mediaLinkRel={ mediaLinkRel }
						mediaLinkTarget={ mediaLinkTarget }
					/>
				) }

				<div className="tl-desc">
					<div
						className="tl-desc-short"
						{ ...( descriptionColor
							? { style: { color: descriptionColor } }
							: {} ) }
					>
						<InnerBlocks.Content />
					</div>
				</div>
			</div>
		</div>
	);
}


// Temporary deprecated save helper for validating markup saved before the 3.0.0
// heading-block migration. TODO(4.0.0): remove with the deprecated schema above.
function buildLegacyTitleStyleObject( attributes = {} ) {
	return {};
}

function TimelineItemContentDeprecatedSave( { attributes } ) {
	const {
		title,
		titleTag,
		titleInlineStyle,
		titleColor,
		titleFontSize,
		titleFontWeight,
		titleAlign,
		titleMarginTop,
		titleMarginBottom,
		titleLineHeight,
		titleLetterSpacing,
		titleFontFamily,
		descriptionColor,
		itemBackgroundColor,
		linkUrl,
		linkTarget,
		rel,
		mediaLinkUrl,
		mediaLinkTarget,
		mediaLinkRel,
		isMediaWrapToLink,
		showMedia,
		mediaUrl,
		videoPoster,
		imageAlt,
		mediaWidth,
		mediaId,
		mediaType,
		mediaMime,
		horizontalContentLayout,
		reverseMediaContent,
	} = attributes;

	const contentClasses = [
		'tl-content',
		horizontalContentLayout ? 'tl-content-horizontal' : '',
		reverseMediaContent ? 'tl-reverse' : '',
	]
		.filter( Boolean )
		.join( ' ' );
	const linkProps = getSafeLinkAttributes( linkUrl, rel, linkTarget );
	const styleObj = buildLegacyTitleStyleObject( {
		titleInlineStyle,
		titleFontSize,
		titleFontWeight,
		titleMarginTop,
		titleMarginBottom,
		titleLineHeight,
		titleLetterSpacing,
		titleFontFamily,
		titleColor,
	} );
	const blockProps = useBlockProps.save( {
		className: 'timeline-panel',
		style: itemBackgroundColor
			? { backgroundColor: itemBackgroundColor }
			: undefined,
	} );

	return (
		<div { ...blockProps }>
			<div className={ contentClasses }>
				{ showMedia && mediaUrl && (
					<MediaPreview
						mediaUrl={ mediaUrl }
						mediaId={ mediaId }
						mediaType={ mediaType }
						mediaMime={ mediaMime }
						mediaWidth={ mediaWidth }
						videoPoster={ videoPoster }
						imageAlt={ imageAlt }
						isMediaWrapToLink={ isMediaWrapToLink }
						mediaLinkUrl={ mediaLinkUrl }
						mediaLinkRel={ mediaLinkRel }
						mediaLinkTarget={ mediaLinkTarget }
					/>
				) }

				<div className="tl-desc">
					{ titleTag === 'a' ? (
						<RichText.Content
							tagName="a"
							className={ `t-text-align-${
								titleAlign || 'left'
							} tl-title` }
							value={ title }
							{ ...linkProps }
							style={ styleObj }
						/>
					) : (
						<RichText.Content
							tagName={ titleTag || 'h3' }
							className={ `t-text-align-${
								titleAlign || 'left'
							} tl-title` }
							value={ title }
							style={ styleObj }
						/>
					) }

					<div
						className="tl-desc-short"
						{ ...( descriptionColor
							? { style: { color: descriptionColor } }
							: {} ) }
					>
						<InnerBlocks.Content />
					</div>
				</div>
			</div>
		</div>
	);
}

registerBlockType( 'za/timeline-item-content', {
	apiVersion: 3,
	title: __( 'Timeline main content', 'timeline-full-widget' ),
	description: __(
		'Container for blocks displayed in the main content area of a timeline item.',
		'timeline-full-widget'
	),
	icon: 'welcome-widgets-menus',
	parent: [ 'za/timeline-item' ],
	supports: {
		html: false,
		reusable: false,
		inserter: false,
	},
	attributes: CONTENT_AREA_ATTRIBUTES,
	edit: TimelineItemContentEdit,
	save: TimelineItemContentSave,
	deprecated: [
		{
			attributes: LEGACY_CONTENT_AREA_ATTRIBUTES,
			save: TimelineItemContentDeprecatedSave,
			migrate: ( attributes, innerBlocks ) => [
				pickAttributes( attributes, CONTENT_AREA_ATTRIBUTE_NAMES ),
				migrateInnerBlocksWithTitle( attributes, innerBlocks ),
			],
		},
	],
} );
