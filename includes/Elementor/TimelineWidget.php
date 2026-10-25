<?php
/**
 * Elementor Timeline Widget.
 *
 * @package TimelineFullWidget
 * @since 1.0.0
 */

namespace TimelineFullWidget\Elementor;

use Elementor\Controls_Manager;
use Elementor\Group_Control_Image_Size;
use Elementor\Group_Control_Typography;
use Elementor\Repeater;
use Elementor\Utils;
use Elementor\Widget_Base;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Timeline widget for Elementor.
 */
final class TimelineWidget extends Widget_Base {

    private const DEFAULT_LINE_COLOR            = '#F6F6F8';
    private const DEFAULT_LINE_WIDTH            = 4;
    private const DEFAULT_MARKER_COLOR          = '#F6F6F8';
    private const DEFAULT_MARKER_SIZE           = 30;
    private const DEFAULT_ACTIVE_LINE_COLOR     = '#F37321';
    private const DEFAULT_ACTIVE_MARKER_COLOR   = '#F37321';

    /**
     * {@inheritDoc}
     */
    public function get_name() {
        return 'za-timeline';
    }

    /**
     * {@inheritDoc}
     */
    public function get_title() {
        return __( 'Timeline', 'timeline-full-widget' );
    }

    /**
     * {@inheritDoc}
     */
    public function get_icon() {
        return 'eicon-time-line';
    }

    /**
     * {@inheritDoc}
     */
    public function get_categories() {
        return [ 'basic' ];
    }

    /**
     * {@inheritDoc}
     */
    public function get_keywords() {
        return [ 'timeline', 'history', 'event' ];
    }

    /**
     * {@inheritDoc}
     */
    public function get_style_depends() {
        return [ 'timeline-core-style' ];
    }

    /**
     * {@inheritDoc}
     */
    public function get_script_depends() {
        return [ 'za-timeline-elementor' ];
    }

    /**
     * Register Elementor widget controls.
     */
    protected function register_controls() {
        $this->register_content_controls();
        $this->register_style_controls();
        $this->register_transfer_controls();
    }

    /**
     * Native settings snapshot controls. The editor-only adapter handles local JSON files;
     * the frontend never loads the transfer script.
     */
    private function register_transfer_controls(): void {
        $this->start_controls_section(
            'tfw_transfer_section',
            [
                'label' => __( 'Import / Export Timeline', 'timeline-full-widget' ),
                'tab'   => Controls_Manager::TAB_CONTENT,
            ]
        );
        $this->add_control(
            'tfw_transfer_actions',
            [
                'type' => Controls_Manager::RAW_HTML,
                'raw' => '<div class="tfw-timeline-transfer">'
                    . '<button type="button" class="elementor-button elementor-button-default" data-tfw-action="export">' . esc_html__( 'Export Timeline', 'timeline-full-widget' ) . '</button> '
                    . '<button type="button" class="elementor-button elementor-button-default" data-tfw-action="import">' . esc_html__( 'Import Timeline', 'timeline-full-widget' ) . '</button>'
                    . '<div class="elementor-control-field-description">' . esc_html__( 'Export the entire widget including advanced attributes and custom CSS. Media becomes placeholders.', 'timeline-full-widget' ) . '</div>'
                    . '</div>',
            ]
        );
        $this->end_controls_section();
    }

