<?php

/**
 * Plugin Name: Timeline Full Widget
 * Description: A versatile Timeline plugin for Elementor, and Gutenberg WordPress themes — add beautiful Timelines anywhere!
 * Plugin URI: https://wordpress.org/plugins/timeline-full-widget
 * Version: 1.0.0
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
    $version = '1.0.0';

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
        add_action( 'init', [ $this, 'register_assets' ] );

        add_action( 'elementor/widgets/widgets_registered', [ $this, 'widgets_registered' ] );
        add_action( 'elementor/editor/after_enqueue_scripts', [ $this, 'enqueue_elementor_editor_assets' ] );


        add_action( 'init', [ $this, 'register_gutenberg_block' ] );
        add_action( 'enqueue_block_editor_assets', [ $this, 'enqueue_block_editor_assets' ] );
        add_action( 'wp_enqueue_scripts', [ $this, 'maybe_enqueue_frontend_assets' ] );


        add_filter( 'script_loader_tag', [ $this, 'add_module_type_attribute' ], 10, 3 );
    }

    public function add_module_type_attribute( $tag, $handle, $src ) {
        $module_handles = [
            'za-timeline-elementor',
            'za-timeline-gutenberg',
        ];
        if ( in_array( $handle, $module_handles, true ) ) {
            if ( false !== strpos( $tag, 'type="module"' ) ) {
                return $tag;
            }
            return '<script type="module" src="' . esc_url( $src ) . '"></script>';
        }
        return $tag;
    }

    public function register_assets(): void {
        $base_path = TIMELINE_ELEMENTOR_PATH . 'assets/js/';
        $base_url  = TIMELINE_ELEMENTOR_URL . 'assets/js/';

        $ver_base = TIMELINE_VERSION;
        $use_filemtime = defined( 'WP_DEBUG' ) && WP_DEBUG === true;


        $preview = TIMELINE_ELEMENTOR_PATH . 'assets/elementor/elementor-media-preview.js';
        if ( file_exists( $preview ) ) {
            $ver = $use_filemtime ? filemtime( $preview ) : $ver_base;
            // register preview as a normal script (depends on jQuery)
            wp_register_script(
                'za-elementor-media-preview',
                TIMELINE_ELEMENTOR_URL . 'assets/elementor/elementor-media-preview.js',
                [ 'jquery' ],
                $ver,
                true
            );
            // Note: do NOT wp_enqueue_script here
        }

        // ELEMENTOR ADAPTER (module) — make it depend on preview helper
        $elementor_adapter = $base_path . 'adapters/elementor-adapter.js';
        if ( file_exists( $elementor_adapter ) ) {
            $ver = $use_filemtime ? filemtime( $elementor_adapter ) : $ver_base;

            // set dependency: if preview helper is registered, include it; otherwise no dependency
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

        // GUTENBERG ADAPTER (module)
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

        // CORE
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

        // Styles (shared frontend)
        $style_frontend = TIMELINE_ELEMENTOR_PATH . 'assets/gutenberg/style.css';
        if ( file_exists( $style_frontend ) ) {
            $ver = $use_filemtime ? filemtime( $style_frontend ) : $ver_base;
            wp_register_style(
                'za-timeline-frontend-style',
                TIMELINE_ELEMENTOR_URL . 'assets/gutenberg/style.css',
                [],
                $ver
            );
        }

        $elementor_style = TIMELINE_ELEMENTOR_PATH . 'assets/elementor/style.css';
        if ( file_exists( $elementor_style ) ) {
            $ver = $use_filemtime ? filemtime( $elementor_style ) : $ver_base;
            wp_register_style(
                'timeline-elementor-style',
                TIMELINE_ELEMENTOR_URL . 'assets/elementor/style.css',
                [],
                $ver
            );
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

        if ( wp_style_is( 'timeline-elementor-style', 'registered' ) ) {
            wp_enqueue_style( 'timeline-elementor-style' );
        }
    }


    public function register_gutenberg_block(): void {
        $dir = TIMELINE_ELEMENTOR_PATH;
        if ( function_exists( 'register_block_type' ) ) {
            register_block_type( $dir . '/block.json' );
        }
    }

    public function enqueue_block_editor_assets(): void {
        if ( wp_script_is( 'za-timeline-gutenberg', 'registered' ) ) {
            wp_enqueue_script( 'za-timeline-gutenberg' );
        }
        if ( wp_style_is( 'za-timeline-frontend-style', 'registered' ) ) {
            wp_enqueue_style( 'za-timeline-frontend-style' );
        }
    }

    public function maybe_enqueue_frontend_assets(): void {
        if ( is_admin() || wp_doing_ajax() || ( defined( 'REST_REQUEST' ) && REST_REQUEST ) ) {
            return;
        }

        $post_id = (int) get_queried_object_id();

        if ( $post_id && $this->is_built_with_elementor( $post_id ) ) {
            return;
        }

        $should_enqueue = false;
        if ( $post_id && has_block( 'za/timeline-full-widget', $post_id ) ) {
            $should_enqueue = true;
        }

        if ( ! $should_enqueue ) {
            return;
        }

        if ( wp_script_is( 'za-timeline-gutenberg', 'registered' ) ) {
            wp_enqueue_script( 'za-timeline-gutenberg' );
        }
        if ( wp_style_is( 'za-timeline-frontend-style', 'registered' ) ) {
            wp_enqueue_style( 'za-timeline-frontend-style' );
        }
    }

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

    private function is_built_with_elementor( int $post_id ): bool {
        if ( class_exists( '\Elementor\Plugin' ) ) {
            try {
                $elementor = \Elementor\Plugin::instance();
                if ( isset( $elementor->db ) && method_exists( $elementor->db, 'is_built_with_elementor' ) ) {
                    return (bool) $elementor->db->is_built_with_elementor( $post_id );
                }
            } catch ( \Throwable $e ) {}
        }
        return false;
    }
}

TimelinePlugin::get_instance()->init();
