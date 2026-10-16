<?php
/** Standalone integration-style test doubles; no WordPress bootstrap required. */
declare(strict_types=1);

namespace Elementor {
    class Widget_Base {
        protected array $mock_settings = [];
        public function set_mock_settings(array $settings): void { $this->mock_settings = $settings; }
        public function get_settings_for_display(): array { return $this->mock_settings; }
        public function render_for_test(): string {
            ob_start();
            $this->render();
            return (string) ob_get_clean();
        }
    }
    class Utils {
        public static function validate_html_tag($tag): string {
            return in_array($tag, ['h1','h2','h3','h4','h5','h6','p','div','a'], true) ? $tag : 'div';
        }
    }
    class Group_Control_Image_Size {
        public static function get_attachment_image_html($settings, $name, $media): string {
            return '<img data-attachment="' . htmlspecialchars((string) $settings[$media]['id'], ENT_QUOTES) . '">';
        }
    }
}

namespace {
    $root = dirname(__DIR__, 2);
    define('ABSPATH', $root . '/');
    $GLOBALS['mock_actions'] = [];
    $GLOBALS['mock_filters'] = [];
    $GLOBALS['mock_scripts'] = [];
    $GLOBALS['mock_styles'] = [];
    $GLOBALS['mock_enqueued_scripts'] = [];
    $GLOBALS['mock_enqueued_styles'] = [];
    $GLOBALS['mock_screen'] = (object)['base' => 'post', 'post_type' => 'post', 'post_id' => 0];
    $GLOBALS['mock_is_block_editor'] = true;
    $GLOBALS['mock_has_timeline_block'] = false;
    $GLOBALS['mock_post_id'] = 15;
    $GLOBALS['mock_elementor_post'] = false;
    $GLOBALS['mock_admin'] = false;
    $GLOBALS['mock_ajax'] = false;
    $GLOBALS['mock_is_rich_editing'] = true;
    $GLOBALS['mock_user_caps'] = true;

    function plugin_dir_path($path) { return dirname($path) . '/'; }
    function plugin_dir_url($path) { return 'https://example.test/wp-content/plugins/timeline-full-widget/'; }
    function add_action($key,$callback,$priority=10,$args=1) { $GLOBALS['mock_actions'][$key][] = $callback; }
    function add_filter($key,$callback,$priority=10,$args=1) { $GLOBALS['mock_filters'][$key][] = $callback; }
    function wp_register_script($key,$src,$deps=[],$version=null,$footer=false) { $GLOBALS['mock_scripts'][$key] = compact('src','deps','version','footer'); }
    function wp_register_style($key,$src,$deps=[],$version=null) { $GLOBALS['mock_styles'][$key] = compact('src','deps','version'); }
    function wp_script_is($key,$status) { return isset($GLOBALS['mock_scripts'][$key]); }
    function wp_style_is($key,$status) { return isset($GLOBALS['mock_styles'][$key]); }
    function wp_script_add_data($key,$data,$value) { $GLOBALS['mock_scripts'][$key][$data] = $value; }
    function wp_enqueue_script($key,$src=null,$deps=[],$version=null,$footer=false) { if ($src !== null) {$GLOBALS['mock_scripts'][$key] = compact('src','deps','version','footer');} $GLOBALS['mock_enqueued_scripts'][] = $key; }
    function wp_enqueue_style($key) { $GLOBALS['mock_enqueued_styles'][] = $key; }
    function current_user_can($cap) { return $GLOBALS['mock_user_caps']; }
    function get_user_option($key) { return $GLOBALS['mock_is_rich_editing'] ? 'true' : 'false'; }
    function get_current_screen() { return $GLOBALS['mock_screen']; }
    function use_block_editor_for_post_type($post_type) { return $GLOBALS['mock_is_block_editor']; }
    function use_block_editor_for_post($post) { return $GLOBALS['mock_is_block_editor']; }
    function get_post($id) { return $id ? (object)['ID' => $id] : null; }
    function get_the_ID() { return 0; }
    function get_queried_object_id() { return $GLOBALS['mock_post_id']; }
    function is_admin() { return $GLOBALS['mock_admin']; }
    function wp_doing_ajax() { return $GLOBALS['mock_ajax']; }
    function has_block($block,$post_id) { return $GLOBALS['mock_has_timeline_block'] && $block === 'za/timeline-full-widget'; }
    function wp_json_encode($data) { return json_encode($data); }
    function wp_add_inline_script($handle, $code, $position) { $GLOBALS['mock_inline_scripts'][$handle] = [$code,$position]; }
    function esc_url_raw($s) { return $s; }
    function esc_url($s) { return htmlspecialchars($s, ENT_QUOTES, 'UTF-8'); }
    function esc_attr($s) { return htmlspecialchars((string) $s, ENT_QUOTES, 'UTF-8'); }
    function esc_html($s) { return htmlspecialchars((string) $s, ENT_QUOTES, 'UTF-8'); }
    function esc_html__($s,$domain) { return esc_html($s); }
    function esc_attr__($s,$domain) { return esc_attr($s); }
    function __($s,$domain) { return $s; }
    function sanitize_html_class($s) { return preg_replace('/[^a-zA-Z0-9_-]/', '', $s); }
    function sanitize_key($s) { return preg_replace('/[^a-z0-9_-]/', '', strtolower($s)); }
    function tag_escape($s) { return preg_replace('/[^a-zA-Z0-9]/', '', $s); }
    function wp_strip_all_tags($s) { return strip_tags($s); }
    function wp_kses_post($s) { return strip_tags((string)$s, '<p><b><strong><em><a><br><ul><li><span>'); }
    function wp_kses($s,$allowed) { return strip_tags($s, '<br>'); }
    function wp_check_filetype($url) { return ['type'=>str_ends_with($url,'.webm')?'video/webm':'video/mp4']; }
    function plugin_basename($s) { return basename($s); }
    function register_block_type_from_metadata($path) { $GLOBALS['mock_block_path'] = $path; }

