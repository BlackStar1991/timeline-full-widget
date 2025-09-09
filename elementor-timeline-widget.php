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


if (!defined('ABSPATH')) exit;

class Za_Pack_Widget_Timeline extends Widget_Base
{

    public function get_style_depends() {
        return ['timeline-elementor-style'];
    }

    public function get_script_depends() {
        return ['timeline-elementor-script'];
    }

    public function get_name()
    {
        return 'za-timeline';
    }

    public function get_title()
    {
        return __('Timeline', 'za');
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

    protected function register_controls()
    {
        $this->start_controls_section('content_section', [
            'label' => __('Timeline Items', 'za'),
            'tab' => Controls_Manager::TAB_CONTENT,
        ]);

        $repeater = new Repeater();

        $repeater->add_control('image', [
            'label' => __('Image', 'za'),
            'type' => Controls_Manager::MEDIA,
            'default' => ['url' => Utils::get_placeholder_image_src()],
        ]);

        $repeater->add_group_control(
            Group_Control_Image_Size::get_type(),
            [
                'name' => 'thumbnail',
                'default' => 'medium',
                'separator' => 'none',
            ]
        );

        $repeater->add_control('list_title', [
            'label' => __('Title', 'za'),
            'type' => Controls_Manager::TEXT,
            'default' => __('Timeline Title', 'za'),
            'label_block' => true,
        ]);

        $repeater->add_control('link_url', [
            'label' => __('Link', 'za'),
            'type' => Controls_Manager::URL,
            'placeholder' => 'https://example.com',
            'show_external' => true,
        ]);

        $repeater->add_control('list_content', [
            'label' => __('Content', 'za'),
            'type' => Controls_Manager::WYSIWYG,
            'default' => __('Timeline content here...', 'za'),
        ]);

        $repeater->add_control('side_content', [
            'label' => __('Side Content', 'za'),
            'type' => Controls_Manager::WYSIWYG,
            'default' => '',
        ]);

        $this->add_control('list', [
            'type' => Controls_Manager::REPEATER,
            'fields' => $repeater->get_controls(),
            'title_field' => '{{{ list_title }}}',
            'default' => [
                [
                    'list_title' => __('Timeline Item #1', 'za'),
                    'list_content' => __('Content for item #1', 'za'),
                ],
                [
                    'list_title' => __('Timeline Item #2', 'za'),
                    'list_content' => __('Content for item #2', 'za'),
                ],
            ],
        ]);

        $this->end_controls_section();

        // Style section (you can move your typography/colors here)
        $this->start_controls_section('style_section', [
            'label' => __('Style', 'za'),
            'tab' => Controls_Manager::TAB_STYLE,
        ]);

        $this->add_control('header_size', [
            'label' => __('Title HTML Tag', 'za'),
            'type' => Controls_Manager::SELECT,
            'options' => array_combine(
                ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div', 'span', 'p', 'a'],
                ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'div', 'span', 'p', 'a']),
            'default' => 'h2',
        ]);
        $this->add_control('timeline_color', [
            'label' => __('Timeline Accent Color', 'za'),
            'type' => Controls_Manager::COLOR,
            'default' => '#F6F6F8',
            'selectors' => [
                '{{WRAPPER}} .tl-circ' => 'background-color: {{VALUE}};',
                '{{WRAPPER}} .timeline:before' => 'background-color: {{VALUE}};',
            ],
        ]);

        $this->add_control('tl_change_direction', [
            'label' => __('Direction', 'za'),
            'type' => Controls_Manager::SWITCHER,
            'label_on' => __('Left', 'za'),
            'label_off' => __('Right', 'za'),
            'return_value' => 'left',

        ]);

        $this->add_control('tl_change_onside', [
            'label' => __('Single Side Layout', 'za'),
            'type' => Controls_Manager::SWITCHER,
            'label_on' => __('Yes', 'za'),
            'label_off' => __('No', 'za'),
            'return_value' => 'yes',

        ]);

        $this->add_control('tl_animation_timeline', [
            'label' => __('Enable Line Animation', 'za'),
            'type' => Controls_Manager::SWITCHER,
            'label_on' => __('Yes', 'za'),
            'label_off' => __('No', 'za'),
            'return_value' => 'yes',
            'default' => 'yes',
        ]);

        $this->add_control('timeline_animation_color', [
            'label' => __('Timeline Animation Color', 'za'),
            'type' => Controls_Manager::COLOR,
            'default' => '#F37321',
            'selectors' => [
                '{{WRAPPER}} .timeline-line-animation' => 'background-color: {{VALUE}};',
                '{{WRAPPER}} .is-stuck .tl-circ' => 'background-color: {{VALUE}};',
            ],
            'condition' => [
                'tl_animation_timeline' => 'yes',
            ],
        ]);


        $this->end_controls_section();
    }

