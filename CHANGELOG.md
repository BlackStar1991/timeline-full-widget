## Unreleased — per-item Elementor layout parity (October 16, 2026)
- Replaced widget-wide Elementor horizontal/reverse layout controls with per-item `Use horizontal content layout` and `Reverse media and content order` switches (both off for newly added items).
- Decoupled these two switches from shared visual-style inheritance in both PHP rendering and Elementor live preview. Each Timeline item can choose its layout and media order independently.
- Normalized legacy global layout fields when importing/exporting older `.tfw.json` Elementor files. New exports contain only per-item layout fields; Gutenberg ↔ Elementor transfers preserve independent flags even with shared item styles enabled.
- Kept a narrow renderer fallback for previously saved Elementor widgets lacking per-item flags, preventing unintended changes on existing pages; removed the obsolete global UI and old widget-wide transfer emission.
- Updated WordPress translation strings, `readme.txt`, `AGENTS.md`, and bidirectional regression tests. Plugin release version retained at 4.0.0, matching supplied development ZIP.

## Editor scroll hotfix (unversioned development build, October 16, 2026)
* Corrected Gutenberg Timeline animation lifecycle: insertion or styling of inner blocks no longer resets the scroll progress by remounting the animation controller.
* Added a Gutenberg-only geometry watchdog to advance line animation even without forwarded iframe scroll events; listeners and interval are cleaned up on unmount.
* Prevented Timeline inner grids and media from widening the Gutenberg editor's horizontal scroll area without modifying frontend layout.
* Audited `initAllWidgets()` callers, retained its idempotent document-wide role for frontend, Elementor and Classic Editor.
* Updated compiled Gutenberg JS/CSS and build asset hash, with additional regression and isolated Chromium checks. Full wp-scripts rebuild requires compatible npm dependencies.

### Gutenberg scroll animation and toolbar follow-up (October 16, 2026)
- Fixed the iframe-editor line-progress viewport calculation: intersect the iframe rectangle, outer editor clipping ancestors, and parent viewport instead of measuring from the unrelated parent window midpoint. Supports both iframe-internal and outer editor scroll.
- Ignore overflow-styled containers which cannot actually scroll when selecting local scroll roots. Retain the Gutenberg-only parent-to-iframe event bridge and the existing frontend animation contract.
- Group Timeline's media and item-style toolbar actions in `ToolbarGroup` to comply with the Gutenberg BlockControls toolbar API. Other core/Elementor iframe CSS warnings are outside this plugin.
- Updated the shipped Gutenberg bundle to match source changes, and changed its asset hash to invalidate old browser/editor caches. This is a narrowly patched bundle; a fresh `npm ci && npm run build` is still required before production certification.
- Tested both scrolling modes in isolated Chromium and ran the existing plugin regression suite; real WordPress iframe integration is still unverified.

### Gutenberg editor animation stabilization (October 16, 2026)
- Corrected scroll coordinate selection for iframe-local versus parent editor scroll containers, including scroll position beyond the Timeline.
- Introduced a Gutenberg-only scroll-event bridge and updated the animation runtime in both source and currently bundled editor asset.
- Added scroll regression tests and kept the shared Elementor/frontend animation contract unchanged.

## Unreleased (October 16, 2026) — changes based on attached 4.0.0 archive

- Reuse Elementor's existing import-confirmation popup in **both** Elementor and Gutenberg through one editor-independent `assets/js/transfer/import-dialog.js` module.
- Gutenberg now opens that popup after local file validation. Remove the old sidebar checkbox form, redundant file/selection React state and duplicate Elementor dialog code; keep the sidebar's Export / Import buttons and non-intrusive status messages.
- Retain the same transfer schema, safety validation, placeholder handling, all selection flags (IDs off by default, content on except legacy missing-text files), editor undo semantics and bidirectional conversion.
- Improve modal keyboard behavior (Escape, Tab focus cycle, Cancel, backdrop), show source and item count, and keep failed applications visible for correction. Render filenames and warnings as inert text, not HTML.
- Extend UI smoke tests with genuine shared-dialog interaction, repeated/cancelled imports, cross-editor warnings, failed destination writes and a malicious filename. Update brittle contract assertions to account for minified `build/index.js` while continuing to check marker animation and background mapping.
- **No plugin version change**: this is a targeted patch to the supplied archive, whose plugin header, readme and `package.json` identify it as `4.0.0`. Prepare a separately versioned release only once the maintainer chooses the next release number.

