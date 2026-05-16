<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class IndianCity extends Model
{
    protected $table = 'indian_cities';

    protected $fillable = ['name','state','state_code','latitude','longitude','is_metro','sort_order'];

    protected function casts(): array
    {
        return [
            'latitude'  => 'decimal:7',
            'longitude' => 'decimal:7',
            'is_metro'  => 'boolean',
        ];
    }

    public function scopeMetro($query) { return $query->where('is_metro', true); }
    public function scopeByState($query, string $code) { return $query->where('state_code', $code); }
}
