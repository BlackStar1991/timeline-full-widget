<?php
/**
 * Development-only PSR-4-style structure check for Timeline Full Widget.
 *
 * Usage: php scripts/check-psr4.php
 *
 * Does not require WordPress, Elementor, Composer, or third-party libraries.
 * It validates static class-to-file mapping and smoke-loads classes that are
 * safe to load without Elementor. It is not a full PHP/WPCS test suite.
 *
 * @package TimelineFullWidget
 */

declare(strict_types=1);

$root     = dirname(__DIR__);
$includes = $root . '/includes';
$prefix   = 'TimelineFullWidget\\';
$errors   = [];
$symbols  = [];
$files    = [];

if (! is_dir($includes)) {
    fwrite(STDERR, "FAIL: Missing includes/ directory.\n");
    exit(1);
}

foreach (new RecursiveIteratorIterator(new RecursiveDirectoryIterator($includes, FilesystemIterator::SKIP_DOTS)) as $entry) {
    if ($entry->isFile() && strtolower($entry->getExtension()) === 'php') {
        $files[] = $entry->getPathname();
    }
}

sort($files, SORT_STRING);

if (! $files) {
    $errors[] = 'No PHP class files found in includes/.';
}

/** Extract namespace and named symbols with native PHP tokenizer. */
function timeline_full_widget_inspect_php_file(string $path): array
{
    $source = file_get_contents($path);
    if ($source === false) {
        throw new RuntimeException('Could not read PHP source file.');
    }

    $tokens = token_get_all($source);
    $namespace = '';
    $declarations = [];
    $tokenCount = count($tokens);
    $kindTokens = [T_CLASS, T_INTERFACE, T_TRAIT];
    if (defined('T_ENUM')) {
        $kindTokens[] = constant('T_ENUM');
    }

    for ($index = 0; $index < $tokenCount; $index++) {
        $token = $tokens[$index];
        if (! is_array($token)) {
            continue;
        }

        if ($token[0] === T_NAMESPACE) {
            $name = '';
            for ($next = $index + 1; $next < $tokenCount; $next++) {
                $part = $tokens[$next];
                if ($part === ';' || $part === '{') {
                    break;
                }
                if (is_array($part) && in_array($part[0], [T_STRING, T_NS_SEPARATOR, defined('T_NAME_QUALIFIED') ? constant('T_NAME_QUALIFIED') : -1], true)) {
                    $name .= $part[1];
                }
            }
            $namespace = trim($name, '\\');
            continue;
        }

        if (! in_array($token[0], $kindTokens, true)) {
            continue;
        }

        $previous = null;
        for ($prior = $index - 1; $prior >= 0; $prior--) {
            if (is_array($tokens[$prior]) && in_array($tokens[$prior][0], [T_WHITESPACE, T_COMMENT, T_DOC_COMMENT], true)) {
                continue;
            }
            $previous = is_array($tokens[$prior]) ? $tokens[$prior][0] : $tokens[$prior];
            break;
        }
        // Ignore anonymous classes and ::class constants.
        if ($token[0] === T_CLASS && in_array($previous, [T_NEW, T_DOUBLE_COLON], true)) {
            continue;
        }

        for ($next = $index + 1; $next < $tokenCount; $next++) {
            $part = $tokens[$next];
            if (is_array($part) && in_array($part[0], [T_WHITESPACE, T_COMMENT, T_DOC_COMMENT], true)) {
                continue;
            }
            if (is_array($part) && $part[0] === T_STRING) {
                $declarations[] = $part[1];
            }
            break;
        }
    }

    return [$namespace, $declarations];
}

foreach ($files as $path) {
    $relative = str_replace('\\', '/', substr($path, strlen($includes) + 1));
    try {
        [$namespace, $declared] = timeline_full_widget_inspect_php_file($path);
    } catch (Throwable $error) {
        $errors[] = $relative . ': ' . $error->getMessage();
        continue;
    }

    if (count($declared) !== 1) {
        $errors[] = sprintf('%s: expected exactly one named class/interface/trait/enum, found %d.', $relative, count($declared));
        continue;
    }

    $fqn = $namespace . '\\' . $declared[0];
    if (strncmp($fqn, $prefix, strlen($prefix)) !== 0) {
        $errors[] = "{$relative}: unexpected namespace {$fqn}. Expected {$prefix} prefix.";
        continue;
    }

    $expected = str_replace('\\', '/', substr($fqn, strlen($prefix))) . '.php';
    if ($relative !== $expected) {
        $errors[] = "{$relative}: {$fqn} must be in includes/{$expected} (case-sensitive).";
    }

    if (isset($symbols[$fqn])) {
        $errors[] = "{$relative}: duplicate {$fqn}; also in {$symbols[$fqn]}.";
    }
    $symbols[$fqn] = $relative;
}

if (! is_file($root . '/timeline-full-widget.php')) {
    $errors[] = 'Missing plugin bootstrap timeline-full-widget.php.';
}
if (! is_file($includes . '/Autoloader.php')) {
    $errors[] = 'Missing includes/Autoloader.php.';
}

if (! $errors) {
    // Load non-Elementor classes without WordPress; do not instantiate them.
    // Elementor's TimelineWidget extends a third-party class unavailable in CLI.
    if (! defined('ABSPATH')) {
        define('ABSPATH', $root . '/');
    }
    if (! defined('TIMELINE_FULL_WIDGET_PATH')) {
        define('TIMELINE_FULL_WIDGET_PATH', $root . '/');
    }
    require_once $includes . '/Autoloader.php';
    \TimelineFullWidget\Autoloader::register();

    foreach ($symbols as $fqn => $relative) {
        if ($fqn === 'TimelineFullWidget\\Elementor\\TimelineWidget') {
            continue;
        }
        try {
            if (! class_exists($fqn, true) && ! interface_exists($fqn, true) && ! trait_exists($fqn, true) && ! (function_exists('enum_exists') && enum_exists($fqn, true))) {
                $errors[] = "{$relative}: {$fqn} failed autoload smoke test.";
            }
        } catch (Throwable $error) {
            $errors[] = "{$relative}: failed autoload: {$error->getMessage()}";
        }
    }
}

if ($errors) {
    foreach ($errors as $error) {
        fwrite(STDERR, "FAIL: {$error}\n");
    }
    exit(1);
}

printf("PASS: %d class files match TimelineFullWidget\\ -> includes/ (case-sensitive); %d smoke-loaded without Elementor.\n", count($files), count($symbols) - (isset($symbols['TimelineFullWidget\\Elementor\\TimelineWidget']) ? 1 : 0));
echo "NOTE: Elementor TimelineWidget verified structurally only; test its runtime in WordPress + Elementor.\n";
