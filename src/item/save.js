import { RichText, InnerBlocks } from '@wordpress/block-editor';
import { isBlobURL } from '@wordpress/blob';
import { getSafeLinkAttributes, buildStyleObject } from './utils';
import { createElement as el } from '@wordpress/element';

export default function Save({ attributes }) {
	const {
		textAlignClass,
		title,
		titleTag,
		titleInlineStyle,
		titleColor,
		titleFontSize,
		titleFontWeight,
		titleAlign,
		titleMarginTop,
		titleMarginBottom,
		descriptionColor,
		itemBackgroundColor,
		linkUrl,
		linkTarget,
		rel,
		position,
		showMedia,
		showMarker,
		mediaId,
		mediaUrl,
		imageAlt,
		videoPoster,
		mediaType,
		mediaMime,
		otherSiteTitle,
		showOtherSide,
		sideTextAlign,
		markerUnique,
		markerAlt,
		markerUrl,
		markerId,
	} = attributes;

	const classes = ['timeline-item', position];
	if (textAlignClass) classes.push(`t-text-align-${textAlignClass}`);
	const className = Array.from(new Set(classes)).join(' ');
	const linkProps = getSafeLinkAttributes(linkUrl, rel, linkTarget);
	const styleObj = buildStyleObject({
		titleInlineStyle: titleInlineStyle,
		titleFontSize: titleFontSize,
		titleFontWeight: titleFontWeight,
		titleMarginTop: titleMarginTop,
		titleMarginBottom: titleMarginBottom,
		titleColor: titleColor,
	});

	const isVideoByMime =
		typeof mediaMime === 'string' && mediaMime.indexOf('video/') === 0;
	const isVideoByType = mediaType === 'video';
	const isVideoByExt =
		typeof mediaUrl === 'string' &&
		/\.(mp4|webm|ogv|ogg)(?:[\?#]|$)/i.test(mediaUrl);
	const isVideo = isVideoByType || isVideoByMime || isVideoByExt;

	let sourceType = mediaMime || undefined;
	if (!sourceType && isVideo && mediaUrl) {
		const extMatch = mediaUrl.match(/\.([0-9a-z]+)(?:[\?#]|$)/i);
		if (extMatch) {
			const ext = extMatch[1].toLowerCase();
			if (ext === 'mp4') sourceType = 'video/mp4';
			if (ext === 'webm') sourceType = 'video/webm';
			if (ext === 'ogv' || ext === 'ogg') sourceType = 'video/ogg';
		}
	}

	return (
		<li className={className}>
			<div className="timeline-side">
				{showOtherSide && (
					<RichText.Content
						tagName="p"
						className={`t-text-align-${sideTextAlign} `}
						value={otherSiteTitle}
					/>
				)}
			</div>
			<div className="tl-trigger"></div>
			{showMarker && (
				<div
					className="tl-mark"
					id={mediaId ? `marker_${markerId}` : undefined}
				>
					{markerUnique && markerUrl && (
						<img src={markerUrl} alt={markerAlt || ''} />
					)}
				</div>
			)}
			<div
				className="timeline-panel"
				{...(itemBackgroundColor
					? {
							style: {
								backgroundColor: itemBackgroundColor,
							},
						}
					: {})}
			>
				<div className="tl-content">
					<div className="tl-desc">
						{showMedia && mediaUrl && (
							<div
								className={`timeline_pic ${
									isBlobURL(mediaUrl)
										? 'image-loading'
										: 'loaded'
								}`}
							>
								{isVideo ? (
									el(
										'video',
										{
											id: mediaId
												? `video_${mediaId}`
												: undefined,
											poster: videoPoster || undefined,
											autoPlay: true,
											muted: true,
											loop: true,
											playsInline: true,
											preload: 'metadata',
											style: {
												width: '100%',
												height: 'auto',
											},
										},
										// source
										mediaUrl
											? el('source', {
													src: mediaUrl,
													type: sourceType,
												})
											: null,
										'Your browser does not support the video tag.'
									)
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
							</div>
						)}

						{titleTag === 'a' ? (
							<RichText.Content
								tagName="a"
								className={`t-text-align-${titleAlign} tl-title`}
								value={title}
								{...linkProps}
								style={styleObj}
							/>
						) : (
							<RichText.Content
								tagName={titleTag}
								className={`t-text-align-${titleAlign} tl-title`}
								value={title}
								style={styleObj}
							/>
						)}

						<div
							className="tl-desc-short"
							{...(descriptionColor
								? { style: { color: descriptionColor } }
								: {})}
						>
							<InnerBlocks.Content />
						</div>
					</div>
				</div>
			</div>
		</li>
	);
}
