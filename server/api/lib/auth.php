<?php
declare(strict_types=1);

// Tokens travel in the X-Auth-Token header rather than Authorization,
// because some shared hosts (Apache + CGI/FastCGI) strip Authorization.

function issue_token(int $userId): string
{
    $token = bin2hex(random_bytes(32));
    $days = (int) (config('session_days') ?: 90);
    q(
        'INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, DATE_ADD(UTC_TIMESTAMP(), INTERVAL ? DAY))',
        [hash('sha256', $token), $userId, $days]
    );
    return $token;
}

function request_token(): ?string
{
    $token = $_SERVER['HTTP_X_AUTH_TOKEN'] ?? '';
    if ($token === '' && isset($_SERVER['HTTP_AUTHORIZATION']) && stripos($_SERVER['HTTP_AUTHORIZATION'], 'Bearer ') === 0) {
        $token = substr($_SERVER['HTTP_AUTHORIZATION'], 7);
    }
    return $token !== '' ? $token : null;
}

/** Returns the signed-in user row or throws 401. */
function require_user(): array
{
    static $user = null;
    if ($user !== null) {
        return $user;
    }
    $token = request_token();
    if (!$token) {
        throw new HttpError(401, 'Not signed in');
    }
    $row = q(
        'SELECT u.id, u.email, u.role, u.is_banned FROM sessions s JOIN users u ON u.id = s.user_id
         WHERE s.token_hash = ? AND s.expires_at > UTC_TIMESTAMP()',
        [hash('sha256', $token)]
    )->fetch();
    if (!$row) {
        throw new HttpError(401, 'Session expired, please sign in again');
    }
    if ($row['is_banned']) {
        throw new HttpError(403, 'This account has been suspended');
    }
    q('UPDATE users SET last_active_at = UTC_TIMESTAMP() WHERE id = ?', [$row['id']]);
    $row['id'] = (int) $row['id'];
    return $user = $row;
}

function revoke_token(string $token): void
{
    q('DELETE FROM sessions WHERE token_hash = ?', [hash('sha256', $token)]);
}
