=== Timeline Full Widget ===
Contributors: Blackstar1991
Donate link: https://www.paypal.com/donate/?hosted_button_id=TK9QQ5DE2K378
Tags: timeline, Elementor, gutenberg blocks, editor, blocks
Requires at least: 5.5
Tested up to: 7.1
Stable tag: 4.0.0
License: GPLv2 or later
License URI: http://www.gnu.org/licenses/gpl-2.0.html

Free timeline plugin for WordPress, Elementor, and Gutenberg. Create responsive timelines, roadmaps, and milestones without code.

== Description ==

Timeline Full Widget is a lightweight and flexible **WordPress timeline plugin** that allows you to create timelines using both **Elementor** and **Gutenberg**.

The plugin provides a consistent editing experience across builders and gives you full control over layout, styling, and content without unnecessary complexity.

Key advantages:

- Works with **Elementor** and **Gutenberg**
- Clean and simple editing experience
- Customizable styles (colors, typography, spacing)
- Support for images and video
- Responsive layout
- Reusable styles between timeline items
- Independent horizontal layout and media order switches for every Elementor and Gutenberg Timeline Item
- Block-based side and main content areas for Gutenberg timeline items
- **Portable Timeline import/export** for both Gutenberg and Elementor: move and replace timelines across sites, preserving native editor properties, advanced layout, custom CSS classes, responsive design, typography, and per-item styles
- **Privacy-minded media placeholders** for imported images, custom markers, and video posters, with image size and video-type settings retained
- **Two-way Elementor ↔ Gutenberg conversion**: import compatible Timeline settings, item text, links, layout, media placeholders and marker styles between editors (editor-specific controls remain editor-specific)
- **Selective imports**: choose whether to transfer headings/text/inner content, margins, padding, gaps, IDs, CSS classes, custom styles, links, animation, responsive settings, typography and backgrounds

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
Yes, tested with Elementor 4.0.0 and WordPress 7.1.

= Does it support Gutenberg (block editor)? =
Yes, the plugin includes a native Gutenberg block. Type “/timeline”

= Can I change the marker on the timeline items? =
Yes, you can. Use the "Edit marker" button. In "Marker Settings" you need choose "Unique Marker" option, after that you would be able to set a personal marker like a image.

= Can I add blocks inside a timeline item? =
Yes. In Gutenberg, each timeline item now has separate block-based areas for side content and main content. You can add headings, paragraphs, lists, galleries, and other compatible blocks to each area.

= Can I customize timeline item styles? =
Yes, you can control colors, typography, spacing, and alignment for each item.

= How do shared item styles work? =
In Elementor, timeline items use shared item styles by default. Turn off "Use shared item styles" inside a repeater item only when that item needs unique colors or typography. Each Elementor Timeline Item has separate "Use horizontal content layout" and "Reverse media and content order" switches under Item layout, both off by default, regardless of shared styles. In Gutenberg, newly inserted Timeline Items copy style/layout settings from the item directly above them, and the existing toolbar button can still apply the current item styles to other items.

= Can I transfer a Timeline to another website? =
Yes. In Elementor open the widget's **Import / Export Timeline** section under Content. In Gutenberg select the Timeline block and open **Import / Export Timeline** in the block sidebar. Export a `.tfw.json` file, then add a new Timeline widget or block on the destination site and import it. For both editors, importing a validated file opens a popup to choose which properties to transfer (IDs, margins, padding, classes, custom CSS, responsive styles, text and more) before replacing the selected Timeline. The Gutenberg sidebar contains only import/export actions and notifications, not the confirmation checkboxes. Media is replaced by local placeholders rather than copied from the donor site.

= How are Gutenberg palette colors transferred to Elementor? =
Standard WordPress palette slugs are resolved to their actual CSS colors, including per-item backgrounds and supported heading/paragraph colors. New Gutenberg exports also capture used theme palette values so custom colors can travel between websites. Other site-specific theme styles and unsupported nested block styling may still need adjustment.

= Can I import a Gutenberg Timeline into Elementor or vice versa? =
Both directions, **Gutenberg → Elementor** and **Elementor → Gutenberg**, can import supported core Timeline layout, item headings/text, hyperlinks, common colors, marker settings and media placeholders. Conversions are best-effort: Elementor Advanced CSS, custom font families, complex Gutenberg nested blocks, and theme-dependent tokens have no guaranteed direct equivalent. For highest fidelity, import into the originating editor. Elementor repeater layout and media-order switches work independently for every item, even while shared item styles remain enabled.

= Why are some texts missing from an older Gutenberg export? =
Some files created in version 4.0.1 serialized RichText values as empty JSON objects. The content is absent from those files and cannot be reconstructed. Version 4.0.6 preserves rich text in new exports and warns when an older file has missing text; turn off content import to preserve the destination's existing text.

= Will the imported Timeline look exactly the same? =
Native same-editor settings (including Advanced and repeater-item styles) are preserved. Replace placeholder images/videos with local media. Exact appearance also depends on destination theme CSS, locally installed fonts, responsive breakpoints and Elementor global design tokens. Missing donor-only global styles, theme styles, or plugins may require adjustment.

= Is it responsive? =
Yes, the timeline layout adapts to different screen sizes.

= Will it work with my theme? =
Yes, it works with most WordPress themes, including block and classic themes.

== Screenshots ==

1. Timeline widget in Elementor.
2. Timeline block in Gutenberg.
3. Timeline block in Gutenberg.
4. Horizontal and vertical content layouts

== Contribute ==

Would you like to help translate Timeline Full Widget into your language?
You can contribute translations here:
https://translate.wordpress.org/projects/wp-plugins/timeline-full-widget/

== Changelog ==

= 4.0.0 =
* Added native, selective cross-site import/export for both Elementor widgets and Gutenberg Timeline blocks.
* Added image, marker, background and video-poster placeholders without transferring original media attachments.
* Added a shared portable file contract, editor-only adapters and security checks for untrusted files.

= 3.3.6 =
* Corrected the Gutenberg block translation domain to timeline-full-widget.
* Registered shared Elementor styles on init and loaded them only where needed on the frontend.
* Removed redundant Elementor editor script registration and limited Classic Editor assets to applicable editor screens.
* Fixed Elementor title output when the selected HTML tag is a link but no URL was provided.
* Added developer-only PHP/JavaScript regression and PSR-4-style checks.


= 3.3.5 =
* Fixed Elementor Timeline item styling controls by replacing the obsolete Side content alignment override with Title alignment for unique items.
* Moved shared Title alignment next to shared Title color and limited shared title styles to non-unique items.
* Removed unused Elementor side-content alignment override code.

= 3.3.4 =
* Fix Elementor Timeline Item side content alignment so shared and per-item alignment changes update reliably in the editor and frontend.

= 3.3.3 =
* Fixed Elementor live preview for timeline line width, marker size, line colors, and marker colors. Changes now apply immediately in the editor without switching to another component.
* Removed duplicate inline CSS custom properties from the Elementor timeline wrapper so Elementor selector-generated CSS controls the live preview and frontend consistently.

= 3.3.2 =
* Fixed Elementor Timeline side content alignment for both shared item styles and unique per-item overrides.
* Added shared text alignment utility styles to the Elementor/Core stylesheet so preview and frontend output match.

= 3.2.0 =
* Updated Gutenberg static InnerBlocks templates to the WordPress 7.2 / Gutenberg 23.8 block-type template API.
* Made Timeline Item side and content scaffolding atomic for improved real-time collaboration behavior.

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
