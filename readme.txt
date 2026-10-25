=== Timeline Full Widget ===
Contributors: Blackstar1991
Donate link: https://www.paypal.com/donate/?hosted_button_id=TK9QQ5DE2K378
Tags: timeline, Elementor, gutenberg blocks, editor, blocks
Requires at least: 5.5
Tested up to: 7.1
Stable tag: 4.1.0
License: GPLv2 or later
License URI: http://www.gnu.org/licenses/gpl-2.0.html

Free timeline plugin for WordPress, Elementor, and Gutenberg. Create responsive timelines, roadmaps, and milestones without code.

== Description ==

Timeline Full Widget lets you build responsive timelines, roadmaps and milestone lists in Gutenberg or Elementor.

Features:

- Custom line, marker, typography, spacing and animation settings.
- Flexible per-item layouts, shared styles and independent item/card backgrounds.
- Images and videos with optional media width in px or %.
- Gutenberg side and main content areas that support compatible WordPress blocks.
- Import/export Timeline designs as `.tfw.json` files, including supported Gutenberg ↔ Elementor transfers.
- Select which content and styles to import. Media from other sites is replaced with local placeholders.

Use it for project roadmaps, company histories, event timelines and milestones.

== Installation ==

1. Install Timeline Full Widget from the WordPress Plugins screen or upload it to `/wp-content/plugins/timeline-full-widget`.
2. Activate the plugin.
3. Add a Timeline block in Gutenberg or a Timeline widget in Elementor.

== Frequently Asked Questions ==

= Does Timeline Full Widget support Elementor and Gutenberg? =
Yes. Add the Timeline block in Gutenberg or the Timeline widget in Elementor.

= Can I customize individual Timeline items? =
Yes. Set item and card backgrounds, typography, markers, media, and horizontal or reversed content layouts. Elementor supports shared styles with per-item overrides; Gutenberg can copy styles between items.

= Can I add other blocks inside a Timeline item? =
Yes. Gutenberg Timeline items have separate side and main content areas for compatible WordPress blocks.

= How do I import or export a Timeline? =
Open **Import / Export Timeline** in the selected Gutenberg block or Elementor widget. Export a `.tfw.json` file or import one and choose which properties to apply. Importing replaces the selected Timeline; review the options before confirming.

= Can I transfer a Timeline between Gutenberg and Elementor? =
Yes, for supported content and styling. Advanced editor-specific settings, fonts and theme styles may not transfer exactly. Images, video posters and custom markers use local placeholders instead of the original site's files.

= Can I change the background of the whole Timeline? =
Yes. In Gutenberg, select the Timeline block and use the standard Background settings in the Styles tab. You can set a color or a background image when your WordPress version and theme support those controls. Compatible backgrounds can also be imported from Elementor.

= How do Wide width and Full width work? =
In Gutenberg, these options follow the active theme's layout settings. Page templates and parent blocks can also affect the available width.

== Screenshots ==

1. Timeline widget in Elementor.
2. Timeline block in Gutenberg.
3. Timeline block in Gutenberg.
4. Horizontal and vertical content layouts.

== Contribute ==

Help translate Timeline Full Widget:
https://translate.wordpress.org/projects/wp-plugins/timeline-full-widget/

== Changelog ==

= 4.1.0 =
* Show the Gutenberg Timeline Item Media Settings panel only after adding an image or video; hide it again when media is removed.
* Keep custom marker image settings accessible in a separate panel, even when no main media is attached.

= 4.0.0 =
* Added selective cross-site import/export and compatible two-way Gutenberg/Elementor transfer.
* Added per-item layout, background and media controls, including width in px or %.
* Improved color/style transfer and media placeholders without copying source attachments.
* Improved Gutenberg editor behavior, animation handling and responsive layout compatibility.
* Strengthened import validation and compatibility with existing Timeline content.

= 3.3.6 =
* Improved editor asset loading, translations and compatibility.

= 3.3.5 =
* Added Elementor per-item title alignment.

= 3.3.4 =
* Fixed Elementor side-content alignment.

= 3.3.3 =
* Fixed live updates for Elementor line and marker controls.

= 3.3.2 =
* Improved Elementor side-content alignment.

= 3.3.1 =
* Restored Gutenberg item style copying and improved new-item inheritance.

= 3.3.0 =
* Added shared and individual item styles in Gutenberg and Elementor.

= 3.2.0 =
* Unified Elementor/Gutenberg markup and styling controls.

= 3.1.1 =
* Improved Gutenberg InnerBlocks templates and compatibility.

= 3.1.0 =
* Fixed problem with blueprint.json.

= 3.0.0 =
* Reworked the Gutenberg Timeline Item structure to support block-based side content and main content areas.
* Added support for adding any compatible WordPress blocks inside both the side content area and the main description area of each timeline item.
* Kept nested side and main content areas editable by default, including regular WordPress block insertion.
* Replaced the custom timeline item title field with a standard editable Heading block in the main content area.
* Preserved style copying between timeline items, including compatible nested block styles.
* Added migration support for existing timeline item content, including moving legacy titles into Heading blocks and preserving customized legacy title styles only when they differ from defaults.
* Added a 3.x legacy title compatibility layer with a code note to remove it in version 4.0.0 or later after users have migrated saved content.
* Added a default empty Paragraph block after the default Heading block for newly created timeline items.
* Removed obsolete Gutenberg title typography attributes from the current block schema.
* Improved editor block appender spacing for nested timeline content areas.

= 2.3.0 =
* Refactored the PHP plugin structure into PSR-4-style classes under `includes/` while keeping Gutenberg source files in `src/`.
* Kept backward-compatible constants for existing custom integrations.
* Improved separation between Gutenberg, Elementor, Classic Editor, assets, and admin metadata loading.
* Added the ability to change marker size

= 2.2.1 =
* Fixed an issue with module script optimization.
* Improved Gutenberg block frontend script loading to ensure animations initialize correctly.

= 2.2.0 =
* Added showing step numbers of items.

= 2.1.1 =
* Bug fixes.

= 2.1.0 =
* Added WordPress Playground support.
* Added support for horizontal and vertical content layouts.
* Added an option to reverse media and content order.

= 2.0.0 =
* Bug fixes.
* Improved Title Typography controls.
* Added link wrapper support for media elements.
* Added timeline width style controls.

= 1.3.0 =
* Added a button to copy styles from the current item.
* Added responsive media queries for the Gutenberg block timeline.
* Added responsive media queries for the Elementor widget timeline.
* Added controls for media width inside timeline items.
* Fixed Content Typography style issues in Elementor.
* Separated line and marker color styles.

= 1.2.0 =
* Corrected timeline styles in the Gutenberg block.
* Bug fixes.

= 1.1.0 =
* Bug fixes.
* Added font-family selection for Title elements in the Gutenberg block.

= 1.0.1 =
* Added sticky text settings for the opposite side of the timeline.
* Corrected marker animation behavior.

= 1.0.0 =
* Release Date - 25th September 2025.
* Initial Release.
