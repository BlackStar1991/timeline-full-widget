<?php
/** Static validation of both Playground entrypoints and portable demo fixtures. */
declare(strict_types=1);
$root = dirname(__DIR__);
$basic = json_decode((string)file_get_contents($root . '/assets/blueprints/blueprint.json'), true, 512, JSON_THROW_ON_ERROR);
$bundle = json_decode((string)file_get_contents($root . '/assets/blueprints/blueprint-bundle.json'), true, 512, JSON_THROW_ON_ERROR);
$errors = [];
$check = static function ($test, $message) use (&$errors) { if (!$test) {$errors[] = $message;} };
foreach ([$basic, $bundle] as $blueprint) {
    $check(($blueprint['$schema'] ?? '') === 'https://playground.wordpress.net/blueprint-schema.json', 'Blueprint schema missing');
    $check(($blueprint['preferredVersions']['php'] ?? '') === '8.3', 'Blueprint PHP runtime changed');
    $check(str_contains(json_encode($blueprint, JSON_UNESCAPED_SLASHES), 'za/timeline-full-widget'), 'Blueprint Gutenberg demo block missing');
    $check(count(array_filter($blueprint['steps'] ?? [], static fn($step) => ($step['step'] ?? '') === 'installPlugin')) > 0, 'Blueprint plugin install missing');
}
$check(($basic['steps'][0]['pluginData']['resource'] ?? '') === 'wordpress.org/plugins', 'Published blueprint must use WordPress.org distribution');
$check(($bundle['steps'][1]['pluginData']['resource'] ?? '') === 'bundled', 'Bundle must install the local artifact');
$package = json_decode((string)file_get_contents($root . '/package.json'), true, 512, JSON_THROW_ON_ERROR);
$check(($bundle['steps'][1]['pluginData']['path'] ?? '') === '/timeline-full-widget-' . $package['version'] . '.zip', 'Bundle filename mismatch');
$check(count(array_filter($bundle['steps'], static fn($step) => ($step['step'] ?? '') === 'writeFile')) === 2, 'Both sample imports must be provided');
foreach (['elementor','gutenberg'] as $source) {
    $path = $root . '/assets/blueprints/samples/timeline-' . $source . '-demo.tfw.json';
    $file = json_decode((string)file_get_contents($path), true, 512, JSON_THROW_ON_ERROR);
    $check(($file['format'] ?? '') === 'timeline-full-widget', "{$source}: invalid transfer format");
    $check(($file['schemaVersion'] ?? 0) === 1 && ($file['origin'] ?? '') === $source, "{$source}: invalid schema/origin");
    $check(($file['mediaPolicy'] ?? '') === 'placeholder-only', "{$source}: privacy contract invalid");
    $check(!str_contains(json_encode($file), 'demo.test'), "{$source}: origin media leaked");
}
if ($errors) {
    foreach ($errors as $err) {fwrite(STDERR, 'FAIL: ' . $err . "\n");}
    exit(1);
}
echo "PASS: WP.org blueprint, exact-version bundled blueprint, 2 safe cross-site import fixtures.\n";
