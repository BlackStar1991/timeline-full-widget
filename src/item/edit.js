// item/edit.js
import {
	useBlockProps,
	InspectorControls,
	BlockControls,
	MediaReplaceFlow,
	InnerBlocks,
	PanelColorSettings,
	LinkControl,
} from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';
import { __, sprintf } from '@wordpress/i18n';
import { link as linkIcon, linkOff as unlinkIcon } from '@wordpress/icons';
import { useSelect, useDispatch } from '@wordpress/data';
import {
	PanelBody,
	ToolbarButton,
	ToggleControl,
	Popover,
} from '@wordpress/components';
import { useState, useEffect, useMemo, useCallback } from '@wordpress/element';

import { getSafeLinkAttributes } from './utils';
import {
	ITEM_ATTRIBUTE_EXCLUSIONS,
	collectDescendantStyleUpdates,
	getInheritableAttributes,
	getNoRecipientItemsNotice,
	getNoSiblingItemsNotice,
} from './style-inheritance';
import {
	CONTENT_AREA_BLOCK,
	SIDE_AREA_BLOCK,
	TIMELINE_ITEM_PARAGRAPH_TEMPLATE,
	TIMELINE_ITEM_AREA_BLOCKS,
	TIMELINE_ITEM_AREA_TEMPLATE,
	getContentAreaAttributes,
	getSideAreaAttributes,
	shallowEqualAttributes,
} from './areas/config';
import { createLegacyTitleHeadingBlock } from './legacy-title-migration';

import MediaSettingsPanel from './components/MediaSettingsPanel';


function createEmptyParagraphBlock() {
	return createBlock(
		TIMELINE_ITEM_PARAGRAPH_TEMPLATE[ 0 ],
		TIMELINE_ITEM_PARAGRAPH_TEMPLATE[ 1 ]
	);
}

function getContentAreaInnerBlocks( attributes = {}, legacyBlocks = [] ) {
	if ( legacyBlocks.length ) {
		return [ createLegacyTitleHeadingBlock( attributes ), ...legacyBlocks ];
	}

	return [ createLegacyTitleHeadingBlock( attributes ), createEmptyParagraphBlock() ];
}

