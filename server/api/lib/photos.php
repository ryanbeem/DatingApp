<?php
declare(strict_types=1);

const PHOTO_MAX_EDGE = 1280;

/**
 * Validates an uploaded image, re-encodes it as JPEG (which also strips
 * EXIF/GPS data and anything that is not pixels) and returns the filename.
 */
function store_uploaded_photo(array $file): string
{
    if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
        $msg = in_array($file['error'] ?? 0, [UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE], true)
            ? 'Photo is too large' : 'Photo upload failed';
        throw new HttpError(422, $msg);
    }
    $maxBytes = (int) (config('max_upload_mb') ?: 10) * 1024 * 1024;
    if ($file['size'] > $maxBytes) {
        throw new HttpError(422, 'Photo is too large');
    }
    $info = @getimagesize($file['tmp_name']);
    if (!$info || !in_array($info[2], [IMAGETYPE_JPEG, IMAGETYPE_PNG, IMAGETYPE_WEBP, IMAGETYPE_GIF], true)) {
        throw new HttpError(422, 'Please upload a JPG, PNG or WebP image');
    }
    $filename = bin2hex(random_bytes(16)) . '.jpg';
    $dest = APP_ROOT . '/uploads/' . $filename;

    if (!function_exists('imagecreatefromstring')) {
        // No GD on this host: keep the original bytes, but only for real JPEGs.
        if ($info[2] !== IMAGETYPE_JPEG || !move_uploaded_file($file['tmp_name'], $dest)) {
            throw new HttpError(500, 'Image processing is not available on this server');
        }
        return $filename;
    }

    $src = imagecreatefromstring((string) file_get_contents($file['tmp_name']));
    if (!$src) {
        throw new HttpError(422, 'Could not read that image');
    }
    $src = apply_exif_orientation($src, $file['tmp_name'], $info[2]);
    save_jpeg_resized($src, $dest);
    return $filename;
}

function apply_exif_orientation(GdImage $img, string $path, int $type): GdImage
{
    if ($type !== IMAGETYPE_JPEG || !function_exists('exif_read_data')) {
        return $img;
    }
    $exif = @exif_read_data($path);
    $angle = [3 => 180, 6 => -90, 8 => 90][$exif['Orientation'] ?? 1] ?? 0;
    return $angle ? (imagerotate($img, $angle, 0) ?: $img) : $img;
}

function save_jpeg_resized(GdImage $src, string $dest): void
{
    $w = imagesx($src);
    $h = imagesy($src);
    $scale = min(1, PHOTO_MAX_EDGE / max($w, $h));
    $nw = (int) round($w * $scale);
    $nh = (int) round($h * $scale);
    $out = imagecreatetruecolor($nw, $nh);
    imagefill($out, 0, 0, imagecolorallocate($out, 255, 255, 255));
    imagecopyresampled($out, $src, 0, 0, 0, 0, $nw, $nh, $w, $h);
    if (!imagejpeg($out, $dest, 85)) {
        throw new HttpError(500, 'Could not save photo, check that uploads/ is writable');
    }
}

function delete_photo_file(string $filename): void
{
    $path = APP_ROOT . '/uploads/' . basename($filename);
    if (is_file($path)) {
        @unlink($path);
    }
}

/** Makes sure the user has exactly one main photo if they have any. */
function ensure_main_photo(int $userId): void
{
    $hasMain = q('SELECT 1 FROM photos WHERE user_id = ? AND is_main = 1', [$userId])->fetchColumn();
    if (!$hasMain) {
        q('UPDATE photos SET is_main = 1 WHERE user_id = ? ORDER BY position, id LIMIT 1', [$userId]);
    }
}
