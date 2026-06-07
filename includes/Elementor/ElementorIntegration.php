<?php
/**
 * Elementor integration.
 *
 * @package TimelineFullWidget
 */

namespace TimelineFullWidget\Elementor;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

final class ElementorIntegration {

    private bool $registered = false;

    /**
     * Register Elementor hooks.
     */
    public function register(): void {
        add_action( 'elementor/widgets/register', [ $this, 'registerWidget' ] );
        add_action( 'elementor/widgets/widgets_registered', [ $this, 'registerWidget' ] );
    }

    /**
     * Register the Timeline widget.
     *
     * @param mixed $widgets_manager Elementor widgets manager.
     */
    public function registerWidget( $widgets_manager = null ): void {
        if ( $this->registered ) {
            return;
        }

        if ( ! defined( 'ELEMENTOR_PATH' ) || ! class_exists( '\\Elementor\\Widget_Base' ) ) {
            return;
        }

        if ( ! $widgets_manager && class_exists( '\\Elementor\\Plugin' ) ) {
            try {
                $widgets_manager = \Elementor\Plugin::instance()->widgets_manager;
            } catch ( \Throwable $e ) {
                $widgets_manager = null;
            }
        }

        if ( ! $widgets_manager || ! method_exists( $widgets_manager, 'register' ) ) {
            return;
        }

        $widgets_manager->register( new TimelineWidget() );
        $this->registered = true;
    }
}
