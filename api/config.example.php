<?php
// Copy this file to config.php ON THE SERVER and fill it in.
// config.php is never committed to Git (see .gitignore).
return [
    // IONOS MySQL: host, database name, user and password are in the IONOS control panel.
    'dsn' => 'mysql:host=DB_HOST;dbname=DB_NAME;charset=utf8mb4',
    'user' => 'DB_USER',
    'password' => 'DB_PASSWORD',
    // Any long random text. It turns player ids into anonymous hashes.
    'salt' => 'CHANGE-ME-TO-A-LONG-RANDOM-TEXT',

    // For local development instead:
    // 'dsn' => 'sqlite:' . __DIR__ . '/../dev-world.sqlite',
];
