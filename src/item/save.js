import { useBlockProps, RichText } from '@wordpress/block-editor';
import { getComputedRel } from './utils';

export default function Save({ attributes }) {
    const { title, titleTag, linkUrl, linkTarget, rel, description, position } = attributes;

    return (
        <li {...useBlockProps.save({ className: position })}>
            <div className="timeline-side"></div>
            <div className="tl-trigger"></div>
            <div className="tl-circ"></div>
            <div className="timeline-panel">
                <div className="tl-content">
                    <div className="tl-desc">
                        { titleTag === 'a' ? (
                            <RichText.Content
                                tagName="a"
                                className="tl-title"
                                value={title}
                                href={linkUrl || undefined}
                                target={linkTarget || undefined}

                            />
                        ) : (
                            <RichText.Content
                                tagName={titleTag}
                                className="tl-title"
                                value={title}
                            />
                        )}

                        <RichText.Content
                            tagName="div"
                            className="tl-desc-short"
                            value={description}
                        />
                    </div>
                </div>
            </div>
        </li>
    );
}