## 4.0.0 (October 15, 2026)

- Gutenberg animation now activates marker colors only when the scroll-animated line passes a marker, never because an item becomes the nearest/selected block. Reinitialize geometry after live changes to marker color, size and active color. Keep existing front-end animation lifecycle and cleanup.
- Gutenberg → Elementor: parent Timeline Item layout flags take precedence over stale nested copies. Preserve first-authored title block and subsequent heading/paragraph order, including side content; align individual layout/reversal with Elementor style inheritance.
- Elementor → Gutenberg: always reconstruct a real heading block for the title to avoid duplicate migration/empty-title behavior; retain safe hyperlink markup in title and content separately. Port the widget-level background color or sanitized destination-local image placeholder into dedicated Gutenberg block attributes.
- Add tests for actual reported mixed parent/nested flags, text order, title/body links, background images and selection-independent marker state. Keep portable transfer format v1 and original native editor settings intact.
- Gutenberg build/ package was updated for the small changed animation and shared-style renderer code because npm dependencies were unavailable; source maps for the modified JS bundle were intentionally omitted rather than ship stale maps. **A fresh `npm ci && npm run build` and real Elementor/Gutenberg browser smoke tests remain required before production release.**

## 4.0.6 (October 15, 2026)

- Added two-way Elementor → Gutenberg import, mapping repeater items into Timeline Items with separate side/main InnerBlocks. Preserve supported title, paragraphs, lists, links, background/text colors, heading type, basic typography, marker/line settings, and effective horizontal/reverse layout. No original donor media URLs are fetched.
- Gutenberg import now accepts either native Gutenberg `innerBlocks` or Elementor repeater `list` transfer files, reports the correct item count, and displays a warning that cross-editor design controls cannot be converted losslessly.
- Fixed Gutenberg → Elementor layout to read the active nested main-content flags, not stale item mirrors; ensure per-item style inheritance is disabled when needed to honor individual layout/reversal.
- Fixed export/import of blank Elementor media objects: do not fabricate images for empty controls. Constrained transferred 800×600 SVG image and marker placeholders to card dimensions and the Timeline marker CSS variable, including current prebuilt Gutenberg CSS.
- Reset Gutenberg import choices when selecting a new file, avoiding accidentally preserving old content because a previous import unchecked content.
- Added regression coverage for both directions, empty media, native inheritance semantics, a classic-script-loading editor UI path, selective options, and marker placeholder CSS. Schema v1 and native editor keys stay unchanged.
- The exported JSON retains editor-specific controls; unsupported cross-editor CSS/fonts remain explicitly out of scope. WordPress/Elementor browser end-to-end tests and a fresh webpack build are still required for deployment certification.

## 4.0.5 (October 15, 2026)

- Restored the Gutenberg Timeline Import / Export panel after WordPress emitted the transfer entrypoint as a classic script: Gutenberg now uses a classic-safe dynamic-import bootstrap, matching Elementor.
- Fixed Gutenberg-to-Elementor conversion of per-item background colors stored as WordPress palette slugs (`backgroundColor`). Standard WordPress preset colors are mapped to native Elementor color controls.
- New Gutenberg exports snapshot **used** theme palette values, so custom palette colors remain consistent when imported into Elementor on another site. Existing schema v1 files remain compatible.
- Map supported Gutenberg heading/paragraph text colors and individual title alignment to Elementor's per-item styling; disable shared item style inheritance when necessary.
- Added regression coverage for classic Gutenberg script execution, palette conversion, malformed palette rejection, item background import options, and PHP script registration.

## 4.0.4 (October 15, 2026)

