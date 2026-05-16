<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CreditTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class WalletController extends Controller
{
    /**
     * Get current wallet (credits) balance
     */
    public function getBalance(Request $request)
    {
        return response()->json([
            'success' => true,
            'balance' => (int) $request->user()->credits_balance,
        ]);
    }

    /**
     * Get transaction history
     */
    public function getHistory(Request $request)
    {
        $transactions = CreditTransaction::where('user_id', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $transactions->items(),
            'meta' => [
                'current_page' => $transactions->currentPage(),
                'last_page' => $transactions->lastPage(),
                'per_page' => $transactions->perPage(),
                'total' => $transactions->total(),
            ]
        ]);
    }

    /**
     * Add credits manually
     */
    public function addCredits(Request $request)
    {
        $request->validate([
            'amount' => 'required|integer|min:1|max:10000',
        ]);

        $amount = (int) $request->amount;
        $user = $request->user();

        // Use a database transaction to ensure atomicity
        DB::transaction(function () use ($user, $amount) {
            // Lock the user row for update
            $lockedUser = DB::table('users')->where('id', $user->id)->lockForUpdate()->first();

            $newBalance = $lockedUser->credits_balance + $amount;

            // Update balance
            DB::table('users')->where('id', $user->id)->update(['credits_balance' => $newBalance]);

            // Record transaction
            CreditTransaction::create([
                'user_id' => $user->id,
                'type' => 'credit',
                'amount' => $amount,
                'description' => 'Manual account top-up',
            ]);
        });

        return response()->json([
            'success' => true,
            'message' => 'Credits added successfully',
            'new_balance' => $user->fresh()->credits_balance,
        ]);
    }
}
