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

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Za_Pack_Widget_Timeline extends Widget_Base {

    public function get_name() {
        return 'za-timeline';
    }

    public function get_title() {
        return __( 'Timeline', 'za' );
    }

    public function get_icon() {
        return 'eicon-time-line';
    }

    public function get_categories() {
        return [ 'basic' ];
    }

    public function get_keywords() {
        return [ 'timeline', 'history', 'event' ];
    }

    public function get_style_depends() {
        return [ 'timeline-elementor-style' ];
    }

    public function get_script_depends() {
        return [ 'za-timeline-elementor' ];
    }

    /* ---------------------------
     * Register controls
     * --------------------------- */
    protected function register_controls() {
        $this->register_content_controls();
        $this->register_style_controls();
    }

    protected function register_content_controls() {
        $this->start_controls_section(
                'content_section',
                [
                        'label' => __( 'Timeline Items', 'za' ),
                        'tab'   => Controls_Manager::TAB_CONTENT,
                ]
        );

        $repeater = new Repeater();

        $repeater->add_control(
                'li_bg_color',
                [
                        'label'     => __( 'Item background color', 'za' ),
                        'type'      => \Elementor\Controls_Manager::COLOR,
                        'selectors' => [
                                '{{WRAPPER}} {{CURRENT_ITEM}} .timeline-panel' => 'background-color: {{VALUE}};',
                        ],
                ]
        );


        $repeater->add_control(
                'media_type',
                [
                        'label'   => __( 'Media Type', 'za' ),
                        'type'    => Controls_Manager::SELECT,
                        'options' => [
                                'image' => __( 'Image', 'za' ),
                                'video' => __( 'Video', 'za' ),
                        ],
                        'default' => 'image',
                ]
        );

        $repeater->add_control(
                'media_image',
                [
                        'label'       => __( 'Image', 'za' ),
                        'type'        => Controls_Manager::MEDIA,
                        'media_types' => [ 'image' ],
                        'default'     => [ 'url' => Utils::get_placeholder_image_src() ],
                        'condition'   => [ 'media_type' => 'image' ],
                ]
        );

        $repeater->add_control(
                'media_video',
                [
                        'label'       => __( 'Video', 'za' ),
                        'type'        => Controls_Manager::MEDIA,
                        'media_types' => [ 'video' ],
                        'condition'   => [ 'media_type' => 'video' ],
                ]
        );

        $repeater->add_control(
                'posterURL',
                [
                        'label'       => __( 'Poster URL', 'za' ),
                        'type'        => Controls_Manager::MEDIA,
                        'media_types' => [ 'image' ],
                        'default'     => [ 'url' => Utils::get_placeholder_image_src() ],
                        'condition'   => [ 'media_type' => 'video' ],
                ]
        );

        // image size helper for media_image
        $repeater->add_group_control(
                Group_Control_Image_Size::get_type(),
                [
                        'name'    => 'thumbnail',
                        'default' => 'medium',
                        'separator'=> 'none',
                ]
        );

        $repeater->add_control(
                'list_title',
                [
                        'label'       => __( 'Title', 'za' ),
                        'type'        => Controls_Manager::TEXT,
                        'default'     => __( 'Timeline Title', 'za' ),
                        'label_block' => true,
                ]
        );

        $repeater->add_control(
                'link_url',
                [
                        'label'       => __( 'Link', 'za' ),
                        'type'        => Controls_Manager::URL,
                        'placeholder' => 'https://example.com',
                        'show_external'=> true,
                ]
        );

        $repeater->add_control(
                'list_content',
                [
                        'label'   => __( 'Content', 'za' ),
                        'type'    => Controls_Manager::WYSIWYG,
                        'default' => __( 'Timeline content here...', 'za' ),
                ]
        );

        $repeater->add_control(
                'side_content',
                [
                        'label'   => __( 'Side Content', 'za' ),
                        'type'    => Controls_Manager::WYSIWYG,
                        'default' => '',
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
                                        'list_title'   => __( 'Timeline Item #1', 'za' ),
                                        'list_content' => __( 'Content for item #1', 'za' ),
                                ],
                                [
                                        'list_title'   => __( 'Timeline Item #2', 'za' ),
                                        'list_content' => __( 'Content for item #2', 'za' ),
                                ],
                        ],
                ]
        );

        $this->end_controls_section();
    }

    protected function register_style_controls() {
        $this->start_controls_section(
                'style_section',
                [
                        'label' => __( 'Style', 'za' ),
                        'tab'   => Controls_Manager::TAB_STYLE,
                ]
        );

        $this->add_control(
                'header_size',
                [
                        'label'   => __( 'Title HTML Tag', 'za' ),
                        'type'    => Controls_Manager::SELECT,
                        'options' => array_combine(
                                [ 'h1','h2','h3','h4','h5','h6','div','span','p','a' ],
                                [ 'H1','H2','H3','H4','H5','H6','div','span','p','a' ]
                        ),
                        'default' => 'h2',
                ]
        );

        $this->add_control(
                'timeline_color',
                [
                        'label'     => __( 'Timeline Accent Color', 'za' ),
                        'type'      => Controls_Manager::COLOR,
                        'default'   => '#F6F6F8',
                        'selectors' => [
                                '{{WRAPPER}} .tl-mark'         => 'background-color: {{VALUE}};',
                                '{{WRAPPER}} .timeline:before' => 'background-color: {{VALUE}};',
                        ],
                ]
        );
        $this->add_control(
                'timeline_animation_color',
                [
                        'label'     => __( 'Timeline Animation Color', 'za' ),
                        'type'      => Controls_Manager::COLOR,
                        'default'   => '#F37321',
                        'selectors' => [
                                '{{WRAPPER}} .timeline-line-animation' => 'background-color: {{VALUE}};',
                                '{{WRAPPER}} .is-stuck .tl-mark'       => 'background-color: {{VALUE}};',
                        ],
                        'condition' => [
                                'tl_animation_timeline' => 'yes',
                        ],
                ]
        );
        $this->add_control(
                'tl_change_direction',
                [
                        'label'        => __( 'Direction', 'za' ),
                        'type'         => Controls_Manager::SWITCHER,
                        'label_on'     => __( 'Left', 'za' ),
                        'label_off'    => __( 'Right', 'za' ),
                        'return_value' => 'left',
                ]
        );

        $this->add_control(
                'tl_change_onside',
                [
                        'label'        => __( 'Single Side Layout', 'za' ),
                        'type'         => Controls_Manager::SWITCHER,
                        'label_on'     => __( 'Yes', 'za' ),
                        'label_off'    => __( 'No', 'za' ),
                        'return_value' => 'yes',
                ]
        );

        $this->add_control(
                'tl_animation_timeline',
                [
                        'label'        => __( 'Enable Line Animation', 'za' ),
                        'type'         => Controls_Manager::SWITCHER,
                        'label_on'     => __( 'Yes', 'za' ),
                        'label_off'    => __( 'No', 'za' ),
                        'return_value' => 'yes',
                        'default'      => 'yes',
                ]
        );

        $this->add_control(
                'tl_animation_marker',
                [
                        'label'        => __( 'Enable Animation Marker', 'za' ),
                        'type'         => Controls_Manager::SWITCHER,
                        'label_on'     => __( 'Yes', 'za' ),
                        'label_off'    => __( 'No', 'za' ),
                        'return_value' => 'yes',
                        'default'      => 'yes',
                ]
        );



        $this->end_controls_section();
    }

    /* Render */
    protected function render() {
        $settings  = $this->get_settings_for_display();
        $items     = ! empty( $settings['list'] ) && is_array( $settings['list'] ) ? $settings['list'] : [];
        $tag       = Utils::validate_html_tag( $settings['header_size'] ?? 'h2' );
        $on_side   = ( $settings['tl_change_onside'] ?? '' ) === 'yes';
        $direction = ( $settings['tl_change_direction'] ?? '' ) === 'left' ? 'left' : 'right';

        $wrapper_attr = esc_attr( $settings['tl_animation_timeline'] ?? '' );
        echo '<div class="timeline-wrapper" data-animate-timeline="' . $wrapper_attr . '">';

        // animation line
        if ( ( $settings['tl_animation_timeline'] ?? '' ) === 'yes' ) {
            echo '<div class="timeline-line-animation"></div>';
        }

        // ul open
        $ul_class = ( ( $settings['tl_animation_marker'] ?? '' ) === 'yes' ) ? 'timeline timeline-animation-marker' : 'timeline';
        echo '<ul class="' . esc_attr( $ul_class ) . '">';

        // iterate items
        $countBase = ( $direction === 'left' ) ? 1 : 2;
        $count     = $countBase;
        foreach ( $items as $index => $item ) {
            if ( $on_side ) {
                $li_class = ( $direction === 'right' ) ? 'timeline-inverted' : 'timeline-left';
            } else {
                $count ++;
                $li_class = ( $count % 2 === 0 ) ? 'timeline-inverted' : 'timeline-left';
            }

            echo $this->render_item_html( $li_class, $item, $tag );
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
    private function render_item_html( $li_class, $item, $tag ) {
        $title        = isset( $item['list_title'] ) ? sanitize_text_field( $item['list_title'] ) : '';
        $side_content = isset( $item['side_content'] ) ? wp_kses_post( $item['side_content'] ) : '';
        $link         = isset( $item['link_url'] ) ? $item['link_url'] : [];

        $bg_color = ! empty( $item['li_bg_color'] ) ? 'background-color:' . esc_attr( $item['li_bg_color'] ) . ';' : '';

        $media_html = $this->render_media_html( $item );

        ob_start();
        ?>
        <li class="<?php echo esc_attr( $li_class ); ?> timeline-item">
            <div class="timeline-side"><?php echo $side_content; ?></div>
            <div class="tl-trigger"></div>
            <div class="tl-mark"></div>
            <div class="timeline-panel" <?php if ( $bg_color ) echo 'style="' . $bg_color . '"'; ?> >
                <div class="tl-content">
                    <?php echo $media_html; ?>
                    <div class="tl-desc">
                        <?php
                        if ( $tag === 'a' && ! empty( $link['url'] ) ) {
                            $href   = esc_url( $link['url'] );
                            $target = ! empty( $link['is_external'] ) ? ' target="_blank"' : '';
                            $rel    = ! empty( $link['nofollow'] ) ? ' rel="nofollow"' : '';
                            printf( '<a href="%s"%s%s class="tl-title">%s</a>', $href, $target, $rel, esc_html( $title ) );
                        } else {
                            printf( '<%1$s class="tl-title">%2$s</%1$s>', $tag, esc_html( $title ) );
                        }
                        ?>
                        <div class="tl-desc-short"><?php echo wp_kses_post( $item['list_content'] ?? '' ); ?></div>
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
    private function render_media_html( $item ) {

        $type = $item['media_type'] ?? null;

        // VIDEO branch
        if ( $type === 'video' ) {
            $media = $item['media_video'] ?? $legacy_media ?? [];
            $media_url = ! empty( $media['url'] ) ? $media['url'] : '';
            $poster = ! empty( $item['posterURL']['url'] ) ? $item['posterURL']['url'] : '';

            if ( empty( $media_url ) ) {
                return '';
            }

            $filetype = wp_check_filetype( $media_url );
            $mime     = $filetype['type'] ?? 'video/mp4';
            $poster_attr = $poster ? ' poster="' . esc_url( $poster ) . '"' : '';

            $html  = '<div class="timeline_pic pull-left">';
            $html .= '<video autoplay muted loop playsinline preload="metadata"' . $poster_attr . ' style="width:100%;height:auto;">';
            $html .= '<source src="' . esc_url( $media_url ) . '" type="' . esc_attr( $mime ) . '">';
            $html .= esc_html__( 'Your browser does not support the video tag.', 'za' );
            $html .= '</video>';
            $html .= '</div>';

            return $html;
        }

        // IMAGE branch
        $media = $item['media_image'];
        $media_url = ! empty( $media['url'] ) ? $media['url'] : '';

        if ( ! empty( $media['id'] ) ) {
            // use Group_Control_Image_Size to respect thumbnail size control
            $img_html = Group_Control_Image_Size::get_attachment_image_html( $item, 'thumbnail', 'media_image' );
            return '<div class="timeline_pic pull-left">' . $img_html . '</div>';
        }

        if ( $media_url ) {
            return '<div class="timeline_pic pull-left"><img src="' . esc_url( $media_url ) . '" alt="" loading="lazy" decoding="async" /></div>';
        }

        return '';
    }

    /*  Editor template (Underscore.js) */
    protected function content_template() { ?>
        <div class="timeline-wrapper">
            <# if ( settings.tl_animation_timeline === 'yes' ) { #>
            <div class="timeline-line-animation"></div>
            <# } #>

            <# if ( settings.tl_animation_marker === 'yes' ) { #>
            <ul class="timeline timeline-animation-marker">
                <# } else { #>
                <ul class="timeline">
                    <# } #>

                    <#
                    function isVideoUrl(url) {
                    if (!url) return false;
                    return /\.(mp4|webm|ogg|ogv)(\?.*)?$/i.test(url);
                    }
                    var onSide = settings.tl_change_onside === 'yes';
                    var direction = settings.tl_change_direction ? 'left' : 'right';
                    var count = direction === 'left' ? 1 : 2;
                    #>

                    <# if ( settings.list ) {
                    _.each( settings.list, function( item, index ) {
                    var li_class = '';
                    if ( onSide ) {
                    li_class = (direction === 'right') ? 'timeline-inverted' : 'timeline-left';
                    } else {
                    count++;
                    li_class = (count % 2 === 0) ? 'timeline-inverted' : 'timeline-left';
                    }

                    // editor media object (media_image/media_video)
                    var image_url = '';
                    var isVideo = false;
                    var poster_url = '';

                    if ( item.media_type === 'video' ) {
                    if ( item.media_video && item.media_video.url ) {
                    image_url = item.media_video.url;
                    isVideo = isVideoUrl( image_url );
                    }
                    poster_url = ( item.posterURL && item.posterURL.url ) ? item.posterURL.url : '';
                    } else {
                    if ( item.media_image && item.media_image.url ) {
                    image_url = item.media_image.url;
                        }
                    }

                    var titleClass = 'tl-title';
                    var bg_color = '';
                    if ( item.li_bg_color ) {
                    bg_color = 'background-color:' + item.li_bg_color + ';';
                    }
                    #>

                    <li class="{{ li_class }} timeline-item">
                        <div class="timeline-side">{{{ item.side_content }}}</div>
                        <div class="tl-trigger"></div>
                        <div class="tl-mark"></div>
                        <div class="timeline-panel" style="{{ bg_color }}" >
                            <div class="tl-content">
                                <# if ( image_url ) { #>
                                <div class="timeline_pic pull-left">
                                    <# if ( isVideo ) { #>
                                    <video autoplay muted loop playsinline preload="metadata" src="{{{ image_url }}}"
                                    <# if ( poster_url ) { #> poster="{{{ poster_url }}}"<# } #>
                                    style="width:100%;height:auto;">
                                    <source src="{{{ image_url }}}" type="video/{{ (image_url.match(/\.([^.?]+)(\?.*)?$/i)||[])[1] }}">
                                    {{{ 'Your browser does not support the video tag.' }}}
                                    </video>
                                    <# } else { #>
                                    <img src="{{{ image_url }}}" alt="image"/>
                                    <# } #>
                                </div>
                                <# } #>

                                <div class="tl-desc">
                                    <h3 class="{{{ titleClass }}}">
                                        <# if ( item.link_url && item.link_url.url ) { #>
                                        <a href="{{ item.link_url.url }}"
                                        <# if ( item.link_url.is_external ) { #> target="_blank"<# } #>
                                        <# if ( item.link_url.nofollow ) { #> rel="nofollow"<# } #>>
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

                    <# } ); } #>

                </ul>
        </div>
        <?php
    }
}

/* Register widget */
add_action( 'elementor/widgets/register', function ( $widgets_manager ) {
    $widgets_manager->register( new \BePack\Widgets\Za_Pack_Widget_Timeline() );
} );
