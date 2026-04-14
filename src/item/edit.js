// item/edit.js
import {
	useBlockProps,
	RichText,
	InspectorControls,
	BlockControls,
	MediaPlaceholder,
	MediaReplaceFlow,
	InnerBlocks,
	PanelColorSettings,
	AlignmentToolbar,
	LinkControl,
} from '@wordpress/block-editor';
import { __, sprintf } from '@wordpress/i18n';
import { link as linkIcon, linkOff as unlinkIcon } from '@wordpress/icons';
import { useSelect, useDispatch } from '@wordpress/data';
import {
	PanelBody,
	SelectControl,
	ToolbarButton,
	Spinner,
	Popover,
} from '@wordpress/components';
import { isBlobURL } from '@wordpress/blob';
import { useState, useEffect, useMemo, useCallback } from '@wordpress/element';

import Title from './title';
import { parseStyleString, getSafeLinkAttributes } from './utils';
import {
	ITEM_ATTRIBUTE_EXCLUSIONS,
	collectDescendantStyleUpdates,
	getInheritableAttributes,
	getNoRecipientItemsNotice,
	getNoSiblingItemsNotice,
} from './style-inheritance';

import MediaSettingsPanel from './components/MediaSettingsPanel';
import TitleTypographyPanel from './components/TitleTypographyPanel';

