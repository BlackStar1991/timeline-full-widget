// assets/js/adapters/classic-adapters.js
import { initAllWidgets } from '../core/animation.js';

(function () {
    'use strict';
    const cfg = (window.parent && window.parent.zaTimelineConfig) ? window.parent.zaTimelineConfig : {};

    console.log('[ZA] classic-adapters.js (module) loaded');

    const __ = function (text) {
        try {
            if (window.parent && window.parent.wp && window.parent.wp.i18n && typeof window.parent.wp.i18n.__ === 'function') {
                return window.parent.wp.i18n.__.call(window.parent.wp.i18n, text, 'timeline-full-widget');
            }
        } catch (e) {}
        return text;
    };

    function initTimelineInEditor(doc) {
        if (!doc) {
            console.warn('[ZA] No document provided to initTimelineInEditor');
            return;
        }

        try {
            console.log('[ZA] initTimelineInEditor — attempting to init in iframe document', doc);

            // флаг в doc, чтобы не инициализировать несколько раз
            if (doc._zaTimelineInited) {
                console.log('[ZA] initTimelineInEditor — already inited, skipping');
                return;
            }

            // получаем URL модуля animation.js: берем из конфигурации или формируем относительный
            const animationModuleUrl = (cfg && cfg.animationUrl)
                ? cfg.animationUrl
                : (function() {
                    try {
                        // если cfg нет — пытаемся вычислить путь относительно текущего скрипта в iframe
                        const cur = document.currentScript && document.currentScript.src
                            ? document.currentScript.src
                            : '';
                        return new URL('../core/animation.js', cur).href;
                    } catch (e) {
                        return '../core/animation.js';
                    }
                })();

            // Создаём модульный скрипт внутри iframe, чтобы импорт и вызов выполнялись в iframe scope
            const moduleScript = doc.createElement('script');
            moduleScript.type = 'module';

            // текст модуля: импортируем и запускаем initAllWidgets(document)
            moduleScript.textContent = `
            import { initAllWidgets } from '${animationModuleUrl}';
            (function(){
                try {
                    // если функция принимает параметр document — передадим его, но даже если не принимает, вызов без страдает
                    if (typeof initAllWidgets === 'function') {
                        try {
                            initAllWidgets(document);
                        } catch (e) {
                            // если initAllWidgets не принимает аргументов, попробуем вызвать без аргумента
                            try { initAllWidgets(); } catch (err) { console.error('[ZA] initAllWidgets call failed', err); }
                        }
                        // пометить, что инициализация выполнена во фрейме
                        window._zaTimelineInited = true;
                        console && console.log && console.log('[ZA] animation module imported and initAllWidgets called (iframe)');
                    } else {
                        console && console.warn && console.warn('[ZA] initAllWidgets is not a function');
                    }
                } catch (e) {
                    console && console.error && console.error('[ZA] error inside injected module', e);
                }
            })();
        `;

            // вставляем в head (или в documentElement)
            const head = doc.head || doc.getElementsByTagName('head')[0] || doc.documentElement;
            head.appendChild(moduleScript);

            // пометить в doc, чтобы не перезапускать
            doc._zaTimelineInited = true;

            console.log('[ZA] initTimelineInEditor — module script injected into iframe');
        } catch (e) {
            console.error('[ZA] Error initializing timeline in editor:', e);
        }
    }

    // Проверяем доступность tinymce
    if (typeof tinymce === 'undefined') {
        console.warn('[ZA] tinymce is undefined, waiting...');

        let attempts = 0;
        const checkInterval = setInterval(() => {
            attempts++;
            if (typeof tinymce !== 'undefined') {
                console.log('[ZA] tinymce is now available');
                clearInterval(checkInterval);
                registerPlugin();
            } else if (attempts > 50) {
                console.error('[ZA] tinymce never became available');
                clearInterval(checkInterval);
            }
        }, 100);
    } else {
        registerPlugin();
    }




    function registerPlugin() {
        console.log('[ZA] Registering TinyMCE plugin "za_timeline_button"');

        tinymce.PluginManager.add('za_timeline_button', function (editor, url) {
            console.log('[ZA] Plugin registered for editor:', editor.id);

            // Инициализация при загрузке редактора
            editor.on('init', function () {
                console.log('[ZA] Editor init event fired');
                const doc = editor.getDoc();
                if (doc) {
                    initTimelineInEditor(doc);
                }
            });

            // Реинициализация при изменении контента
            editor.on('SetContent', function () {
                console.log('[ZA] Editor SetContent event fired');
                const doc = editor.getDoc();
                if (doc) {
                    initTimelineInEditor(doc);
                }
            });

            // Реинициализация при изменении узлов
            editor.on('NodeChange', function () {
                const doc = editor.getDoc();
                if (doc) {
                    // Проверяем, есть ли timeline в контенте
                    if (doc.querySelector('.timeline-wrapper')) {
                        initTimelineInEditor(doc);
                    }
                }
            });

            // Добавление кнопки
            if (editor.ui && editor.ui.registry && typeof editor.ui.registry.addButton === 'function') {
                console.log('[ZA] Using TinyMCE 5+ API');
                editor.ui.registry.addButton('za_timeline_button', {
                    text: __('Timeline'),
                    tooltip: __('Insert Timeline HTML'),
                    onAction: function () {
                        console.log('[ZA] Timeline button clicked');
                        editor.insertContent('<p>Timeline widget placeholder</p>');
                    }
                });
            } else {
                console.log('[ZA] Using TinyMCE 4 API');
                editor.addButton('za_timeline_button', {
                    text: __('Timeline'),
                    icon: false,
                    tooltip: __('Insert Timeline HTML'),
                    onclick: function () {
                        console.log('[ZA] Timeline button clicked');
                        editor.insertContent('<p>Timeline widget placeholder</p>');
                    }
                });
            }

            return {
                getMetadata: function () {
                    return {
                        name: 'Timeline',
                        url: 'https://wordpress.org/plugins/timeline-full-widget'
                    };
                }
            };
        });

        console.log('[ZA] Plugin registration completed');
    }
})();