import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

// Bind Pusher to window so Laravel Echo can find it
window.Pusher = Pusher;

export const echo = new Echo({
    broadcaster: 'pusher',
    key: import.meta.env.VITE_PUSHER_APP_KEY || 'parkhub-local',
    cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER || 'mt1',
    wsHost: import.meta.env.VITE_PUSHER_HOST || window.location.hostname,
    wsPort: import.meta.env.VITE_PUSHER_PORT || 6001,
    forceTLS: false, // Set to true if using HTTPS locally or in production
    disableStats: true,
});