    /**
     * Register content controls.
     */
    protected function register_content_controls() {
        $this->start_controls_section(
            'content_section',
            [
                'label' => __( 'Timeline Items', 'timeline-full-widget' ),
                'tab'   => Controls_Manager::TAB_CONTENT,
            ]
        );

        $repeater = new Repeater();

        $repeater->add_control(
            'item_style_heading',
            [
                'label' => __( 'Item styles', 'timeline-full-widget' ),
                'type'  => Controls_Manager::HEADING,
            ]
        );

        $repeater->add_control(
            'inherit_item_styles',
            [
                'label'        => __( 'Use shared item styles', 'timeline-full-widget' ),
                'type'         => Controls_Manager::SWITCHER,
                'label_on'     => __( 'Yes', 'timeline-full-widget' ),
                'label_off'    => __( 'No', 'timeline-full-widget' ),
                'return_value' => 'yes',
                'default'      => 'yes',
                'description'  => __( 'Keep this enabled for consistent items. Turn it off only when this item needs unique styling.', 'timeline-full-widget' ),
            ]
        );

        $repeater->add_control(
            'li_bg_color',
            [
                'label'       => __( 'Card background color', 'timeline-full-widget' ),
                'type'        => Controls_Manager::COLOR,
                'render_type' => 'template',
            ]
        );

        $repeater->add_control(
            'item_outer_background_color',
            [
                'label'       => __( 'Timeline item background color', 'timeline-full-widget' ),
                'type'        => Controls_Manager::COLOR,
                'render_type' => 'template',
                'description' => __( 'Background for the entire timeline item, including the opposite side.', 'timeline-full-widget' ),
                'selectors'   => [
                    '{{WRAPPER}} {{CURRENT_ITEM}}' => 'background-color: {{VALUE}};',
                ],
            ]
        );

        $repeater->add_control(
            'card_background_image',
            [
                'label'       => __( 'Card background image', 'timeline-full-widget' ),
                'type'        => Controls_Manager::MEDIA,
                'render_type' => 'template',
                'description' => __( 'Background image for this card; transfer uses a local placeholder.', 'timeline-full-widget' ),
            ]
        );

        $repeater->add_control(
            'item_title_color',
            [
                'label'       => __( 'Title color', 'timeline-full-widget' ),
                'type'        => Controls_Manager::COLOR,
                'render_type' => 'template',
                'condition'   => [ 'inherit_item_styles!' => 'yes' ],
            ]
        );

        $repeater->add_control(
            'item_title_font_size',
            [
                'label'       => __( 'Title font size', 'timeline-full-widget' ),
                'type'        => Controls_Manager::SLIDER,
                'size_units'  => [ 'px', 'em', 'rem' ],
                'range'       => [ 'px' => [ 'min' => 1, 'max' => 200 ] ],
                'render_type' => 'template',
                'condition'   => [ 'inherit_item_styles!' => 'yes' ],
            ]
        );

        $repeater->add_control(
            'item_title_alignment',
            [
                'label'       => __( 'Title alignment', 'timeline-full-widget' ),
                'type'        => Controls_Manager::CHOOSE,
                'options'     => [
                    'left'   => [
                        'title' => __( 'Left', 'timeline-full-widget' ),
                        'icon'  => 'eicon-text-align-left',
                    ],
                    'center' => [
                        'title' => __( 'Center', 'timeline-full-widget' ),
                        'icon'  => 'eicon-text-align-center',
                    ],
                    'right'  => [
                        'title' => __( 'Right', 'timeline-full-widget' ),
                        'icon'  => 'eicon-text-align-right',
                    ],
                ],
                'default'     => 'left',
                'render_type' => 'template',
                'condition'   => [ 'inherit_item_styles!' => 'yes' ],
                'selectors'   => [
                    '{{WRAPPER}} {{CURRENT_ITEM}} .tl-title' => 'text-align: {{VALUE}};',
                ],
            ]
        );


        $repeater->add_control(
            'item_content_color',
            [
                'label'       => __( 'Content color', 'timeline-full-widget' ),
                'type'        => Controls_Manager::COLOR,
                'render_type' => 'template',
                'condition'   => [ 'inherit_item_styles!' => 'yes' ],
            ]
        );


        $repeater->add_control(
            'item_content_font_size',
            [
                'label'       => __( 'Content font size', 'timeline-full-widget' ),
                'type'        => Controls_Manager::SLIDER,
                'size_units'  => [ 'px', 'em', 'rem' ],
                'range'       => [ 'px' => [ 'min' => 1, 'max' => 200 ] ],
                'render_type' => 'template',
                'condition'   => [ 'inherit_item_styles!' => 'yes' ],
            ]
        );

        $repeater->add_control(
            'item_side_color',
            [
                'label'       => __( 'Side content color', 'timeline-full-widget' ),
                'type'        => Controls_Manager::COLOR,
                'render_type' => 'template',
                'condition'   => [ 'inherit_item_styles!' => 'yes' ],
            ]
        );

        $repeater->add_control(
            'item_side_font_size',
            [
                'label'       => __( 'Side content font size', 'timeline-full-widget' ),
                'type'        => Controls_Manager::SLIDER,
                'size_units'  => [ 'px', 'em', 'rem' ],
                'range'       => [ 'px' => [ 'min' => 1, 'max' => 200 ] ],
                'render_type' => 'template',
                'condition'   => [ 'inherit_item_styles!' => 'yes' ],
            ]
        );

        // Layout is an item-level behavior, independent of shared visual styles.
        $repeater->add_control(
            'item_layout_heading',
            [
                'label'     => __( 'Item layout', 'timeline-full-widget' ),
                'type'      => Controls_Manager::HEADING,
                'separator' => 'before',
            ]
        );

        $repeater->add_control(
            'item_content_layout',
            [
                'label'        => __( 'Use horizontal content layout', 'timeline-full-widget' ),
                'type'         => Controls_Manager::SWITCHER,
                'label_on'     => __( 'Yes', 'timeline-full-widget' ),
                'label_off'    => __( 'No', 'timeline-full-widget' ),
                'return_value' => 'horizontal',
                'default'      => '',
                'render_type'  => 'template',
                'description'  => __( 'Arrange this item’s media and text side by side. Off by default; independent of shared item styles.', 'timeline-full-widget' ),
            ]
        );

        $repeater->add_control(
            'tl_card_change_direction',
            [
                'label'        => __( 'Reverse media and content order', 'timeline-full-widget' ),
                'type'         => Controls_Manager::SWITCHER,
                'label_on'     => __( 'Yes', 'timeline-full-widget' ),
                'label_off'    => __( 'No', 'timeline-full-widget' ),
                'return_value' => 'yes',
                'default'      => '',
                'render_type'  => 'template',
                'description'  => __( 'Swap media and text within this item. Off by default; independent of shared item styles.', 'timeline-full-widget' ),
            ]
        );

        $repeater->add_control(
            'media_heading',
            [
                'label'     => __( 'Media', 'timeline-full-widget' ),
                'type'      => Controls_Manager::HEADING,
                'separator' => 'before',
            ]
        );

        $repeater->add_control(
            'show_media',
            [
                'label'        => __( 'Show media', 'timeline-full-widget' ),
                'type'         => Controls_Manager::SWITCHER,
                'label_on'     => __( 'Yes', 'timeline-full-widget' ),
                'label_off'    => __( 'No', 'timeline-full-widget' ),
                'return_value' => 'yes',
                'default'      => 'yes',
                'render_type'  => 'template',
            ]
        );

        $repeater->add_control(
            'media_type',
            [
                'label'   => __( 'Media type', 'timeline-full-widget' ),
                'type'    => Controls_Manager::SELECT,
                'options' => [
                    'image' => __( 'Image', 'timeline-full-widget' ),
                    'video' => __( 'Video', 'timeline-full-widget' ),
                ],
                'default' => 'image',
                'render_type' => 'template',
            ]
        );

        $repeater->add_control(
            'media_image',
            [
                'label'       => __( 'Image', 'timeline-full-widget' ),
                'type'        => Controls_Manager::MEDIA,
                'media_types' => [ 'image' ],
                'render_type' => 'template',
                'default'     => [ 'url' => Utils::get_placeholder_image_src() ],
                'condition'   => [ 'media_type' => 'image' ],
            ]
        );

        $repeater->add_control(
            'media_image_alt',
            [
                'label'     => __( 'Image alt text', 'timeline-full-widget' ),
                'type'      => Controls_Manager::TEXT,
                'condition' => [ 'media_type' => 'image' ],
            ]
        );

        $repeater->add_control(
            'media_video',
            [
                'label'       => __( 'Video', 'timeline-full-widget' ),
                'type'        => Controls_Manager::MEDIA,
                'media_types' => [ 'video' ],
                'render_type' => 'template',
                'condition'   => [ 'media_type' => 'video' ],
            ]
        );

        $repeater->add_control(
            'posterURL',
            [
                'label'       => __( 'Video poster', 'timeline-full-widget' ),
                'type'        => Controls_Manager::MEDIA,
                'media_types' => [ 'image' ],
                'render_type' => 'template',
                'default'     => [ 'url' => Utils::get_placeholder_image_src() ],
                'condition'   => [ 'media_type' => 'video' ],
            ]
        );

        // Legacy value is retained for existing widgets but has no user-facing field.
        $repeater->add_control(
            'media_width',
            [
                'type'    => Controls_Manager::HIDDEN,
                'default' => '',
            ]
        );

        $repeater->add_control(
            'media_width_value',
            [
                'label'       => __( 'Width of media', 'timeline-full-widget' ),
                'type'        => Controls_Manager::NUMBER,
                'default'     => '',
                'min'         => 1,
                'max'         => 5000,
                'step'        => 1,
                'render_type' => 'template',
            ]
        );

        $repeater->add_control(
            'media_width_unit',
            [
                'label'       => __( 'Unit', 'timeline-full-widget' ),
                'type'        => Controls_Manager::SELECT,
                'options'     => [ 'px' => 'px', '%' => '%' ],
                'default'     => 'px',
                'render_type' => 'template',
            ]
        );

        $repeater->add_group_control(
            Group_Control_Image_Size::get_type(),
            [
                'name'      => 'thumbnail',
                'default'   => 'medium',
                'separator' => 'none',
            ]
        );

        $repeater->add_control(
            'media_link_url',
            [
                'label'         => __( 'Media link', 'timeline-full-widget' ),
                'type'          => Controls_Manager::URL,
                'placeholder'   => 'https://example.com',
                'show_external' => true,
            ]
        );

        $repeater->add_control(
            'media_link_enabled',
            [
                'label'        => __( 'Wrap media in link', 'timeline-full-widget' ),
                'type'         => Controls_Manager::SWITCHER,
                'label_on'     => __( 'Yes', 'timeline-full-widget' ),
                'label_off'    => __( 'No', 'timeline-full-widget' ),
                'return_value' => 'yes',
                'default'      => 'yes',
                'condition'    => [
                    'media_link_url[url]!' => '',
                ],
            ]
        );


        $repeater->add_control(
            'content_heading',
            [
                'label'     => __( 'Content', 'timeline-full-widget' ),
                'type'      => Controls_Manager::HEADING,
                'separator' => 'before',
            ]
        );

        $repeater->add_control(
            'list_title',
            [
                'label'   => __( 'Title', 'timeline-full-widget' ),
                'type'    => Controls_Manager::TEXTAREA,
                'default' => __( 'Timeline Title', 'timeline-full-widget' ),
                'rows'    => 2,
            ]
        );

        $repeater->add_control(
            'title_link_url',
            [
                'label'         => __( 'Title link', 'timeline-full-widget' ),
                'type'          => Controls_Manager::URL,
                'placeholder'   => 'https://example.com',
                'show_external' => true,
            ]
        );

        $repeater->add_control(
            'list_content',
            [
                'label'   => __( 'Content', 'timeline-full-widget' ),
                'type'    => Controls_Manager::WYSIWYG,
                'default' => __( 'Timeline content here...', 'timeline-full-widget' ),
            ]
        );

        $repeater->add_control(
            'side_content',
            [
                'label'   => __( 'Side content', 'timeline-full-widget' ),
                'type'    => Controls_Manager::WYSIWYG,
                'default' => '',
            ]
        );

        $repeater->add_control(
            'marker_heading',
            [
                'label'     => __( 'Marker', 'timeline-full-widget' ),
                'type'      => Controls_Manager::HEADING,
                'separator' => 'before',
            ]
        );

        $repeater->add_control(
            'marker_image',
            [
                'label'       => __( 'Custom marker image', 'timeline-full-widget' ),
                'type'        => Controls_Manager::MEDIA,
                'media_types' => [ 'image' ],
            ]
        );

        $repeater->add_control(
            'marker_image_alt',
            [
                'label' => __( 'Marker image alt text', 'timeline-full-widget' ),
                'type'  => Controls_Manager::TEXT,
            ]
        );

        $repeater->add_control(
            'marker_image_notice',
            [
                'type'            => Controls_Manager::RAW_HTML,
                'raw'             => sprintf(
                    '<div class="elementor-control-description">%s</div>',
                    esc_html__( 'Note: this image is used only when “Use custom marker image” is enabled. Recommended width: 50px or less.', 'timeline-full-widget' )
                ),
                'content_classes' => 'elementor-control-descriptor',
            ]
        );

        $this->add_control(
            'list',
            [
                'type'        => Controls_Manager::REPEATER,
                'fields'      => $repeater->get_controls(),
                'title_field' => '{{{ list_title }}}',
                'default'     => [
                    [
                        'list_title'   => __( 'Timeline Item #1', 'timeline-full-widget' ),
                        'list_content' => __( 'Content for item #1', 'timeline-full-widget' ),
                        'item_content_layout' => '',
                        'tl_card_change_direction' => '',
                    ],
                    [
                        'list_title'   => __( 'Timeline Item #2', 'timeline-full-widget' ),
                        'list_content' => __( 'Content for item #2', 'timeline-full-widget' ),
                        'item_content_layout' => '',
                        'tl_card_change_direction' => '',
                    ],
                ],
            ]
        );

        $this->end_controls_section();
    }

