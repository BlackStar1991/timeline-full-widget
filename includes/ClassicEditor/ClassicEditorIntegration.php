<?php
/**
 * Classic Editor / TinyMCE integration.
 *
 * @package TimelineFullWidget
 */

namespace TimelineFullWidget\ClassicEditor;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

final class ClassicEditorIntegration {

    private bool $mce_registered = false;

    /**
     * Register WordPress hooks.
     */
    public function register(): void {
        add_action( 'admin_init', [ $this, 'maybeRegisterClassicMceLate' ] );
        add_action( 'admin_enqueue_scripts', [ $this, 'enqueueClassicAdapterAdmin' ] );
    }

    /**
     * Register TinyMCE plugin and toolbar button for Classic Editor screens.
     */
    public function maybeRegisterClassicMceLate(): void {
        if ( ! $this->canUseClassicEditorTools() ) {
            return;
        }

        if ( $this->isBlockEditorScreen() ) {
            return;
        }

        if ( $this->mce_registered ) {
            return;
        }
        $this->mce_registered = true;

        $classic_path = TIMELINE_FULL_WIDGET_PATH . 'assets/js/adapters/classic-adapter-loader.js';
        if ( ! file_exists( $classic_path ) ) {
            return;
        }

        $classic_loader_url = TIMELINE_FULL_WIDGET_URL . 'assets/js/adapters/classic-adapter-loader.js';
        $base_js_url        = TIMELINE_FULL_WIDGET_URL . 'assets/js/';
        $animation_url      = TIMELINE_FULL_WIDGET_URL . 'assets/js/core/animation.js';

        $classic_url_with_q = add_query_arg(
            [
                'za_base_js' => rawurlencode( $base_js_url ),
                'za_anim'    => rawurlencode( $animation_url ),
            ],
            $classic_loader_url
        );

        add_filter(
            'mce_external_plugins',
            static function ( array $plugins ) use ( $classic_url_with_q ): array {
                $plugins['za_timeline_button'] = $classic_url_with_q;
                return $plugins;
            }
        );

        add_filter(
            'mce_buttons',
            static function ( array $buttons ): array {
                $buttons[] = 'za_timeline_button';
                return $buttons;
            }
        );

        add_filter(
            'tiny_mce_before_init',
            static function ( array $init ): array {
                $css_url = TIMELINE_FULL_WIDGET_URL . 'assets/css/core/style.css';
                if ( ! empty( $init['content_css'] ) ) {
                    $init['content_css'] .= ',' . esc_url_raw( $css_url );
                } else {
                    $init['content_css'] = esc_url_raw( $css_url );
                }
                return $init;
            }
        );
    }

    /**
     * Enqueue the Classic Editor adapter on eligible admin screens.
     */
    public function enqueueClassicAdapterAdmin(): void {
        if ( ! $this->canUseClassicEditorTools() ) {
            return;
        }

        if ( $this->isBlockEditorScreen() ) {
            return;
        }

        $base_js_url  = TIMELINE_FULL_WIDGET_URL . 'assets/js/';
        $classic_path = TIMELINE_FULL_WIDGET_PATH . 'assets/js/adapters/classic-adapter-loader.js';
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

        $ver = ( defined( 'WP_DEBUG' ) && WP_DEBUG ) ? (string) filemtime( $classic_path ) : TIMELINE_FULL_WIDGET_VERSION;

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
     * Check whether the current user and editor settings allow Classic Editor tools.
     */
    private function canUseClassicEditorTools(): bool {
        if ( ! current_user_can( 'edit_posts' ) && ! current_user_can( 'edit_pages' ) ) {
            return false;
        }

        $rich = get_user_option( 'rich_editing' );
        if ( $rich !== 'true' && $rich !== true ) {
            return false;
        }

        $screen = function_exists( 'get_current_screen' ) ? get_current_screen() : null;
        if ( $screen ) {
            $allowed_bases = [ 'post', 'post-new', 'page', 'edit', 'dashboard', 'edit-tags', 'term' ];
            if ( ! in_array( $screen->base, $allowed_bases, true ) ) {
                return false;
            }
        }

        return true;
    }

    /**
     * Detect if the current editing screen uses the block editor.
     */
    private function isBlockEditorScreen(): bool {
        $screen  = function_exists( 'get_current_screen' ) ? get_current_screen() : null;
        $post_id = 0;

        if ( $screen && ! empty( $screen->post_id ) ) {
            $post_id = (int) $screen->post_id;
        } elseif ( ! empty( $_GET['post'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
            $post_id = (int) $_GET['post']; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
        } elseif ( function_exists( 'get_the_ID' ) && get_the_ID() ) {
            $post_id = (int) get_the_ID();
        } else {
            $post_id = (int) get_queried_object_id();
        }

        if ( $post_id && function_exists( 'use_block_editor_for_post' ) ) {
            try {
                return (bool) use_block_editor_for_post( get_post( $post_id ) );
            } catch ( \Throwable $e ) {
                return false;
            }
        }

        return false;
    }
}