- Fixed Elementor Import/Export buttons not responding when Elementor treats registered JavaScript modules as classic scripts (`Cannot use import statement outside a module`).
- Registered tiny classic-safe loader scripts for the Elementor panel controls and Timeline animation widget dependency; actual ES modules are loaded via native `import()` with a versioned URL.
- Kept Gutenberg and Classic Editor module-tag handling unchanged, including registered-script restoration after Elementor resets WordPress' script registry.
- Added Node integration tests for classic-script loader syntax, dynamic import, click registration, export, and import, plus PHP tests for script handle registration; updated `AGENTS.md` and local Playground bundle.

## 4.0.3 (October 15, 2026)

- Fixed Elementor Timeline Import/Export buttons staying inactive: Elementor resets the global WordPress script and style registries during editor startup, so editor assets registered on `init` disappeared before the `elementor/editor/after_enqueue_scripts` hook. Re-register required Timeline scripts and shared styles after this reset, then enqueue the editor module and preview adapter.
- Fixed ES module script tags in contexts where WordPress emits `type="text/javascript"`. Replace the classic type with one `type="module"` while retaining the script tag's other attributes. This covers both Elementor and Gutenberg transfer modules and other plugin-native ES modules.
- Added PHP regression tests that reproduce Elementor's registry reset and WordPress-generated classic script tags, plus existing editor transfer smoke tests. The transfer JSON schema remains v1; no migration is needed.

## 4.0.2 (October 15, 2026)

- Fixed `Unsafe transfer property` on the plugin's valid `onTheOneSide` attribute. Unsafe DOM event keys and invalid values still fail validation.
- Fixed Gutenberg export serialization of WordPress RichTextData so new exports contain actual heading/paragraph HTML. Previously exported `{}` content cannot be reconstructed: old files now show a warning and default to keeping the destination text.
- Fixed Elementor widget selection for editors exposing the active model via `currentPageView.model`, while keeping previous selection/view fallbacks and the official settings command.
- Added Gutenberg -> Elementor import of supported Timeline controls: shared line and marker properties, layout, animation, content, links, media placeholders, spacing and basic styles. Arbitrary nested Gutenberg blocks, preset colors and theme-dependent styles cannot be translated losslessly.
- Added regression tests for genuine export shapes, cross-builder mapping, RichTextData export, and executable-event validation. Portable file schema remains v1.

## 4.0.1 (October 15, 2026)

- Fixed Elementor transfer buttons by intercepting editor panel click events in capture phase and resolving the active widget through both panel and selection APIs. Imports use Elementor's documented settings command and show a clearer confirmation dialog.
- Gutenberg import confirmation now uses a normal primary action, file details, explicit content choice, a cancel button, and an explanation of replacement/Undo.
- Enabled transferring Gutenberg headings, paragraphs and nested text by default; added an opt-out that preserves recipient text at matching block paths. Elementor text transfer can also be disabled while retaining imported per-item styles.
- Hardened imported JSON against prototype pollution, oversized content, unsafe URL schemes, executable rich HTML/CSS, and unsupported Gutenberg block types; files remain browser-local and donor media URLs become placeholders.
- Fixed WordPress.Security.EscapeOutput.ExceptionNotEscaped for `scripts/check-psr4.php` by avoiding interpolated unescaped exception content.
- Extended transfer and editor-adapter regression tests. Removed obsolete audit files and test logs from the distributable archive; updated AGENTS.md and Playground bundle recipe.
- Compatible with transfer schema v1 and existing 4.0.0 `.tfw.json` exports.

## 4.0.0 (October 15, 2026)

- Added Timeline export and import with replace confirmation in Gutenberg sidebar and Elementor widget Content settings.
- Introduced a shared, versioned `.tfw.json` document envelope that identifies the original editor and stores the complete native widget settings or Gutenberg block hierarchy.
- Added selective import categories: margins, padding, gaps, identifiers, classes, custom styles, animation, links, responsive overrides, typography and backgrounds. HTML IDs are excluded by default; Elementor repeater `_id` identifiers are kept to preserve CSS selectors.
- Added a media scrubber that avoids copying donor attachments or video files; imported timelines display local media/poster/marker placeholders while preserving style sizing metadata and the video media type.
- Preserved Elementor Advanced settings, custom CSS, responsive controls and repeater item overrides through native-settings snapshots. Gutenberg exports descendant blocks and supported native block attributes.
- Added input size, schema-version, editor-type, safe-object-key and nested-block checks. Cross-editor native import is deliberately rejected instead of silently dropping unsupported formatting.
- Added editor-only transfer adapters and regression tests while leaving Gutenberg compiled assets unchanged.
- Added a portable WordPress Playground Blueprint **bundle** for evaluating this unpublished version without downloading an older WordPress.org release.
- Compatibility note: shared semantic style keys do not yet provide fully automatic Elementor↔Gutenberg content conversion; theme CSS, global Elementor tokens and external font dependencies are site-specific.

