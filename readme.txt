=== Timeline Full Widget ===
Contributors: Blackstar1991
Donate link: https://www.paypal.com/donate/?hosted_button_id=TK9QQ5DE2K378
Tags: timeline, Elementor, gutenberg blocks, editor, blocks
Requires at least: 5.0
Tested up to: 7.0
Stable tag: 2.0.0
License: GPLv2 or later
License URI: http://www.gnu.org/licenses/gpl-2.0.html

Add a Timeline Widget easily to your WordPress site. Elementor Widget and Gutenberg Block for your site.

== Description ==

Timeline Full Widget is a lightweight and flexible **WordPress timeline plugin** that allows you to create timelines using both **Elementor** and **Gutenberg**.

The plugin provides a consistent editing experience across builders and gives you full control over layout, styling, and content without unnecessary complexity.

Key advantages:

- Works with **Elementor and Gutenberg**
- Clean and simple editing experience
- Customizable styles (colors, typography, spacing)
- Support for images and video
- Responsive layout
- Reusable styles between timeline items

You can use it for:

- Project timelines
- Roadmaps
- Company history
- Event timelines
- Milestones

== Installation ==

1. Upload the plugin files to the `/wp-content/plugins/timeline-full-widget` directory, or install it through the WordPress plugins screen directly.
2. Activate the plugin through the 'Plugins' screen in WordPress.
3. Use the Elementor editor or Gutenberg editor.

== Frequently Asked Questions ==


= Does it work with the latest Elementor? =
Yes, tested with Elementor 4.0.2 and WordPress 6.9.

= Does it support Gutenberg (block editor)? =
Yes, the plugin includes a native Gutenberg block. Type “/timeline”

= Can I change the marker on the timeline items? =
Yes, you can. Use the "Edit marker" button. In "Marker Settings" you need choose "Unique Marker" option, after that you would be able to set a personal marker like a image.

= Can I customize timeline item styles? =
Yes, you can control colors, typography, spacing, and alignment for each item.

= How to apply the same styles to all Timeline items in block component? =
Use the "Apply item styles to other items" button. It copies styles from the current item to all other items.

= Can I set a unique marker that is wider (width) than 30 px? =
Yes, but timeline styles may need adjustment. Example:

@media (min-width: 701px) {
    .tl-mark:has(img) {
        max-width: 42px !important;
        height: 30px;
        left: calc(50% + 2px);
    }
}

= Is it responsive? =
Yes, the timeline layout adapts to different screen sizes.

= Will it work with my theme? =
Yes, it works with most WordPress themes, including block and classic themes.

== Screenshots ==

1. Timeline widget in Elementor.
2. Timeline block in Gutenberg.
3. Timeline block in Gutenberg.

== Changelog ==

= 2.0.0 =
* Corrected vision for Title Typography
* Bug fixes.
* Add link wrapper for media element.

= 1.3.0 =
* Add button "Apply item styles to other items".
* Corrected styles for the timeline item.
* Fixed style problems with Content Typography in Elementor.
* Separated styles for line and marker colors
* Bug fixes.

= 1.2.0 =
* Corrected styles for the timeline block.
* Bug fixes.

= 1.1.0 =
* Bug fixes.
* Add choosing font-family for a Title element in the Gutenberg block.

= 1.0.1 =
* Added sticky text settings on the opposite side of the timeline.
* Corrected animation for markers.

= 1.0.0 =
* Release Date - 25th September 2025.
* Initial Release.
