<?php
/**
 * Simple PSR-4 style autoloader for plugin classes.
 *
 * @package TimelineFullWidget
 */

namespace TimelineFullWidget;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

final class Autoloader {

    /**
     * Register the plugin autoloader.
     */
    public static function register(): void {
        spl_autoload_register( [ self::class, 'autoload' ] );
    }

    /**
     * Load classes from the TimelineFullWidget namespace.
     *
     * @param string $class Fully qualified class name.
     */
    private static function autoload( string $class ): void {
        $prefix = 'TimelineFullWidget\\';

        if ( 0 !== strpos( $class, $prefix ) ) {
            return;
        }

        $relative_class = substr( $class, strlen( $prefix ) );
        $relative_path  = str_replace( '\\', '/', $relative_class ) . '.php';
        $file           = TIMELINE_FULL_WIDGET_PATH . 'includes/' . $relative_path;

        if ( is_readable( $file ) ) {
            require_once $file;
        }
    }
}
