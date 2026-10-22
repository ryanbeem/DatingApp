<?php
declare(strict_types=1);

const EMPLOYMENT_STATUSES = ['employed', 'self_employed', 'between_jobs'];

const SUGGESTED_TRADES = [
    'Mechanic', 'Diesel Mechanic', 'Electrician', 'Plumber', 'HVAC Technician', 'Handyman', 'Carpenter',
    'Welder', 'Lineman', 'Machinist', 'Pipefitter', 'Ironworker', 'Roofer', 'Mason', 'Heavy Equipment Operator',
    'Truck Driver', 'Construction Worker', 'Painter', 'Landscaper', 'Firefighter', 'Farmer / Rancher',
    'Oilfield Worker', 'Millwright', 'Auto Body Technician', 'Appliance Repair', 'Solar Installer',
];

// ---------------------------------------------------------------- auth

function h_register(): array
{
    $in = input();
    $email = strtolower((string) str_field($in, 'email', 190, true));
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        throw new HttpError(422, 'Please enter a valid email');
    }
    $password = (string) ($in['password'] ?? '');
    if (strlen($password) < 8) {
        throw new HttpError(422, 'Password must be at least 8 characters');
    }
    $role = $in['role'] ?? '';
    if (!in_array($role, ['seeker', 'worker'], true)) {
        throw new HttpError(422, 'role must be seeker or worker');
    }
    $firstName = str_field($in, 'first_name', 60, true);
    $birthdate = str_field($in, 'birthdate', 10, true);
    $age = valid_birthdate_age($birthdate);
    if ($age < 18) {
        throw new HttpError(422, 'You must be 18 or older to join');
    }
    if (q('SELECT 1 FROM users WHERE email = ?', [$email])->fetchColumn()) {
        throw new HttpError(409, 'An account with that email already exists');
    }

    db()->beginTransaction();
    q('INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)', [$email, password_hash($password, PASSWORD_DEFAULT), $role]);
    $userId = (int) db()->lastInsertId();
    q('INSERT INTO profiles (user_id, first_name, birthdate) VALUES (?, ?, ?)', [$userId, $firstName, $birthdate]);
    db()->commit();

    return ['token' => issue_token($userId), 'user' => load_profile($userId, $userId)];
}

function h_login(): array
{
    $in = input();
    $email = strtolower(trim((string) ($in['email'] ?? '')));
    $row = q('SELECT id, password_hash, is_banned FROM users WHERE email = ?', [$email])->fetch();
    if (!$row || !password_verify((string) ($in['password'] ?? ''), $row['password_hash'])) {
        usleep(300000);
        throw new HttpError(401, 'Wrong email or password');
    }
    if ($row['is_banned']) {
        throw new HttpError(403, 'This account has been suspended');
    }
    $userId = (int) $row['id'];
    return ['token' => issue_token($userId), 'user' => load_profile($userId, $userId)];
}

function h_logout(): array
{
    $token = request_token();
    if ($token) {
        revoke_token($token);
    }
    return ['ok' => true];
}

function valid_birthdate_age(string $birthdate): int
{
    $d = DateTime::createFromFormat('!Y-m-d', $birthdate);
    if (!$d || $d->format('Y-m-d') !== $birthdate) {
        throw new HttpError(422, 'birthdate must look like 1990-05-31');
    }
    return age_from($birthdate);
}

// ---------------------------------------------------------------- my profile

function h_me(): array
{
    $me = require_user();
    $profile = load_profile($me['id'], $me['id']);
    $profile['email'] = $me['email'];
    return $profile;
}

function h_update_me(): array
{
    $me = require_user();
    $in = input();
    $fields = [];
    $text = ['first_name' => 60, 'city' => 80, 'state' => 40, 'bio' => 2000, 'job_title' => 80, 'employer' => 120, 'looking_for' => 1000];
    foreach ($text as $key => $max) {
        if (array_key_exists($key, $in)) {
            $fields[$key] = str_field($in, $key, $max, $key === 'first_name');
        }
    }
    if (array_key_exists('birthdate', $in)) {
        $birthdate = (string) str_field($in, 'birthdate', 10, true);
        if (valid_birthdate_age($birthdate) < 18) {
            throw new HttpError(422, 'You must be 18 or older');
        }
        $fields['birthdate'] = $birthdate;
    }
    if (array_key_exists('years_experience', $in)) {
        $years = $in['years_experience'];
        $fields['years_experience'] = ($years === null || $years === '') ? null : max(0, min(60, (int) $years));
    }
    if (array_key_exists('is_licensed', $in)) {
        $fields['is_licensed'] = $in['is_licensed'] ? 1 : 0;
    }
    if (array_key_exists('employment_status', $in)) {
        $status = $in['employment_status'] ?: null;
        if ($status !== null && !in_array($status, EMPLOYMENT_STATUSES, true)) {
            throw new HttpError(422, 'Invalid employment_status');
        }
        $fields['employment_status'] = $status;
    }
    if ($fields) {
        $set = implode(', ', array_map(fn ($k) => "$k = ?", array_keys($fields)));
        q("UPDATE profiles SET $set WHERE user_id = ?", [...array_values($fields), $me['id']]);
    }
    if (isset($in['quality_ids']) && is_array($in['quality_ids'])) {
        set_qualities($me['id'], $in['quality_ids']);
    }
    return h_me();
}

