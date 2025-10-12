(function() {

    // Убедимся, что TinyMCE доступен
    if ( typeof tinymce === 'undefined' ) {
        return;
    }

    tinymce.PluginManager.add('za_timeline_button', function(editor, url) {

        // Добавляем кнопку в панель
        editor.addButton('za_timeline_button', {
            text: 'Timeline',
            icon: false,
            tooltip: 'Insert Timeline HTML',
            onclick: function() {
                editor.insertContent('<p>Hellow</p>');
            }
        });

        editor.addCommand('zaInsertTimeline', function() {
            editor.insertContent('<p>Hellow</p>');
        });

        return {
            getMetadata: function () {
                return {
                    name: 'ZA Timeline button',
                    url: 'https://example.com'
                };
            }
        };
    });
})();
