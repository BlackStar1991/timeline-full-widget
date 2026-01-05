// item/components/MediaSettingsPanel.js
import {
	PanelBody,
	TextControl,
	ToolbarButton,
	Button,
} from '@wordpress/components';
import { MediaPlaceholder, MediaReplaceFlow } from '@wordpress/block-editor';
import { isBlobURL } from '@wordpress/blob';
import { __ } from '@wordpress/i18n';
import React from 'react';

export default function MediaSettingsPanel({
	showMedia,
	mediaUrl,
	mediaMime,
	videoPoster,
	imageAlt,
	setAttributes,
	showMarker,
	markerUnique,
	markerUrl,
	markerId,
	markerAlt,
}) {
	if (!showMedia && !markerUnique) return null;

	const isVideo =
		(typeof mediaMime === 'string' && mediaMime.indexOf('video/') === 0) ||
		(typeof mediaUrl === 'string' &&
			/\.(mp4|webm|ogv|ogg)(?:[\?#]|$)/i.test(mediaUrl));

	return (
		<PanelBody title={__('Media Settings', 'timeline-full-widget')}>
			{showMedia && mediaUrl && !isBlobURL(mediaUrl) && (
				<>
					{isVideo ? (
						<PanelBody
							title={__('Video poster', 'timeline-full-widget')}
						>
							{videoPoster ? (
								<div className="video-poster-preview">
									<img
										src={videoPoster}
										alt={__(
											'Video poster',
											'timeline-full-widget'
										)}
										style={{ maxWidth: '100%' }}
									/>
									<ToolbarButton
										icon="trash"
										label={__(
											'Remove poster',
											'timeline-full-widget'
										)}
										onClick={() =>
											setAttributes({ videoPoster: '' })
										}
									/>
								</div>
							) : (
								<MediaPlaceholder
									onSelect={(poster) =>
										setAttributes({
											videoPoster: poster.url,
										})
									}
									accept="image/*"
									allowedTypes={['image']}
									labels={{
										title: __(
											'Select video poster',
											'timeline-full-widget'
										),
									}}
								/>
							)}
						</PanelBody>
					) : (
						<TextControl
							label={__('Image Alt', 'timeline-full-widget')}
							value={imageAlt}
							help={__(
								'Add alt text for the image.',
								'timeline-full-widget'
							)}
							onChange={(val) => setAttributes({ imageAlt: val })}
						/>
					)}
				</>
			)}

			{markerUnique && (
				<PanelBody
					title={__(
						'Unique marker for this item',
						'timeline-full-widget'
					)}
					initialOpen={true}
				>
					{markerUrl ? (
						<div style={{ display: 'grid', gap: 8 }}>
							<img
								src={markerUrl}
								alt={markerAlt || ''}
								style={{ maxWidth: '100%', height: 'auto' }}
							/>
							<MediaReplaceFlow
								name={__(
									'Replace marker image',
									'timeline-full-widget'
								)}
								onSelect={(media) =>
									setAttributes({
										markerUrl: media.url,
										markerId: media.id,
										markerAlt: media.alt || '',
									})
								}
								accept="image/*"
								allowedTypes={['image']}
								mediaId={markerId}
								mediaUrl={markerUrl}
							/>
							<Button
								isDestructive
								onClick={() =>
									setAttributes({
										markerUrl: '',
										markerId: undefined,
										markerAlt: '',
									})
								}
							>
								{__('Remove marker', 'timeline-full-widget')}
							</Button>
						</div>
					) : (
						<MediaPlaceholder
							onSelect={(media) =>
								setAttributes({
									markerUrl: media.url,
									markerId: media.id,
									markerAlt: media.alt || '',
								})
							}
							accept="image/*"
							allowedTypes={['image']}
							labels={{
								title: __(
									'Select marker image',
									'timeline-full-widget'
								),
							}}
						/>
					)}
					<p>
						{__(
							'Note: this image will be used only when "Unique Marker" (Style) is set to Yes. Recommend width size <=50px',
							'timeline-full-widget'
						)}
					</p>
				</PanelBody>
			)}
		</PanelBody>
	);
}
