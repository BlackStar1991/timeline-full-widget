// assets/js/adapters/gutenberg-adapter.js
import { initAllWidgets } from '../core/animation.js';

// If document already parsed — init immediately, otherwise wait for DOMContentLoaded.
// This avoids the "listener missed because script loaded after DOMContentLoaded" problem.
function boot() {
	try {
		initAllWidgets(document);
	} catch (e) {
		// fail silently in production; you can console.error during debug
		if (typeof console !== 'undefined')
			console.debug('za-timeline: initAllWidgets error', e);
	}
}

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', boot, {
		once: true,
		passive: true,
	});
} else {
	// document already interactive/complete
	boot();
}

// Export helper for editors/tests
export function initGutenbergForRoot(root = document) {
	return initAllWidgets(root);
}
