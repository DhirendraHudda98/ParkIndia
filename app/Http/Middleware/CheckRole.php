<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next, string $roles): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 401);
        }

        $roleArray = explode('|', $roles);

        if (!$user->hasAnyRole($roleArray)) {
            return response()->json(['success' => false, 'message' => 'Forbidden: Role not authorized'], 403);
        }

        return $next($request);
    }
}