function set_qualities(int $userId, array $ids): void
{
    $ids = array_values(array_unique(array_map('intval', $ids)));
    if (count($ids) > 25) {
        throw new HttpError(422, 'Pick up to 25 qualities');
    }
    db()->beginTransaction();
    q('DELETE FROM user_qualities WHERE user_id = ?', [$userId]);
    if ($ids) {
        $marks = implode(',', array_fill(0, count($ids), '?'));
        q("INSERT INTO user_qualities (user_id, quality_id) SELECT ?, id FROM qualities WHERE id IN ($marks)", [$userId, ...$ids]);
    }
    db()->commit();
}

function h_delete_me(): array
{
    $me = require_user();
    $files = q('SELECT filename FROM photos WHERE user_id = ?', [$me['id']])->fetchAll(PDO::FETCH_COLUMN);
    q('DELETE FROM users WHERE id = ?', [$me['id']]);
    foreach ($files as $f) {
        delete_photo_file($f);
    }
    return ['ok' => true];
}

function h_options(): array
{
    return [
        'qualities' => q('SELECT id, name, category FROM qualities ORDER BY sort_order, name')->fetchAll(),
        'trades' => SUGGESTED_TRADES,
        'employment_statuses' => EMPLOYMENT_STATUSES,
    ];
}

// ---------------------------------------------------------------- photos

function h_upload_photo(): array
{
    $me = require_user();
    $count = (int) q('SELECT COUNT(*) FROM photos WHERE user_id = ?', [$me['id']])->fetchColumn();
    $max = (int) (config('max_photos') ?: 6);
    if ($count >= $max) {
        throw new HttpError(422, "You can have up to $max photos");
    }
    if (empty($_FILES['photo'])) {
        throw new HttpError(422, 'Attach an image in the "photo" field');
    }
    $filename = store_uploaded_photo($_FILES['photo']);
    q('INSERT INTO photos (user_id, filename, is_main, position) VALUES (?, ?, ?, ?)', [$me['id'], $filename, $count === 0 ? 1 : 0, $count]);
    return h_me();
}

function owned_photo(int $photoId, int $userId): array
{
    $photo = q('SELECT * FROM photos WHERE id = ? AND user_id = ?', [$photoId, $userId])->fetch();
    if (!$photo) {
        throw new HttpError(404, 'Photo not found');
    }
    return $photo;
}

function h_delete_photo(int $photoId): array
{
    $me = require_user();
    $photo = owned_photo($photoId, $me['id']);
    q('DELETE FROM photos WHERE id = ?', [$photoId]);
    delete_photo_file($photo['filename']);
    ensure_main_photo($me['id']);
    return h_me();
}

function h_set_main_photo(int $photoId): array
{
    $me = require_user();
    owned_photo($photoId, $me['id']);
    q('UPDATE photos SET is_main = (id = ?) WHERE user_id = ?', [$photoId, $me['id']]);
    return h_me();
}

function h_like_photo(int $photoId, bool $like): array
{
    $me = require_user();
    $owner = q('SELECT user_id FROM photos WHERE id = ?', [$photoId])->fetchColumn();
    if (!$owner || is_blocked_between($me['id'], (int) $owner)) {
        throw new HttpError(404, 'Photo not found');
    }
    if ((int) $owner === $me['id']) {
        throw new HttpError(422, "You can't like your own photo");
    }
    if ($like) {
        q('INSERT IGNORE INTO photo_likes (user_id, photo_id) VALUES (?, ?)', [$me['id'], $photoId]);
    } else {
        q('DELETE FROM photo_likes WHERE user_id = ? AND photo_id = ?', [$me['id'], $photoId]);
    }
    $count = (int) q('SELECT COUNT(*) FROM photo_likes WHERE photo_id = ?', [$photoId])->fetchColumn();
    return ['photo_id' => $photoId, 'liked_by_me' => $like, 'like_count' => $count];
}

