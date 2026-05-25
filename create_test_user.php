<?php
require __DIR__.'/vendor/autoload.php';
$app = require __DIR__.'/bootstrap/app.php';

use App\Models\User;

$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$user = User::updateOrCreate(
    ['email' => 'admin@parkhub.test'],
    [
        'name' => 'Test Administrator',
        'username' => 'testadmin',
        'password' => \Hash::make('password123'),
        'role' => 'admin',
        'is_active' => true,
    ]
);

echo "User created/updated: " . $user->email . " with password: password123\n";
