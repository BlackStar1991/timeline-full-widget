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
        add_action( 'init', [ $this, 'register_assets' ] );

        add_action( 'elementor/widgets/widgets_registered', [ $this, 'widgets_registered' ] );
        add_action( 'elementor/editor/after_enqueue_scripts', [ $this, 'enqueue_elementor_editor_assets' ] );

        add_action( 'init', [ $this, 'register_gutenberg_block' ] );
        add_action( 'enqueue_block_editor_assets', [ $this, 'enqueue_block_editor_assets' ] );
        add_action( 'wp_enqueue_scripts', [ $this, 'maybe_enqueue_frontend_assets' ] );

        add_action( 'admin_head', [ $this, 'maybe_register_classic_mce_late' ] );


        // always make core styles available (front + admin)
        add_action( 'wp_enqueue_scripts', [ $this, 'enqueue_core_style_everywhere' ] );
        add_action( 'admin_enqueue_scripts', [ $this, 'enqueue_core_style_everywhere' ] );

        add_filter( 'script_loader_tag', [ $this, 'add_module_type_attribute' ], 10, 3 );
    }

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

        /**
         * NEW: register block build assets (script + styles)
         */
        $block_build_dir = TIMELINE_ELEMENTOR_PATH . 'build';
        $block_build_url = TIMELINE_ELEMENTOR_URL . 'build';

// editor script (build/index.js)
        if ( file_exists( $block_build_dir . '/index.js' ) ) {
            $ver = $use_filemtime ? filemtime( $block_build_dir . '/index.js' ) : $ver_base;
            wp_register_script(
                'za-timeline-block-script',
                $block_build_url . '/index.js',
                [ 'wp-blocks', 'wp-element', 'wp-i18n', 'wp-editor' ],
                $ver,
                true
            );
        }

// frontend style (build/style-index.css) — MUST depend on core style so it's loaded after
        if ( file_exists( $block_build_dir . '/style-index.css' ) ) {
            $ver = $use_filemtime ? filemtime( $block_build_dir . '/style-index.css' ) : $ver_base;
            wp_register_style(
                'za-timeline-block-style',
                $block_build_url . '/style-index.css',
                ['timeline-core-style'],
                $ver
            );
        }

// editor-only style (build/index.css) — also depend on core style
        if ( file_exists( $block_build_dir . '/index.css' ) ) {
            $ver = $use_filemtime ? filemtime( $block_build_dir . '/index.css' ) : $ver_base;
            wp_register_style(
                'za-timeline-block-editor-style',
                $block_build_url . '/index.css',
                ['timeline-core-style'],
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

    }

    public function register_gutenberg_block(): void {
        $dir = TIMELINE_ELEMENTOR_PATH;
        if ( function_exists( 'register_block_type' ) ) {

            // prepare args only when our registered handles exist
            $args = [];

            if ( wp_script_is( 'za-timeline-block-script', 'registered' ) ) {
                $args['editor_script'] = 'za-timeline-block-script';
            }

            if ( wp_style_is( 'za-timeline-block-style', 'registered' ) ) {
                // frontend style handle (will be loaded on frontend pages where block exists)
                $args['style'] = 'za-timeline-block-style';
            }

            if ( wp_style_is( 'za-timeline-block-editor-style', 'registered' ) ) {
                // editor style handle (will be loaded in block editor)
                $args['editor_style'] = 'za-timeline-block-editor-style';
            }

            // Remove empty values
            $args = array_filter( $args );

            register_block_type( $dir . '/block.json', $args );
        }
    }

    public function enqueue_block_editor_assets(): void {
        // editor script for block (if you need to ensure it's present in editor)
        if ( wp_script_is( 'za-timeline-block-script', 'registered' ) ) {
            wp_enqueue_script( 'za-timeline-block-script' );
        }

        // editor-only style (this keeps editor styles within the block editor, not on all admin pages)
        if ( wp_style_is( 'za-timeline-block-editor-style', 'registered' ) ) {
            wp_enqueue_style( 'za-timeline-block-editor-style' );
        }
    }


    // register Classic Editor Button in admin redactor TinyMCE
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

        if ( $this->mce_registered ) {
            return;
        }
        $this->mce_registered = true;

        $plugin_url = esc_url_raw( TIMELINE_ELEMENTOR_URL . 'assets/js/adapters/classic-adapters.js' );


        add_filter( 'mce_external_plugins', function( $plugins ) use ( $plugin_url ) {
            $plugins['za_timeline_button'] = $plugin_url;
            return $plugins;
        } );

        add_filter( 'mce_buttons', function( $buttons ) {
            $buttons[] = 'za_timeline_button';
            return $buttons;
        } );

        /// add css to editor
        add_filter( 'tiny_mce_before_init', function( $init ) {
            $css_url = TIMELINE_ELEMENTOR_URL . 'assets/css/core/style.css';

            if ( ! empty( $init['content_css'] ) ) {
                $init['content_css'] .= ',' . esc_url_raw( $css_url );
            } else {
                $init['content_css'] = esc_url_raw( $css_url );
            }

            return $init;
        } );

    }

    /**
     * Frontend: enqueue assets only on pages/posts that actually contain the block.
     * If page created with Classic Editor and has no block, styles are not enqueued.
     */
    public function maybe_enqueue_frontend_assets(): void {
        if ( is_admin() || wp_doing_ajax() || ( defined( 'REST_REQUEST' ) && REST_REQUEST ) ) {
            return;
        }

        $post_id = (int) get_queried_object_id();

        // If using Elementor-built content — do not enqueue Gutenberg block assets here
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

        // enqueue block frontend style (this one depends on timeline-core-style and thus will be loaded after it)
        if ( wp_style_is( 'za-timeline-block-style', 'registered' ) ) {
            wp_enqueue_style( 'za-timeline-block-style' );
        } else if ( wp_style_is( 'za-timeline-frontend-style', 'registered' ) ) {
            // fallback to older frontend style if present
            wp_enqueue_style( 'za-timeline-frontend-style' );
        }

        // enqueue frontend script if exists
        if ( wp_script_is( 'za-timeline-gutenberg', 'registered' ) ) {
            wp_enqueue_script( 'za-timeline-gutenberg' );
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