// ---------------------------------------------------------------- browsing

function load_profile(int $userId, int $viewerId): array
{
    $p = q(
        'SELECT u.id, u.role, u.last_active_at, p.* FROM users u JOIN profiles p ON p.user_id = u.id WHERE u.id = ? AND u.is_banned = 0',
        [$userId]
    )->fetch();
    if (!$p) {
        throw new HttpError(404, 'Profile not found');
    }
    $photos = q(
        'SELECT ph.id, ph.filename, ph.is_main,
                (SELECT COUNT(*) FROM photo_likes l WHERE l.photo_id = ph.id) AS like_count,
                EXISTS(SELECT 1 FROM photo_likes l WHERE l.photo_id = ph.id AND l.user_id = ?) AS liked_by_me
         FROM photos ph WHERE ph.user_id = ? ORDER BY ph.is_main DESC, ph.position, ph.id',
        [$viewerId, $userId]
    )->fetchAll();
    $qualities = q(
        'SELECT q.id, q.name, q.category FROM user_qualities uq JOIN qualities q ON q.id = uq.quality_id
         WHERE uq.user_id = ? ORDER BY q.sort_order',
        [$userId]
    )->fetchAll();

    $profile = [
        'id' => (int) $p['id'],
        'role' => $p['role'],
        'first_name' => $p['first_name'],
        'age' => age_from($p['birthdate']),
        'city' => $p['city'],
        'state' => $p['state'],
        'bio' => $p['bio'],
        'job_title' => $p['job_title'],
        'employer' => $p['employer'],
        'years_experience' => $p['years_experience'] === null ? null : (int) $p['years_experience'],
        'is_licensed' => (bool) $p['is_licensed'],
        'employment_status' => $p['employment_status'],
        'looking_for' => $p['looking_for'],
        'photos' => array_map(fn ($ph) => [
            'id' => (int) $ph['id'],
            'url' => photo_url($ph['filename']),
            'is_main' => (bool) $ph['is_main'],
            'like_count' => (int) $ph['like_count'],
            'liked_by_me' => (bool) $ph['liked_by_me'],
        ], $photos),
        'qualities' => array_map(fn ($qq) => ['id' => (int) $qq['id'], 'name' => $qq['name'], 'category' => $qq['category']], $qualities),
    ];
    if ($userId === $viewerId) {
        $profile['birthdate'] = $p['birthdate'];
    } else {
        $swipe = q('SELECT direction FROM swipes WHERE swiper_id = ? AND target_id = ?', [$viewerId, $userId])->fetchColumn();
        $profile['my_swipe'] = $swipe ?: null;
        $profile['is_match'] = are_matched($viewerId, $userId);
    }
    return $profile;
}

function h_profile(int $userId): array
{
    $me = require_user();
    if ($userId !== $me['id'] && is_blocked_between($me['id'], $userId)) {
        throw new HttpError(404, 'Profile not found');
    }
    return load_profile($userId, $me['id']);
}

function card_select(): string
{
    return 'SELECT u.id, p.first_name, p.birthdate, p.city, p.state, p.job_title, p.years_experience, p.is_licensed,
                   (SELECT ph.filename FROM photos ph WHERE ph.user_id = u.id ORDER BY ph.is_main DESC, ph.position, ph.id LIMIT 1) AS main_photo
            FROM users u JOIN profiles p ON p.user_id = u.id';
}

function format_card(array $r): array
{
    return [
        'id' => (int) $r['id'],
        'first_name' => $r['first_name'],
        'age' => age_from($r['birthdate']),
        'city' => $r['city'],
        'state' => $r['state'],
        'job_title' => $r['job_title'],
        'years_experience' => $r['years_experience'] === null ? null : (int) $r['years_experience'],
        'is_licensed' => (bool) $r['is_licensed'],
        'main_photo_url' => $r['main_photo'] ? photo_url($r['main_photo']) : null,
    ];
}

