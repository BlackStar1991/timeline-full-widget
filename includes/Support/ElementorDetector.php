<?php
/**
 * Elementor helper methods.
 *
 * @package TimelineFullWidget
 */

namespace TimelineFullWidget\Support;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

final class ElementorDetector {

    /**
     * Check whether a post is built with Elementor.
     *
     * @param int $post_id Post ID.
     */
    public function isBuiltWithElementor( int $post_id ): bool {
        if ( class_exists( '\\Elementor\\Plugin' ) ) {
            try {
                $elementor = \Elementor\Plugin::instance();
                if ( isset( $elementor->db ) && method_exists( $elementor->db, 'is_built_with_elementor' ) ) {
                    return (bool) $elementor->db->is_built_with_elementor( $post_id );
                }
            } catch ( \Throwable $e ) {
                return false;
            }
        }

        return false;
    }
}
