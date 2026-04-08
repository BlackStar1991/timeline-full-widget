// item/hooks/useFontsFromSettings.js
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';

function normalizeFontEntry(f) {
	const name = f?.name || f?.label || f?.title || '';
	const slug = f?.slug || null;
	const family = f?.fontFamily || null;
	const cleanFamily = family
		? String(family).replace(/^["']|["']$/g, '')
		: null;
	const value = slug || cleanFamily || name;

	return {
		name: name || value,
		slug,
		family: cleanFamily,
		value,
	};
}

function extractFontsFromSettings(settings) {
	if (!settings) {
		return [];
	}

	const candidates = [
		settings.typography,
		settings?.settings?.typography,
		settings?.theme?.settings?.typography,
		settings?.__experimentalFeatures?.typography,
		settings?.settings?.__experimentalFeatures?.typography,
		settings.fontFamilies,
	];

	const found = [];

	const pushFonts = (maybe) => {
		if (!maybe) {
			return;
		}

		if (Array.isArray(maybe)) {
			found.push(...maybe);
			return;
		}

		if (maybe.fontFamilies) {
			if (Array.isArray(maybe.fontFamilies)) {
				found.push(...maybe.fontFamilies);
			} else if (typeof maybe.fontFamilies === 'object') {
				Object.values(maybe.fontFamilies).forEach((value) => {
					if (Array.isArray(value)) {
						found.push(...value);
					}
				});
			}
		}

		if (
			maybe.fontFamilies?.theme &&
			Array.isArray(maybe.fontFamilies.theme)
		) {
			found.push(...maybe.fontFamilies.theme);
		}
	};

	candidates.forEach(pushFonts);

	const normalized = found.filter(Boolean).map(normalizeFontEntry);
	const uniqueMap = new Map();

	normalized.forEach((font) => {
		if (font.value && !uniqueMap.has(font.value)) {
			uniqueMap.set(font.value, font);
		}
	});

	return Array.from(uniqueMap.values());
}

export default function useFontsFromSettings() {
	const settings = useSelect((select) => {
		return (
			select('core/block-editor')?.getSettings?.() ||
			select('core/editor')?.getEditorSettings?.() ||
			null
		);
	}, []);

	const fonts = useMemo(() => {
		return extractFontsFromSettings(settings);
	}, [settings]);

	return fonts;
}
