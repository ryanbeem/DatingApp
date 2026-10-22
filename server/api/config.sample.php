<?php
// Copy this file to config.php and fill in your values.
// Never commit config.php: it holds your database password.
return [
    // Turbify: find these in your hosting control panel under MySQL Databases.
    'db_host' => 'localhost',
    'db_name' => 'YOUR_DATABASE_NAME',
    'db_user' => 'YOUR_DATABASE_USER',
    'db_pass' => 'YOUR_DATABASE_PASSWORD',

    // Public URL of this api folder, no trailing slash. Used to build photo URLs.
    'base_url' => 'https://dating.formoreoptions.com/api',

    // Long random string. Required to run install/install.php from a browser.
    'setup_key' => 'CHANGE_ME_TO_A_LONG_RANDOM_STRING',

    // Origins allowed to call the API from a browser. Use ['*'] while testing.
    'cors_origins' => ['https://dating.formoreoptions.com', 'http://localhost:8081'],

    'session_days' => 90,
    'max_photos' => 6,
    'max_upload_mb' => 10,
];
