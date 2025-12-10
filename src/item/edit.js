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
} from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import {
	PanelBody,
	SelectControl,
	ToolbarButton,
	Spinner,
} from '@wordpress/components';
import { isBlobURL } from '@wordpress/blob';
import { useState, useEffect, useMemo, useCallback } from '@wordpress/element';

import Title from './title';
import { parseStyleString } from './utils';

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
		showMedia,
		mediaUrl,
		markerAlt,
		videoPoster,
		imageAlt,
		mediaType,
		mediaMime,
		mediaId,
		onTheOneSide,
		titleInlineStyle,
		titleFontSize,
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

	/* block-index/parent info */
	const { blockIndex, parentDirection } = useSelect(
		(select) => {
			const editor = select('core/block-editor');
			const parentId = editor.getBlockRootClientId(clientId);
			if (!parentId) return { blockIndex: 0, parentDirection: undefined };
			const innerBlocks = editor.getBlocks(parentId);
			const idx = innerBlocks.findIndex((b) => b.clientId === clientId);
			const parent = editor.getBlock(parentId);
			return {
				blockIndex: idx,
				parentDirection: parent?.attributes?.direction,
			};
		},
		[clientId]
	);

	const direction =
		typeof parentDirection !== 'undefined'
			? parentDirection
			: attributes.direction;

	const computedFallbackPosition = useMemo(() => {
		if (typeof direction === 'undefined') return 'timeline-left';
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
		if (position !== computedPosition) updates.position = computedPosition;

		// pull inline style values once
		const parsed = parseStyleString(titleInlineStyle || '');
		if (parsed.fontSize && !titleFontSize) {
			const m = parsed.fontSize.match(/^([\d.]+)(px|rem|em|%)?$/);
			updates.titleFontSize = m ? m[1] : parsed.fontSize;
		}
		if (parsed.fontWeight && !titleFontWeight)
			updates.titleFontWeight = parsed.fontWeight;
		if (parsed.marginTop && !titleMarginTop)
			updates.titleMarginTop = parsed.marginTop.replace(/px$/, '');
		if (parsed.marginBottom && !titleMarginBottom)
			updates.titleMarginBottom = parsed.marginBottom.replace(/px$/, '');
		if (parsed.lineHeight && !titleLineHeight)
			updates.titleLineHeight = parsed.lineHeight;
		if (parsed.color && !titleColor) updates.titleColor = parsed.color;

		if (Object.keys(updates).length) setAttributes(updates);
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
		if (!showMedia || !mediaUrl) return null;
		return (
			<BlockControls>
				<MediaReplaceFlow
					name={__('Replace Media File', 'timeline-full-widget')}
					onSelect={onSelect}
					accept="image/*"
					allowedTypes={['image', 'video']}
					mediaId={mediaId}
					mediaUrl={mediaUrl}
					mediaAlt={imageAlt}
				/>
				<ToolbarButton
					onClick={() =>
						setAttributes({
							mediaId: undefined,
							mediaUrl: undefined,
							imageAlt: '',
							mediaType: '',
							mediaMime: '',
						})
					}
					isDisabled={!mediaUrl}
					icon="trash"
					title={__('Remove Media File', 'timeline-full-widget')}
				>
					{__('Remove Media File', 'timeline-full-widget')}
				</ToolbarButton>
			</BlockControls>
		);
	}, [showMedia, mediaUrl, onSelect, mediaId, imageAlt, setAttributes]);

	const selectedBlockClientId = useSelect(
		(s) => s('core/block-editor').getSelectedBlockClientId(),
		[]
	);

	return (
		<>
			<InspectorControls>
				<PanelBody title={__('Block Settings', 'timeline-full-widget')}>
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
					setAttributes={setAttributes}
					markerUnique={markerUnique}
					markerAlt={markerAlt}
					markerUrl={markerUrl}
					markerId={markerId}
				/>

				<TitleTypographyPanel
					attrs={{
						titleFontSize,
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
							{showMedia && mediaUrl ? (
								<div
									className={`timeline_pic ${isBlobURL(mediaUrl) ? 'image-loading' : 'loaded'}`}
								>
									{isVideo ? (
										<video
											id={
												mediaId
													? `video_${mediaId}`
													: undefined
											}
											autoPlay
											muted
											loop
											playsInline
											preload="metadata"
											poster={videoPoster || undefined}
											style={{
												width: '100%',
												height: 'auto',
											}}
										>
											<source
												src={mediaUrl}
												type={mediaMime || undefined}
											/>
											{__(
												'Your browser does not support the video tag.',
												'timeline-full-widget'
											)}
										</video>
									) : (
										<img
											id={
												mediaId
													? `img_${mediaId}`
													: undefined
											}
											src={mediaUrl}
											alt={imageAlt || ''}
										/>
									)}
									{isBlobURL(mediaUrl) && <Spinner />}
								</div>
							) : (
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
