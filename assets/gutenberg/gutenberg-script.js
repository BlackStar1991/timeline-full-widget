function isElement( node ) {
	return node && node.nodeType === 1;
}

function findWrapper( el ) {
	if ( ! el ) return null;
	if (
		el.classList &&
		( el.classList.contains( 'timeline-wrapper' ) ||
			el.classList.contains( 'timeline' ) )
	) {
		return el;
	}
	if ( el.querySelector ) {
		return (
			el.querySelector( '.timeline-wrapper' ) ||
			el.querySelector( '.timeline' )
		);
	}
	return null;
}

function getScrollParent( node ) {
	if ( ! node ) return window;
	let parent = node.parentElement;
	while ( parent ) {
		const style = window.getComputedStyle( parent );
		const overflowY = style.overflowY;
		if (
			overflowY === 'auto' ||
			overflowY === 'scroll' ||
			overflowY === 'overlay'
		) {
			return parent;
		}
		parent = parent.parentElement;
	}
	return window;
}

export function initTimelineAnimation( scopeEl ) {
	const el = scopeEl && scopeEl.jquery ? scopeEl[ 0 ] : scopeEl;
	if ( ! isElement( el ) ) {
		console.warn( 'initTimelineAnimation: no element provided' );
		return;
	}

	const wrapper = findWrapper( el );
	if ( ! wrapper ) {
		return;
	}

	const line =
		wrapper.querySelector( '.timeline-line-animation' ) ||
		( el !== wrapper &&
			el.querySelector &&
			el.querySelector( '.timeline-line-animation' ) );
	if ( ! line ) {
		return;
	}
	const scrollParent = getScrollParent( wrapper );

	let rafId = null;
	let currentHeight = 0;
	let scheduled = false;

	let triggers = Array.from( wrapper.querySelectorAll( '.tl-trigger' ) );

	const ioOptions = {
		root: scrollParent === window ? null : scrollParent,
		threshold: [ 0, 0.25, 0.5, 0.75, 1 ],
	};

	const ioCallback = ( entries ) => {
		entries.forEach( ( entry ) => {
			const trigger = entry.target;
			const parentBlock =
				trigger.closest( 'li' ) ||
				trigger.closest( '.timeline-item' ) ||
				trigger.closest( '.wp-block' );
			if ( ! parentBlock ) return;
			parentBlock.classList.toggle( 'is-stuck', entry.isIntersecting );
		} );
	};

	const observer = new IntersectionObserver( ioCallback, ioOptions );

	const observeAllTriggers = () => {
		triggers.forEach( ( t ) => observer.observe( t ) );
	};

	const unobserveAllTriggers = () => {
		triggers.forEach( ( t ) => {
			try {
				observer.unobserve( t );
			} catch ( e ) {}
		} );
	};

	function getTargetHeight() {
		const rect = wrapper.getBoundingClientRect();

		if ( scrollParent === window ) {
			const middle = window.innerHeight / 2;
			if ( rect.top < middle && rect.bottom > 0 ) {
				const progress = Math.min(
					1,
					( middle - rect.top ) / rect.height
				);
				return rect.height * progress;
			}
			return 0;
		} else {
			const rootRect = scrollParent.getBoundingClientRect();
			const rootMiddle = rootRect.top + rootRect.height / 2;
			if ( rect.top < rootMiddle && rect.bottom > rootRect.top ) {
				const progress = Math.min(
					1,
					( rootMiddle - rect.top ) / rect.height
				);
				return rect.height * progress;
			}
			return 0;
		}
	}

	function animate() {
		scheduled = false;
		const targetHeight = getTargetHeight();
		currentHeight += ( targetHeight - currentHeight ) * 0.1;
		if ( Math.abs( currentHeight - targetHeight ) < 0.5 )
			currentHeight = targetHeight;
		line.style.height = `${ currentHeight }px`;
		rafId = requestAnimationFrame( animate );
	}

	function scheduleAnimate() {
		if ( scheduled ) return;
		scheduled = true;
		if ( ! rafId ) {
			rafId = requestAnimationFrame( animate );
		}
	}

	function onScrollOrResize() {
		scheduleAnimate();
	}

	if ( triggers.length > 0 ) {
		observeAllTriggers();
	} else {
		// nothing to observe
	}

	if ( scrollParent === window ) {
		window.addEventListener( 'scroll', onScrollOrResize, {
			passive: true,
		} );
		window.addEventListener( 'resize', onScrollOrResize );
	} else {
		scrollParent.addEventListener( 'scroll', onScrollOrResize, {
			passive: true,
		} );
		window.addEventListener( 'resize', onScrollOrResize );
	}

	const mo = new MutationObserver( ( mutations ) => {
		let changed = false;
		for ( const m of mutations ) {
			if (
				m.type === 'childList' &&
				( m.addedNodes.length || m.removedNodes.length )
			) {
				changed = true;
				break;
			}
		}
		if ( ! changed ) return;
		try {
			unobserveAllTriggers();
		} catch ( e ) {}
		triggers = Array.from( wrapper.querySelectorAll( '.tl-trigger' ) );
		if ( triggers.length > 0 ) {
			observeAllTriggers();
			scheduleAnimate();
		}
	} );

	mo.observe( wrapper, { childList: true, subtree: true } );
	scheduleAnimate();

	// Return destroy function
	return function destroy() {
		// stop RAF
		if ( rafId ) {
			cancelAnimationFrame( rafId );
			rafId = null;
		}
		// disconnect IO
		try {
			observer.disconnect();
		} catch ( e ) {}
		// disconnect mutation observer
		try {
			mo.disconnect();
		} catch ( e ) {}
		// remove listeners
		try {
			if ( scrollParent === window ) {
				window.removeEventListener( 'scroll', onScrollOrResize, {
					passive: true,
				} );
				window.removeEventListener( 'resize', onScrollOrResize );
			} else {
				scrollParent.removeEventListener( 'scroll', onScrollOrResize, {
					passive: true,
				} );
				window.removeEventListener( 'resize', onScrollOrResize );
			}
		} catch ( e ) {}
		// NOTE: we intentionally DO NOT remove `is-stuck` classes here.
		// In Gutenberg editor the block may re-render frequently — removing classes
		// on destroy causes flicker. Leave classes for stable visual state.
	};
}

export function initAllWidgets( root = document ) {
	const widgets = Array.from(
		root.querySelectorAll(
			'.wp-block-za-timeline-full-widget, .timeline-wrapper, .timeline'
		)
	);
	const destroyers = [];

	widgets.forEach( ( el ) => {
		try {
			const d = initTimelineAnimation( el );
			if ( typeof d === 'function' ) destroyers.push( d );
		} catch ( err ) {
			console.error( 'initTimelineAnimation error for element', el, err );
		}
	} );

	return function destroyAll() {
		destroyers.forEach( ( d ) => {
			try {
				d && d();
			} catch ( e ) {}
		} );
	};
}

// Auto-init on DOMContentLoaded for non-module direct inclusion
if ( typeof window !== 'undefined' ) {
	// expose on window for legacy usage
	if ( ! window.zaTimeline ) window.zaTimeline = {};
	window.zaTimeline.initTimelineAnimation = initTimelineAnimation;
	window.zaTimeline.initAllWidgets = initAllWidgets;

	// auto-run on load
	document.addEventListener( 'DOMContentLoaded', () => {
		try {
			initAllWidgets( document );
		} catch ( e ) {
			/* ignore */
		}
	} );
}
