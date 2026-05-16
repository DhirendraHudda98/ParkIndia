import { useState, useEffect, useCallback } from 'react';
import { getBalance, addCredits, deductCredits, refundCredits, getTransactionHistory } from '../utils/transactions';

/**
 * Hook to manage wallet state and operations.
 * Designed to be reusable across the application.
 */
export function useWallet() {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const refreshWallet = useCallback(() => {
    try {
      setBalance(getBalance());
      setTransactions(getTransactionHistory(50));
      setError(null);
    } catch (err) {
      setError("Failed to load wallet data");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshWallet();
    
    // Listen for storage changes to sync across tabs/components
    const handleStorageChange = (e) => {
      if (e.key === 'wallet_transactions') {
        refreshWallet();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [refreshWallet]);

  /**
   * Top up the wallet balance.
   * In a real app, this would integrate with Razorpay/Stripe/UPI.
   */
  const topUp = useCallback(async (amount, description = "Manual top-up") => {
    setIsLoading(true);
    try {
      // Mock delay for "payment processing"
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const newBalance = addCredits(amount, description);
      setBalance(newBalance);
      setTransactions(getTransactionHistory(50));
      return { success: true, balance: newBalance };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Deduct credits for a booking.
   * Includes balance check logic.
   */
  const payForBooking = useCallback(async (amount, bookingId) => {
    setIsLoading(true);
    try {
      const description = `Booking Payment #${bookingId || 'N/A'}`;
      const newBalance = deductCredits(amount, description);
      setBalance(newBalance);
      setTransactions(getTransactionHistory(50));
      return { success: true, balance: newBalance };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Refund credits to the wallet.
   */
  const refundBooking = useCallback(async (amount, bookingId) => {
    setIsLoading(true);
    try {
      const description = `Refund for Booking #${bookingId || 'N/A'}`;
      const newBalance = refundCredits(amount, description);
      setBalance(newBalance);
      setTransactions(getTransactionHistory(50));
      return { success: true, balance: newBalance };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    balance,
    transactions,
    isLoading,
    error,
    topUp,
    payForBooking,
    refundBooking,
    refreshWallet
  };
}
