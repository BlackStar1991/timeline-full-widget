// assets/js/adapters/classic-adapter-loader.js
(function () {
    'use strict';

    // document.currentScript доступен и вернёт URL этого loader'а,
    // поэтому формируем URL модуля относительно него:
    try {
        var loaderUrl = document.currentScript && document.currentScript.src
            ? document.currentScript.src
            : (function() {
                var s = document.getElementsByTagName('script');
                return s[s.length - 1] && s[s.length - 1].src ? s[s.length - 1].src : '';
            })();

        // предполагаем что модульный файл лежит рядом: classic-adapters.js
        var moduleUrl = new URL('classic-adapters.js', loaderUrl).href;

        var s = document.createElement('script');
        s.type = 'module';
        s.src = moduleUrl;
        s.async = false; // можно false, чтобы порядок не ломался
        document.head.appendChild(s);
    } catch (e) {
        console && console.error && console.error('[ZA] loader error', e);
    }
})();
