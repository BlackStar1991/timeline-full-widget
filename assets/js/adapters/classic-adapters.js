// assets/js/adapters/classic-adapters.js (admin classic editor loader)
(function () {
    'use strict';

    // DEBUG = true для отладки (в девелопе включи)
    var DEBUG = false;
    function log() { if (!DEBUG) return; try { console.log.apply(console, ['[ZA]'].concat(Array.from(arguments))); } catch (e) {} }
    function err() { try { console.error.apply(console, ['[ZA]'].concat(Array.from(arguments))); } catch (e) {} }

    // прочитать конфиг: сначала из document.currentScript (query params), затем parent/top config как fallback
    var cfg = {};
    (function readCfg() {
        try {
            var curSrc = '';
            try {
                if (document.currentScript && document.currentScript.src) {
                    curSrc = String(document.currentScript.src);
                } else {
                    var scripts = document.getElementsByTagName('script');
                    for (var i = scripts.length - 1; i >= 0; i--) {
                        var s = scripts[i];
                        if (!s || !s.src) continue;
                        var lower = s.src.toLowerCase();
                        if (lower.indexOf('classic-adapter-loader') !== -1 || lower.indexOf('classic-adapters') !== -1) {
                            curSrc = s.src;
                            break;
                        }
                    }
                }
            } catch (e) { curSrc = ''; }

            if (curSrc) {
                try {
                    var u = new URL(curSrc, document.baseURI || window.location.href);
                    var sp = u.searchParams;
                    var za_base = sp.get('za_base_js') || sp.get('baseJsUrl') || null;
                    var za_anim = sp.get('za_anim') || sp.get('animationUrl') || null;
                    if (za_base) cfg.baseJsUrl = decodeURIComponent(za_base);
                    if (za_anim) cfg.animationUrl = decodeURIComponent(za_anim);
                    cfg._loaderScript = curSrc;
                    log('cfg from script params', cfg);
                } catch (e) {
                    log('cannot parse currentScript URL', e);
                }
            }

            // fallback: try parent/top config (same-origin only)
            if ((!cfg.baseJsUrl || !cfg.animationUrl)) {
                try {
                    if (window.parent && window.parent.zaTimelineConfig && Object.keys(window.parent.zaTimelineConfig).length) {
                        cfg = Object.assign({}, window.parent.zaTimelineConfig, cfg);
                        log('merged cfg from parent', cfg);
                    } else if (window.zaTimelineConfig && Object.keys(window.zaTimelineConfig).length) {
                        cfg = Object.assign({}, window.zaTimelineConfig, cfg);
                        log('cfg from top window', cfg);
                    }
                } catch (e) {
                    log('cannot access parent config (maybe cross-origin)', e);
                }
            }
        } catch (e) {
            err('readCfg failed', e);
            cfg = cfg || {};
        }
    })();

    // i18n helper
    var __ = function (text) {
        try {
            if (window.parent && window.parent.wp && window.parent.wp.i18n && typeof window.parent.wp.i18n.__ === 'function') {
                return window.parent.wp.i18n.__.call(window.parent.wp.i18n, text, 'timeline-full-widget');
            }
        } catch (e) {}
        return text;
    };

    // utils
    function ensureSlash(u) { return (u && !u.endsWith('/')) ? (u + '/') : (u || ''); }
    function isAbsolute(u) { return typeof u === 'string' && u.indexOf('://') !== -1; }
    function stripQueryHash(u) { return String(u || '').replace(/(\?|#).*$/,''); }

    // Resolve final absolute animation.js URL
    function resolveAnimationUrl() {
        // 1) explicit absolute animationUrl from cfg
        if (cfg && cfg.animationUrl && isAbsolute(cfg.animationUrl)) {
            return cfg.animationUrl;
        }

        // 2) if animationUrl present but relative, try resolve relative to loader script
        if (cfg && cfg.animationUrl && cfg.animationUrl.length) {
            try {
                if (cfg._loaderScript) {
                    return new URL(cfg.animationUrl, cfg._loaderScript).href;
                }
                return new URL(cfg.animationUrl, document.baseURI || window.location.href).href;
            } catch (e) { log('cannot resolve relative cfg.animationUrl', e); }
        }

        // 3) baseJsUrl provided: join with core/animation.js
        if (cfg && cfg.baseJsUrl && cfg.baseJsUrl.length) {
            try {
                if (isAbsolute(cfg.baseJsUrl)) {
                    return ensureSlash(cfg.baseJsUrl.replace(/\/+$/,'')) + 'core/animation.js';
                } else if (cfg._loaderScript) {
                    return new URL(ensureSlash(cfg.baseJsUrl.replace(/\/+$/,'')) + 'core/animation.js', cfg._loaderScript).href;
                }
            } catch (e) { log('cannot resolve baseJsUrl', e); }
        }

        // 4) last-resort: try typical WP plugin location
        try {
            var origin = (window.location && window.location.origin) ? window.location.origin : (window.location.protocol + '//' + window.location.host);
            return origin.replace(/\/$/,'') + '/wp-content/plugins/timeline-full-widget/assets/js/core/animation.js';
        } catch (e) {
            return '../core/animation.js';
        }
    }

    // Inject module into iframe and let it attach itself to iframe window
    function injectModuleIntoDoc(doc) {
        if (!doc) return;
        try {
            // If module already loaded in this doc window, just call its init and return
            try {
                var w = doc.defaultView || doc.parentWindow;
                if (w && w.zaTimelineModule && typeof w.zaTimelineModule.initAllWidgets === 'function') {
                    try { w.zaTimelineModule.initAllWidgets(doc); log('called existing zaTimelineModule.initAllWidgets'); } catch (e) { log('existing module init failed', e); }
                    return;
                }
            } catch (e) {
                // cannot access doc window for some reason, continue to inject
            }

            // resolve URL
            var animationModuleUrl = resolveAnimationUrl();
            if (!animationModuleUrl) throw new Error('animationModuleUrl not resolved');

            // ensure absolute if possible
            try {
                if (animationModuleUrl.indexOf('://') === -1 && window.location && window.location.origin) {
                    animationModuleUrl = new URL(animationModuleUrl, window.location.origin + '/').href;
                }
            } catch (e) { /* ignore */ }

            animationModuleUrl = String(animationModuleUrl || '');
            var safeUrl = animationModuleUrl.replace(/'/g, "\\'");

            // create module script that attaches module to iframe window
            var moduleScript = doc.createElement('script');
            moduleScript.type = 'module';
            moduleScript.textContent =
                "import('" + safeUrl + "').then(function(mod){\n" +
                "  try {\n" +
                "    // attach module object so we can re-run init later\n" +
                "    try { window.zaTimelineModule = mod; } catch (e) {}\n" +
                "    if (mod && typeof mod.initAllWidgets === 'function') { try { mod.initAllWidgets(document); } catch(e) { console.error('[ZA] initAllWidgets error', e); } }\n" +
                "    else if (mod && typeof mod.default === 'function') { try { mod.default(document); } catch(e) { console.error('[ZA] default init error', e); } }\n" +
                "    // mark doc as inited (useful guard)\n" +
                "    try { window._zaTimelineInited = true; } catch (e) {}\n" +
                "  } catch(e) { console.error('[ZA] error in injected module', e); }\n" +
                "}).catch(function(err){ console.error('[ZA] dynamic import failed for animation module', err); });";

            var head = doc.head || doc.getElementsByTagName('head')[0] || doc.documentElement;
            head.appendChild(moduleScript);

            // also set marker on document itself (parent side)
            try { doc._zaTimelineInited = true; } catch (e) {}
            log('injected module into iframe document');
        } catch (e) {
            err('injectModuleIntoDoc failed', e);
        }
    }

    // Higher-level initializer used from editor events
    function initTimelineInEditor(doc) {
        if (!doc) return;
        try {
            // Prefer calling existing module's init if available (handles re-init after content change)
            try {
                var win = doc.defaultView || doc.parentWindow;
                if (win && win.zaTimelineModule && typeof win.zaTimelineModule.initAllWidgets === 'function') {
                    try { win.zaTimelineModule.initAllWidgets(doc); log('re-used existing zaTimelineModule.initAllWidgets'); return; } catch (e) { log('existing module initAllWidgets threw', e); }
                }
            } catch (e) { /* continue to injection */ }

            // Else inject module (will attach itself and run init)
            injectModuleIntoDoc(doc);
        } catch (e) {
            err('initTimelineInEditor failed', e);
        }
    }

    // TinyMCE plugin registration (guard)
    function registerPlugin() {
        if (window._zaTimelinePluginRegistered) return;
        window._zaTimelinePluginRegistered = true;

        try {
            tinymce.PluginManager.add('za_timeline_button', function (editor) {
                // on editor init always ensure module is injected (new editor/iframe)
                editor.on('init', function () {
                    try { var d = editor.getDoc(); if (d) initTimelineInEditor(d); } catch (e) { log('init handler error', e); }
                });

                // SetContent: try to re-run init on existing module; if not present, inject
                editor.on('SetContent', function () {
                    try {
                        var d = editor.getDoc();
                        if (!d) return;
                        // attempt to call existing module inside iframe
                        var win = d.defaultView || d.parentWindow;
                        if (win && win.zaTimelineModule && typeof win.zaTimelineModule.initAllWidgets === 'function') {
                            try { win.zaTimelineModule.initAllWidgets(d); log('SetContent: re-ran module init'); return; } catch (e) { log('SetContent: existing module init failed', e); }
                        }
                        // if module not present, inject one
                        initTimelineInEditor(d);
                    } catch (e) { log('SetContent handler failed', e); }
                });

                // NodeChange: similar behaviour
                editor.on('NodeChange', function () {
                    try {
                        var d = editor.getDoc();
                        if (!d) return;
                        var win = d.defaultView || d.parentWindow;
                        if (win && win.zaTimelineModule && typeof win.zaTimelineModule.initAllWidgets === 'function') {
                            try { win.zaTimelineModule.initAllWidgets(d); log('NodeChange: re-ran module init'); return; } catch (e) { log('NodeChange: existing module init failed', e); }
                        }
                        initTimelineInEditor(d);
                    } catch (e) { log('NodeChange handler failed', e); }
                });

                // UI button registration (unchanged)
                if (editor.ui && editor.ui.registry && typeof editor.ui.registry.addButton === 'function') {
                    editor.ui.registry.addButton('za_timeline_button', {
                        text: __('Timeline'),
                        tooltip: __('Insert Timeline HTML'),
                        onAction: function () { editor.insertContent('<p>Timeline widget placeholder</p>'); }
                    });
                } else {
                    editor.addButton('za_timeline_button', {
                        text: __('Timeline'),
                        icon: false,
                        tooltip: __('Insert Timeline HTML'),
                        onclick: function () { editor.insertContent('<p>Timeline widget placeholder</p>'); }
                    });
                }

                return { getMetadata: function () { return { name: 'Timeline', url: 'https://wordpress.org/plugins/timeline-full-widget' }; } };
            });
        } catch (e) {
            err('registerPlugin failed', e);
        }
    }

    // wait for tinymce
    if (typeof tinymce === 'undefined') {
        var attempts = 0;
        var checkInterval = setInterval(function () {
            attempts++;
            if (typeof tinymce !== 'undefined') {
                clearInterval(checkInterval); registerPlugin();
            } else if (attempts > 50) {
                clearInterval(checkInterval);
                err('tinymce never became available');
            }
        }, 100);
    } else {
        registerPlugin();
    }
})();
