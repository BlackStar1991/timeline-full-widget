import { __ } from '@wordpress/i18n';

export const ITEM_ATTRIBUTE_EXCLUSIONS = new Set([
	'title',
	'linkUrl',
	'linkTarget',
	'rel',
	'mediaLinkUrl',
	'mediaLinkTarget',
	'mediaLinkRel',
	'isMediaWrapToLink',
	'mediaUrl',
	'mediaId',
	'mediaType',
	'mediaMime',
	'imageAlt',
	'videoPoster',
	'markerUrl',
	'markerId',
	'markerAlt',
	'otherSiteTitle',
	'position',
]);

export const DESCENDANT_ATTRIBUTE_EXCLUSIONS = new Set([
	'content',
	'values',
	'caption',
	'alt',
	'title',
	'text',
	'value',
	'url',
	'href',
	'src',
	'id',
	'ids',
	'linkDestination',
	'linkTarget',
	'linkClass',
	'linkRel',
	'mediaId',
	'mediaIds',
	'mediaUrl',
	'mediaUrls',
	'blob',
	'file',
	'fileName',
	'poster',
	'placeholder',
]);


function cloneAttributeValue(value) {
	if (Array.isArray(value)) {
		return value.map((item) => cloneAttributeValue(item));
	}

	if (value && typeof value === 'object') {
		return Object.keys(value).reduce((acc, key) => {
			acc[key] = cloneAttributeValue(value[key]);
			return acc;
		}, {});
	}

	return value;
}

function shouldResetLegacyTitleInlineStyle(attributes = {}) {
	return [
		'titleFontSize',
		'titleFontWeight',
		'titleFontFamily',
		'titleLineHeight',
		'titleLetterSpacing',
		'titleMarginTop',
		'titleMarginBottom',
		'titleColor',
	].some((key) => {
		const value = attributes[key];
		if (value === undefined || value === null) {
			return false;
		}

		if (typeof value === 'string') {
			return value.trim() !== '';
		}

		if (typeof value === 'object') {
			return Object.values(value).some(
				(entry) => entry !== undefined && entry !== null && entry !== ''
			);
		}

		return true;
	});
}

export function getInheritableAttributes(
	attributes = {},
	exclusions = ITEM_ATTRIBUTE_EXCLUSIONS
) {
	const inheritable = Object.keys(attributes).reduce((acc, key) => {
		if (exclusions.has(key)) {
			return acc;
		}

		acc[key] = cloneAttributeValue(attributes[key]);
		return acc;
	}, {});

	if (shouldResetLegacyTitleInlineStyle(inheritable)) {
		inheritable.titleInlineStyle = '';
	}

	return inheritable;
}

function collectDescendantBlocks(block, path = []) {
	if (!block) {
		return [];
	}

	const children = Array.isArray(block.innerBlocks) ? block.innerBlocks : [];

	return children.flatMap((child, index) => {
		const childPath = [...path, index];
		return [
			{ block: child, path: childPath },
			...collectDescendantBlocks(child, childPath),
		];
	});
}

function pathToKey(path = []) {
	return path.join('.');
}

export function collectDescendantStyleUpdates(sourceBlock, targetBlock) {
	if (!sourceBlock || !targetBlock) {
		return [];
	}

	const sourceDescendants = collectDescendantBlocks(sourceBlock);
	const targetDescendants = collectDescendantBlocks(targetBlock);
	const sourceMap = new Map(
		sourceDescendants.map(({ block, path }) => [pathToKey(path), block])
	);

	return targetDescendants.reduce((updates, { block, path }) => {
		const sourceMatch = sourceMap.get(pathToKey(path));
		if (!sourceMatch || sourceMatch.name !== block.name) {
			return updates;
		}

		const attrs = getInheritableAttributes(
			sourceMatch.attributes,
			DESCENDANT_ATTRIBUTE_EXCLUSIONS
		);

		if (Object.keys(attrs).length) {
			updates.push({ clientId: block.clientId, attributes: attrs });
		}

		return updates;
	}, []);
}

export function getNoSiblingItemsNotice() {
	return __(
		'Add at least one more Timeline Item to copy styles.',
		'timeline-full-widget'
	);
}

export function getNoRecipientItemsNotice() {
	return __(
		'No other Timeline Items were found in this block.',
		'timeline-full-widget'
	);
}
