<?php
/**
 * Elementor Timeline Widget.
 * @since 1.0.0
 */

namespace BePack\Widgets;

use Elementor\Widget_Base;
use Elementor\Controls_Manager;
use Elementor\Repeater;
use Elementor\Utils;
use Elementor\Group_Control_Image_Size;

if (!defined('ABSPATH')) {
    exit;
}

class Za_Pack_Widget_Timeline extends Widget_Base
{

    public function get_name()
    {
        return 'za-timeline';
    }

    public function get_title()
    {
        return __('Timeline', 'timeline-full-widget');
    }

    public function get_icon()
    {
        return 'eicon-time-line';
    }

    public function get_categories()
    {
        return ['basic'];
    }

    public function get_keywords()
    {
        return ['timeline', 'history', 'event'];
    }

    public function get_style_depends()
    {
        return ['timeline-elementor-style'];
    }

    public function get_script_depends()
    {
        return ['za-timeline-elementor'];
    }

    /* ---------------------------
     * Register controls
     * --------------------------- */
    protected function register_controls()
    {
        $this->register_content_controls();
        $this->register_style_controls();
    }

    protected function register_content_controls()
    {
        $this->start_controls_section(
                'content_section',
                [
                        'label' => __('Timeline Items', 'timeline-full-widget'),
                        'tab' => Controls_Manager::TAB_CONTENT,
                ]
        );

        $repeater = new Repeater();

        $repeater->add_control(
                'li_bg_color',
                [
                        'label' => __('Item background color', 'timeline-full-widget'),
                        'type' => Controls_Manager::COLOR,
                        'selectors' => [
                                '{{WRAPPER}} {{CURRENT_ITEM}} .timeline-panel' => 'background-color: {{VALUE}};',
                        ],
                ]
        );

        $repeater->add_control(
                'media_type',
                [
                        'label' => __('Media Type', 'timeline-full-widget'),
                        'type' => Controls_Manager::SELECT,
                        'options' => [
                                'image' => __('Image', 'timeline-full-widget'),
                                'video' => __('Video', 'timeline-full-widget'),
                        ],
                        'default' => 'image',
                ]
        );

        $repeater->add_control(
                'media_image',
                [
                        'label' => __('Image', 'timeline-full-widget'),
                        'type' => Controls_Manager::MEDIA,
                        'media_types' => ['image'],
                        'default' => ['url' => Utils::get_placeholder_image_src()],
                        'condition' => ['media_type' => 'image'],
                ]
        );

        $repeater->add_control(
                'media_video',
                [
                        'label' => __('Video', 'timeline-full-widget'),
                        'type' => Controls_Manager::MEDIA,
                        'media_types' => ['video'],
                        'condition' => ['media_type' => 'video'],
                ]
        );

        $repeater->add_control(
                'posterURL',
                [
                        'label' => __('Poster URL', 'timeline-full-widget'),
                        'type' => Controls_Manager::MEDIA,
                        'media_types' => ['image'],
                        'default' => ['url' => Utils::get_placeholder_image_src()],
                        'condition' => ['media_type' => 'video'],
                ]
        );

        $repeater->add_group_control(
                Group_Control_Image_Size::get_type(),
                [
                        'name' => 'thumbnail',
                        'default' => 'medium',
                        'separator' => 'none',
                ]
        );

        $repeater->add_control(
                'list_title',
                [
                        'label' => __('Title', 'timeline-full-widget'),
                        'type' => Controls_Manager::TEXT,
                        'default' => __('Timeline Title', 'timeline-full-widget'),
                        'label_block' => true,
                ]
        );

        $repeater->add_control(
                'link_url',
                [
                        'label' => __('Link', 'timeline-full-widget'),
                        'type' => Controls_Manager::URL,
                        'placeholder' => 'https://example.com',
                        'show_external' => true,
                ]
        );

        $repeater->add_control(
                'list_content',
                [
                        'label' => __('Content', 'timeline-full-widget'),
                        'type' => Controls_Manager::WYSIWYG,
                        'default' => __('Timeline content here...', 'timeline-full-widget'),
                ]
        );

        $repeater->add_control(
                'side_content',
                [
                        'label' => __('Side Content', 'timeline-full-widget'),
                        'type' => Controls_Manager::WYSIWYG,
                        'default' => '',
                ]
        );

        $repeater->add_control(
                'marker_image',
                [
                        'label' => __('Marker Image', 'timeline-full-widget'),
                        'type' => Controls_Manager::MEDIA,
                        'media_types' => ['image'],

                ]
        );
        $repeater->add_control(
                'marker_image_notice',
                [
                        'type' => Controls_Manager::RAW_HTML,
                        'raw' => sprintf(
                                '<div class="elementor-control-description">%s</div>',
                                esc_html__('Note: this image will be used only when "Unique Marker" (Style) is set to Yes. Recommend width size <=30px', 'timeline-full-widget')
                        ),
                        'content_classes' => 'elementor-control-descriptor',
                ]
        );

        $this->add_control(
                'list',
                [
                        'type' => Controls_Manager::REPEATER,
                        'fields' => $repeater->get_controls(),
                        'title_field' => '{{{ list_title }}}',
                        'default' => [
                                [
                                        'list_title' => __('Timeline Item #1', 'timeline-full-widget'),
                                        'list_content' => __('Content for item #1', 'timeline-full-widget'),
                                ],
                                [
                                        'list_title' => __('Timeline Item #2', 'timeline-full-widget'),
                                        'list_content' => __('Content for item #2', 'timeline-full-widget'),
                                ],
                        ],
                ]
        );

        $this->end_controls_section();
    }

