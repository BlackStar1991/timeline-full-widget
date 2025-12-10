/* animation.js — ZA timeline */

const DEBUG = true;
function log(...args) {
	if (!DEBUG) return;
	try {
		console.log('[za-timeline]', ...args);
	} catch (e) {}
}

export function initTimelineAnimation(scopeEl) {
	const el = scopeEl && scopeEl.jquery ? scopeEl[0] : scopeEl;
	if (!el || el.nodeType !== 1) return null;
	if (el.__zaTimelineDestroy) return el.__zaTimelineDestroy;

	// ---- helpers ----
	const findWrapper = (node) => {
		if (!node) return null;
		if (
			node.classList &&
			(node.classList.contains('timeline-wrapper') ||
				node.classList.contains('timeline'))
		)
			return node;
		if (node.querySelector)
			return (
				node.querySelector('.timeline-wrapper') ||
				node.querySelector('.timeline')
			);
		return null;
	};

	const getScrollParent = (node) => {
		if (!node) return window;
		let p = node.parentElement;
		while (p) {
			try {
				const style = window.getComputedStyle(p);
				const y = style.overflowY;
				if (y === 'auto' || y === 'scroll' || y === 'overlay') return p;
			} catch (e) {
				// access denied? skip
			}
			p = p.parentElement;
		}
		return window;
	};

	const wrapper = findWrapper(el);
	if (!wrapper) return null;

	const line =
		wrapper.querySelector('.timeline-line-animation') ||
		(el !== wrapper &&
			el.querySelector &&
			el.querySelector('.timeline-line-animation'));
	if (!line) return null;

	let scrollParent = getScrollParent(wrapper);

	const shouldFallbackToWindow = (rootEl) => {
		if (!rootEl || rootEl === window) return false;
		try {
			const r = rootEl.getBoundingClientRect();
			if (!r || r.height < 2) return true;
			if (rootEl === document.body || rootEl === document.documentElement)
				return true;
		} catch (e) {
			return true;
		}
		return false;
	};
	if (shouldFallbackToWindow(scrollParent)) {
		log(
			'fallback scrollParent => window (detected unsuitable element)',
			scrollParent
		);
		scrollParent = window;
	}

	const isInIframe = window.self !== window.top;
	let parentWindow = null;
	try {
		if (isInIframe) {
			parentWindow = window.parent;
			// пробуем доступ — может выбросить при CORS
			void parentWindow.document;
			log('Inside iframe, parent window is accessible');
		}
	} catch (e) {
		log('Inside iframe, but parent window not accessible (CORS)', e);
		parentWindow = null;
	}

	// can we translate iframe coords to parent viewport coords?
	const canUseParentCoords = !!(
		isInIframe &&
		parentWindow &&
		window.frameElement &&
		typeof window.frameElement.getBoundingClientRect === 'function'
	);

	// init visual state
	line.style.transform = 'scaleY(0)';

	// state
	let rafId = null;
	let running = false;
	let current = 0;
	let lastTarget = -1;
	let resizeTimer = null;

	// cache triggers and items (objects {el, mark})
	let triggers = Array.from(wrapper.querySelectorAll('.tl-trigger'));
	let items = Array.from(
		wrapper.querySelectorAll('li.timeline-item, .timeline-item')
	).map((it) => ({
		el: it,
		mark:
			it.querySelector('.tl-mark') ||
			it.querySelector('.tl-trigger') ||
			it,
	}));

	// Intersection observer for debug/visibility (lightweight)
	let observer = null;
	try {
		const ioOptions = {
			root: scrollParent === window ? null : scrollParent,
			rootMargin: '-40% 0px -40% 0px',
			threshold: 0,
		};
		observer = new IntersectionObserver((entries) => {
			if (!DEBUG) return;
			entries.forEach((entry) => {
				const trg = entry.target;
				const parentBlock =
					trg.closest('li') ||
					trg.closest('.timeline-item') ||
					trg.closest('.wp-block') ||
					trg.closest('.elementor-widget');
				if (!parentBlock) return;
				try {
					console.log('[za-timeline][IO]', {
						isIntersecting: entry.isIntersecting,
						ratio: entry.intersectionRatio,
						triggerRect: trg.getBoundingClientRect(),
						parentBlock,
					});
				} catch (e) {}
			});
		}, ioOptions);
	} catch (e) {
		observer = null;
		log('IO creation failed', e);
	}

	const observeTriggers = () => {
		if (!observer) return;
		for (let i = 0; i < triggers.length; i++) {
			try {
				observer.observe(triggers[i]);
			} catch (e) {}
		}
	};
	const unobserveTriggers = () => {
		if (!observer) return;
		for (let i = 0; i < triggers.length; i++) {
			try {
				observer.unobserve(triggers[i]);
			} catch (e) {}
		}
	};

	// helper: get iframe element rect (in parent coords helper)
	const getIframeElementRect = () => {
		try {
			const fe = window.frameElement;
			if (!fe || typeof fe.getBoundingClientRect !== 'function')
				return null;
			return fe.getBoundingClientRect();
		} catch (e) {
			return null;
		}
	};

	// convert rect (from el.getBoundingClientRect() in iframe coords) to parent viewport coords
	const rectInParent = (rect) => {
		if (!canUseParentCoords) return rect;
		const iframeRect = getIframeElementRect();
		if (!iframeRect) return rect;
		return {
			top: iframeRect.top + rect.top,
			bottom: iframeRect.top + rect.bottom,
			left: iframeRect.left + rect.left,
			right: iframeRect.left + rect.right,
			height: rect.height,
			width: rect.width,
		};
	};

	// root middle: parent window middle when available, otherwise based on scrollParent
	const getRootMiddle = () => {
		if (canUseParentCoords) {
			try {
				return parentWindow.innerHeight / 2;
			} catch (e) {
				/* fallback below */
			}
		}
		if (scrollParent === window) return window.innerHeight / 2;
		try {
			const r = scrollParent.getBoundingClientRect();
			return r.top + r.height / 2;
		} catch (e) {
			return window.innerHeight / 2;
		}
	};

	let currentStuckEl = null;

	const EPS_ADD_PX = 6;
	const EPS_REMOVE_PX = 10;

	// update stuck classes — using parent coords when possible
	function updateStuckByLine() {
		if (!line || items.length === 0) return;

		// read line rect once
		const lineRect = line.getBoundingClientRect();
		let lineBottom = lineRect.top + lineRect.height;
		let iframeOffsetTop = 0;
		if (canUseParentCoords) {
			const iframeRect = getIframeElementRect();
			if (iframeRect) {
				iframeOffsetTop = iframeRect.top;
				lineBottom += iframeOffsetTop;
			}
		}

		const rootMiddle = getRootMiddle();

		// find best (closest to center) — single pass
		let best = null;
		let bestDist = Infinity;
		for (let i = 0; i < items.length; i++) {
			const itemRect = items[i].el.getBoundingClientRect(); // necessary read
			const center =
				(itemRect.top + itemRect.bottom) / 2 +
				(canUseParentCoords ? iframeOffsetTop : 0);
			const d = Math.abs(center - rootMiddle);
			if (d < bestDist) {
				bestDist = d;
				best = items[i].el;
			}
		}

		// loop items, update classes minimaly
		for (let i = 0; i < items.length; i++) {
			const { el: it, mark } = items[i];
			const markRect = mark.getBoundingClientRect();
			let markCenter = (markRect.top + markRect.bottom) / 2;
			if (canUseParentCoords) markCenter += iframeOffsetTop;

			const isCurrent = it === best;
			const passed = markCenter <= lineBottom + EPS_ADD_PX;
			const currently = it.classList.contains('is-stuck');

			if ((passed || isCurrent) && !currently) {
				it.classList.add('is-stuck');
			} else if (!passed && currently) {
				if (markCenter > lineBottom + EPS_REMOVE_PX && !isCurrent) {
					it.classList.remove('is-stuck');
				}
			}
		}
	}

	// progress calc (uses parent coords when possible)
	function getTargetProgress() {
		const rect = wrapper.getBoundingClientRect();
		if (canUseParentCoords) {
			const r = rectInParent(rect);
			const middle = parentWindow.innerHeight / 2;
			if (r.top < middle && r.bottom > 0) {
				return Math.max(0, Math.min(1, (middle - r.top) / r.height));
			}
			return 0;
		}

		if (scrollParent === window) {
			const middle = window.innerHeight / 2;
			if (rect.top < middle && rect.bottom > 0) {
				return Math.max(
					0,
					Math.min(1, (middle - rect.top) / rect.height)
				);
			}
			return 0;
		} else {
			try {
				const rootRect = scrollParent.getBoundingClientRect();
				const rootMiddle = rootRect.top + rootRect.height / 2;
				if (rect.top < rootMiddle && rect.bottom > rootRect.top) {
					return Math.max(
						0,
						Math.min(1, (rootMiddle - rect.top) / rect.height)
					);
				}
			} catch (e) {
				const middle = window.innerHeight / 2;
				if (rect.top < middle && rect.bottom > 0) {
					return Math.max(
						0,
						Math.min(1, (middle - rect.top) / rect.height)
					);
				}
			}
			return 0;
		}
	}

	// animation frame (smooth lerp)
	function frame() {
		rafId = null;
		const target = getTargetProgress();

		// if no change and current ~ target — finish
		if (target === lastTarget && Math.abs(current - target) < 0.0005) {
			current = target;
			line.style.transform = `scaleY(${current})`;
			updateStuckByLine();
			running = false;
			return;
		}
		lastTarget = target;

		const LERP = 0.12;
		current += (target - current) * LERP;
		if (Math.abs(current - target) < 0.001) current = target;
		line.style.transform = `scaleY(${current})`;

		updateStuckByLine();

		if (running) rafId = requestAnimationFrame(frame);
		else if (Math.abs(current - target) > 0.0005)
			rafId = requestAnimationFrame(frame);
	}

	function startLoop() {
		if (running) return;
		running = true;
		lastTarget = -1;
		if (!rafId) rafId = requestAnimationFrame(frame);
	}
	function stopLoop() {
		running = false;
		if (rafId) {
			cancelAnimationFrame(rafId);
			rafId = null;
		}
	}

	// debounced stop after resize/scroll activity ends
	function onScrollOrResize() {
		startLoop();
		clearTimeout(resizeTimer);
		resizeTimer = setTimeout(() => stopLoop(), 700);
	}

	// observe triggers + visibility
	if (triggers.length) observeTriggers();

	let visObserver = null;
	try {
		visObserver = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.target !== wrapper) return;
					if (entry.isIntersecting) startLoop();
					else stopLoop();
				});
			},
			{
				root: scrollParent === window ? null : scrollParent,
				threshold: 0,
			}
		);
		visObserver.observe(wrapper);
	} catch (e) {
		log('visObserver failed', e);
		visObserver = null;
	}

	// attach listeners (we keep references to handlers for proper removal)
	const parentHandlersAdded = { scroll: false, resize: false };

	try {
		if (scrollParent === window) {
			window.addEventListener('scroll', onScrollOrResize, {
				passive: true,
			});
			window.addEventListener('resize', onScrollOrResize);

			if (isInIframe && parentWindow) {
				// Add listeners to parentWindow — only if accessible
				log('Adding scroll/resize listeners to parent window');
				parentWindow.addEventListener('scroll', onScrollOrResize, {
					passive: true,
				});
				parentWindow.addEventListener('resize', onScrollOrResize);
				parentHandlersAdded.scroll = true;
				parentHandlersAdded.resize = true;
			}
		} else {
			scrollParent.addEventListener('scroll', onScrollOrResize, {
				passive: true,
			});
			window.addEventListener('resize', onScrollOrResize);

			if (isInIframe && parentWindow) {
				log(
					'Adding scroll/resize listeners to parent window (custom scrollParent case)'
				);
				parentWindow.addEventListener('scroll', onScrollOrResize, {
					passive: true,
				});
				parentWindow.addEventListener('resize', onScrollOrResize);
				parentHandlersAdded.scroll = true;
				parentHandlersAdded.resize = true;
			}
		}
	} catch (e) {
		// fallback to window
		window.addEventListener('scroll', onScrollOrResize, { passive: true });
		window.addEventListener('resize', onScrollOrResize);
		scrollParent = window;
		log('fallback listeners => window', e);
	}

	// mutation observer: update cached triggers/items
	const mo = new MutationObserver((mutations) => {
		let changed = false;
		for (let i = 0; i < mutations.length; i++) {
			const m = mutations[i];
			if (
				m.type === 'childList' &&
				(m.addedNodes.length || m.removedNodes.length)
			) {
				changed = true;
				break;
			}
		}
		if (!changed) return;
		unobserveTriggers();
		triggers = Array.from(wrapper.querySelectorAll('.tl-trigger'));
		items = Array.from(
			wrapper.querySelectorAll('li.timeline-item, .timeline-item')
		).map((it) => ({
			el: it,
			mark:
				it.querySelector('.tl-mark') ||
				it.querySelector('.tl-trigger') ||
				it,
		}));
		if (triggers.length) observeTriggers();
		updateStuckByLine();
		startLoop();
	});
	mo.observe(wrapper, { childList: true, subtree: true });

	console.debug('[ZA] animation.js initTimelineAnimation executed', {
		inIframe: isInIframe,
		canUseParentCoords,
	});

	// initial start if visible (use parent coords when available)
	(function startIfVisible() {
		const rect = wrapper.getBoundingClientRect();
		if (canUseParentCoords) {
			const r = rectInParent(rect);
			const inViewport =
				r.bottom > 0 &&
				r.top <
					(parentWindow.innerHeight ||
						parentWindow.document.documentElement.clientHeight);
			if (inViewport) {
				updateStuckByLine();
				startLoop();
			}
			return;
		}
		const inViewport =
			rect.bottom > 0 &&
			rect.top <
				(window.innerHeight || document.documentElement.clientHeight);
		if (inViewport) {
			updateStuckByLine();
			startLoop();
		}
	})();

	// destroy
	function destroy() {
		stopLoop();
		if (observer)
			try {
				observer.disconnect();
			} catch (e) {}
		if (visObserver)
			try {
				visObserver.disconnect();
			} catch (e) {}
		try {
			mo.disconnect();
		} catch (e) {}

		try {
			if (scrollParent === window) {
				window.removeEventListener('scroll', onScrollOrResize, {
					passive: true,
				});
				window.removeEventListener('resize', onScrollOrResize);

				if (isInIframe && parentWindow && parentHandlersAdded.scroll) {
					log('Removing scroll/resize listeners from parent window');
					try {
						parentWindow.removeEventListener(
							'scroll',
							onScrollOrResize,
							{ passive: true }
						);
					} catch (e) {
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
					} catch (e) {}
				}
			} else {
				scrollParent.removeEventListener('scroll', onScrollOrResize, {
					passive: true,
				});
				window.removeEventListener('resize', onScrollOrResize);

				if (isInIframe && parentWindow && parentHandlersAdded.scroll) {
					log(
						'Removing scroll/resize listeners from parent window (custom scrollParent case)'
					);
					try {
						parentWindow.removeEventListener(
							'scroll',
							onScrollOrResize,
							{ passive: true }
						);
					} catch (e) {
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
					} catch (e) {}
				}
			}
		} catch (e) {
			/* ignore */
		}

		// remove stuck class if present
		try {
			if (currentStuckEl) currentStuckEl.classList.remove('is-stuck');
		} catch (e) {}
		try {
			delete el.__zaTimelineDestroy;
		} catch (e) {
			el.__zaTimelineDestroy = undefined;
		}
		log('destroyed timeline instance');
	}

	el.__zaTimelineDestroy = destroy;
	return destroy;
}

/**
 * Initialize all timeline widgets in a document
 */
export function initAllWidgets(doc = document) {
	try {
		log('[ZA animation.js] initAllWidgets called', doc);
		const wrappers = doc.querySelectorAll('.timeline-wrapper');
		log('[ZA animation.js] Found wrappers:', wrappers.length);
		wrappers.forEach((wrapper, index) => {
			log('[ZA animation.js] Initializing wrapper #' + index, wrapper);
			try {
				const destroy = initTimelineAnimation(wrapper);
				log(
					'[ZA animation.js] Wrapper #' +
						index +
						' initialized, destroy fn:',
					typeof destroy
				);
			} catch (e) {
				console.error(
					'[za-timeline] initAllWidgets wrapper init failed',
					e
				);
			}
		});
	} catch (e) {
		console.error('[za-timeline] initAllWidgets failed', e);
	}
}
