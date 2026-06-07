<?php
/**
 * Gutenberg block registration.
 *
 * @package TimelineFullWidget
 */

namespace TimelineFullWidget\Blocks;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

final class TimelineBlock {

    /**
     * Register WordPress hooks.
     */
    public function register(): void {
        add_action( 'init', [ $this, 'registerBlock' ] );
    }

    /**
     * Register the block from block.json metadata.
     */
    public function registerBlock(): void {
        if ( ! function_exists( 'register_block_type_from_metadata' ) ) {
            return;
        }

        register_block_type_from_metadata( TIMELINE_FULL_WIDGET_PATH );
    }
}
