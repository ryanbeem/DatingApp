<?php
declare(strict_types=1);

// Demo accounts for testing. All use the password demo1234.
// Photos: see demo_real_photos() below. A generated placeholder fills in when no real photo is available.

const DEMO_PASSWORD = 'demo1234';

const DEMO_WORKERS = [
    ['Jake', 34, 'Mechanic', 'Tulsa', 'OK', 'Main Street Auto', 12, 1, 'Fourteen years turning wrenches. I can keep your car running and still make it to Sunday dinner.', ['Hardworking', 'Can fix cars', 'Owns a truck', 'Dog lover', 'Fishing']],
    ['Marcus', 41, 'Electrician', 'Dallas', 'TX', 'IBEW Local 20', 18, 1, 'Licensed journeyman. Divorced dad of one great kid. Looking for someone to share quiet evenings and road trips with.', ['Reliable', 'Licensed in my trade', 'Union member', 'Has kids', 'Family oriented']],
    ['Cody', 29, 'Plumber', 'Nashville', 'TN', 'Self employed', 7, 1, 'Run my own plumbing outfit. Big on honesty, country music and a good brisket.', ['Honest', 'Owns tools', 'Grill master', 'Country music', 'Debt free']],
    ['Dave', 46, 'Handyman', 'Columbus', 'OH', 'Dave Fixes It LLC', 22, 0, 'If it is broken I can fix it. Homeowner, early riser, and I make a mean pancake.', ['Handy around the house', 'Owns a home', 'Early riser', 'Good cook', 'Patient']],
    ['Luis', 37, 'Welder', 'Phoenix', 'AZ', 'Desert Steel Fabrication', 15, 1, 'Certified welder. Gym in the morning, family BBQ on the weekends.', ['Gym regular', 'Close to my family', 'Hardworking', 'Faith is important', 'Saves money']],
    ['Tyler', 31, 'Lineman', 'Billings', 'MT', 'NorthWestern Energy', 9, 1, 'I keep the lights on. Love the outdoors, hunting season and my two labs.', ['Outdoorsy', 'Hunting', 'Dog lover', 'Steady paycheck', 'Protective']],
    ['Ray', 52, 'HVAC Technician', 'Atlanta', 'GA', 'Peachtree Heating & Air', 25, 1, 'Grown kids, paid off house, ready for the next chapter with the right woman.', ['Owns a home', 'Debt free', 'Romantic', 'Old fashioned', 'Loyal']],
    ['Ben', 27, 'Carpenter', 'Asheville', 'NC', 'Blue Ridge Builders', 6, 0, 'I build cabinets by day and furniture for friends by night. Camping is my therapy.', ['Builds furniture', 'Camping', 'Easygoing', 'Wants kids', 'Non-smoker']],
    ['Hank', 39, 'Heavy Equipment Operator', 'Boise', 'ID', 'Gem State Excavation', 16, 1, 'Run dozers and excavators all week. Weekends are for the lake and the grill.', ['Fishing', 'Grill master', 'Steady paycheck', 'Good sense of humor', 'Sports fan']],
    ['Andre', 33, 'Diesel Mechanic', 'Memphis', 'TN', 'Big Rig Repair', 10, 1, 'Semi trucks are my specialty. Church on Sunday, football on Monday.', ['Faith is important', 'Can fix cars', 'Sports fan', 'Great with kids', 'Reliable']],
    ['Wyatt', 30, 'Roofer', 'Oklahoma City', 'OK', 'Red Dirt Roofing', 8, 0, 'Up on roofs all day, down to earth the rest of the time. Looking for my fishing buddy for life.', ['Hardworking', 'Fishing', 'Good sense of humor', 'Owns a truck', 'Wants kids']],
    ['Derek', 44, 'Pipefitter', 'Houston', 'TX', 'UA Local 211', 20, 1, 'Refinery pipefitter, two teenage boys, and a smoker that runs every Saturday.', ['Union member', 'Has kids', 'Grill master', 'Steady paycheck', 'Protective']],
    ['Sam', 36, 'Truck Driver', 'Joplin', 'MO', 'Regional routes, home every night', 14, 1, 'CDL driver on regional routes so I am home every night. Love classic rock and old trucks.', ['Reliable', 'Loyal', 'Easygoing', 'Saves money', 'Dog lover']],
    ['Mike', 48, 'Machinist', 'Wichita', 'KS', 'Prairie Precision', 24, 0, 'CNC machinist. I measure twice and cut once, in life too. Widower ready to love again.', ['Patient', 'Honest', 'Owns a home', 'Homebody', 'Faith is important']],
    ['Jesse', 28, 'Ironworker', 'Pittsburgh', 'PA', 'Ironworkers Local 3', 5, 1, 'I build bridges and skyscrapers. Gym rat with a soft spot for rescue dogs.', ['Gym regular', 'Dog lover', 'Union member', 'Romantic', 'Non-smoker']],
    ['Travis', 35, 'Farmer / Rancher', 'Amarillo', 'TX', 'Family cattle ranch', 18, 0, 'Fourth generation rancher. Sunrises, cattle and a good woman by my side is all I need.', ['Early riser', 'Family oriented', 'Old fashioned', 'Outdoorsy', 'Faith is important']],
    ['Carlos', 32, 'Mason', 'San Antonio', 'TX', 'Alamo Stone & Brick', 11, 0, 'Brick and stone mason. Big family, bigger heart. I cook a mean carne asada.', ['Close to my family', 'Good cook', 'Hardworking', 'Great with kids', 'Social drinker']],
    ['Nate', 40, 'Firefighter', 'Des Moines', 'IA', 'City Fire Dept', 15, 1, 'Firefighter and EMT. Calm in a crisis, goofy at home.', ['Protective', 'Community minded', 'Good sense of humor', 'Gym regular', 'Steady paycheck']],
    ['Brandon', 26, 'Solar Installer', 'Las Vegas', 'NV', 'SunState Solar', 4, 0, 'Putting panels on roofs and saving for my first house. Ambitious and laid back.', ['Saves money', 'Easygoing', 'Outdoorsy', 'Camping', 'Wants kids']],
    ['Greg', 50, 'Millwright', 'Toledo', 'OH', 'Millwrights Local 1090', 27, 1, 'Keep the factory machines humming. Empty nester who loves Harleys and lake weekends.', ['Debt free', 'Owns a home', 'Union member', 'Fishing', 'Loyal']],
    ['Kyle', 33, 'Auto Body Technician', 'Spokane', 'WA', 'Northwest Collision', 9, 1, 'I make wrecked cars look brand new. Hiking, hunting and hot wings.', ['Can fix cars', 'Hunting', 'Outdoorsy', 'Honest', 'Sports fan']],
    ['Eli', 38, 'Landscaper', 'Charlotte', 'NC', 'Green Acres Landscaping', 13, 0, 'Own a landscaping crew of six. I can make any yard beautiful, and I will grow you tomatoes.', ['Hardworking', 'Outdoorsy', 'Good cook', 'Patient', 'Family oriented']],
    ['Shawn', 42, 'Oilfield Worker', 'Midland', 'TX', 'Permian Services', 17, 0, 'Two weeks on, two weeks off, and my off weeks are all yours. Love to travel.', ['Steady paycheck', 'Debt free', 'Romantic', 'Owns a truck', 'Country music']],
    ['Danny', 29, 'Painter', 'Tampa', 'FL', 'Bayside Painting', 7, 0, 'House painter by trade, beach bum by choice. Looking for someone to watch sunsets with.', ['Easygoing', 'Romantic', 'Fishing', 'Social drinker', 'Good sense of humor']],
];

