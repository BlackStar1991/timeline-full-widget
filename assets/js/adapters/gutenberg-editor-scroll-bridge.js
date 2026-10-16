/**
 * Relay scrolls owned by the Gutenberg editor's outer document into its canvas.
 * A Timeline mounted inside an iframe cannot depend on callbacks registered on
 * DOM nodes of the other Window: these may be suspended across realms.
 *
 * This is editor-only and is not loaded on the public frontend.
 */
( () => {
	'use strict';

	if ( window.__zaTimelineScrollBridge ) {
		return;
	}
	window.__zaTimelineScrollBridge = true;
	let scheduled = false;

	function relay() {
		scheduled = false;
		document.querySelectorAll( 'iframe' ).forEach( ( iframe ) => {
			try {
				const target = iframe.contentWindow;
				if ( target?.document.querySelector( '.timeline-wrapper' ) ) {
					target.dispatchEvent( new target.Event( 'za-timeline-editor-scroll' ) );
				}
			} catch ( error ) {
				// Other-origin frames are not editable Gutenberg canvases.
			}
		} );
	}

	function scheduleRelay() {
		if ( ! scheduled ) {
			scheduled = true;
			window.requestAnimationFrame( relay );
		}
	}

	window.addEventListener( 'scroll', scheduleRelay, {
		capture: true,
		passive: true,
	} );
	window.addEventListener( 'resize', scheduleRelay );
} )();
