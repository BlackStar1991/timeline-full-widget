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

if (!defined('ABSPATH')) {
    exit;
}

if (!defined('TIMELINE_ELEMENTOR_URL')) {
    define('TIMELINE_ELEMENTOR_URL', plugin_dir_url(__FILE__));
}
if (!defined('TIMELINE_ELEMENTOR_PATH')) {
    define('TIMELINE_ELEMENTOR_PATH', plugin_dir_path(__FILE__));
}

final class TimelinePlugin
{
    private static $instance = null;

    public static function get_instance(): TimelinePlugin
    {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function init(): void
    {
        add_action('init', [$this, 'register_assets']);

        // Elementor hooks
        add_action('elementor/widgets/widgets_registered', [$this, 'widgets_registered']);
        add_action('elementor/frontend/after_register_scripts', [$this, 'register_elementor_assets']);

        // Gutenberg: register block and add editor frontend scripts
        add_action('init', [$this, 'register_gutenberg_block']);

        // For Gutenberg editor only (block editor)
        add_action('enqueue_block_editor_assets', [$this, 'enqueue_block_editor_assets']);

        // Frontend enqueue for Gutenberg block when present
        add_action('wp_enqueue_scripts', [$this, 'maybe_enqueue_frontend_assets']);

        // Modules support
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

    /**
     * Register JS/CSS module assets (do NOT enqueue here).
     */
    public function register_assets(): void
    {
        $base_path = TIMELINE_ELEMENTOR_PATH . 'assets/js/';
        $base_url = TIMELINE_ELEMENTOR_URL . 'assets/js/';

        // Elemento r adapter (module)
        $elementor_adapter = $base_path . 'adapters/elementor-adapter.js';
        if ( file_exists( $elementor_adapter ) ) {
            wp_register_script(
                'za-timeline-elementor',
                $base_url . 'adapters/elementor-adapter.js',
                [], // module import handles internal deps
                filemtime( $elementor_adapter ),
                true
            );
            // mark as module
            wp_script_add_data( 'za-timeline-elementor', 'type', 'module' );
        }

        // Gutenberg adapter (module)
        $gutenberg_adapter = $base_path . 'adapters/gutenberg-adapter.js';
        if ( file_exists( $gutenberg_adapter ) ) {
            wp_register_script(
                'za-timeline-gutenberg',
                $base_url . 'adapters/gutenberg-adapter.js',
                [],
                filemtime( $gutenberg_adapter ),
                true
            );
            wp_script_add_data( 'za-timeline-gutenberg', 'type', 'module' );
        }

        // Styles (shared frontend style)
        $style_frontend = TIMELINE_ELEMENTOR_PATH . 'assets/gutenberg/style.css';
        if (file_exists($style_frontend)) {
            wp_register_style(
                'za-timeline-frontend-style',
                TIMELINE_ELEMENTOR_URL . 'assets/gutenberg/style.css',
                [],
                filemtime($style_frontend)
            );
        }

        // Elementor specific style (for editor / widget)
        $elementor_style = TIMELINE_ELEMENTOR_PATH . 'assets/elementor/style.css';
        if (file_exists($elementor_style)) {
            wp_register_style(
                'timeline-elementor-style',
                TIMELINE_ELEMENTOR_URL . 'assets/elementor/style.css',
                [],
                filemtime($elementor_style)
            );
        }
    }

    /**
     * Register elementor assets hook (called by elementor/frontend/after_register_scripts).
     * We register above; optionally we can enqueue preview helper.
     */
    public function register_elementor_assets(): void
    {
        // In many setups it's convenient to enqueue a small "media preview" helper
        $preview = TIMELINE_ELEMENTOR_PATH . 'assets/elementor/elementor-media-preview.js';
        if (file_exists($preview)) {
            wp_register_script(
                'za-elementor-media-preview',
                TIMELINE_ELEMENTOR_URL . 'assets/elementor/elementor-media-preview.js',
                ['jquery'],
                filemtime($preview),
                true
            );

            wp_enqueue_script('za-elementor-media-preview');
        }

    }

    /**
     * Register block type if block.json exists.
     */
    public function register_gutenberg_block(): void
    {
        $dir = TIMELINE_ELEMENTOR_PATH;
        if (function_exists('register_block_type')) {
            register_block_type($dir . '/block.json');
        }
    }

    /**
     * Enqueue editor assets for Gutenberg editor (post editor).
     * This ensures module is available in editor (for preview/edit).
     */
    public function enqueue_block_editor_assets(): void
    {
        if (wp_script_is('za-timeline-gutenberg', 'registered')) {
            wp_enqueue_script('za-timeline-gutenberg');
        }

        if (wp_style_is('za-timeline-frontend-style', 'registered')) {
            wp_enqueue_style('za-timeline-frontend-style');
        }
    }

    /**
     * Conditionally enqueue frontend assets for Gutenberg block.
     */
    public function maybe_enqueue_frontend_assets(): void
    {
        if (is_admin() || wp_doing_ajax() || (defined('REST_REQUEST') && REST_REQUEST)) {
            return;
        }

        $post_id = (int)get_queried_object_id();

        if ($post_id && $this->is_built_with_elementor($post_id)) {
            return;
        }

        $should_enqueue = false;
        if ($post_id && has_block('za/timeline-full-widget', $post_id)) {
            $should_enqueue = true;
        }

        if (!$should_enqueue) {
            return;
        }

        if (wp_script_is('za-timeline-gutenberg', 'registered')) {
            wp_enqueue_script('za-timeline-gutenberg');
        }
        if (wp_style_is('za-timeline-frontend-style', 'registered')) {
            wp_enqueue_style('za-timeline-frontend-style');
        }
    }

    /**
     * Widgets registration (Elementor): include widget PHP file.
     * IMPORTANT: In widget render() you should call wp_enqueue_script('za-timeline-elementor') to load the adapter.
     */
    public function widgets_registered(): void
    {
        if (!defined('ELEMENTOR_PATH') || !class_exists('\Elementor\Widget_Base')) {
            return;
        }

        // allow theme override
        $template_file = locate_template('elementor-timeline/elementor-timeline-widget.php');
        if (!$template_file || !is_readable($template_file)) {
            $template_file = TIMELINE_ELEMENTOR_PATH . 'elementor-timeline-widget.php';
        }

        if ($template_file && is_readable($template_file)) {
            require_once $template_file;
        }
    }

    /**
     * Helper: detect if post built with Elementor
     */
    private function is_built_with_elementor(int $post_id): bool
    {
        if (class_exists('\Elementor\Plugin')) {
            try {
                $elementor = \Elementor\Plugin::instance();
                if (isset($elementor->db) && method_exists($elementor->db, 'is_built_with_elementor')) {
                    return (bool)$elementor->db->is_built_with_elementor($post_id);
                }
            } catch (\Throwable $e) {
                // swallow
            }
        }
        return false;
    }
}

// bootstrap
TimelinePlugin::get_instance()->init();

