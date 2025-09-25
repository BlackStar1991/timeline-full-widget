=== Timeline Full Widget ===
Contributors: Blackstar1991
Donate link: https://www.paypal.com/donate/?hosted_button_id=TK9QQ5DE2K378
Tags: timeline, Elementor, gutenberg blocks, editor, blocks
Requires at least: 5.0
Tested up to: 6.8
Stable tag: 1.0.0
License: GPLv2 or later
License URI: http://www.gnu.org/licenses/gpl-2.0.html

Add a Timeline Widget easily to your WordPress site.

== Description ==

Adds Timeline Addons/Widgets designed to be used with the Elementor Page Builder.
You can also add a Timeline Gutenberg Block for modern WordPress sites, or a Timeline Widget for classic themes.

== Installation ==

1. Upload the plugin files to the `/wp-content/plugins/timeline-full-widget` directory, or install it through the WordPress plugins screen directly.
2. Activate the plugin through the 'Plugins' screen in WordPress.
3. Use the Elementor editor, Gutenberg editor, or classic widget to add a Timeline.

== Frequently Asked Questions ==

= Does it work with the latest Elementor? =
Yes, tested with Elementor 3.31.4 and WordPress 6.8.

= Can I set a unique marker that is wider (width) than 30 px? =
Yes, but then the styles for the timeline may shift. To correct them, you will need to specify the styles separately. For example:
@media (min-width: 701px) {
    .tl-mark:has(img) {
    max-width: 42px !important;
    height: 30px;
    left: calc(50% + 2px);
    }
}

== Screenshots ==

1. Timeline widget in Elementor.
2. Timeline block in Gutenberg.

== Changelog ==

= 1.0.0 =
* Release Date - 25th September 2025
* Initial Release