    $passes = 0;
    function check($condition, string $message): void {
        global $passes;
        if (!$condition) {fwrite(STDERR, "FAIL: {$message}\n");exit(1);}
        $passes++;
        echo "PASS: {$message}\n";
    }
    require $root . '/timeline-full-widget.php';
    check(class_exists('TimelineFullWidget\\Plugin'), 'PSR-4 bootstrap loads Plugin');
    check(class_exists('TimelinePlugin', false), 'Public TimelinePlugin alias remains available');
    check(isset($GLOBALS['mock_actions']['init']), 'Bootstrap registers init hook');
    check(!isset($GLOBALS['mock_actions']['elementor/frontend/after_enqueue_styles']), 'Core CSS is not enqueued on every Elementor frontend page');
    $asset = new \TimelineFullWidget\Assets\AssetManager();
    $asset->registerAssets();
    check(isset($GLOBALS['mock_styles']['timeline-core-style']), 'Core CSS registered on init');
    check(isset($GLOBALS['mock_scripts']['za-timeline-gutenberg']), 'Gutenberg module registered');
    check(isset($GLOBALS['mock_scripts']['za-timeline-transfer-elementor-editor']), 'Elementor transfer editor module registered');
    check(!isset($GLOBALS['mock_scripts']['za-timeline-transfer-elementor-editor']['type']), 'Elementor transfer uses a classic-safe dynamic-import loader');
    check(str_contains($GLOBALS['mock_scripts']['za-timeline-transfer-elementor-editor']['src'], '/elementor-editor-loader.js'), 'Elementor transfer handle serves classic loader rather than raw ES module');
    check(str_contains($GLOBALS['mock_inline_scripts']['za-timeline-transfer-elementor-editor'][0] ?? '', 'media-placeholder.svg'), 'Elementor receives its destination-local placeholder URL');
    $asset->enqueueGutenbergTransferAssets();
    check(in_array('za-timeline-transfer-gutenberg-editor', $GLOBALS['mock_enqueued_scripts'], true), 'Gutenberg transfer module only enqueued for authorized editor user');
    check(in_array('wp-block-editor', $GLOBALS['mock_scripts']['za-timeline-transfer-gutenberg-editor']['deps'] ?? [], true), 'Gutenberg sidecar uses explicit WordPress dependencies');
    check(!isset($GLOBALS['mock_scripts']['za-timeline-transfer-gutenberg-editor']['type']), 'Gutenberg transfer uses classic-safe bootstrap');
    check(str_contains($GLOBALS['mock_scripts']['za-timeline-transfer-gutenberg-editor']['src'], '/gutenberg-editor-loader.js'), 'Gutenberg uses a classic loader rather than directly enqueued ES module');
    $GLOBALS['mock_user_caps'] = false;
    $GLOBALS['mock_enqueued_scripts'] = [];
    $asset->enqueueGutenbergTransferAssets();
    check(!$GLOBALS['mock_enqueued_scripts'], 'Unauthorized user cannot enqueue Gutenberg transfer editor');
    $GLOBALS['mock_user_caps'] = true;
    $GLOBALS['mock_enqueued_scripts'] = [];

