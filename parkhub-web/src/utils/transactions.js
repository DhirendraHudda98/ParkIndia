// utils/transactions.js
// Simple transaction manager for the digital wallet.
// Uses localStorage for persistence (mock implementation).

const STORAGE_KEY = "wallet_transactions";

// Transaction types
export const TransactionType = {
  ADD: "add",
  DEDUCT: "deduct",
  REFUND: "refund",
};

// Load transactions from storage or initialize empty array
function loadTransactions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Failed to load wallet transactions", e);
    return [];
  }
}

// Persist transactions to storage
function saveTransactions(transactions) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  } catch (e) {
    console.error("Failed to save wallet transactions", e);
  }
}

// Compute current balance from transaction list
export function getBalance() {
  const txs = loadTransactions();
  return txs.reduce((sum, tx) => {
    switch (tx.type) {
      case TransactionType.ADD:
        return sum + tx.amount;
      case TransactionType.DEDUCT:
        return sum - tx.amount;
      case TransactionType.REFUND:
        return sum + tx.amount;
      default:
        return sum;
    }
  }, 0);
}

// Record a new transaction and return updated balance
export function recordTransaction({ type, amount, description }) {
  if (amount <= 0) {
    throw new Error("Amount must be positive");
  }
  const txs = loadTransactions();
  const newTx = {
    id: Date.now().toString() + Math.random().toString(36).substring(2, 8),
    type,
    amount,
    description: description || "",
    date: new Date().toISOString(),
    status: "completed",
  };
  txs.unshift(newTx); // newest first
  saveTransactions(txs);
  return getBalance();
}

export function addCredits(amount, description = "Manual top‑up") {
  return recordTransaction({ type: TransactionType.ADD, amount, description });
}

export function deductCredits(amount, description = "Booking payment") {
  const balance = getBalance();
  if (balance < amount) {
    throw new Error("Insufficient balance");
  }
  return recordTransaction({ type: TransactionType.DEDUCT, amount, description });
}

export function refundCredits(amount, description = "Booking cancellation") {
  return recordTransaction({ type: TransactionType.REFUND, amount, description });
}

export function getTransactionHistory(limit = 10) {
  const txs = loadTransactions();
  return txs.slice(0, limit);
}
