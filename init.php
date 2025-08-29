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
 * Elementor tested up to: 3.30.2
 */

if (!defined('ABSPATH')) exit;

define('TIMELINE_ELEMENTOR_URL', plugin_dir_url(__FILE__));
define('TIMELINE_ELEMENTOR_PATH', plugin_dir_path(__FILE__));

class TimelinePlugin
{
    private static $instance = null;

    public static function get_instance()
    {
        if (!self::$instance)
            self::$instance = new self;
        return self::$instance;
    }

    public function init()
    {
        add_action('elementor/widgets/widgets_registered', [$this, 'widgets_registered']);
        add_action('elementor/frontend/after_register_scripts', [$this, 'register_widget_assets']);

        // Gutenberg Block
        add_action('init', [$this, 'register_gutenberg_block']);
    }

    public function register_widget_assets()
    {
        wp_register_style(
            'timeline-elementor-style',
            TIMELINE_ELEMENTOR_URL . 'assets/elementor/style.css',
            [],
            null
        );

        wp_register_script(
            'timeline-elementor-script',
            TIMELINE_ELEMENTOR_URL . 'assets/elementor/script.js',
            [],
            null,
            true
        );
    }

    public function widgets_registered()
    {
        if (defined('ELEMENTOR_PATH') && class_exists('Elementor\Widget_Base')) {
            $template_file = locate_template('elementor-timeline/elementor-timeline-widget.php');
            if (!$template_file || !is_readable($template_file)) {
                $template_file = TIMELINE_ELEMENTOR_PATH . 'elementor-timeline-widget.php';
            }
            if ($template_file && is_readable($template_file)) {
                require_once $template_file;
            }
        }
    }

    public function register_gutenberg_block() {
        register_block_type( TIMELINE_ELEMENTOR_PATH . '/block.json' );
    }


}

TimelinePlugin::get_instance()->init();
