// assets/js/core/animation.js
// Core animation logic — platform-agnostic
export function initTimelineAnimation( scopeEl ) {
	const el = scopeEl && scopeEl.jquery ? scopeEl[ 0 ] : scopeEl;
	if ( ! el || el.nodeType !== 1 ) return null;

	// Prevent double-init
	if ( el.__zaTimelineDestroy ) return el.__zaTimelineDestroy;

	// find wrapper
	function findWrapper( node ) {
		if ( ! node ) return null;
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
	}
	const wrapper = findWrapper( el );
	if ( ! wrapper ) return null;

	// find line
	const line =
		wrapper.querySelector( '.timeline-line-animation' ) ||
		( el !== wrapper &&
			el.querySelector &&
			el.querySelector( '.timeline-line-animation' ) );
	if ( ! line ) return null;

	// get scroll parent
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
	const scrollParent = getScrollParent( wrapper );

	// prepare line for GPU transforms
	line.style.transformOrigin = 'top';
	line.style.willChange = 'transform';
	line.style.transform = 'scaleY(0)';

	// state
	let rafId = null;
	let running = false;
	let current = 0; // 0..1
	let lastTarget = -1;
	let resizeTimer = null;

	// triggers for is-stuck classes
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
				trigger.closest( '.wp-block' ) ||
				trigger.closest( '.elementor-widget' );
			if ( ! parentBlock ) return;
			parentBlock.classList.toggle( 'is-stuck', entry.isIntersecting );
		} );
	};
	const observer = new IntersectionObserver( ioCallback, ioOptions );
	const observeAllTriggers = () =>
		triggers.forEach( ( t ) => observer.observe( t ) );
	const unobserveAllTriggers = () =>
		triggers.forEach( ( t ) => {
			try {
				observer.unobserve( t );
			} catch ( e ) {}
		} );

	// compute progress (0..1)
	function getTargetProgress() {
		const rect = wrapper.getBoundingClientRect();
		if ( scrollParent === window ) {
			const middle = window.innerHeight / 2;
			if ( rect.top < middle && rect.bottom > 0 ) {
				const progress = Math.min(
					1,
					( middle - rect.top ) / rect.height
				);
				return Math.max( 0, progress );
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
				return Math.max( 0, progress );
			}
			return 0;
		}
	}

	// animate frame
	function frame() {
		rafId = null;
		const target = getTargetProgress();
		if ( target === lastTarget && Math.abs( current - target ) < 0.0005 ) {
			current = target;
			line.style.transform = `scaleY(${ current })`;
			running = false;
			return;
		}
		lastTarget = target;

		const LERP = 0.12; // tweak for feel (0.08..0.16)
		current += ( target - current ) * LERP;

		if ( Math.abs( current - target ) < 0.001 ) current = target;
		line.style.transform = `scaleY(${ current })`;

		if ( running ) {
			rafId = requestAnimationFrame( frame );
		} else {
			if ( Math.abs( current - target ) > 0.0005 ) {
				rafId = requestAnimationFrame( frame );
			}
		}
	}

	function startLoop() {
		if ( running ) return;
		running = true;
		lastTarget = -1;
		if ( ! rafId ) rafId = requestAnimationFrame( frame );
	}

	function stopLoop() {
		running = false;
		if ( rafId ) {
			cancelAnimationFrame( rafId );
			rafId = null;
		}
	}

	function onScrollOrResize() {
		startLoop();
		clearTimeout( resizeTimer );
		resizeTimer = setTimeout( () => {
			stopLoop();
		}, 700 );
	}

	// observe triggers and visibility
	if ( triggers.length ) observeAllTriggers();

	const visObserver = new IntersectionObserver(
		( entries ) => {
			entries.forEach( ( entry ) => {
				if ( entry.target !== wrapper ) return;
				if ( entry.isIntersecting ) startLoop();
				else stopLoop();
			} );
		},
		{ root: scrollParent === window ? null : scrollParent, threshold: 0 }
	);
	try {
		visObserver.observe( wrapper );
	} catch ( e ) {}

	// attach listeners
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

	// MutationObserver for dynamic content
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
		if ( triggers.length ) observeAllTriggers();
		startLoop();
	} );
	mo.observe( wrapper, { childList: true, subtree: true } );

	// start if visible initially
	( function startIfVisible() {
		const rect = wrapper.getBoundingClientRect();
		const inViewport =
			rect.bottom > 0 &&
			rect.top <
				( window.innerHeight || document.documentElement.clientHeight );
		if ( inViewport ) startLoop();
	} )();

	// destroy
	function destroy() {
		stopLoop();
		try {
			observer.disconnect();
		} catch ( e ) {}
		try {
			mo.disconnect();
		} catch ( e ) {}
		try {
			visObserver.disconnect();
		} catch ( e ) {}
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
		try {
			delete el.__zaTimelineDestroy;
		} catch ( e ) {
			el.__zaTimelineDestroy = undefined;
		}
	}

	// expose destroy for this el
	el.__zaTimelineDestroy = destroy;
	return destroy;
}

// init all on root
export function initAllWidgets( root = document ) {
	const widgets = Array.from(
		root.querySelectorAll(
			'.wp-block-za-timeline-full-widget, .timeline-wrapper, .timeline'
		)
	);
	const destroyers = widgets
		.map( ( el ) => {
			try {
				return initTimelineAnimation( el );
			} catch ( e ) {
				console.error( 'initTimelineAnimation error', e );
				return null;
			}
		} )
		.filter( Boolean );

	return function destroyAll() {
		destroyers.forEach( ( d ) => {
			try {
				d && d();
			} catch ( e ) {}
		} );
	};
}

// Auto-expose on window for legacy usage
if ( typeof window !== 'undefined' ) {
	if ( ! window.zaTimeline ) window.zaTimeline = {};
	window.zaTimeline.initTimelineAnimation = initTimelineAnimation;
	window.zaTimeline.initAllWidgets = initAllWidgets;
}