    check(($GLOBALS['mock_scripts']['za-timeline-elementor']['deps'] ?? []) === ['za-elementor-media-preview'], 'Elementor adapter has media-preview dependency');
    check(str_contains($GLOBALS['mock_scripts']['za-timeline-elementor']['src'], '/elementor-loader.js'), 'Elementor frontend handle serves classic-safe loader');
    check(!isset($GLOBALS['mock_scripts']['za-timeline-elementor']['type']), 'Elementor widget script needs no module tag from Elementor');
    $asset->enqueueElementorEditorAssets();
    check(count(array_filter($GLOBALS['mock_enqueued_scripts'], fn($name) => $name === 'za-elementor-media-preview')) === 1, 'Elementor editor enqueues the pre-registered preview only once');
    // Elementor overwrites WP_Scripts with a new registry during editor init.
    // Reproduce that loss before its after_enqueue_scripts hook executes.
    $GLOBALS['mock_scripts'] = [];
    $GLOBALS['mock_styles'] = [];
    $GLOBALS['mock_inline_scripts'] = [];
    $GLOBALS['mock_enqueued_scripts'] = [];
    $asset->enqueueElementorEditorAssets();
    check(isset($GLOBALS['mock_scripts']['za-timeline-transfer-elementor-editor']), 'Elementor editor restores transfer registration after WordPress scripts registry reset');
    check(in_array('za-timeline-transfer-elementor-editor', $GLOBALS['mock_enqueued_scripts'], true), 'Elementor transfer module is actually enqueued after registry reset');
    check(!isset($GLOBALS['mock_scripts']['za-timeline-transfer-elementor-editor']['type']), 'Re-registered Elementor transfer stays classic-safe');
    check(isset($GLOBALS['mock_inline_scripts']['za-timeline-transfer-elementor-editor']), 'Re-registered Elementor transfer includes local placeholder config');
    check(isset($GLOBALS['mock_styles']['timeline-core-style']), 'Elementor editor restores the shared style handle after registry reset');
    check(in_array('za-timeline-elementor', $GLOBALS['mock_enqueued_scripts'], true), 'Elementor editor restores and enqueues the Timeline preview adapter');

