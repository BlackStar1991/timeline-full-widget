<?php
/**
 * Plugin Name: Timeline Full Widget
 * Description: A powerful and flexible Timeline plugin compatible with Elementor, Gutenberg, and Classic WordPress themes. Easily add beautiful timelines anywhere!
 * Plugin URI: https://wordpress.org/plugins/timeline-full-widget
 * Version: 1.2.0
 * License: GPL-2.0-or-later
 * License URI:  https://spdx.org/licenses/GPL-2.0-or-later.html
 * Author: Andry Zirka
 * Text Domain: timeline-full-widget
 * Domain Path: /languages
 * Elementor requires at least: 3.0.0
 * Elementor tested up to: 3.31.4
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

if ( ! defined( 'TIMELINE_ELEMENTOR_URL' ) ) {
    define( 'TIMELINE_ELEMENTOR_URL', plugin_dir_url( __FILE__ ) );
}
if ( ! defined( 'TIMELINE_ELEMENTOR_PATH' ) ) {
    define( 'TIMELINE_ELEMENTOR_PATH', plugin_dir_path( __FILE__ ) );
}

if ( ! defined( 'TIMELINE_VERSION' ) ) {
    $version = '1.2.0';

    if ( function_exists( 'get_file_data' ) ) {
        $data = get_file_data( __FILE__, [ 'Version' => 'Version' ] );
        if ( ! empty( $data['Version'] ) ) {
            $version = $data['Version'];
        }
    } else {
        $file_contents = @file_get_contents( __FILE__ );
        if ( $file_contents && preg_match( '/^\s*\*\s*Version:\s*(.+)$/mi', $file_contents, $m ) ) {
            $version = trim( $m[1] );
        }
    }
    define( 'TIMELINE_VERSION', $version );
}

final class TimelinePlugin {

    private static $instance = null;

    public static function get_instance(): TimelinePlugin {
        if ( null === self::$instance ) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function init(): void {
        // Registering shared assets (js for Elementor/Gutenberg, core script)
        add_action( 'init', [ $this, 'register_assets' ] );

        // Elementor
        add_action( 'elementor/widgets/widgets_registered', [ $this, 'widgets_registered' ] );
        add_action( 'elementor/editor/after_enqueue_scripts', [ $this, 'enqueue_elementor_editor_assets' ] );

        // Gutenberg (via block.json)
        add_action( 'init', [ $this, 'register_gutenberg_block' ] );

        // Frontend: only include animation scripts if the block is on the page
        add_action( 'wp_enqueue_scripts', [ $this, 'maybe_enqueue_frontend_assets' ] );

        // Classic Editor (TinyMCE button)
        add_action( 'admin_init', [ $this, 'maybe_register_classic_mce_late' ] );
        add_action( 'admin_enqueue_scripts', [ $this, 'enqueue_classic_adapter_admin' ] );

        // Core styles (both in the admin panel and on the front end)
        add_action( 'wp_enqueue_scripts', [ $this, 'enqueue_core_style_everywhere' ] );
        add_action( 'admin_enqueue_scripts', [ $this, 'enqueue_core_style_everywhere' ] );

        // Module type for the required scripts
        add_filter( 'script_loader_tag', [ $this, 'add_module_type_attribute' ], 10, 3 );
    }

    /**
     * Global core styles (for all environments).
     */
    public function enqueue_core_style_everywhere(): void {
        if ( wp_style_is( 'timeline-core-style', 'registered' ) ) {
            wp_enqueue_style( 'timeline-core-style' );
            return;
        }

        $style_path = TIMELINE_ELEMENTOR_PATH . 'assets/css/core/style.css';
        if ( file_exists( $style_path ) ) {
            $ver = ( defined( 'WP_DEBUG' ) && WP_DEBUG ) ? filemtime( $style_path ) : TIMELINE_VERSION;
            wp_register_style(
                'timeline-core-style',
                TIMELINE_ELEMENTOR_URL . 'assets/css/core/style.css',
                [],
                $ver
            );
            wp_enqueue_style( 'timeline-core-style' );
        }
    }

    public function add_module_type_attribute( $tag, $handle, $src ) {
        $module_handles = [
            'za-timeline-elementor',
            'za-timeline-gutenberg',
            'za-timeline-core',
            'za-timeline-classic-adapter',
        ];

        if ( in_array( $handle, $module_handles, true ) ) {
            if ( false !== strpos( $tag, 'type="module"' ) ) {
                return $tag;
            }
            return '<script type="module" src="' . esc_url( $src ) . '"></script>';
        }

        return $tag;
    }

    /**
     * Register JS assets (Elementor/Gutenberg adapters + core animation).
     * * No need to register build/index.js and the CSS block—block.json now handles this.
     */
    public function register_assets(): void {
        $base_path   = TIMELINE_ELEMENTOR_PATH . 'assets/js/';
        $base_url    = TIMELINE_ELEMENTOR_URL . 'assets/js/';
        $ver_base    = TIMELINE_VERSION;
        $use_filemtime = defined( 'WP_DEBUG' ) && WP_DEBUG === true;

        // Elementor media preview helper
        $preview = TIMELINE_ELEMENTOR_PATH . 'assets/elementor/elementor-media-preview.js';
        if ( file_exists( $preview ) ) {
            $ver = $use_filemtime ? filemtime( $preview ) : $ver_base;
            wp_register_script(
                'za-elementor-media-preview',
                TIMELINE_ELEMENTOR_URL . 'assets/elementor/elementor-media-preview.js',
                [ 'jquery' ],
                $ver,
                true
            );
        }

        // Elementor adapter (module)
        $elementor_adapter = $base_path . 'adapters/elementor-adapter.js';
        if ( file_exists( $elementor_adapter ) ) {
            $ver  = $use_filemtime ? filemtime( $elementor_adapter ) : $ver_base;
            $deps = [];
            if ( wp_script_is( 'za-elementor-media-preview', 'registered' ) ) {
                $deps[] = 'za-elementor-media-preview';
            }

            wp_register_script(
                'za-timeline-elementor',
                $base_url . 'adapters/elementor-adapter.js',
                $deps,
                $ver,
                true
            );
            wp_script_add_data( 'za-timeline-elementor', 'type', 'module' );
        }

        // Gutenberg adapter
        $gutenberg_adapter = $base_path . 'adapters/gutenberg-adapter.js';
        if ( file_exists( $gutenberg_adapter ) ) {
            $ver = $use_filemtime ? filemtime( $gutenberg_adapter ) : $ver_base;
            wp_register_script(
                'za-timeline-gutenberg',
                $base_url . 'adapters/gutenberg-adapter.js',
                [],
                $ver,
                true
            );
            wp_script_add_data( 'za-timeline-gutenberg', 'type', 'module' );
        }

        // Core animation
        $core_anim = $base_path . 'core/animation.js';
        if ( file_exists( $core_anim ) ) {
            $ver = $use_filemtime ? filemtime( $core_anim ) : $ver_base;
            wp_register_script(
                'za-timeline-core',
                $base_url . 'core/animation.js',
                [],
                $ver,
                true
            );
            wp_script_add_data( 'za-timeline-core', 'type', 'module' );
        }
    }

    public function enqueue_elementor_editor_assets(): void {
        $preview = TIMELINE_ELEMENTOR_PATH . 'assets/elementor/elementor-media-preview.js';
        if ( file_exists( $preview ) ) {
            $ver = ( defined( 'WP_DEBUG' ) && WP_DEBUG ) ? filemtime( $preview ) : TIMELINE_VERSION;
            wp_register_script(
                'za-elementor-media-preview',
                TIMELINE_ELEMENTOR_URL . 'assets/elementor/elementor-media-preview.js',
                [ 'jquery' ],
                $ver,
                true
            );
            wp_enqueue_script( 'za-elementor-media-preview' );
        }

        if ( wp_script_is( 'za-timeline-elementor', 'registered' ) ) {
            wp_enqueue_script( 'za-timeline-elementor' );
        }
    }

    /**
     * Gutenberg block registration is only possible via block.json.
     *  The block's JS/CSS will be automatically loaded based on editorScript/style/editorStyle.
     */
    public function register_gutenberg_block(): void {
        if ( ! function_exists( 'register_block_type_from_metadata' ) ) {
            return;
        }

        register_block_type_from_metadata( TIMELINE_ELEMENTOR_PATH );
    }

    /**
     * Front-end: We only include the animation script for Gutenberg if the block actually exists on the page.
     *  Block styles are automatically taken from block.json (style).
     */
    public function maybe_enqueue_frontend_assets(): void {
        if ( is_admin() || wp_doing_ajax() || ( defined( 'REST_REQUEST' ) && REST_REQUEST ) ) {
            return;
        }

        $post_id = (int) get_queried_object_id();

        // If the content is collected in Elementor, we exit (it has its own logic).
        if ( $post_id && $this->is_built_with_elementor( $post_id ) ) {
            return;
        }

        if ( ! $post_id || ! has_block( 'za/timeline-full-widget', $post_id ) ) {
            return;
        }

        // Adapter/animation script only for Gutenberg
        if ( wp_script_is( 'za-timeline-gutenberg', 'registered' ) ) {
            wp_enqueue_script( 'za-timeline-gutenberg' );
        }
    }

    /**
     * Elementor widget.
     */
    public function widgets_registered(): void {
        if ( ! defined( 'ELEMENTOR_PATH' ) || ! class_exists( '\Elementor\Widget_Base' ) ) {
            return;
        }

        $template_file = locate_template( 'elementor-timeline/elementor-timeline-widget.php' );
        if ( ! $template_file || ! is_readable( $template_file ) ) {
            $template_file = TIMELINE_ELEMENTOR_PATH . 'elementor-timeline-widget.php';
        }

        if ( $template_file && is_readable( $template_file ) ) {
            require_once $template_file;
        }
    }

    // ===== Classic Editor (TinyMCE) =====

    private bool $mce_registered = false;

    public function maybe_register_classic_mce_late(): void {
        if ( ! current_user_can( 'edit_posts' ) && ! current_user_can( 'edit_pages' ) ) {
            return;
        }

        $rich = get_user_option( 'rich_editing' );
        if ( $rich !== 'true' && $rich !== true ) {
            return;
        }

        $screen = function_exists( 'get_current_screen' ) ? get_current_screen() : null;
        if ( $screen ) {
            $allowed_bases = [ 'post', 'post-new', 'page', 'edit', 'dashboard', 'edit-tags', 'term' ];
            if ( ! in_array( $screen->base, $allowed_bases, true ) ) {
                return;
            }
        }

        // If the post uses a block editor, do not register Classic MCE hooks.
        $post_id = 0;
        if ( $screen && ! empty( $screen->post_id ) ) {
            $post_id = (int) $screen->post_id;
        } elseif ( ! empty( $_GET['post'] ) ) { // phpcs:ignore
            $post_id = (int) $_GET['post']; // phpcs:ignore
        } elseif ( function_exists( 'get_the_ID' ) && get_the_ID() ) {
            $post_id = (int) get_the_ID();
        } else {
            $post_id = (int) get_queried_object_id();
        }

        if ( $post_id && function_exists( 'use_block_editor_for_post' ) ) {
            try {
                if ( use_block_editor_for_post( get_post( $post_id ) ) ) {
                    return;
                }
            } catch ( \Throwable $e ) {
                // ignore
            }
        }

        if ( $this->mce_registered ) {
            return;
        }
        $this->mce_registered = true;

        $classic_path = TIMELINE_ELEMENTOR_PATH . 'assets/js/adapters/classic-adapter-loader.js';
        if ( ! file_exists( $classic_path ) ) {
            return;
        }

        $classic_loader_rel = 'assets/js/adapters/classic-adapter-loader.js';
        $classic_loader_url = plugins_url( $classic_loader_rel, __FILE__ );

        $base_js_url   = plugins_url( 'assets/js/', __FILE__ );
        $animation_url = plugins_url( 'assets/js/core/animation.js', __FILE__ );

        $classic_url_with_q = add_query_arg(
            [
                'za_base_js' => rawurlencode( $base_js_url ),
                'za_anim'    => rawurlencode( $animation_url ),
            ],
            $classic_loader_url
        );

        // 1) TinyMCE plugin url
        add_filter(
            'mce_external_plugins',
            function ( $plugins ) use ( $classic_url_with_q ) {
                $plugins['za_timeline_button'] = $classic_url_with_q;
                return $plugins;
            }
        );

        // 2) Button in toolbar
        add_filter(
            'mce_buttons',
            function ( $buttons ) {
                $buttons[] = 'za_timeline_button';
                return $buttons;
            }
        );

        // 3) content_css в iframe
        add_filter(
            'tiny_mce_before_init',
            function ( $init ) {
                $css_url = TIMELINE_ELEMENTOR_URL . 'assets/css/core/style.css';
                if ( ! empty( $init['content_css'] ) ) {
                    $init['content_css'] .= ',' . esc_url_raw( $css_url );
                } else {
                    $init['content_css'] = esc_url_raw( $css_url );
                }
                return $init;
            }
        );
    }

    public function enqueue_classic_adapter_admin(): void {
        if ( ! current_user_can( 'edit_posts' ) && ! current_user_can( 'edit_pages' ) ) {
            return;
        }
        $rich = get_user_option( 'rich_editing' );
        if ( $rich !== 'true' && $rich !== true ) {
            return;
        }
        $screen = function_exists( 'get_current_screen' ) ? get_current_screen() : null;
        if ( $screen ) {
            $allowed_bases = [ 'post', 'post-new', 'page', 'edit', 'edit-tags', 'term' ];
            if ( ! in_array( $screen->base, $allowed_bases, true ) ) {
                return;
            }
        }

        $post_id = 0;
        if ( $screen && ! empty( $screen->post_id ) ) {
            $post_id = (int) $screen->post_id;
        } elseif ( ! empty( $_GET['post'] ) ) { // phpcs:ignore
            $post_id = (int) $_GET['post']; // phpcs:ignore
        } elseif ( function_exists( 'get_the_ID' ) && get_the_ID() ) {
            $post_id = (int) get_the_ID();
        } else {
            $post_id = (int) get_queried_object_id();
        }

        // If the post uses a block editor, don't enable anything.
        if ( $post_id && function_exists( 'use_block_editor_for_post' ) ) {
            try {
                if ( use_block_editor_for_post( get_post( $post_id ) ) ) {
                    return;
                }
            } catch ( \Throwable $e ) {
                // ignore
            }
        }

        $base_js_url = TIMELINE_ELEMENTOR_URL . 'assets/js/';
        $classic_path = TIMELINE_ELEMENTOR_PATH . 'assets/js/adapters/classic-adapter-loader.js';
        $classic_url  = $base_js_url . 'adapters/classic-adapter-loader.js';

        if ( ! file_exists( $classic_path ) ) {
            return;
        }

        $config = [
            'baseJsUrl'    => esc_url_raw( $base_js_url ),
            'animationUrl' => esc_url_raw( $base_js_url . 'core/animation.js' ),
            'i18nDomain'   => 'timeline-full-widget',
        ];
        $json = wp_json_encode( $config );

        $ver = ( defined( 'WP_DEBUG' ) && WP_DEBUG ) ? filemtime( $classic_path ) : TIMELINE_VERSION;

        wp_register_script(
            'za-timeline-classic-adapter',
            $classic_url,
            [],
            $ver,
            false
        );

        wp_add_inline_script(
            'za-timeline-classic-adapter',
            "window.zaTimelineConfig = {$json};",
            'before'
        );

        wp_enqueue_script( 'za-timeline-classic-adapter' );
    }

    /**
     * Check: Is the page built in Elementor?
     */
    private function is_built_with_elementor( int $post_id ): bool {
        if ( class_exists( '\Elementor\Plugin' ) ) {
            try {
                $elementor = \Elementor\Plugin::instance();
                if ( isset( $elementor->db ) && method_exists( $elementor->db, 'is_built_with_elementor' ) ) {
                    return (bool) $elementor->db->is_built_with_elementor( $post_id );
                }
            } catch ( \Throwable $e ) {
                // ignore
            }
        }
        return false;
    }
}

TimelinePlugin::get_instance()->init();
