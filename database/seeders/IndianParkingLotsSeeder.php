<?php

namespace Database\Seeders;

use App\Models\Booking;
use App\Models\ParkingLot;
use App\Models\ParkingSlot;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;

/**
 * IndianParkingLotsSeeder
 *
 * Creates 15 realistic parking lots across Mumbai (5), Delhi (5), Bengaluru (5)
 * with Indian addresses, GPS, ₹ pricing, slot counts, and sample active bookings.
 *
 * Run: php artisan db:seed --class=IndianParkingLotsSeeder
 */
class IndianParkingLotsSeeder extends Seeder
{
    private array $lots = [
        // ── MUMBAI (5) ──────────────────────────────────────────────────────
        [
            'name'             => 'Andheri Station Multi-Level Car Park',
            'address'          => 'Andheri Station Road, Andheri West, Mumbai 400058',
            'city'             => 'Mumbai', 'state' => 'Maharashtra', 'pincode' => '400058',
            'latitude'         => 19.1197, 'longitude' => 72.8464,
            'total_slots'      => 350, 'available_spots' => 87,
            'hourly_rate_inr'  => 40.00, 'daily_max_inr' => 200.00, 'status' => 'open',
        ],
        [
            'name'             => 'Bandra Kurla Complex Parking Plaza',
            'address'          => 'G Block, Bandra Kurla Complex, Mumbai 400051',
            'city'             => 'Mumbai', 'state' => 'Maharashtra', 'pincode' => '400051',
            'latitude'         => 19.0636, 'longitude' => 72.8648,
            'total_slots'      => 500, 'available_spots' => 142,
            'hourly_rate_inr'  => 80.00, 'daily_max_inr' => 500.00, 'status' => 'open',
        ],
        [
            'name'             => 'Colaba Causeway Underground Parking',
            'address'          => 'Near Regal Cinema, Colaba Causeway, Mumbai 400001',
            'city'             => 'Mumbai', 'state' => 'Maharashtra', 'pincode' => '400001',
            'latitude'         => 18.9218, 'longitude' => 72.8322,
            'total_slots'      => 200, 'available_spots' => 34,
            'hourly_rate_inr'  => 60.00, 'daily_max_inr' => 350.00, 'status' => 'open',
        ],
        [
            'name'             => 'Lower Parel Phoenix Mills Parking',
            'address'          => 'Phoenix Mills Compound, Lower Parel, Mumbai 400013',
            'city'             => 'Mumbai', 'state' => 'Maharashtra', 'pincode' => '400013',
            'latitude'         => 19.0006, 'longitude' => 72.8304,
            'total_slots'      => 600, 'available_spots' => 220,
            'hourly_rate_inr'  => 50.00, 'daily_max_inr' => 300.00, 'status' => 'open',
        ],
        [
            'name'             => 'Nariman Point MMRDA Parking',
            'address'          => 'Marine Lines, Nariman Point, Mumbai 400021',
            'city'             => 'Mumbai', 'state' => 'Maharashtra', 'pincode' => '400021',
            'latitude'         => 18.9256, 'longitude' => 72.8242,
            'total_slots'      => 180, 'available_spots' => 12,
            'hourly_rate_inr'  => 100.00, 'daily_max_inr' => 600.00, 'status' => 'open',
        ],

        // ── DELHI (5) ───────────────────────────────────────────────────────
        [
            'name'             => 'Connaught Place Multi-Level Parking',
            'address'          => 'Block A, Connaught Place, New Delhi 110001',
            'city'             => 'Delhi', 'state' => 'Delhi', 'pincode' => '110001',
            'latitude'         => 28.6315, 'longitude' => 77.2167,
            'total_slots'      => 400, 'available_spots' => 95,
            'hourly_rate_inr'  => 60.00, 'daily_max_inr' => 350.00, 'status' => 'open',
        ],
        [
            'name'             => 'Saket Select City Walk Parking',
            'address'          => 'A-3, District Centre, Saket, New Delhi 110017',
            'city'             => 'Delhi', 'state' => 'Delhi', 'pincode' => '110017',
            'latitude'         => 28.5244, 'longitude' => 77.2066,
            'total_slots'      => 800, 'available_spots' => 340,
            'hourly_rate_inr'  => 50.00, 'daily_max_inr' => 280.00, 'status' => 'open',
        ],
        [
            'name'             => 'Lajpat Nagar Metro Station Parking',
            'address'          => 'Ring Road, Lajpat Nagar, New Delhi 110024',
            'city'             => 'Delhi', 'state' => 'Delhi', 'pincode' => '110024',
            'latitude'         => 28.5683, 'longitude' => 77.2433,
            'total_slots'      => 250, 'available_spots' => 58,
            'hourly_rate_inr'  => 30.00, 'daily_max_inr' => 160.00, 'status' => 'open',
        ],
        [
            'name'             => 'Rajouri Garden ISBT Bus Stand Parking',
            'address'          => 'ISBT, Rajouri Garden, New Delhi 110027',
            'city'             => 'Delhi', 'state' => 'Delhi', 'pincode' => '110027',
            'latitude'         => 28.6456, 'longitude' => 77.1245,
            'total_slots'      => 300, 'available_spots' => 112,
            'hourly_rate_inr'  => 20.00, 'daily_max_inr' => 100.00, 'status' => 'open',
        ],
        [
            'name'             => 'Karol Bagh Market Parking Complex',
            'address'          => 'Arya Samaj Road, Karol Bagh, New Delhi 110005',
            'city'             => 'Delhi', 'state' => 'Delhi', 'pincode' => '110005',
            'latitude'         => 28.6524, 'longitude' => 77.1902,
            'total_slots'      => 220, 'available_spots' => 45,
            'hourly_rate_inr'  => 40.00, 'daily_max_inr' => 220.00, 'status' => 'open',
        ],

        // ── BENGALURU (5) ───────────────────────────────────────────────────
        [
            'name'             => 'MG Road Brigade Gateway Parking',
            'address'          => '26/1, Dr. Rajkumar Road, MG Road, Bengaluru 560001',
            'city'             => 'Bengaluru', 'state' => 'Karnataka', 'pincode' => '560001',
            'latitude'         => 12.9750, 'longitude' => 77.6057,
            'total_slots'      => 350, 'available_spots' => 120,
            'hourly_rate_inr'  => 70.00, 'daily_max_inr' => 400.00, 'status' => 'open',
        ],
        [
            'name'             => 'Koramangala Forum Mall Parking',
            'address'          => '21, Hosur Main Road, Koramangala, Bengaluru 560095',
            'city'             => 'Bengaluru', 'state' => 'Karnataka', 'pincode' => '560095',
            'latitude'         => 12.9355, 'longitude' => 77.6100,
            'total_slots'      => 450, 'available_spots' => 180,
            'hourly_rate_inr'  => 60.00, 'daily_max_inr' => 350.00, 'status' => 'open',
        ],
        [
            'name'             => 'Indiranagar 100 Feet Road Parking',
            'address'          => '100 Feet Road, HAL 2nd Stage, Indiranagar, Bengaluru 560038',
            'city'             => 'Bengaluru', 'state' => 'Karnataka', 'pincode' => '560038',
            'latitude'         => 12.9784, 'longitude' => 77.6408,
            'total_slots'      => 200, 'available_spots' => 67,
            'hourly_rate_inr'  => 50.00, 'daily_max_inr' => 280.00, 'status' => 'open',
        ],
        [
            'name'             => 'Whitefield IT Park Multi-Level Parking',
            'address'          => 'ITPB Road, Whitefield, Bengaluru 560066',
            'city'             => 'Bengaluru', 'state' => 'Karnataka', 'pincode' => '560066',
            'latitude'         => 12.9770, 'longitude' => 77.7479,
            'total_slots'      => 700, 'available_spots' => 290,
            'hourly_rate_inr'  => 45.00, 'daily_max_inr' => 250.00, 'status' => 'open',
        ],
        [
            'name'             => 'Jayanagar 4th Block Shopping Complex Parking',
            'address'          => '30th Cross, 4th Block, Jayanagar, Bengaluru 560011',
            'city'             => 'Bengaluru', 'state' => 'Karnataka', 'pincode' => '560011',
            'latitude'         => 12.9258, 'longitude' => 77.5833,
            'total_slots'      => 180, 'available_spots' => 55,
            'hourly_rate_inr'  => 35.00, 'daily_max_inr' => 180.00, 'status' => 'open',
        ],
        // ── JALANDHAR (2) ───────────────────────────────────────────────────
        [
            'name'             => 'Jalandhar City Center Parking',
            'address'          => 'GT Road, Near City Center, Jalandhar 144001',
            'city'             => 'Jalandhar', 'state' => 'Punjab', 'pincode' => '144001',
            'latitude'         => 31.3260, 'longitude' => 75.5762,
            'total_slots'      => 150, 'available_spots' => 42,
            'hourly_rate_inr'  => 20.00, 'daily_max_inr' => 120.00, 'status' => 'open',
        ],
        [
            'name'             => 'Model Town Market Parking',
            'address'          => 'Model Town, Jalandhar 144003',
            'city'             => 'Jalandhar', 'state' => 'Punjab', 'pincode' => '144003',
            'latitude'         => 31.3115, 'longitude' => 75.5861,
            'total_slots'      => 100, 'available_spots' => 15,
            'hourly_rate_inr'  => 25.00, 'daily_max_inr' => 150.00, 'status' => 'open',
        ],
        // ── AMRITSAR (2) ───────────────────────────────────────────────────
        [
            'name'             => 'Golden Temple Multi-Level Parking',
            'address'          => 'Near Golden Temple, Amritsar 143006',
            'city'             => 'Amritsar', 'state' => 'Punjab', 'pincode' => '143006',
            'latitude'         => 31.6200, 'longitude' => 74.8765,
            'total_slots'      => 500, 'available_spots' => 120,
            'hourly_rate_inr'  => 30.00, 'daily_max_inr' => 200.00, 'status' => 'open',
        ],
        [
            'name'             => 'Hall Gate Market Parking',
            'address'          => 'Hall Road, Amritsar 143001',
            'city'             => 'Amritsar', 'state' => 'Punjab', 'pincode' => '143001',
            'latitude'         => 31.6360, 'longitude' => 74.8737,
            'total_slots'      => 200, 'available_spots' => 45,
            'hourly_rate_inr'  => 20.00, 'daily_max_inr' => 100.00, 'status' => 'open',
        ],
    ];

