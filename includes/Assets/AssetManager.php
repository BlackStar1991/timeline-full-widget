<?php
/**
 * Asset registration and loading.
 *
 * @package TimelineFullWidget
 */

namespace TimelineFullWidget\Assets;

use TimelineFullWidget\Support\ElementorDetector;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

final class AssetManager {

    private ElementorDetector $elementor_detector;

    public function __construct( ?ElementorDetector $elementor_detector = null ) {
        $this->elementor_detector = $elementor_detector ?: new ElementorDetector();
    }

    /**
     * Register WordPress hooks.
     */
    public function register(): void {
        add_action( 'init', [ $this, 'registerAssets' ] );
        add_action( 'wp_enqueue_scripts', [ $this, 'maybeEnqueueFrontendAssets' ] );
        add_action( 'elementor/editor/after_enqueue_scripts', [ $this, 'enqueueElementorEditorAssets' ] );
        add_action( 'elementor/frontend/after_enqueue_styles', [ $this, 'enqueueCoreStyleEverywhere' ] );
        add_action( 'elementor/editor/after_enqueue_styles', [ $this, 'enqueueCoreStyleEverywhere' ] );
        add_action( 'admin_enqueue_scripts', [ $this, 'enqueueClassicEditorStyles' ] );
        add_filter( 'script_loader_tag', [ $this, 'addModuleTypeAttribute' ], 10, 3 );
    }

    /**
     * Global core styles for all supported builders.
     */
    public function enqueueCoreStyleEverywhere(): void {
        if ( wp_style_is( 'timeline-core-style', 'registered' ) ) {
            wp_enqueue_style( 'timeline-core-style' );
            return;
        }

        $style_path = TIMELINE_FULL_WIDGET_PATH . 'assets/css/core/style.css';
        if ( file_exists( $style_path ) ) {
            $ver = $this->getAssetVersion( $style_path );
            wp_register_style(
                'timeline-core-style',
                TIMELINE_FULL_WIDGET_URL . 'assets/css/core/style.css',
                [],
                $ver
            );
            wp_enqueue_style( 'timeline-core-style' );
        }
    }

    /**
     * Enqueue shared timeline styles only on Classic Editor screens.
     *
     * Gutenberg receives frontend/editor styles from block.json, so loading the
     * same core stylesheet on block editor screens would duplicate CSS.
     *
     * @param string $hook Current admin page hook.
     */
    public function enqueueClassicEditorStyles( string $hook ): void {
        if ( ! in_array( $hook, [ 'post.php', 'post-new.php' ], true ) ) {
            return;
        }

        $screen = function_exists( 'get_current_screen' ) ? get_current_screen() : null;
        if ( ! $screen || empty( $screen->post_type ) ) {
            return;
        }

        if (
            function_exists( 'use_block_editor_for_post_type' ) &&
            use_block_editor_for_post_type( $screen->post_type )
        ) {
            return;
        }

        $this->enqueueCoreStyleEverywhere();
    }

    /**
     * Add type="module" to registered module scripts.
     *
     * @param string $tag    Script tag.
     * @param string $handle Script handle.
     * @param string $src    Script source.
     */
    public function addModuleTypeAttribute( string $tag, string $handle, string $src ): string {
        $module_handles = [
            'za-timeline-elementor',
            'za-timeline-gutenberg',
            'za-timeline-core',
            'za-timeline-classic-adapter',
        ];

        if ( ! in_array( $handle, $module_handles, true ) ) {
            return $tag;
        }

        if ( false !== strpos( $tag, 'type=' ) ) {
            return $tag;
        }

        return str_replace( '<script ', '<script type="module" ', $tag );
    }

    /**
     * Register shared JavaScript assets.
     */
    public function registerAssets(): void {
        $base_path = TIMELINE_FULL_WIDGET_PATH . 'assets/js/';
        $base_url  = TIMELINE_FULL_WIDGET_URL . 'assets/js/';

        $preview = TIMELINE_FULL_WIDGET_PATH . 'assets/elementor/elementor-media-preview.js';
        if ( file_exists( $preview ) ) {
            wp_register_script(
                'za-elementor-media-preview',
                TIMELINE_FULL_WIDGET_URL . 'assets/elementor/elementor-media-preview.js',
                [ 'jquery' ],
                $this->getAssetVersion( $preview ),
                true
            );
        }

        $elementor_adapter = $base_path . 'adapters/elementor-adapter.js';
        if ( file_exists( $elementor_adapter ) ) {
            $deps = [];
            if ( wp_script_is( 'za-elementor-media-preview', 'registered' ) ) {
                $deps[] = 'za-elementor-media-preview';
            }

            wp_register_script(
                'za-timeline-elementor',
                $base_url . 'adapters/elementor-adapter.js',
                $deps,
                $this->getAssetVersion( $elementor_adapter ),
                true
            );
            wp_script_add_data( 'za-timeline-elementor', 'type', 'module' );
        }

        $gutenberg_adapter = $base_path . 'adapters/gutenberg-adapter.js';
        if ( file_exists( $gutenberg_adapter ) ) {
            wp_register_script(
                'za-timeline-gutenberg',
                $base_url . 'adapters/gutenberg-adapter.js',
                [],
                $this->getAssetVersion( $gutenberg_adapter ),
                true
            );
            wp_script_add_data( 'za-timeline-gutenberg', 'type', 'module' );
        }

        $core_anim = $base_path . 'core/animation.js';
        if ( file_exists( $core_anim ) ) {
            wp_register_script(
                'za-timeline-core',
                $base_url . 'core/animation.js',
                [],
                $this->getAssetVersion( $core_anim ),
                true
            );
            wp_script_add_data( 'za-timeline-core', 'type', 'module' );
        }
    }

    /**
     * Enqueue Elementor editor assets.
     */
    public function enqueueElementorEditorAssets(): void {
        $preview = TIMELINE_FULL_WIDGET_PATH . 'assets/elementor/elementor-media-preview.js';
        if ( file_exists( $preview ) ) {
            wp_register_script(
                'za-elementor-media-preview',
                TIMELINE_FULL_WIDGET_URL . 'assets/elementor/elementor-media-preview.js',
                [ 'jquery' ],
                $this->getAssetVersion( $preview ),
                true
            );
            wp_enqueue_script( 'za-elementor-media-preview' );
        }

        if ( wp_script_is( 'za-timeline-elementor', 'registered' ) ) {
            wp_enqueue_script( 'za-timeline-elementor' );
        }
    }

    /**
     * Frontend: enqueue Gutenberg animation adapter only when the block exists.
     */
    public function maybeEnqueueFrontendAssets(): void {
        if ( is_admin() || wp_doing_ajax() || ( defined( 'REST_REQUEST' ) && REST_REQUEST ) ) {
            return;
        }

        $post_id = (int) get_queried_object_id();

        if ( $post_id && $this->elementor_detector->isBuiltWithElementor( $post_id ) ) {
            return;
        }

        if ( ! $post_id || ! has_block( 'za/timeline-full-widget', $post_id ) ) {
            return;
        }

        if ( wp_script_is( 'za-timeline-gutenberg', 'registered' ) ) {
            wp_enqueue_script( 'za-timeline-gutenberg' );
        }
    }

    /**
     * Get an asset version depending on debug mode.
     *
     * @param string $path Asset file path.
     */
    private function getAssetVersion( string $path ): string {
        return ( defined( 'WP_DEBUG' ) && WP_DEBUG && file_exists( $path ) )
            ? (string) filemtime( $path )
            : TIMELINE_FULL_WIDGET_VERSION;
    }
}
