// assets/js/adapters/classic-adapter-loader.js
(function () {
	'use strict';

	try {
		// --- tiny helpers ---
		var stripQueryHash = function (u) {
			return String(u || '').replace(/(\?|#).*$/, '');
		};
		var ensureTrailingSlash = function (u) {
			return u && !u.endsWith('/') ? u + '/' : u || '';
		};
		var dirname = function (u) {
			try {
				var parsed = new URL(
					u,
					document.baseURI || window.location.href
				);
				var p = parsed.pathname || '/';
				if (!p.endsWith('/')) {
					var idx = p.lastIndexOf('/');
					p = idx >= 0 ? p.substr(0, idx + 1) : '/';
				}
				return parsed.origin.replace(/\/+$/, '') + p;
			} catch (e) {
				var clean = stripQueryHash(u);
				if (clean.indexOf('/') === -1) return clean;
				if (!clean.endsWith('/'))
					clean = clean.substr(0, clean.lastIndexOf('/') + 1);
				return clean;
			}
		};
		var looksLikeAbsolute = function (u) {
			return typeof u === 'string' && u.indexOf('://') !== -1;
		};

		// --- compute base (priority: explicit config in top/parent window) ---
		var base = '';
		try {
			if (
				window &&
				window.zaTimelineConfig &&
				looksLikeAbsolute(window.zaTimelineConfig.baseJsUrl)
			) {
				base = ensureTrailingSlash(
					stripQueryHash(window.zaTimelineConfig.baseJsUrl)
				);
			} else if (
				window.parent &&
				window.parent.zaTimelineConfig &&
				looksLikeAbsolute(window.parent.zaTimelineConfig.baseJsUrl)
			) {
				base = ensureTrailingSlash(
					stripQueryHash(window.parent.zaTimelineConfig.baseJsUrl)
				);
			}
		} catch (e) {
			/* ignore */
		}

		// --- if no config, find a script tag that contains our loader filename or plugin slug ---
		if (!base) {
			var scripts = document.getElementsByTagName('script');
			for (var i = 0; i < scripts.length; i++) {
				var s = scripts[i];
				if (!s || !s.src) continue;
				var srcClean = stripQueryHash(s.src).toLowerCase();
				if (
					srcClean.indexOf('classic-adapter-loader.js') !== -1 ||
					srcClean.indexOf('timeline-full-widget') !== -1
				) {
					base = ensureTrailingSlash(dirname(s.src));
					break;
				}
			}
		}

		// --- fallback to last script's directory (minimal) ---
		if (!base) {
			var lastScripts = document.getElementsByTagName('script');
			for (var j = lastScripts.length - 1; j >= 0; j--) {
				var sc = lastScripts[j];
				if (!sc || !sc.src) continue;
				base = ensureTrailingSlash(dirname(sc.src));
				break;
			}
		}

		// --- final fallback: document.baseURI ---
		if (!base) {
			base = ensureTrailingSlash(
				dirname(document.baseURI || (location && location.href) || '')
			);
		}

		// normalize and build module URL (avoid adapters/adapters)
		base = String(base || '').replace(/\/+$/, '') + '/';
		var moduleUrl = base.toLowerCase().endsWith('/adapters/')
			? base + 'classic-adapters.js'
			: base + 'adapters/classic-adapters.js';
		moduleUrl = moduleUrl
			.replace(/\/adapters\/+adapters\//g, '/adapters/')
			.replace(/([^:]\/)\/+/g, '$1');

		// if already injected — do nothing
		var alreadyInjected = false;
		try {
			var all = document.getElementsByTagName('script');
			for (var k = 0; k < all.length; k++) {
				var el = all[k];
				if (!el || !el.src) continue;
				var href = stripQueryHash(el.src);
				if (
					href.indexOf('classic-adapters.js') !== -1 &&
					href.replace(/([^:]\/)\/+/g, '$1') ===
						moduleUrl.split('?')[0]
				) {
					alreadyInjected = true;
					break;
				}
			}
		} catch (e) {
			/* ignore */
		}

		if (!alreadyInjected) {
			var tag = document.createElement('script');
			tag.type = 'module';
			tag.src = moduleUrl;
			tag.async = false;
			document.head.appendChild(tag);
		}
	} catch (err) {
		/* silent fail — keep admin UI unaffected */
	}
})();