const DEMO_SEEKERS = [
    ['Sarah', 32, 'Nurse', 'Tulsa', 'OK', 'Looking for a hardworking man who shows up and means what he says.', ['Family oriented', 'Dog lover', 'Honest', 'Wants kids']],
    ['Amanda', 38, 'Teacher', 'Dallas', 'TX', 'Single mom, love country drives and a man who can fix the porch swing.', ['Has kids', 'Country music', 'Romantic', 'Faith is important']],
    ['Jessica', 29, 'Dental Hygienist', 'Nashville', 'TN', 'Sweet tea, live music and a man with calloused hands and a kind heart.', ['Country music', 'Wants kids', 'Good cook', 'Loyal']],
    ['Megan', 35, 'Bank Teller', 'Columbus', 'OH', 'Done with guys who will not commit. Looking for a steady, honest partner.', ['Honest', 'Saves money', 'Homebody', 'Cat lover']],
    ['Rachel', 42, 'Office Manager', 'Phoenix', 'AZ', 'Hiking at sunrise, tacos at sunset. Want a man who works hard and laughs easy.', ['Outdoorsy', 'Good sense of humor', 'Has kids', 'Gym regular']],
    ['Brittany', 27, 'Hair Stylist', 'Atlanta', 'GA', 'Small town girl in a big city. Family first, always.', ['Family oriented', 'Faith is important', 'Close to my family', 'Romantic']],
];

