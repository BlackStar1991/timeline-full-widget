(function($){
    function patchFrame(frame){
        if (!frame || frame._zaPatched) return;
        frame._zaPatched = true;

        try {
            frame.on('open', function() {
                try {

                    if (frame.options && frame.options.library) {

                        frame.options.library.type = '';
                    }

                    var state = frame.state && frame.state();
                    if (state && state.props && typeof state.props.set === 'function') {

                        state.props.set('filter', 'all');

                        if (state.props.get('library') !== undefined) {
                            state.props.set('library', '');
                        }
                    }
                } catch (e) { /* ignore */ }
            });
        } catch (e) { /* ignore */ }
    }


    $(document).on('click', '.elementor-control-media .elementor-control-field, .elementor-control-media .elementor-control-media__thumbnail', function() {

        setTimeout(function(){
            try {
                var frame = elementor.media && elementor.media.frame;
                if (frame) patchFrame(frame);
            } catch(e){}
        }, 50);
    });


    $(window).on('elementor:init', function(){
        try {
            if (elementor && elementor.media && typeof elementor.media.create === 'function') {
                var origCreate = elementor.media.create;
                elementor.media.create = function() {
                    var f = origCreate.apply(this, arguments);
                    try { patchFrame(f); } catch(e){}
                    return f;
                };
            }
        } catch (e) {}
    });


    $(function(){
        if (window.elementor && window.elementor.media && window.elementor.media.frame) {
            patchFrame(window.elementor.media.frame);
        }
    });

})(jQuery);
