<?php
/**
 * Compatibility loader for the Elementor Timeline widget.
 *
 * The widget implementation lives in includes/Elementor/TimelineWidget.php and
 * is loaded through the plugin autoloader. This file is kept to avoid breaking
 * direct includes from older custom integrations.
 *
 * @since 2.3.0
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

if ( ! class_exists( '\TimelineFullWidget\Elementor\TimelineWidget' ) ) {
    $widget_file = __DIR__ . '/includes/Elementor/TimelineWidget.php';

    if ( is_readable( $widget_file ) ) {
        require_once $widget_file;
    }
}