export function Edit( { clientId, attributes, setAttributes } ) {
	const {
		descriptionColor,
		itemBackgroundColor,
		mediaLinkUrl,
		mediaLinkTarget,
		mediaLinkRel,
		isMediaWrapToLink,
		showMedia,
		mediaUrl,
		markerAlt,
		videoPoster,
		imageAlt,
		mediaWidth,
		mediaType,
		mediaMime,
		mediaId,
		onTheOneSide,
		showMarker,
		markerUnique,
		markerUrl,
		markerId,
		showOtherSide,
		otherSiteTitle,
		sideTextAlign,
		position,
		horizontalContentLayout,
		reverseMediaContent,
	} = attributes;

	const [ isMediaLinkPickerOpen, setIsMediaLinkPickerOpen ] =
		useState( false );
	const { replaceInnerBlocks, updateBlockAttributes } = useDispatch(
		'core/block-editor'
	);
	const { createSuccessNotice, createErrorNotice } =
		useDispatch( 'core/notices' );

	/* block-index/parent info */
	const {
		blockIndex,
		parentDirection,
		parentId,
		siblingBlocks,
		currentBlock,
	} = useSelect(
		( select ) => {
			const editor = select( 'core/block-editor' );
			const currentParentId = editor.getBlockRootClientId( clientId );
			const currentBlockData = editor.getBlock( clientId );
			if ( ! currentParentId ) {
				return {
					blockIndex: 0,
					parentDirection: undefined,
					parentId: undefined,
					siblingBlocks: [],
					currentBlock: currentBlockData,
				};
			}

			const innerBlocks = editor.getBlocks( currentParentId );
			const idx = innerBlocks.findIndex(
				( b ) => b.clientId === clientId
			);
			const parent = editor.getBlock( currentParentId );
			return {
				blockIndex: idx,
				parentDirection: parent?.attributes?.direction,
				parentId: currentParentId,
				siblingBlocks: innerBlocks,
				currentBlock: currentBlockData,
			};
		},
		[ clientId ]
	);

	const direction =
		typeof parentDirection !== 'undefined'
			? parentDirection
			: attributes.direction;

	const computedFallbackPosition = useMemo( () => {
		if ( typeof direction === 'undefined' ) {
			return 'timeline-left';
		}
		const even = blockIndex % 2 === 0;
		return direction
			? even
				? 'timeline-inverted'
				: 'timeline-left'
			: even
			? 'timeline-left'
			: 'timeline-inverted';
	}, [ direction, blockIndex ] );

	useEffect( () => {
		const computedPosition = onTheOneSide
			? direction
				? 'timeline-inverted'
				: 'timeline-left'
			: computedFallbackPosition;
		if ( position !== computedPosition ) {
			setAttributes( { position: computedPosition } );
		}
	}, [
		direction,
		onTheOneSide,
		computedFallbackPosition,
		position,
		setAttributes,
	] );

	const timelineItemSiblings = useMemo(
		() =>
			siblingBlocks.filter(
				( block ) => block.name === 'za/timeline-item'
			),
		[ siblingBlocks ]
	);

	const inheritableStyleAttributes = useMemo(
		() => getInheritableAttributes( attributes, ITEM_ATTRIBUTE_EXCLUSIONS ),
		[ attributes ]
	);

	const areaBlocks = useMemo( () => {
		const children = currentBlock?.innerBlocks || [];

		return {
			side: children.find( ( block ) => block.name === SIDE_AREA_BLOCK ),
			content: children.find(
				( block ) => block.name === CONTENT_AREA_BLOCK
			),
			legacy: children.filter(
				( block ) => ! TIMELINE_ITEM_AREA_BLOCKS.includes( block.name )
			),
		};
	}, [ currentBlock ] );

	useEffect( () => {
		if ( ! currentBlock ) {
			return;
		}

		if (
			areaBlocks.side &&
			areaBlocks.content &&
			! areaBlocks.legacy.length
		) {
			return;
		}

		const sideArea =
			areaBlocks.side ||
			createBlock(
				SIDE_AREA_BLOCK,
				getSideAreaAttributes( attributes ),
				otherSiteTitle
					? [
						createBlock( 'core/paragraph', {
							content: otherSiteTitle,
						} ),
					  ]
					: []
			);
		const contentArea =
			areaBlocks.content ||
			createBlock(
				CONTENT_AREA_BLOCK,
				getContentAreaAttributes( attributes ),
				getContentAreaInnerBlocks( attributes, areaBlocks.legacy )
			);

		replaceInnerBlocks( clientId, [ sideArea, contentArea ], false );
	}, [
		areaBlocks,
		attributes,
		clientId,
		currentBlock,
		otherSiteTitle,
		replaceInnerBlocks,
	] );

	useEffect( () => {
		if ( areaBlocks.side ) {
			const nextSideAttributes = getSideAreaAttributes( attributes );
			const currentSideAttributes = getSideAreaAttributes(
				areaBlocks.side.attributes || {}
			);

			if (
				! shallowEqualAttributes(
					currentSideAttributes,
					nextSideAttributes
				)
			) {
				updateBlockAttributes(
					areaBlocks.side.clientId,
					nextSideAttributes
				);
			}
		}

		if ( areaBlocks.content ) {
			const nextContentAttributes = getContentAreaAttributes( attributes );
			const currentContentAttributes = getContentAreaAttributes(
				areaBlocks.content.attributes || {}
			);

			if (
				! shallowEqualAttributes(
					currentContentAttributes,
					nextContentAttributes
				)
			) {
				updateBlockAttributes(
					areaBlocks.content.clientId,
					nextContentAttributes
				);
			}
		}
	}, [ areaBlocks, attributes, updateBlockAttributes ] );

	const applyStylesToSiblingItems = useCallback( () => {
		if ( ! parentId || timelineItemSiblings.length < 2 ) {
			createErrorNotice( getNoSiblingItemsNotice(), {
				type: 'snackbar',
			} );
			return;
		}

		const recipientBlocks = timelineItemSiblings.filter(
			( block ) => block.clientId !== clientId
		);

		if ( ! recipientBlocks.length ) {
			createErrorNotice( getNoRecipientItemsNotice(), {
				type: 'snackbar',
			} );
			return;
		}

		recipientBlocks.forEach( ( block ) => {
			updateBlockAttributes( block.clientId, inheritableStyleAttributes );

			collectDescendantStyleUpdates( currentBlock, block ).forEach(
				( {
					clientId: descendantClientId,
					attributes: descendantAttributes,
				} ) => {
					updateBlockAttributes(
						descendantClientId,
						descendantAttributes
					);
				}
			);
		} );

		createSuccessNotice(
			sprintf(
				/* translators: %d: number of timeline items that received copied styles. */
				__(
					'Copied item styles to %d other Timeline Item(s).',
					'timeline-full-widget'
				),
				recipientBlocks.length
			),
			{ type: 'snackbar' }
		);
	}, [
		parentId,
		timelineItemSiblings,
		clientId,
		updateBlockAttributes,
		inheritableStyleAttributes,
		currentBlock,
		createSuccessNotice,
		createErrorNotice,
	] );

	const editorClassName = useMemo(
		() =>
			Array.from(
				new Set( [
					position || computedFallbackPosition,
					'timeline-item',
				] )
			).join( ' ' ),
		[ position, computedFallbackPosition ]
	);

	const blockProps = useBlockProps( { className: editorClassName } );

	const onSelect = useCallback(
		( media ) =>
			setAttributes( {
				mediaUrl: media.url,
				imageAlt: media.alt || '',
				mediaId: media.id,
				mediaType: media.type,
				mediaMime: media.mime,
			} ),
		[ setAttributes ]
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
						setAttributes( {
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
						setAttributes( {
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
		setAttributes,
		mediaLinkUrl,
		isMediaLinkPickerOpen,
		setIsMediaLinkPickerOpen,
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
						setAttributes( {
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
		setAttributes,
	] );

	const blockToolbarForStyleInheritance = useMemo( () => {
		if ( timelineItemSiblings.length < 2 ) {
			return null;
		}
		return (
			<BlockControls group="block">
				<ToolbarButton
					label={ __(
						'Apply item styles to other items',
						'timeline-full-widget'
					) }
					icon="admin-customizer"
					onClick={ applyStylesToSiblingItems }
				/>
			</BlockControls>
		);
	}, [ applyStylesToSiblingItems, timelineItemSiblings.length ] );


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
							setAttributes( {
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
							setAttributes( {
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
									setAttributes( {
										descriptionColor: color,
									} ),
								label: __(
									'Content color',
									'timeline-full-widget'
								),
							},
							{
								value: itemBackgroundColor,
								onChange: ( color ) =>
									setAttributes( {
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
					setAttributes={ setAttributes }
					markerUnique={ markerUnique }
					markerAlt={ markerAlt }
					markerUrl={ markerUrl }
					markerId={ markerId }
				/>

			</InspectorControls>

			{ blockToolbarForMedia }
			{ mediaLinkPopover }
			{ blockToolbarForStyleInheritance }


			<li { ...blockProps }>
				<div className="tl-trigger"></div>

				{ showMarker && (
					<div
						className="tl-mark"
						id={ markerId ? `marker_${ markerId }` : undefined }
					>
						{ markerUnique && markerUrl && (
							<img
								src={ markerUrl }
								alt={ markerAlt || 'marker' }
							/>
						) }
					</div>
				) }

				<InnerBlocks
					allowedBlocks={ TIMELINE_ITEM_AREA_BLOCKS }
					template={ TIMELINE_ITEM_AREA_TEMPLATE }
					templateLock={ false }
					renderAppender={ false }
				/>
			</li>
		</>
	);
}

export default Edit;
