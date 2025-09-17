// adapters/elementor-adapter.js
import { initTimelineAnimation, initAllWidgets } from '../core/animation.js';

/**
 * Elementor adapter (module).
 * - Works in three contexts:
 *   1) Running inside preview iframe (Elementor editor preview) => initInsideIframe()
 *   2) Running in parent editor window => try to inject adapter into preview iframe
 *   3) Running on frontend (non-editor) => initAllWidgets(document) + listen to elementorFrontend hooks
 *
 * Notes:
 * - adapter must be registered/enqueued with type="module"
 * - animation core exposes initTimelineAnimation and initAllWidgets
 */

const DEBUG = false;
const adapterUrl =
	typeof import.meta !== 'undefined' && import.meta.url
		? import.meta.url
		: ( document.currentScript && document.currentScript.src ) || null;

// selectors to find preview iframe (try several variations)
const IFRAME_SELECTORS = [
	'iframe[name="elementor-preview-iframe"]',
	'iframe#elementor-preview-iframe',
	'iframe.elementor-editor__preview',
	'iframe.elementor-preview-iframe',
	'.elementor-editor-active iframe', // fallback
	'iframe',
];

// Keep track of injected/processed iframes to avoid duplicates
const injectedIframes = new WeakSet();

function log( ...args ) {
	if ( DEBUG ) console.log( 'za-timeline:', ...args );
}

function queryFirst( selectors, root = document ) {
	for ( const sel of selectors ) {
		try {
			const el = root.querySelector( sel );
			if ( el ) return el;
		} catch ( e ) {}
	}
	return null;
}

function isEditorParentWindow() {
	return !! (
		window.elementorFrontend &&
		window.elementorFrontend.isEditMode &&
		window.elementorFrontend.isEditMode()
	);
}

/**
 * Wait until iframe.contentDocument is accessible and ready (interactive/complete).
 * Resolves with iframe or rejects on timeout.
 */
function waitForIframeReady( iframe, timeout = 4000 ) {
	return new Promise( ( resolve, reject ) => {
		if ( ! iframe ) return reject( new Error( 'no iframe' ) );
		try {
			const tryResolve = () => {
				const doc = iframe.contentDocument;
				if (
					doc &&
					( doc.readyState === 'interactive' ||
						doc.readyState === 'complete' )
				) {
					resolve( iframe );
					return true;
				}
				return false;
			};

			if ( tryResolve() ) return;

			const onLoad = () => {
				cleanup();
				resolve( iframe );
			};
			const onError = ( e ) => {
				cleanup();
				reject( e || new Error( 'iframe load error' ) );
			};

			const cleanup = () => {
				try {
					iframe.removeEventListener( 'load', onLoad );
				} catch ( e ) {}
				try {
					iframe.removeEventListener( 'error', onError );
				} catch ( e ) {}
				if ( timer ) clearTimeout( timer );
			};

			iframe.addEventListener( 'load', onLoad, { passive: true } );
			iframe.addEventListener( 'error', onError, { passive: true } );

			const timer = setTimeout( () => {
				if ( tryResolve() ) resolve( iframe );
				else {
					cleanup();
					reject( new Error( 'iframe ready timeout' ) );
				}
			}, timeout );
		} catch ( e ) {
			reject( e );
		}
	} );
}

/**
 * Ensure iframe is same-origin and contentDocument accessible.
 */
function safeIframeContext( iframe ) {
	try {
		const win = iframe.contentWindow;
		const doc = iframe.contentDocument;
		if ( ! win || ! doc ) return null;
		return { win, doc };
	} catch ( e ) {
		return null;
	}
}

/**
 * Inject this adapter module into target iframe (so it runs in iframe context).
 * Returns true if injected or already present, false on failure (cross-origin, error).
 */
async function injectAdapterIntoIframe( iframe ) {
	if ( ! iframe || ! adapterUrl ) return false;
	if ( injectedIframes.has( iframe ) ) {
		log( 'already injected for iframe' );
		return true;
	}

	const ctx = safeIframeContext( iframe );
	if ( ! ctx ) {
		log( 'cannot access iframe (cross-origin?)' );
		return false;
	}

	try {
		// Wait for iframe ready (best-effort)
		await waitForIframeReady( iframe ).catch( () => null );

		const { doc } = ctx;

		// Avoid duplicates: check module scripts with same src
		const existing = Array.from(
			doc.querySelectorAll( 'script[type="module"][src]' )
		).some( ( s ) => {
			const src = s.getAttribute( 'src' ) || s.src;
			return src === adapterUrl;
		} );
		if ( existing ) {
			injectedIframes.add( iframe );
			log( 'adapter already present in iframe' );
			return true;
		}

		const s = doc.createElement( 'script' );
		s.type = 'module';
		s.src = adapterUrl;
		s.async = true;

		// handle load/error to flip flag if necessary
		const onError = () => {
			injectedIframes.delete( iframe );
			log( 'adapter injection error' );
		};
		s.addEventListener( 'error', onError, { once: true } );

		( doc.head || doc.documentElement ).appendChild( s );
		injectedIframes.add( iframe );
		log( 'injected adapter into iframe' );
		return true;
	} catch ( e ) {
		log( 'injectAdapterIntoIframe failed', e );
		return false;
	}
}

