import { useBlockProps, RichText, InspectorControls, BlockControls } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { PanelBody, SelectControl, ToolbarGroup, ToolbarButton, Popover } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { link as linkIcon } from '@wordpress/icons';
import { LinkControl } from '@wordpress/block-editor';
// import { getComputedRel } from './utils'; TODO rel dosen't work / add true to rel

export default function Edit({ clientId, attributes, setAttributes }) {
    const { title, titleTag, linkUrl, linkTarget, rel, description } = attributes;
    const [isLinkPickerOpen, setIsLinkPickerOpen] = useState(false);

    // Определяем позицию (левая / правая колонка)
    const blockIndex = useSelect(
        (select) => {
            const parentId = select('core/block-editor').getBlockRootClientId(clientId);
            if (!parentId) return 0;
            const innerBlocks = select('core/block-editor').getBlocks(parentId);
            return innerBlocks.findIndex((b) => b.clientId === clientId);
        },
        [clientId]
    );
    const liClass = blockIndex % 2 === 0 ? 'timeline-left' : 'timeline-inverted';
    if (attributes.position !== liClass) {
        setAttributes({ position: liClass });
    }

    const blockProps = useBlockProps({ tagName: 'li', className: liClass });

    return (
        <>
            <InspectorControls>
                <PanelBody title={__('Title Settings', 'za')}>
                    <SelectControl
                        label={__('Title Tag', 'za')}
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
                    />
                </PanelBody>
            </InspectorControls>

            {titleTag === 'a' && (
                <BlockControls>
                    <ToolbarGroup>
                        <ToolbarButton
                            icon={linkIcon}
                            label={__('Edit link', 'za')}
                            onClick={() => setIsLinkPickerOpen((prev) => !prev)}
                            isPressed={isLinkPickerOpen}
                        />
                    </ToolbarGroup>
                    {isLinkPickerOpen && (
                        <Popover position="bottom center" onClose={() => setIsLinkPickerOpen(false)}>
                            <LinkControl
                                value={{
                                    url: linkUrl,
                                    opensInNewTab: linkTarget === '_blank',
                                    rel,
                                }}
                                settings={[
                                    { id: 'opensInNewTab', title: __('Open in new tab', 'za') },
                                    { id: 'rel', title: __('Add rel attribute', 'za') },
                                ]}
                                onChange={(newVal) => {
                                    setAttributes({
                                        linkUrl: newVal.url,
                                        linkTarget: newVal.opensInNewTab ? '_blank' : '',
                                        rel: newVal.rel && newVal.rel !== 'true' ? newVal.rel : '',
                                    });
                                }}
                            />
                        </Popover>
                    )}
                </BlockControls>
            )}

            <li {...blockProps}>
                <div className="timeline-side"></div>
                <div className="tl-trigger"></div>
                <div className="tl-circ"></div>
                <div className="timeline-panel">
                    <div className="tl-content">
                        <div className="tl-desc">
                            { titleTag === 'a' ? (
                                <RichText
                                    tagName="a"
                                    className="tl-title"
                                    value={title}
                                    allowedFormats={[]}
                                    onChange={(val) => setAttributes({ title: val })}
                                    placeholder={__('Add link text…', 'za')}
                                    href={linkUrl || undefined}
                                    target={linkTarget || undefined}

                                />
                            ) : (
                                <RichText
                                    tagName={titleTag}
                                    className="tl-title"
                                    value={title}
                                    allowedFormats={[]}
                                    onChange={(val) => setAttributes({ title: val })}
                                />
                            )}

                            <RichText
                                tagName="div"
                                className="tl-desc-short"
                                allowedFormats={[]}
                                value={description}
                                placeholder={__('Your Description', 'za')}
                                onChange={(val) => setAttributes({ description: val })}
                            />
                        </div>
                    </div>
                </div>
            </li>
        </>
    );
}
