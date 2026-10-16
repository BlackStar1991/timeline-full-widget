import { getBlockType } from '@wordpress/blocks';

/**
 * Detect support for static block templates declared in registerBlockType().
 *
 * WordPress 7.2 / Gutenberg 23.8+ migrate core/list to a block-type template.
 * Older WordPress versions still require the deprecated InnerBlocks template
 * prop, so keep it as a runtime fallback while the plugin supports WP < 7.2.
 *
 * @return {boolean} Whether block-type templates are supported by the editor.
 */
export function supportsBlockTypeTemplates() {
	return Boolean( getBlockType( 'core/list' )?.template );
}

/**
 * Return the legacy InnerBlocks template prop only when required.
 *
 * @param {Array} template InnerBlocks template.
 * @return {Object} Props for backward-compatible InnerBlocks rendering.
 */
export function getLegacyTemplateProps( template ) {
	return supportsBlockTypeTemplates() ? {} : { template };
}