    protected function register_style_controls()
    {
        $this->start_controls_section(
                'style_section',
                [
                        'label' => __('Style', 'timeline-full-widget'),
                        'tab' => Controls_Manager::TAB_STYLE,
                ]
        );

        $this->add_control(
                'header_tag',
                [
                        'label' => __('Title HTML Tag', 'timeline-full-widget'),
                        'type' => Controls_Manager::SELECT,
                        'options' => array_combine(
                                ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div', 'span', 'p', 'a'],
                                ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'div', 'span', 'p', 'a']
                        ),
                        'default' => 'h2',
                ]
        );
        $this->add_control(
                'blocks_color',
                [
                        'label' => __('Blocks Color', 'timeline-full-widget'),
                        'type' => Controls_Manager::COLOR,
                        'default' => '#333333',
                        'selectors' => [
                                '{{WRAPPER}} .timeline-item' => 'color: {{VALUE}};',
                        ]
                ]
        );

        $this->add_control(
                'timeline_color',
                [
                        'label' => __('Line & Marker Color', 'timeline-full-widget'),
                        'type' => Controls_Manager::COLOR,
                        'default' => '#F6F6F8',
                        'selectors' => [
                                '{{WRAPPER}} .tl-mark' => 'background-color: {{VALUE}};',
                                '{{WRAPPER}} .timeline:before' => 'background-color: {{VALUE}};',
                        ],
                ]
        );

        $this->add_control(
                'timeline_animation_color',
                [
                        'label' => __('Animation Color', 'timeline-full-widget'),
                        'type' => Controls_Manager::COLOR,
                        'default' => '#F37321',
                        'selectors' => [
                                '{{WRAPPER}} .timeline-line-animation' => 'background-color: {{VALUE}};',
                                '{{WRAPPER}} .is-stuck .tl-mark' => 'background-color: {{VALUE}};',
                        ],
                        'condition' => [
                                'tl_animation_timeline' => 'yes',
                        ],
                ]
        );

        $this->add_control(
                'tl_change_direction',
                [
                        'label' => __('Timeline Direction', 'timeline-full-widget'),
                        'type' => Controls_Manager::SWITCHER,
                        'label_on' => __('Left', 'timeline-full-widget'),
                        'label_off' => __('Right', 'timeline-full-widget'),
                        'return_value' => 'left',
                ]
        );

        $this->add_control(
                'tl_change_onside',
                [
                        'label' => __('Single-Side Layout', 'timeline-full-widget'),
                        'type' => Controls_Manager::SWITCHER,
                        'label_on' => __('Yes', 'timeline-full-widget'),
                        'label_off' => __('No', 'timeline-full-widget'),
                        'return_value' => 'yes',
                ]
        );