## 3.3.6 (October 15, 2026)

- Fixed the Gutenberg block metadata text domain (`timeline-full-widget`).
- Registered Elementor's shared timeline CSS at `init` so its style dependency resolves correctly, avoiding unconditional stylesheet enqueueing on unrelated Elementor frontend pages.
- Eliminated redundant media-preview script registration in Elementor editor; kept one authoritative registration path.
- Restricted Classic Editor script loading on irrelevant admin screens and corrected block-editor detection for new posts without an ID.
- Made Elementor PHP title rendering consistent with its editor template when the title HTML tag is `a` but its URL is missing.
- Added standalone PHP/JS regression checks and cross-editor structural audits; updated `AGENTS.md` with executable release gates.
- Retained 2.x/3.x block migration and public compatibility aliases to avoid invalidating existing user content and integrations.

## 3.3.5 (October 8, 2026)

- Fixed Elementor Timeline item styling controls by replacing the obsolete side-content alignment override with title alignment for unique items.
- Moved shared title alignment next to shared title color and scoped shared title styles to items that still use shared styles.
- Removed unused Elementor side-content alignment rendering/template code.

## 3.3.4 (October 8, 2026)

- Fixed Elementor side content alignment for both shared item styles and per-item unique styles.
- Added a normalized alignment value to the Elementor render/template output so editor preview and frontend markup stay in sync.

## 3.3.3 (October 8, 2026)

- Fixed Elementor editor live preview for timeline line width, line color, marker size, marker color, and active colors by removing duplicate inline CSS custom properties from the widget wrapper. Elementor selector-generated CSS is now the single source of truth for those dynamic controls.

## 3.3.2 (October 8, 2026)

- Fixed Elementor Timeline side content alignment for both shared item styles and unique per-item overrides.
- Added shared text alignment utility styles to the Elementor/Core stylesheet so preview and frontend output match.

## 3.3.1 (October 8, 2026)

- Restored the Gutenberg “Apply item styles to other items” toolbar action.
- Replaced continuous Gutenberg shared-style syncing with safer initial style inheritance: newly added Timeline Items copy style/layout settings from the item immediately above them.
- Kept each Timeline Item editable after creation so later style changes do not unexpectedly overwrite existing items.
- Fixed Gutenberg editor preview errors caused by the previous shared-style implementation in nested item areas.

# Timeline Full Widget

## 3.3.0 (October 8, 2026)
* Replaced the manual Gutenberg item style copy button with shared item style inheritance.
* Added a per-item “Use shared item styles” switch in Gutenberg items and their nested side/content areas.
* Added Elementor shared item style defaults with a per-item opt-out mode for unique item styles.
* Kept Elementor repeater UX clean by showing item style override controls only when shared styles are disabled for that item.

## 3.2.0 (October 8, 2026)
* Aligned the Elementor widget frontend/editor markup with the canonical Gutenberg timeline item structure.
* Added Elementor per-item controls for title color, content color, side alignment, and content layout overrides.
* Moved Elementor timeline colors and sizing to the same CSS custom properties used by the Gutenberg block.
* Fixed Elementor repeater item classes so per-item selector styles apply reliably.
* Updated shared timeline CSS to use variable-based line and active colors across builders.

## 3.1.1 (September 16, 2026)
* Migrated static Gutenberg InnerBlocks templates to block type settings for WordPress 7.2 / Gutenberg 23.8+.
* Added a backward-compatible InnerBlocks template fallback for older supported WordPress versions.
* Made Timeline Item side and content scaffolding part of the static template tree to avoid duplicate template insertion during real-time collaboration.
* Synchronized plugin and package version metadata.

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
