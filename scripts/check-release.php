<?php
/** Standalone distribution/metadata consistency gate. */
declare(strict_types=1);

$root = dirname(__DIR__);
$failures = [];
$plugin = file_get_contents($root . '/timeline-full-widget.php');
$readme = file_get_contents($root . '/readme.txt');
$changelog = file_get_contents($root . '/CHANGELOG.md');
$meta = json_decode((string)file_get_contents($root . '/block.json'), true, 512, JSON_THROW_ON_ERROR);
$pkg = json_decode((string)file_get_contents($root . '/package.json'), true, 512, JSON_THROW_ON_ERROR);
$lock = json_decode((string)file_get_contents($root . '/package-lock.json'), true, 512, JSON_THROW_ON_ERROR);
$version = $pkg['version'];
$expect = static function (bool $test, string $label) use (&$failures): void {
    if (!$test) {$failures[] = $label;}
};
$expect((bool)preg_match('/\* Version:\s*' . preg_quote($version, '/') . '\b/', $plugin), 'Plugin header version mismatch');
$expect(str_contains($plugin, "'TIMELINE_FULL_WIDGET_VERSION', '{$version}'"), 'PHP version constant mismatch');
$expect((bool)preg_match('/^Stable tag:\s*' . preg_quote($version, '/') . '$/m', $readme), 'readme stable tag mismatch');
$expect(str_contains($changelog, '## ' . $version . ' ('), 'Missing changelog version');
$expect($lock['version'] === $version && $lock['packages']['']['version'] === $version, 'package-lock versions mismatch');
$expect($meta['name'] === 'za/timeline-full-widget', 'Persisted parent block name changed');
$expect($meta['textdomain'] === 'timeline-full-widget', 'Incorrect block translation domain');
$expect(str_contains($plugin, 'Text Domain: timeline-full-widget'), 'Incorrect plugin text domain');
$expect(str_contains($readme, 'Requires at least: 5.5'), 'WordPress minimum was changed without review');
foreach (['build/index.js','build/index.asset.php','build/index.css','build/style-index.css',
    'includes/Autoloader.php','includes/Plugin.php','includes/Elementor/TimelineWidget.php',
    'assets/css/core/style.css','assets/js/core/animation.js',
    'assets/js/adapters/elementor-adapter.js','assets/js/adapters/elementor-loader.js','assets/js/adapters/gutenberg-adapter.js',
    'assets/js/adapters/classic-adapter-loader.js','assets/js/adapters/classic-adapters.js',
    'scripts/check-psr4.php','scripts/tests/php-runtime.php','scripts/tests/js-runtime.mjs',
    'scripts/tests/transfer.mjs','scripts/tests/transfer-ui.mjs','scripts/check-blueprint.php','AGENTS.md',
    'assets/images/media-placeholder.svg','assets/js/transfer/transfer-core.js','assets/js/transfer/package.json',
    'assets/js/transfer/elementor-editor.js','assets/js/transfer/elementor-editor-loader.js','assets/js/transfer/gutenberg-editor.js',
    'assets/blueprints/blueprint-bundle.json','assets/blueprints/samples/timeline-gutenberg-demo.tfw.json',
    'assets/blueprints/samples/timeline-elementor-demo.tfw.json'] as $file) {
    $expect(is_file($root . '/' . $file) && filesize($root . '/' . $file) > 0, 'Required file missing/empty: ' . $file);
}
$expect(str_contains(file_get_contents($root . '/build/style-index.css'), '--timeline-line-width'), 'Gutenberg built CSS lacks shared style variables');
$expect(str_contains(file_get_contents($root . '/build/index.js'), 'za/timeline-item'), 'Gutenberg built JS lacks item block');
$expect(str_contains(file_get_contents($root . '/.distignore'), "scripts/"), 'Developer-only scripts not excluded from WordPress.org distribution');
$expect(str_contains(file_get_contents($root . '/.distignore'), "AGENTS.md"), 'Agent instructions not excluded from WordPress.org distribution');
if ($failures) {
    foreach ($failures as $failure) {fwrite(STDERR, "FAIL: {$failure}\n");}
    exit(1);
}
echo "PASS: {$version} version alignment, localization, build artifacts, compatibility, and distribution metadata.\n";
