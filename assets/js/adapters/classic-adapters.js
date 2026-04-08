(function () {
	'use strict';

	/* CONFIG */

	const cfg = (function () {
		const out = {};

		if (document.currentScript?.src) {
			const url = new URL(document.currentScript.src, location.href);
			out.baseJsUrl = url.searchParams.get('za_base_js') || '';
			out.animationUrl = url.searchParams.get('za_anim') || '';
		}

		if (window.zaTimelineConfig) {
			Object.assign(out, window.zaTimelineConfig);
		}

		return out;
	})();

	const __ = (text) =>
		window.parent?.wp?.i18n?.__(text, 'timeline-full-widget') || text;

	/* URL RESOLVE */

	function resolveAnimationUrl() {
		if (cfg.animationUrl) {
			return new URL(cfg.animationUrl, location.href).href;
		}

		if (cfg.baseJsUrl) {
			return (
				new URL(cfg.baseJsUrl, location.href).href.replace(/\/$/, '') +
				'/core/animation.js'
			);
		}

		return (
			location.origin +
			'/wp-content/plugins/timeline-full-widget/assets/js/core/animation.js'
		);
	}

	/* TIMELINE LOADER */

	function ensureTimeline(doc) {
		if (!doc) {
			return;
		}

		const win = doc.defaultView || window;

		// already loaded
		if (win.zaTimelineModule?.initAllWidgets) {
			win.zaTimelineModule.initAllWidgets(doc);
			return;
		}
		// loading guard
		if (win._zaTimelineLoading) {
			return;
		}
		win._zaTimelineLoading = true;

		const script = doc.createElement('script');
		script.type = 'module';
		script.textContent = `
			import('${resolveAnimationUrl()}')
				.then(m => {
					window.zaTimelineModule = m;
					m.initAllWidgets?.(document);
					m.default?.(document);
				})
				.catch(e => console.error('[ZA Timeline]', e))
				.finally(() => {
					window._zaTimelineLoading = false;
				});`;

		(doc.head || doc.documentElement).appendChild(script);
	}

	function hasTimeline(doc) {
		return !!doc.querySelector('.wp-block-za-timeline-full-widget');
	}

	/* HTML TEMPLATE */

	function getTimelineItem(index, inverted = false) {
		return `<!-- wp:za/timeline-item ${inverted ? '{"position":"timeline-inverted"}' : ''} -->
<li class="wp-block-za-timeline-item timeline-item ${inverted ? 'timeline-inverted' : 'timeline-left'}">
	<div class="timeline-side">
		<p class="t-text-align-left">&nbsp;</p>
	</div>
	<div class="tl-trigger">&nbsp;</div>
	<div class="tl-mark">&nbsp;</div>
	<div class="timeline-panel">
		<div class="tl-content">
			<div class="tl-desc">
				<h3 class="t-text-align-left tl-title" style="margin-top:10px;">Timeline Item #${index}</h3>
				<div class="tl-desc-short">&nbsp;</div>
			</div>
		</div>
	</div>
</li>
<!-- /wp:za/timeline-item -->`;
	}

	function getTimelineTemplate({ items = 2 } = {}) {
		let list = '';
		for (let i = 1; i <= items; i++) {
			list += getTimelineItem(i, i % 2 === 0);
		}

		return `<!-- wp:za/timeline-full-widget --><div class="wp-block-za-timeline-full-widget"><div class="timeline-wrapper" data-theme="default">
		<div class="timeline-line-animation">&nbsp;</div>
		<ul class="timeline timeline-animation-marker">${list}</ul>
	</div></div><!-- /wp:za/timeline-full-widget -->`;
	}

	/* INSERT HANDLER */

	function insertTimeline(editor) {
		const html = getTimelineTemplate({ items: 2 });
		editor.insertContent(html);
		ensureTimeline(editor.getDoc());
	}

	/* DEBOUNCED INIT */

	let debounceTimer = null;

	function scheduleInit(editor) {
		clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => {
			const doc = editor.getDoc();
			if (doc && hasTimeline(doc)) {
				ensureTimeline(doc);
			}
		}, 150);
	}

	/* TINYMCE PLUGIN */

	function registerPlugin() {
		if (window._zaTimelineRegistered) {
			return;
		}
		window._zaTimelineRegistered = true;

		tinymce.PluginManager.add('za_timeline_button', function (editor) {
			editor.on('init SetContent', () => scheduleInit(editor));
			editor.on('NodeChange', () => scheduleInit(editor));

			if (editor.ui?.registry?.addButton) {
				editor.ui.registry.addButton('za_timeline_button', {
					text: __('Timeline'),
					tooltip: __('Insert Timeline'),
					onAction: () => insertTimeline(editor),
				});
			} else {
				editor.addButton('za_timeline_button', {
					text: __('Timeline'),
					onclick: () => insertTimeline(editor),
				});
			}
		});
	}

	/* BOOTSTRAP */

	if (window.tinymce) {
		registerPlugin();
	} else {
		const wait = setInterval(() => {
			if (window.tinymce) {
				clearInterval(wait);
				registerPlugin();
			}
		}, 100);
	}
})();
