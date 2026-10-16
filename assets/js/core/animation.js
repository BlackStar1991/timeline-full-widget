/* animation.js — ZA timeline */

const DEBUG = false;
function log( ...args ) {
	if ( ! DEBUG ) {
		return;
	}
	try {
		console.log( '[za-timeline]', ...args );
	} catch ( e ) {}
}

export function initTimelineAnimation( scopeEl ) {

	const el = scopeEl && scopeEl.jquery ? scopeEl[ 0 ] : scopeEl;
	if ( ! el || el.nodeType !== 1 ) {
		return null;
	}
	if ( el.__zaTimelineDestroy ) {
		return el.__zaTimelineDestroy;
	}

	// ---- helpers ----
	const findWrapper = ( node ) => {
		if ( ! node ) {
			return null;
		}
		if (
			node.classList &&
			( node.classList.contains( 'timeline-wrapper' ) ||
				node.classList.contains( 'timeline' ) )
		) {
			return node;
		}
		if ( node.querySelector ) {
			return (
				node.querySelector( '.timeline-wrapper' ) ||
				node.querySelector( '.timeline' )
			);
		}
		return null;
	};

	const getScrollParent = ( node ) => {
		if ( ! node ) {
			return window;
		}
		let p = node.parentElement;
		while ( p ) {
			try {
				const style = window.getComputedStyle( p );
				const y = style.overflowY;
				if (
					( y === 'auto' || y === 'scroll' || y === 'overlay' ) &&
					p.scrollHeight > p.clientHeight + 1
				) {
					return p;
				}
			} catch ( e ) {
				// access denied? skip
			}
			p = p.parentElement;
		}
		return window;
	};

	const wrapper = findWrapper( el );
	if ( ! wrapper ) {
		return null;
	}

	const line =
		wrapper.querySelector( '.timeline-line-animation' ) ||
		( el !== wrapper &&
			el.querySelector &&
			el.querySelector( '.timeline-line-animation' ) );
	if ( ! line ) {
		return null;
	}

	let scrollParent = getScrollParent( wrapper );

	const shouldFallbackToWindow = ( rootEl ) => {
		if ( ! rootEl || rootEl === window ) {
			return false;
		}
		try {
			const r = rootEl.getBoundingClientRect();
			if ( ! r || r.height < 2 ) {
				return true;
			}
			if (
				rootEl === document.body ||
				rootEl === document.documentElement
			) {
				return true;
			}
		} catch ( e ) {
			return true;
		}
		return false;
	};
	if ( shouldFallbackToWindow( scrollParent ) ) {
		log(
			'fallback scrollParent => window (detected unsuitable element)',
			scrollParent
		);
		scrollParent = window;
	}

	const isInIframe = window.self !== window.top;
	let parentWindow = null;
	try {
		if ( isInIframe ) {
			parentWindow = window.parent;
			void parentWindow.document;
			log( 'Inside iframe, parent window is accessible' );
		}
	} catch ( e ) {
		log( 'Inside iframe, but parent window not accessible (CORS)', e );
		parentWindow = null;
	}

	// Only the Gutenberg editing canvas needs a geometry watchdog. In an
	// iframe, WordPress may scroll outside our document without dispatching
	// scroll events to listeners registered in this realm. This lightweight
	// watchdog notices actual movement; it is never installed on the frontend.
	const isGutenbergCanvas = !! (
		wrapper.closest?.( '.wp-block-za-timeline-full-widget' ) &&
		( document.body?.classList?.contains( 'editor-styles-wrapper' ) ||
			document.querySelector?.( '.editor-styles-wrapper' ) )
	);

	// An iframe can scroll itself, or its parent editor can scroll the iframe.
	// Always prefer an actual scrolling element inside the iframe; only use
	// parent coordinates when the iframe viewport itself is the scroll root.
	const canUseParentCoords = !! (
		isInIframe &&
		parentWindow &&
		scrollParent === window &&
		window.frameElement &&
		typeof window.frameElement.getBoundingClientRect === 'function'
	);
	let parentScrollElement = null;
	if ( canUseParentCoords ) {
		let ancestor = window.frameElement.parentElement;
		while ( ancestor ) {
			const css = parentWindow.getComputedStyle( ancestor );
			if ( /^(auto|scroll|overlay)$/.test( css.overflowY ) &&
				ancestor.scrollHeight > ancestor.clientHeight + 1 ) {
				parentScrollElement = ancestor;
				break;
			}
			ancestor = ancestor.parentElement;
		}
	}
	/**
	 * Gutenberg renders the block in an iframe, but its clipping viewport may
	 * be owned by the iframe, the outer editor, or both simultaneously. Measure
	 * the intersection in one coordinate space (parent viewport). In particular,
	 * parentWindow.innerHeight / 2 is NOT the canvas midpoint when the editor
	 * has a top toolbar, bottom metaboxes, or an internally scrolling iframe.
	 */
	const rootViewport = () => {
		if ( canUseParentCoords ) {
			const iframeRect = window.frameElement.getBoundingClientRect();
			let top = Math.max( 0, iframeRect.top );
			let bottom = Math.min( parentWindow.innerHeight, iframeRect.bottom );
			let ancestor = window.frameElement.parentElement;
			while ( ancestor ) {
				try {
					const css = parentWindow.getComputedStyle( ancestor );
					if ( /^(auto|scroll|overlay|hidden|clip)$/.test( css.overflowY ) ) {
						const bounds = ancestor.getBoundingClientRect();
						top = Math.max( top, bounds.top );
						bottom = Math.min( bottom, bounds.bottom );
					}
				} catch ( error ) {
					// Ignore inaccessible ancestor styles, retain iframe bounds.
				}
				ancestor = ancestor.parentElement;
			}
			bottom = Math.max( top, bottom );
			return { top, bottom, middle: ( top + bottom ) / 2 };
		}
		if ( scrollParent === window ) {
			return { top: 0, bottom: window.innerHeight, middle: window.innerHeight / 2 };
		}
		const bounds = scrollParent.getBoundingClientRect();
		return { top: bounds.top, bottom: bounds.bottom, middle: ( bounds.top + bounds.bottom ) / 2 };
	};

	line.style.transform = 'translateX(-50%) scaleY(0)';

	// state
	let rafId = null;
	let running = false;
	let current = 0;
	let lastTarget = -1;
	let resizeTimer = null;

	let items = Array.from(
		wrapper.querySelectorAll( 'li.timeline-item, .timeline-item' )
	).map( ( it ) => ( {
		el: it,
		mark:
			it.querySelector( '.tl-mark' ) ||
			it.querySelector( '.tl-trigger' ) ||
			it,
	} ) );


	// helper: get iframe element rect (in parent coords helper)
	const getIframeElementRect = () => {
		try {
			const fe = window.frameElement;
			if ( ! fe || typeof fe.getBoundingClientRect !== 'function' ) {
				return null;
			}
			return fe.getBoundingClientRect();
		} catch ( e ) {
			return null;
		}
	};

	// convert rect (from el.getBoundingClientRect() in iframe coords) to parent viewport coords
	const rectInParent = ( rect ) => {
		if ( ! canUseParentCoords ) {
			return rect;
		}
		const iframeRect = getIframeElementRect();
		if ( ! iframeRect ) {
			return rect;
		}
		return {
			top: iframeRect.top + rect.top,
			bottom: iframeRect.top + rect.bottom,
			left: iframeRect.left + rect.left,
			right: iframeRect.left + rect.right,
			height: rect.height,
			width: rect.width,
		};
	};

	const EPS_ADD_PX = 6;
	const EPS_REMOVE_PX = 10;

	// update stuck classes — using parent coords when possible
	function updateStuckByLine() {
		if ( ! line || items.length === 0 ) {
			return;
		}

		// read line rect once
		const lineRect = line.getBoundingClientRect();
		let lineBottom = lineRect.top + lineRect.height;
		let iframeOffsetTop = 0;
		if ( canUseParentCoords ) {
			const iframeRect = getIframeElementRect();
			if ( iframeRect ) {
				iframeOffsetTop = iframeRect.top;
				lineBottom += iframeOffsetTop;
			}
		}


		// Marker activation is based on the animated line crossing each marker,
		// NEVER on which block is selected or nearest the editor viewport.
		// loop items, update classes minimaly
		for ( let i = 0; i < items.length; i++ ) {
			const { el: it, mark } = items[ i ];
			const markRect = mark.getBoundingClientRect();
			let markCenter = ( markRect.top + markRect.bottom ) / 2;
			if ( canUseParentCoords ) {
				markCenter += iframeOffsetTop;
			}

			const passed = markCenter <= lineBottom + EPS_ADD_PX;
			const currently = it.classList.contains( 'is-stuck' );

			if ( passed && ! currently ) {
				it.classList.add( 'is-stuck' );
			} else if ( ! passed && currently ) {
				if ( markCenter > lineBottom + EPS_REMOVE_PX ) {
					it.classList.remove( 'is-stuck' );
				}
			}
		}
	}

	// The same geometry and viewport must be used for every scroll context.
	// Once the viewport midpoint has passed an item, progress must remain 1,
	// not reset to zero when the bottom of the Timeline leaves the viewport.
	function getTargetProgress() {


		const rawRect = wrapper.getBoundingClientRect();
		const rect = canUseParentCoords ? rectInParent( rawRect ) : rawRect;
		const root = rootViewport();
		if ( rect.height <= 0 || root.bottom <= root.top || rect.top >= root.bottom ) {
			return 0;
		}
		return Math.max( 0, Math.min( 1, ( root.middle - rect.top ) / rect.height ) );
	}

	// animation frame (smooth lerp)
	function frame() {
		rafId = null;
		const target = getTargetProgress();

		// if no change and current ~ target — finish
		if ( target === lastTarget && Math.abs( current - target ) < 0.0005 ) {
			current = target;
			line.style.transform = `translateX(-50%) scaleY(${ current })`;
			updateStuckByLine();
			running = false;
			return;
		}
		lastTarget = target;

		const LERP = 0.12;
		current += ( target - current ) * LERP;
		if ( Math.abs( current - target ) < 0.001 ) {
			current = target;
		}
		line.style.transform = `translateX(-50%) scaleY(${ current })`;
		updateStuckByLine();

		if ( running ) {
			rafId = requestAnimationFrame( frame );
		} else if ( Math.abs( current - target ) > 0.0005 ) {
			rafId = requestAnimationFrame( frame );
		}
	}

	function startLoop() {
		if ( running ) {
			return;
		}
		running = true;
		lastTarget = -1;
		if ( ! rafId ) {
			rafId = requestAnimationFrame( frame );
		}
	}
	function stopLoop() {
		running = false;
		if ( rafId ) {
			cancelAnimationFrame( rafId );
			rafId = null;
		}
	}

	// debounced stop after resize/scroll activity ends
	function onScrollOrResize() {
		startLoop();
		clearTimeout( resizeTimer );
		resizeTimer = setTimeout( () => stopLoop(), 700 );
	}

	let visObserver = null;
	if ( ! canUseParentCoords && typeof IntersectionObserver !== 'undefined' ) {
	try {
		visObserver = new IntersectionObserver(
			( entries ) => {
				entries.forEach( ( entry ) => {
					if ( entry.target !== wrapper ) {
						return;
					}
					if ( entry.isIntersecting ) {
						startLoop();
					} else {
						stopLoop();
					}
				} );
			},
			{
				root: scrollParent === window ? null : scrollParent,
				threshold: 0,
			}
		);
		visObserver.observe( wrapper );
	} catch ( e ) {
		log( 'visObserver failed', e );
		visObserver = null;
	}
	}

	// In block editor iframes, scroll events are not guaranteed to cross
	// window realms. Poll only the geometry, NOT the animation frames: when
	// position/viewport is unchanged no work is scheduled. This also catches
	// editor reflows caused by adding or selecting a nested Timeline item.
	let geometryWatcher = null;
	if ( isGutenbergCanvas ) {
		let lastGeometry = '';
		const checkGeometry = () => {
			if ( ! wrapper.isConnected ) {
				return;
			}
			const bounds = wrapper.getBoundingClientRect();
			const viewport = rootViewport();
			const iframeBounds = canUseParentCoords ? getIframeElementRect() : null;
			const geometry = [
				bounds.top, bounds.height, viewport.top, viewport.bottom,
				viewport.middle, iframeBounds?.top ?? 0,
			].map( ( value ) => Math.round( value * 2 ) / 2 ).join( ':' );
			if ( geometry !== lastGeometry ) {
				lastGeometry = geometry;
				onScrollOrResize();
			}
		};
		checkGeometry();
		geometryWatcher = window.setInterval( checkGeometry, 100 );
	}

	// Gutenberg's parent editor owns the scroll event. Its classic-script
	// bridge forwards a DOM event into this iframe so listeners run in the
	// correct document, even when cross-realm event callbacks are suspended.
	window.addEventListener( 'za-timeline-editor-scroll', onScrollOrResize );

	// attach listeners (we keep references to handlers for proper removal)
	const parentHandlersAdded = { scroll: false, resize: false };

	try {
		if ( scrollParent === window ) {
			window.addEventListener( 'scroll', onScrollOrResize, {
				passive: true,
			} );
			window.addEventListener( 'resize', onScrollOrResize );

			if ( isInIframe && parentWindow ) {
				// Add listeners to parentWindow — only if accessible
				log( 'Adding scroll/resize listeners to parent window' );
				parentWindow.addEventListener( 'scroll', onScrollOrResize, {
					passive: true, capture: true,
				} );
				parentWindow.addEventListener( 'resize', onScrollOrResize );
				parentHandlersAdded.scroll = true;
				parentHandlersAdded.resize = true;
				if ( parentScrollElement ) {
					parentScrollElement.addEventListener( 'scroll', onScrollOrResize, { passive: true } );
				}
			}
		} else {
			scrollParent.addEventListener( 'scroll', onScrollOrResize, {
				passive: true,
			} );
			window.addEventListener( 'resize', onScrollOrResize );

			if ( isInIframe && parentWindow ) {
				log(
					'Adding scroll/resize listeners to parent window (custom scrollParent case)'
				);
				parentWindow.addEventListener( 'scroll', onScrollOrResize, {
					passive: true, capture: true,
				} );
				parentWindow.addEventListener( 'resize', onScrollOrResize );
				parentHandlersAdded.scroll = true;
				parentHandlersAdded.resize = true;
			}
		}
	} catch ( e ) {
		// fallback to window
		window.addEventListener( 'scroll', onScrollOrResize, {
			passive: true,
		} );
		window.addEventListener( 'resize', onScrollOrResize );
		scrollParent = window;
		log( 'fallback listeners => window', e );
	}

	// mutation observer: update cached triggers/items
	const mo = new MutationObserver( ( mutations ) => {
		let changed = false;
		for ( let i = 0; i < mutations.length; i++ ) {
			const m = mutations[ i ];
			if (
				m.type === 'childList' &&
				( m.addedNodes.length || m.removedNodes.length )
			) {
				changed = true;
				break;
			}
		}
		if ( ! changed ) {
			return;
		}
		items = Array.from(
			wrapper.querySelectorAll( 'li.timeline-item, .timeline-item' )
		).map( ( it ) => ( {
			el: it,
			mark:
				it.querySelector( '.tl-mark' ) ||
				it.querySelector( '.tl-trigger' ) ||
				it,
		} ) );
		updateStuckByLine();
		startLoop();
	} );
	mo.observe( wrapper, { childList: true, subtree: true } );


	// First paint must be calculated even when the editor has already scrolled
	// to the selected block before the Timeline was mounted.
	( function startIfVisible() {
		const rawRect = wrapper.getBoundingClientRect();
		const rect = canUseParentCoords ? rectInParent( rawRect ) : rawRect;
		const root = rootViewport();
		if ( rect.bottom > root.top && rect.top < root.bottom ) {
			startLoop();
		}
	} )();

	// destroy
	function destroy() {
		if ( geometryWatcher !== null ) {
			window.clearInterval( geometryWatcher );
			geometryWatcher = null;
		}
		window.removeEventListener( 'za-timeline-editor-scroll', onScrollOrResize );
		clearTimeout( resizeTimer );
		stopLoop();
		if ( visObserver ) {
			try {
				visObserver.disconnect();
			} catch ( e ) {}
		}
		try {
			mo.disconnect();
		} catch ( e ) {}

		try {
			if ( scrollParent === window ) {
				window.removeEventListener( 'scroll', onScrollOrResize, {
					passive: true,
				} );
				window.removeEventListener( 'resize', onScrollOrResize );

				if ( parentScrollElement ) {
					parentScrollElement.removeEventListener( 'scroll', onScrollOrResize );
				}
				if (
					isInIframe &&
					parentWindow &&
					parentHandlersAdded.scroll
				) {
					log(
						'Removing scroll/resize listeners from parent window'
					);
					try {
						parentWindow.removeEventListener(
							'scroll',
							onScrollOrResize,
							{ capture: true }
						);
					} catch ( e ) {
						parentWindow.removeEventListener(
							'scroll',
							onScrollOrResize
						);
					}
					try {
						parentWindow.removeEventListener(
							'resize',
							onScrollOrResize
						);
					} catch ( e ) {}
				}
			} else {
				scrollParent.removeEventListener( 'scroll', onScrollOrResize, {
					passive: true,
				} );
				window.removeEventListener( 'resize', onScrollOrResize );

				if (
					isInIframe &&
					parentWindow &&
					parentHandlersAdded.scroll
				) {
					log(
						'Removing scroll/resize listeners from parent window (custom scrollParent case)'
					);
					try {
						parentWindow.removeEventListener(
							'scroll',
							onScrollOrResize,
							{ capture: true }
						);
					} catch ( e ) {
						parentWindow.removeEventListener(
							'scroll',
							onScrollOrResize
						);
					}
					try {
						parentWindow.removeEventListener(
							'resize',
							onScrollOrResize
						);
					} catch ( e ) {}
				}
			}
		} catch ( e ) {
			/* ignore */
		}

		items.forEach( ( item ) => item.el.classList.remove( 'is-stuck' ) );

		try {
			delete el.__zaTimelineDestroy;
		} catch ( e ) {
			el.__zaTimelineDestroy = undefined;
		}
	}

	el.__zaTimelineDestroy = destroy;
	return destroy;
}

/**
 * Initialize all not-yet-initialized Timeline wrappers in a document.
 * Used by Classic/Elementor and on frontend Gutenberg. The wrapper guard in
 * initTimelineAnimation prevents duplicate listeners on repeated calls.
 * Gutenberg block editing instead initializes its own React wrapper.
 * @param {Document|Element} doc Root to search within.
 */
export function initAllWidgets( doc = document ) {
	try {
		log( '[ZA animation.js] initAllWidgets called', doc );
		const wrappers = doc.querySelectorAll( '.timeline-wrapper' );
		log( '[ZA animation.js] Found wrappers:', wrappers.length );
		wrappers.forEach( ( wrapper, index ) => {
			log( '[ZA animation.js] Initializing wrapper #' + index, wrapper );
			try {
				const destroy = initTimelineAnimation( wrapper );
				log(
					'[ZA animation.js] Wrapper #' +
						index +
						' initialized, destroy fn:',
					typeof destroy
				);
			} catch ( e ) {
				console.error(
					'[za-timeline] initAllWidgets wrapper init failed',
					e
				);
			}
		} );
	} catch ( e ) {
		console.error( '[za-timeline] initAllWidgets failed', e );
	}
}
