<?php
/**
 * Main plugin coordinator.
 *
 * @package TimelineFullWidget
 */

namespace TimelineFullWidget;

use TimelineFullWidget\Admin\PluginMeta;
use TimelineFullWidget\Assets\AssetManager;
use TimelineFullWidget\Blocks\TimelineBlock;
use TimelineFullWidget\ClassicEditor\ClassicEditorIntegration;
use TimelineFullWidget\Elementor\ElementorIntegration;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

final class Plugin {

    private static ?Plugin $instance = null;

    /**
     * Get the plugin instance.
     */
    public static function get_instance(): Plugin {
        if ( null === self::$instance ) {
            self::$instance = new self();
        }

        return self::$instance;
    }

    /**
     * Backward-friendly alias for code that expects an instance method name.
     */
    public static function instance(): Plugin {
        return self::get_instance();
    }

    /**
     * Register all plugin integrations.
     */
    public function init(): void {
        ( new AssetManager() )->register();
        ( new TimelineBlock() )->register();
        ( new ElementorIntegration() )->register();
        ( new ClassicEditorIntegration() )->register();
        ( new PluginMeta() )->register();
    }
}
