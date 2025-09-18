const DEBUG = false; // включите для отладки

function log(...args) {
    if (!DEBUG) return;
    try { console.log('[za-timeline]', ...args); } catch (e) {}
}

export function initTimelineAnimation(scopeEl) {
    const el = scopeEl && scopeEl.jquery ? scopeEl[0] : scopeEl;
    if (!el || el.nodeType !== 1) return null;

    // Prevent double-init
    if (el.__zaTimelineDestroy) return el.__zaTimelineDestroy;

    // find wrapper
    function findWrapper(node) {
        if (!node) return null;
        if (node.classList && (node.classList.contains('timeline-wrapper') || node.classList.contains('timeline'))) {
            return node;
        }
        if (node.querySelector) {
            return node.querySelector('.timeline-wrapper') || node.querySelector('.timeline');
        }
        return null;
    }
    const wrapper = findWrapper(el);
    if (!wrapper) return null;

    // find line
    const line =
        wrapper.querySelector('.timeline-line-animation') ||
        (el !== wrapper && el.querySelector && el.querySelector('.timeline-line-animation'));
    if (!line) return null;

    // get scroll parent
    function getScrollParent(node) {
        if (!node) return window;
        let parent = node.parentElement;
        while (parent) {
            const style = window.getComputedStyle(parent);
            const overflowY = style.overflowY;
            // include also auto/scroll/overlay
            if (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay') {
                return parent;
            }
            parent = parent.parentElement;
        }
        return window;
    }
    let scrollParent = getScrollParent(wrapper);

    // QUICK SANITY: if scrollParent is an element, but it has 0 height or is same as wrapper offsetParent,
    // fallback to window (some themes use weird layout or transform on container)
    function shouldFallbackToWindow(rootEl) {
        if (!rootEl || rootEl === window) return false;
        try {
            const rect = rootEl.getBoundingClientRect();
            // if root has zero height or extremely small -> not a real scroll root for viewport
            if (!rect || rect.height < 2) return true;
            // if root is body/html -> let window handle it
            if (rootEl === document.body || rootEl === document.documentElement) return true;
        } catch (e) {
            return true;
        }
        return false;
    }
    if (shouldFallbackToWindow(scrollParent)) {
        log('fallback scrollParent => window (detected unsuitable element)', scrollParent);
        scrollParent = window;
    }

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
    let triggers = Array.from(wrapper.querySelectorAll('.tl-trigger'));
    const ioOptions = {
        root: scrollParent === window ? null : scrollParent,
        threshold: [0, 0.25, 0.5, 0.75, 1]
    };
    const ioCallback = (entries) => {
        entries.forEach((entry) => {
            const trigger = entry.target;
            const parentBlock =
                trigger.closest('li') ||
                trigger.closest('.timeline-item') ||
                trigger.closest('.wp-block') ||
                trigger.closest('.elementor-widget');
            if (!parentBlock) return;
            parentBlock.classList.toggle('is-stuck', entry.isIntersecting);
        });
    };
    let observer;
    try {
        observer = new IntersectionObserver(ioCallback, ioOptions);
    } catch (e) {
        observer = null;
        log('IntersectionObserver failed to construct', e);
    }

    const observeAllTriggers = () => {
        if (!observer) return;
        triggers.forEach((t) => {
            try { observer.observe(t); } catch (e) {}
        });
    };
    const unobserveAllTriggers = () => {
        if (!observer) return;
        triggers.forEach((t) => {
            try { observer.unobserve(t); } catch (e) {}
        });
    };

    // compute progress (0..1)
    function getTargetProgress() {
        const rect = wrapper.getBoundingClientRect();

        if (scrollParent === window) {
            const middle = window.innerHeight / 2;
            if (rect.top < middle && rect.bottom > 0) {
                const progress = Math.min(1, (middle - rect.top) / rect.height);
                return Math.max(0, progress);
            }
            return 0;
        } else {
            // when root is element, use its bounding rect
            try {
                const rootRect = scrollParent.getBoundingClientRect();
                const rootMiddle = rootRect.top + rootRect.height / 2;
                if (rect.top < rootMiddle && rect.bottom > rootRect.top) {
                    const progress = Math.min(1, (rootMiddle - rect.top) / rect.height);
                    return Math.max(0, progress);
                }
            } catch (e) {
                // if anything fails, fallback to window calculation
                const middle = window.innerHeight / 2;
                if (rect.top < middle && rect.bottom > 0) {
                    const progress = Math.min(1, (middle - rect.top) / rect.height);
                    return Math.max(0, progress);
                }
            }
            return 0;
        }
    }

    // animate frame
    function frame() {
        rafId = null;
        const target = getTargetProgress();

        // Debug log of values to inspect behavior in Astra
        if (DEBUG) {
            try {
                const r = wrapper.getBoundingClientRect();
                const sp = scrollParent === window ? 'window' : scrollParent;
                console.log('[za-timeline] frame', { target, current, lastTarget, rect: r, scrollParent: sp });
            } catch (e) {}
        }

        if (target === lastTarget && Math.abs(current - target) < 0.0005) {
            current = target;
            line.style.transform = `scaleY(${current})`;
            running = false;
            return;
        }
        lastTarget = target;

        const LERP = 0.12;
        current += (target - current) * LERP;

        if (Math.abs(current - target) < 0.001) current = target;
        line.style.transform = `scaleY(${current})`;

        if (running) {
            rafId = requestAnimationFrame(frame);
        } else {
            if (Math.abs(current - target) > 0.0005) {
                rafId = requestAnimationFrame(frame);
            }
        }
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

    function onScrollOrResize() {
        startLoop();
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => stopLoop(), 700);
    }

    // observe triggers and visibility
    if (triggers.length) observeAllTriggers();

    const visObserver = (function () {
        try {
            return new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    if (entry.target !== wrapper) return;
                    if (entry.isIntersecting) startLoop();
                    else stopLoop();
                });
            }, { root: scrollParent === window ? null : scrollParent, threshold: 0 });
        } catch (e) {
            log('visObserver construction failed', e);
            return null;
        }
    })();
    try { if (visObserver) visObserver.observe(wrapper); } catch (e) {}

    // attach listeners
    try {
        if (scrollParent === window) {
            window.addEventListener('scroll', onScrollOrResize, { passive: true });
            window.addEventListener('resize', onScrollOrResize);
        } else {
            scrollParent.addEventListener('scroll', onScrollOrResize, { passive: true });
            window.addEventListener('resize', onScrollOrResize);
        }
    } catch (e) {
        // If adding listeners to custom scrollParent fails, fallback to window listeners
        try {
            window.addEventListener('scroll', onScrollOrResize, { passive: true });
            window.addEventListener('resize', onScrollOrResize);
            scrollParent = window;
            log('fallback: using window listeners due to failure adding to scrollParent', e);
        } catch (ee) {}
    }

    // MutationObserver for dynamic content
    const mo = new MutationObserver((mutations) => {
        let changed = false;
        for (const m of mutations) {
            if (m.type === 'childList' && (m.addedNodes.length || m.removedNodes.length)) {
                changed = true;
                break;
            }
        }
        if (!changed) return;
        try { unobserveAllTriggers(); } catch (e) {}
        triggers = Array.from(wrapper.querySelectorAll('.tl-trigger'));
        if (triggers.length) observeAllTriggers();
        startLoop();
    });
    mo.observe(wrapper, { childList: true, subtree: true });

    // start if visible initially
    (function startIfVisible() {
        const rect = wrapper.getBoundingClientRect();
        const inViewport = rect.bottom > 0 && rect.top < (window.innerHeight || document.documentElement.clientHeight);
        if (inViewport) startLoop();
    })();

    // destroy
    function destroy() {
        stopLoop();
        try { if (observer) observer.disconnect(); } catch (e) {}
        try { mo.disconnect(); } catch (e) {}
        try { if (visObserver) visObserver.disconnect(); } catch (e) {}
        try {
            if (scrollParent === window) {
                window.removeEventListener('scroll', onScrollOrResize, { passive: true });
                window.removeEventListener('resize', onScrollOrResize);
            } else {
                scrollParent.removeEventListener('scroll', onScrollOrResize, { passive: true });
                window.removeEventListener('resize', onScrollOrResize);
            }
        } catch (e) {}
        try { delete el.__zaTimelineDestroy; } catch (e) { el.__zaTimelineDestroy = undefined; }
    }

    el.__zaTimelineDestroy = destroy;
    return destroy;
}

// init all on root
export function initAllWidgets(root = document) {
    const widgets = Array.from(root.querySelectorAll('.wp-block-za-timeline-full-widget, .timeline-wrapper, .timeline'));
    const destroyers = widgets.map((el) => {
        try { return initTimelineAnimation(el); } catch (e) { console.error('initTimelineAnimation error', e); return null; }
    }).filter(Boolean);

    return function destroyAll() {
        destroyers.forEach((d) => { try { d && d(); } catch (e) {} });
    };
}

// Auto-expose on window for legacy usage
if (typeof window !== 'undefined') {
    if (!window.zaTimeline) window.zaTimeline = {};
    window.zaTimeline.initTimelineAnimation = initTimelineAnimation;
    window.zaTimeline.initAllWidgets = initAllWidgets;
}