    protected function render()
    {
        $settings = $this->get_settings_for_display();
        $items = $settings['list'];
        $tag = Utils::validate_html_tag($settings['header_size']);
        $on_side = $settings['tl_change_onside'] === 'yes';
        $direction = $settings['tl_change_direction'] === 'left' ? 'left' : 'right';
        $count = ($direction === 'left') ? 1 : 2;

        echo '<div class="timeline-wrapper" data-animate-timeline="' . esc_attr($settings['tl_animation_timeline']) . '">';

        if ($settings['tl_animation_timeline'] === 'yes') {
            echo '<div class="timeline-line-animation"></div>';
        }

        echo '<ul class="timeline">';

        foreach ($items as $index => $item) {

            if ($on_side) {
                $li_class = ($direction === 'right') ? 'timeline-inverted' : 'timeline-left';
            } else {
                $count++;
                $li_class = ($count % 2 === 0) ? 'timeline-inverted' : 'timeline-left';
            }

            $title = isset($item['list_title']) ? sanitize_text_field($item['list_title']) : '';
            $image_html = '';
            if (!empty($item['image']['id'])) {
                $image_html = Group_Control_Image_Size::get_attachment_image_html($item, 'thumbnail', 'image');
                $image_html = '<div class="timeline_pic pull-left">' . $image_html . '</div>';
            }

            echo '<li class="' . esc_attr($li_class) . ' timeline-item">';
            echo '<div class="timeline-side">' . wp_kses_post($item['side_content']) . '</div>';
            echo '<div class="tl-trigger"></div><div class="tl-circ"></div>';
            echo '<div class="timeline-panel"><div class="tl-content">';

            echo $image_html;
            echo '<div class="tl-desc">';
            if ($tag === 'a' && !empty($item['link_url']['url'])) {
                $href = esc_url($item['link_url']['url']);
                $target = isset($item['link_url']['is_external']) && $item['link_url']['is_external'] ? ' target="_blank"' : '';
                $rel = isset($item['link_url']['nofollow']) && $item['link_url']['nofollow'] ? ' rel="nofollow"' : '';
                echo '<a href="' . $href . '"' . $target . esc_attr($rel) . ' class="tl-title">' . $title . '</a>';
            } else {
                echo '<' . $tag . ' class="tl-title">' . $title . '</' . $tag . '>';
            }

            echo '<div class="tl-desc-short">' . wp_kses_post($item['list_content']) . '</div>';
            echo '</div></div></div></li>';
        }

        echo '</ul></div>';
    }


    protected function content_template()
    { ?>
        <div class="timeline-wrapper">
            <# if (settings.tl_animation_timeline === 'yes') { #>
            <div class="timeline-line-animation"></div>
            <# } #>

            <ul class="timeline">
                <#
                var onSide = settings.tl_change_onside === 'yes';
                var direction = settings.tl_change_direction ? 'left' : 'right';
                var count = direction === 'left' ? 1 : 2;

                if ( settings.list ) {
                _.each( settings.list, function( item, index ) {

                var li_class = '';

                if ( onSide ) {
                li_class = (direction === 'right') ? 'timeline-inverted' : 'timeline-left';
                } else {
                count++;
                li_class = (count % 2 === 0) ? 'timeline-inverted' : 'timeline-left';
                }
                #>
                <li class="{{ li_class }} timeline-item">
                    <div class="timeline-side">
                        {{{ item.side_content }}}
                    </div>
                    <div class="tl-trigger"></div>
                    <div class="tl-circ"></div>
                    <div class="timeline-panel">
                        <#
                        var image = {
                        id: item.image.id,
                        url: item.image.url,
                        size: item.thumbnail_size,
                        dimension: item.thumbnail_custom_dimension,
                        model: view.getEditModel()
                        };
                        var image_url = elementor.imagesManager.getImageUrl( image );
                        #>
                        <div class="tl-content">
                            <# if (item.image.id) {
                            var $class = "tl-title";
                            #>
                            <div class="timeline_pic pull-left">
                                <img src="{{{ image_url }}}" alt="image"/>
                            </div>
                            <# } else {
                            var $class = "tl-title";
                            } #>
                            <div class="tl-desc">
                                <h3 class="{{{ $class }}}">
                                    <# if (item.link_url && item.link_url.url) { #>
                                    <a href="{{ item.link_url.url }}"
                                    <# if (item.link_url.is_external) { #> target="_blank"<# } #>
                                    <# if (item.link_url.nofollow) { #> rel="nofollow"<# } #>>
                                    {{{ item.list_title }}}
                                    </a>
                                    <# } else { #>
                                    {{{ item.list_title }}}
                                    <# } #>
                                </h3>
                                <div class="tl-content">{{{ item.list_content }}}</div>
                            </div>
                        </div>
                    </div>
                </li>
                <# });
                } #>
            </ul>
        </div>
        <?php
    }
}

add_action('elementor/widgets/register', function($widgets_manager) {
    $widgets_manager->register(new \BePack\Widgets\Za_Pack_Widget_Timeline());
});
