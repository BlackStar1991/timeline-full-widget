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
        add_action( 'enqueue_block_editor_assets', [ $this, 'enqueueGutenbergTransferAssets' ] );
        add_action( 'elementor/editor/after_enqueue_styles', [ $this, 'enqueueCoreStyleEverywhere' ] );
        add_action( 'admin_enqueue_scripts', [ $this, 'enqueueClassicEditorStyles' ] );
        add_filter( 'script_loader_tag', [ $this, 'addModuleTypeAttribute' ], 100, 3 );
    }

    /**
     * Enqueue the already-registered shared stylesheet where an editor needs it.
     * Elementor frontend loads this handle through get_style_depends() only if
     * the Timeline widget is present; Gutenberg loads its compiled copy.
     */
    public function enqueueCoreStyleEverywhere(): void {
        if ( wp_style_is( 'timeline-core-style', 'registered' ) ) {
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
            'za-timeline-gutenberg',
            'za-timeline-core',
            'za-timeline-classic-adapter',
        ];

        if ( ! in_array( $handle, $module_handles, true ) ) {
            return $tag;
        }

        // WordPress may generate `type="text/javascript"` automatically. Merely
        // checking for a type attribute leaves the ES module running as a classic
        // script, so its top-level `import` fails before any button is bound.
        // Replace the type *only* on our registered external script tag and keep
        // every other attribute (nonce, id, src, defer, etc.) unchanged.
        if ( ! preg_match( '/<script\b[^>]*>/i', $tag ) ) {
            return $tag;
        }

        $tag = preg_replace(
            '/(<script\b[^>]*?)\s+type\s*=\s*(?:"[^"]*"|\'[^\']*\'|[^\s>]+)/i',
            '$1',
            $tag,
            1
        );

        return (string) preg_replace( '/<script\b/i', '<script type="module"', (string) $tag, 1 );
    }

    /**
     * Register shared JavaScript assets.
     */
    public function registerAssets(): void {
        $core_style_path = TIMELINE_FULL_WIDGET_PATH . 'assets/css/core/style.css';
        if ( is_readable( $core_style_path ) ) {
            wp_register_style(
                'timeline-core-style',
                TIMELINE_FULL_WIDGET_URL . 'assets/css/core/style.css',
                [],
                $this->getAssetVersion( $core_style_path )
            );
        }

        $base_path = TIMELINE_FULL_WIDGET_PATH . 'assets/js/';
        $base_url  = TIMELINE_FULL_WIDGET_URL . 'assets/js/';

        // Elementor may print widget dependencies through its own script loader,
        // which can ignore script_loader_tag and module metadata. Keep the WP
        // handles as classic scripts; each tiny loader dynamically imports the
        // actual ESM entrypoint using the browser's native module loader.
        $transfer_editor = TIMELINE_FULL_WIDGET_PATH . 'assets/js/transfer/elementor-editor-loader.js';
        if ( is_readable( $transfer_editor ) ) {
            wp_register_script(
                'za-timeline-transfer-elementor-editor',
                TIMELINE_FULL_WIDGET_URL . 'assets/js/transfer/elementor-editor-loader.js',
                [],
                $this->getAssetVersion( $transfer_editor ),
                true
            );
            wp_add_inline_script(
                'za-timeline-transfer-elementor-editor',
                'window.timelineTransferConfig = ' . wp_json_encode( [
                    'placeholderUrl' => TIMELINE_FULL_WIDGET_URL . 'assets/images/media-placeholder.svg',
                ] ) . ';',
                'before'
            );
        }

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

        // Same guarantee for Elementor frontend and preview iframe scripts.
        $elementor_adapter = $base_path . 'adapters/elementor-loader.js';
        if ( file_exists( $elementor_adapter ) ) {
            $deps = [];
            if ( wp_script_is( 'za-elementor-media-preview', 'registered' ) ) {
                $deps[] = 'za-elementor-media-preview';
            }

            wp_register_script(
                'za-timeline-elementor',
                $base_url . 'adapters/elementor-loader.js',
                $deps,
                $this->getAssetVersion( $elementor_adapter ),
                true
            );
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
     * Register and enqueue Gutenberg's transfer panel only in the block editor.
     * The classic-safe loader dynamically imports the module: some WordPress
     * script printers output type=text/javascript despite module metadata.
     * This add-on uses WordPress' official BlockEdit filter; it doesn't change
     * the serialized block markup or require editing minified build output.
     */
    public function enqueueGutenbergTransferAssets(): void {
        if ( ! current_user_can( 'edit_posts' ) ) {
            return;
        }

        $file = TIMELINE_FULL_WIDGET_PATH . 'assets/js/transfer/gutenberg-editor-loader.js';
        if ( ! is_readable( $file ) ) {
            return;
        }

        wp_enqueue_script(
            'za-timeline-transfer-gutenberg-editor',
            TIMELINE_FULL_WIDGET_URL . 'assets/js/transfer/gutenberg-editor-loader.js',
            [ 'wp-hooks', 'wp-block-editor', 'wp-blocks', 'wp-data', 'wp-element', 'wp-components', 'wp-i18n' ],
            $this->getAssetVersion( $file ),
            true
        );
        // Scroll containers outside Gutenberg's iframe own their events.
        // Forward them from this editor-only classic script to the iframe.
        $bridge = TIMELINE_FULL_WIDGET_PATH . 'assets/js/adapters/gutenberg-editor-scroll-bridge.js';
        if ( is_readable( $bridge ) ) {
            wp_enqueue_script(
                'za-timeline-gutenberg-editor-scroll-bridge',
                TIMELINE_FULL_WIDGET_URL . 'assets/js/adapters/gutenberg-editor-scroll-bridge.js',
                [],
                $this->getAssetVersion( $bridge ),
                true
            );
        }

        wp_add_inline_script(
            'za-timeline-transfer-gutenberg-editor',
            'window.timelineTransferGutenberg = ' . wp_json_encode( [
                'placeholderUrl' => TIMELINE_FULL_WIDGET_URL . 'assets/images/media-placeholder.svg',
            ] ) . ';',
            'before'
        );
    }

    /**
     * Enqueue Elementor editor assets.
     */
    public function enqueueElementorEditorAssets(): void {
        // Elementor resets the global WP_Scripts/WP_Styles registries when it
        // boots its editor. Registrations made on `init` therefore disappear.
        // Restore our handles in the active editor registry before enqueueing.
        // Skip re-registration when an integration has already restored them.
        if ( ! wp_script_is( 'za-timeline-transfer-elementor-editor', 'registered' ) ) {
            $this->registerAssets();
        }

        if ( wp_script_is( 'za-timeline-transfer-elementor-editor', 'registered' ) ) {
            wp_enqueue_script( 'za-timeline-transfer-elementor-editor' );
        }

        if ( wp_script_is( 'za-elementor-media-preview', 'registered' ) ) {
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