        $this->add_control(
                'tl_animation_timeline',
                [
                        'label' => __('Animate Timeline Line', 'timeline-full-widget'),
                        'type' => Controls_Manager::SWITCHER,
                        'label_on' => __('Yes', 'timeline-full-widget'),
                        'label_off' => __('No', 'timeline-full-widget'),
                        'return_value' => 'yes',
                        'default' => 'yes',
                ]
        );

        $this->add_control(
                'tl_show_marker',
                [
                        'label' => __('Show Marker', 'timeline-full-widget'),
                        'type' => Controls_Manager::SWITCHER,
                        'label_on' => __('Yes', 'timeline-full-widget'),
                        'label_off' => __('No', 'timeline-full-widget'),
                        'return_value' => 'yes',
                        'default' => 'yes',
                ]
        );
        $this->add_control(
                'tl_is_marker_unique',
                [
                        'label' => __('Unique Marker', 'timeline-full-widget'),
                        'type' => Controls_Manager::SWITCHER,
                        'label_on' => __('Yes', 'timeline-full-widget'),
                        'label_off' => __('No', 'timeline-full-widget'),
                        'return_value' => 'yes',
                        'default' => 'no',
                        'condition' => [
                                'tl_show_marker' => 'yes',
                        ],
                ]
        );

        $this->add_control(
                'tl_animation_marker',
                [
                        'label' => __('Animate Markers', 'timeline-full-widget'),
                        'type' => Controls_Manager::SWITCHER,
                        'label_on' => __('Yes', 'timeline-full-widget'),
                        'label_off' => __('No', 'timeline-full-widget'),
                        'return_value' => 'yes',
                        'default' => 'yes',
                        'condition' => [
                                'tl_show_marker' => 'yes',
                        ],
                ]
        );

