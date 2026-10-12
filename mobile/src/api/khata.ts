import { apiClient } from './client';

export interface KhataAccount {
  _id: string;
  name: string;
  type: 'CUSTOMER' | 'SUPPLIER' | 'BOTH';
  phone?: string;
  email?: string;
  address?: string;
  businessName?: string;
  gstin?: string;
  openingBalance: number;
  openingBalanceDirection: 'RECEIVABLE' | 'PAYABLE' | 'ZERO';
  creditTermsDays: number;
  currentBalance: number;
  notes?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface KhataTransaction {
  _id: string;
  accountId: string | { _id: string; name: string; phone?: string; type: string; currentBalance?: number };
  transactionType:
    | 'OPENING_BALANCE'
    | 'CREDIT_SALE'
    | 'PAYMENT_RECEIVED'
    | 'SALES_RETURN'
    | 'CREDIT_PURCHASE'
    | 'PAYMENT_MADE'
    | 'PURCHASE_RETURN'
    | 'ADJUSTMENT_DEBIT'
    | 'ADJUSTMENT_CREDIT';
  direction: 'DEBIT' | 'CREDIT';
  amount: number;
  runningBalance: number;
  transactionDate: string;
  dueDate?: string;
  referenceType?: 'Sale' | 'Purchase' | 'SaleReturn' | 'Payment' | 'Manual';
  referenceId?: string;
  invoiceNumber?: string;
  paymentMethod?: string;
  notes?: string;
  status: 'ACTIVE' | 'REVERSED';
  reversalReason?: string;
  createdAt: string;
}

export interface KhataDashboardMetrics {
  totalCustomerReceivables: number;
  totalSupplierPayables: number;
  collectedToday: number;
  paidToSuppliersToday: number;
  customersWithDues: number;
  suppliersAwaitingPayment: number;
  overdueReceivablesCount: number;
  overduePayablesCount: number;
  topCustomers: KhataAccount[];
  topSuppliers: KhataAccount[];
  recentTransactions: KhataTransaction[];
}

export interface KhataReminder {
  _id: string;
  accountId: { _id: string; name: string; phone?: string; currentBalance?: number };
  amountDue: number;
  dueDate: string;
  messageText: string;
  channel: 'WHATSAPP' | 'SMS';
  status: 'PENDING' | 'SENT' | 'CANCELLED';
  relatedInvoice?: string;
  createdAt: string;
}

export const khataApi = {
  getDashboard: async (): Promise<KhataDashboardMetrics> => {
    const res = await apiClient.get('/khata/dashboard');
    return res.data.data;
  },

  getAccounts: async (params?: { type?: string; search?: string; sort?: string }): Promise<KhataAccount[]> => {
    const res = await apiClient.get('/khata/accounts', { params });
    return res.data.data;
  },

  getAccountById: async (
    id: string
  ): Promise<{ account: KhataAccount; metrics: { currentBalance: number; totalCredit: number; totalPayments: number; transactionCount: number; lastTransaction?: KhataTransaction } }> => {
    const res = await apiClient.get(`/khata/accounts/${id}`);
    return res.data.data;
  },

  createAccount: async (data: Partial<KhataAccount>): Promise<KhataAccount> => {
    const res = await apiClient.post('/khata/accounts', data);
    return res.data.data;
  },

  updateAccount: async (id: string, data: Partial<KhataAccount>): Promise<KhataAccount> => {
    const res = await apiClient.patch(`/khata/accounts/${id}`, data);
    return res.data.data;
  },

  getLedger: async (id: string, params?: { startDate?: string; endDate?: string }): Promise<KhataTransaction[]> => {
    const res = await apiClient.get(`/khata/accounts/${id}/ledger`, { params });
    return res.data.data;
  },

  getStatement: async (id: string): Promise<any> => {
    const res = await apiClient.get(`/khata/accounts/${id}/statement`);
    return res.data.data;
  },

  postTransaction: async (accountId: string, data: any): Promise<KhataTransaction> => {
    const res = await apiClient.post(`/khata/accounts/${accountId}/transactions`, data);
    return res.data.data;
  },

  reverseTransaction: async (txId: string, reason: string): Promise<KhataTransaction> => {
    const res = await apiClient.post(`/khata/transactions/${txId}/reverse`, { reason });
    return res.data.data;
  },

  receivePayment: async (data: { accountId: string; amount: number; method: string; referenceNumber?: string; notes?: string }): Promise<any> => {
    const res = await apiClient.post('/khata/payments/receive', data);
    return res.data.data;
  },

  paySupplier: async (data: { accountId: string; amount: number; method: string; referenceNumber?: string; notes?: string }): Promise<any> => {
    const res = await apiClient.post('/khata/payments/pay-supplier', data);
    return res.data.data;
  },

  getReminders: async (): Promise<KhataReminder[]> => {
    const res = await apiClient.get('/khata/reminders');
    return res.data.data;
  },

  createReminder: async (data: any): Promise<KhataReminder> => {
    const res = await apiClient.post('/khata/reminders', data);
    return res.data.data;
  },

  sendReminder: async (id: string): Promise<KhataReminder> => {
    const res = await apiClient.post(`/khata/reminders/${id}/send`);
    return res.data.data;
  },

  getOutstandingReport: async (type?: string): Promise<any> => {
    const res = await apiClient.get('/khata/reports/outstanding', { params: { type } });
    return res.data.data;
  },

  getCollectionsReport: async (params?: { startDate?: string; endDate?: string }): Promise<any> => {
    const res = await apiClient.get('/khata/reports/collections', { params });
    return res.data.data;
  },

  getSupplierPaymentsReport: async (params?: { startDate?: string; endDate?: string }): Promise<any> => {
    const res = await apiClient.get('/khata/reports/supplier-payments', { params });
    return res.data.data;
  },
};
