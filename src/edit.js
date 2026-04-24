import {
    useBlockProps,
    InnerBlocks,
    InspectorControls,
    PanelColorSettings,
} from '@wordpress/block-editor';
import {PanelBody, RangeControl, ToggleControl} from '@wordpress/components';
import {__} from '@wordpress/i18n';
import {useSelect, useDispatch} from '@wordpress/data';
import {
    useEffect,
    useCallback,
    useRef,
    useLayoutEffect,
} from '@wordpress/element';

import {convertMarginAttrToStyle} from './item/utils';
import {
    initTimelineAnimation,
    initAllWidgets,
} from '../assets/js/core/animation.js';

export default function Edit({attributes, setAttributes, clientId}) {
    const {
        showMedia = true,
        direction = false,
        onTheOneSide,
        lineColor,
        lineWidth = 4,
        markerColor,
        showOtherSide,
        animationTimeline,
        animationLineColor,
        showMarker,
        animationMarker,
        markerUnique,
        animationMarkerColor,
        animationOtherSideSticky,
    } = attributes;

    const hasAnimatedMarkers =
        showMarker && animationTimeline && animationMarker;

    const wrapperRef = useRef(null);
    const {updateBlockAttributes} = useDispatch('core/block-editor');

    const innerBlocks = useSelect(
        (select) => select('core/block-editor').getBlocks(clientId) || [],
        [clientId]
    );

    const syncToChildren = useCallback(
        (attrs = {}) => {
            if (!innerBlocks.length) {
                return;
            }

            const parentDirection = attrs.direction ?? direction;
            const parentOneSide = attrs.onTheOneSide ?? onTheOneSide;

            innerBlocks.forEach((block, index) => {
                const updates = {...attrs};

                if (parentOneSide) {
                    updates.position = parentDirection
                        ? 'timeline-inverted'
                        : 'timeline-left';
                } else {
                    const isEven = index % 2 === 0;
                    updates.position = parentDirection
                        ? isEven
                            ? 'timeline-inverted'
                            : 'timeline-left'
                        : isEven
                            ? 'timeline-left'
                            : 'timeline-inverted';
                }

                const needsUpdate = Object.keys(updates).some(
                    (key) => block.attributes?.[key] !== updates[key]
                );

                if (needsUpdate) {
                    updateBlockAttributes(block.clientId, updates);
                }
            });
        },
        [innerBlocks, updateBlockAttributes, direction, onTheOneSide]
    );

    useLayoutEffect(() => {
        syncToChildren({
            showOtherSide,
            showMedia,
            lineColor,
            lineWidth,
            markerColor,
            direction,
            onTheOneSide,
            animationTimeline,
            animationLineColor,
            showMarker,
            markerUnique,
            animationMarker,
            animationMarkerColor,
            animationOtherSideSticky,
        });
    }, [
        showOtherSide,
        showMedia,
        lineColor,
        lineWidth,
        markerColor,
        direction,
        onTheOneSide,
        animationTimeline,
        animationLineColor,
        showMarker,
        markerUnique,
        animationMarker,
        animationMarkerColor,
        animationOtherSideSticky,
        syncToChildren,
    ]);

    useEffect(() => {
        if (!showMarker && animationMarker) {
            setAttributes({animationMarker: false});
        }

        if (!animationTimeline || !wrapperRef.current) {
            return undefined;
        }

        let destroyFn;

        try {
            const el = wrapperRef.current;
            if (typeof initTimelineAnimation === 'function') {
                destroyFn = initTimelineAnimation(el);
            } else if (typeof initAllWidgets === 'function') {
                destroyFn = initAllWidgets(el);
            }
        } catch (err) {
            console.error('Timeline animation init failed', err);
        }

        return () => {
            if (typeof destroyFn === 'function') {
                destroyFn();
            }
        };
    }, [
        animationTimeline,
        innerBlocks.length,
        showMarker,
        animationMarker,
        setAttributes,
    ]);

    const marginStyle = convertMarginAttrToStyle(attributes.style);
    const outerProps = useBlockProps({style: marginStyle});

    return (
        <div {...outerProps}>
            <div className="timeline-wrapper"
                 ref={wrapperRef}
                 style={{
                     '--timeline-line-color': lineColor || '#F6F6F8',
                     '--timeline-line-width': `${Math.max(1, Number(lineWidth) || 4)}px`,
                     '--timeline-marker-color': markerColor || '#F6F6F8',
                     '--timeline-line-active-color': animationLineColor || '#F37321',
                     '--timeline-marker-active-color': animationMarkerColor || '#F37321',
                 }}>
                <InspectorControls>
                    <PanelBody title={__('Timeline Settings', 'timeline-full-widget')}>
                        {[
                            {
                                label: __(
                                    'Display Images',
                                    'timeline-full-widget'
                                ),
                                help: showMedia
                                    ? __('On', 'timeline-full-widget')
                                    : __('Off', 'timeline-full-widget'),
                                checked: showMedia,
                                onChange: (val) =>
                                    setAttributes({showMedia: val}),
                            },
                            {
                                label: __(
                                    'Timeline Direction',
                                    'timeline-full-widget'
                                ),
                                help: direction
                                    ? __('Right', 'timeline-full-widget')
                                    : __('Left', 'timeline-full-widget'),
                                checked: direction,
                                onChange: (val) =>
                                    setAttributes({direction: val}),
                            },
                            {
                                label: __(
                                    'Single Side Layout',
                                    'timeline-full-widget'
                                ),
                                help: onTheOneSide
                                    ? __('Yes', 'timeline-full-widget')
                                    : __('No', 'timeline-full-widget'),
                                checked: onTheOneSide,
                                onChange: (val) =>
                                    setAttributes({onTheOneSide: val}),
                            },
                            {
                                label: __(
                                    'Display Opposite Side',
                                    'timeline-full-widget'
                                ),
                                help: showOtherSide
                                    ? __('Yes', 'timeline-full-widget')
                                    : __('No', 'timeline-full-widget'),
                                checked: showOtherSide,
                                onChange: (val) =>
                                    setAttributes({showOtherSide: val}),
                            },
                            {
                                label: __(
                                    'Animate Timeline Line',
                                    'timeline-full-widget'
                                ),
                                help: animationTimeline
                                    ? __('Yes', 'timeline-full-widget')
                                    : __('No', 'timeline-full-widget'),
                                checked: animationTimeline,
                                onChange: (val) =>
                                    setAttributes({animationTimeline: val}),
                            },
                            {
                                label: __(
                                    'Show Timeline Marker',
                                    'timeline-full-widget'
                                ),
                                help: showMarker
                                    ? __('Yes', 'timeline-full-widget')
                                    : __('No', 'timeline-full-widget'),
                                checked: showMarker,
                                onChange: (val) =>
                                    setAttributes({showMarker: val}),
                            },
                            showOtherSide && {
                                label: __(
                                    'Other Side Sticky',
                                    'timeline-full-widget'
                                ),
                                help: animationOtherSideSticky
                                    ? __('Yes', 'timeline-full-widget')
                                    : __('No', 'timeline-full-widget'),
                                checked: animationOtherSideSticky,
                                onChange: (val) =>
                                    setAttributes({
                                        animationOtherSideSticky: val,
                                    }),
                            },
                        ]
                            .filter(Boolean)
                            .map((ctrl, i) => (
                                <ToggleControl
                                    key={i}
                                    {...ctrl}
                                    __nextHasNoMarginBottom
                                />
                            ))}

                        <RangeControl
                            label={__('Line Width', 'timeline-full-widget')}
                            help={__('Minimum value is 1px.', 'timeline-full-widget')}
                            value={lineWidth}
                            onChange={(value) =>
                                setAttributes({
                                    lineWidth: Math.max(1, Number(value) || 4),
                                })
                            }
                            min={1}
                            max={20}
                            step={1}
                            __nextHasNoMarginBottom
                        />

                        <PanelColorSettings
                            title={__(
                                'Timeline Colors',
                                'timeline-full-widget'
                            )}
                            colorSettings={[
                                {
                                    value: lineColor,
                                    onChange: (color) =>
                                        setAttributes({lineColor: color}),
                                    label: __(
                                        'Line Color',
                                        'timeline-full-widget'
                                    ),
                                },
                                showMarker && !markerUnique
                                    ? {
                                        value: markerColor,
                                        onChange: (color) =>
                                            setAttributes({
                                                markerColor: color,
                                            }),
                                        label: __(
                                            'Marker Color',
                                            'timeline-full-widget'
                                        ),
                                    }
                                    : null,
                            ].filter(Boolean)}
                        />

                        {animationTimeline && (
                            <PanelColorSettings
                                title={__(
                                    'Timeline Animation Colors',
                                    'timeline-full-widget'
                                )}
                                colorSettings={[
                                    {
                                        value: animationLineColor,
                                        onChange: (color) =>
                                            setAttributes({
                                                animationLineColor: color,
                                            }),
                                        label: __(
                                            'Animation Line Color',
                                            'timeline-full-widget'
                                        ),
                                    },
                                    showMarker &&
                                    animationMarker &&
                                    !markerUnique
                                        ? {
                                            value: animationMarkerColor,
                                            onChange: (color) =>
                                                setAttributes({
                                                    animationMarkerColor:
                                                    color,
                                                }),
                                            label: __(
                                                'Animation Marker Color',
                                                'timeline-full-widget'
                                            ),
                                        }
                                        : null,
                                ].filter(Boolean)}
                            />
                        )}
                    </PanelBody>
                    {showMarker && (
                        <PanelBody
                            title={__(
                                'Marker Settings',
                                'timeline-full-widget'
                            )}
                        >
                            {[
                                {
                                    label: __(
                                        'Sticky Markers',
                                        'timeline-full-widget'
                                    ),
                                    help: animationMarker
                                        ? __('Yes', 'timeline-full-widget')
                                        : __('No', 'timeline-full-widget'),
                                    checked: animationMarker,
                                    onChange: (val) =>
                                        setAttributes({
                                            animationMarker: val,
                                        }),
                                },
                                {
                                    label: __(
                                        'Unique Marker',
                                        'timeline-full-widget'
                                    ),
                                    help: markerUnique
                                        ? __('Yes', 'timeline-full-widget')
                                        : __('No', 'timeline-full-widget'),
                                    checked: markerUnique,
                                    onChange: (val) =>
                                        setAttributes({
                                            markerUnique: val,
                                        }),
                                },
                            ]
                                .filter(Boolean)
                                .map((ctrl, i) => (
                                    <ToggleControl
                                        key={i}
                                        {...ctrl}
                                        __nextHasNoMarginBottom
                                    />
                                ))}
                        </PanelBody>
                    )}
                </InspectorControls>

                {animationTimeline && (
                    <div className="timeline-line-animation"/>
                )}

                <ul
                    className={[
                        'timeline',
                        hasAnimatedMarkers && 'timeline-animation-marker',
                        animationOtherSideSticky &&
                        'timeline-animation-other-side-sticky',
                    ]
                        .filter(Boolean)
                        .join(' ')}
                >
                    <InnerBlocks
                        allowedBlocks={['za/timeline-item']}
                        template={[
                            [
                                'za/timeline-item',
                                {
                                    title: __(
                                        'Timeline Item #1',
                                        'timeline-full-widget'
                                    ),
                                    showMedia,
                                    direction,
                                    showOtherSide,
                                    showMarker,
                                    markerUnique,
                                },
                            ],
                            [
                                'za/timeline-item',
                                {
                                    title: __(
                                        'Timeline Item #2',
                                        'timeline-full-widget'
                                    ),
                                    showMedia,
                                    direction,
                                    showOtherSide,
                                    showMarker,
                                    markerUnique,
                                },
                            ],
                        ]}
                        templateLock={false}
                        renderAppender={InnerBlocks.ButtonBlockAppender}
                    />
                </ul>
            </div>
        </div>
    );
}
