import { initAllWidgets } from '../core/animation.js';

// Auto init for frontend pages (DOMContentLoaded)
document.addEventListener( 'DOMContentLoaded', () => {
	try {
		initAllWidgets( document );
	} catch ( e ) {}
} );

// Export helpers (for editor scripts to call if needed)
export function initGutenbergForRoot( root = document ) {
	return initAllWidgets( root );
}
