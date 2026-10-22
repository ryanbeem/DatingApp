<?php
declare(strict_types=1);

const APP_ROOT = __DIR__ . '/..';

class HttpError extends Exception
{
    public int $status;

    public function __construct(int $status, string $message)
    {
        parent::__construct($message);
        $this->status = $status;
    }
}

function config(?string $key = null)
{
    static $config = null;
    if ($config === null) {
        $path = APP_ROOT . '/config.php';
        if (!is_file($path)) {
            throw new HttpError(500, 'Server is not configured: copy config.sample.php to config.php');
        }
        $config = require $path;
    }
    return $key === null ? $config : ($config[$key] ?? null);
}

function db(): PDO
{
    static $pdo = null;
    if ($pdo === null) {
        $dsn = sprintf('mysql:host=%s;dbname=%s;charset=utf8mb4', config('db_host'), config('db_name'));
        $pdo = new PDO($dsn, config('db_user'), config('db_pass'), [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
        $pdo->exec("SET time_zone = '+00:00'");
    }
    return $pdo;
}

function q(string $sql, array $params = []): PDOStatement
{
    $stmt = db()->prepare($sql);
    $stmt->execute($params);
    return $stmt;
}

function json_out($data, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
}

function send_cors(): void
{
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    $allowed = config('cors_origins') ?: [];
    if ($origin !== '' && (in_array('*', $allowed, true) || in_array($origin, $allowed, true))) {
        header('Access-Control-Allow-Origin: ' . $origin);
        header('Vary: Origin');
        header('Access-Control-Allow-Headers: Content-Type, X-Auth-Token');
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Max-Age: 86400');
    }
}

/** JSON body, falling back to form fields (multipart uploads). */
function input(): array
{
    static $data = null;
    if ($data === null) {
        $raw = file_get_contents('php://input');
        $decoded = $raw ? json_decode($raw, true) : null;
        $data = is_array($decoded) ? $decoded : $_POST;
    }
    return $data;
}

function str_field(array $in, string $key, int $max, bool $required = false): ?string
{
    $value = isset($in[$key]) ? trim((string) $in[$key]) : '';
    if ($value === '') {
        if ($required) {
            throw new HttpError(422, "$key is required");
        }
        return null;
    }
    if (mb_strlen($value) > $max) {
        throw new HttpError(422, "$key must be at most $max characters");
    }
    return $value;
}

function photo_url(string $filename): string
{
    return config('base_url') . '/uploads/' . $filename;
}

function age_from(?string $birthdate): ?int
{
    if (!$birthdate) {
        return null;
    }
    return (new DateTime($birthdate))->diff(new DateTime('today'))->y;
}

function is_blocked_between(int $a, int $b): bool
{
    return (bool) q(
        'SELECT 1 FROM blocks WHERE (blocker_id = ? AND blocked_id = ?) OR (blocker_id = ? AND blocked_id = ?)',
        [$a, $b, $b, $a]
    )->fetchColumn();
}
