<?php
declare(strict_types=1);

// Single entry point for the API. Routes are passed as ?r=/path so the API
// works on hosts without mod_rewrite, e.g. index.php?r=/discover

require __DIR__ . '/lib/bootstrap.php';
require __DIR__ . '/lib/auth.php';
require __DIR__ . '/lib/photos.php';
require __DIR__ . '/lib/handlers.php';

$routes = [
    ['GET',    '/health',                fn () => ['ok' => true, 'time' => gmdate('c')]],
    ['GET',    '/options',               'h_options'],
    ['POST',   '/auth/register',         'h_register'],
    ['POST',   '/auth/login',            'h_login'],
    ['POST',   '/auth/logout',           'h_logout'],
    ['GET',    '/me',                    'h_me'],
    ['PUT',    '/me',                    'h_update_me'],
    ['DELETE', '/me',                    'h_delete_me'],
    ['POST',   '/photos',                'h_upload_photo'],
    ['DELETE', '/photos/(\d+)',          'h_delete_photo'],
    ['POST',   '/photos/(\d+)/main',     'h_set_main_photo'],
    ['POST',   '/photos/(\d+)/like',     fn ($id) => h_like_photo($id, true)],
    ['DELETE', '/photos/(\d+)/like',     fn ($id) => h_like_photo($id, false)],
    ['GET',    '/discover',              'h_discover'],
    ['POST',   '/swipes',                'h_swipe'],
    ['GET',    '/matches',               'h_matches'],
    ['GET',    '/likes',                 'h_likes_received'],
    ['GET',    '/profiles/(\d+)',        'h_profile'],
    ['GET',    '/conversations',         'h_conversations'],
    ['GET',    '/messages/(\d+)',        'h_messages'],
    ['POST',   '/messages/(\d+)',        'h_send_message'],
    ['POST',   '/users/(\d+)/block',     'h_block'],
    ['POST',   '/users/(\d+)/report',    'h_report'],
];

try {
    send_cors();
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    if ($method === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
    // Some clients cannot send PUT/DELETE through proxies; allow an override.
    if ($method === 'POST' && !empty($_SERVER['HTTP_X_HTTP_METHOD_OVERRIDE'])) {
        $method = strtoupper($_SERVER['HTTP_X_HTTP_METHOD_OVERRIDE']);
    }
    $path = '/' . trim((string) ($_GET['r'] ?? $_SERVER['PATH_INFO'] ?? '/'), '/');

    $pathMatched = false;
    foreach ($routes as [$routeMethod, $pattern, $handler]) {
        if (!preg_match('#^' . $pattern . '$#', $path, $m)) {
            continue;
        }
        $pathMatched = true;
        if ($routeMethod !== $method) {
            continue;
        }
        $args = array_map('intval', array_slice($m, 1));
        json_out($handler(...$args));
        exit;
    }
    throw new HttpError($pathMatched ? 405 : 404, $pathMatched ? 'Method not allowed' : 'Not found');
} catch (HttpError $e) {
    json_out(['error' => $e->getMessage()], $e->status);
} catch (Throwable $e) {
    if (db_in_transaction()) {
        db()->rollBack();
    }
    error_log('[dating-api] ' . $e);
    json_out(['error' => 'Something went wrong on the server'], 500);
}

function db_in_transaction(): bool
{
    try {
        return db()->inTransaction();
    } catch (Throwable $e) {
        return false;
    }
}
