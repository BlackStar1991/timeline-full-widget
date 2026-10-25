/* Timeline Elementor repeater media controls. Do not override Elementor's media frame:
 * imported placeholder images must be replaceable with native media selections. */
(function ($) {
    'use strict';

    function refreshRow(row) {
        if (!row || !row.length) return;
        const field = row.find('.elementor-control-media_type select').first();
        if (!field.length) return;
        const type = field.val() === 'video' ? 'video' : 'image';
        row.find('.elementor-control-media_image, .elementor-control-media_image_alt').toggle(type === 'image');
        row.find('.elementor-control-media_video, .elementor-control-posterURL').toggle(type === 'video');
        // Width applies to both image and video; never hide it on switching.
    }

    function refreshVisibleRows() {
        $('.elementor-repeater-row-controls:visible').each(function () {
            refreshRow($(this));
        });
    }

    // Elementor handles the underlying settings/model and media selection.
    // Only keep the visible controls aligned with a changed repeater type.
    $(document).on('change', '.elementor-control-media_type select', function () {
        refreshRow($(this).closest('.elementor-repeater-row-controls'));
    });
    $(document).on('click', '.elementor-repeater-row-tool, .elementor-repeater-tool-duplicate', function () {
        setTimeout(refreshVisibleRows, 80);
    });
    // Elementor may rebuild the repeater after imported settings are applied.
    $(window).on('elementor:init', refreshVisibleRows);
    $(refreshVisibleRows);
})(jQuery);