const DEMO_COLORS = [[44, 62, 80], [192, 57, 43], [39, 174, 96], [41, 128, 185], [142, 68, 173], [211, 84, 0], [22, 160, 133], [127, 140, 141]];

function demo_photo(string $name, string $caption, int $variant): string
{
    [$r, $g, $b] = DEMO_COLORS[(crc32($name) + $variant) % count(DEMO_COLORS)];
    $w = 800;
    $h = 1000;
    $img = imagecreatetruecolor($w, $h);
    for ($y = 0; $y < $h; $y++) {
        $f = 1 - $y / $h * 0.45;
        $c = imagecolorallocate($img, (int) ($r * $f), (int) ($g * $f), (int) ($b * $f));
        imageline($img, 0, $y, $w, $y, $c);
    }
    // Big initial: draw with the built-in font on a tiny canvas, then scale up.
    $tiny = imagecreatetruecolor(10, 16);
    imagefill($tiny, 0, 0, imagecolorallocatealpha($tiny, 0, 0, 0, 127));
    imagesavealpha($tiny, true);
    imagealphablending($tiny, false);
    imagefilledrectangle($tiny, 0, 0, 10, 16, imagecolorallocatealpha($tiny, 0, 0, 0, 127));
    imagealphablending($tiny, true);
    imagestring($tiny, 5, 1, 0, strtoupper($name[0]), imagecolorallocate($tiny, 255, 255, 255));
    imagealphablending($img, true);
    imagecopyresampled($img, $tiny, 250, 260, 0, 0, 300, 480, 10, 16);
    $label = $variant === 0 ? "$name - $caption" : "$name, photo " . ($variant + 1);
    $white = imagecolorallocate($img, 255, 255, 255);
    imagestring($img, 5, (int) (($w - strlen($label) * 9) / 2), 820, $label, $white);
    imagestring($img, 3, (int) (($w - 12 * 7) / 2), 850, 'DEMO PROFILE', $white);

    $filename = bin2hex(random_bytes(16)) . '.jpg';
    imagejpeg($img, APP_ROOT . '/uploads/' . $filename, 85);
    return $filename;
}

function demo_birthdate(int $age): string
{
    return (new DateTime('today'))->modify("-$age years")->modify('-' . random_int(10, 300) . ' days')->format('Y-m-d');
}

/**
 * Real photos for a demo user, stored in uploads/. Uses your own pictures first:
 * drop files named after the demo user into install/demo_photos/ (jake.jpg,
 * jake-2.jpg, sarah.png ...). Anyone without a file gets a stock portrait from
 * randomuser.me, which is free for testing. Returns [] if neither is available.
 */
function demo_real_photos(string $role, string $first, int $index): array
{
    $files = [];
    $mine = glob(__DIR__ . '/demo_photos/' . strtolower($first) . '{,-*,_*}.{jpg,jpeg,png,webp,JPG,JPEG,PNG,WEBP}', GLOB_BRACE) ?: [];
    sort($mine);
    foreach (array_slice($mine, 0, 4) as $path) {
        $img = @imagecreatefromstring((string) file_get_contents($path));
        if ($img) {
            $files[] = save_demo_image($img);
        }
    }
    if ($files) {
        return $files;
    }
    $folder = $role === 'worker' ? 'men' : 'women';
    $n = ($index * 7 + 3) % 100;
    $bytes = demo_download("https://randomuser.me/api/portraits/$folder/$n.jpg");
    $img = $bytes ? @imagecreatefromstring($bytes) : false;
    return $img ? [save_demo_image($img)] : [];
}

function save_demo_image(GdImage $img): string
{
    $filename = bin2hex(random_bytes(16)) . '.jpg';
    save_jpeg_resized($img, APP_ROOT . '/uploads/' . $filename);
    return $filename;
}

function demo_download(string $url): ?string
{
    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_FOLLOWLOCATION => true, CURLOPT_TIMEOUT => 15, CURLOPT_USERAGENT => 'dating-demo-seed']);
        $body = curl_exec($ch);
        $ok = curl_getinfo($ch, CURLINFO_HTTP_CODE) === 200;
        curl_close($ch);
        return $ok && is_string($body) ? $body : null;
    }
    $body = @file_get_contents($url, false, stream_context_create(['http' => ['timeout' => 15]]));
    return $body === false ? null : $body;
}

