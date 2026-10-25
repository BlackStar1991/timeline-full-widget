<?php
/** Validate the self-contained WordPress.org Playground demo (no Elementor bundle). */
declare(strict_types=1);
$root = dirname(__DIR__);
$path = $root . '/assets/blueprints/blueprint.json';
$blueprint = json_decode((string) file_get_contents($path), true, 512, JSON_THROW_ON_ERROR);
$errors = [];
$check = static function (bool $test, string $message) use (&$errors): void {
    if (!$test) {$errors[] = $message;}
};
$check(($blueprint['$schema'] ?? '') === 'https://playground.wordpress.net/blueprint-schema.json', 'Blueprint schema missing');
$install = array_values(array_filter($blueprint['steps'] ?? [], static fn($step) => ($step['step'] ?? '') === 'installPlugin'));
$check(count($install) === 1, 'Expected exactly one plugin installation');
$check(($install[0]['pluginData']['resource'] ?? '') === 'wordpress.org/plugins', 'Install from WordPress.org');
$check(($install[0]['pluginData']['slug'] ?? '') === 'timeline-full-widget', 'Wrong plugin slug');
$check(($install[0]['options']['activate'] ?? false) === true, 'Plugin not activated');
$check(!str_contains(json_encode($blueprint, JSON_UNESCAPED_SLASHES), '"resource":"bundled"'), 'Public preview must be self-contained');
$check(!str_contains(strtolower(json_encode($blueprint)), '"slug":"elementor"'), 'Public preview must not install Elementor');
$php = array_filter($blueprint['steps'] ?? [], static fn($step) => ($step['step'] ?? '') === 'runPHP');
$check(count($php) >= 1, 'Missing Gutenberg demo initializer');
$payload = implode("
", array_column($php, 'code'));
$check(str_contains($payload, 'za/timeline-full-widget'), 'Missing Gutenberg Timeline demo');
$check(str_contains($payload, 'wp_insert_post'), 'Demo must create WordPress pages');
if ($errors) {
    foreach ($errors as $error) {fwrite(STDERR, 'FAIL: ' . $error . "
");}
    exit(1);
}
echo "PASS: standalone WordPress.org Playground demo, Gutenberg blocks, no bundled resources or Elementor.
";