    /**
     * Register style and behavior controls.
     */
    protected function register_style_controls() {
        $this->start_controls_section(
            'section_style_title',
            [
                'label' => __( 'Title', 'timeline-full-widget' ),
                'tab'   => Controls_Manager::TAB_STYLE,
            ]
        );

        $this->add_control(
            'header_tag',
            [
                'label'   => __( 'Title HTML Tag', 'timeline-full-widget' ),
                'type'    => Controls_Manager::SELECT,
                'options' => array_combine(
                    [ 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div', 'p', 'a' ],
                    [ 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'div', 'p', 'a' ]
                ),
                'default' => 'h3',
            ]
        );

        $this->add_group_control(
            Group_Control_Typography::get_type(),
            [
                'name'           => 'title_typography',
                'label'          => __( 'Typography', 'timeline-full-widget' ),
                'selector'       => '{{WRAPPER}} .tl-title',
                'fields_options' => [
                    'typography' => [
                        'default' => 'custom',
                    ],
                    'font_size'  => [
                        'default' => [
                            'size' => 24,
                            'unit' => 'px',
                        ],
                    ],
                ],
            ]
        );

        $this->add_control(
            'title_color',
            [
                'label'       => __( 'Shared title color', 'timeline-full-widget' ),
                'type'        => Controls_Manager::COLOR,
                'description' => __( 'Applies to items that use shared item styles. Unique items can override this setting.', 'timeline-full-widget' ),
                'selectors'   => [
                    '{{WRAPPER}} .timeline-item:not(.timeline-item-unique-style) .tl-title' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->add_responsive_control(
            'title_alignment',
            [
                'label'       => __( 'Title alignment', 'timeline-full-widget' ),
                'type'      => Controls_Manager::CHOOSE,
                'options'   => [
                    'left'    => [
                        'title' => __( 'Left', 'timeline-full-widget' ),
                        'icon'  => 'eicon-text-align-left',
                    ],
                    'center'  => [
                        'title' => __( 'Center', 'timeline-full-widget' ),
                        'icon'  => 'eicon-text-align-center',
                    ],
                    'right'   => [
                        'title' => __( 'Right', 'timeline-full-widget' ),
                        'icon'  => 'eicon-text-align-right',
                    ],
                    'justify' => [
                        'title' => __( 'Justified', 'timeline-full-widget' ),
                        'icon'  => 'eicon-text-align-justify',
                    ],
                ],
                'default'     => 'left',
                'description' => __( 'Applies to items that use shared item styles. Unique items can override this setting.', 'timeline-full-widget' ),
                'selectors'   => [
                    '{{WRAPPER}} .timeline-item:not(.timeline-item-unique-style) .tl-title' => 'text-align: {{VALUE}};',
                ],
            ]
        );



        $this->add_responsive_control(
            'title_margin',
            [
                'label'      => __( 'Margin', 'timeline-full-widget' ),
                'type'       => Controls_Manager::DIMENSIONS,
                'size_units' => [ 'px', '%', 'em', 'rem' ],
                'selectors'  => [
                    '{{WRAPPER}} .tl-title' => 'margin: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
            ]
        );


        $this->end_controls_section();

        $this->start_controls_section(
            'section_style_content',
            [
                'label' => __( 'Content', 'timeline-full-widget' ),
                'tab'   => Controls_Manager::TAB_STYLE,
            ]
        );

        $this->add_control(
            'blocks_color',
            [
                'label'       => __( 'Shared content color', 'timeline-full-widget' ),
                'type'        => Controls_Manager::COLOR,
                'default'     => '#333333',
                'description' => __( 'Applies to items that use shared item styles. Unique items can override this setting.', 'timeline-full-widget' ),
                'selectors'   => [
                    '{{WRAPPER}} .timeline-item:not(.timeline-item-unique-style)' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->add_group_control(
            Group_Control_Typography::get_type(),
            [
                'name'           => 'list_content_typography',
                'label'          => __( 'Content Typography', 'timeline-full-widget' ),
                'selector'       => '{{WRAPPER}} .tl-desc-short, {{WRAPPER}} .tl-desc-short p, {{WRAPPER}} .tl-desc-short li',
                'fields_options' => [
                    'font_size' => [
                        'responsive'     => true,
                        'default'        => [
                            'size' => 16,
                            'unit' => 'px',
                        ],
                        'tablet_default' => [
                            'size' => 15,
                            'unit' => 'px',
                        ],
                        'mobile_default' => [
                            'size' => 14,
                            'unit' => 'px',
                        ],
                    ],
                ],
            ]
        );

        $this->add_group_control(
            Group_Control_Typography::get_type(),
            [
                'name'           => 'side_content_typography',
                'label'          => __( 'Side Content Typography', 'timeline-full-widget' ),
                'selector'       => '{{WRAPPER}} .timeline-side',
                'fields_options' => [
                    'font_size' => [
                        'responsive'     => true,
                        'default'        => [
                            'size' => 14,
                            'unit' => 'px',
                        ],
                        'tablet_default' => [
                            'size' => 13,
                            'unit' => 'px',
                        ],
                        'mobile_default' => [
                            'size' => 12,
                            'unit' => 'px',
                        ],
                    ],
                ],
            ]
        );

        $this->end_controls_section();

        $this->start_controls_section(
            'section_style_timeline_settings',
            [
                'label' => __( 'Timeline Settings', 'timeline-full-widget' ),
                'tab'   => Controls_Manager::TAB_STYLE,
            ]
        );

        $this->add_control(
            'timeline_line_width',
            [
                'label'      => __( 'Line Width', 'timeline-full-widget' ),
                'type'       => Controls_Manager::SLIDER,
                'size_units' => [ 'px' ],
                'range'      => [
                    'px' => [
                        'min'  => 1,
                        'max'  => 20,
                        'step' => 1,
                    ],
                ],
                'default'    => [
                    'unit' => 'px',
                    'size' => self::DEFAULT_LINE_WIDTH,
                ],
                'selectors'  => [
                    '{{WRAPPER}} .timeline-wrapper' => '--timeline-line-width: {{SIZE}}{{UNIT}};',
                ],
            ]
        );

        $this->add_control(
            'timeline_line_color',
            [
                'label'     => __( 'Line Color', 'timeline-full-widget' ),
                'type'      => Controls_Manager::COLOR,
                'default'   => self::DEFAULT_LINE_COLOR,
                'selectors' => [
                    '{{WRAPPER}} .timeline-wrapper' => '--timeline-line-color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'timeline_marker_color',
            [
                'label'     => __( 'Marker Color', 'timeline-full-widget' ),
                'type'      => Controls_Manager::COLOR,
                'default'   => self::DEFAULT_MARKER_COLOR,
                'selectors' => [
                    '{{WRAPPER}} .timeline-wrapper' => '--timeline-marker-color: {{VALUE}};',
                ],
                'condition' => [
                    'tl_show_marker'      => 'yes',
                    'tl_is_marker_unique!' => 'yes',
                ],
            ]
        );

        $this->add_control(
            'timeline_line_animation_color',
            [
                'label'     => __( 'Active Line Color', 'timeline-full-widget' ),
                'type'      => Controls_Manager::COLOR,
                'default'   => self::DEFAULT_ACTIVE_LINE_COLOR,
                'selectors' => [
                    '{{WRAPPER}} .timeline-wrapper' => '--timeline-line-active-color: {{VALUE}};',
                ],
                'condition' => [
                    'tl_animation_timeline' => 'yes',
                ],
            ]
        );

        $this->add_control(
            'timeline_marker_animation_color',
            [
                'label'     => __( 'Active Marker Color', 'timeline-full-widget' ),
                'type'      => Controls_Manager::COLOR,
                'default'   => self::DEFAULT_ACTIVE_MARKER_COLOR,
                'selectors' => [
                    '{{WRAPPER}} .timeline-wrapper' => '--timeline-marker-active-color: {{VALUE}};',
                ],
                'condition' => [
                    'tl_animation_timeline' => 'yes',
                    'tl_show_marker'        => 'yes',
                    'tl_animation_marker'   => 'yes',
                    'tl_is_marker_unique!'  => 'yes',
                ],
            ]
        );

        $this->add_control(
            'timeline_marker_size',
            [
                'label'      => __( 'Marker Size', 'timeline-full-widget' ),
                'type'       => Controls_Manager::SLIDER,
                'size_units' => [ 'px' ],
                'range'      => [
                    'px' => [
                        'min'  => 2,
                        'max'  => 80,
                        'step' => 1,
                    ],
                ],
                'default'    => [
                    'unit' => 'px',
                    'size' => self::DEFAULT_MARKER_SIZE,
                ],
                'selectors'  => [
                    '{{WRAPPER}} .timeline-wrapper' => '--marker-size: {{SIZE}}{{UNIT}};',
                ],
            ]
        );

        $this->end_controls_section();

        $this->start_controls_section(
            'section_style_layout',
            [
                'label' => __( 'Layout', 'timeline-full-widget' ),
                'tab'   => Controls_Manager::TAB_STYLE,
            ]
        );

        $this->add_control(
            'tl_change_direction',
            [
                'label'        => __( 'Timeline Direction', 'timeline-full-widget' ),
                'type'         => Controls_Manager::SWITCHER,
                'label_on'     => __( 'Left', 'timeline-full-widget' ),
                'label_off'    => __( 'Right', 'timeline-full-widget' ),
                'return_value' => 'left',
            ]
        );

        $this->add_control(
            'tl_change_onside',
            [
                'label'        => __( 'Single Side Layout', 'timeline-full-widget' ),
                'type'         => Controls_Manager::SWITCHER,
                'label_on'     => __( 'Yes', 'timeline-full-widget' ),
                'label_off'    => __( 'No', 'timeline-full-widget' ),
                'return_value' => 'yes',
            ]
        );

        $this->add_control(
            'tl_show_other_side',
            [
                'label'        => __( 'Display opposite side content', 'timeline-full-widget' ),
                'type'         => Controls_Manager::SWITCHER,
                'label_on'     => __( 'Yes', 'timeline-full-widget' ),
                'label_off'    => __( 'No', 'timeline-full-widget' ),
                'return_value' => 'yes',
                'default'      => 'yes',
            ]
        );


        $this->add_control(
            'tl_show_step_numbers',
            [
                'label'        => __( 'Show step numbers', 'timeline-full-widget' ),
                'type'         => Controls_Manager::SWITCHER,
                'label_on'     => __( 'Yes', 'timeline-full-widget' ),
                'label_off'    => __( 'No', 'timeline-full-widget' ),
                'return_value' => 'yes',
            ]
        );

        $this->end_controls_section();

        $this->start_controls_section(
            'section_style_behavior',
            [
                'label' => __( 'Behavior', 'timeline-full-widget' ),
                'tab'   => Controls_Manager::TAB_STYLE,
            ]
        );

        $this->add_control(
            'tl_animation_timeline',
            [
                'label'        => __( 'Animate timeline line', 'timeline-full-widget' ),
                'type'         => Controls_Manager::SWITCHER,
                'label_on'     => __( 'Yes', 'timeline-full-widget' ),
                'label_off'    => __( 'No', 'timeline-full-widget' ),
                'return_value' => 'yes',
                'default'      => 'yes',
            ]
        );

        $this->add_control(
            'tl_show_marker',
            [
                'label'        => __( 'Show timeline marker', 'timeline-full-widget' ),
                'type'         => Controls_Manager::SWITCHER,
                'label_on'     => __( 'Yes', 'timeline-full-widget' ),
                'label_off'    => __( 'No', 'timeline-full-widget' ),
                'return_value' => 'yes',
                'default'      => 'yes',
            ]
        );

        $this->add_control(
            'tl_animation_marker',
            [
                'label'        => __( 'Animate timeline markers', 'timeline-full-widget' ),
                'type'         => Controls_Manager::SWITCHER,
                'label_on'     => __( 'Yes', 'timeline-full-widget' ),
                'label_off'    => __( 'No', 'timeline-full-widget' ),
                'return_value' => 'yes',
                'default'      => 'yes',
                'condition'    => [
                    'tl_show_marker' => 'yes',
                ],
            ]
        );

        $this->add_control(
            'tl_animation_other_side_sticky',
            [
                'label'        => __( 'Sticky Side Content', 'timeline-full-widget' ),
                'type'         => Controls_Manager::SWITCHER,
                'label_on'     => __( 'Yes', 'timeline-full-widget' ),
                'label_off'    => __( 'No', 'timeline-full-widget' ),
                'return_value' => 'yes',
                'default'      => 'no',
            ]
        );

        $this->add_control(
            'tl_is_marker_unique',
            [
                'label'        => __( 'Use custom marker image', 'timeline-full-widget' ),
                'type'         => Controls_Manager::SWITCHER,
                'label_on'     => __( 'Yes', 'timeline-full-widget' ),
                'label_off'    => __( 'No', 'timeline-full-widget' ),
                'return_value' => 'yes',
                'default'      => 'no',
                'condition'    => [
                    'tl_show_marker' => 'yes',
                ],
            ]
        );

        $this->end_controls_section();
    }

    /**
     * Render widget output on the frontend.
     */
    protected function render() {
        $settings = $this->get_settings_for_display();
        $items    = ! empty( $settings['list'] ) && is_array( $settings['list'] ) ? $settings['list'] : [];

        $tag                      = Utils::validate_html_tag( $settings['header_tag'] ?? 'h3' );
        $on_side                  = ( $settings['tl_change_onside'] ?? '' ) === 'yes';
        $direction                = ( $settings['tl_change_direction'] ?? '' ) === 'left' ? 'left' : 'right';
        $show_marker             = ( $settings['tl_show_marker'] ?? '' ) === 'yes';
        $animation_marker_enabled = $show_marker && ( ( $settings['tl_animation_marker'] ?? '' ) === 'yes' );
        $sticky_other_side        = ( $settings['tl_animation_other_side_sticky'] ?? '' ) === 'yes';
        $show_other_side          = ( $settings['tl_show_other_side'] ?? 'yes' ) === 'yes';

        echo '<div class="wp-block-za-timeline-full-widget timeline-full-widget-elementor">';
        echo '<div class="timeline-wrapper">';

        if ( ( $settings['tl_animation_timeline'] ?? '' ) === 'yes' ) {
            echo '<div class="timeline-line-animation"></div>';
        }

        $ul_classes = [ 'timeline' ];
        if ( $animation_marker_enabled ) {
            $ul_classes[] = 'timeline-animation-marker';
        }
        if ( $sticky_other_side ) {
            $ul_classes[] = 'timeline-animation-other-side-sticky';
        }
        if ( ( $settings['tl_show_step_numbers'] ?? '' ) === 'yes' ) {
            $ul_classes[] = 'timeline-numbers';
        }

        echo '<ul class="' . esc_attr( implode( ' ', $ul_classes ) ) . '">';

        $count = ( 'left' === $direction ) ? 1 : 2;
        foreach ( $items as $item ) {
            if ( $on_side ) {
                $li_class = ( 'right' === $direction ) ? 'timeline-inverted' : 'timeline-left';
            } else {
                ++$count;
                $li_class = ( 0 === $count % 2 ) ? 'timeline-inverted' : 'timeline-left';
            }

            echo $this->render_item_html( $li_class, $item, $tag, $show_marker, $show_other_side, $settings ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Markup is escaped in render_item_html().
        }

        echo '</ul></div></div>';

        if ( wp_script_is( 'za-timeline-elementor', 'registered' ) ) {
            wp_enqueue_script( 'za-timeline-elementor' );
        }

        if ( wp_style_is( 'timeline-core-style', 'registered' ) ) {
            wp_enqueue_style( 'timeline-core-style' );
        }
    }

    /**
     * Whether the item should use widget-level shared item style settings.
     *
     * @param array $item Repeater item data.
     */
    private function item_uses_shared_styles( $item ) {
        return ! isset( $item['inherit_item_styles'] ) || 'yes' === $item['inherit_item_styles'];
    }

    /**
     * Render a single timeline item using the Gutenberg item DOM as the canonical structure.
     *
     * @param string $li_class        Timeline position class.
     * @param array  $item            Repeater item data.
     * @param string $tag             Safe title tag.
     * @param bool   $show_marker     Whether markers are enabled.
     * @param bool   $show_other_side Whether side content is displayed.
     * @param array  $settings        Widget settings.
     */
    private function render_item_html( $li_class, $item, $tag, $show_marker, $show_other_side, $settings ) {
        $title               = isset( $item['list_title'] ) ? $item['list_title'] : '';
        $safe_title_html     = wp_kses( nl2br( esc_html( $title ) ), [ 'br' => [] ] );
        $title_link          = isset( $item['title_link_url'] ) && is_array( $item['title_link_url'] ) ? $item['title_link_url'] : [];
        $side_content        = isset( $item['side_content'] ) ? wp_kses_post( $item['side_content'] ) : '';
        $uses_shared_styles  = $this->item_uses_shared_styles( $item );
        $media_html          = $this->render_media_html( $item );
        $card_color = $item['li_bg_color'] ?? ( $settings['shared_item_background_color'] ?? '' );
        $card_image = $item['card_background_image']['url'] ?? '';
        $panel_style_attr = $this->build_style_attr(
            [
                'background-color' => $card_color,
                'background-image' => $this->safe_background_image_css( $card_image ),
                'background-size' => $card_image ? 'cover' : '',
                'background-position' => $card_image ? 'center' : '',
            ]
        );
        $item_style_attr = $this->build_style_attr( [ 'background-color' => $item['item_outer_background_color'] ?? '' ] );
        $title_style_attr = $uses_shared_styles ? '' : $this->build_style_attr(
            [
                'color'      => $item['item_title_color'] ?? '',
                'font-size'  => $this->item_font_size_css( $item['item_title_font_size'] ?? null ),
                'text-align' => $this->get_alignment_value( $item['item_title_alignment'] ?? 'left' ),
            ]
        );
        $content_style_attr = $uses_shared_styles ? '' : $this->build_style_attr(
            [
                'color'     => $item['item_content_color'] ?? '',
                'font-size' => $this->item_font_size_css( $item['item_content_font_size'] ?? null ),
            ]
        );
        $side_style_attr = $uses_shared_styles ? '' : $this->build_style_attr(
            [
                'color'     => $item['item_side_color'] ?? '',
                'font-size' => $this->item_font_size_css( $item['item_side_font_size'] ?? null ),
            ]
        );
        $content_classes     = [ 'tl-content' ];
        $repeater_item_class = ! empty( $item['_id'] ) ? 'elementor-repeater-item-' . sanitize_html_class( $item['_id'] ) : '';
        $timeline_item_classes = array_filter(
            [
                'wp-block-za-timeline-item',
                'timeline-item',
                $li_class,
                $repeater_item_class,
                $uses_shared_styles ? '' : 'timeline-item-unique-style',
                ! $uses_shared_styles && ! empty( $item['item_side_color'] ) ? 'tfw-side-custom-color' : '',
                ! $uses_shared_styles && $this->item_font_size_css( $item['item_side_font_size'] ?? null ) ? 'tfw-side-custom-size' : '',
                ! $uses_shared_styles && ! empty( $item['item_content_color'] ) ? 'tfw-content-custom-color' : '',
                ! $uses_shared_styles && $this->item_font_size_css( $item['item_content_font_size'] ?? null ) ? 'tfw-content-custom-size' : '',
            ]
        );

        if ( $this->is_item_horizontal_layout( $item, $settings ) ) {
            $content_classes[] = 'tl-content-horizontal';
        }

        if ( $this->is_item_reversed( $item, $settings ) ) {
            $content_classes[] = 'tl-reverse';
        }

        ob_start();
        ?>
        <li class="<?php echo esc_attr( implode( ' ', $timeline_item_classes ) ); ?>"<?php echo $item_style_attr; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Escaped by build_style_attr(). ?>>
            <div class="tl-trigger"></div>
            <?php if ( $show_marker ) : ?>
                <?php echo $this->render_marker_html( $item, $settings ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Markup is escaped in render_marker_html(). ?>
            <?php endif; ?>

            <div class="wp-block-za-timeline-item-side timeline-side"<?php echo $side_style_attr; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Escaped by build_style_attr(). ?>>
                <?php
                if ( $show_other_side ) {
                    echo $side_content; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Sanitized with wp_kses_post().
                }
                ?>
            </div>

            <div class="wp-block-za-timeline-item-content timeline-panel"<?php echo $panel_style_attr; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Escaped in build_style_attr(). ?>>
                <div class="<?php echo esc_attr( implode( ' ', $content_classes ) ); ?>">
                    <?php echo $media_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Markup is escaped in render_media_html(). ?>
                    <div class="tl-desc">
                        <div class="tl-desc-short"<?php echo $content_style_attr; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Escaped in build_style_attr(). ?>>
                            <?php echo $this->render_title_html( $tag, $safe_title_html, $title_link, $title_style_attr ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Markup is escaped in render_title_html(). ?>
                            <?php echo wp_kses_post( $item['list_content'] ?? '' ); ?>
                        </div>
                    </div>
                </div>
            </div>
        </li>
        <?php
        return ob_get_clean();
    }

    /**
     * Return a safe CSS image declaration or no value. No raw CSS is imported.
     *
     * @param mixed $url Media URL from Elementor.
     * @return string
     */
    private function safe_background_image_css( $url ) {
        if ( ! is_string( $url ) || '' === $url ) {
            return '';
        }
        $safe_url = esc_url_raw( $url, [ 'https', 'http' ] );
        return $safe_url ? 'url("' . str_replace( [ chr(34), '(', ')', chr(92) ], '', $safe_url ) . '")' : '';
    }

    /**
     * Render the timeline item title.
     *
     * @param string $tag             Title tag.
     * @param string $safe_title_html Escaped title HTML.
     * @param array  $title_link      Elementor link control value.
     * @param string $style_attr      Optional style attribute.
     */
    private function render_title_html( $tag, $safe_title_html, $title_link, $style_attr = '' ) {
        if ( 'a' === $tag && ! empty( $title_link['url'] ) ) {
            $title_link_attrs = $this->get_link_attributes_string( $title_link );

            return sprintf(
                '<a class="tl-title" %1$s%2$s>%3$s</a>',
                $title_link_attrs,
                $style_attr ? ' ' . $style_attr : '',
                $safe_title_html
            );
        }

        // Match content_template(): a title without a URL must not render a dead anchor.
        if ( 'a' === $tag ) {
            $tag = 'div';
        }

        return sprintf(
            '<%1$s class="tl-title"%2$s>%3$s</%1$s>',
            tag_escape( $tag ),
            $style_attr ? ' ' . $style_attr : '',
            $safe_title_html
        );
    }

    /**
     * Render marker markup.
     *
     * @param array $item     Repeater item data.
     * @param array $settings Widget settings.
     */
    private function render_marker_html( $item, $settings ) {
        $marker_img = $item['marker_image']['url'] ?? '';
        $marker_alt = $item['marker_image_alt'] ?? ( $item['marker_image']['alt'] ?? '' );

        if ( ! empty( $marker_img ) && ( ( $settings['tl_is_marker_unique'] ?? '' ) === 'yes' ) ) {
            return sprintf(
                '<div class="tl-mark"><img src="%1$s" alt="%2$s" loading="lazy" decoding="async" /></div>',
                esc_url( $marker_img ),
                esc_attr( $marker_alt )
            );
        }

        return '<div class="tl-mark"></div>';
    }

    /**
     * Render media HTML (image or video).
     *
     * @param array $item Repeater item data.
     */
    /**
     * Validate a portable media width in px or %. An empty string uses CSS defaults.
     * Never concatenate an untrusted import value directly into a style attribute.
     */
    private function media_width_css( $value ): string {
        if ( ! is_string( $value ) && ! is_numeric( $value ) ) {
            return '';
        }
        $value = trim( (string) $value );
        if ( ! preg_match( '/^(\d+(?:\.\d+)?)(px|%)$/i', $value, $matches ) ) {
            return '';
        }
        $number = (float) $matches[1];
        if ( $number <= 0 || $number > ( '%' === $matches[2] ? 100 : 5000 ) ) {
            return '';
        }
        return $matches[1] . strtolower( $matches[2] );
    }

    /** Return the new numeric/unit setting, with legacy string fallback. */
    private function item_media_width_css( array $item ): string {
        if ( isset( $item['media_width_value'] ) && '' !== (string) $item['media_width_value'] ) {
            $unit = ( $item['media_width_unit'] ?? 'px' ) === '%' ? '%' : 'px';
            return $this->media_width_css( (string) $item['media_width_value'] . $unit );
        }
        // Existing pre-migration widgets may only contain the old combined value.
        return $this->media_width_css( $item['media_width'] ?? '' );
    }

    private function render_media_html( $item ) {
        if ( isset( $item['show_media'] ) && 'no' === $item['show_media'] ) {
            return '';
        }
        $type             = $item['media_type'] ?? 'image';
        $title            = isset( $item['list_title'] ) ? wp_strip_all_tags( $item['list_title'] ) : '';
        $media_link       = isset( $item['media_link_url'] ) && is_array( $item['media_link_url'] ) ? $item['media_link_url'] : [];
        $wrap_with_link   = ! empty( $media_link['url'] ) && ( ( $item['media_link_enabled'] ?? 'yes' ) === 'yes' );
        $media_inner_html = '';

        if ( 'video' === $type ) {
            $media_url = $item['media_video']['url'] ?? '';
            $poster    = $item['posterURL']['url'] ?? '';

            if ( empty( $media_url ) ) {
                // An imported video keeps its type but displays a local poster until replaced.
                $media_inner_html = $poster ? sprintf(
                    '<div class="timeline_pic pull-left"><img class="timeline-video-placeholder" src="%s" alt="%s" loading="lazy" decoding="async" /></div>',
                    esc_url( $poster ),
                    esc_attr__( 'Video placeholder', 'timeline-full-widget' )
                ) : '';
            } else {
                $filetype    = wp_check_filetype( $media_url );
                $mime        = $filetype['type'] ?: 'video/mp4';
                $poster_attr = $poster ? ' poster="' . esc_url( $poster ) . '"' : '';

                $media_inner_html = sprintf(
                    '<div class="timeline_pic pull-left"><video autoplay muted loop playsinline preload="metadata"%1$s><source src="%2$s" type="%3$s">%4$s</video></div>',
                    $poster_attr,
                    esc_url( $media_url ),
                    esc_attr( $mime ),
                    esc_html__( 'Your browser does not support the video tag.', 'timeline-full-widget' )
                );
            }
        } else {
            $media     = $item['media_image'] ?? [];
            $media_url = $media['url'] ?? '';

            if ( ! $media_url && empty( $media['id'] ) ) {
                return '';
            }

            if ( ! empty( $media['id'] ) ) {
                // A specific display width is independent from Image Resolution.
                // Use responsive original attachment markup to avoid rendering a
                // 300px thumbnail stretched across a 100%-width container.
                $has_width_override = '' !== $this->item_media_width_css( $item );
                if ( $has_width_override ) {
                    $alt = $item['media_image_alt'] ?? ( $media['alt'] ?? '' );
                    $image_html = wp_get_attachment_image( (int) $media['id'], 'full', false, [ 'alt' => $alt, 'loading' => 'lazy', 'decoding' => 'async' ] );
                } else {
                    $image_html = Group_Control_Image_Size::get_attachment_image_html( $item, 'thumbnail', 'media_image' );
                }
                $media_inner_html = '<div class="timeline_pic pull-left">' . $image_html . '</div>';
            } elseif ( $media_url ) {
                $alt = $item['media_image_alt'] ?? ( $media['alt'] ?? ( $media['title'] ?? '' ) );

                $media_inner_html = sprintf(
                    '<div class="timeline_pic pull-left"><img src="%1$s" alt="%2$s" loading="lazy" decoding="async" /></div>',
                    esc_url( $media_url ),
                    esc_attr( $alt )
                );
            }
        }

        if ( ! $media_inner_html ) {
            return '';
        }

        $media_width = $this->item_media_width_css( $item );
        if ( $media_width && ! $wrap_with_link ) {
            // Media linked to a URL receives its width on the outer anchor instead.
            $media_inner_html = preg_replace(
                '/class="timeline_pic pull-left"/',
                'class="timeline_pic pull-left tfw-media-sized" style="width:' . esc_attr( $media_width ) . ';max-width:100%"',
                $media_inner_html,
                1
            );
        }

        if ( $wrap_with_link ) {
            $link_attrs = $this->get_link_attributes_string(
                $media_link,
                $title ? sprintf(
                    /* translators: %s: timeline item title. */
                    __( 'Open media for "%s"', 'timeline-full-widget' ),
                    $title
                ) : __( 'Open media link', 'timeline-full-widget' )
            );

            return sprintf(
                '<a class="timeline-media-link%4$s" %1$s%2$s>%3$s</a>',
                $link_attrs,
                $media_width ? ' style="width:' . esc_attr( $media_width ) . ';max-width:100%"' : '',
                $media_inner_html,
                $media_width ? ' tfw-media-sized' : ''
            );
        }

        return $media_inner_html;
    }

    /**
     * Build safe link attributes from Elementor URL control.
     *
     * @param array  $link       Elementor URL control value.
     * @param string $aria_label Optional accessible label.
     */
    private function get_link_attributes_string( $link, $aria_label = '' ) {
        if ( empty( $link['url'] ) ) {
            return '';
        }

        $attributes = [ 'href="' . esc_url( $link['url'] ) . '"' ];

        if ( ! empty( $link['is_external'] ) ) {
            $attributes[] = 'target="_blank"';
        }

        $rel = [];

        if ( ! empty( $link['nofollow'] ) ) {
            $rel[] = 'nofollow';
        }

        if ( ! empty( $link['is_external'] ) ) {
            $rel[] = 'noopener';
            $rel[] = 'noreferrer';
        }

        if ( ! empty( $rel ) ) {
            $attributes[] = 'rel="' . esc_attr( implode( ' ', array_unique( $rel ) ) ) . '"';
        }

        if ( '' !== $aria_label ) {
            $attributes[] = 'aria-label="' . esc_attr( $aria_label ) . '"';
        }

        return implode( ' ', $attributes );
    }

    /**
     * Accept a bounded Elementor slider value as a safe CSS font size.
     *
     * @param mixed $value Elementor slider settings.
     * @return string
     */
    private function item_font_size_css( $value ) {
        if ( ! is_array( $value ) || ! isset( $value['size'] ) || ! is_numeric( $value['size'] ) ) {
            return '';
        }
        $size = (float) $value['size'];
        $unit = $value['unit'] ?? 'px';
        if ( $size < 1 || $size > 300 || ! in_array( $unit, [ 'px', 'em', 'rem' ], true ) ) {
            return '';
        }
        return (string) $size . $unit;
    }

    /**
     * Build a sanitized style attribute from CSS declarations.
     *
     * @param array $styles Property/value pairs.
     */
    private function build_style_attr( $styles ) {
        $parts = [];

        $allowed_properties = [ 'color', 'background-color', 'background-image', 'background-size', 'background-position', 'text-align', 'font-size' ];
        foreach ( $styles as $property => $value ) {
            if ( ! in_array( $property, $allowed_properties, true ) ) {
                continue;
            }
            if ( '' === $value || null === $value ) {
                continue;
            }

            // Elementor's color picker normally supplies these; imported settings
            // must never be able to append extra CSS declarations.
            if ( in_array( $property, [ 'color', 'background-color' ], true ) &&
                ! preg_match( '/^(?:#[0-9a-f]{3,8}|rgba?\([0-9.,%\s]+\)|hsla?\([0-9.,%\s]+\)|var\(--[a-z0-9-]+\)|transparent|currentcolor)$/i', $value ) ) {
                continue;
            }
            if ( 'font-size' === $property && ! preg_match( '/^\d+(?:\.\d+)?(?:px|em|rem)$/', $value ) ) {
                continue;
            }
            if ( 'background-image' === $property &&
                ! preg_match( '/^url\("https?:\/\/[^"<>]+"\)$/i', $value ) ) {
                continue;
            }
            $parts[] = sanitize_key( $property ) . ':' . $value;
        }

        if ( empty( $parts ) ) {
            return '';
        }

        return ' style="' . esc_attr( implode( ';', $parts ) ) . '"';
    }

    /**
     * Determine the item's horizontal layout. Old saved widgets had a global
     * setting; consult it only when the item has no layout property of its own.
     * New repeaters always store their own off-by-default value.
     *
     * @param array $item     Repeater item.
     * @param array $settings Historic widget settings for backward compatibility.
     */
    private function is_item_horizontal_layout( $item, $settings ) {
        $layout = $item['item_content_layout'] ?? null;
        if ( null !== $layout && 'global' !== $layout ) {
            return 'horizontal' === $layout;
        }

        return 'yes' === ( $settings['tl_content_horizontal_layout'] ?? '' );
    }

    /**
     * Determine the item's media order. Historic global settings are read only
     * for items created before this per-item control existed.
     *
     * @param array $item     Repeater item.
     * @param array $settings Historic widget settings for backward compatibility.
     */
    private function is_item_reversed( $item, $settings ) {
        if ( array_key_exists( 'tl_card_change_direction', $item ) ) {
            return 'yes' === $item['tl_card_change_direction'];
        }

        return 'yes' === ( $settings['shared_reverse_media_content'] ?? '' );
    }

    /**
     * Normalize an alignment value for inline styles and generated selectors.
     *
     * @param string $alignment Alignment value.
     */
    private function get_alignment_value( $alignment ) {
        $allowed = [ 'left', 'center', 'right' ];

        return in_array( $alignment, $allowed, true ) ? $alignment : 'left';
    }

    /**
     * Editor template (Underscore.js).
     */
    protected function content_template() {
        ?>
        <#
        function isVideoUrl(url) {
            return !!url && /\.(mp4|webm|ogg|ogv)(\?.*)?$/i.test(url);
        }

        function buildTitleText(item) {
            return _.escape(item.list_title || '').replace(/\n/g, '<br>');
        }

        function buildLinkAttributes(link, ariaLabel) {
            if (!link || !link.url) return '';

            var attrs = ' href="' + _.escape(link.url) + '"';
            var rel = [];

            if (link.is_external) {
                attrs += ' target="_blank"';
                rel.push('noopener', 'noreferrer');
            }

            if (link.nofollow) {
                rel.unshift('nofollow');
            }

            if (rel.length) {
                attrs += ' rel="' + _.escape(_.uniq(rel).join(' ')) + '"';
            }

            if (ariaLabel) {
                attrs += ' aria-label="' + _.escape(ariaLabel) + '"';
            }

            return attrs;
        }

        function getImageUrl(item) {
            if (!item.media_image || !item.media_image.url) {
                return '';
            }

            var imageUrl = item.media_image.url;
            var hasAttachmentId = !!item.media_image.id;
            var hasCustomDimensions = item.thumbnail_size !== 'custom' || (
                item.thumbnail_custom_dimension &&
                item.thumbnail_custom_dimension.width &&
                item.thumbnail_custom_dimension.height
            );

            if (
                hasAttachmentId &&
                hasCustomDimensions &&
                typeof elementor !== 'undefined' &&
                elementor.imagesManager &&
                typeof elementor.imagesManager.getImageUrl === 'function'
            ) {
                var resolvedImageUrl = elementor.imagesManager.getImageUrl({
                    id: item.media_image.id,
                    url: item.media_image.url,
                    size: mediaWidthCss(item.media_width_value ? String(item.media_width_value) + (item.media_width_unit === '%' ? '%' : 'px') : item.media_width) ? 'full' : (item.thumbnail_size || 'full'),
                    dimension: item.thumbnail_custom_dimension || {},
                    model: view.getEditModel()
                });

                if (resolvedImageUrl) {
                    imageUrl = resolvedImageUrl;
                }
            }

            return imageUrl;
        }

        function mediaWidthCss(value) {
            var match = /^(\d+(?:\.\d+)?)(px|%)$/i.exec(String(value || '').trim());
            if (!match) return '';
            var number = Number(match[1]);
            return number > 0 && number <= (match[2] === '%' ? 100 : 5000)
                ? match[1] + match[2].toLowerCase() : '';
        }

        function buildMediaHtml(item) {
            if (item.show_media === 'no') return '';
            var imageUrl = '';
            var posterUrl = '';
            var isVideo = false;
            var html = '';
            var mediaLink = item.media_link_url || {};
            var wrapWithLink = mediaLink.url && item.media_link_enabled === 'yes';

            if (item.media_type === 'video') {
                imageUrl = item.media_video && item.media_video.url ? item.media_video.url : '';
                isVideo = !!imageUrl;
                posterUrl = (item.posterURL && item.posterURL.url) ? item.posterURL.url : '';
                if (!imageUrl && posterUrl) {
                    imageUrl = posterUrl;
                }
            } else {
                imageUrl = getImageUrl(item);
            }

            if (!imageUrl) return '';

            if (isVideo) {
                var sourceType = (imageUrl.match(/\.([^.?]+)(\?.*)?$/i) || [])[1] || 'mp4';
                var posterAttr = posterUrl ? ' poster="' + _.escape(posterUrl) + '"' : '';

                html += '<div class="timeline_pic pull-left">';
                html += '<video autoplay muted loop playsinline preload="metadata"' + posterAttr + '>';
                html += '<source src="' + _.escape(imageUrl) + '" type="video/' + _.escape(sourceType) + '">';
                html += _.escape('<?php echo esc_js( __( 'Your browser does not support the video tag.', 'timeline-full-widget' ) ); ?>');
                html += '</video>';
                html += '</div>';
            } else {
                var alt = item.media_type === 'video' ? '<?php echo esc_js( __( 'Video placeholder', 'timeline-full-widget' ) ); ?>' : (item.media_image_alt || (item.media_image && (item.media_image.alt || item.media_image.title) ? (item.media_image.alt || item.media_image.title) : ''));

                html += '<div class="timeline_pic pull-left">';
                html += '<img' + (item.media_type === 'video' ? ' class="timeline-video-placeholder"' : '') + ' src="' + _.escape(imageUrl) + '" alt="' + _.escape(alt) + '" loading="lazy" decoding="async"/>';
                html += '</div>';
            }

            var width = mediaWidthCss(item.media_width_value !== undefined && item.media_width_value !== '' && item.media_width_value !== null
                ? String(item.media_width_value) + (item.media_width_unit === '%' ? '%' : 'px')
                : item.media_width);
            if (width && !wrapWithLink) {
                html = html.replace('class="timeline_pic pull-left"', 'class="timeline_pic pull-left tfw-media-sized" style="width:' + _.escape(width) + ';max-width:100%"');
            }

            if (wrapWithLink) {
                var ariaLabel = item.list_title ? 'Open media for "' + item.list_title + '"' : 'Open media link';
                var linkWidth = width ? ' style="width:' + _.escape(width) + ';max-width:100%"' : '';
                html = '<a class="timeline-media-link' + (width ? ' tfw-media-sized' : '') + '"' + buildLinkAttributes(mediaLink, ariaLabel) + linkWidth + '>' + html + '</a>';
            }

            return html;
        }

        function itemUsesSharedStyles(item) {
            return typeof item.inherit_item_styles === 'undefined' || item.inherit_item_styles === 'yes';
        }

        function isHorizontalLayout(item) {
            var layout = item.item_content_layout;
            if (typeof layout !== 'undefined' && layout !== null && layout !== 'global') {
                return layout === 'horizontal';
            }
            // Read-only compatibility for widgets saved before per-item controls.
            return settings.tl_content_horizontal_layout === 'yes';
        }

        function isItemReversed(item) {
            if (Object.prototype.hasOwnProperty.call(item, 'tl_card_change_direction')) {
                return item.tl_card_change_direction === 'yes';
            }
            return settings.shared_reverse_media_content === 'yes';
        }

        function buildTitleHtml(item, styleAttr) {
            var titleTag = settings.header_tag || 'h3';
            var titleLink = item.title_link_url || {};
            var safeTitle = buildTitleText(item);
            var attr = styleAttr ? ' ' + styleAttr : '';

            if (titleTag === 'a' && titleLink.url) {
                return '<a class="tl-title"' + buildLinkAttributes(titleLink) + attr + '>' + safeTitle + '</a>';
            }

            if ([ 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p' ].indexOf(titleTag) !== -1) {
                return '<' + titleTag + ' class="tl-title"' + attr + '>' + safeTitle + '</' + titleTag + '>';
            }

            return '<div class="tl-title"' + attr + '>' + safeTitle + '</div>';
        }

        function buildStyleAttr(styles) {
            var parts = [];
            _.each(styles, function(value, prop) {
                if (value) {
                    parts.push(prop + ':' + _.escape(value));
                }
            });

            return parts.length ? 'style="' + parts.join(';') + '"' : '';
        }

        function itemFontSizeCss(value) {
            var n = Number(value && value.size);
            var unit = value && value.unit || 'px';
            return Number.isFinite(n) && n >= 1 && n <= 300 && ['px', 'em', 'rem'].indexOf(unit) !== -1
                ? n + unit : '';
        }

        function getAlignmentValue(value) {
            if ([ 'left', 'center', 'right' ].indexOf(value) === -1) {
                value = 'left';
            }

            return value;
        }


        var showMarker = settings.tl_show_marker === 'yes';
        var animationMarkerEnabled = showMarker && settings.tl_animation_marker === 'yes';
        var stickyOtherSide = settings.tl_animation_other_side_sticky === 'yes';
        var showOtherSide = settings.tl_show_other_side !== 'no';

        var ulClassesArr = ['timeline'];
        if (animationMarkerEnabled) ulClassesArr.push('timeline-animation-marker');
        if (stickyOtherSide) ulClassesArr.push('timeline-animation-other-side-sticky');
        if (settings.tl_show_step_numbers === 'yes') ulClassesArr.push('timeline-numbers');

        var ulClass = _.escape( ulClassesArr.join(' ') );
        var onSide = settings.tl_change_onside === 'yes';
        var direction = settings.tl_change_direction === 'left' ? 'left' : 'right';
        var count = direction === 'left' ? 1 : 2;
        #>

        <div class="wp-block-za-timeline-full-widget timeline-full-widget-elementor">
            <div class="timeline-wrapper">
                <# if ( settings.tl_animation_timeline === 'yes' ) { #>
                    <div class="timeline-line-animation"></div>
                <# } #>

                <ul class="{{ ulClass }}">
                    <# if ( settings.list ) { _.each( settings.list, function( item ) {
                        var liClass = onSide
                            ? ( direction === 'right' ? 'timeline-inverted' : 'timeline-left' )
                            : ( ( ++count % 2 === 0 ) ? 'timeline-inverted' : 'timeline-left' );
                        var itemClasses = [
                            'wp-block-za-timeline-item',
                            'timeline-item',
                            liClass,
                            item._id ? 'elementor-repeater-item-' + item._id : ''
                        ];
                        var contentClasses = [ 'tl-content' ];
                        var mediaHtml = buildMediaHtml(item);
                        var usesSharedStyles = itemUsesSharedStyles(item);
                        var cardImageUrl = item.card_background_image && item.card_background_image.url ? item.card_background_image.url : '';
                        var cardImageSafe = /^https?:\/\//i.test(cardImageUrl) ? cardImageUrl.replace(/["'()\\]/g, '') : '';
                        var panelStyle = buildStyleAttr({
                            'background-color': item.li_bg_color || settings.shared_item_background_color || '',
                            'background-image': cardImageSafe ? 'url(' + cardImageSafe + ')' : '',
                            'background-size': cardImageSafe ? 'cover' : '',
                            'background-position': cardImageSafe ? 'center' : ''
                        });
                        var itemStyle = buildStyleAttr({ 'background-color': item.item_outer_background_color || '' });
                        var titleStyle = usesSharedStyles ? '' : buildStyleAttr({
                            'color': item.item_title_color || '',
                            'font-size': itemFontSizeCss(item.item_title_font_size),
                            'text-align': getAlignmentValue(item.item_title_alignment || 'left')
                        });
                        var contentStyle = usesSharedStyles ? '' : buildStyleAttr({
                            'color': item.item_content_color || '',
                            'font-size': itemFontSizeCss(item.item_content_font_size)
                        });
                        var sideStyle = usesSharedStyles ? '' : buildStyleAttr({
                            'color': item.item_side_color || '',
                            'font-size': itemFontSizeCss(item.item_side_font_size)
                        });

                        if (!usesSharedStyles) {
                            itemClasses.push('timeline-item-unique-style');
                            if (item.item_side_color) itemClasses.push('tfw-side-custom-color');
                            if (itemFontSizeCss(item.item_side_font_size)) itemClasses.push('tfw-side-custom-size');
                            if (item.item_content_color) itemClasses.push('tfw-content-custom-color');
                            if (itemFontSizeCss(item.item_content_font_size)) itemClasses.push('tfw-content-custom-size');
                        }

                        if (isHorizontalLayout(item)) {
                            contentClasses.push('tl-content-horizontal');
                        }

                        if (isItemReversed(item)) {
                            contentClasses.push('tl-reverse');
                        }
                    #>
                    <li class="{{ _.escape( itemClasses.join(' ') ) }}" {{{ itemStyle }}}>
                        <div class="tl-trigger"></div>
                        <# if ( showMarker ) { #>
                            <# if ( settings.tl_is_marker_unique === 'yes' && item.marker_image && item.marker_image.url ) { #>
                                <div class="tl-mark"><img src="{{ item.marker_image.url }}" alt="{{ item.marker_image_alt || item.marker_image.alt || '' }}" loading="lazy" decoding="async"/></div>
                            <# } else { #>
                                <div class="tl-mark"></div>
                            <# } #>
                        <# } #>

                        <div class="wp-block-za-timeline-item-side timeline-side" {{{ sideStyle }}}>
                            <# if ( showOtherSide ) { #>
                                {{{ item.side_content }}}
                            <# } #>
                        </div>

                        <div class="wp-block-za-timeline-item-content timeline-panel" {{{ panelStyle }}}>
                            <div class="{{ _.escape( contentClasses.join( ' ' ) ) }}">
                                <# if ( mediaHtml ) { #>
                                    {{{ mediaHtml }}}
                                <# } #>
                                <div class="tl-desc">
                                    <div class="tl-desc-short" {{{ contentStyle }}}>
                                        {{{ buildTitleHtml(item, titleStyle) }}}
                                        {{{ item.list_content }}}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </li>
                    <# }); } #>
                </ul>
            </div>
        </div>
        <?php
    }
}