/**
 * Called inside preview iframe (editor) — initialize widgets inside this iframe document,
 * hook elementorFrontend inside iframe and observe dynamic changes.
 */
function initInsideIframe() {
	try {
		initAllWidgets( document );
		log( 'initAllWidgets in iframe' );
	} catch ( e ) {
		if ( DEBUG ) console.error( 'initAllWidgets inside iframe failed', e );
	}

	// Hook elementorFrontend inside iframe (Elementor preview uses elementorFrontend inside iframe)
	try {
		if (
			typeof window.elementorFrontend !== 'undefined' &&
			window.elementorFrontend.hooks
		) {
			window.elementorFrontend.hooks.addAction(
				'frontend/element_ready/za-timeline.default',
				( scope ) => {
					try {
						const el = scope && scope.jquery ? scope[ 0 ] : scope;
						if ( el ) initTimelineAnimation( el );
						else initAllWidgets( document );
					} catch ( e ) {
						if ( DEBUG )
							console.error( 'hook init error inside iframe', e );
					}
				}
			);
			log( 'hooked elementorFrontend inside iframe' );
		}
	} catch ( e ) {
		if ( DEBUG )
			console.warn(
				'could not attach elementorFrontend hook inside iframe',
				e
			);
	}

	// MutationObserver to re-run initAllWidgets on dynamic DOM changes (debounced)
	try {
		let t = null;
		const debounced = () => {
			if ( t ) clearTimeout( t );
			t = setTimeout( () => {
				try {
					initAllWidgets( document );
				} catch ( e ) {
					if ( DEBUG ) console.error( e );
				}
				t = null;
			}, 80 );
		};
		const mo = new MutationObserver( debounced );
		mo.observe( document.body || document.documentElement, {
			childList: true,
			subtree: true,
		} );
		// store for debugging/cleanup
		window.__zaTimelineMO = mo;
		log( 'installed MutationObserver inside iframe' );
	} catch ( e ) {
		if ( DEBUG )
			console.warn(
				'could not install MutationObserver inside iframe',
				e
			);
	}
}

/**
 * When running in parent editor window: try to find preview iframe and inject adapter.
 * Observes DOM for iframe addition; falls back to polling if MutationObserver not available.
 */
function initParentEditorInjection() {
	if ( ! isEditorParentWindow() ) {
		return;
	}

	// try inject once
	const tryInjectOnce = async () => {
		const iframe = queryFirst( IFRAME_SELECTORS, document );
		if ( ! iframe ) return false;
		const ok = await injectAdapterIntoIframe( iframe );
		return ok;
	};

	// immediate attempt
	tryInjectOnce();

	// MutationObserver: watch for iframes insertion
	try {
		const mo = new MutationObserver( async ( mutations, observer ) => {
			const ok = await tryInjectOnce();
			if ( ok ) {
				observer.disconnect();
			}
		} );
		mo.observe( document.body, { childList: true, subtree: true } );
	} catch ( e ) {
		// fallback polling
		let tries = 0;
		const maxTries = 20;
		const interval = setInterval( async () => {
			tries++;
			const iframe = queryFirst( IFRAME_SELECTORS, document );
			if ( iframe ) {
				await injectAdapterIntoIframe( iframe );
				clearInterval( interval );
			} else if ( tries > maxTries ) {
				clearInterval( interval );
			}
		}, 250 );
	}
}

/**
 * If running in parent (non-iframe) window:
 * - initialize all widgets on this document (frontend)
 * - attach elementorFrontend hook so dynamic rendering triggers animation init
 * - if in editor parent, attempt to inject into preview iframe
 */
function initParentContext() {
	// if in editor parent, try injection to iframe (so preview runs adapter)
	initParentEditorInjection();

	// initialize widgets on this (parent) document (front-end or editor parent)
	try {
		initAllWidgets( document );
	} catch ( e ) {
		if ( DEBUG ) console.error( 'initAllWidgets parent failed', e );
	}

	// subscribe to elementorFrontend hooks for dynamic widget rendering on frontend
	try {
		if (
			typeof window.elementorFrontend !== 'undefined' &&
			window.elementorFrontend.hooks
		) {
			window.elementorFrontend.hooks.addAction(
				'frontend/element_ready/za-timeline.default',
				( scope ) => {
					try {
						const el = scope && scope.jquery ? scope[ 0 ] : scope;
						if ( el ) initTimelineAnimation( el );
						else initAllWidgets( document );
					} catch ( e ) {
						if ( DEBUG )
							console.error(
								'elementor hook error in parent',
								e
							);
					}
				}
			);
			log( 'hooked elementorFrontend on parent' );
		}
	} catch ( e ) {
		if ( DEBUG )
			console.warn(
				'could not attach elementorFrontend hook on parent',
				e
			);
	}
}

/* ---------------------- Entry ---------------------- */

const runningInIframe = window.self !== window.top;

if ( runningInIframe ) {
	// code runs inside iframe: initialize inside preview
	initInsideIframe();
} else {
	// parent context: frontend or editor parent window
	initParentContext();
}

// exports (debug/programmatic)
export { initInsideIframe, injectAdapterIntoIframe };
export default null;
