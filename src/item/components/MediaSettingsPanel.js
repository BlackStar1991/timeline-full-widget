// item/components/MediaSettingsPanel.js
import { PanelBody, TextControl, ToolbarButton } from '@wordpress/components';
import { MediaPlaceholder } from '@wordpress/block-editor';
import { isBlobURL } from '@wordpress/blob';
import { __ } from '@wordpress/i18n';

export default function MediaSettingsPanel({ showMedia, mediaUrl, mediaMime, videoPoster, imageAlt, setAttributes }) {
    if ( ! showMedia || ! mediaUrl || isBlobURL(mediaUrl) ) return null;
    const isVideo = (typeof mediaMime === 'string' && mediaMime.indexOf('video/') === 0) || (typeof mediaUrl === 'string' && /\.(mp4|webm|ogv|ogg)(?:[\?#]|$)/i.test(mediaUrl));

    return (
        <PanelBody title={__('Media Settings', 'timeline-full-widget')}>
            { isVideo ? (
                <PanelBody title={__('Video poster','timeline-full-widget')}>
                    { videoPoster ? (
                        <div className="video-poster-preview">
                            <img src={videoPoster} alt={__('Video poster','timeline-full-widget')} style={{ maxWidth: '100%' }} />
                            <ToolbarButton icon="trash" label={__('Remove poster','timeline-full-widget')} onClick={() => setAttributes({ videoPoster: '' })} />
                        </div>
                    ) : (
                        <MediaPlaceholder
                            onSelect={(poster) => setAttributes({ videoPoster: poster.url })}
                            accept="image/*"
                            allowedTypes={['image']}
                            labels={{ title: __('Select video poster','timeline-full-widget') }}
                        />
                    )}
                </PanelBody>
            ) : (
                <TextControl
                    label={__('Image Alt', 'timeline-full-widget')}
                    value={imageAlt}
                    help={__('Add alt text for the image.', 'timeline-full-widget')}
                    onChange={(val) => setAttributes({ imageAlt: val })}
                />
            ) }
        </PanelBody>
    );
}