export function Edit({ clientId, attributes, setAttributes }) {
	const {
		titleAlign,
		title,
		titleTag,
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
		markerAlt,
		videoPoster,
		imageAlt,
		mediaWidth,
		mediaType,
		mediaMime,
		mediaId,
		onTheOneSide,
		titleInlineStyle,
		titleFontSize,
		titleFontUnit,
		titleFontWeight,
		titleLineHeight,
		titleMarginTop,
		titleMarginBottom,
		titleColor,
		titleFontFamily,
		showMarker,
		markerUnique,
		markerUrl,
		markerId,
		showOtherSide,
		otherSiteTitle,
		sideTextAlign,
		position,
	} = attributes;

	const [activeField, setActiveField] = useState(null);
	const [isMediaLinkPickerOpen, setIsMediaLinkPickerOpen] = useState(false);
	const { updateBlockAttributes } = useDispatch('core/block-editor');
	const { createSuccessNotice, createErrorNotice } =
		useDispatch('core/notices');

	/* block-index/parent info */
	const {
		blockIndex,
		parentDirection,
		parentId,
		siblingBlocks,
		currentBlock,
	} = useSelect(
		(select) => {
			const editor = select('core/block-editor');
			const currentParentId = editor.getBlockRootClientId(clientId);
			const currentBlockData = editor.getBlock(clientId);
			if (!currentParentId) {
				return {
					blockIndex: 0,
					parentDirection: undefined,
					parentId: undefined,
					siblingBlocks: [],
					currentBlock: currentBlockData,
				};
			}

			const innerBlocks = editor.getBlocks(currentParentId);
			const idx = innerBlocks.findIndex((b) => b.clientId === clientId);
			const parent = editor.getBlock(currentParentId);
			return {
				blockIndex: idx,
				parentDirection: parent?.attributes?.direction,
				parentId: currentParentId,
				siblingBlocks: innerBlocks,
				currentBlock: currentBlockData,
			};
		},
		[clientId]
	);

	const direction =
		typeof parentDirection !== 'undefined'
			? parentDirection
			: attributes.direction;

	const computedFallbackPosition = useMemo(() => {
		if (typeof direction === 'undefined') {
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
	}, [direction, blockIndex]);

	useEffect(() => {
		const updates = {};
		const computedPosition = onTheOneSide
			? direction
				? 'timeline-inverted'
				: 'timeline-left'
			: computedFallbackPosition;
		if (position !== computedPosition) {
			updates.position = computedPosition;
		}

		// pull inline style values once
		const parsed = parseStyleString(titleInlineStyle || '');
		if (parsed.fontSize && !titleFontSize) {
			const m = parsed.fontSize.match(/^([\d.]+)(px|rem|em|%)?$/);
			updates.titleFontSize = m ? m[1] : parsed.fontSize;
		}
		if (parsed.fontWeight && !titleFontWeight) {
			updates.titleFontWeight = parsed.fontWeight;
		}
		if (parsed.marginTop && !titleMarginTop) {
			updates.titleMarginTop = parsed.marginTop.replace(/px$/, '');
		}
		if (parsed.marginBottom && !titleMarginBottom) {
			updates.titleMarginBottom = parsed.marginBottom.replace(/px$/, '');
		}
		if (parsed.lineHeight && !titleLineHeight) {
			updates.titleLineHeight = parsed.lineHeight;
		}
		if (parsed.color && !titleColor) {
			updates.titleColor = parsed.color;
		}

		if (Object.keys(updates).length) {
			setAttributes(updates);
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
		titleLineHeight,
		titleMarginTop,
		titleMarginBottom,
		titleColor,
		setAttributes,
	]);

	const timelineItemSiblings = useMemo(
		() =>
			siblingBlocks.filter((block) => block.name === 'za/timeline-item'),
		[siblingBlocks]
	);

	const inheritableStyleAttributes = useMemo(
		() => getInheritableAttributes(attributes, ITEM_ATTRIBUTE_EXCLUSIONS),
		[attributes]
	);

	const applyStylesToSiblingItems = useCallback(() => {
		if (!parentId || timelineItemSiblings.length < 2) {
			createErrorNotice(getNoSiblingItemsNotice(), { type: 'snackbar' });
			return;
		}

		const recipientBlocks = timelineItemSiblings.filter(
			(block) => block.clientId !== clientId
		);

		if (!recipientBlocks.length) {
			createErrorNotice(getNoRecipientItemsNotice(), {
				type: 'snackbar',
			});
			return;
		}

		recipientBlocks.forEach((block) => {
			updateBlockAttributes(block.clientId, inheritableStyleAttributes);

			collectDescendantStyleUpdates(currentBlock, block).forEach(
				({
					clientId: descendantClientId,
					attributes: descendantAttributes,
				}) => {
					updateBlockAttributes(
						descendantClientId,
						descendantAttributes
					);
				}
			);
		});

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
	]);

	const editorClassName = useMemo(
		() =>
			Array.from(
				new Set([position || computedFallbackPosition, 'timeline-item'])
			).join(' '),
		[position, computedFallbackPosition]
	);

	const blockProps = useBlockProps({ className: editorClassName });

	const onSelect = useCallback(
		(media) =>
			setAttributes({
				mediaUrl: media.url,
				imageAlt: media.alt || '',
				mediaId: media.id,
				mediaType: media.type,
				mediaMime: media.mime,
			}),
		[setAttributes]
	);

	const isVideo = useMemo(
		() =>
			mediaType === 'video' ||
			(typeof mediaMime === 'string' &&
				mediaMime.indexOf('video/') === 0) ||
			(typeof mediaUrl === 'string' &&
				/\.(mp4|webm|ogv|ogg)(?:[\?#]|$)/i.test(mediaUrl)),
		[mediaType, mediaMime, mediaUrl]
	);

	const blockToolbarForMedia = useMemo(() => {
		if (!showMedia || !mediaUrl) {
			return null;
		}

		return (
			<BlockControls group="block">
				<MediaReplaceFlow
					name={__('Replace Media File', 'timeline-full-widget')}
					onSelect={onSelect}
					accept="image/*,video/*"
					allowedTypes={['image', 'video']}
					mediaId={mediaId}
					mediaURL={mediaUrl}
				/>

				<ToolbarButton
					onClick={() =>
						setAttributes({
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
						})
					}
					isDisabled={!mediaUrl}
					icon="trash"
					label={__('Remove Media File', 'timeline-full-widget')}
				/>

				<ToolbarButton
					icon={linkIcon}
					label={__('Link for media', 'timeline-full-widget')}
					onClick={() => setIsMediaLinkPickerOpen((prev) => !prev)}
					isPressed={isMediaLinkPickerOpen}
				/>

				<ToolbarButton
					icon={unlinkIcon}
					label={__('Remove media link', 'timeline-full-widget')}
					onClick={() => {
						setAttributes({
							mediaLinkUrl: '',
							mediaLinkTarget: '',
							mediaLinkRel: '',
							isMediaWrapToLink: false,
						});
						setIsMediaLinkPickerOpen(false);
					}}
					isDisabled={!mediaLinkUrl}
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
	]);

	const mediaLinkPopover = useMemo(() => {
		if (!isMediaLinkPickerOpen || !showMedia || !mediaUrl) {
			return null;
		}

		return (
			<Popover
				position="bottom center"
				onClose={() => setIsMediaLinkPickerOpen(false)}
			>
				<LinkControl
					value={{
						url: mediaLinkUrl,
						opensInNewTab: mediaLinkTarget === '_blank',
					}}
					settings={[
						{
							id: 'opensInNewTab',
							title: __('Open in new tab', 'timeline-full-widget'),
						},
					]}
					onChange={(newVal = {}) => {
						const nextUrl = newVal.url || '';
						const nextTarget = newVal.opensInNewTab ? '_blank' : '';
						const nextAttrs = getSafeLinkAttributes(
							nextUrl,
							'',
							nextTarget
						);
						setAttributes({
							mediaLinkUrl: nextAttrs.href || '',
							mediaLinkTarget: nextAttrs.target || '',
							mediaLinkRel: nextAttrs.rel || '',
							isMediaWrapToLink: !!nextAttrs.href,
						});
					}}
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
	]);

	const blockToolbarForStyleInheritance = useMemo(() => {
		if (timelineItemSiblings.length < 2) {
			return null;
		}
		return (
			<BlockControls group="block">
				<ToolbarButton
					label={__(
						'Apply item styles to other items',
						'timeline-full-widget'
					)}
					icon="admin-customizer"
					onClick={applyStylesToSiblingItems}
				/>
			</BlockControls>
		);
	}, [applyStylesToSiblingItems, timelineItemSiblings.length]);

	const selectedBlockClientId = useSelect(
		(s) => s('core/block-editor').getSelectedBlockClientId(),
		[]
	);


	const mediaLinkProps = useMemo(
		() =>
			getSafeLinkAttributes(
				mediaLinkUrl,
				mediaLinkRel,
				mediaLinkTarget
			),
		[mediaLinkUrl, mediaLinkRel, mediaLinkTarget]
	);

	const mediaPreviewNode = useMemo(() => {
		if (!showMedia || !mediaUrl) {
			return null;
		}

		const mediaElement = (
			<div
				className={`timeline_pic ${isBlobURL(mediaUrl) ? 'image-loading' : 'loaded'}`}
			>
				{isVideo ? (
					<video
						id={mediaId ? `video_${mediaId}` : undefined}
						autoPlay
						muted
						loop
						playsInline
						preload="metadata"
						poster={videoPoster || undefined}
						style={{
							width: mediaWidth || '100%',
							height: 'auto',
						}}
					>
						<source src={mediaUrl} type={mediaMime || undefined} />
						{__(
							'Your browser does not support the video tag.',
							'timeline-full-widget'
						)}
					</video>
				) : (
					<img
						id={mediaId ? `img_${mediaId}` : undefined}
						src={mediaUrl}
						alt={imageAlt || ''}
						style={{
							width: mediaWidth || undefined,
							height: 'auto',
						}}
					/>
				)}
				{isBlobURL(mediaUrl) && <Spinner />}
			</div>
		);

		if (isMediaWrapToLink && mediaLinkProps.href) {
			return (
				<div
					className="timeline-media-link"
					role="link"
					aria-label={__('Linked media preview', 'timeline-full-widget')}
				>
					{mediaElement}
				</div>
			);
		}

		return mediaElement;
	}, [
		showMedia,
		mediaUrl,
		isVideo,
		mediaId,
		videoPoster,
		mediaWidth,
		mediaMime,
		imageAlt,
		isMediaWrapToLink,
		mediaLinkProps,
	]);

	return (
		<>
			<InspectorControls>
				<PanelBody
					title={__('Block Settings', 'timeline-full-widget')}
					initialOpen={false}
				>
					<SelectControl
						label={__('Title Tag', 'timeline-full-widget')}
						value={titleTag}
						options={[
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
						]}
						onChange={(val) => setAttributes({ titleTag: val })}
						__next40pxDefaultSize={true}
						__nextHasNoMarginBottom={true}
					/>

					<PanelColorSettings
						title={__('Color settings', 'timeline-full-widget')}
						colorSettings={[
							{
								value: titleColor,
								onChange: (color) =>
									setAttributes({ titleColor: color }),
								label: __(
									'Title color',
									'timeline-full-widget'
								),
							},
							{
								value: descriptionColor,
								onChange: (color) =>
									setAttributes({ descriptionColor: color }),
								label: __(
									'Description color',
									'timeline-full-widget'
								),
							},
							{
								value: itemBackgroundColor,
								onChange: (color) =>
									setAttributes({
										itemBackgroundColor: color,
									}),
								label: __(
									'Item background color',
									'timeline-full-widget'
								),
							},
						]}
					/>
				</PanelBody>
				<MediaSettingsPanel
					showMedia={showMedia}
					mediaUrl={mediaUrl}
					mediaMime={mediaMime}
					videoPoster={videoPoster}
					imageAlt={imageAlt}
					mediaWidth={mediaWidth}
					setAttributes={setAttributes}
					markerUnique={markerUnique}
					markerAlt={markerAlt}
					markerUrl={markerUrl}
					markerId={markerId}
				/>

				<TitleTypographyPanel
					attrs={{
						titleFontSize,
						titleFontUnit,
						titleFontWeight,
						titleMarginTop,
						titleMarginBottom,
						titleLineHeight,
						titleFontFamily,
					}}
					setAttributes={setAttributes}
				/>
			</InspectorControls>

			{blockToolbarForMedia}
			{mediaLinkPopover}
			{blockToolbarForStyleInheritance}

			{activeField === 'sideText' &&
				selectedBlockClientId === clientId && (
					<BlockControls group="block">
						<AlignmentToolbar
							value={sideTextAlign}
							onChange={(newAlign) =>
								setAttributes({
									sideTextAlign: newAlign || 'left',
								})
							}
						/>
					</BlockControls>
				)}

			<li {...blockProps}>
				<div className="timeline-side">
					{showOtherSide && (
						<RichText
							tagName="p"
							className={`t-text-align-${sideTextAlign}`}
							value={otherSiteTitle}
							onChange={(val) =>
								setAttributes({ otherSiteTitle: val })
							}
							onFocus={() => setActiveField('sideText')}
							placeholder={__(
								'Add other side text',
								'timeline-full-widget'
							)}
						/>
					)}
				</div>

				{showMarker && (
					<div
						className="tl-mark"
						id={mediaId ? `marker_${markerId}` : undefined}
					>
						{markerUnique && markerUrl && (
							<img src={markerUrl} alt={markerAlt || 'marker'} />
						)}
					</div>
				)}

				<div
					className="timeline-panel"
					{...(itemBackgroundColor
						? { style: { backgroundColor: itemBackgroundColor } }
						: {})}
				>
					<div className="tl-content">
						<div className="tl-desc">
							{showMedia && mediaUrl ? mediaPreviewNode : (
								showMedia && (
									<MediaPlaceholder
										onSelect={onSelect}
										accept="image/*"
										allowedTypes={['image', 'video']}
									/>
								)
							)}

							<Title
								clientId={clientId}
								title={title}
								titleTag={titleTag}
								titleAlign={titleAlign}
								titleInlineStyle={titleInlineStyle}
								titleFontSize={titleFontSize}
								titleFontWeight={titleFontWeight}
								titleMarginTop={titleMarginTop}
								titleMarginBottom={titleMarginBottom}
								titleLineHeight={titleLineHeight}
								titleColor={titleColor}
								titleFontFamily={titleFontFamily}
								linkUrl={linkUrl}
								linkTarget={linkTarget}
								rel={rel}
								setAttributes={setAttributes}
								activeField={activeField}
								setActiveField={setActiveField}
							/>

							<div
								className="tl-desc-short"
								{...(descriptionColor
									? { style: { color: descriptionColor } }
									: {})}
							>
								<InnerBlocks
									allowedBlocks={[
										'core/paragraph',
										'core/heading',
										'core/list',
									]}
								/>
								{/*<InnerBlocks template={[['core/freeform']]} />*/}
							</div>
						</div>
					</div>
				</div>
			</li>
		</>
	);
}
export default Edit;
