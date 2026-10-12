import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getAccounts,
  getAccountById,
  createAccountHandler,
  updateAccountHandler,
  getAccountLedger,
  getAccountStatement,
  postAccountTransaction,
  getRecentTransactions,
  reverseTransactionHandler,
  receiveCustomerPayment,
  paySupplier,
  getPayments,
  getReminders,
  createReminder,
  sendReminder,
  getKhataDashboard,
  getOutstandingReport,
  getCollectionsReport,
  getSupplierPaymentsReport,
} from '../controllers/khataController';

const router = Router();

// All khata routes require authentication
router.use(authenticate);

// Dashboard
router.get('/dashboard', getKhataDashboard);

// Accounts
router.get('/accounts', getAccounts);
router.post('/accounts', createAccountHandler);
router.get('/accounts/:id', getAccountById);
router.patch('/accounts/:id', updateAccountHandler);
router.get('/accounts/:id/ledger', getAccountLedger);
router.get('/accounts/:id/statement', getAccountStatement);
router.post('/accounts/:id/transactions', postAccountTransaction);

// Transactions
router.get('/transactions', getRecentTransactions);
router.post('/transactions/:id/reverse', reverseTransactionHandler);

// Payments
router.get('/payments', getPayments);
router.post('/payments/receive', receiveCustomerPayment);
router.post('/payments/pay-supplier', paySupplier);

// Reminders
router.get('/reminders', getReminders);
router.post('/reminders', createReminder);
router.post('/reminders/:id/send', sendReminder);

// Reports
router.get('/reports/outstanding', getOutstandingReport);
router.get('/reports/collections', getCollectionsReport);
router.get('/reports/supplier-payments', getSupplierPaymentsReport);

export default router;
