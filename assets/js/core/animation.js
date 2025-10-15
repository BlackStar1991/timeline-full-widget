const DEBUG = false;
function log(...args) {
    if (!DEBUG) return;
    try { console.log('[za-timeline]', ...args); } catch (e) {}
}

export function initTimelineAnimation(scopeEl) {
    const el = scopeEl && scopeEl.jquery ? scopeEl[0] : scopeEl;
    if (!el || el.nodeType !== 1) return null;
    if (el.__zaTimelineDestroy) return el.__zaTimelineDestroy;

    // ---- helpers ----
    const findWrapper = (node) => {
        if (!node) return null;
        if (node.classList && (node.classList.contains('timeline-wrapper') || node.classList.contains('timeline'))) return node;
        if (node.querySelector) return node.querySelector('.timeline-wrapper') || node.querySelector('.timeline');
        return null;
    };

    const getScrollParent = (node) => {
        if (!node) return window;
        let p = node.parentElement;
        while (p) {
            const style = window.getComputedStyle(p);
            const y = style.overflowY;
            if (y === 'auto' || y === 'scroll' || y === 'overlay') return p;
            p = p.parentElement;
        }
        return window;
    };

    const wrapper = findWrapper(el);
    if (!wrapper) return null;

    const line = wrapper.querySelector('.timeline-line-animation') || (el !== wrapper && el.querySelector && el.querySelector('.timeline-line-animation'));
    if (!line) return null;

    let scrollParent = getScrollParent(wrapper);

    const shouldFallbackToWindow = (rootEl) => {
        if (!rootEl || rootEl === window) return false;
        try {
            const r = rootEl.getBoundingClientRect();
            if (!r || r.height < 2) return true;
            if (rootEl === document.body || rootEl === document.documentElement) return true;
        } catch (e) { return true; }
        return false;
    };
    if (shouldFallbackToWindow(scrollParent)) {
        log('fallback scrollParent => window (detected unsuitable element)', scrollParent);
        scrollParent = window;
    }

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
    let items = Array.from(wrapper.querySelectorAll('li.timeline-item, .timeline-item'))
        .map((it) => {
            return {
                el: it,
                mark: it.querySelector('.tl-mark') || it.querySelector('.tl-trigger') || it
            };
        });

    // Intersection observer for debug/visibility (kept but lightweight)
    let observer = null;
    try {
        const ioOptions = { root: scrollParent === window ? null : scrollParent, rootMargin: '-40% 0px -40% 0px', threshold: 0 };
        observer = new IntersectionObserver((entries) => {
            if (!DEBUG) return;
            entries.forEach((entry) => {
                const trg = entry.target;
                const parentBlock = trg.closest('li') || trg.closest('.timeline-item') || trg.closest('.wp-block') || trg.closest('.elementor-widget');
                if (!parentBlock) return;
                try {
                    console.log('[za-timeline][IO]', { isIntersecting: entry.isIntersecting, ratio: entry.intersectionRatio, triggerRect: trg.getBoundingClientRect(), parentBlock });
                } catch (e) {}
            });
        }, ioOptions);
    } catch (e) {
        observer = null;
        log('IO creation failed', e);
    }

    const observeTriggers = () => { if (!observer) return; for (let i = 0; i < triggers.length; i++) { try { observer.observe(triggers[i]); } catch (e) {} } };
    const unobserveTriggers = () => { if (!observer) return; for (let i = 0; i < triggers.length; i++) { try { observer.unobserve(triggers[i]); } catch (e) {} } };

    // helper root middle
    const getRootMiddle = () => {
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

    function updateStuckByLine() {
        if (!line || items.length === 0) return;

        const lineRect = line.getBoundingClientRect();
        const lineBottom = lineRect.top + lineRect.height;
        const rootMiddle = getRootMiddle();

        // find best (closest to center) once per frame
        let best = null;
        let bestDist = Infinity;
        for (let i = 0; i < items.length; i++) {
            const r = items[i].el.getBoundingClientRect();
            const center = (r.top + r.bottom) / 2;
            const d = Math.abs(center - rootMiddle);
            if (d < bestDist) { bestDist = d; best = items[i].el; }
        }

        // loop items, add/remove class only when needed
        for (let i = 0; i < items.length; i++) {
            const { el: it, mark } = items[i];
            const markRect = mark.getBoundingClientRect();
            const markCenter = (markRect.top + markRect.bottom) / 2;
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

        if (best !== currentStuckEl) {
            currentStuckEl = best;
            if (DEBUG) console.log('[za-timeline][STUCK] best updated', { currentStuckEl, bestDist, lineBottom });
        }
    }

    // progress calc (kept identical)
    function getTargetProgress() {
        const rect = wrapper.getBoundingClientRect();
        if (scrollParent === window) {
            const middle = window.innerHeight / 2;
            if (rect.top < middle && rect.bottom > 0) {
                return Math.max(0, Math.min(1, (middle - rect.top) / rect.height));
            }
            return 0;
        } else {
            try {
                const rootRect = scrollParent.getBoundingClientRect();
                const rootMiddle = rootRect.top + rootRect.height / 2;
                if (rect.top < rootMiddle && rect.bottom > rootRect.top) {
                    return Math.max(0, Math.min(1, (rootMiddle - rect.top) / rect.height));
                }
            } catch (e) {
                const middle = window.innerHeight / 2;
                if (rect.top < middle && rect.bottom > 0) {
                    return Math.max(0, Math.min(1, (middle - rect.top) / rect.height));
                }
            }
            return 0;
        }
    }

    // animation frame
    function frame() {
        rafId = null;
        const target = getTargetProgress();

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
        else if (Math.abs(current - target) > 0.0005) rafId = requestAnimationFrame(frame);
    }

    function startLoop() {
        if (running) return;
        running = true;
        lastTarget = -1;
        if (!rafId) rafId = requestAnimationFrame(frame);
    }
    function stopLoop() {
        running = false;
        if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    }

    function onScrollOrResize() {
        startLoop();
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => stopLoop(), 700);
    }

    // observe triggers + visibility
    if (triggers.length) observeTriggers();
    let visObserver = null;
    try {
        visObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.target !== wrapper) return;
                if (entry.isIntersecting) startLoop(); else stopLoop();
            });
        }, { root: scrollParent === window ? null : scrollParent, threshold: 0 });
        visObserver.observe(wrapper);
    } catch (e) {
        log('visObserver failed', e);
        visObserver = null;
    }

    // attach listeners (try once; fallback to window already handled)
    try {
        if (scrollParent === window) {
            window.addEventListener('scroll', onScrollOrResize, { passive: true });
            window.addEventListener('resize', onScrollOrResize);
        } else {
            scrollParent.addEventListener('scroll', onScrollOrResize, { passive: true });
            window.addEventListener('resize', onScrollOrResize);
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
            if (m.type === 'childList' && (m.addedNodes.length || m.removedNodes.length)) { changed = true; break; }
        }
        if (!changed) return;
        unobserveTriggers();
        triggers = Array.from(wrapper.querySelectorAll('.tl-trigger'));
        items = Array.from(wrapper.querySelectorAll('li.timeline-item, .timeline-item')).map((it) => ({ el: it, mark: it.querySelector('.tl-mark') || it.querySelector('.tl-trigger') || it }));
        if (triggers.length) observeTriggers();
        updateStuckByLine();
        startLoop();
    });
    mo.observe(wrapper, { childList: true, subtree: true });


    console.debug('[ZA] animation.js executed in iframe, zaTimeline set?', !!window.zaTimeline);

    // initial start if visible
    (function startIfVisible() {
        const rect = wrapper.getBoundingClientRect();
        const inViewport = rect.bottom > 0 && rect.top < (window.innerHeight || document.documentElement.clientHeight);
        if (inViewport) { updateStuckByLine(); startLoop(); }
    })();

    // destroy
    function destroy() {
        stopLoop();
        if (observer) try { observer.disconnect(); } catch (e) {}
        if (visObserver) try { visObserver.disconnect(); } catch (e) {}
        try { mo.disconnect(); } catch (e) {}
        try {
            if (scrollParent === window) {
                window.removeEventListener('scroll', onScrollOrResize, { passive: true });
                window.removeEventListener('resize', onScrollOrResize);
            } else {
                scrollParent.removeEventListener('scroll', onScrollOrResize, { passive: true });
                window.removeEventListener('resize', onScrollOrResize);
            }
        } catch (e) {}
        // remove stuck class if present
        try { if (currentStuckEl) currentStuckEl.classList.remove('is-stuck'); } catch (e) {}
        try { delete el.__zaTimelineDestroy; } catch (e) { el.__zaTimelineDestroy = undefined; }
    }
    el.__zaTimelineDestroy = destroy;
    return destroy;
}

/**
 * Initialize all timeline widgets in a document
 */
export function initAllWidgets(doc = document) {
    console.log('[ZA animation.js] initAllWidgets called', doc);

    const wrappers = doc.querySelectorAll('.timeline-wrapper');
    console.log('[ZA animation.js] Found wrappers:', wrappers.length);

    wrappers.forEach((wrapper, index) => {
        console.log('[ZA animation.js] Initializing wrapper #' + index, wrapper);
        const destroy = initTimelineAnimation(wrapper);
        console.log('[ZA animation.js] Wrapper #' + index + ' initialized, destroy fn:', typeof destroy);
    });
}

// Также выставляем в глобальный объект (для совместимости)
if (typeof window !== 'undefined') {
    window.zaTimeline = window.zaTimeline || {};
    window.zaTimeline.initTimelineAnimation = initTimelineAnimation;
    window.zaTimeline.initAllWidgets = initAllWidgets;
    console.log('[ZA animation.js] Global zaTimeline object created');
}

// Дополнительный лог для проверки, что модуль загружен
console.log('[ZA animation.js] Module loaded, exports:', {
    initTimelineAnimation: typeof initTimelineAnimation,
    initAllWidgets: typeof initAllWidgets
});