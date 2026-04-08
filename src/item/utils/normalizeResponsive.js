export function normalizeResponsive(value, defaults = {}) {
	return {
		desktop: value?.desktop ?? defaults.desktop ?? null,
		tablet: value?.tablet ?? defaults.tablet ?? null,
		mobile: value?.mobile ?? defaults.mobile ?? null,
	};
}

export function resolveResponsiveValue(responsive, device) {
	if (!responsive) {
		return null;
	}

	if (device === 'mobile' && responsive.mobile !== null) {
		return responsive.mobile;
	}

	if (device === 'tablet' && responsive.tablet !== null) {
		return responsive.tablet;
	}

	return responsive.desktop ?? null;
}