/** Cards to swipe: the other role, not yet swiped, not blocked either way. */
function h_discover(): array
{
    $me = require_user();
    $otherRole = $me['role'] === 'seeker' ? 'worker' : 'seeker';
    $params = [$otherRole, $me['id'], $me['id'], $me['id'], $me['id']];
    $where = '';
    if (!empty($_GET['job_title'])) {
        $where .= ' AND p.job_title = ?';
        $params[] = (string) $_GET['job_title'];
    }
    if (!empty($_GET['state'])) {
        $where .= ' AND p.state = ?';
        $params[] = (string) $_GET['state'];
    }
    $limit = max(1, min(50, (int) ($_GET['limit'] ?? 20)));
    $rows = q(
        card_select() . "
         WHERE u.role = ? AND u.is_banned = 0 AND u.id <> ?
           AND NOT EXISTS (SELECT 1 FROM swipes s WHERE s.swiper_id = ? AND s.target_id = u.id)
           AND NOT EXISTS (SELECT 1 FROM blocks b WHERE (b.blocker_id = ? AND b.blocked_id = u.id) OR (b.blocker_id = u.id AND b.blocked_id = ?))
           $where
         ORDER BY (EXISTS(SELECT 1 FROM photos ph2 WHERE ph2.user_id = u.id)) DESC, u.last_active_at DESC, u.id DESC
         LIMIT $limit",
        $params
    )->fetchAll();
    return ['cards' => array_map('format_card', $rows)];
}

function h_swipe(): array
{
    $me = require_user();
    $in = input();
    $target = (int) ($in['target_id'] ?? 0);
    $direction = $in['direction'] ?? '';
    if (!in_array($direction, ['like', 'pass'], true)) {
        throw new HttpError(422, 'direction must be like or pass');
    }
    if ($target === $me['id'] || !q('SELECT 1 FROM users WHERE id = ?', [$target])->fetchColumn()) {
        throw new HttpError(404, 'Profile not found');
    }
    q(
        'INSERT INTO swipes (swiper_id, target_id, direction) VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE direction = VALUES(direction), created_at = UTC_TIMESTAMP()',
        [$me['id'], $target, $direction]
    );
    $matched = false;
    if ($direction === 'like' && !is_blocked_between($me['id'], $target)) {
        $theyLiked = q("SELECT 1 FROM swipes WHERE swiper_id = ? AND target_id = ? AND direction = 'like'", [$target, $me['id']])->fetchColumn();
        if ($theyLiked) {
            q('INSERT IGNORE INTO matches (user_a, user_b) VALUES (?, ?)', [min($me['id'], $target), max($me['id'], $target)]);
            $matched = true;
        }
    }
    return ['matched' => $matched];
}

function are_matched(int $a, int $b): bool
{
    return (bool) q('SELECT 1 FROM matches WHERE user_a = ? AND user_b = ?', [min($a, $b), max($a, $b)])->fetchColumn();
}

function h_matches(): array
{
    $me = require_user();
    $rows = q(
        card_select() . '
         JOIN matches m ON (m.user_a = ? AND m.user_b = u.id) OR (m.user_b = ? AND m.user_a = u.id)
         WHERE u.is_banned = 0
           AND NOT EXISTS (SELECT 1 FROM blocks b WHERE (b.blocker_id = ? AND b.blocked_id = u.id) OR (b.blocker_id = u.id AND b.blocked_id = ?))
         ORDER BY m.created_at DESC',
        [$me['id'], $me['id'], $me['id'], $me['id']]
    )->fetchAll();
    return ['matches' => array_map('format_card', $rows)];
}

/** People who liked me (swipe or photo like) that I have not swiped on yet. */
function h_likes_received(): array
{
    $me = require_user();
    $rows = q(
        card_select() . "
         WHERE u.is_banned = 0 AND (
               EXISTS (SELECT 1 FROM swipes s WHERE s.swiper_id = u.id AND s.target_id = ? AND s.direction = 'like')
            OR EXISTS (SELECT 1 FROM photo_likes l JOIN photos ph ON ph.id = l.photo_id WHERE l.user_id = u.id AND ph.user_id = ?))
           AND NOT EXISTS (SELECT 1 FROM swipes s2 WHERE s2.swiper_id = ? AND s2.target_id = u.id)
           AND NOT EXISTS (SELECT 1 FROM blocks b WHERE (b.blocker_id = ? AND b.blocked_id = u.id) OR (b.blocker_id = u.id AND b.blocked_id = ?))
         ORDER BY u.last_active_at DESC LIMIT 100",
        [$me['id'], $me['id'], $me['id'], $me['id'], $me['id']]
    )->fetchAll();
    return ['likes' => array_map('format_card', $rows)];
}

// ---------------------------------------------------------------- messages