    check(str_contains($asset->addModuleTypeAttribute('<script src="x"></script>', 'za-timeline-gutenberg','x'), 'type="module"'), 'Module script tag receives module type');
    // Default WordPress output can contain type=text/javascript even when a
    // script was registered as a module. The tag must be forcibly normalized.
    $module_handle = 'za-timeline-gutenberg';
    foreach ( [
        '<script type="text/javascript" id="transfer-js" src="x.js"></script>',
        '<script id="transfer-js" src="x.js" type=\'text/javascript\' nonce="123"></script>',
        '<script id="transfer-js" src="x.js" type="module"></script>',
        '<script id="transfer-js" src="x.js" data-type="legacy"></script>',
    ] as $example ) {
        $rendered = $asset->addModuleTypeAttribute( $example, $module_handle, 'x.js' );
        check( substr_count( $rendered, 'type="module"' ) === 1 && ! str_contains( $rendered, 'type="text/javascript"' ) && ! str_contains( $rendered, "type='text/javascript'" ), 'Native Gutenberg adapter uses exactly one module type' );
        check( str_contains( $rendered, 'id="transfer-js"' ) && str_contains( $rendered, 'src="x.js"' ), 'Gutenberg native module preserves id and src' );
    }
    $classic_transfer = '<script type="text/javascript" src="loader.js"></script>';
    check( $asset->addModuleTypeAttribute( $classic_transfer, 'za-timeline-transfer-gutenberg-editor', 'loader.js' ) === $classic_transfer, 'Gutenberg transfer loader stays classic even with explicit type=text/javascript' );
    foreach ( [ 'za-timeline-transfer-elementor-editor', 'za-timeline-elementor' ] as $handle ) {
        $classic = '<script type="text/javascript" src="loader.js"></script>';
        check( $asset->addModuleTypeAttribute( $classic, $handle, 'loader.js' ) === $classic, 'Elementor loader is never forced to module type: ' . $handle );
    }
    check( $asset->addModuleTypeAttribute('<script type="text/javascript" src="x.js"></script>', 'jquery-core', 'x.js') === '<script type="text/javascript" src="x.js"></script>', 'Module type rewrite leaves third-party scripts unchanged' );

    check($asset->addModuleTypeAttribute('<script src="x"></script>', 'other-script','x') === '<script src="x"></script>', 'Unrelated scripts are not changed');
    $GLOBALS['mock_enqueued_scripts'] = [];
    $GLOBALS['mock_has_timeline_block'] = true;
    $asset->maybeEnqueueFrontendAssets();
    check($GLOBALS['mock_enqueued_scripts'] === ['za-timeline-gutenberg'], 'Gutenberg adapter enqueued only on a page containing timeline');
    $GLOBALS['mock_enqueued_scripts'] = [];
    $GLOBALS['mock_has_timeline_block'] = false;
    $asset->maybeEnqueueFrontendAssets();
    check(!$GLOBALS['mock_enqueued_scripts'], 'Pages without timeline avoid Gutenberg adapter');
    $GLOBALS['mock_has_timeline_block'] = true;
    $GLOBALS['mock_admin'] = true;
    $asset->maybeEnqueueFrontendAssets();
    check(!$GLOBALS['mock_enqueued_scripts'], 'Admin page avoids frontend adapter');
    $GLOBALS['mock_admin'] = false;

    $classic = new \TimelineFullWidget\ClassicEditor\ClassicEditorIntegration();
    $GLOBALS['mock_post_id'] = 0;
    $GLOBALS['mock_is_block_editor'] = true;
    $classic->enqueueClassicAdapterAdmin();
    check(!isset($GLOBALS['mock_scripts']['za-timeline-classic-adapter']), 'New Gutenberg post does not load Classic adapter');
    $GLOBALS['mock_is_block_editor'] = false;
    $classic->enqueueClassicAdapterAdmin();
    check(isset($GLOBALS['mock_scripts']['za-timeline-classic-adapter']), 'Classic post editor loads adapter');
    check(isset($GLOBALS['mock_inline_scripts']['za-timeline-classic-adapter']), 'Classic adapter gets base URL config');
    $GLOBALS['mock_screen']->base = 'dashboard';
    $classic->enqueueClassicAdapterAdmin();
    check(count(array_filter($GLOBALS['mock_enqueued_scripts'], fn($h) => $h === 'za-timeline-classic-adapter')) === 1, 'Dashboard never enqueues Classic adapter');
    $GLOBALS['mock_screen']->base = 'post';

