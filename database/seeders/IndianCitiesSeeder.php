<?php

namespace Database\Seeders;

use App\Models\IndianCity;
use Illuminate\Database\Seeder;

class IndianCitiesSeeder extends Seeder
{
    public function run(): void
    {
        $cities = [
            // Metro cities (is_metro = true)
            ['name'=>'Mumbai','state'=>'Maharashtra','state_code'=>'MH','latitude'=>19.0760,'longitude'=>72.8777,'is_metro'=>true,'sort_order'=>1],
            ['name'=>'Delhi','state'=>'Delhi','state_code'=>'DL','latitude'=>28.6139,'longitude'=>77.2090,'is_metro'=>true,'sort_order'=>2],
            ['name'=>'New Delhi','state'=>'Delhi','state_code'=>'DL','latitude'=>28.6129,'longitude'=>77.2295,'is_metro'=>true,'sort_order'=>3],
            ['name'=>'Bengaluru','state'=>'Karnataka','state_code'=>'KA','latitude'=>12.9716,'longitude'=>77.5946,'is_metro'=>true,'sort_order'=>4],
            ['name'=>'Hyderabad','state'=>'Telangana','state_code'=>'TG','latitude'=>17.3850,'longitude'=>78.4867,'is_metro'=>true,'sort_order'=>5],
            ['name'=>'Chennai','state'=>'Tamil Nadu','state_code'=>'TN','latitude'=>13.0827,'longitude'=>80.2707,'is_metro'=>true,'sort_order'=>6],
            ['name'=>'Kolkata','state'=>'West Bengal','state_code'=>'WB','latitude'=>22.5726,'longitude'=>88.3639,'is_metro'=>true,'sort_order'=>7],
            ['name'=>'Pune','state'=>'Maharashtra','state_code'=>'MH','latitude'=>18.5204,'longitude'=>73.8567,'is_metro'=>true,'sort_order'=>8],
            ['name'=>'Ahmedabad','state'=>'Gujarat','state_code'=>'GJ','latitude'=>23.0225,'longitude'=>72.5714,'is_metro'=>true,'sort_order'=>9],
            // Tier 1 & Important Hubs
            ['name'=>'Jalandhar','state'=>'Punjab','state_code'=>'PB','latitude'=>31.3260,'longitude'=>75.5762,'is_metro'=>false,'sort_order'=>10],
            ['name'=>'Jaipur','state'=>'Rajasthan','state_code'=>'RJ','latitude'=>26.9124,'longitude'=>75.7873,'is_metro'=>false,'sort_order'=>11],
            ['name'=>'Surat','state'=>'Gujarat','state_code'=>'GJ','latitude'=>21.1702,'longitude'=>72.8311,'is_metro'=>false,'sort_order'=>12],
            ['name'=>'Lucknow','state'=>'Uttar Pradesh','state_code'=>'UP','latitude'=>26.8467,'longitude'=>80.9462,'is_metro'=>false,'sort_order'=>13],
            ['name'=>'Kanpur','state'=>'Uttar Pradesh','state_code'=>'UP','latitude'=>26.4499,'longitude'=>80.3319,'is_metro'=>false,'sort_order'=>14],
            ['name'=>'Nagpur','state'=>'Maharashtra','state_code'=>'MH','latitude'=>21.1458,'longitude'=>79.0882,'is_metro'=>false,'sort_order'=>15],
            ['name'=>'Indore','state'=>'Madhya Pradesh','state_code'=>'MP','latitude'=>22.7196,'longitude'=>75.8577,'is_metro'=>false,'sort_order'=>16],
            ['name'=>'Thane','state'=>'Maharashtra','state_code'=>'MH','latitude'=>19.2183,'longitude'=>72.9781,'is_metro'=>false,'sort_order'=>17],
            ['name'=>'Bhopal','state'=>'Madhya Pradesh','state_code'=>'MP','latitude'=>23.2599,'longitude'=>77.4126,'is_metro'=>false,'sort_order'=>18],
            ['name'=>'Visakhapatnam','state'=>'Andhra Pradesh','state_code'=>'AP','latitude'=>17.6868,'longitude'=>83.2185,'is_metro'=>false,'sort_order'=>19],
            ['name'=>'Patna','state'=>'Bihar','state_code'=>'BR','latitude'=>25.5941,'longitude'=>85.1376,'is_metro'=>false,'sort_order'=>20],
            ['name'=>'Vadodara','state'=>'Gujarat','state_code'=>'GJ','latitude'=>22.3072,'longitude'=>73.1812,'is_metro'=>false,'sort_order'=>21],
            ['name'=>'Ghaziabad','state'=>'Uttar Pradesh','state_code'=>'UP','latitude'=>28.6692,'longitude'=>77.4538,'is_metro'=>false,'sort_order'=>22],
            ['name'=>'Ludhiana','state'=>'Punjab','state_code'=>'PB','latitude'=>30.9010,'longitude'=>75.8573,'is_metro'=>false,'sort_order'=>23],
            ['name'=>'Agra','state'=>'Uttar Pradesh','state_code'=>'UP','latitude'=>27.1767,'longitude'=>78.0081,'is_metro'=>false,'sort_order'=>24],
            ['name'=>'Nashik','state'=>'Maharashtra','state_code'=>'MH','latitude'=>19.9975,'longitude'=>73.7898,'is_metro'=>false,'sort_order'=>25],
            ['name'=>'Faridabad','state'=>'Haryana','state_code'=>'HR','latitude'=>28.4089,'longitude'=>77.3178,'is_metro'=>false,'sort_order'=>26],
            ['name'=>'Meerut','state'=>'Uttar Pradesh','state_code'=>'UP','latitude'=>28.9845,'longitude'=>77.7064,'is_metro'=>false,'sort_order'=>27],
            ['name'=>'Rajkot','state'=>'Gujarat','state_code'=>'GJ','latitude'=>22.3039,'longitude'=>70.8022,'is_metro'=>false,'sort_order'=>28],
            ['name'=>'Varanasi','state'=>'Uttar Pradesh','state_code'=>'UP','latitude'=>25.3176,'longitude'=>82.9739,'is_metro'=>false,'sort_order'=>29],
            ['name'=>'Amritsar','state'=>'Punjab','state_code'=>'PB','latitude'=>31.6340,'longitude'=>74.8723,'is_metro'=>false,'sort_order'=>30],
            ['name'=>'Chandigarh','state'=>'Chandigarh','state_code'=>'CH','latitude'=>30.7333,'longitude'=>76.7794,'is_metro'=>false,'sort_order'=>31],
            ['name'=>'Gurgaon','state'=>'Haryana','state_code'=>'HR','latitude'=>28.4595,'longitude'=>77.0266,'is_metro'=>false,'sort_order'=>32],
            ['name'=>'Noida','state'=>'Uttar Pradesh','state_code'=>'UP','latitude'=>28.5355,'longitude'=>77.3910,'is_metro'=>false,'sort_order'=>33],
            ['name'=>'Dehradun','state'=>'Uttarakhand','state_code'=>'UK','latitude'=>30.3165,'longitude'=>78.0322,'is_metro'=>false,'sort_order'=>34],
            ['name'=>'Shimla','state'=>'Himachal Pradesh','state_code'=>'HP','latitude'=>31.1048,'longitude'=>77.1734,'is_metro'=>false,'sort_order'=>35],
            ['name'=>'Kochi','state'=>'Kerala','state_code'=>'KL','latitude'=>9.9312,'longitude'=>76.2673,'is_metro'=>false,'sort_order'=>36],
            ['name'=>'Jammu','state'=>'Jammu & Kashmir','state_code'=>'JK','latitude'=>32.7266,'longitude'=>74.8570,'is_metro'=>false,'sort_order'=>37],
            ['name'=>'Coimbatore','state'=>'Tamil Nadu','state_code'=>'TN','latitude'=>11.0168,'longitude'=>76.9558,'is_metro'=>false,'sort_order'=>38],
            ['name'=>'Madurai','state'=>'Tamil Nadu','state_code'=>'TN','latitude'=>9.9252,'longitude'=>78.1198,'is_metro'=>false,'sort_order'=>39],
            ['name'=>'Srinagar','state'=>'Jammu & Kashmir','state_code'=>'JK','latitude'=>34.0837,'longitude'=>74.7973,'is_metro'=>false,'sort_order'=>40],
            ['name'=>'Panaji','state'=>'Goa','state_code'=>'GA','latitude'=>15.4909,'longitude'=>73.8278,'is_metro'=>false,'sort_order'=>41],
            ['name'=>'Dehradun','state'=>'Uttarakhand','state_code'=>'UK','latitude'=>30.3165,'longitude'=>78.0322,'is_metro'=>false,'sort_order'=>42],
            ['name'=>'Ranchi','state'=>'Jharkhand','state_code'=>'JH','latitude'=>23.3441,'longitude'=>85.3096,'is_metro'=>false,'sort_order'=>43],
            ['name'=>'Raipur','state'=>'Chhattisgarh','state_code'=>'CT','latitude'=>21.2514,'longitude'=>81.6296,'is_metro'=>false,'sort_order'=>44],
            ['name'=>'Jabalpur','state'=>'Madhya Pradesh','state_code'=>'MP','latitude'=>23.1667,'longitude'=>79.9333,'is_metro'=>false,'sort_order'=>45],
            ['name'=>'Gwalior','state'=>'Madhya Pradesh','state_code'=>'MP','latitude'=>26.2183,'longitude'=>78.1828,'is_metro'=>false,'sort_order'=>46],
            ['name'=>'Vijayawada','state'=>'Andhra Pradesh','state_code'=>'AP','latitude'=>16.5062,'longitude'=>80.6480,'is_metro'=>false,'sort_order'=>47],
            ['name'=>'Jodhpur','state'=>'Rajasthan','state_code'=>'RJ','latitude'=>26.2389,'longitude'=>73.0243,'is_metro'=>false,'sort_order'=>48],
            ['name'=>'Kota','state'=>'Rajasthan','state_code'=>'RJ','latitude'=>25.2138,'longitude'=>75.8648,'is_metro'=>false,'sort_order'=>49],
            ['name'=>'Guwahati','state'=>'Assam','state_code'=>'AS','latitude'=>26.1445,'longitude'=>91.7362,'is_metro'=>false,'sort_order'=>50],
            ['name'=>'Hubli','state'=>'Karnataka','state_code'=>'KA','latitude'=>15.3647,'longitude'=>75.1240,'is_metro'=>false,'sort_order'=>51],
            ['name'=>'Mysore','state'=>'Karnataka','state_code'=>'KA','latitude'=>12.2958,'longitude'=>76.6394,'is_metro'=>false,'sort_order'=>52],
            ['name'=>'Salem','state'=>'Tamil Nadu','state_code'=>'TN','latitude'=>11.6643,'longitude'=>78.1460,'is_metro'=>false,'sort_order'=>53],
            ['name'=>'Tiruchirappalli','state'=>'Tamil Nadu','state_code'=>'TN','latitude'=>10.7905,'longitude'=>78.7047,'is_metro'=>false,'sort_order'=>54],
            ['name'=>'Warangal','state'=>'Telangana','state_code'=>'TG','latitude'=>17.9689,'longitude'=>79.5941,'is_metro'=>false,'sort_order'=>55],
            ['name'=>'Bhubaneswar','state'=>'Odisha','state_code'=>'OR','latitude'=>20.2961,'longitude'=>85.8245,'is_metro'=>false,'sort_order'=>56],
            ['name'=>'Cuttack','state'=>'Odisha','state_code'=>'OR','latitude'=>20.4625,'longitude'=>85.8830,'is_metro'=>false,'sort_order'=>57],
            ['name'=>'Aurangabad','state'=>'Maharashtra','state_code'=>'MH','latitude'=>19.8762,'longitude'=>75.3433,'is_metro'=>false,'sort_order'=>58],
            ['name'=>'Solapur','state'=>'Maharashtra','state_code'=>'MH','latitude'=>17.6599,'longitude'=>75.9064,'is_metro'=>false,'sort_order'=>59],
            ['name'=>'Amravati','state'=>'Maharashtra','state_code'=>'MH','latitude'=>20.9320,'longitude'=>77.7523,'is_metro'=>false,'sort_order'=>60],
        ];

        foreach ($cities as $city) {
            \DB::table('indian_cities')->updateOrInsert(
                ['name' => $city['name'], 'state_code' => $city['state_code']],
                array_merge($city, ['created_at' => now(), 'updated_at' => now()])
            );
        }

        $this->command->info('✅  IndianCitiesSeeder: '.count($cities).' cities seeded.');
    }
}
