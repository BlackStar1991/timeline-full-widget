<?php
/**
 * Plugin Name: Timeline Full Widget
 * Description: A versatile Timeline plugin for Elementor, Gutenberg, and classic WordPress themes — add beautiful Timelines anywhere!
 * Plugin URI: https://wordpress.org/plugins/timeline-full-widget
 * Version: 1.0
 * License: GPL-2.0-or-later
 * License URI:  https://spdx.org/licenses/GPL-2.0-or-later.html
 * Author: Andry Zirka
 * Text Domain: za
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


final class TimelinePlugin {

    /**
     * Singleton instance.
     *
     * @var TimelinePlugin|null
     */
    private static $instance = null;

    /**
     * Get instance.
     *
     * @return TimelinePlugin
     */
    public static function get_instance(): TimelinePlugin {
        if ( null === self::$instance ) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Constructor - private for singleton.
     */
    private function __construct() {
        // nothing
    }

    /**
     * Bootstrap: attach WP hooks.
     */
    public function init(): void {
        // Elementor widget registration & assets
        add_action( 'elementor/widgets/widgets_registered', [ $this, 'widgets_registered' ] );
        add_action( 'elementor/frontend/after_register_scripts', [ $this, 'register_elementor_assets' ] );

        // Gutenberg block registration
        add_action( 'init', [ $this, 'register_gutenberg_block' ] );

        // Enqueue frontend assets for Gutenberg block only when needed (not in admin)
        add_action( 'wp_enqueue_scripts', [ $this, 'maybe_enqueue_frontend_assets' ] );
    }

    /**
     * Register block type (uses block.json).
     */
    public function register_gutenberg_block(): void {
        $dir = TIMELINE_ELEMENTOR_PATH;
        if ( function_exists( 'register_block_type' ) ) {
            register_block_type( $dir . '/block.json' );
        }
    }

    /**
     * Register elementor widget assets (styles/scripts registered, not enqueued).
     */
    public function register_elementor_assets(): void {
        $css  = TIMELINE_ELEMENTOR_PATH . 'assets/elementor/style.css';
        $js   = TIMELINE_ELEMENTOR_PATH . 'assets/elementor/script.js';

        if ( file_exists( $css ) ) {
            wp_register_style(
                'timeline-elementor-style',
                TIMELINE_ELEMENTOR_URL . 'assets/elementor/style.css',
                [],
                filemtime( $css )
            );
        }

        if ( file_exists( $js ) ) {
            wp_register_script(
                'timeline-elementor-script',
                TIMELINE_ELEMENTOR_URL . 'assets/elementor/script.js',
                [],
                filemtime( $js ),
                true
            );
        }
    }

    /**
     * Widgets registration (Elementor widget PHP file).
     */
    public function widgets_registered(): void {
        if ( ! defined( 'ELEMENTOR_PATH' ) ) {
            return;
        }

        if ( ! class_exists( 'Elementor\Widget_Base' ) ) {
            return;
        }

        // Try theme override first, then fallback to plugin file
        $template_file = locate_template( 'elementor-timeline/elementor-timeline-widget.php' );
        if ( ! $template_file || ! is_readable( $template_file ) ) {
            $template_file = TIMELINE_ELEMENTOR_PATH . 'elementor-timeline-widget.php';
        }

        if ( $template_file && is_readable( $template_file ) ) {
            require_once $template_file;
        }
    }

    /**
     * Conditionally enqueue frontend Gutenberg (module) script and styles.
     *
     * - Do not enqueue in admin (/wp-admin).
     * - Do not enqueue when page is built with Elementor (if that is required).
     * - Enqueue only when current queried object contains our block,
     *   or when no specific post ID (e.g. archive) if you want global.
     */
    public function maybe_enqueue_frontend_assets(): void {
        // never enqueue in admin screens, REST, cron, or ajax contexts
        if ( is_admin() || wp_doing_ajax() || ( defined( 'REST_REQUEST' ) && REST_REQUEST ) ) {
            return;
        }

        // Resolve post ID of current request (may be 0 on some archives)
        $post_id = (int) get_queried_object_id();

        // If we can detect that page is built with Elementor, skip enqueue
        if ( $post_id && $this->is_built_with_elementor( $post_id ) ) {
            return;
        }

        // Only load if the current post contains the block OR if you want to always load, change logic.
        $should_enqueue = false;
        if ( $post_id && has_block( 'za/timeline-full-widget', $post_id ) ) {
            $should_enqueue = true;
        }

        // Optionally: also check if the block might be present in global areas or if you want to always enable on specific templates.
        // e.g. enable on homepage if has block in a page assigned to home

        if ( ! $should_enqueue ) {
            return;
        }

        $script_path = TIMELINE_ELEMENTOR_PATH . 'assets/gutenberg/gutenberg-script.js';
        $style_path  = TIMELINE_ELEMENTOR_PATH . 'assets/gutenberg/style.css';

        if ( file_exists( $script_path ) ) {
            $handle = 'za-timeline-frontend';
            wp_register_script(
                $handle,
                TIMELINE_ELEMENTOR_URL . 'assets/gutenberg/gutenberg-script.js',
                [],
                filemtime( $script_path ),
                true
            );
            add_filter("script_loader_tag", "add_module_to_my_script", 10, 3);
            function add_module_to_my_script($tag, $handle, $src)
            {
                if ("za-timeline-frontend" === $handle) {
                    $tag = '<script type="module" src="' . esc_url($src) . '"></script>';
                }
                return $tag;
            }

            wp_enqueue_script( $handle );
        }

        if ( file_exists( $style_path ) ) {
            wp_enqueue_style(
                'za-timeline-frontend-style',
                TIMELINE_ELEMENTOR_URL . 'assets/gutenberg/style.css',
                [],
                filemtime( $style_path )
            );
        }
    }

    /**
     * Helper: detect Elementor-built page (defensive).
     *
     * @param int $post_id
     * @return bool
     */
    private function is_built_with_elementor( int $post_id ): bool {
        // Defensive checks for Elementor API (may change across versions).
        if ( class_exists( '\Elementor\Plugin' ) ) {
            try {
                $elementor = \Elementor\Plugin::instance();
                if ( isset( $elementor->db ) && method_exists( $elementor->db, 'is_built_with_elementor' ) ) {
                    return (bool) $elementor->db->is_built_with_elementor( $post_id );
                }
            } catch ( \Throwable $e ) {
                // swallow errors: assume not elementor-built on failure
            }
        }
        return false;
    }
}

// Bootstrap
TimelinePlugin::get_instance()->init();

