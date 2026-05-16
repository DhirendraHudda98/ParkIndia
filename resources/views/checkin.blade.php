@extends('layouts.app')

@section('title', 'Check-In - ParkHub')

@section('content')
<div class="container mx-auto px-4 py-8">
    <div class="max-w-4xl mx-auto">
        <div class="bg-white rounded-xl shadow-lg p-6 dark:bg-gray-800">
            <!-- Top Bar with Live Clock -->
            <div class="flex justify-between items-center mb-6 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <div class="flex items-center space-x-4">
                    <div class="text-xl font-semibold text-gray-900 dark:text-white">
                        <span id="live-clock" class="font-mono"></span>
                    </div>
                    <div class="relative">
                        <button id="notification-bell" class="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-5 5v-5z" />
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17H6a2 2 0 01-2-2V6a2 2 0 012-2h12a2 2 0 012 2v9a2 2 0 01-2 2h-1l-5 5v-5z" />
                            </svg>
                            <span class="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500"></span>
                        </button>
                    </div>
                    <button id="help-button" class="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c1.215 0 2.426.34 3.63 1.014a.75.75 0 00.54-.014c.437-.25.857-.55 1.25-.9.393-.35.725-.725.99-1.125.265-.4.49-.825.675-1.275.185-.45.325-.925.425-1.425.1-.5.175-1 .225-1.5.05-.5.075-1 .075-1.5 0-.5-.025-1-.075-1.5-.05-.5-.125-1-.225-1.425-.1-.425-.25-.85-.425-1.275-.175-.425-.393-.825-.675-1.275-.28-.45-.613-.85-.99-1.25-.377-.4-.777-.75-1.2-.975-.423-.225-.873-.375-1.35-.375z" />
                        </svg>
                    </button>
                </div>
            </div>

            <div class="text-center mb-8">
                <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">Check-In</h1>
                <p class="text-gray-600 dark:text-gray-300">Scan your QR code or check in manually</p>
            </div>

            <!-- Check-In Status Panel -->
            <div id="checkin-status" class="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 mb-8">
                <div class="flex items-center justify-between">
                    <div>
                        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">Your Booking Status</h2>
                        <p class="text-gray-600 dark:text-gray-300" id="status-text">Checking for active booking...</p>
                    </div>
                    <div id="status-indicator" class="w-4 h-4 rounded-full bg-gray-400"></div>
                </div>
            </div>

            <!-- No Booking State -->
            <div id="no-booking-state" class="text-center py-12 hidden">
                <div class="text-6xl mb-4">🚗</div>
                <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">No Active Booking</h3>
                <p class="text-gray-600 dark:text-gray-300 mb-6">You don't have any active parking bookings.</p>
                <a href="{{ route('bookings.create') }}" class="btn btn-primary">Book Now</a>
            </div>

            <!-- Booking Found State -->
            <div id="booking-found-state" class="hidden">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div class="bg-white border border-gray-200 rounded-lg p-6 dark:bg-gray-800 dark:border-gray-700">
                        <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-4">Booking Details</h3>
                        <div class="space-y-4">
                            <div class="flex justify-between items-center">
                                <span class="text-gray-600 dark:text-gray-300">Slot Number:</span>
                                <span class="font-semibold" id="slot-number">-</span>
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="text-gray-600 dark:text-gray-300">Location:</span>
                                <span class="font-semibold" id="slot-location">-</span>
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="text-gray-600 dark:text-gray-300">Time:</span>
                                <span class="font-semibold" id="booking-time">-</span>
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="text-gray-600 dark:text-gray-300">Status:</span>
                                <span class="font-semibold" id="booking-status">-</span>
                            </div>
                        </div>
                    </div>

                    <div class="bg-white border border-gray-200 rounded-lg p-6 dark:bg-gray-800 dark:border-gray-700">
                        <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-4">Check-In Options</h3>
                        <div class="space-y-4">
                            <div class="text-center">
                                <div id="qr-code-container" class="mb-4">
                                    <p class="text-gray-600 dark:text-gray-300 mb-2">Scan this QR code at the entrance:</p>
                                    <div id="qr-code-display" class="flex justify-center">
                                        <div class="bg-gray-200 border-2 border-dashed rounded-xl w-48 h-48 flex items-center justify-center text-gray-400">
                                            QR Code will appear here
                                        </div>
                                    </div>
                                </div>
                                <button id="checkin-btn" class="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-700 transition">
                                    Check In Now
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Timer Display -->
            <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 mb-8">
                <div class="flex items-center justify-between">
                    <div>
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Elapsed Time</h3>
                        <p class="text-2xl font-bold text-gray-900 dark:text-white" id="elapsed-time">00:00:00</p>
                    </div>
                    <div>
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Time Remaining</h3>
                        <p class="text-2xl font-bold text-gray-900 dark:text-white" id="time-remaining">--:--:--</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<script>