        $this->end_controls_section();
    }

    /* Render */
    protected function render()
    {
        $settings = $this->get_settings_for_display();
        $items = !empty($settings['list']) && is_array($settings['list']) ? $settings['list'] : [];
        // validate tag
        $tag = Utils::validate_html_tag($settings['header_tag'] ?? 'h2');
        $on_side = ($settings['tl_change_onside'] ?? '') === 'yes';
        $direction = ($settings['tl_change_direction'] ?? '') === 'left' ? 'left' : 'right';

        $show_marker = ($settings['tl_show_marker'] ?? '') === 'yes';
        $animation_marker_enabled = $show_marker && (($settings['tl_animation_marker'] ?? '') === 'yes');

        $wrapper_attr = esc_attr($settings['tl_animation_timeline'] ?? '');
        echo '<div class="timeline-wrapper" data-animate-timeline="' . esc_attr($wrapper_attr) . '">';

        // animation line
        if (($settings['tl_animation_timeline'] ?? '') === 'yes') {
            echo '<div class="timeline-line-animation"></div>';
        }

        // ul open
        $ul_class = $animation_marker_enabled ? 'timeline timeline-animation-marker' : 'timeline';
        echo '<ul class="' . esc_attr($ul_class) . '">';

        // iterate items
        $countBase = ($direction === 'left') ? 1 : 2;
        $count = $countBase;
        foreach ($items as $index => $item) {
            if ($on_side) {
                $li_class = ($direction === 'right') ? 'timeline-inverted' : 'timeline-left';
            } else {
                $count++;
                $li_class = ($count % 2 === 0) ? 'timeline-inverted' : 'timeline-left';
            }
            // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
            echo $this->render_item_html($li_class, $item, $tag, $show_marker);
        }

        echo '</ul></div>';

        if (wp_script_is('za-timeline-elementor', 'registered')) {
            wp_enqueue_script('za-timeline-elementor');
        }
        if (wp_style_is('timeline-elementor-style', 'registered')) {
            wp_enqueue_style('timeline-elementor-style');
        }
    }

    /**
     * Render single <li>
     */
    private function render_item_html($li_class, $item, $tag, $show_marker = false)
    {
        $title = isset($item['list_title']) ? sanitize_text_field($item['list_title']) : '';
        $side_content = isset($item['side_content']) ? wp_kses_post($item['side_content']) : '';
        $link = isset($item['link_url']) ? $item['link_url'] : [];

        $bg_color = !empty($item['li_bg_color']) ? 'background-color:' . esc_attr($item['li_bg_color']) . ';' : '';

        $media_html = $this->render_media_html($item);

        ob_start();
        ?>
        <li class="<?php echo esc_attr($li_class); ?> timeline-item">
            <div class="timeline-side"><?php echo wp_kses_post($side_content); ?></div>
            <div class="tl-trigger"></div>

            <?php if ($show_marker) : ?>
                <?php
                $unique_marker_enabled = ($this->get_settings_for_display('tl_is_marker_unique') === 'yes');
                $marker_img = $item['marker_image']['url'] ?? '';

                if ($unique_marker_enabled && $marker_img) {
                    echo '<div class="tl-mark"><img src="' . esc_url($marker_img) . '" alt="marker" loading="lazy" decoding="async" /></div>';
                } else {
                    echo '<div class="tl-mark"></div>';
                }
                ?>
            <?php endif; ?>

            <div class="timeline-panel" <?php if ($bg_color) echo 'style="' . esc_attr($bg_color) . '"'; ?>>
                <div class="tl-content">
                    <?php
                    // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
                    echo $media_html; ?>
                    <div class="tl-desc">
                        <?php
                        if ($tag === 'a' && !empty($link['url'])) {
                            printf(
                                    '<a href="%1$s"%2$s%3$s class="tl-title">%4$s</a>',
                                    esc_url($link['url']),
                                    !empty($link['is_external']) ? ' target="' . esc_attr('_blank') . '"' : '',
                                    !empty($link['nofollow']) ? ' rel="' . esc_attr('nofollow') . '"' : '',
                                    esc_html($title)
                            );
                        } else {
                            printf(
                                    '<%1$s class="tl-title">%2$s</%1$s>',
                                    tag_escape($tag),
                                    esc_html($title)
                            );
                        } ?>
                        <div class="tl-desc-short">
                            <?php echo wp_kses_post($item['list_content'] ?? ''); ?>
                        </div>
                    </div>
                </div>
            </div>
        </li>
        <?php
        return ob_get_clean();
    }

    /**
     * Render media HTML (image or video).
     */
    private function render_media_html($item)
    {
        $type = $item['media_type'] ?? '';

        // VIDEO
        if ($type === 'video') {
            $media_url = $item['media_video']['url'] ?? '';
            $poster = $item['posterURL']['url'] ?? '';

            if (empty($media_url)) {
                return '';
            }

            $filetype = wp_check_filetype($media_url);
            $mime = $filetype['type'] ?: 'video/mp4';
            $poster_attr = $poster ? ' poster="' . esc_url($poster) . '"' : '';

            return sprintf(
                    '<div class="timeline_pic pull-left"><video autoplay muted loop playsinline preload="metadata"%1$s style="width:100%%;height:auto;"><source src="%2$s" type="%3$s">%4$s</video></div>',
                    $poster_attr,
                    esc_url($media_url),
                    esc_attr($mime),
                    esc_html__('Your browser does not support the video tag.', 'timeline-full-widget')
            );
        }


        $media = $item['media_image'] ?? [];
        $media_url = $media['url'] ?? '';

        // If attachment ID exists — let Group_Control_Image_Size handle output (safe markup).
        if (!empty($media['id'])) {
            return '<div class="timeline_pic pull-left">' . Group_Control_Image_Size::get_attachment_image_html($item, 'thumbnail', 'media_image') . '</div>';
        }

        // If direct URL — print <img> with optimized attributes
        if ($media_url) {
            $alt = $media['alt'] ?? $media['title'] ?? '';
            return sprintf(
                    '<div class="timeline_pic pull-left"><img src="%1$s" alt="%2$s" loading="lazy" decoding="async" /></div>',
                    esc_url($media_url),
                    esc_attr($alt)
            );
        }

        return '';
    }


    /*  Editor template (Underscore.js) */
    protected function content_template() { ?>
        <div class="timeline-wrapper">
            <# if ( settings.tl_animation_timeline === 'yes' ) { #>
            <div class="timeline-line-animation"></div>
            <# } #>

            <#
            function isVideoUrl(url) {
            if (!url) return false;
            return /\.(mp4|webm|ogg|ogv)(\?.*)?$/i.test(url);
            }

            function buildTitleHtml(item) {
            var safeTitle = _.escape(item.list_title || '');
            if (item.link_url && item.link_url.url) {
            var href = _.escape(item.link_url.url);
            var attrs = ' href="' + href + '"';
            if (item.link_url.is_external) attrs += ' target="_blank"';
            if (item.link_url.nofollow) attrs += ' rel="nofollow"';
            return '<a' + attrs + '>' + safeTitle + '</a>';
            }
            return safeTitle;
            }

            function buildMediaHtml(item) {
            var image_url = '';
            var poster_url = '';
            var isVideo = false;

            if (item.media_type === 'video' && item.media_video && item.media_video.url) {
            image_url = item.media_video.url;
            isVideo = isVideoUrl(image_url);
            poster_url = (item.posterURL && item.posterURL.url) ? item.posterURL.url : '';
            } else if (item.media_image && item.media_image.url) {
            image_url = item.media_image.url;
            }

            if (!image_url) return '';

            if (isVideo) {
            var sourceType = (image_url.match(/\.([^.?]+)(\?.*)?$/i) || [])[1] || 'mp4';
            var posterAttr = poster_url ? ' poster="' + _.escape(poster_url) + '"' : '';
            // Собираем строку без многострочных '...' литералов
            return '<div class="timeline_pic pull-left"><video playsinline preload="metadata"'
                + posterAttr
                + ' style="width:100%;height:auto;"><source src="' + _.escape(image_url) + '" type="video/' + _.escape(sourceType) + '">'
                + _.escape('Your browser does not support the video tag.')
                + '</video></div>';
            }

            var alt = (item.media_image && (item.media_image.alt || item.media_image.title)) ? _.escape(item.media_image.alt || item.media_image.title) : '';
            return '<div class="timeline_pic pull-left"><img src="' + _.escape(image_url) + '" alt="' + alt + '" loading="lazy" decoding="async" /></div>';
            }
            #>

            <#
            var showMarker = settings.tl_show_marker === 'yes';
            var animationMarkerEnabled = showMarker && settings.tl_animation_marker === 'yes';
            var ulClass = animationMarkerEnabled ? 'timeline timeline-animation-marker' : 'timeline';
            var onSide = settings.tl_change_onside === 'yes';
            var direction = settings.tl_change_direction ? 'left' : 'right';
            var count = direction === 'left' ? 1 : 2;
            #>

            <ul class="{{ ulClass }}">
                <# if ( settings.list ) { _.each( settings.list, function( item ) {
                var li_class = '';
                if ( onSide ) {
                li_class = (direction === 'right') ? 'timeline-inverted' : 'timeline-left';
                } else {
                count++;
                li_class = (count % 2 === 0) ? 'timeline-inverted' : 'timeline-left';
                }
                var bg_color = item.li_bg_color ? 'background-color:' + _.escape(item.li_bg_color) + ';' : '';
                var titleTag = settings.header_tag ? settings.header_tag : 'h2';
                var titleInner = buildTitleHtml(item);
                var titleHtml = '<' + titleTag + ' class="tl-title">' + titleInner + '</' + titleTag + '>';
            var mediaHtml = buildMediaHtml(item);
            #>

            <li class="{{ li_class }} timeline-item">
                <div class="timeline-side">{{{ item.side_content }}}</div>
                <div class="tl-trigger"></div>

                <# if ( showMarker ) { #>
                <# if ( settings.tl_is_marker_unique === 'yes' && item.marker_image && item.marker_image.url ) { #>
                <div class="tl-mark"><img src="{{ item.marker_image.url }}" alt="marker" loading="lazy" decoding="async" /></div>
                <# } else { #>
                <div class="tl-mark"></div>
                <# } #>
                <# } #>

                <div class="timeline-panel" style="{{ bg_color }}">
                    <div class="tl-content">
                        <# if ( mediaHtml ) { #>
                        {{{ mediaHtml }}}
                        <# } #>
                        <div class="tl-desc">
                            {{{ titleHtml }}}
                            <div class="tl-content">{{{ item.list_content }}}</div>
                        </div>
                    </div>
                </div>
            </li>
            <# }); } #>
            </ul>
        </div>
        <?php
    }
}

/* Register widget */
add_action('elementor/widgets/register', function ($widgets_manager) {
    $widgets_manager->register(new \BePack\Widgets\Za_Pack_Widget_Timeline());
});