function demo_user(string $role, string $first, string $email, array $profile, array $qualities, string $caption, int $photoIndex): int
{
    $existing = q('SELECT id FROM users WHERE email = ?', [$email])->fetchColumn();
    if ($existing) {
        return (int) $existing;
    }
    q('INSERT INTO users (email, password_hash, role, is_demo, last_active_at) VALUES (?, ?, ?, 1, UTC_TIMESTAMP())',
        [$email, password_hash(DEMO_PASSWORD, PASSWORD_DEFAULT), $role]);
    $id = (int) db()->lastInsertId();
    $cols = array_keys($profile);
    q('INSERT INTO profiles (user_id, ' . implode(', ', $cols) . ') VALUES (?' . str_repeat(', ?', count($cols)) . ')', [$id, ...array_values($profile)]);
    $files = demo_real_photos($role, $first, $photoIndex);
    while (count($files) < 2 && function_exists('imagecreatetruecolor')) {
        $files[] = demo_photo($first, $caption, count($files));
    }
    foreach ($files as $i => $filename) {
        q('INSERT INTO photos (user_id, filename, is_main, position) VALUES (?, ?, ?, ?)', [$id, $filename, $i === 0 ? 1 : 0, $i]);
    }
    if ($qualities) {
        $marks = implode(',', array_fill(0, count($qualities), '?'));
        q("INSERT IGNORE INTO user_qualities (user_id, quality_id) SELECT ?, id FROM qualities WHERE name IN ($marks)", [$id, ...$qualities]);
    }
    return $id;
}

function seed_demo_users(): string
{
    $workerIds = [];
    foreach (DEMO_WORKERS as [$first, $age, $job, $city, $state, $employer, $years, $licensed, $bio, $qualities]) {
        $workerIds[] = demo_user('worker', $first, strtolower($first) . '.worker@demo.local', [
            'first_name' => $first, 'birthdate' => demo_birthdate($age), 'city' => $city, 'state' => $state,
            'job_title' => $job, 'employer' => $employer, 'years_experience' => $years, 'is_licensed' => $licensed,
            'employment_status' => $employer === 'Self employed' ? 'self_employed' : 'employed', 'bio' => $bio,
            'looking_for' => 'A kind, loyal partner to build a life with.',
        ], $qualities, $job, count($workerIds));
    }
    $seekerIds = [];
    foreach (DEMO_SEEKERS as [$first, $age, $job, $city, $state, $bio, $qualities]) {
        $seekerIds[] = demo_user('seeker', $first, strtolower($first) . '.seeker@demo.local', [
            'first_name' => $first, 'birthdate' => demo_birthdate($age), 'city' => $city, 'state' => $state,
            'job_title' => $job, 'bio' => $bio, 'looking_for' => 'A steady, hardworking man with a good heart.',
        ], $qualities, $job, count($seekerIds));
    }

    // A few workers already like Sarah, so swiping right on them makes an instant match.
    $sarah = $seekerIds[0];
    foreach (array_slice($workerIds, 0, 4) as $wid) {
        q("INSERT IGNORE INTO swipes (swiper_id, target_id, direction) VALUES (?, ?, 'like')", [$wid, $sarah]);
    }
    // Jake and Sarah are already matched and chatting.
    $jake = $workerIds[0];
    q("INSERT IGNORE INTO swipes (swiper_id, target_id, direction) VALUES (?, ?, 'like')", [$sarah, $jake]);
    q('INSERT IGNORE INTO matches (user_a, user_b) VALUES (?, ?)', [min($sarah, $jake), max($sarah, $jake)]);
    if (!q('SELECT 1 FROM messages WHERE sender_id = ? AND recipient_id = ?', [$jake, $sarah])->fetchColumn()) {
        q('INSERT INTO messages (sender_id, recipient_id, body) VALUES (?, ?, ?)', [$jake, $sarah, 'Hey Sarah! Saw you like dogs too. What kind do you have?']);
    }

    return sprintf(
        "Demo data ready: %d tradesmen, %d women. Password for all: %s\nTry signing in as sarah.seeker@demo.local or jake.worker@demo.local\n",
        count($workerIds), count($seekerIds), DEMO_PASSWORD
    );
}