// Check-In Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const checkinStatus = document.getElementById('checkin-status');
    const noBookingState = document.getElementById('no-booking-state');
    const bookingFoundState = document.getElementById('booking-found-state');
    const statusText = document.getElementById('status-text');
    const statusIndicator = document.getElementById('status-indicator');
    const slotNumber = document.getElementById('slot-number');
    const slotLocation = document.getElementById('slot-location');
    const bookingTime = document.getElementById('booking-time');
    const bookingStatus = document.getElementById('booking-status');
    const checkinBtn = document.getElementById('checkin-btn');
    const elapsedTime = document.getElementById('elapsed-time');
    const timeRemaining = document.getElementById('time-remaining');

    // Check-In functionality
    let checkinInterval;
    let bookingData;

    // Fetch active booking data
    function fetchActiveBooking() {
        fetch('/api/user/active-booking')
            .then(response => response.json())
            .then(data => {
                if (data.success && data.data) {
                    bookingData = data.data;
                    updateBookingFoundState(bookingData);
                } else {
                    showNoBookingState();
                }
            })
            .catch(error => {
                console.error('Error fetching booking data:', error);
                showNoBookingState();
            });
    }

    // Update UI when booking is found
    function updateBookingFoundState(data) {
        // Hide no booking state, show booking found state
        noBookingState.classList.add('hidden');
        bookingFoundState.classList.remove('hidden');

        // Update booking details
        slotNumber.textContent = data.slot_label || 'N/A';
        slotLocation.textContent = data.lot_name || 'N/A';
        bookingTime.textContent = `${new Date(data.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - ${new Date(data.end_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
        bookingStatus.textContent = data.status ? data.status.charAt(0).toUpperCase() + data.status.slice(1) : 'N/A';

        // Update status indicator
        statusIndicator.className = 'w-4 h-4 rounded-full bg-yellow-500';
        statusText.textContent = 'Active booking found';

        // Start timer
        startTimer();
    }

    // Show no booking state
    function showNoBookingState() {
        noBookingState.classList.remove('hidden');
        bookingFoundState.classList.add('hidden');
        statusIndicator.className = 'w-4 h-4 rounded-full bg-red-500';
        statusText.textContent = 'No active booking';
    }

    // Start timer for elapsed time
    function startTimer() {
        if (checkinInterval) clearInterval(checkinInterval);
        
        const startTime = new Date();
        const endTime = new Date(bookingData.end_time);
        
        checkinInterval = setInterval(() => {
            const now = new Date();
            const elapsed = new Date(now - startTime);
            const seconds = elapsed.getSeconds();
            const minutes = elapsed.getMinutes();
            const hours = elapsed.getHours() - 1; // Subtract 1 because Date starts at 1 AM
            
            elapsedTime.textContent = 
                `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            
            // Update time remaining
            const timeRemainingMs = endTime - now;
            if (timeRemainingMs > 0) {
                const remainingSeconds = Math.floor(timeRemainingMs / 1000);
                const remainingMinutes = Math.floor(remainingSeconds / 60);
                const remainingHours = Math.floor(remainingMinutes / 60);
                
                timeRemaining.textContent = 
                    `${remainingHours.toString().padStart(2, '0')}:${(remainingMinutes % 60).toString().padStart(2, '0')}:${(remainingSeconds % 60).toString().padStart(2, '0')}`;
            } else {
                timeRemaining.textContent = '00:00:00';
            }
        }, 1000);
    }

    // Initialize the page
    fetchActiveBooking();

    // Event listener for check-in button
    if (checkinBtn) {
        checkinBtn.addEventListener('click', function() {
            // Disable button and show loading state
            this.disabled = true;
            this.innerHTML = 'Checking in...';
            
            // Make API call to check in
            fetch('/api/bookings/' + bookingData.id + '/check-in', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Update UI to show checked-in state
                    statusIndicator.className = 'w-4 h-4 rounded-full bg-green-500';
                    statusText.textContent = 'Successfully checked in';
                    this.disabled = false;
                    this.innerHTML = 'Check In Now';
                } else {
                    // Handle error
                    this.disabled = false;
                    this.innerHTML = 'Check In Now';
                    alert('Check-in failed: ' + (data.error || 'Unknown error'));
                }
            })
            .catch(error => {
                console.error('Check-in error:', error);
                this.disabled = false;
                this.innerHTML = 'Check In Now';
                alert('Check-in failed: ' + error.message);
            });
        });
    }
    
    // Initialize Laravel Echo for real-time updates
    if (typeof io !== 'undefined') {
        const echo = io('http://localhost:6001');
        
        // Listen for booking updates
        echo.private('bookings')
            .listen('BookingCheckedIn', (data) => {
                console.log('Booking checked in:', data);
                // Update UI to show checked-in state
                statusIndicator.className = 'w-4 h-4 rounded-full bg-green-500';
                statusText.textContent = 'Successfully checked in';
            });
    }
});
</script>
@endsection
