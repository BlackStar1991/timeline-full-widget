<?php
/**
 * Admin plugin row metadata.
 * @package TimelineFullWidget
 */

namespace TimelineFullWidget\Admin;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

final class PluginMeta {

    /**
     * Register WordPress hooks.
     */
    public function register(): void {
        add_filter( 'plugin_row_meta', [ $this, 'addPluginRowMeta' ], 10, 2 );
    }

    /**
     * Add Translate link to the plugin row meta.
     *
     * @param array<int, string> $links Plugin row meta links.
     * @param string             $file  Plugin basename.
     *
     * @return array<int, string>
     */
    public function addPluginRowMeta( array $links, string $file ): array {
        if ( plugin_basename( TIMELINE_FULL_WIDGET_FILE ) !== $file ) {
            return $links;
        }

        $links[] = sprintf(
            '<a href="%s" target="_blank" rel="noopener noreferrer">%s</a>',
            esc_url( 'https://translate.wordpress.org/projects/wp-plugins/timeline-full-widget/' ),
            esc_html__( 'Translate', 'timeline-full-widget' )
        );

        return $links;
    }
}