    check(class_exists('TimelineFullWidget\\Elementor\\TimelineWidget'), 'Elementor widget loads against optional Widget_Base');
    $widget = new \TimelineFullWidget\Elementor\TimelineWidget();
    $widget->set_mock_settings([
        'header_tag'=>'a', 'tl_show_marker'=>'yes', 'tl_animation_marker'=>'yes',
        'tl_animation_timeline'=>'yes', 'tl_show_other_side'=>'yes', 'tl_show_step_numbers'=>'yes',
        'tl_content_horizontal_layout'=>'yes', 'shared_reverse_media_content'=>'yes',
        'list'=>[ [
            '_id'=>'good123', 'list_title'=>'<script>alert(1)</script>Safe',
            'list_content'=>'<p>Hello world</p>', 'side_content'=>'<p>2026</p>',
            'media_image'=>['url'=>'https://example.test/image.jpg'],
            'inherit_item_styles'=>'yes', 'item_content_layout'=>'horizontal', 'tl_card_change_direction'=>'yes',
        ] ],
    ]);
    $html = $widget->render_for_test();
    check(str_contains($html,'<div class="tl-title">') && !str_contains($html,'<a class="tl-title"'), 'Unlinked title with a HTML tag renders as div to match JS preview');
    check(!str_contains($html,'<script>') && str_contains($html,'&lt;script&gt;'), 'Elementor title output is escaped');
    check(str_contains($html,'tl-content-horizontal tl-reverse'), 'Item-level Elementor layout is independent of shared visual styles');
    check(str_contains($html,'elementor-repeater-item-good123'), 'Elementor repeater selector class present');
    check(str_contains($html,'timeline-numbers'), 'Numbered marker markup applied');
    $widget->set_mock_settings([
        'header_tag'=>'h3', 'tl_show_marker'=>'yes', 'tl_show_other_side'=>'yes',
        'list'=>[[
            '_id'=>'xyz', 'list_title'=>'Unique', 'list_content'=>'content',
            'inherit_item_styles'=>'', 'li_bg_color'=>'#fff', 'item_title_alignment'=>'center',
            'item_title_color'=>'#f00', 'item_content_color'=>'#333',
            'item_content_layout'=>'vertical', 'tl_card_change_direction'=>'yes',
        ]],
    ]);
    $html = $widget->render_for_test();
    check(str_contains($html,'timeline-item-unique-style'), 'Per-item Elementor style override class present');
    check(!str_contains($html,'tl-content-horizontal') && str_contains($html,'tl-reverse'), 'Unique Elementor layout overrides global layout');
    check(str_contains($html,'text-align:center') && str_contains($html,'background-color:#fff'), 'Unique Elementor style values present');
    $widget->set_mock_settings([
        'header_tag'=>'h3', 'tl_show_marker'=>'yes',
        'list'=>[
            ['_id'=>'one','list_title'=>'Horizontal', 'inherit_item_styles'=>'yes', 'item_content_layout'=>'horizontal', 'tl_card_change_direction'=>'yes'],
            ['_id'=>'two','list_title'=>'Default', 'inherit_item_styles'=>'yes', 'item_content_layout'=>'', 'tl_card_change_direction'=>''],
            ['_id'=>'three','list_title'=>'Reverse only', 'inherit_item_styles'=>'no', 'item_content_layout'=>'', 'tl_card_change_direction'=>'yes'],
        ],
    ]);
    $html = $widget->render_for_test();
    check(substr_count($html, 'tl-content-horizontal') === 1, 'Only explicitly horizontal Elementor item has horizontal content layout');
    check(substr_count($html, 'tl-reverse') === 2, 'Media order is independent of shared item style switch');
    check(str_contains($html, 'elementor-repeater-item-two'), 'Default per-item switches stay disabled');
    $widget->set_mock_settings([
        'header_tag'=>'h3', 'list'=>[[
            '_id'=>'video123', 'list_title'=>'Video', 'media_type'=>'video',
            'media_video'=>['id'=>0,'url'=>''],
            'posterURL'=>['id'=>0,'url'=>'https://receiver.test/media-placeholder.svg'],
        ]],
    ]);
    $html = $widget->render_for_test();
    check(str_contains($html,'timeline-video-placeholder') && str_contains($html,'receiver.test/media-placeholder.svg'), 'Elementor imported video uses local image placeholder without a source video URL');
    check(!str_contains($html,'<video'), 'Elementor video placeholder does not inject an invalid video player');
    $meta = json_decode(file_get_contents($root . '/block.json'), true);
    check($meta['textdomain'] === 'timeline-full-widget', 'Block metadata uses the canonical text domain');
    printf("PASS: %d PHP runtime assertions.\n", $passes);
}
