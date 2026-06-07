<?php
/**
 * Plugin Name: Timeline Full Widget
 * Description: A powerful and flexible Timeline plugin compatible with Elementor, Gutenberg, and Classic WordPress themes. Easily add beautiful timelines anywhere!
 * Plugin URI: https://wordpress.org/plugins/timeline-full-widget
 * Version: 2.3.0
 * License: GPL-2.0-or-later
 * License URI:  https://spdx.org/licenses/GPL-2.0-or-later.html
 * Author: Andry Zirka
 * Text Domain: timeline-full-widget
 * Domain Path: /languages
 * Elementor requires at least: 3.0.0
 * Elementor tested up to: 4.0.7
 *
 * @package TimelineFullWidget
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

if ( ! defined( 'TIMELINE_FULL_WIDGET_FILE' ) ) {
    define( 'TIMELINE_FULL_WIDGET_FILE', __FILE__ );
}

if ( ! defined( 'TIMELINE_FULL_WIDGET_PATH' ) ) {
    define( 'TIMELINE_FULL_WIDGET_PATH', plugin_dir_path( __FILE__ ) );
}

if ( ! defined( 'TIMELINE_FULL_WIDGET_URL' ) ) {
    define( 'TIMELINE_FULL_WIDGET_URL', plugin_dir_url( __FILE__ ) );
}

if ( ! defined( 'TIMELINE_FULL_WIDGET_VERSION' ) ) {
    define( 'TIMELINE_FULL_WIDGET_VERSION', '2.3.0' );
}

// Backward-compatible aliases kept for custom integrations that may still use the old constants.
if ( ! defined( 'TIMELINE_ELEMENTOR_URL' ) ) {
    define( 'TIMELINE_ELEMENTOR_URL', TIMELINE_FULL_WIDGET_URL );
}

if ( ! defined( 'TIMELINE_ELEMENTOR_PATH' ) ) {
    define( 'TIMELINE_ELEMENTOR_PATH', TIMELINE_FULL_WIDGET_PATH );
}

if ( ! defined( 'TIMELINE_VERSION' ) ) {
    define( 'TIMELINE_VERSION', TIMELINE_FULL_WIDGET_VERSION );
}

require_once TIMELINE_FULL_WIDGET_PATH . 'includes/Autoloader.php';

\TimelineFullWidget\Autoloader::register();

if ( ! class_exists( 'TimelinePlugin', false ) ) {
    class_alias( \TimelineFullWidget\Plugin::class, 'TimelinePlugin' );
}

\TimelineFullWidget\Plugin::get_instance()->init();