function h_conversations(): array
{
    $me = require_user();
    $rows = q(
        'SELECT m.id, m.sender_id, m.recipient_id, m.body, m.created_at, m.read_at, t.partner_id, t.unread
         FROM (
           SELECT IF(sender_id = ?, recipient_id, sender_id) AS partner_id, MAX(id) AS last_id,
                  SUM(recipient_id = ? AND read_at IS NULL) AS unread
           FROM messages WHERE sender_id = ? OR recipient_id = ?
           GROUP BY partner_id
         ) t JOIN messages m ON m.id = t.last_id
         ORDER BY m.id DESC',
        [$me['id'], $me['id'], $me['id'], $me['id']]
    )->fetchAll();

    $out = [];
    foreach ($rows as $r) {
        $partnerId = (int) $r['partner_id'];
        if (is_blocked_between($me['id'], $partnerId)) {
            continue;
        }
        $card = q(card_select() . ' WHERE u.id = ? AND u.is_banned = 0', [$partnerId])->fetch();
        if (!$card) {
            continue;
        }
        $out[] = [
            'partner' => format_card($card),
            'last_message' => format_message($r),
            'unread' => (int) $r['unread'],
        ];
    }
    return ['conversations' => $out];
}

function format_message(array $m): array
{
    return [
        'id' => (int) $m['id'],
        'sender_id' => (int) $m['sender_id'],
        'recipient_id' => (int) $m['recipient_id'],
        'body' => $m['body'],
        'created_at' => str_replace(' ', 'T', $m['created_at']) . 'Z',
        'read_at' => $m['read_at'] ? str_replace(' ', 'T', $m['read_at']) . 'Z' : null,
    ];
}

function h_messages(int $partnerId): array
{
    $me = require_user();
    if (is_blocked_between($me['id'], $partnerId)) {
        throw new HttpError(404, 'Conversation not found');
    }
    $afterId = (int) ($_GET['after_id'] ?? 0);
    $rows = q(
        'SELECT * FROM (
           SELECT * FROM messages
           WHERE ((sender_id = ? AND recipient_id = ?) OR (sender_id = ? AND recipient_id = ?)) AND id > ?
           ORDER BY id DESC LIMIT 200
         ) recent ORDER BY id ASC',
        [$me['id'], $partnerId, $partnerId, $me['id'], $afterId]
    )->fetchAll();
    q('UPDATE messages SET read_at = UTC_TIMESTAMP() WHERE sender_id = ? AND recipient_id = ? AND read_at IS NULL', [$partnerId, $me['id']]);
    return ['messages' => array_map('format_message', $rows)];
}

function h_send_message(int $partnerId): array
{
    $me = require_user();
    $body = str_field(input(), 'body', 2000, true);
    $partnerRole = q('SELECT role FROM users WHERE id = ? AND is_banned = 0', [$partnerId])->fetchColumn();
    if (!$partnerRole || $partnerRole === $me['role'] || is_blocked_between($me['id'], $partnerId)) {
        throw new HttpError(404, 'User not found');
    }
    // Basic flood control: at most 30 messages a minute.
    $recent = (int) q('SELECT COUNT(*) FROM messages WHERE sender_id = ? AND created_at > DATE_SUB(UTC_TIMESTAMP(), INTERVAL 1 MINUTE)', [$me['id']])->fetchColumn();
    if ($recent >= 30) {
        throw new HttpError(429, 'Slow down a little');
    }
    q('INSERT INTO messages (sender_id, recipient_id, body) VALUES (?, ?, ?)', [$me['id'], $partnerId, $body]);
    $row = q('SELECT * FROM messages WHERE id = ?', [(int) db()->lastInsertId()])->fetch();
    return ['message' => format_message($row)];
}

// ---------------------------------------------------------------- safety

function h_block(int $userId): array
{
    $me = require_user();
    if ($userId === $me['id']) {
        throw new HttpError(422, "You can't block yourself");
    }
    q('INSERT IGNORE INTO blocks (blocker_id, blocked_id) SELECT ?, id FROM users WHERE id = ?', [$me['id'], $userId]);
    q('DELETE FROM matches WHERE user_a = ? AND user_b = ?', [min($me['id'], $userId), max($me['id'], $userId)]);
    return ['ok' => true];
}

function h_report(int $userId): array
{
    $me = require_user();
    $reason = str_field(input(), 'reason', 500, true);
    if (!q('SELECT 1 FROM users WHERE id = ?', [$userId])->fetchColumn()) {
        throw new HttpError(404, 'User not found');
    }
    q('INSERT INTO reports (reporter_id, reported_id, reason) VALUES (?, ?, ?)', [$me['id'], $userId, $reason]);
    return ['ok' => true];
}
