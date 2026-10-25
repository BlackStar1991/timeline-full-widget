# Timeline Full Widget — Changelog

## 4.1.0 (October 23, 2026)
- Hide Gutenberg Timeline Item Media Settings until an image or video has been selected, and hide it again when removed.
- Show custom marker controls independently of the main item media, preserving marker setup without an image or video.
- Keep saved block markup and Elementor widget behavior unchanged.

## 4.0.0 (October 2026)
- Removed unused pre-PSR-4 PHP aliases and obsolete Elementor shim; streamlined Classic Editor module resolution and Elementor preview iframe discovery. Retained saved-block migrations and cross-editor compatibility at data boundaries.
- Enabled native WordPress Background controls for the root Gutenberg Timeline and compatible Elementor background import/export; retained legacy saved backgrounds.
- Added cross-site Timeline import/export for Gutenberg and Elementor with selective property transfer and a shared `.tfw.json` format.
- Added two-way conversion of supported content, links, layout, colors, typography and marker settings; editor-specific styles may require adjustment.
- Replaced transferred media with local placeholders, preserving media types and available dimensions without copying source attachments.
- Added per-item layout and media-order options, separate item/card backgrounds, card background images and optional media width (`px` or `%`).
- Improved transfer of Gutenberg palette colors, one-sided layouts and per-item styling to Elementor.
- Improved Gutenberg editor controls and animation handling, media replacement, custom marker sizing and theme-aware wide alignment.
- Added validation for imported files, including unsafe content and unsupported properties.

## 3.3.6 (October 2026)
- Improved script/style loading for Elementor and Classic Editor, Gutenberg translations and compatibility checks.

## 3.3.5 (October 2026)
- Added per-item title alignment in Elementor and removed unused side-alignment controls.

## 3.3.4 (October 2026)
- Fixed Elementor side-content alignment in the editor and frontend.

## 3.3.3 (October 2026)
- Fixed live updates for Elementor line and marker sizes and colors.

## 3.3.2 (October 2026)
- Improved shared and per-item side-content alignment in Elementor.

## 3.3.1 (October 2026)
- Restored the Gutenberg style-copy action and made new items inherit styles without overwriting existing items.

## 3.3.0 (October 2026)
- Introduced shared and per-item styling controls for Gutenberg and Elementor.

## 3.2.0 (October 2026)
- Unified Elementor and Gutenberg timeline markup, CSS variables and per-item styles.

## 3.1.1 (September 2026)
- Improved Gutenberg InnerBlocks templates and compatibility with older WordPress versions.

## 3.1.0
* Fixed problem with `blueprint.json`.

## 3.0.0 (August 24, 2026)
* Reworked the Gutenberg Timeline Item structure to support separate block-based side content and main content areas.
* Added support for adding compatible WordPress blocks to both the side content area and the main description area of each timeline item.
* Improved style copying between timeline items so compatible nested block styles continue to be applied.
* Added migration support for existing timeline item content, including moving legacy titles into Heading blocks and preserving customized legacy title styles only when they differ from defaults.
* Added a 3.x legacy title compatibility layer with a code note to remove it in version 4.0.0 or later after users have migrated saved content.
* Removed obsolete Gutenberg title typography attributes from the current block schema.
* Improved editor appender spacing to prevent nested block inserters from overlapping.

## 2.3.0 (July 7, 2026)
* Refactored PHP loading into a PSR-4-style `includes/` structure.
* Kept Gutenberg source files in `src/` and moved PHP responsibilities into dedicated classes for assets, block registration, Elementor, Classic Editor, and plugin metadata.
* Added the ability to change marker size

## 2.2.1 (May 30, 2026)
* Fixed an issue where timeline animations could fail when JavaScript optimization or minification plugins were enabled.
* Improved Gutenberg block frontend script loading to ensure animations initialize correctly.

## 2.2.0 (May 30, 2026)
* Added showing step numbers of items.

## 2.1.1 (April 29, 2026)
* Bug fixes.

## 2.1.0 (April 29, 2026)
* Added WordPress Playground support.
* Added support for horizontal and vertical content layouts.
* Added an option to reverse media and content order.

## 2.0.0 (April 24, 2026)
* Bug fixes.
* Improved Title Typography controls.
* Added link wrapper support for media elements.
* Added timeline width style controls.

## 1.3.0 (April 13, 2026)
* Added a button to copy styles from the current item.
* Added responsive media queries for the Gutenberg block timeline.
* Added responsive media queries for the Elementor widget timeline.
* Added controls for media width inside timeline items.
* Fixed Content Typography style issues in Elementor.
* Separated line and marker color styles.

## 1.2.0 (January 23, 2026)
* Corrected timeline styles in the Gutenberg block.

## 1.1.0 (October 6, 2025)
* Bug fixes.
* Separated timeline components.
* Added font-family selection for Title elements in the Gutenberg block.

## 1.0.1 (October 3, 2025)
* Added sticky text settings for the opposite side of the timeline.
* Corrected marker animation behavior.

## 1.0.0 (October 1, 2025)
* Minor text changes.
* Added screenshot.
* Added plugin icon.

## 0.1.0 (October 1, 2025)
* Initial release.
