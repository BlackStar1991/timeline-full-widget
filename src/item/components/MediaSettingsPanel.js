// item/components/MediaSettingsPanel.js
import {
	PanelBody,
	TextControl,
	ToolbarButton,
	Button,
	__experimentalUnitControl as UnitControl,
} from '@wordpress/components';
import { MediaPlaceholder, MediaReplaceFlow } from '@wordpress/block-editor';
import { isBlobURL } from '@wordpress/blob';
import { __ } from '@wordpress/i18n';

const MEDIA_WIDTH_UNITS = [{ value: '%', label: '%' }];

function WidthOfMedia({ value, onChange }) {
	return (
		<UnitControl
			value={value}
			onChange={onChange}
			label={__('Width of media', 'timeline-full-widget')}
			units={MEDIA_WIDTH_UNITS}
			__next40pxDefaultSize={true}
		/>
	);
}

function VideoPosterControl({ videoPoster, setAttributes }) {
	return (
		<PanelBody
			title={__('Video poster', 'timeline-full-widget')}
			initialOpen={false}
		>
			{videoPoster ? (
				<div className="video-poster-preview">
					<img
						src={videoPoster}
						alt={__('Video poster', 'timeline-full-widget')}
						style={{ maxWidth: '100%' }}
					/>
					<ToolbarButton
						icon="trash"
						label={__('Remove poster', 'timeline-full-widget')}
						onClick={() => setAttributes({ videoPoster: '' })}
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
	);
}

function ImageAltControl({ imageAlt, setAttributes }) {
	return (
		<TextControl
			label={__('Image Alt', 'timeline-full-widget')}
			value={imageAlt}
			help={__('Add alt text for the image.', 'timeline-full-widget')}
			onChange={(val) => setAttributes({ imageAlt: val })}
			__nextHasNoMarginBottom
		/>
	);
}

function UniqueMarkerPanel({ markerUrl, markerId, markerAlt, setAttributes }) {
	return (
		<PanelBody
			title={__('Unique marker for this item', 'timeline-full-widget')}
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
	);
}

export default function MediaSettingsPanel({
	showMedia,
	mediaUrl,
	mediaMime,
	videoPoster,
	imageAlt,
	mediaWidth,
	setAttributes,
	markerUnique,
	markerUrl,
	markerId,
	markerAlt,
}) {
	if (!showMedia && !markerUnique) {
		return null;
	}

	const hasMedia = showMedia && mediaUrl && !isBlobURL(mediaUrl);

	const isVideo =
		(typeof mediaMime === 'string' && mediaMime.indexOf('video/') === 0) ||
		(typeof mediaUrl === 'string' &&
			/\.(mp4|webm|ogv|ogg)(?:[\?#]|$)/i.test(mediaUrl));

	return (
		<PanelBody
			title={__('Media Settings', 'timeline-full-widget')}
			initialOpen={false}
		>
			{hasMedia && (
				<>
					{isVideo ? (
						<VideoPosterControl
							videoPoster={videoPoster}
							setAttributes={setAttributes}
						/>
					) : (
						<ImageAltControl
							imageAlt={imageAlt}
							setAttributes={setAttributes}
						/>
					)}

					<WidthOfMedia
						value={mediaWidth}
						onChange={(val) => setAttributes({ mediaWidth: val })}
					/>
				</>
			)}

			{markerUnique && (
				<UniqueMarkerPanel
					markerUrl={markerUrl}
					markerId={markerId}
					markerAlt={markerAlt}
					setAttributes={setAttributes}
				/>
			)}
		</PanelBody>
	);
}
