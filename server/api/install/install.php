<?php
declare(strict_types=1);

// Creates the tables and, optionally, demo profiles for testing.
//
// Browser: https://dating.formoreoptions.com/api/install/install.php?key=YOUR_SETUP_KEY&demo=1
// CLI:     php install/install.php --demo
//
// Safe to run more than once. Delete or rename the install folder once you go live.

require __DIR__ . '/../lib/bootstrap.php';
require __DIR__ . '/../lib/photos.php';

$cli = PHP_SAPI === 'cli';
header('Content-Type: text/plain; charset=utf-8');

if (!$cli) {
    $key = (string) config('setup_key');
    if ($key === '' || str_starts_with($key, 'CHANGE_ME') || !hash_equals($key, (string) ($_GET['key'] ?? ''))) {
        http_response_code(403);
        exit("Set setup_key in config.php and pass it as ?key=...\n");
    }
}
$withDemo = $cli ? in_array('--demo', $argv, true) : !empty($_GET['demo']);
$removeDemo = $cli ? in_array('--remove-demo', $argv, true) : !empty($_GET['remove_demo']);

$sql = (string) file_get_contents(__DIR__ . '/schema.sql');
foreach (array_filter(array_map('trim', preg_split('/;\s*$/m', $sql))) as $statement) {
    db()->exec($statement);
}
echo "Tables ready.\n";

if ($removeDemo) {
    $files = q('SELECT ph.filename FROM photos ph JOIN users u ON u.id = ph.user_id WHERE u.is_demo = 1')->fetchAll(PDO::FETCH_COLUMN);
    foreach ($files as $f) {
        delete_photo_file($f);
    }
    $n = q('DELETE FROM users WHERE is_demo = 1')->rowCount();
    echo "Removed $n demo users.\n";
}

if ($withDemo) {
    require __DIR__ . '/demo_data.php';
    echo seed_demo_users();
}
echo "Done.\n";