    // Sample Indian vehicle plates for demo bookings
    private array $samplePlates = [
        'MH01AB1234','MH12CD5678','MH43EF9012','DL01AB3456',
        'DL9CAB7890','KA01AB2345','KA05CD6789','KA51EF0123',
        'MH14GH4567','DL8CAB8901',
    ];

    public function run(): void
    {
        $this->command->info('🇮🇳  Seeding 15 Indian Parking Lots (Mumbai · Delhi · Bengaluru)...');

        $demoUser = User::firstOrCreate(
            ['email' => 'demo@parkindia.in'],
            [
                'id'       => Str::uuid()->toString(),
                'name'     => 'Arjun Sharma',
                'username' => 'arjun_sharma',
                'password' => Hash::make('demo@123'),
                'role'     => 'user',
                'is_active'=> true,
            ]
        );

        foreach ($this->lots as $i => $data) {
            $lotId = Str::uuid()->toString();

            $lot = ParkingLot::create([
                'id'                        => $lotId,
                'name'                      => $data['name'],
                'address'                   => $data['address'],
                'city'                      => $data['city'],
                'state'                     => $data['state'],
                'pincode'                   => $data['pincode'],
                'latitude'                  => $data['latitude'],
                'longitude'                 => $data['longitude'],
                'total_slots'               => $data['total_slots'],
                'available_slots'           => $data['available_spots'],
                'hourly_rate_inr'           => $data['hourly_rate_inr'],
                'daily_max_inr'             => $data['daily_max_inr'],
                'status'                    => $data['status'],
                'layout'                    => null,
                'availability_last_updated' => now(),
            ]);

            // Create up to 30 demo slots per lot
            $slotCount = min($data['total_slots'], 30);
            $slotIds   = [];
            for ($s = 1; $s <= $slotCount; $s++) {
                $zone   = chr(64 + (int) ceil($s / 10)); // A, B, C...
                $slotId = Str::uuid()->toString();
                ParkingSlot::create([
                    'id'          => $slotId,
                    'lot_id'      => $lotId,
                    'slot_number' => "{$zone}-{$s}",
                    'status'      => $s <= 3 ? 'occupied' : 'available',
                ]);
                $slotIds[] = $slotId;
            }

            // 2–3 active bookings per lot
            $bookingCount = rand(2, 3);
            for ($b = 0; $b < $bookingCount && count($slotIds) > $b; $b++) {
                $start = now()->addHours(rand(0, 24));
                $end   = (clone $start)->addHours(rand(2, 5));
                Booking::create([
                    'id'           => Str::uuid()->toString(),
                    'user_id'      => $demoUser->id,
                    'lot_id'       => $lotId,
                    'slot_id'      => $slotIds[$b],
                    'lot_name'     => $lot->name,
                    'slot_number'  => "A-" . ($b + 1),
                    'vehicle_plate'=> $this->samplePlates[$b % count($this->samplePlates)],
                    'start_time'   => $start,
                    'end_time'     => $end,
                    'status'       => 'confirmed',
                    'booking_type' => 'einmalig',
                    'notes'        => 'ParkIndia demo booking',
                ]);
            }

            $city  = $data['city'];
            $price = number_format($data['hourly_rate_inr'], 0);
            $this->command->line("  ✅  [{$i}] {$data['name']} ({$city}) — {$data['available_spots']}/{$data['total_slots']} spots @ ₹{$price}/hr");
        }

        $this->command->info('');
        $this->command->info('✅  15 lots seeded: 5 Mumbai · 5 Delhi · 5 Bengaluru');
        $this->command->info('   Demo: demo@parkindia.in / demo@123');
    }
}
